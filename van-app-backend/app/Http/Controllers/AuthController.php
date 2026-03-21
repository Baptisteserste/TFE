<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * AuthController — Gestion de l'authentification via tokens Sanctum.
 *
 * Ce controller gère l'inscription, la connexion, la déconnexion
 * et la récupération du profil de l'utilisateur connecté.
 * Sanctum génère un token API unique à chaque connexion,
 * que le client (mobile/web) envoie dans le header Authorization.
 */
class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur.
     * POST /api/register
     *
     * Crée le user en base, hash le mot de passe automatiquement
     * grâce au cast 'hashed' du modèle User, puis génère
     * un token Sanctum pour connecter l'utilisateur immédiatement.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'], // hashé automatiquement par le cast
        ]);

        // createToken() génère un token Sanctum personnel
        // 'auth_token' est un nom descriptif stocké en base
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Connexion d'un utilisateur existant.
     * POST /api/login
     *
     * Vérifie les credentials (email + mot de passe) via Auth::attempt().
     * Si les identifiants sont corrects, génère un nouveau token Sanctum.
     * Sinon, retourne une erreur 401.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Auth::attempt() vérifie le mot de passe hashé en base
        if (! Auth::attempt($data)) {
            return response()->json([
                'message' => 'Identifiants invalides.',
            ], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion de l'utilisateur connecté.
     * POST /api/logout (protégé par auth:sanctum)
     *
     * Supprime uniquement le token courant utilisé pour cette requête,
     * ce qui permet à l'utilisateur de rester connecté sur d'autres appareils.
     */
    public function logout(Request $request)
    {
        // currentAccessToken() cible le token utilisé dans cette requête
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnecté avec succès.',
        ]);
    }

    /**
     * Profil de l'utilisateur connecté.
     * GET /api/me (protégé par auth:sanctum)
     *
     * Retourne les informations du user authentifié.
     * Utile pour le frontend au chargement de l'app.
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
