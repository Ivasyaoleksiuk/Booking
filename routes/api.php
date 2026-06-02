<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GeminiController;

Route::post('/gemini/generate-description', [GeminiController::class, 'generateServiceDescription']);
Route::post('/gemini/client-chat', [GeminiController::class, 'clientChat']);
