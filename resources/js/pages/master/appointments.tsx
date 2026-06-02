import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCheck,
    CircleX,
    Clock3,
    Loader2,
    MessageSquare,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { type Status, statusClasses, statusLabels } from '@/lib/appointment-status';
import { appointments, updateStatus } from '@/actions/App/Http/Controllers/Master/MasterController';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Мої записи', href: appointments().url },
];

interface Appointment {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    note: string | null;
    status: Status;
    customer: { id: number; name: string; phone?: string | null };
    service: { id: number; title: string; duration: number; price: number };
    review?: { rating: number; comment: string | null } | null;
}

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    client: { name: string };
    service: { title: string };
}

interface WeekDay {
    date: string;
    appointments: {
        id: number;
        start_time: string;
        end_time: string;
        status: Status;
        customer: { name: string };
        service: { title: string };
    }[];
}

interface Stats {
    today: number;
    week: number;
    done: number;
    pending: number;
    avgRating: number;
    totalReviews: number;
    firstPendingDate: string | null;
}

interface Props {
    appointments: Appointment[];
    date: string;
    stats: Stats;
    reviews: Review[];
    upcomingWeek: WeekDay[];
}

type Tab = 'today' | 'week' | 'reviews';

const today = new Date().toISOString().slice(0, 10);

const nextStatuses: Record<string, { label: string; value: string } | null> = {
    pending:   { label: 'Підтвердити', value: 'confirmed' },
    confirmed: { label: 'Виконано',    value: 'done' },
    done:      null,
    cancelled: null,
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={size}
                    className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                />
            ))}
        </div>
    );
}

export default function MasterAppointments({
    appointments: items,
    date,
    stats,
    reviews,
    upcomingWeek,
}: Props) {
    const [activeTab, setActiveTab]   = useState<Tab>('today');
    const [processing, setProcessing] = useState<number | null>(null);

    const handleDateChange = (value: string) => {
        router.get(appointments().url, { date: value || today }, { preserveState: true });
        setActiveTab('today');
    };

    const handleStatus = (appointment: Appointment, status: string) => {
        if (processing) return;
        setProcessing(appointment.id);
        router.patch(
            updateStatus(appointment).url,
            { status },
            {
                preserveState: true,
                onSuccess: () => setProcessing(null),
                onError:   () => setProcessing(null),
            },
        );
    };

    const handleCancel = (appointment: Appointment) => {
        if (processing || !confirm('Скасувати цей запис?')) return;
        setProcessing(appointment.id);
        router.patch(
            updateStatus(appointment).url,
            { status: 'cancelled' },
            {
                preserveState: true,
                onSuccess: () => setProcessing(null),
                onError:   () => setProcessing(null),
            },
        );
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'today',   label: 'Сьогодні',  icon: <Clock3 size={15} /> },
        { id: 'week',    label: 'Тиждень',   icon: <CalendarDays size={15} /> },
        { id: 'reviews', label: `Відгуки ${stats.totalReviews > 0 ? `(${stats.totalReviews})` : ''}`, icon: <MessageSquare size={15} /> },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Мої записи" />

            <div className="flex flex-col gap-5 p-6">

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <Clock3 size={18} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Сьогодні</p>
                            <p className="text-xl font-bold text-gray-900">{stats.today}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                            <CalendarDays size={18} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Цей тиждень</p>
                            <p className="text-xl font-bold text-gray-900">{stats.week}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                            <TrendingUp size={18} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Виконано</p>
                            <p className="text-xl font-bold text-gray-900">{stats.done}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50">
                            <Star size={18} className="text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Рейтинг</p>
                            <p className="text-xl font-bold text-gray-900">
                                {stats.avgRating > 0 ? stats.avgRating : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pending alert */}
                {stats.pending > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                        <Users size={18} className="shrink-0 text-orange-500" />
                        <p className="text-sm text-orange-800">
                            <span className="font-semibold">{stats.pending}</span>{' '}
                            {stats.pending === 1 ? 'запис очікує' : 'записів очікують'} підтвердження
                        </p>
                        <button
                            onClick={() => {
                                if (stats.firstPendingDate) {
                                    handleDateChange(stats.firstPendingDate);
                                }
                                setActiveTab('today');
                            }}
                            className="ml-auto shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
                        >
                            Переглянути
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                                activeTab === tab.id
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab: Today */}
                {activeTab === 'today' && (
                    <section>
                        <div className="mb-4 flex items-center gap-3">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <span className="text-sm text-gray-500">
                                {new Date(date + 'T00:00').toLocaleDateString('uk-UA', {
                                    weekday: 'long', day: 'numeric', month: 'long',
                                })}
                            </span>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center text-gray-400">
                                <Clock3 size={40} className="mb-3 text-gray-200" />
                                <p className="font-medium text-gray-600">На цей день записів немає</p>
                                <p className="mt-1 text-sm">Виберіть іншу дату або зачекайте нових бронювань</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {items.map((appt) => {
                                    const next = nextStatuses[appt.status];
                                    return (
                                        <div key={appt.id} className="flex items-start justify-between rounded-xl border bg-white p-5 shadow-sm">
                                            <div className="flex gap-4">
                                                <div className="flex w-20 flex-col items-center justify-center rounded-lg bg-gray-50 p-2 text-center">
                                                    <span className="text-lg font-bold leading-none">
                                                        {appt.start_time.slice(0, 5)}
                                                    </span>
                                                    <span className="mt-1 text-xs text-gray-400">
                                                        {appt.end_time.slice(0, 5)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-gray-900">{appt.service.title}</p>
                                                    <p className="mt-0.5 text-sm text-gray-600">
                                                        {appt.customer.name}
                                                        {appt.customer.phone && (
                                                            <a href={`tel:${appt.customer.phone}`} className="ml-2 text-gray-400 hover:text-black">
                                                                {appt.customer.phone}
                                                            </a>
                                                        )}
                                                    </p>
                                                    {appt.note && (
                                                        <p className="mt-1 text-xs italic text-gray-400">{appt.note}</p>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[appt.status]}`}>
                                                            {statusLabels[appt.status]}
                                                        </span>
                                                        {appt.review && (
                                                            <StarRow rating={appt.review.rating} size={12} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 gap-2">
                                                {next && (
                                                    <button
                                                        onClick={() => handleStatus(appt, next.value)}
                                                        disabled={processing === appt.id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:bg-gray-800 disabled:opacity-50"
                                                    >
                                                        {processing === appt.id
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <CheckCheck size={14} />
                                                        }
                                                        {next.label}
                                                    </button>
                                                )}
                                                {appt.status !== 'cancelled' && appt.status !== 'done' && (
                                                    <button
                                                        onClick={() => handleCancel(appt)}
                                                        disabled={processing === appt.id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        <CircleX size={14} />
                                                        Скасувати
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* Tab: Week */}
                {activeTab === 'week' && (
                    <section>
                        {upcomingWeek.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center text-gray-400">
                                <CalendarDays size={40} className="mb-3 text-gray-200" />
                                <p className="font-medium text-gray-600">Найближчі 7 днів вільні</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {upcomingWeek.map((day) => (
                                    <div key={day.date} className="rounded-xl border bg-white shadow-sm">
                                        <div className="flex items-center justify-between border-b px-5 py-3">
                                            <p className="font-semibold text-gray-900">
                                                {new Date(day.date + 'T00:00').toLocaleDateString('uk-UA', {
                                                    weekday: 'long', day: 'numeric', month: 'long',
                                                })}
                                            </p>
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                                {day.appointments.length} {day.appointments.length === 1 ? 'запис' : 'записів'}
                                            </span>
                                        </div>
                                        <div className="divide-y">
                                            {day.appointments.map((appt) => (
                                                <div key={appt.id} className="flex items-center gap-4 px-5 py-3">
                                                    <span className="w-12 shrink-0 text-sm font-medium text-gray-700">
                                                        {appt.start_time.slice(0, 5)}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">{appt.service.title}</p>
                                                        <p className="text-xs text-gray-500">{appt.customer.name}</p>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[appt.status]}`}>
                                                        {statusLabels[appt.status]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Tab: Reviews */}
                {activeTab === 'reviews' && (
                    <section>
                        {reviews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center text-gray-400">
                                <Star size={40} className="mb-3 text-gray-200" />
                                <p className="font-medium text-gray-600">Відгуків ще немає</p>
                                <p className="mt-1 text-sm">Відгуки з'являться після завершених візитів</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {/* Rating summary */}
                                {stats.totalReviews > 0 && (
                                    <div className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm">
                                        <div className="text-center">
                                            <p className="text-4xl font-bold text-gray-900">{stats.avgRating}</p>
                                            <StarRow rating={Math.round(stats.avgRating)} size={16} />
                                            <p className="mt-1 text-xs text-gray-400">{stats.totalReviews} відгуків</p>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = reviews.filter(r => r.rating === star).length;
                                                const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span className="w-3">{star}</span>
                                                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="w-6 text-right">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Individual reviews */}
                                {reviews.map((review) => (
                                    <div key={review.id} className="rounded-xl border bg-white p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white">
                                                    {review.client.name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{review.client.name}</p>
                                                    {review.service.title && (
                                                        <p className="text-xs text-gray-400">{review.service.title}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <StarRow rating={review.rating} />
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {new Date(review.created_at).toLocaleDateString('uk-UA', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="mt-3 text-sm leading-relaxed text-gray-700">
                                                "{review.comment}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
