import 'react-day-picker/style.css';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    schedule as scheduleRoute,
    saveSchedule,
    deleteSchedule,
} from '@/actions/App/Http/Controllers/Master/MasterController';
import { type BreadcrumbItem, type Schedule } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import {
    DateCalendar,
    LocalizationProvider,
    PickersDay,
    type PickersDayProps,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Button } from '@mui/material';
import { Textarea } from '@mui/joy';
import { CustomDigitalClock } from '@/components/custom-digital-clock';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Мій розклад', href: scheduleRoute().url },
];

// ─── Custom day cell ──────────────────────────────────────────────────────────
interface RangeDayProps extends PickersDayProps {
    workingDays?: Dayjs[];
    rangeStart?:  Dayjs | null;
    rangeEnd?:    Dayjs | null;
    onSelect?:    (day: Dayjs) => void;
}

function RangeDay({
    day,
    workingDays = [],
    rangeStart,
    rangeEnd,
    onSelect,
    ...other
}: RangeDayProps) {
    const isWorking = workingDays.some((d) => day.isSame(d, 'day'));
    const isStart   = !!rangeStart && day.isSame(rangeStart, 'day');
    const isEnd     = !!rangeEnd   && day.isSame(rangeEnd,   'day');
    const isEdge    = isStart || isEnd;
    const isInRange =
        !!rangeStart && !!rangeEnd &&
        day.isAfter(rangeStart,  'day') &&
        day.isBefore(rangeEnd, 'day');

    return (
        <PickersDay
            {...other}
            day={day}
            selected={false}
            onClick={() => onSelect?.(day)}
            sx={{
                ...(isEdge && {
                    backgroundColor: '#1d4ed8 !important',
                    color:           '#fff    !important',
                    borderRadius:    '50%',
                    fontWeight:      700,
                }),
                ...(!isEdge && isInRange && {
                    backgroundColor: '#bfdbfe',
                    borderRadius:    0,
                }),
                ...(isWorking && !isEdge && {
                    backgroundColor: '#2bc046',
                    border:          '1px solid #000',
                    borderRadius:    '50%',
                }),
                ...(isWorking && isEdge && {
                    outline:       '2px solid #2bc046',
                    outlineOffset: '1px',
                }),
                '&:hover': {
                    backgroundColor: isEdge    ? '#1e40af !important'
                                   : isInRange ? '#93c5fd'
                                   : isWorking ? '#2bc046'
                                   : undefined,
                },
            }}
        />
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
    schedules:    Schedule[];
    initialDate?: string | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MasterSchedule({ schedules, initialDate }: Props) {
    const [rangeStart, setRangeStart] = useState<Dayjs | null>(
        initialDate ? dayjs(initialDate) : null,
    );
    const [rangeEnd,    setRangeEnd]    = useState<Dayjs | null>(null);
    const [phase,       setPhase]       = useState<'start' | 'end'>('start');
    const [skipSundays, setSkipSundays] = useState(true);

    const [startTime, setStartTime] = useState('09:00');
    const [endTime,   setEndTime]   = useState('18:00');
    const [note,      setNote]      = useState('');

    const [errors,  setErrors]  = useState<string[]>([]);
    const [success, setSuccess] = useState('');

    // ── prefill hours ─────────────────────────────────────────────────────────
    const prefillFromDay = (day: Dayjs) => {
        const found = schedules.find((s) =>
            dayjs(s.appointment_date).isSame(day, 'day'),
        );
        setStartTime(found?.appointment_start_time.slice(0, 5) ?? '09:00');
        setEndTime(found?.appointment_end_time.slice(0, 5)     ?? '18:00');
        setNote(found?.note ?? '');
    };

    // ── calendar click ────────────────────────────────────────────────────────
    const handleSelect = (day: Dayjs) => {
        if (phase === 'start' || !rangeStart) {
            setRangeStart(day);
            setRangeEnd(null);
            setPhase('end');
            prefillFromDay(day);
        } else {
            if (day.isBefore(rangeStart, 'day')) {
                setRangeStart(day);
                setRangeEnd(null);
                prefillFromDay(day);
            } else if (day.isSame(rangeStart, 'day')) {
                setRangeEnd(null);
                setPhase('start');
            } else {
                setRangeEnd(day);
                setPhase('start');
            }
        }
    };

    // ── save ──────────────────────────────────────────────────────────────────
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setSuccess('');

        if (!rangeStart) {
            setErrors(['Оберіть день на календарі.']);
            return;
        }

        const isRange = !!rangeEnd;

        router.post(
            saveSchedule().url,
            {
                date_from:              rangeStart.format('YYYY-MM-DD'),
                date_to:                isRange ? rangeEnd!.format('YYYY-MM-DD') : undefined,
                appointment_start_time: startTime,
                appointment_end_time:   endTime,
                note,
                skip_sundays:           isRange ? skipSundays : false,
            },
            {
                only:          ['schedules'],
                preserveState: true,
                onSuccess: () => {
                    setSuccess(
                        isRange
                            ? `Збережено: ${rangeStart.format('D.MM')} – ${rangeEnd!.format('D.MM')}`
                            : `${rangeStart.format('D MMMM')} — збережено!`,
                    );
                    setTimeout(() => setSuccess(''), 3000);
                },
                onError: (errs) => setErrors(Object.values(errs)),
            },
        );
    };

    // ── delete ────────────────────────────────────────────────────────────────
    const handleDelete = () => {
        if (!rangeStart) return;
        const isRange = !!rangeEnd;
        const msg = isRange
            ? `Видалити розклад з ${rangeStart.format('D.MM')} по ${rangeEnd!.format('D.MM')}?`
            : `Видалити розклад на ${rangeStart.format('D MMMM')}?`;
        if (!confirm(msg)) return;

        router.delete(deleteSchedule().url, {
            data: {
                date_from: rangeStart.format('YYYY-MM-DD'),
                date_to:   isRange ? rangeEnd!.format('YYYY-MM-DD') : undefined,
            },
            only:          ['schedules'],
            preserveState: true,
            onSuccess: () => {
                setSuccess('Видалено!');
                setTimeout(() => setSuccess(''), 3000);
                setStartTime('09:00');
                setEndTime('18:00');
                setNote('');
                setRangeEnd(null);
            },
        });
    };

    // ── derived ───────────────────────────────────────────────────────────────
    const workingDays    = schedules.map((s) => dayjs(s.appointment_date));
    const isRange        = !!rangeStart && !!rangeEnd;
    const singleSchedule = !isRange && rangeStart
        ? schedules.find((s) => dayjs(s.appointment_date).isSame(rangeStart, 'day')) ?? null
        : null;

    const hint = !rangeStart
        ? 'Клікніть на день, щоб вибрати'
        : phase === 'end'
        ? 'Клікніть ще раз — для діапазону, або збережіть як один день'
        : null;

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Мій розклад" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid grid-cols-2 gap-10 rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">

                    {/* ── LEFT ─────────────────────────────────────────────── */}
                    <div>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateCalendar
                                value={null}
                                onChange={() => {}}
                                shouldDisableDate={(d) => d.isBefore(dayjs(), 'day')}
                                sx={{
                                    width: '100%',
                                    '.MuiDayCalendar-weekContainer, .MuiDayCalendar-header': {
                                        width: '100%',
                                        justifyContent: 'space-between',
                                        margin: '10px 0',
                                    },
                                    '.MuiPickersCalendarHeader-root': { marginBottom: '20px' },
                                }}
                                slots={{ day: RangeDay }}
                                slotProps={{
                                    day: {
                                        workingDays,
                                        rangeStart,
                                        rangeEnd,
                                        onSelect: handleSelect,
                                    } as Partial<RangeDayProps>,
                                }}
                            />
                        </LocalizationProvider>

                        {hint && (
                            <p className="mt-1 text-center text-xs text-gray-400">{hint}</p>
                        )}
                    </div>

                    {/* ── RIGHT ────────────────────────────────────────────── */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <form onSubmit={handleSave} className="flex flex-col gap-4 pt-2">

                            {/* Selection info */}
                            {rangeStart ? (
                                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm">
                                    {isRange ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">
                                                {rangeStart.format('D MMMM')} – {rangeEnd!.format('D MMMM YYYY')}
                                            </span>
                                            <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                                                <input
                                                    type="checkbox"
                                                    checked={skipSundays}
                                                    onChange={(e) => setSkipSundays(e.target.checked)}
                                                    className="h-4 w-4 rounded"
                                                />
                                                Пропускати неділі
                                            </label>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-semibold">
                                                {rangeStart.format('D MMMM YYYY')}
                                            </span>
                                            {singleSchedule ? (
                                                <span className="ml-2 text-green-600">
                                                    • {singleSchedule.appointment_start_time.slice(0,5)}–{singleSchedule.appointment_end_time.slice(0,5)}
                                                </span>
                                            ) : (
                                                <span className="ml-2 text-gray-400">• немає розкладу</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-400">
                                    ← Оберіть день на календарі
                                </div>
                            )}

                            {/* Alerts */}
                            {errors.map((err, i) => (
                                <Alert key={i} variant="destructive">
                                    <AlertCircleIcon /><AlertTitle>{err}</AlertTitle>
                                </Alert>
                            ))}
                            {success && (
                                <Alert variant="success">
                                    <CheckCircle2Icon /><AlertTitle>{success}</AlertTitle>
                                </Alert>
                            )}

                            {/* Time pickers */}
                            <div className="flex gap-5">
                                <CustomDigitalClock
                                    minTime="7:00" maxTime="21:00"
                                    value={startTime} step={15} ampm={false}
                                    label="Початок"
                                    handleChange={setStartTime}
                                />
                                <CustomDigitalClock
                                    minTime="7:00" maxTime="21:00"
                                    value={endTime} step={15} ampm={false}
                                    label="Кінець"
                                    handleChange={setEndTime}
                                />
                            </div>

                            <Textarea
                                variant="outlined"
                                minRows={4}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Примітка (необов'язково)"
                            />

                            <div className="flex gap-2">
                                <Button
                                    variant="contained"
                                    type="submit"
                                    disabled={!rangeStart}
                                >
                                    {isRange ? 'Зберегти діапазон' : 'Зберегти'}
                                </Button>
                                <Button
                                    variant="text"
                                    color="error"
                                    type="button"
                                    disabled={!singleSchedule && !isRange}
                                    onClick={handleDelete}
                                >
                                    Видалити
                                </Button>
                            </div>
                        </form>
                    </LocalizationProvider>
                </div>
            </div>
        </AppLayout>
    );
}
