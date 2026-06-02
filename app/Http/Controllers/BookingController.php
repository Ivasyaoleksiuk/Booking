<?php

namespace App\Http\Controllers;

use App\Mail\AppointmentBookedMail;
use App\Mail\AppointmentMasterNotifyMail;
use App\Models\Appointment;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function slots(Request $request): JsonResponse
    {
        $request->validate([
            'master_id'  => ['required', 'exists:users,id'],
            'date'       => ['required', 'date'],
            'service_id' => ['required', 'exists:services,id'],
        ]);

        $schedule = Schedule::where('user_id', $request->master_id)
            ->whereDate('appointment_date', $request->date)
            ->first();

        if (!$schedule) {
            return response()->json([]);
        }

        $service  = Service::findOrFail($request->service_id);
        $duration = $service->duration;

        $windowStart = Carbon::createFromFormat('H:i', substr($schedule->appointment_start_time, 0, 5));
        $windowEnd   = Carbon::createFromFormat('H:i', substr($schedule->appointment_end_time, 0, 5));

        $booked = Appointment::where('master_id', $request->master_id)
            ->whereDate('date', $request->date)
            ->get(['start_time', 'end_time']);

        $slots   = [];
        $current = $windowStart->copy();

        while ($current->copy()->addMinutes($duration)->lte($windowEnd)) {
            $slotStart = $current->format('H:i');
            $slotEnd   = $current->copy()->addMinutes($duration)->format('H:i');

            $overlaps = $booked->contains(function ($appt) use ($slotStart, $slotEnd) {
                $aStart = substr($appt->start_time, 0, 5);
                $aEnd   = substr($appt->end_time, 0, 5);
                return $slotStart < $aEnd && $slotEnd > $aStart;
            });

            if (!$overlaps) {
                $slots[] = $slotStart;
            }

            $current->addMinutes($duration);
        }

        return response()->json($slots);
    }

    public function nearestDate(Request $request): JsonResponse
    {
        $request->validate([
            'master_id'  => ['required', 'exists:users,id'],
            'service_id' => ['required', 'exists:services,id'],
        ]);

        $service  = Service::findOrFail($request->service_id);
        $duration = $service->duration;

        $schedules = Schedule::where('user_id', $request->master_id)
            ->whereDate('appointment_date', '>=', today())
            ->orderBy('appointment_date')
            ->get();

        foreach ($schedules as $schedule) {
            $date = $schedule->appointment_date->format('Y-m-d');

            $windowStart = Carbon::createFromFormat('H:i', substr($schedule->appointment_start_time, 0, 5));
            $windowEnd   = Carbon::createFromFormat('H:i', substr($schedule->appointment_end_time, 0, 5));

            $booked  = Appointment::where('master_id', $request->master_id)
                ->whereDate('date', $date)
                ->get(['start_time', 'end_time']);

            $current = $windowStart->copy();
            while ($current->copy()->addMinutes($duration)->lte($windowEnd)) {
                $slotStart = $current->format('H:i');
                $slotEnd   = $current->copy()->addMinutes($duration)->format('H:i');

                $overlaps = $booked->contains(function ($appt) use ($slotStart, $slotEnd) {
                    $aStart = substr($appt->start_time, 0, 5);
                    $aEnd   = substr($appt->end_time, 0, 5);
                    return $slotStart < $aEnd && $slotEnd > $aStart;
                });

                if (!$overlaps) {
                    return response()->json(['date' => $date]);
                }

                $current->addMinutes($duration);
            }
        }

        return response()->json(['date' => null]);
    }

    public function book(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email'],
            'phone'      => ['required', 'string', 'max:30'],
            'service_id' => ['required', 'exists:services,id'],
            'master_id'  => ['required', 'exists:users,id'],
            'date'       => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
        ]);

        $isNewUser = false;
        $user = User::where('email', $validated['email'])->first()
            ?? User::where('phone', $validated['phone'])->first();

        if (!$user) {
            $user = User::create([
                'name'              => $validated['name'],
                'email'             => $validated['email'],
                'phone'             => $validated['phone'],
                'role'              => 'client',
                'password'          => Str::random(32),
                'email_verified_at' => now(),
            ]);
            $isNewUser = true;
        }

        $service = Service::findOrFail($validated['service_id']);
        $endTime = Carbon::createFromFormat('H:i', $validated['start_time'])
            ->addMinutes($service->duration)
            ->format('H:i');

        $appointment = Appointment::create([
            'client_id'  => $user->id,
            'master_id'  => $validated['master_id'],
            'service_id' => $validated['service_id'],
            'date'       => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time'   => $endTime,
            'status'     => 'pending',
        ]);

        $appointment->load(['customer', 'master', 'service']);

        Mail::to($user->email)->queue(new AppointmentBookedMail($appointment));
        Mail::to($appointment->master->email)->queue(new AppointmentMasterNotifyMail($appointment));

        if ($isNewUser) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json(['message' => 'Бронювання успішно створено!']);
    }
}