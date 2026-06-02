<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'client_id',
        'master_id',
        'service_id',
        'date',
        'start_time',
        'end_time',
        'note',
        'status',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function master()
    {
        return $this->belongsTo(User::class, 'master_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }
}
