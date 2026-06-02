import {
    login,
    public_book,
    public_nearest_date,
    public_slots,
    register,
} from '@/routes';
import { formatPrice } from '@/lib/format';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/uk';
import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

interface Master {
    id: number;
    name: string;
}

interface Service {
    id: number;
    title: string;
    description: string | null;
    duration: number;
    price: string;
    masters: Master[];
}

interface Props {
    services: Service[];
}

function getCsrfToken(): string {
    return decodeURIComponent(
        document.cookie.split('; ').find((r) => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? '',
    );
}

export default function Welcome({ services }: Props) {
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);

    const availableMasters = selectedService?.masters ?? [];

    const [date, setDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [time, setTime] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [nearestDate, setNearestDate] = useState<string | null>(null);
    const [loadingNearestDate, setLoadingNearestDate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [booked, setBooked] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch nearest available date when service + master are selected
    useEffect(() => {
        if (!selectedService || !selectedMaster) {
            setNearestDate(null);
            return;
        }

        setLoadingNearestDate(true);

        const url = new URL(public_nearest_date().url, window.location.origin);
        url.searchParams.set('master_id', String(selectedMaster.id));
        url.searchParams.set('service_id', String(selectedService.id));

        fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then(({ date: d }: { date: string | null }) => {
                setNearestDate(d);
                if (d) setDate(d);
            })
            .finally(() => setLoadingNearestDate(false));
    }, [selectedService, selectedMaster]);

    // Fetch available slots when master + date + service change
    useEffect(() => {
        if (!selectedMaster || !date || !selectedService) {
            setSlots([]);
            setTime('');
            return;
        }

        setLoadingSlots(true);
        setTime('');

        const url = new URL(public_slots().url, window.location.origin);
        url.searchParams.set('master_id', String(selectedMaster.id));
        url.searchParams.set('date', date);
        url.searchParams.set('service_id', String(selectedService.id));

        fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((s: string[]) => setSlots(s))
            .finally(() => setLoadingSlots(false));
    }, [selectedMaster, date, selectedService]);

    const validate = (): Record<string, string> => {
        const errs: Record<string, string> = {};

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            errs.email = 'Введіть коректний email';
        }

        if (!/^\+380\d{9}$/.test(phone.replace(/\s/g, ''))) {
            errs.phone = 'Введіть номер у форматі +380XXXXXXXXX';
        }

        return errs;
    };

    const handleBook = async () => {
        const clientErrors = validate();
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const res = await fetch(public_book().url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    service_id: selectedService?.id,
                    master_id: selectedMaster?.id,
                    date,
                    start_time: time,
                }),
            });

            if (res.ok) {
                setBooked(true);
            } else {
                const body = await res.json();
                if (body.errors) setErrors(body.errors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        setSelectedService(null);
        setSelectedMaster(null);
        setDate('');
        setTime('');
        setSlots([]);
        setName('');
        setEmail('');
        setPhone('');
        setNearestDate(null);
        setErrors({});
        setBooked(false);
    };

    if (booked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-semibold mb-2">Бронювання підтверджено!</h2>
                    <p className="text-gray-500 mb-2">
                        <span className="font-medium">{selectedService?.title}</span> з{' '}
                        <span className="font-medium">{selectedMaster?.name}</span>
                    </p>
                    <p className="text-gray-500 mb-6">
                        {date} о {time}
                    </p>
                    <button
                        onClick={handleClear}
                        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90"
                    >
                        Нове бронювання
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 text-gray-800">
            <div className="flex min-h-screen items-start justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left — service + master */}
                    <aside className="sticky top-6 rounded-2xl bg-white p-6 shadow lg:col-span-1">
                        <h2 className="mb-3 text-2xl font-semibold">
                            Оберіть послугу
                        </h2>

                        <div className="space-y-3">
                            {services.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedService(s);
                                        setTime('');
                                        setSelectedMaster((prev) =>
                                            s.masters.some(
                                                (m) => m.id === prev?.id,
                                            )
                                                ? prev
                                                : null,
                                        );
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                                        selectedService?.id === s.id
                                            ? 'border-black bg-gray-50 shadow'
                                            : 'border-gray-100 hover:shadow-md'
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium">
                                            {s.title}
                                        </div>
                                        {s.description && (
                                            <div className="text-sm text-gray-500">
                                                {s.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3 shrink-0 text-right">
                                        <div className="font-semibold">
                                            {formatPrice(s.price)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {s.duration} хв
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <hr className="my-6" />

                        <h3 className="mb-2 text-lg font-semibold">
                            Оберіть майстра
                        </h3>
                        <div className="space-y-2">
                            {!selectedService ? (
                                <p className="text-sm text-gray-400">
                                    Спочатку оберіть послугу
                                </p>
                            ) : availableMasters.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                    Для цієї послуги майстрів немає
                                </p>
                            ) : (
                                availableMasters.map((m) => (
                                    <label
                                        key={m.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-2 hover:bg-gray-50"
                                    >
                                        <input
                                            type="radio"
                                            name="master"
                                            checked={
                                                selectedMaster?.id === m.id
                                            }
                                            onChange={() => {
                                                setSelectedMaster(m);
                                                setTime('');
                                            }}
                                        />
                                        <div className="font-medium">
                                            {m.name}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Middle — date, time, contact */}
                    <main className="rounded-2xl bg-white p-6 shadow lg:col-span-1">
                        <h2 className="mb-2 text-2xl font-semibold">
                            Дата та час
                        </h2>

                        {/* Calendar */}
                        <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale="uk"
                        >
                            <DateCalendar
                                value={date ? dayjs(date) : null}
                                onChange={(val: Dayjs | null) => {
                                    setDate(val?.format('YYYY-MM-DD') ?? '');
                                    setTime('');
                                }}
                                minDate={dayjs()}
                                sx={{ width: '100%', mx: 0 }}
                            />
                        </LocalizationProvider>

                        {loadingNearestDate && (
                            <p className="-mt-2 mb-3 text-xs text-gray-400">
                                Шукаємо найближчу дату...
                            </p>
                        )}
                        {!loadingNearestDate &&
                            selectedService &&
                            selectedMaster &&
                            nearestDate === null && (
                                <p className="-mt-2 mb-3 text-xs text-red-500">
                                    Немає доступних дат
                                </p>
                            )}

                        {/* Time slot buttons */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Час початку
                            </label>
                            {!selectedMaster || !date || !selectedService ? (
                                <p className="text-sm text-gray-400">
                                    Оберіть послугу, майстра та дату
                                </p>
                            ) : loadingSlots ? (
                                <p className="text-sm text-gray-400">
                                    Завантаження...
                                </p>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-red-500">
                                    Немає вільних слотів на цю дату
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {slots.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setTime(s)}
                                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                time === s
                                                    ? 'border-black bg-black text-white'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {errors.start_time && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.start_time}
                                </p>
                            )}
                        </div>

                        <hr className="my-6" />

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Ваше ім'я
                            </label>
                            <input
                                type="text"
                                placeholder="Повне ім'я"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border p-3"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border p-3"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Телефон
                            </label>
                            <input
                                type="tel"
                                placeholder="+380..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full rounded-lg border p-3"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.phone}
                                </p>
                            )}
                        </div>
                    </main>

                    {/* Right — summary */}
                    <aside className="rounded-2xl bg-white p-6 shadow lg:col-span-1">
                        <h2 className="mb-4 text-2xl font-semibold">
                            Підсумок
                        </h2>

                        <div className="space-y-3 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>Послуга:</span>
                                <span className="text-right font-medium">
                                    {selectedService?.title ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Майстер:</span>
                                <span className="font-medium">
                                    {selectedMaster?.name ?? '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Дата:</span>
                                <span className="font-medium">
                                    {date || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Час:</span>
                                <span className="font-medium">
                                    {time || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Тривалість:</span>
                                <span className="font-medium">
                                    {selectedService
                                        ? `${selectedService.duration} хв`
                                        : '—'}
                                </span>
                            </div>
                            <hr />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Разом:</span>
                                <span>
                                    {selectedService
                                        ? formatPrice(selectedService.price)
                                        : '—'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleBook}
                            disabled={
                                submitting ||
                                !selectedService ||
                                !selectedMaster ||
                                !date ||
                                !time ||
                                !name ||
                                !email ||
                                !phone
                            }
                            className="mt-6 w-full rounded-lg bg-black py-3 font-medium text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {submitting
                                ? 'Відправлення...'
                                : 'Підтвердити бронювання'}
                        </button>

                        <button
                            onClick={handleClear}
                            className="mt-3 w-full rounded-lg border py-2 text-sm hover:bg-gray-50"
                        >
                            Очистити
                        </button>

                        <p className="mt-4 text-xs text-gray-400">
                            Підтверджуючи, ви погоджуєтесь з нашими{' '}
                            <a href="#" className="underline">
                                умовами
                            </a>
                            .
                        </p>
                    </aside>

                    <div className="lg:col-span-3">
                        <footer className="mt-6 rounded-2xl bg-white p-6 text-center shadow">
                            <p className="text-sm text-gray-600">
                                Хочете керувати своїми записами? &nbsp;
                                <a
                                    href={login().url}
                                    className="font-medium underline"
                                >
                                    Увійдіть
                                </a>
                                &nbsp;або&nbsp;
                                <a
                                    href={register().url}
                                    className="font-medium underline"
                                >
                                    Зареєструйтесь
                                </a>
                            </p>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}