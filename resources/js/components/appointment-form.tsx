import { appointments, appointments_slots, schedule } from '@/routes';
import { Autocomplete, TextField } from '@mui/material';
import { Form, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { type Status, statusLabels } from '@/lib/appointment-status';

export interface Person {
    id: number;
    name: string;
}

export interface ServiceOption {
    id: number;
    title: string;
    duration: number;
}

export interface AppointmentFormData {
    client_id: string;
    master_id: string;
    service_id: string;
    date: string;
    start_time: string;
    note: string;
    status?: string;
}

interface Props {
    data: AppointmentFormData;
    setData: (key: string, value: string) => void;
    errors: Partial<Record<string, string>>;
    clients: Person[];
    masters: Person[];
    services: ServiceOption[];
    formAction: string;
    formMethod: 'POST' | 'PUT';
    appointmentId?: number;
    clearStartTimeOnChange?: boolean;
    showStatus?: boolean;
    showScheduleLinks?: boolean;
}

const inputClass =
    'mt-1 block w-full rounded-lg border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500';

export function AppointmentForm({
    data,
    setData,
    errors,
    clients,
    masters,
    services,
    formAction,
    formMethod,
    appointmentId,
    clearStartTimeOnChange = false,
    showStatus = false,
    showScheduleLinks = false,
}: Props) {
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        if (!data.master_id || !data.date || !data.service_id) {
            setSlots([]);
            if (clearStartTimeOnChange) setData('start_time', '');
            return;
        }

        setLoadingSlots(true);
        if (clearStartTimeOnChange) setData('start_time', '');

        const url = new URL(appointments_slots().url, window.location.origin);
        url.searchParams.set('master_id', data.master_id);
        url.searchParams.set('date', data.date);
        url.searchParams.set('service_id', data.service_id);
        if (appointmentId) url.searchParams.set('appointment_id', String(appointmentId));

        fetch(url.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((s: string[]) => setSlots(s))
            .finally(() => setLoadingSlots(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.master_id, data.date, data.service_id, appointmentId, clearStartTimeOnChange]);

    const slotsReady = data.master_id && data.date && data.service_id;

    return (
        <Form action={formAction} method={formMethod} className="space-y-5">
            {/* Client */}
            <div>
                <Autocomplete
                    options={clients}
                    getOptionLabel={(o) => o.name}
                    value={clients.find((c) => String(c.id) === data.client_id) ?? null}
                    onChange={(_, value) => setData('client_id', value ? String(value.id) : '')}
                    renderInput={(params) => (
                        <TextField {...params} label="Клієнт" size="small" fullWidth />
                    )}
                />
                <input type="hidden" name="client_id" value={data.client_id} />
                {errors.client_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                )}
            </div>

            {/* Master */}
            <div>
                <Autocomplete
                    options={masters}
                    getOptionLabel={(o) => o.name}
                    value={masters.find((m) => String(m.id) === data.master_id) ?? null}
                    onChange={(_, value) => setData('master_id', value ? String(value.id) : '')}
                    renderInput={(params) => (
                        <TextField {...params} label="Майстер" size="small" fullWidth />
                    )}
                />
                <input type="hidden" name="master_id" value={data.master_id} />
                {errors.master_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.master_id}</p>
                )}
            </div>

            {/* Service */}
            <div>
                <label htmlFor="service_id" className="block text-sm font-medium text-gray-700">
                    Послуга
                </label>
                <select
                    id="service_id"
                    name="service_id"
                    value={data.service_id}
                    onChange={(e) => setData('service_id', e.target.value)}
                    className={inputClass}
                >
                    <option value="">— Оберіть послугу —</option>
                    {services.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title} ({s.duration} хв)
                        </option>
                    ))}
                </select>
                {errors.service_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.service_id}</p>
                )}
            </div>

            {/* Date */}
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Дата
                </label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={data.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setData('date', e.target.value)}
                    className={inputClass}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* Time slots */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Час початку</label>
                {!slotsReady ? (
                    <p className="mt-1 text-sm text-gray-400">Оберіть майстра, дату та послугу</p>
                ) : loadingSlots ? (
                    <p className="mt-1 text-sm text-gray-400">Завантаження...</p>
                ) : slots.length === 0 ? (
                    <div className="mt-1 space-y-1">
                        <p className="text-sm text-red-500">Немає доступних слотів на цю дату</p>
                        {showScheduleLinks && (
                            <div className="flex flex-col gap-1 text-sm">
                                <Link
                                    href={schedule({ selectedMasterId: data.master_id }).url}
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    Переглянути розклад майстра
                                </Link>
                                <Link
                                    href={schedule({ selectedMasterId: data.master_id, date: data.date }).url}
                                    className="text-blue-600 underline hover:text-blue-800"
                                >
                                    Створити розклад для майстра на {data.date}
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <select
                        id="start_time"
                        name="start_time"
                        value={data.start_time}
                        onChange={(e) => setData('start_time', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">— Оберіть час —</option>
                        {slots.map((slot) => (
                            <option key={slot} value={slot}>
                                {slot}
                            </option>
                        ))}
                    </select>
                )}
                {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                )}
            </div>

            {/* Status (edit only) */}
            {showStatus && (
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Статус
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={data.status ?? ''}
                        onChange={(e) => setData('status', e.target.value)}
                        className={inputClass}
                    >
                        {(Object.keys(statusLabels) as Status[]).map((s) => (
                            <option key={s} value={s}>
                                {statusLabels[s]}
                            </option>
                        ))}
                    </select>
                    {errors.status && (
                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                    )}
                </div>
            )}

            {/* Note */}
            <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                    Примітка (необов'язково)
                </label>
                <textarea
                    id="note"
                    name="note"
                    rows={3}
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    className={inputClass}
                />
                {errors.note && <p className="mt-1 text-sm text-red-600">{errors.note}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
                <Link
                    href={appointments().url}
                    className="rounded-lg border px-4 py-2 hover:bg-accent"
                >
                    Назад
                </Link>
                <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700"
                >
                    Зберегти
                </button>
            </div>
        </Form>
    );
}