<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $fillable = ['latitude', 'longitude', 'speed', 'timestamp', 'source', 'trip_id', 'tracker_id'];

    // Une position appartient à un voyage
    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
