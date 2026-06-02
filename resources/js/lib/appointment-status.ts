export type Status = 'pending' | 'confirmed' | 'cancelled' | 'done';

export const statusLabels: Record<Status, string> = {
    pending: 'Очікує',
    confirmed: 'Підтверджено',
    cancelled: 'Скасовано',
    done: 'Виконано',
};

export const statusClasses: Record<Status, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    done: 'bg-gray-100 text-gray-700',
};
