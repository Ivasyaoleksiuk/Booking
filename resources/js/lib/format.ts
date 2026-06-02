export const formatPrice = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('uk-UA', {
        style:                 'currency',
        currency:              'UAH',
        maximumFractionDigits: 0,
    }).format(num);
};
