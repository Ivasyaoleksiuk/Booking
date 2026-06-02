<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Щодня о 09:00 надсилаємо нагадування клієнтам про завтрашні записи
Schedule::command('appointments:remind')->dailyAt('09:00');
