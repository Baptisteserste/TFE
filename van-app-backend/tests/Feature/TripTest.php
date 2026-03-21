<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests du CRUD Trip + endpoints GeoJSON et Stats.
 */
class TripTest extends TestCase
{
    use RefreshDatabase;

    /** Liste uniquement les voyages du user connecté */
    public function test_index_returns_only_user_trips(): void
    {
        $user = User::factory()->create();
        Trip::factory()->count(3)->create(['user_id' => $user->id]);
        Trip::factory()->count(2)->create(); // Voyages d'un autre user

        $response = $this->actingAs($user)->getJson('/api/trips');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    /** Créer un voyage retourne 201 */
    public function test_store_creates_trip(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trips', [
            'title' => 'Roadtrip Alpes 2026',
        ]);

        $response->assertStatus(201)
            ->assertJson(['data' => ['title' => 'Roadtrip Alpes 2026']]);

        $this->assertDatabaseHas('trips', ['title' => 'Roadtrip Alpes 2026']);
    }

    /** Voir un voyage retourne les compteurs locations et medias */
    public function test_show_returns_trip_with_counts(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}");

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'title', 'locations_count', 'medias_count']]);
    }

    /** Un user ne peut pas voir le voyage d'un autre */
    public function test_show_returns_403_for_other_user(): void
    {
        $user = User::factory()->create();
        $otherTrip = Trip::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/trips/{$otherTrip->id}");

        $response->assertStatus(403);
    }

    /** Modifier un voyage */
    public function test_update_modifies_trip(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id, 'title' => 'Ancien titre']);

        $response = $this->actingAs($user)->putJson("/api/trips/{$trip->id}", [
            'title' => 'Nouveau titre',
        ]);

        $response->assertOk()
            ->assertJson(['data' => ['title' => 'Nouveau titre']]);
    }

    /** Supprimer un voyage retourne 204 */
    public function test_destroy_deletes_trip(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/trips/{$trip->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
    }

    /** L'endpoint GeoJSON retourne la structure correcte */
    public function test_geojson_returns_valid_structure(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        Location::factory()->count(5)->create(['trip_id' => $trip->id]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}/geojson");

        $response->assertOk()
            ->assertJsonStructure([
                'type',
                'geometry' => ['type', 'coordinates'],
                'properties' => ['trip_id', 'total_points', 'distance_km'],
            ]);

        $this->assertEquals('Feature', $response->json('type'));
        $this->assertEquals('LineString', $response->json('geometry.type'));
    }

    /** L'endpoint stats retourne les métriques du voyage */
    public function test_stats_returns_trip_metrics(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        Location::factory()->count(10)->create([
            'trip_id' => $trip->id,
            'source'  => 'tracker',
        ]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}/stats");

        $response->assertOk()
            ->assertJsonStructure([
                'total_points',
                'distance_km',
                'duration_hours',
                'avg_speed_kmh',
                'max_speed_kmh',
                'sources' => ['tracker', 'mobile'],
            ]);

        $this->assertEquals(10, $response->json('total_points'));
    }

    /** Stats retourne des valeurs vides si aucun point */
    public function test_stats_returns_zeros_with_no_locations(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}/stats");

        $response->assertOk()
            ->assertJson(['total_points' => 0, 'distance_km' => 0]);
    }
}
