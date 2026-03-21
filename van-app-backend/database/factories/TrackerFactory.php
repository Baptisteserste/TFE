<?php

namespace Database\Factories;

use App\Models\Tracker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour le modèle Tracker.
 * Génère des données de test réalistes pour les boîtiers GPS.
 * L'IMEI est un numéro à 15 chiffres (standard télécom).
 */
class TrackerFactory extends Factory
{
    protected $model = Tracker::class;

    public function definition(): array
    {
        return [
            'imei'    => fake()->unique()->numerify('###############'), // 15 chiffres
            'model'   => fake()->randomElement(['Teltonika FMB920', 'Queclink GV55', 'Coban TK103']),
            'status'  => 'active',
            'user_id' => User::factory(),
        ];
    }
}
