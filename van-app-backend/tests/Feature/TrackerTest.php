<?php

namespace Tests\Feature;

use App\Models\Tracker;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests du CRUD Tracker (boîtiers GPS).
 */
class TrackerTest extends TestCase
{
    use RefreshDatabase;

    /** Liste uniquement les trackers du user connecté */
    public function test_index_returns_only_user_trackers(): void
    {
        $user = User::factory()->create();
        Tracker::factory()->count(2)->create(['user_id' => $user->id]);
        Tracker::factory()->create(); // Tracker d'un autre user

        $response = $this->actingAs($user)->getJson('/api/trackers');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    /** Créer un tracker avec un IMEI unique */
    public function test_store_creates_tracker(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'imei'  => '123456789012345',
            'model' => 'Teltonika FMB920',
        ]);

        $response->assertStatus(201)
            ->assertJson(['data' => ['imei' => '123456789012345']]);
    }

    /** L'IMEI doit être unique */
    public function test_store_fails_with_duplicate_imei(): void
    {
        $user = User::factory()->create();
        Tracker::factory()->create(['imei' => '123456789012345']);

        $response = $this->actingAs($user)->postJson('/api/trackers', [
            'imei' => '123456789012345',
        ]);

        $response->assertStatus(422);
    }

    /** Un user ne peut pas voir le tracker d'un autre */
    public function test_show_returns_403_for_other_user(): void
    {
        $user = User::factory()->create();
        $otherTracker = Tracker::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/trackers/{$otherTracker->id}");

        $response->assertStatus(403);
    }

    /** Supprimer un tracker retourne 204 */
    public function test_destroy_deletes_tracker(): void
    {
        $user = User::factory()->create();
        $tracker = Tracker::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson("/api/trackers/{$tracker->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('trackers', ['id' => $tracker->id]);
    }
}
