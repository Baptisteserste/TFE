<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trackers', function (Blueprint $table) {
            $table->id();

            // Le numéro de série unique du boîtier GPS
            $table->string('imei')->unique();

            // Le modèle du boîtier (optionnel)
            $table->string('model')->nullable();

            // L'état du boîtier (actif, inactif, perdu...)
            $table->string('status')->default('active');

            // La clé étrangère qui relie le boîtier à son propriétaire
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->timestamps(); // Crée automatiquement created_at et updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trackers');
    }
};
