<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'start_date', 'end_date', 'status', 'user_id'];

    // Un voyage possède plusieurs positions GPS
    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    // Un voyage appartient à un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Un voyage possède plusieurs médias (photos, notes)
    public function medias()
    {
        return $this->hasMany(Media::class);
    }
}
