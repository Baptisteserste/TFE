<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $trips = Trip::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('start_date')
            ->get();

        return response()->json($trips);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string|max:50',
        ]);

        $trip = new Trip($data);
        $trip->user_id = $request->user()->id;

        if (!isset($data['start_date'])) {
            $trip->start_date = now();
        }

        $trip->save();

        return response()->json($trip, 201);
    }

    public function show(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $trip->loadCount(['locations', 'medias']);

        return response()->json($trip);
    }

    public function update(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|nullable|date',
            'end_date' => 'sometimes|nullable|date|after_or_equal:start_date',
            'status' => 'sometimes|nullable|string|max:50',
        ]);

        $trip->fill($data);
        $trip->save();

        return response()->json($trip);
    }

    public function destroy(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $trip->delete();

        return response()->json(null, 204);
    }
}
