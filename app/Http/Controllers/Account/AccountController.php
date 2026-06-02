<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Mail\AppointmentBookedMail;
use App\Mail\AppointmentMasterNotifyMail;
use App\Mail\AppointmentStatusMail;
use App\Models\Appointment;
use App\Models\Review;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AccountController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request)
    {
        $user = $request->user();

        $upcoming = Appointment::with(['master', 'service'])
            ->where('client_id', $user->id)
            ->where(function ($q) {
                $q->whereDate('date', '>=', Carbon::today())
                  ->whereNotIn('status', ['cancelled', 'done']);
            })
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $past = Appointment::with(['master', 'service', 'review'])
            ->where('client_id', $user->id)
            ->where(function ($q) {
                $q->whereDate('date', '<', Carbon::today())
                  ->orWhereIn('status', ['cancelled', 'done']);
            })
            ->orderByDesc('date')
            ->orderByDesc('start_time')
            ->limit(20)
            ->get();

        $completedVisits = Appointment::where('client_id', $user->id)
            ->where('status', 'done')
            ->count();

        return inertia('account/index', [
            'upcoming'         => $upcoming,
            'past'             => $past,
            'completedVisits'  => $completedVisits,
        ]);
    }

    public function showBook()
    {
        return inertia('account/book', [
            'services' => Service::with('masters:id,name')
                ->select('id', 'title', 'description', 'duration', 'price')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'master_id'  => ['required', 'exists:users,id'],
            'date'       => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'note'       => ['nullable', 'string', 'max:500'],
        ]);

        $service = Service::findOrFail($validated['service_id']);
        $endTime = Carbon::createFromFormat('H:i', $validated['start_time'])
            ->addMinutes($service->duration)
            ->format('H:i');

        $appointment = Appointment::create([
            'client_id'  => $request->user()->id,
            'master_id'  => $validated['master_id'],
            'service_id' => $validated['service_id'],
            'date'       => $validated['date'],
            'start_time' => $validated['start_time'],
            'end_time'   => $endTime,
            'note'       => $validated['note'] ?? null,
            'status'     => 'pending',
        ]);

        $appointment->load(['customer', 'master', 'service']);

        Mail::to($appointment->customer->email)->queue(new AppointmentBookedMail($appointment));
        Mail::to($appointment->master->email)->queue(new AppointmentMasterNotifyMail($appointment));

        return redirect()->route('account.dashboard')->with('success', 'Запис успішно створено!');
    }

    public function review(Request $request, Appointment $appointment): RedirectResponse
    {
        abort_if($appointment->client_id !== $request->user()->id, 403);
        abort_if($appointment->status !== 'done', 422);
        abort_if($appointment->review()->exists(), 422);

        $validated = $request->validate([
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        Review::create([
            'appointment_id' => $appointment->id,
            'client_id'      => $request->user()->id,
            'master_id'      => $appointment->master_id,
            'rating'         => $validated['rating'],
            'comment'        => $validated['comment'] ?? null,
        ]);

        return back();
    }

    public function cancel(Appointment $appointment): RedirectResponse
    {
        $this->authorize('cancel', $appointment);

        $appointment->update(['status' => 'cancelled']);
        $appointment->load(['customer', 'master', 'service']);

        Mail::to($appointment->customer->email)->queue(new AppointmentStatusMail($appointment, 'cancelled'));
        Mail::to($appointment->master->email)->queue(new AppointmentMasterNotifyMail($appointment));

        return back();
    }
}
