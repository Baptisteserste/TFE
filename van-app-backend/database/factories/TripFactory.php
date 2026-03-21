<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour le modèle Trip.
 * Génère des voyages avec des dates réalistes.
 */
class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'title'      => fake()->randomElement(['Roadtrip Alpes', 'Tour de Bretagne', 'Côte Atlantique', 'Pyrénées Sauvages']),
            'start_date' => now(),
            'end_date'   => null,
            'status'     => 'active',
            'user_id'    => User::factory(),
        ];
    }
}
