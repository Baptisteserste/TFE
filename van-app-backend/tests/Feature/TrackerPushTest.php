<?php

namespace Tests\Feature;

use App\Models\Tracker;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de l'endpoint IoT TrackerPush (Plan A).
 * Vérifie que le boîtier GPS peut envoyer des positions via son IMEI.
 */
class TrackerPushTest extends TestCase
{
    use RefreshDatabase;

    /** Le boîtier envoie des points et ils sont stockés */
    public function test_push_stores_locations_for_active_trip(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::factory()->create(['user_id' => $user->id, 'imei' => '111222333444555']);
        $trip = Trip::factory()->create(['user_id' => $user->id, 'status' => 'active']);

        $response = $this->postJson('/api/tracker/push', [
            'imei'   => '111222333444555',
            'points' => [
                ['latitude' => 45.764, 'longitude' => 4.835, 'speed' => 60, 'timestamp' => '2026-03-06T10:00:00Z'],
                ['latitude' => 45.770, 'longitude' => 4.840, 'speed' => 55, 'timestamp' => '2026-03-06T10:05:00Z'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson(['inserted' => 2, 'trip_id' => $trip->id]);

        $this->assertDatabaseCount('locations', 2);
    }

    /** IMEI inconnu → 404 */
    public function test_push_fails_with_unknown_imei(): void
    {
        $response = $this->postJson('/api/tracker/push', [
            'imei'   => '999999999999999',
            'points' => [
                ['latitude' => 45.764, 'longitude' => 4.835, 'timestamp' => '2026-03-06T10:00:00Z'],
            ],
        ]);

        $response->assertStatus(404)
            ->assertJson(['message' => 'IMEI inconnu. Ce traceur n\'est pas enregistré.']);
    }

    /** Aucun voyage actif → 404 */
    public function test_push_fails_without_active_trip(): void
    {
        $user = User::factory()->create();
        Tracker::factory()->create(['user_id' => $user->id, 'imei' => '111222333444555']);
        Trip::factory()->create(['user_id' => $user->id, 'status' => 'completed']);

        $response = $this->postJson('/api/tracker/push', [
            'imei'   => '111222333444555',
            'points' => [
                ['latitude' => 45.764, 'longitude' => 4.835, 'timestamp' => '2026-03-06T10:00:00Z'],
            ],
        ]);

        $response->assertStatus(404);
    }

    /** Coordonnées invalides → 422 */
    public function test_push_fails_with_invalid_coordinates(): void
    {
        $user = User::factory()->create();
        Tracker::factory()->create(['user_id' => $user->id, 'imei' => '111222333444555']);

        $response = $this->postJson('/api/tracker/push', [
            'imei'   => '111222333444555',
            'points' => [
                ['latitude' => 999, 'longitude' => 4.835, 'timestamp' => '2026-03-06T10:00:00Z'],
            ],
        ]);

        $response->assertStatus(422);
    }
}
