<x-mail::message>
# Нагадування про запис ⏰

Доброго дня, **{{ $appointment->customer->name }}**!

Нагадуємо, що **завтра** у вас запланований візит:

<x-mail::panel>
**Послуга:** {{ $appointment->service->title }}
**Майстер:** {{ $appointment->master->name }}
**Дата:** {{ \Carbon\Carbon::parse($appointment->date)->translatedFormat('d F Y') }}
**Час:** {{ substr($appointment->start_time, 0, 5) }} – {{ substr($appointment->end_time, 0, 5) }}
</x-mail::panel>

Якщо вам потрібно скасувати запис — зробіть це якомога раніше.

<x-mail::button :url="config('app.url') . '/account'">
Мій кабінет
</x-mail::button>

Чекаємо на вас!

{{ config('app.name') }}
</x-mail::message>
