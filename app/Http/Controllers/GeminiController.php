<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Gemini\Laravel\Facades\Gemini;

class GeminiController extends Controller
{
    /**
     * 🛠 ФУНКЦІЯ ДЛЯ МЕНЕДЖЕРА: Генерація опису послуги
     */
    public function generateServiceDescription(Request $request)
    {
        $request->validate([
            'service_name' => 'required|string|max:255',
        ]);

        $serviceName = $request->input('service_name');

        // Формуємо чітку інструкцію для Gemini
        $prompt = "Ти професійний копірайтер та маркетолог. Напиши привабливий, структурований та інформативний опис для послуги: \"{$serviceName}\".
        Текст має бути виключно українською мовою, розбитий на логічні абзаци або списки, без зайвої «води». Додай коротко, кому підійде ця послуга та який результат отримає клієнт.";

        try {
            // Викликаємо безкоштовну швидку модель Gemini 1.5 Flash
            $result = Gemini::gemini15Flash()->generateContent($prompt);

            return response()->json([
                'success' => true,
                'description' => $result->text()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Помилка ШІ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🎭 ФУНКЦІЯ ДЛЯ КЛІЄНТА: Розумний ШІ-Консьєрж
     */
    public function clientChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'history' => 'nullable|array' // Тут фронтенд може передавати історію візитів або правила
        ]);

        $userMessage = $request->input('message');

        // Сюди ми потім передамо реальні дані з бази, а поки робимо базовий контекст закладу
        $systemInstruction = "Ти розумний ШІ-Консьєрж універсальної платформи бронювання послуг.
        Ти ведеш діалог від імені закладу, в якому зараз перебуває клієнт.
        Спілкуйся ввічливо, коротко, професійно та тільки українською мовою.
        Допомагай клієнту обрати послугу, підказуй правила закладу та аналізуй його запити.";

        try {
            // Запускаємо чат-сесію з системною інструкцією
            $chat = Gemini::gemini15Flash()->chat()->withSystemInstruction($systemInstruction);

            $response = $chat->sendMessage($userMessage);

            return response()->json([
                'success' => true,
                'reply' => $response->text()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Помилка ШІ: ' . $e->getMessage()
            ], 500);
        }
    }
}
