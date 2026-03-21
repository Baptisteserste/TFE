<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Tracker;
use App\Models\Trip;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Liste des points d'un voyage (filtrable).
     * GET /api/trips/{trip}/locations?from=...&to=...
     */
    public function index(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $query = Location::query()
            ->where('trip_id', $trip->id)
            ->orderBy('timestamp', 'asc');

        if ($request->filled('from')) {
            $query->where('timestamp', '>=', $request->query('from'));
        }

        if ($request->filled('to')) {
            $query->where('timestamp', '<=', $request->query('to'));
        }

        return response()->json($query->get());
    }

    /**
     * Ingestion de points (single ou batch).
     * POST /api/trips/{trip}/locations
     *
     * Single:
     * { latitude, longitude, speed?, timestamp, source?, tracker_id? }
     *
     * Batch:
     * { points: [ { ... }, { ... } ] }
     */
    public function store(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Batch
        if (is_array($request->input('points'))) {
            $validated = $request->validate([
                'points' => 'required|array|min:1|max:500',
                'points.*.latitude' => 'required|numeric|between:-90,90',
                'points.*.longitude' => 'required|numeric|between:-180,180',
                'points.*.speed' => 'nullable|numeric|min:0',
                'points.*.timestamp' => 'required|date',
                'points.*.source' => 'nullable|in:tracker,mobile',
                'points.*.tracker_id' => 'nullable|integer|exists:trackers,id',
            ]);

            $rows = [];
            $now = now();

            foreach ($validated['points'] as $p) {
                // Si tracker_id fourni, vérifier qu'il appartient au user
                if (!empty($p['tracker_id'])) {
                    $trackerOk = Tracker::query()
                        ->where('id', $p['tracker_id'])
                        ->where('user_id', $request->user()->id)
                        ->exists();

                    if (!$trackerOk) {
                        return response()->json(['message' => 'Invalid tracker_id'], 422);
                    }
                }

                $rows[] = [
                    'trip_id' => $trip->id,
                    'latitude' => $p['latitude'],
                    'longitude' => $p['longitude'],
                    'speed' => isset($p['speed']) ? $p['speed'] : null,
                    'timestamp' => $p['timestamp'],
                    'source' => !empty($p['source']) ? $p['source'] : 'tracker',
                    'tracker_id' => !empty($p['tracker_id']) ? $p['tracker_id'] : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            Location::insert($rows);

            return response()->json(['inserted' => count($rows)], 201);
        }

        // Single
        $data = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'speed' => 'nullable|numeric|min:0',
            'timestamp' => 'required|date',
            'source' => 'nullable|in:tracker,mobile',
            'tracker_id' => 'nullable|integer|exists:trackers,id',
        ]);

        if (!empty($data['tracker_id'])) {
            $trackerOk = Tracker::query()
                ->where('id', $data['tracker_id'])
                ->where('user_id', $request->user()->id)
                ->exists();

            if (!$trackerOk) {
                return response()->json(['message' => 'Invalid tracker_id'], 422);
            }
        }

        $location = new Location($data);
        $location->trip_id = $trip->id;
        $location->save();

        return response()->json($location, 201);
    }
}
