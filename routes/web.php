<?php

use App\Http\Controllers\Account\AccountController;
use App\Http\Controllers\Admin\AiController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\AppointmentsController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Master\MasterController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\UsersController;
use App\Models\Service;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'services' => Service::with('masters:id,name')
            ->select('id', 'title', 'description', 'duration', 'price')
            ->get(),
    ]);
})->name('home');

Route::get('/slots', [BookingController::class, 'slots'])->name('public_slots');
Route::get('/nearest-date', [BookingController::class, 'nearestDate'])->name('public_nearest_date');
Route::post('/book', [BookingController::class, 'book'])->name('public_book');


Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/', [DashboardController::class, 'show'])->name('dashboard');

        Route::prefix('appointments')->group(function () {
            Route::get('/', [AppointmentsController::class, 'show'])->name('appointments');
            Route::get('/create', [AppointmentsController::class, 'create'])->name('appointments_create');
            Route::get('/slots', [AppointmentsController::class, 'slots'])->name('appointments_slots');
            Route::post('/', [AppointmentsController::class, 'store'])->name('appointments_store');
            Route::get('/{appointment}/edit', [AppointmentsController::class, 'edit'])->name('appointments_edit');
            Route::put('/{appointment}', [AppointmentsController::class, 'update'])->name('appointments_update');
            Route::patch('/{appointment}/status', [AppointmentsController::class, 'updateStatus'])->name('appointments_status');
            Route::delete('/{appointment}', [AppointmentsController::class, 'destroy'])->name('appointments_destroy');
        });

        Route::get('schedule', [ScheduleController::class, 'show'])->name('schedule');

        Route::prefix('schedule')->group(function () {
            Route::get('/', [ScheduleController::class, 'show'])->name('schedule');
            Route::post('/', [ScheduleController::class, 'save'])->name('schedule_save');
            Route::delete('/', [ScheduleController::class, 'delete'])->name('schedule_delete');
        });

        Route::prefix('services')->group(function () {
            Route::get('/', [ServiceController::class, 'index'])->name('services_index');
            Route::get('/create', [ServiceController::class, 'create'])->name('services_create');
            Route::post('/', [ServiceController::class, 'store'])->name('services_store');
            Route::get('/{service}', [ServiceController::class, 'edit'])->name('services_edit');
            Route::put('/{id}', [ServiceController::class, 'update'])->name('services_update');
            Route::delete('/{id}', [ServiceController::class, 'destroy'])->name('services_destroy');
        });

        Route::post('/ai/chat', [AiController::class, 'chat'])->name('admin.ai.chat');

        Route::prefix('users')->group(function () {
            Route::get('/', [UsersController::class, 'show'])->name('users');
            Route::get('/{user}', [UsersController::class, 'edit'])->name('users_edit');
            Route::put('/{user}', [UsersController::class, 'update'])->name('users_update');
            Route::delete('/{user}', [UsersController::class, 'destroy'])->name('users_destroy');
        });

    });

});

Route::middleware(['auth', 'verified', 'role:master'])->group(function () {
    Route::prefix('master')->group(function () {
        Route::get('/appointments', [MasterController::class, 'appointments'])->name('master.dashboard');
        Route::patch('/appointments/{appointment}/status', [MasterController::class, 'updateStatus'])->name('master.appointments.status');
        Route::get('/schedule', [MasterController::class, 'schedule'])->name('master.schedule');
        Route::post('/schedule', [MasterController::class, 'saveSchedule'])->name('master.schedule.save');
        Route::delete('/schedule', [MasterController::class, 'deleteSchedule'])->name('master.schedule.delete');
    });
});

Route::middleware(['auth', 'verified', 'role:client,master'])->group(function () {
    Route::prefix('account')->group(function () {
        Route::get('/', [AccountController::class, 'index'])->name('account.dashboard');
        Route::get('/book', [AccountController::class, 'showBook'])->name('account.book');
        Route::post('/appointments', [AccountController::class, 'store'])->name('account.appointments.store');
        Route::post('/appointments/{appointment}/review', [AccountController::class, 'review'])->name('account.appointments.review');
        Route::put('/appointments/{appointment}/cancel', [AccountController::class, 'cancel'])->name('account.appointments.cancel');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
