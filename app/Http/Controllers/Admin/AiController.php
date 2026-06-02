<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'messages'           => ['required', 'array', 'min:1', 'max:50'],
            'messages.*.role'    => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:4000'],
        ]);

        // ── Gather live context ──────────────────────────────────────────────
        $today      = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd   = $today->copy()->endOfMonth();

        $appointmentsToday = Appointment::whereDate('date', $today)->count();
        $pendingCount      = Appointment::where('status', 'pending')->count();
        $mastersCount      = User::where('role', 'master')->count();
        $clientsCount      = User::where('role', 'client')->count();
        $servicesCount     = Service::count();

        $services = Service::all(['title', 'duration', 'price'])
            ->map(fn($s) => "{$s->title} ({$s->duration} хв, {$s->price} грн)")
            ->implode('; ');

        $masters = User::where('role', 'master')->pluck('name')->implode(', ');

        $monthlyRevenue = Appointment::join('services', 'appointments.service_id', '=', 'services.id')
            ->whereBetween('appointments.date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->whereIn('appointments.status', ['confirmed', 'done'])
            ->sum('services.price');

        $appName = config('app.name', 'Салон краси');

        // ── System prompt ────────────────────────────────────────────────────
        $systemPrompt = <<<PROMPT
Ти — Gemini, розумний помічник адміністратора салону краси «{$appName}».

ТВОЯ ГОЛОВНА РОЛЬ — допомагати «наповнити сайт життям»:
1. ✍️  ТЕКСТИ: писати описи послуг, привітальні тексти, повідомлення для клієнтів, назви, слогани
2. ⚙️  ЛОГІКА: радити як налаштувати бронювання, правила запису, обмеження
3. ⏰  ЧАСОВІ ІНТЕРВАЛИ: оптимальна тривалість послуг, робочі години майстрів, паузи між записами, пікові години

Відповідай ТІЛЬКИ українською мовою. Будь конкретним та практичним.
Давай готові тексти які можна одразу скопіювати і використати.

──── ПОТОЧНИЙ СТАН САЛОНУ ────
Назва: {$appName}
Майстри ({$mastersCount}): {$masters}
Послуги ({$servicesCount}): {$services}
Клієнти: {$clientsCount}
Записів сьогодні: {$appointmentsToday}
Очікують підтвердження: {$pendingCount}
Виручка за місяць: {$monthlyRevenue} грн
─────────────────────────────

Коли пишеш тексти — адаптуй їх під реальні послуги та майстрів салону.
Коли радиш часові інтервали — враховуй конкретні послуги (тривалість, складність).
Коли пояснюєш логіку — спирайся на реальну структуру системи.
PROMPT;

        // ── Convert messages to Gemini format ────────────────────────────────
        // Gemini uses 'user' and 'model' roles (not 'assistant')
        $contents = collect($request->input('messages'))
            ->map(fn($msg) => [
                'role'  => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]],
            ])
            ->values()
            ->all();

        // ── Call Gemini API ──────────────────────────────────────────────────
        $model    = config('services.gemini.model', 'gemini-2.0-flash');
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $response = Http::withQueryParameters(['key' => config('services.gemini.key')])
            ->timeout(30)
            ->post($endpoint, [
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents'          => $contents,
                'generationConfig'  => [
                    'temperature'     => 0.7,
                    'maxOutputTokens' => 1500,
                ],
            ]);

        if ($response->failed()) {
            $err = $response->json('error.message', 'Невідома помилка Gemini API');
            return response()->json(['error' => $err], 500);
        }

        $text = $response->json('candidates.0.content.parts.0.text', '');

        if (empty($text)) {
            return response()->json(['error' => 'Gemini не повернув відповідь.'], 500);
        }

        return response()->json(['message' => $text]);
    }
}
