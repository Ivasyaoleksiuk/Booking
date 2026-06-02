import AppLayout from '@/layouts/app-layout';
import { appointments, dashboard, users } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Scissors, TrendingUp, Users, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Дашборд', href: dashboard().url },
];

interface Stats {
    appointmentsToday: number;
    mastersCount: number;
    clientsCount: number;
    monthlyRevenue: number;
    todayRevenue: number;
}

interface ChartEntry {
    date: string;
    count: number;
    revenue: number;
}

interface Props {
    stats: Stats;
    monthlyChart: ChartEntry[];
}


const statCards = (stats: Stats) => [
    {
        label: 'Записів сьогодні',
        value: stats.appointmentsToday,
        icon: CalendarDays,
        href: appointments().url,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
    },
    {
        label: 'Виручка сьогодні',
        value: formatPrice(stats.todayRevenue),
        icon: Wallet,
        href: appointments().url,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
    {
        label: 'Виручка за місяць',
        value: formatPrice(stats.monthlyRevenue),
        icon: TrendingUp,
        href: appointments().url,
        color: 'text-green-600',
        bg: 'bg-green-50',
    },
    {
        label: 'Майстри',
        value: stats.mastersCount,
        icon: Scissors,
        href: users().url,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
    },
    {
        label: 'Клієнти',
        value: stats.clientsCount,
        icon: Users,
        href: users().url,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
];

const monthName = new Date().toLocaleString('uk-UA', { month: 'long', year: 'numeric' });

export default function Dashboard({ stats, monthlyChart }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Дашборд" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {statCards(stats).map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.label}
                                href={card.href}
                                className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                            >
                                <div className={`rounded-lg p-2.5 ${card.bg}`}>
                                    <Icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs text-gray-500">{card.label}</p>
                                    <p className="text-xl font-bold leading-tight">{card.value}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Appointments chart */}
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold capitalize text-gray-700">
                            Записи — {monthName}
                        </h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={1}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={((value: number) => [value, 'Записів']) as any}
                                    labelFormatter={(label) => `Дата: ${label}`}
                                />
                                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Revenue chart */}
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-base font-semibold capitalize text-gray-700">
                            Виручка — {monthName}
                        </h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={1}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}к` : v}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={((value: number) => [formatPrice(value), 'Виручка']) as any}
                                    labelFormatter={(label) => `Дата: ${label}`}
                                />
                                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}