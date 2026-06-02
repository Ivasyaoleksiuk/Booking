<?php

namespace App\Providers;

use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Schedule;
use App\Policies\AppointmentPolicy;
use App\Policies\SchedulePolicy;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Schedule::class, SchedulePolicy::class);
        Gate::policy(Appointment::class, AppointmentPolicy::class);

        RedirectIfAuthenticated::redirectUsing(function (Request $request) {
            return match ($request->user()?->role) {
                UserRole::ADMIN  => route('dashboard'),
                UserRole::MASTER => route('master.dashboard'),
                default          => route('account.dashboard'),
            };
        });
    }
}
