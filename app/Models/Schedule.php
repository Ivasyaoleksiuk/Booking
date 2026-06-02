<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'appointment_date',
        'appointment_start_time',
        'appointment_end_time',
        'note',
        'status',
        'user_id'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime:Y-m-d',
        ];
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
}
