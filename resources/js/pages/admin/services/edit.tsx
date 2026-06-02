import AppLayout from '@/layouts/app-layout';
import { services_index, services_update } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

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
    image: string | null;
    masters: Master[];
}

interface Props {
    service: Service;
    masters: Master[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Редагувати послугу',
        href: services_index().url,
    },
];

export default function EditService({ service, masters }: Props) {

    const { data, setData, errors } = useForm({
        title:       service.title,
        description: service.description ?? '',
        duration:    service.duration,
        price:       service.price,
        image:       null as File | null,
    });

    const [selectedMasterIds, setSelectedMasterIds] = useState<number[]>(
        service.masters.map((m) => m.id),
    );

    const toggleMaster = (id: number) => {
        setSelectedMasterIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
        );
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500';


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Редагувати послугу" />

            <div className="p-6">
                <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
                    <Form
                        action={services_update(service.id).url}
                        method="PUT"
                        className="space-y-5"
                    >
                        {/* Title */}
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Назва послуги
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={data.title}
                                onChange={handleChange}
                                className={inputClass}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Опис
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={data.description}
                                onChange={handleChange}
                                className={inputClass}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Duration + Price — two columns */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="duration"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Тривалість (хв)
                                </label>
                                <input
                                    type="number"
                                    id="duration"
                                    name="duration"
                                    min={1}
                                    value={data.duration}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                                {errors.duration && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.duration}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="price"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Ціна (₴)
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    min={0}
                                    step="0.01"
                                    value={data.price}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                                {errors.price && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.price}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Фото послуги
                                <span className="ml-1 text-xs font-normal text-gray-400">(до 2 МБ)</span>
                            </label>
                            {service.image && (
                                <img
                                    src={`/storage/${service.image}`}
                                    alt={service.title}
                                    className="mb-2 h-24 w-24 rounded-lg object-cover"
                                />
                            )}
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={(e) => setData('image', e.target.files?.[0] ?? null)}
                                className="mt-1 block w-full rounded-lg border p-2 text-sm"
                            />
                            {errors.image && (
                                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                            )}
                        </div>

                        {/* Masters */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Майстри
                            </label>
                            {selectedMasterIds.map((id) => (
                                <input key={id} type="hidden" name="master_ids[]" value={id} />
                            ))}
                            {masters.length === 0 ? (
                                <p className="text-sm text-gray-400">Майстрів поки немає</p>
                            ) : (
                                <div className="space-y-2">
                                    {masters.map((m) => (
                                        <label
                                            key={m.id}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMasterIds.includes(m.id)}
                                                onChange={() => toggleMaster(m.id)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{m.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-2">
                            <Link
                                href={services_index().url}
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
                </div>
            </div>
        </AppLayout>
    );
}
