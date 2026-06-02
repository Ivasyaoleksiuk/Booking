<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Mail\AppointmentStatusMail;
use App\Models\Appointment;
use App\Models\Review;
use App\Models\Schedule;
use App\Repositories\ScheduleRepository;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class MasterController extends Controller
{
    private ScheduleRepository $scheduleRepository;

    public function __construct()
    {
        $this->scheduleRepository = new ScheduleRepository();
    }

    public function appointments(Request $request): Response
    {
        $master = $request->user();

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $date = $validated['date'] ?? today()->toDateString();

        $appointments = Appointment::with(['customer', 'service', 'review'])
            ->where('master_id', $master->id)
            ->whereDate('date', $date)
            ->orderBy('start_time')
            ->get();

        // Stats
        $stats = [
            'today'     => Appointment::where('master_id', $master->id)
                            ->whereDate('date', today())
                            ->whereNotIn('status', ['cancelled'])
                            ->count(),
            'week'      => Appointment::where('master_id', $master->id)
                            ->whereBetween('date', [today()->toDateString(), today()->addDays(6)->toDateString()])
                            ->whereNotIn('status', ['cancelled'])
                            ->count(),
            'done'      => Appointment::where('master_id', $master->id)
                            ->where('status', 'done')
                            ->count(),
            'pending'   => Appointment::where('master_id', $master->id)
                            ->where('status', 'pending')
                            ->count(),
            'avgRating' => round((float) Review::where('master_id', $master->id)->avg('rating'), 1),
            'totalReviews' => Review::where('master_id', $master->id)->count(),
            'firstPendingDate' => Appointment::where('master_id', $master->id)
                ->where('status', 'pending')
                ->orderBy('date')
                ->value('date'),
        ];

        // Reviews
        $reviews = Review::with(['client', 'appointment.service'])
            ->where('master_id', $master->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'comment'    => $r->comment,
                'created_at' => $r->created_at,
                'client'     => ['name' => $r->client?->name ?? 'Клієнт'],
                'service'    => ['title' => $r->appointment?->service?->title ?? ''],
            ]);

        // Upcoming week grouped by date
        $upcomingWeek = Appointment::with(['customer', 'service'])
            ->where('master_id', $master->id)
            ->whereBetween('date', [today()->toDateString(), today()->addDays(6)->toDateString()])
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn($a) => $a->date->toDateString())
            ->map(fn($group, $day) => [
                'date'         => $day,
                'appointments' => $group->map(fn($a) => [
                    'id'         => $a->id,
                    'start_time' => $a->start_time,
                    'end_time'   => $a->end_time,
                    'status'     => $a->status,
                    'customer'   => ['name' => $a->customer?->name ?? ''],
                    'service'    => ['title' => $a->service?->title ?? ''],
                ])->values(),
            ])
            ->values();

        return Inertia::render('master/appointments', [
            'appointments' => $appointments,
            'date'         => $date,
            'stats'        => $stats,
            'reviews'      => $reviews,
            'upcomingWeek' => $upcomingWeek,
        ]);
    }

    public function schedule(Request $request): Response
    {
        $master = $request->user();

        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        return Inertia::render('master/schedule', [
            'schedules'   => $master->schedules,
            'initialDate' => $validated['date'] ?? null,
        ]);
    }

    public function saveSchedule(Request $request): RedirectResponse
    {
        $master = $request->user();

        $validated = $request->validate([
            'date_from'              => ['required', 'date', 'after_or_equal:today'],
            'date_to'                => ['nullable', 'date', 'after_or_equal:date_from'],
            'appointment_start_time' => ['required', 'date_format:H:i'],
            'appointment_end_time'   => ['required', 'date_format:H:i', 'after:appointment_start_time'],
            'note'                   => ['nullable', 'string', 'max:500'],
            'skip_sundays'           => ['boolean'],
        ]);

        $dateFrom    = Carbon::parse($validated['date_from']);
        $dateTo      = isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : $dateFrom->copy();
        $skipSundays = $validated['skip_sundays'] ?? false;

        for ($day = $dateFrom->copy(); $day->lte($dateTo); $day->addDay()) {
            if ($skipSundays && $day->isSunday()) continue;

            $existing = Schedule::where('user_id', $master->id)
                ->whereDate('appointment_date', $day->toDateString())
                ->first();

            $data = [
                'user_id'                => $master->id,
                'appointment_date'       => $day->toDateString(),
                'appointment_start_time' => $validated['appointment_start_time'],
                'appointment_end_time'   => $validated['appointment_end_time'],
                'note'                   => $validated['note'] ?? '',
            ];

            $existing ? $existing->update($data) : Schedule::create($data);
        }

        return back();
    }

    public function updateStatus(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->master_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'status' => ['required', 'in:confirmed,done,cancelled'],
        ]);

        $appointment->update(['status' => $validated['status']]);
        $appointment->load(['customer', 'master', 'service']);

        Mail::to($appointment->customer->email)->queue(new AppointmentStatusMail($appointment, $validated['status']));

        return back();
    }

    public function deleteSchedule(Request $request): RedirectResponse
    {
        $master = $request->user();

        $validated = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $dateFrom = Carbon::parse($validated['date_from']);
        $dateTo   = isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : $dateFrom->copy();

        Schedule::where('user_id', $master->id)
            ->whereBetween('appointment_date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->delete();

        return back();
    }
}
