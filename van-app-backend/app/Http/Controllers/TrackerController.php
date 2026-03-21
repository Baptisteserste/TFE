<?php

namespace App\Http\Controllers;

use App\Models\Tracker;
use Illuminate\Http\Request;

/**
 * TrackerController — CRUD pour les boîtiers GPS.
 *
 * Ce controller gère la création, lecture, modification et suppression
 * des trackers GPS associés à l'utilisateur connecté.
 * Chaque action vérifie que le tracker appartient bien au user (sécurité).
 * Le pattern est identique à TripController pour la cohérence du projet.
 */
class TrackerController extends Controller
{
    /**
     * Liste des trackers de l'utilisateur connecté.
     * GET /api/trackers
     *
     * Filtre automatiquement par user_id pour ne retourner
     * que les boîtiers appartenant au user authentifié.
     */
    public function index(Request $request)
    {
        $trackers = Tracker::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($trackers);
    }

    /**
     * Ajout d'un nouveau tracker.
     * POST /api/trackers
     *
     * L'IMEI est le numéro de série unique du boîtier GPS.
     * Il est validé comme unique en base pour éviter les doublons.
     * Le user_id est assigné automatiquement (jamais envoyé par le client).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'imei'   => 'required|string|unique:trackers,imei',
            'model'  => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
        ]);

        $tracker = new Tracker($data);
        $tracker->user_id = $request->user()->id;
        $tracker->save();

        return response()->json($tracker, 201);
    }

    /**
     * Détail d'un tracker.
     * GET /api/trackers/{tracker}
     *
     * Utilise le Route Model Binding de Laravel : le paramètre {tracker}
     * est automatiquement converti en instance du modèle Tracker.
     * On vérifie ensuite que le tracker appartient au user connecté.
     */
    public function show(Request $request, Tracker $tracker)
    {
        if ($tracker->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($tracker);
    }

    /**
     * Modification d'un tracker existant.
     * PUT /api/trackers/{tracker}
     *
     * 'sometimes' signifie : valider le champ seulement s'il est présent.
     * Cela permet de faire un update partiel (PATCH-like) sans envoyer
     * tous les champs à chaque fois.
     */
    public function update(Request $request, Tracker $tracker)
    {
        if ($tracker->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'imei'   => 'sometimes|required|string|unique:trackers,imei,' . $tracker->id,
            'model'  => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|nullable|string|max:50',
        ]);

        $tracker->fill($data);
        $tracker->save();

        return response()->json($tracker);
    }

    /**
     * Suppression d'un tracker.
     * DELETE /api/trackers/{tracker}
     *
     * Retourne 204 (No Content) = standard REST pour les suppressions réussies.
     * Les locations liées au tracker auront leur tracker_id mis à NULL
     * grâce au onDelete('set null') défini dans la migration.
     */
    public function destroy(Request $request, Tracker $tracker)
    {
        if ($tracker->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tracker->delete();

        return response()->json(null, 204);
    }
}
