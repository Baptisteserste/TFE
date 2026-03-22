<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'VanApp API is running']);
});

Route::get('/migrate-db', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        return response()->json(['message' => 'Base de donnees migree avec succes !', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

Route::get('/db-test', function () {
    return response()->json([
        'connection' => config('database.default'),
        'database' => config('database.connections.' . config('database.default') . '.database'),
        'host' => config('database.connections.' . config('database.default') . '.host'),
    ]);
});

Route::get('/storage-link', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('storage:link');
        return response()->json(['message' => 'Lien symbolique storage cree !', 'output' => \Illuminate\Support\Facades\Artisan::output()]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

