import AppLayout from '@/layouts/app-layout';
import { appointments, appointments_update } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AppointmentForm, type Person, type ServiceOption } from '@/components/appointment-form';
import { type Status } from '@/lib/appointment-status';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Записи', href: appointments().url },
    { title: 'Редагувати запис', href: '#' },
];

interface Appointment {
    id: number;
    client_id: number;
    master_id: number;
    service_id: number;
    date: string;
    start_time: string;
    note: string | null;
    status: Status;
}

interface Props {
    appointment: Appointment;
    clients: Person[];
    masters: Person[];
    services: ServiceOption[];
}

export default function EditAppointment({ appointment, clients, masters, services }: Props) {
    const { data, setData, errors } = useForm({
        client_id: String(appointment.client_id),
        master_id: String(appointment.master_id),
        service_id: String(appointment.service_id),
        date: appointment.date,
        start_time: appointment.start_time.slice(0, 5),
        note: appointment.note ?? '',
        status: appointment.status,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Редагувати запис" />
            <div className="p-6">
                <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
                    <AppointmentForm
                        data={data}
                        setData={setData as (key: string, value: string) => void}
                        errors={errors}
                        clients={clients}
                        masters={masters}
                        services={services}
                        formAction={appointments_update(appointment).url}
                        formMethod="PUT"
                        appointmentId={appointment.id}
                        showStatus
                    />
                </div>
            </div>
        </AppLayout>
    );
}