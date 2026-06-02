<?php

namespace App\Console\Commands;

use App\Mail\AppointmentReminderMail;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendAppointmentReminders extends Command
{
    protected $signature   = 'appointments:remind';
    protected $description = 'Send reminder emails to clients 24 hours before their appointment';

    public function handle(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $appointments = Appointment::with(['customer', 'master', 'service'])
            ->whereDate('date', $tomorrow)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        foreach ($appointments as $appointment) {
            Mail::to($appointment->customer->email)
                ->queue(new AppointmentReminderMail($appointment));
        }

        $this->info("Надіслано нагадувань: {$appointments->count()}");
    }
}
