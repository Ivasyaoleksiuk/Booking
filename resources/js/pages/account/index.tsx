import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { type Status, statusClasses, statusLabels } from '@/lib/appointment-status';
import { formatPrice } from '@/lib/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarPlus,
    Clock,
    History,
    KeyRound,
    Mail,
    Phone,
    Plus,
    Star,
    User,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Мій кабінет', href: '/account' },
];

type Tab = 'upcoming' | 'history' | 'profile';

const LOYALTY_MILESTONE = 5;

interface ReviewData {
    rating: number;
    comment: string | null;
}

interface AppointmentItem {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    note: string | null;
    status: Status;
    master: { id: number; name: string };
    service: { id: number; title: string; price: string };
    review?: ReviewData | null;
}

interface Props {
    upcoming: AppointmentItem[];
    past: AppointmentItem[];
    completedVisits?: number;
}

const tabs: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'upcoming', label: 'Майбутні записи', icon: CalendarDays },
    { id: 'history',  label: 'Історія',         icon: History },
    { id: 'profile',  label: 'Мій профіль',      icon: User },
];

function makeGoogleCalendarUrl(appointment: AppointmentItem): string {
    const date  = appointment.date.replace(/-/g, '');
    const start = appointment.start_time.slice(0, 5).replace(':', '');
    const end   = appointment.end_time.slice(0, 5).replace(':', '');
    const params = new URLSearchParams({
        action:  'TEMPLATE',
        text:    appointment.service.title,
        dates:   `${date}T${start}00/${date}T${end}00`,
        details: `Майстер: ${appointment.master.name}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function makeIcsDataUrl(appointment: AppointmentItem): string {
    const date  = appointment.date.replace(/-/g, '');
    const start = appointment.start_time.slice(0, 5).replace(':', '');
    const end   = appointment.end_time.slice(0, 5).replace(':', '');
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Booking//UA',
        'BEGIN:VEVENT',
        `DTSTART:${date}T${start}00`,
        `DTEND:${date}T${end}00`,
        `SUMMARY:${appointment.service.title}`,
        `DESCRIPTION:Майстер: ${appointment.master.name}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
    return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}

function CalendarDropdown({ appointment }: { appointment: AppointmentItem }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
                title="Додати в календар"
            >
                <CalendarPlus className="h-3.5 w-3.5" />
                Календар
            </button>

            {open && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-44 overflow-hidden rounded-lg border bg-white shadow-lg">
                    <a
                        href={makeGoogleCalendarUrl(appointment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google Calendar
                    </a>
                    <div className="border-t" />
                    <a
                        href={makeIcsDataUrl(appointment)}
                        download={`${appointment.service.title}.ics`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.19 1.28-2.17 3.81.03 3.02 2.65 4.03 2.68 4.04l-.06.27zM13 3.5C13.73 2.67 14.94 2.04 15.94 2c.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple Calendar
                    </a>
                </div>
            )}
        </div>
    );
}

function masterInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function ReviewModal({
    appointment,
    open,
    onClose,
}: {
    appointment: AppointmentItem;
    open: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({ rating: 0, comment: '' });
    const [hovered, setHovered] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/account/appointments/${appointment.id}/review`, {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    const handleClose = () => { reset(); setHovered(0); onClose(); };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Оцінити візит</DialogTitle>
                </DialogHeader>
                <div className="mb-1 text-sm text-gray-500">
                    {appointment.service.title} · {appointment.master.name}
                </div>
                <form onSubmit={handleSubmit} className="mt-2 space-y-5">
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Ваша оцінка</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHovered(star)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setData('rating', star)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star className={`h-8 w-8 ${star <= (hovered || data.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Відгук <span className="font-normal text-gray-400">(необов'язково)</span>
                        </label>
                        <textarea
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            rows={4}
                            placeholder="Поділіться враженнями про майстра та послугу..."
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={handleClose} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                            Скасувати
                        </button>
                        <button type="submit" disabled={data.rating === 0 || processing} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition">
                            {processing ? 'Збереження...' : 'Надіслати відгук'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AppointmentCard({
    appointment,
    canCancel,
    showRepeat = false,
    showReview = false,
    showCalendar = false,
}: {
    appointment: AppointmentItem;
    canCancel: boolean;
    showRepeat?: boolean;
    showReview?: boolean;
    showCalendar?: boolean;
}) {
    const [reviewOpen, setReviewOpen] = useState(false);

    const handleCancel = () => {
        if (!confirm('Ви впевнені, що хочете скасувати цей запис?')) return;
        router.put(`/account/appointments/${appointment.id}/cancel`);
    };

    const handleRepeat = () => {
        router.visit('/account/book', {
            data: { service_id: appointment.service.id, master_id: appointment.master.id },
        });
    };

    return (
        <>
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white select-none">
                        {masterInitials(appointment.master.name)}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-semibold">{appointment.service.title}</p>
                        <p className="text-sm text-gray-500">{appointment.master.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            {new Date(appointment.date).toLocaleDateString('uk-UA', {
                                day: 'numeric', month: 'short', year: 'numeric',
                            })}{' '}· {appointment.start_time.slice(0, 5)}–{appointment.end_time.slice(0, 5)}
                        </p>
                        {appointment.review && (
                            <div className="mt-1 flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`h-3.5 w-3.5 ${s <= appointment.review!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                ))}
                                {appointment.review.comment && (
                                    <span className="ml-1.5 truncate text-xs italic text-gray-400">{appointment.review.comment}</span>
                                )}
                            </div>
                        )}
                        {appointment.note && (
                            <p className="mt-0.5 truncate text-xs italic text-gray-400">{appointment.note}</p>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatPrice(appointment.service.price)}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[appointment.status]}`}>
                            {statusLabels[appointment.status]}
                        </span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        {showCalendar && <CalendarDropdown appointment={appointment} />}
                        {showReview && !appointment.review && (
                            <button
                                onClick={() => setReviewOpen(true)}
                                className="inline-flex items-center gap-1 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-100"
                            >
                                <Star className="h-3.5 w-3.5" />
                                Оцінити
                            </button>
                        )}
                        {showRepeat && (
                            <button onClick={handleRepeat} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
                                Повторити
                            </button>
                        )}
                        {canCancel && (
                            <button onClick={handleCancel} className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50">
                                Скасувати
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showReview && (
                <ReviewModal appointment={appointment} open={reviewOpen} onClose={() => setReviewOpen(false)} />
            )}
        </>
    );
}

function LoyaltyBlock({ completedVisits }: { completedVisits: number }) {
    const safe       = Number.isFinite(completedVisits) ? completedVisits : 0;
    const progress   = safe % LOYALTY_MILESTONE;
    const remaining  = LOYALTY_MILESTONE - progress;
    const pct        = Math.round((progress / LOYALTY_MILESTONE) * 100);
    const isUnlocked = safe > 0 && progress === 0;
    const visits     = (n: number) => n === 1 ? 'візит' : n < 5 ? 'візити' : 'візитів';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-5 text-white shadow-md">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-8 right-16 h-20 w-20 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-xl">👑</span>
                        <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                            Програма лояльності
                        </span>
                    </div>

                    {isUnlocked ? (
                        <p className="mt-1 text-lg font-bold">
                            🎉 Вітаємо! Ваша знижка <span className="underline decoration-dotted">10%</span> активна
                        </p>
                    ) : (
                        <p className="mt-1 text-base font-bold">
                            До знижки{' '}
                            <span className="rounded-md bg-white/20 px-1.5 py-0.5">10%</span>
                            {' '}залишилося{' '}
                            <span className="underline decoration-dotted">{remaining} {visits(remaining)}</span>
                        </p>
                    )}

                    <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs opacity-80">
                            <span>{safe} завершено</span>
                            <span>{progress} / {LOYALTY_MILESTONE}</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/30">
                            <div
                                className="h-full rounded-full bg-white shadow-sm transition-all duration-700"
                                style={{ width: isUnlocked ? '100%' : `${pct}%` }}
                            />
                        </div>
                        <div className="mt-1.5 flex justify-between px-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="flex flex-col items-center gap-0.5">
                                    <div className={`h-1.5 w-1.5 rounded-full ${n <= progress || isUnlocked ? 'bg-white' : 'bg-white/40'}`} />
                                    <span className="text-[10px] opacity-70">{n}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 text-right text-4xl font-black opacity-20 select-none">
                    10%
                </div>
            </div>
        </div>
    );
}

export default function AccountDashboard({ upcoming, past, completedVisits = 0 }: Props) {
    const { flash, auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [activeTab, setActiveTab] = useState<Tab>('upcoming');
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setSuccessMsg(flash.success);
            const t = setTimeout(() => setSuccessMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    const next        = upcoming[0] ?? null;
    const totalVisits = upcoming.length + past.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Мій кабінет" />

            <div className="flex flex-col gap-4 p-6">

                {/* Success banner */}
                {successMsg && (
                    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <span>✓ {successMsg}</span>
                        <button onClick={() => setSuccessMsg(null)} className="text-green-600 hover:text-green-800">✕</button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Мої записи</h1>
                    <button
                        onClick={() => router.visit('/account/book')}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Записатися
                    </button>
                </div>

                {/* Loyalty */}
                <LoyaltyBlock completedVisits={completedVisits} />

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Найближчий запис</p>
                            {next ? (
                                <>
                                    <p className="truncate font-semibold text-gray-900">
                                        {new Date(next.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                                    </p>
                                    <p className="text-xs text-gray-500">{next.start_time.slice(0, 5)} · {next.service.title}</p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Немає записів</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border bg-white px-5 py-4 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50">
                            <History className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Всього візитів</p>
                            <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
                            <p className="text-xs text-gray-500">{past.filter(a => a.status === 'done').length} завершено</p>
                        </div>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 border-b">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition -mb-px ${
                                    isActive ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab: Upcoming */}
                {activeTab === 'upcoming' && (
                    <section>
                        {upcoming.length === 0 ? (
                            <div className="rounded-xl border bg-white p-10 text-center text-gray-500 shadow-sm">
                                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                <p className="font-medium">Немає запланованих записів</p>
                                <p className="mt-1 text-sm">Запишіться на процедуру прямо зараз</p>
                                <button
                                    onClick={() => router.visit('/account/book')}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Записатися
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {upcoming.map((appt) => (
                                    <AppointmentCard
                                        key={appt.id}
                                        appointment={appt}
                                        canCancel={appt.status !== 'cancelled' && appt.status !== 'done'}
                                        showCalendar
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Tab: History */}
                {activeTab === 'history' && (
                    <section>
                        {past.length === 0 ? (
                            <div className="rounded-xl border bg-white p-10 text-center text-gray-500 shadow-sm">
                                <History className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                <p className="font-medium">Історія порожня</p>
                                <p className="mt-1 text-sm">Завершені та скасовані записи з'являться тут</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {past.map((appt) => (
                                    <AppointmentCard
                                        key={appt.id}
                                        appointment={appt}
                                        canCancel={false}
                                        showRepeat
                                        showReview={appt.status === 'done'}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Tab: Profile */}
                {activeTab === 'profile' && (
                    <section className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-base font-semibold">Особисті дані</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                        <User className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Ім'я</p>
                                        <p className="font-medium">{user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                        {!user.email_verified_at && (
                                            <span className="text-xs text-yellow-600">Не підтверджено</span>
                                        )}
                                    </div>
                                </div>
                                {user.phone && (
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Телефон</p>
                                            <p className="font-medium">{user.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                        <CalendarDays className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Клієнт з</p>
                                        <p className="font-medium">
                                            {new Date(user.created_at).toLocaleDateString('uk-UA', {
                                                day: 'numeric', month: 'long', year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-base font-semibold">Налаштування</h3>
                            <div className="space-y-2">
                                <Link href="/settings/profile" className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium hover:bg-gray-50 transition">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Редагувати профіль
                                </Link>
                                <Link href="/settings/password" className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium hover:bg-gray-50 transition">
                                    <KeyRound className="h-4 w-4 text-gray-500" />
                                    Змінити пароль
                                </Link>
                            </div>
                            <hr className="my-4" />
                            <h3 className="mb-3 text-base font-semibold">Статистика</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-blue-50 p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-700">{upcoming.length}</p>
                                    <p className="text-xs text-blue-600">Майбутніх</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 p-3 text-center">
                                    <p className="text-2xl font-bold text-gray-700">{past.length}</p>
                                    <p className="text-xs text-gray-500">У історії</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Support block */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🕐</span>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Запізнюєтесь?</p>
                            <p className="text-xs text-gray-500">Зв'яжіться з нами — попередимо майстра</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <a href="tel:+380680492868" className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition">
                            068 049 28 68
                        </a>
                        <a
                            href="https://t.me/Ivanna_Oleksiuk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#29A8EB] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
                            </svg>
                            Telegram
                        </a>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
