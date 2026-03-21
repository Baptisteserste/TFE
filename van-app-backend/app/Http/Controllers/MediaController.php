<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $medias = Media::query()
            ->where('trip_id', $trip->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($medias);
    }

    public function store(Request $request, Trip $trip)
    {
        if ($trip->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'image' => 'nullable|file|image|max:8192',
        ]);

        $media = new Media();
        $media->trip_id = $trip->id;
        $media->type = !empty($data['type']) ? $data['type'] : 'photo';
        $media->description = isset($data['description']) ? $data['description'] : null;
        $media->latitude = $data['latitude'];
        $media->longitude = $data['longitude'];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('medias', 'public');
            $media->image_path = $path;
        }

        $media->save();

        return response()->json($media, 201);
    }
}
