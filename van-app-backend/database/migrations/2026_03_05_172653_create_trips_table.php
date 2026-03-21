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
        Schema::create('trips', function (Blueprint $table) {
            $table->id();

            // Le nom donné au voyage (ex: "Roadtrip Alpes 2026")
            $table->string('title');

            // La date de départ
            $table->timestamp('start_date')->useCurrent();

            // La date de fin (nullable car le voyage n'est pas terminé quand il commence)
            $table->timestamp('end_date')->nullable();

            // L'état du voyage (ex: en cours, terminé)
            $table->string('status')->default('active');

            // La clé étrangère qui relie le voyage à l'utilisateur qui l'organise
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
