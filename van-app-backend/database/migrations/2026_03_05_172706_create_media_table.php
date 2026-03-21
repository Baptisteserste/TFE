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
        Schema::create('medias', function (Blueprint $table) {
            $table->id();

            // Le type de média (ex: 'photo', 'note_texte')
            $table->string('type')->default('photo');

            // Une description ou le contenu de la note
            $table->text('description')->nullable();

            // Le chemin vers le fichier image stocké sur le serveur (vide si c'est juste une note)
            $table->string('image_path')->nullable();

            // Coordonnées GPS pour placer la photo/note sur la carte du voyage
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);

            // Clé étrangère : À quel voyage appartient ce média ?
            $table->foreignId('trip_id')->constrained()->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medias');
    }
};
