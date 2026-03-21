<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour le modèle Location.
 * Génère des points GPS réalistes situés en France métropolitaine.
 */
class LocationFactory extends Factory
{
    protected $model = Location::class;

    public function definition(): array
    {
        return [
            'latitude'   => fake()->latitude(43.0, 48.5),   // France métropolitaine
            'longitude'  => fake()->longitude(-1.5, 7.5),    // France métropolitaine
            'speed'      => fake()->randomFloat(1, 0, 130),
            'timestamp'  => now(),
            'source'     => 'tracker',
            'trip_id'    => Trip::factory(),
            'tracker_id' => null,
        ];
    }
}
