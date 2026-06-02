import AppLayout from '@/layouts/app-layout';
import { appointments as appointmentsRoute, appointments_create, appointments_destroy, appointments_edit, appointments_status, users_edit } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCheck, Pencil, Plus, Trash2, X } from 'lucide-react';
import { type Status, statusClasses, statusLabels } from '@/lib/appointment-status';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Записи', href: appointmentsRoute().url },
];

interface Appointment {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    note: string | null;
    status: Status;
    customer: { id: number; name: string };
    master: { id: number; name: string };
    service: { id: number; title: string };
}

interface Master {
    id: number;
    name: string;
}

interface Props {
    appointments: Appointment[];
    date: string;
    master_id: string;
    masters: Master[];
}


const today = new Date().toISOString().slice(0, 10);

export default function Appointments({ appointments, date, master_id, masters }: Props) {
    const applyFilters = (patch: Record<string, string>) => {
        router.get(
            appointmentsRoute().url,
            { date: date || today, master_id, ...patch },
            { preserveState: true },
        );
    };

    const handleDateChange = (value: string) => applyFilters({ date: value || today });
    const handleMasterChange = (value: string) => applyFilters({ master_id: value });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Записи" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        />
                        <select
                            value={master_id}
                            onChange={(e) => handleMasterChange(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            <option value="">Всі майстри</option>
                            {masters.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {(date || master_id) && (
                            <button
                                onClick={() => applyFilters({ date: '', master_id: '' })}
                                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                            >
                                <X size={14} />
                                Скинути
                            </button>
                        )}
                    </div>
                    <Link
                        href={appointments_create().url}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white"
                    >
                        <Plus size={16} />
                        Новий запис
                    </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3">Клієнт</th>
                                <th className="px-4 py-3">Майстер</th>
                                <th className="px-4 py-3">Послуга</th>
                                <th className="px-4 py-3">Дата</th>
                                <th className="px-4 py-3">Час</th>
                                <th className="px-4 py-3">Статус</th>
                                <th className="px-4 py-3 text-right">Дії</th>
                            </tr>
                        </thead>

                        <tbody>
                            {appointments.map((appointment) => (
                                <tr key={appointment.id} className="border-t">
                                    <td className="px-4 py-3 font-medium">
                                        <Link
                                            href={users_edit(appointment.customer).url}
                                            className="hover:underline"
                                        >
                                            {appointment.customer.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={users_edit(appointment.master).url}
                                            className="hover:underline"
                                        >
                                            {appointment.master.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        {appointment?.service?.title}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(
                                            appointment.date,
                                        ).toLocaleDateString('uk-UA')}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {appointment.start_time.slice(0, 5)}–
                                        {appointment.end_time.slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[appointment.status]}`}
                                        >
                                            {statusLabels[appointment.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {appointment.status === 'pending' && (
                                                <button
                                                    title="Підтвердити"
                                                    onClick={() =>
                                                        router.patch(
                                                            appointments_status(appointment).url,
                                                            { status: 'confirmed' },
                                                            { preserveState: true },
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                                                >
                                                    <CheckCheck size={13} />
                                                    Підтвердити
                                                </button>
                                            )}
                                            {appointment.status === 'confirmed' && (
                                                <button
                                                    title="Позначити виконаним"
                                                    onClick={() =>
                                                        router.patch(
                                                            appointments_status(appointment).url,
                                                            { status: 'done' },
                                                            { preserveState: true },
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                                                >
                                                    <CheckCheck size={13} />
                                                    Виконано
                                                </button>
                                            )}
                                            <Link
                                                href={appointments_edit(appointment).url}
                                                className="inline-flex rounded p-2 hover:bg-gray-100"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                className="inline-flex rounded p-2 text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('Видалити цей запис?')) {
                                                        router.delete(appointments_destroy(appointment).url);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {appointments.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            На вибрану дату немає доступних записів.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}