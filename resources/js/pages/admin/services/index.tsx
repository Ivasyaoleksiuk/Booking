import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { services_create, services_destroy, services_edit, services_index } from '@/routes';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Послуги',
        href: services_index().url,
    },
];

export default function Appointments({ services }) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const handleDeleteService = (serviceId: number) => {
        if (!confirm('Ви впевнені, що хочете видалити цю послугу?')) {
            return;
        }

        router.delete(services_destroy(serviceId).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Послуги" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-end">
                    <Link
                        href={services_create().url}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white"
                    >
                        <Plus size={16} />
                        Створити Послугу
                    </Link>
                </div>

                {/* Error */}
                {errors.service && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.service}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-4 py-3">Назва</th>
                                <th className="px-4 py-3">Тривалість</th>
                                <th className="px-4 py-3">Ціна</th>
                                <th className="px-4 py-3">Створено</th>
                                <th className="px-4 py-3 text-right">Дії</th>
                            </tr>
                        </thead>

                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id} className="border-t">
                                    <td className="px-4 py-3 font-medium">
                                        {service.title}
                                    </td>

                                    <td className="px-4 py-3">
                                        {service.duration} хв
                                    </td>

                                    <td className="px-4 py-3">
                                        {formatPrice(service.price)}
                                    </td>

                                    <td className="px-4 py-3 text-gray-500">
                                        {new Date(
                                            service.created_at,
                                        ).toLocaleDateString()}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex gap-2">
                                            <Link
                                                href={
                                                    services_edit(service.id)
                                                        .url
                                                }
                                                className="rounded p-2 hover:bg-gray-100"
                                            >
                                                <Pencil size={16} />
                                            </Link>

                                            <button
                                                className="rounded p-2 text-red-600 hover:bg-red-50"
                                                onClick={() => {handleDeleteService(service.id);}}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {services.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            No services found
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
