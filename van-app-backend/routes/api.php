<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\TrackerController;
use App\Http\Controllers\TripController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes publiques (pas besoin de token)
|--------------------------------------------------------------------------
*/
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Routes protégées (token Sanctum obligatoire)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    // Trackers (CRUD complet via apiResource)
    Route::apiResource('trackers', TrackerController::class);

    // Trips (CRUD complet via apiResource)
    Route::apiResource('trips', TripController::class);

    // Locations d'un voyage (nested routes)
    Route::get('trips/{trip}/locations', [LocationController::class, 'index']);
    Route::post('trips/{trip}/locations', [LocationController::class, 'store']);

    // Médias d'un voyage (nested routes)
    Route::get('trips/{trip}/medias', [MediaController::class, 'index']);
    Route::post('trips/{trip}/medias', [MediaController::class, 'store']);
});

