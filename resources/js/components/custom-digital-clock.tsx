import classNames from 'classnames';
import { useEffect, useRef } from 'react';

interface CustomDigitalClockProps {
    minTime: string,
    maxTime: string,
    value: string,
    step: number,
    ampm: boolean,
    label: string,
    handleChange: any,
}

export function CustomDigitalClock({ minTime, maxTime, value, step, ampm, label, handleChange}: CustomDigitalClockProps) {
    const selectedTimeRef = useRef<HTMLButtonElement>(null);

    const generateMinutes = () => {
        const minutesArr = [];

        const startInMinutes = parseInt(minTime) * 60;
        const endInMinutes = parseInt(maxTime) * 60;

        let current = startInMinutes;

        while (current < endInMinutes) {
            const hours = Math.floor(current / 60)
                .toString()
                .padStart(2, "0");
            const minutes = (current % 60).toString().padStart(2, "0");
            minutesArr.push(`${hours}:${minutes}`);
            current += step;
        }

        return minutesArr;
    }

    useEffect(() => {
        if (selectedTimeRef.current) {
            selectedTimeRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [value]);

    const handleTimeChange = (time: string) => {
        handleChange(time, );
    }

    return (
        <div className="overflow-auto min-w-30">
            <p>{label}</p>
            <div className="height-100 overflow-auto max-h-100 flex flex-col pr-2">
                {generateMinutes().map((minute, index) => {
                    const isActive = value == minute;

                    return (
                        <button key={index}
                                ref={isActive ? selectedTimeRef : null}
                                className={classNames({
                                    'py-2 px-4 hover:bg-accent hover:cursor-pointer': true,
                                    'bg-chart-3 text-white font-bold hover:bg-chart-3': isActive,
                                })}
                                onClick={(e) => {e.preventDefault(); handleTimeChange(minute);}}
                        >{minute}</button>
                    )
                }
                )}
            </div>
        </div>
    );
}