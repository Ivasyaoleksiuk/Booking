import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { formatPrice } from '@/lib/format';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Мій кабінет', href: '/account' },
    { title: 'Новий запис', href: '/account/book' },
];

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

export default function AccountBook({ services }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        service_id: '',
        master_id: '',
        date: '',
        start_time: '',
        note: '',
    });

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [nearestDate, setNearestDate] = useState<string | null>(null);
    const [loadingNearest, setLoadingNearest] = useState(false);

    const selectedMaster = selectedService?.masters.find((m) => String(m.id) === data.master_id) ?? null;

    // Pre-select service + master from query params (used by "Повторити запис")
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const serviceId = params.get('service_id');
        const masterId  = params.get('master_id');
        if (!serviceId) return;

        const svc = services.find((s) => String(s.id) === serviceId) ?? null;
        if (!svc) return;

        const resolvedMaster =
            masterId && svc.masters.some((m) => String(m.id) === masterId) ? masterId : '';

        setSelectedService(svc);
        setData('service_id', serviceId);
        setData('master_id', resolvedMaster);
    }, []);

    // Find nearest available date when service + master chosen
    useEffect(() => {
        if (!data.service_id || !data.master_id) {
            setNearestDate(null);
            return;
        }

        setLoadingNearest(true);
        const url = new URL('/nearest-date', window.location.origin);
        url.searchParams.set('master_id', data.master_id);
        url.searchParams.set('service_id', data.service_id);

        fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then(({ date: d }: { date: string | null }) => {
                setNearestDate(d);
                if (d && !data.date) setData('date', d);
            })
            .finally(() => setLoadingNearest(false));
    }, [data.service_id, data.master_id]);

    // Load time slots when master + date + service are set
    useEffect(() => {
        if (!data.master_id || !data.date || !data.service_id) {
            setSlots([]);
            setData('start_time', '');
            return;
        }

        setLoadingSlots(true);
        setData('start_time', '');

        const url = new URL('/slots', window.location.origin);
        url.searchParams.set('master_id', data.master_id);
        url.searchParams.set('date', data.date);
        url.searchParams.set('service_id', data.service_id);

        fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((s: string[]) => setSlots(s))
            .finally(() => setLoadingSlots(false));
    }, [data.master_id, data.date, data.service_id]);

    const handleServiceSelect = (service: Service) => {
        setSelectedService(service);
        setData('service_id', String(service.id));
        setData('master_id', '');
        setData('date', '');
        setData('start_time', '');
        setSlots([]);
        setNearestDate(null);
    };

    const handleMasterSelect = (masterId: string) => {
        setData('master_id', masterId);
        setData('date', '');
        setData('start_time', '');
        setSlots([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/account/appointments');
    };

    const canSubmit =
        data.service_id && data.master_id && data.date && data.start_time && !processing;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Новий запис" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Новий запис</h1>
                    <button
                        type="button"
                        onClick={() => router.visit('/account')}
                        className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        ← Назад
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Col 1 — Service + Master */}
                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold">Оберіть послугу</h2>
                            <div className="space-y-2">
                                {services.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleServiceSelect(s)}
                                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                                            data.service_id === String(s.id)
                                                ? 'border-black bg-gray-50 shadow-sm'
                                                : 'border-gray-100 hover:shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-medium">{s.title}</div>
                                            {s.description && (
                                                <div className="text-xs text-gray-500">{s.description}</div>
                                            )}
                                        </div>
                                        <div className="ml-3 shrink-0 text-right">
                                            <div className="font-semibold text-sm">{formatPrice(s.price)}</div>
                                            <div className="text-xs text-gray-400">{s.duration} хв</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {errors.service_id && (
                                <p className="mt-2 text-sm text-red-600">{errors.service_id}</p>
                            )}

                            {selectedService && (
                                <>
                                    <hr className="my-4" />
                                    <h2 className="mb-3 text-base font-semibold">Оберіть майстра</h2>
                                    {selectedService.masters.length === 0 ? (
                                        <p className="text-sm text-gray-400">Майстрів для цієї послуги немає</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedService.masters.map((m) => (
                                                <label
                                                    key={m.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-2 hover:bg-gray-50"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="master_id"
                                                        value={m.id}
                                                        checked={data.master_id === String(m.id)}
                                                        onChange={() => handleMasterSelect(String(m.id))}
                                                    />
                                                    <span className="font-medium">{m.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {errors.master_id && (
                                        <p className="mt-2 text-sm text-red-600">{errors.master_id}</p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Col 2 — Date + Time */}
                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-2 text-base font-semibold">Дата та час</h2>

                            {!data.master_id ? (
                                <p className="text-sm text-gray-400">Спочатку оберіть послугу та майстра</p>
                            ) : (
                                <>
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
                                        <DateCalendar
                                            value={data.date ? dayjs(data.date) : null}
                                            onChange={(val: Dayjs | null) => {
                                                setData('date', val?.format('YYYY-MM-DD') ?? '');
                                            }}
                                            minDate={dayjs()}
                                            sx={{ width: '100%', mx: 0 }}
                                        />
                                    </LocalizationProvider>

                                    {loadingNearest && (
                                        <p className="text-xs text-gray-400">Шукаємо найближчу дату...</p>
                                    )}
                                    {!loadingNearest && nearestDate === null && data.master_id && (
                                        <p className="text-xs text-red-500">Немає доступних дат у цього майстра</p>
                                    )}
                                    {errors.date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                                    )}

                                    <div className="mt-2">
                                        <p className="mb-2 text-sm font-medium text-gray-700">Час початку</p>
                                        {!data.date ? (
                                            <p className="text-sm text-gray-400">Оберіть дату</p>
                                        ) : loadingSlots ? (
                                            <p className="text-sm text-gray-400">Завантаження...</p>
                                        ) : slots.length === 0 ? (
                                            <p className="text-sm text-red-500">Немає вільних слотів на цю дату</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {slots.map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setData('start_time', s)}
                                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                                            data.start_time === s
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
                                            <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Col 3 — Summary + Note + Submit */}
                        <div className="rounded-xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold">Підсумок</h2>

                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span>Послуга:</span>
                                    <span className="font-medium text-right">
                                        {selectedService?.title ?? '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Майстер:</span>
                                    <span className="font-medium">{selectedMaster?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Дата:</span>
                                    <span className="font-medium">
                                        {data.date
                                            ? new Date(data.date).toLocaleDateString('uk-UA', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric',
                                              })
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Час:</span>
                                    <span className="font-medium">{data.start_time || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Тривалість:</span>
                                    <span className="font-medium">
                                        {selectedService ? `${selectedService.duration} хв` : '—'}
                                    </span>
                                </div>
                                <hr />
                                <div className="flex justify-between text-base font-semibold">
                                    <span>Разом:</span>
                                    <span>{selectedService ? formatPrice(selectedService.price) : '—'}</span>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Примітка (необов'язково)
                                </label>
                                <textarea
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    rows={3}
                                    placeholder="Побажання або коментар..."
                                    className="w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                {errors.note && (
                                    <p className="mt-1 text-sm text-red-600">{errors.note}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="mt-4 w-full rounded-lg bg-black py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {processing ? 'Збереження...' : 'Підтвердити запис'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
