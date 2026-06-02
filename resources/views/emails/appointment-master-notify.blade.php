<x-mail::message>
# Новий запис 📋

У вас новий запис від клієнта!

<x-mail::panel>
**Клієнт:** {{ $appointment->customer->name }}
@if($appointment->customer->phone)
**Телефон:** {{ $appointment->customer->phone }}
@endif
**Послуга:** {{ $appointment->service->title }}
**Дата:** {{ \Carbon\Carbon::parse($appointment->date)->translatedFormat('d F Y') }}
**Час:** {{ substr($appointment->start_time, 0, 5) }} – {{ substr($appointment->end_time, 0, 5) }}
@if($appointment->note)
**Коментар клієнта:** {{ $appointment->note }}
@endif
</x-mail::panel>

Будь ласка, підтвердіть запис у своєму кабінеті майстра.

<x-mail::button :url="config('app.url') . '/master/appointments'">
Кабінет майстра
</x-mail::button>

{{ config('app.name') }}
</x-mail::message>
