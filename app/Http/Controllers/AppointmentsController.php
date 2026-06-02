<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentsController extends Controller
{
    public function show(Request $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $masterId = $request->query('master_id', '');

        $query = Appointment::with(['customer', 'master', 'service'])
            ->orderBy('date')
            ->orderBy('start_time');

        if ($date) {
            $query->whereDate('date', $date);
        }

        if ($masterId) {
            $query->where('master_id', $masterId);
        }

        return Inertia::render('appointments', [
            'appointments' => $query->get(),
            'date'         => $date ?? '',
            'master_id'    => $masterId,
            'masters'      => User::where('role', 'master')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/appointments/create', [
            'clients'  => User::where('role', 'client')->select('id', 'name')->get(),
            'masters'  => User::where('role', 'master')->select('id', 'name')->get(),
            'services' => Service::select('id', 'title', 'duration')->get(),
        ]);
    }

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
            ->when($request->appointment_id, fn ($q) => $q->where('id', '!=', $request->appointment_id))
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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id'  => ['required', 'exists:users,id'],
            'master_id'  => ['required', 'exists:users,id'],
            'service_id' => ['required', 'exists:services,id'],
            'date'       => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'note'       => ['nullable', 'string'],
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $validated['end_time'] = Carbon::createFromFormat('H:i', $validated['start_time'])
            ->addMinutes($service->duration)
            ->format('H:i');
        $validated['status'] = 'pending';

        Appointment::create($validated);

        return redirect()->route('appointments');
    }

    public function edit(Appointment $appointment)
    {
        return Inertia::render('admin/appointments/edit', [
            'appointment' => $appointment->load(['customer', 'master', 'service']),
            'clients'     => User::where('role', 'client')->select('id', 'name')->get(),
            'masters'     => User::where('role', 'master')->select('id', 'name')->get(),
            'services'    => Service::select('id', 'title', 'duration')->get(),
        ]);
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'client_id'  => ['required', 'exists:users,id'],
            'master_id'  => ['required', 'exists:users,id'],
            'service_id' => ['required', 'exists:services,id'],
            'date'       => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'note'       => ['nullable', 'string'],
            'status'     => ['required', 'in:pending,confirmed,cancelled,done'],
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $validated['end_time'] = Carbon::createFromFormat('H:i', $validated['start_time'])
            ->addMinutes($service->duration)
            ->format('H:i');

        $appointment->update($validated);

        return redirect()->route('appointments');
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled,done'],
        ]);

        $appointment->update(['status' => $validated['status']]);

        return back();
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $appointment->delete();

        return redirect()->route('appointments');
    }
}
