<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Schedule;
use App\Repositories\ScheduleRepository;
use App\Repositories\UserRepository;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    use AuthorizesRequests;
    private UserRepository $userRepository;
    private ScheduleRepository $scheduleRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
        $this->scheduleRepository = new ScheduleRepository();
    }

    public function show(Request $request) {
        $this->authorize('viewAny', Schedule::class);

        $masters = $this->userRepository->getAll(UserRole::MASTER->value);

        $validated = $request->validate([
            'selectedMasterId' => ['integer', 'exists:users,id,role,' . UserRole::MASTER->value],
            'date'             => ['nullable', 'date_format:Y-m-d'],
        ]);

        $masterId = $validated['selectedMasterId'] ?? null;

        if (empty($validated['selectedMasterId'])) {
            $masterId = $masters->first()->id;
        }

        $master = $this->userRepository->getById($masterId);

        return Inertia::render('schedule', [
            'masters'        => $masters,
            'masterSelected' => $master,
            'schedules'      => $master->schedules ?? [],
            'initialDate'    => $validated['date'] ?? null,
        ]);
    }

    public function save(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id'                => ['required', 'integer', 'exists:users,id'],
            'date_from'              => ['required', 'date', 'after_or_equal:today'],
            'date_to'                => ['nullable', 'date', 'after_or_equal:date_from'],
            'appointment_start_time' => ['required', 'date_format:H:i'],
            'appointment_end_time'   => ['required', 'date_format:H:i', 'after:appointment_start_time'],
            'note'                   => ['nullable', 'string', 'max:500'],
            'skip_sundays'           => ['boolean'],
        ]);

        $dateFrom    = Carbon::parse($validated['date_from']);
        $dateTo      = isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : $dateFrom->copy();
        $skipSundays = $validated['skip_sundays'] ?? true;
        $saved       = 0;

        for ($day = $dateFrom->copy(); $day->lte($dateTo); $day->addDay()) {
            if ($skipSundays && $day->isSunday()) {
                continue;
            }

            $existing = Schedule::where('user_id', $validated['user_id'])
                ->whereDate('appointment_date', $day->toDateString())
                ->first();

            $data = [
                'user_id'                => $validated['user_id'],
                'appointment_date'       => $day->toDateString(),
                'appointment_start_time' => $validated['appointment_start_time'],
                'appointment_end_time'   => $validated['appointment_end_time'],
                'note'                   => $validated['note'] ?? '',
            ];

            $existing ? $existing->update($data) : Schedule::create($data);
            $saved++;
        }

        return back();
    }

    public function delete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id'   => ['required', 'integer', 'exists:users,id'],
            'date_from' => ['required', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $dateFrom = Carbon::parse($validated['date_from']);
        $dateTo   = isset($validated['date_to']) ? Carbon::parse($validated['date_to']) : $dateFrom->copy();

        $deleted = Schedule::where('user_id', $validated['user_id'])
            ->whereBetween('appointment_date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->delete();

        return back();
    }


}
