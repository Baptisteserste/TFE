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
        Schema::create('locations', function (Blueprint $table) {
            $table->id();

            // Coordonnées GPS précises (décimales)
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);

            // Vitesse enregistrée lors du point
            $table->float('speed')->nullable();

            // Date et heure exactes de la capture du point GPS
            $table->timestamp('timestamp');

            // Origine de la donnée pour le plan de secours ('tracker' ou 'mobile')
            $table->string('source')->default('tracker');

            // Clé étrangère : À quel voyage appartient ce point ?
            $table->foreignId('trip_id')->constrained()->onDelete('cascade');

            // Clé étrangère : Quel boîtier a capturé ce point ?
            // (nullable = la case reste vide si le point vient du téléphone)
            $table->foreignId('tracker_id')->nullable()->constrained()->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
