<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory pour le modèle Media.
 * Génère des médias (photos ou notes textuelles) géolocalisés.
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'type'        => fake()->randomElement(['photo', 'note_texte']),
            'description' => fake()->sentence(),
            'image_path'  => null,
            'latitude'    => fake()->latitude(43.0, 48.5),
            'longitude'   => fake()->longitude(-1.5, 7.5),
            'trip_id'     => Trip::factory(),
        ];
    }
}
