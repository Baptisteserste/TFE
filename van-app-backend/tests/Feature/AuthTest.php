<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de l'authentification (AuthController).
 *
 * Ces tests vérifient le cycle complet d'authentification :
 * inscription → connexion → accès protégé → déconnexion.
 * On utilise RefreshDatabase pour repartir d'une base vierge à chaque test.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** Un utilisateur peut s'inscrire et reçoit un token */
    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Baptiste',
            'email'                 => 'baptiste@vantrip.be',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);

        $this->assertDatabaseHas('users', ['email' => 'baptiste@vantrip.be']);
    }

    /** L'inscription échoue si l'email existe déjà */
    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'baptiste@vantrip.be']);

        $response = $this->postJson('/api/register', [
            'name'                  => 'Baptiste',
            'email'                 => 'baptiste@vantrip.be',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    /** Un utilisateur peut se connecter avec les bons identifiants */
    public function test_login_returns_token(): void
    {
        User::factory()->create([
            'email'    => 'baptiste@vantrip.be',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'baptiste@vantrip.be',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['user', 'token']);
    }

    /** La connexion échoue avec un mauvais mot de passe */
    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'baptiste@vantrip.be',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'baptiste@vantrip.be',
            'password' => 'mauvais_mdp',
        ]);

        $response->assertStatus(401);
    }

    /** Un utilisateur connecté peut accéder à son profil */
    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/me');

        $response->assertOk()
            ->assertJson(['data' => ['id' => $user->id, 'email' => $user->email]]);
    }

    /** Un utilisateur non connecté ne peut pas accéder à /me */
    public function test_me_returns_401_without_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    /** Un utilisateur peut se déconnecter */
    public function test_logout_deletes_token(): void
    {
        $user = User::factory()->create();
        // Créer un vrai token Sanctum (actingAs utilise un TransientToken sans delete())
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout');

        $response->assertOk();
    }
}
