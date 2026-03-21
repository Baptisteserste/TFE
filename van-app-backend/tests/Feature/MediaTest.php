<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests des endpoints Media (photos et notes d'un voyage).
 */
class MediaTest extends TestCase
{
    use RefreshDatabase;

    /** Liste les médias d'un voyage */
    public function test_index_returns_trip_medias(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        Media::factory()->count(3)->create(['trip_id' => $trip->id]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}/medias");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    /** Ajouter une note textuelle géolocalisée */
    public function test_store_creates_text_note(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/trips/{$trip->id}/medias", [
            'type'        => 'note_texte',
            'description' => 'Super spot pour le déjeuner !',
            'latitude'    => 45.764043,
            'longitude'   => 4.835659,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('medias', ['description' => 'Super spot pour le déjeuner !']);
    }

    /** Un user ne peut pas voir les médias d'un autre */
    public function test_index_returns_403_for_other_user(): void
    {
        $user = User::factory()->create();
        $otherTrip = Trip::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/trips/{$otherTrip->id}/medias");

        $response->assertStatus(403);
    }
}
