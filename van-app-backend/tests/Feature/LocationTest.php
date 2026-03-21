<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests des endpoints Location (points GPS d'un voyage).
 */
class LocationTest extends TestCase
{
    use RefreshDatabase;

    /** Liste les positions d'un voyage */
    public function test_index_returns_trip_locations(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);
        Location::factory()->count(5)->create(['trip_id' => $trip->id]);

        $response = $this->actingAs($user)->getJson("/api/trips/{$trip->id}/locations");

        $response->assertOk()
            ->assertJsonCount(5, 'data');
    }

    /** Ajouter un seul point GPS */
    public function test_store_single_location(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/trips/{$trip->id}/locations", [
            'latitude'  => 45.764043,
            'longitude' => 4.835659,
            'speed'     => 60,
            'timestamp' => '2026-03-06T10:00:00Z',
            'source'    => 'mobile',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseCount('locations', 1);
    }

    /** Ajouter un batch de points GPS */
    public function test_store_batch_locations(): void
    {
        $user = User::factory()->create();
        $trip = Trip::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/api/trips/{$trip->id}/locations", [
            'points' => [
                ['latitude' => 45.764, 'longitude' => 4.835, 'timestamp' => '2026-03-06T10:00:00Z'],
                ['latitude' => 45.770, 'longitude' => 4.840, 'timestamp' => '2026-03-06T10:05:00Z'],
                ['latitude' => 45.775, 'longitude' => 4.845, 'timestamp' => '2026-03-06T10:10:00Z'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['inserted' => 3]);
    }

    /** Un user ne peut pas voir les locations d'un autre */
    public function test_index_returns_403_for_other_user(): void
    {
        $user = User::factory()->create();
        $otherTrip = Trip::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/trips/{$otherTrip->id}/locations");

        $response->assertStatus(403);
    }
}
