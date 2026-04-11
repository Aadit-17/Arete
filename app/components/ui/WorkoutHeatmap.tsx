import React from 'react';

interface WorkoutHeatmapProps {
    entries: any[];
}

export const WorkoutHeatmap = ({ entries }: WorkoutHeatmapProps) => {
    // Get current month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Create a map of workout intensity for each day
    const workoutMap: { [key: string]: { hasWorkout: boolean; duration: number } } = {};

    entries.forEach(entry => {
        const [year, month, day] = entry.dateKey.split('-');
        if (parseInt(year) === currentYear && parseInt(month) === currentMonth + 1) {
            const duration = entry.structured?.workout?.sessions?.reduce((sum: number, s: any) => sum + (s.durationMin || 0), 0) || 0;
            workoutMap[day] = {
                hasWorkout: entry.structured?.workout?.didSession || false,
                duration,
            };
        }
    });

    // Generate the grid
    const weeks = [];
    let week: (number | null)[] = Array(firstDayOfMonth).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        weeks.push(week);
    }

    const getColor = (day: number | null) => {
        if (day === null) return 'transparent';

        const data = workoutMap[String(day).padStart(2, '0')];
        if (!data || !data.hasWorkout) {
            return 'rgba(255, 255, 255, 0.03)';
        }

        // Intensity based on duration
        if (data.duration >= 60) return 'rgba(16, 185, 129, 0.7)'; // High: 60+ min
        if (data.duration >= 45) return 'rgba(16, 185, 129, 0.5)'; // Medium-high: 45-59 min
        if (data.duration >= 30) return 'rgba(16, 185, 129, 0.3)'; // Medium: 30-44 min
        return 'rgba(16, 185, 129, 0.15)'; // Low: <30 min
    };

    const getDuration = (day: number | null) => {
        if (day === null) return 0;
        return workoutMap[String(day).padStart(2, '0')]?.duration || 0;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="space-y-3 h-full flex flex-col">
            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">
                Workouts {monthNames[currentMonth]}
            </h3>

            {/* Heatmap grid - fills available space */}
            <div className="flex-1 flex flex-col justify-center gap-1">
                {weeks.map((weekDays, weekIdx) => (
                    <div key={weekIdx} className="flex gap-1 justify-center flex-wrap">
                        {weekDays.map((day, dayIdx) => {
                            const duration = getDuration(day);
                            return (
                                <div
                                    key={dayIdx}
                                    className="w-6 h-6 rounded transition-all hover:ring-2 hover:ring-aura-accent cursor-pointer group relative flex-grow"
                                    style={{
                                        backgroundColor: getColor(day),
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        maxWidth: '12.5%',
                                    }}
                                >
                                    {/* Tooltip on hover */}
                                    {day && (
                                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-black/90 text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/[0.1]">
                                            {duration}m
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
