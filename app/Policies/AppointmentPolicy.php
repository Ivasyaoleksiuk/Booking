<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;

class AppointmentPolicy
{
    public function cancel(User $user, Appointment $appointment): bool
    {
        return $appointment->client_id === $user->id
            && !in_array($appointment->status, ['cancelled', 'done'])
            && Carbon::parse($appointment->date)->gte(Carbon::today());
    }
}
