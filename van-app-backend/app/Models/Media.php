<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'medias';

    protected $fillable = [
        'type',
        'description',
        'image_path',
        'latitude',
        'longitude',
        'trip_id',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
