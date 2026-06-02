@php
$statusInfo = [
    'confirmed' => ['icon' => '✅', 'label' => 'Підтверджено', 'message' => 'Майстер підтвердив ваш запис. Чекаємо на вас!'],
    'done'      => ['icon' => '⭐', 'label' => 'Завершено',    'message' => 'Дякуємо за візит! Будемо раді бачити вас знову. Залиште відгук — це займе хвилину.'],
    'cancelled' => ['icon' => '❌', 'label' => 'Скасовано',    'message' => 'На жаль, ваш запис було скасовано. Ви можете забронювати новий зручний час.'],
];
$info = $statusInfo[$newStatus] ?? ['icon' => 'ℹ️', 'label' => $newStatus, 'message' => 'Статус вашого запису змінено.'];
@endphp
<x-mail::message>
# {{ $info['icon'] }} Запис {{ $info['label'] }}

{{ $info['message'] }}

<x-mail::panel>
**Послуга:** {{ $appointment->service->title }}
**Майстер:** {{ $appointment->master->name }}
**Дата:** {{ \Carbon\Carbon::parse($appointment->date)->translatedFormat('d F Y') }}
**Час:** {{ substr($appointment->start_time, 0, 5) }} – {{ substr($appointment->end_time, 0, 5) }}
</x-mail::panel>

@if($newStatus === 'done')
<x-mail::button :url="config('app.url') . '/account'">
Залишити відгук
</x-mail::button>
@elseif($newStatus === 'cancelled')
<x-mail::button :url="config('app.url') . '/account/book'">
Записатися знову
</x-mail::button>
@else
<x-mail::button :url="config('app.url') . '/account'">
Мій кабінет
</x-mail::button>
@endif

{{ config('app.name') }}
</x-mail::message>
