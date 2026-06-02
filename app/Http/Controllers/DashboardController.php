<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function show()
    {
        $today      = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd   = $today->copy()->endOfMonth();

        $appointmentsToday = Appointment::whereDate('date', $today)->count();
        $mastersCount      = User::where('role', 'master')->count();
        $clientsCount      = User::where('role', 'client')->count();

        $revenueStatuses = ['confirmed', 'done'];

        $monthlyRevenue = Appointment::join('services', 'appointments.service_id', '=', 'services.id')
            ->whereBetween('appointments.date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->whereIn('appointments.status', $revenueStatuses)
            ->sum('services.price');

        $todayRevenue = Appointment::join('services', 'appointments.service_id', '=', 'services.id')
            ->whereDate('appointments.date', $today)
            ->whereIn('appointments.status', $revenueStatuses)
            ->sum('services.price');

        $rawCounts = Appointment::selectRaw('date, COUNT(*) as count')
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->groupBy('date')
            ->pluck('count', 'date');

        $rawRevenue = Appointment::join('services', 'appointments.service_id', '=', 'services.id')
            ->selectRaw('appointments.date, SUM(services.price) as revenue')
            ->whereBetween('appointments.date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->whereIn('appointments.status', $revenueStatuses)
            ->groupBy('appointments.date')
            ->pluck('revenue', 'appointments.date');

        $monthlyChart = collect();
        for ($day = $monthStart->copy(); $day->lte($monthEnd); $day->addDay()) {
            $dateStr = $day->toDateString();
            $monthlyChart->push([
                'date'    => $day->format('d.m'),
                'count'   => $rawCounts->get($dateStr, 0),
                'revenue' => (float) ($rawRevenue->get($dateStr, 0)),
            ]);
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'appointmentsToday' => $appointmentsToday,
                'mastersCount'      => $mastersCount,
                'clientsCount'      => $clientsCount,
                'monthlyRevenue'    => (float) $monthlyRevenue,
                'todayRevenue'      => (float) $todayRevenue,
            ],
            'monthlyChart' => $monthlyChart->values(),
        ]);
    }
}
