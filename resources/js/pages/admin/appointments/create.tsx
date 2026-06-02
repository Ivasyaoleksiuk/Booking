import AppLayout from '@/layouts/app-layout';
import { appointments, appointments_store } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AppointmentForm, type Person, type ServiceOption } from '@/components/appointment-form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Записи', href: appointments().url },
    { title: 'Новий запис', href: '#' },
];

interface Props {
    clients: Person[];
    masters: Person[];
    services: ServiceOption[];
}

export default function CreateAppointment({ clients, masters, services }: Props) {
    const { data, setData, errors } = useForm({
        client_id: '',
        master_id: '',
        service_id: '',
        date: '',
        start_time: '',
        note: '',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Новий запис" />
            <div className="p-6">
                <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
                    <AppointmentForm
                        data={data}
                        setData={setData as (key: string, value: string) => void}
                        errors={errors}
                        clients={clients}
                        masters={masters}
                        services={services}
                        formAction={appointments_store().url}
                        formMethod="POST"
                        clearStartTimeOnChange
                        showScheduleLinks
                    />
                </div>
            </div>
        </AppLayout>
    );
}