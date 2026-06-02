<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'duration',
        'price',
        'image'
    ];

    public function masters() {
        return $this->belongsToMany(User::class,
            'master_service',
            'service_id',
            'master_id'
        );
    }
}
