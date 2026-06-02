<x-mail::message>
# Ваш запис підтверджено ✅

Вітаємо, **{{ $appointment->customer->name }}**!

Ваш запис успішно створено. Ось деталі:

<x-mail::panel>
**Послуга:** {{ $appointment->service->title }}
**Майстер:** {{ $appointment->master->name }}
**Дата:** {{ \Carbon\Carbon::parse($appointment->date)->translatedFormat('d F Y') }}
**Час:** {{ substr($appointment->start_time, 0, 5) }} – {{ substr($appointment->end_time, 0, 5) }}
@if($appointment->note)
**Коментар:** {{ $appointment->note }}
@endif
</x-mail::panel>

Якщо вам потрібно скасувати або перенести запис — зробіть це у вашому особистому кабінеті не пізніше ніж за 2 години до початку.

<x-mail::button :url="config('app.url') . '/account'">
Мій кабінет
</x-mail::button>

Чекаємо на вас!

{{ config('app.name') }}
</x-mail::message>
