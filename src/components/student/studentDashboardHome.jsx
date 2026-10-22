import {
    useMemo,
    useState,
} from "react";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    GraduationCap,
    RefreshCw,
    Users,
} from "lucide-react";
import SubjectImage from "../subjectImage";

function getInitials(name) {
    return String(name || "Student")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function formatDateTime(value) {
    if (!value) return "No deadline";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid deadline";
    }

    return date.toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatActivityType(activity) {
    if (
        activity.custom_activity_type?.trim()
    ) {
        return activity.custom_activity_type.trim();
    }

    if (
        activity.activity_type ===
        "performance_task"
    ) {
        return "Performance Task";
    }

    if (
        activity.activity_type === "quiz"
    ) {
        return "Quiz";
    }

    return "Assignment";
}

function getActivityDueDate(activity) {
    return (
        activity.due_at ||
        activity.due_date ||
        activity.deadline ||
        null
    );
}

function getSubjectName(activity) {
    return (
        activity.classRecord?.subject
            ?.subject_name ||
        activity.class_record?.subject
            ?.subject_name ||
        activity.subject?.subject_name ||
        "Subject unavailable"
    );
}

function getActivityTypeStyle(activity) {
    if (
        activity.activity_type === "quiz"
    ) {
        return {
            background: "bg-violet-50",
            text: "text-violet-700",
            border: "border-violet-100",
        };
    }

    if (
        activity.activity_type ===
        "performance_task"
    ) {
        return {
            background: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-100",
        };
    }

    return {
        background: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-100",
    };
}

function createDateKey(date) {
    return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ].join("-");
}

function isSameCalendarDay(
    first,
    second,
) {
    return (
        first.getFullYear() ===
        second.getFullYear() &&
        first.getMonth() ===
        second.getMonth() &&
        first.getDate() ===
        second.getDate()
    );
}

function DashboardStat({
    icon: Icon,
    label,
    value,
    description,
    color = "blue",
}) {
    const colors = {
        blue: {
            icon: "bg-blue-50 text-blue-700",
            glow: "bg-blue-100/50",
        },

        violet: {
            icon:
                "bg-violet-50 text-violet-700",
            glow: "bg-violet-100/50",
        },

        amber: {
            icon:
                "bg-amber-50 text-amber-700",
            glow: "bg-amber-100/50",
        },
    };

    const selectedColor =
        colors[color] || colors.blue;

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <div
                aria-hidden="true"
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${selectedColor.glow}`}
            />

            <div className="relative flex items-center gap-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedColor.icon}`}
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                    <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="truncate text-xs font-bold text-slate-600">
                        {label}
                    </p>
                </div>
            </div>

            <p className="relative mt-3 text-xs leading-5 text-slate-400">
                {description}
            </p>
        </div>
    );
}

function ClassCard({
    classRecord,
    onOpenClass,
}) {
    const subjectName =
        classRecord.subject?.subject_name ||
        "Subject unavailable";

    const teacherName =
        classRecord.teacher?.profile
            ?.full_name ||
        classRecord.teacher?.full_name ||
        "Teacher unavailable";

    const gradeLevel =
        classRecord.section?.grade_level ||
        "—";

    const sectionName =
        classRecord.section?.section_name ||
        "Section unavailable";

    return (
        <button
            type="button"
            onClick={() =>
                onOpenClass?.(classRecord)
            }
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label={`Open ${subjectName}`}
        >
            <div className="relative overflow-hidden">
                <SubjectImage
                    path={
                        classRecord.subject?.image_path
                    }
                    name={subjectName}
                    className="h-44 w-full transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

                <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 shadow-sm backdrop-blur">
                    {classRecord.subject
                        ?.subject_code || "—"}
                </span>

                <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-blue-700 opacity-0 shadow-sm backdrop-blur transition duration-200 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-extrabold text-slate-900">
                    {subjectName}
                </h3>

                <p className="mt-1.5 truncate text-xs font-medium text-slate-500">
                    {teacherName}
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
                    <Users className="h-4 w-4 shrink-0 text-blue-600" />

                    <span className="truncate">
                        Grade {gradeLevel}
                        {" · "}
                        {sectionName}
                    </span>
                </div>

                <div className="mt-auto pt-4">
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                        Open class
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </div>
        </button>
    );
}

function UpcomingActivityCard({
    activity,
    onOpenActivity,
}) {
    const subjectName =
        getSubjectName(activity);

    const activityType =
        formatActivityType(activity);

    const typeStyle =
        getActivityTypeStyle(activity);

    return (
        <button
            type="button"
            onClick={() =>
                onOpenActivity?.(activity)
            }
            className="group w-full rounded-2xl border border-slate-200/70 bg-white p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label={`Open ${activity.title || "activity"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-100">
                    <Clock3 className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">
                        {activity.title ||
                            "Untitled activity"}
                    </p>

                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {subjectName}
                    </p>
                </div>

                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 pl-14">
                <span
                    className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${typeStyle.background} ${typeStyle.text} ${typeStyle.border}`}
                >
                    {activityType}
                </span>

                <span className="text-[11px] font-medium text-slate-400">
                    Due{" "}
                    {formatDateTime(
                        getActivityDueDate(activity),
                    )}
                </span>
            </div>
        </button>
    );
}

function StudentMiniCalendar({
    activities = [],
    onOpenActivity,
}) {
    const [visibleMonth, setVisibleMonth] =
        useState(() => {
            const today = new Date();

            return new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            );
        });

    const today = new Date();

    const calendarDays = useMemo(() => {
        const year =
            visibleMonth.getFullYear();

        const month =
            visibleMonth.getMonth();

        const firstDay = new Date(
            year,
            month,
            1,
        );

        const lastDay = new Date(
            year,
            month + 1,
            0,
        );

        const days = [];

        for (
            let index =
                firstDay.getDay();
            index > 0;
            index -= 1
        ) {
            days.push({
                date: new Date(
                    year,
                    month,
                    1 - index,
                ),

                currentMonth: false,
            });
        }

        for (
            let day = 1;
            day <= lastDay.getDate();
            day += 1
        ) {
            days.push({
                date: new Date(
                    year,
                    month,
                    day,
                ),

                currentMonth: true,
            });
        }

        let nextMonthDay = 1;

        while (days.length < 42) {
            days.push({
                date: new Date(
                    year,
                    month + 1,
                    nextMonthDay,
                ),

                currentMonth: false,
            });

            nextMonthDay += 1;
        }

        return days;
    }, [visibleMonth]);

    const activitiesByDate =
        useMemo(() => {
            const groupedActivities =
                new Map();

            activities.forEach(
                (activity) => {
                    const dueValue =
                        getActivityDueDate(
                            activity,
                        );

                    if (!dueValue) return;

                    const dueDate =
                        new Date(dueValue);

                    if (
                        Number.isNaN(
                            dueDate.getTime(),
                        )
                    ) {
                        return;
                    }

                    const key =
                        createDateKey(dueDate);

                    const current =
                        groupedActivities.get(
                            key,
                        ) || [];

                    groupedActivities.set(
                        key,
                        [
                            ...current,
                            activity,
                        ],
                    );
                },
            );

            return groupedActivities;
        }, [activities]);

    function changeMonth(amount) {
        setVisibleMonth(
            (current) =>
                new Date(
                    current.getFullYear(),
                    current.getMonth() +
                    amount,
                    1,
                ),
        );
    }

    function returnToCurrentMonth() {
        const currentDate = new Date();

        setVisibleMonth(
            new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1,
            ),
        );
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-200">
                            <CalendarDays className="h-5 w-5" />
                        </div>

                        <div>
                            <h2 className="font-extrabold text-slate-900">
                                Calendar
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Activity deadlines
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            returnToCurrentMonth
                        }
                        className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                    >
                        Today
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() =>
                            changeMonth(-1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <p className="text-sm font-extrabold text-slate-800">
                        {visibleMonth.toLocaleDateString(
                            "en-PH",
                            {
                                month: "long",
                                year: "numeric",
                            },
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            changeMonth(1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 text-center">
                    {[
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                    ].map((day) => (
                        <div
                            key={day}
                            className="py-2 text-[9px] font-extrabold uppercase tracking-wide text-slate-400"
                        >
                            {day}
                        </div>
                    ))}

                    {calendarDays.map(
                        ({
                            date,
                            currentMonth,
                        }) => {
                            const dayActivities =
                                activitiesByDate.get(
                                    createDateKey(date),
                                ) || [];

                            const isToday =
                                isSameCalendarDay(
                                    date,
                                    today,
                                );

                            const hasActivity =
                                dayActivities.length >
                                0;

                            return (
                                <button
                                    key={
                                        date.toISOString()
                                    }
                                    type="button"
                                    disabled={!hasActivity}
                                    onClick={() => {
                                        if (
                                            hasActivity &&
                                            onOpenActivity
                                        ) {
                                            onOpenActivity(
                                                dayActivities[0],
                                            );
                                        }
                                    }}
                                    title={
                                        hasActivity
                                            ? dayActivities
                                                .map(
                                                    (
                                                        activity,
                                                    ) =>
                                                        activity.title ||
                                                        "Untitled activity",
                                                )
                                                .join("\n")
                                            : undefined
                                    }
                                    className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl text-xs transition ${currentMonth
                                            ? "text-slate-700"
                                            : "text-slate-300"
                                        } ${hasActivity
                                            ? "cursor-pointer font-semibold hover:bg-blue-50 hover:text-blue-700"
                                            : "cursor-default"
                                        } ${isToday
                                            ? "bg-blue-700 font-extrabold text-white shadow-md shadow-blue-200 hover:bg-blue-800 hover:text-white"
                                            : ""
                                        }`}
                                >
                                    <span>
                                        {date.getDate()}
                                    </span>

                                    {hasActivity && (
                                        <span
                                            className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isToday
                                                    ? "bg-white"
                                                    : "bg-amber-500"
                                                }`}
                                        />
                                    )}

                                    {dayActivities.length >
                                        1 && (
                                            <span
                                                className={`absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-extrabold ${isToday
                                                        ? "bg-white text-blue-700"
                                                        : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {
                                                    dayActivities.length
                                                }
                                            </span>
                                        )}
                                </button>
                            );
                        },
                    )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Activity deadline
                </div>
            </div>
        </section>
    );
}

function EmptyClassesState() {
    return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                <GraduationCap className="h-8 w-8 text-slate-300" />
            </div>

            <p className="mt-4 font-bold text-slate-700">
                No classes assigned
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Your classes will appear here
                after teachers are assigned to
                your section.
            </p>
        </div>
    );
}

export default function StudentDashboardHome({
    student,
    classes = [],
    activities = [],
    loading = false,
    error = "",
    onRetry,
    onSelectView,
    onOpenClass,
    onOpenActivity,
}) {
    const upcomingActivities =
        useMemo(() => {
            const currentTime =
                Date.now();

            return activities
                .filter((activity) => {
                    const dueValue =
                        getActivityDueDate(
                            activity,
                        );

                    if (!dueValue) {
                        return false;
                    }

                    const dueTime =
                        new Date(
                            dueValue,
                        ).getTime();

                    return (
                        !Number.isNaN(
                            dueTime,
                        ) &&
                        dueTime >= currentTime
                    );
                })
                .sort(
                    (first, second) =>
                        new Date(
                            getActivityDueDate(
                                first,
                            ),
                        ).getTime() -
                        new Date(
                            getActivityDueDate(
                                second,
                            ),
                        ).getTime(),
                )
                .slice(0, 5);
        }, [activities]);

    if (loading) {
        return (
            <div className="flex min-h-[520px] items-center justify-center">
                <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-700" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-500">
                        Loading student dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                role="alert"
                className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm"
            >
                <p className="font-bold">
                    Unable to load dashboard
                </p>

                <p className="mt-1 text-sm">
                    {error}
                </p>

                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-bold transition hover:bg-red-200"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                )}
            </div>
        );
    }

    const firstName =
        student?.first_name ||
        student?.full_name
            ?.trim()
            .split(/\s+/)[0] ||
        "Student";

    return (
        <div className="space-y-6 pb-8">
            {/* Welcome banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-500 p-6 text-white shadow-xl shadow-blue-200/40 sm:p-7">
                <div
                    aria-hidden="true"
                    className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[38px] border-white/10"
                />

                <div
                    aria-hidden="true"
                    className="absolute bottom-[-110px] left-[35%] h-64 w-64 rounded-full bg-white/10 blur-sm"
                />

                <div
                    aria-hidden="true"
                    className="absolute right-[32%] top-6 h-20 w-20 rounded-full bg-cyan-300/10 blur-xl"
                />

                <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                    <div className="max-w-2xl">
                        <div className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-50 backdrop-blur">
                            Student Dashboard
                        </div>

                        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                            Welcome back, {firstName}!
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                            Keep track of your classes,
                            activities, deadlines, and
                            learning progress in one place.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                                {student?.student_number ||
                                    "No student number"}
                            </span>

                            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                                Grade{" "}
                                {student?.section
                                    ?.grade_level || "—"}
                                {" · "}
                                {student?.section
                                    ?.section_name ||
                                    "No section"}
                            </span>

                            {student?.section?.strand
                                ?.code && (
                                    <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
                                        {
                                            student.section
                                                .strand.code
                                        }
                                    </span>
                                )}
                        </div>
                    </div>

                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-white/30 bg-white/15 text-3xl font-extrabold shadow-xl backdrop-blur sm:h-28 sm:w-28">
                        {getInitials(
                            student?.full_name,
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                {/* Classes */}
                <section className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                                Learning spaces
                            </p>

                            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
                                My Classes
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Subjects assigned to your
                                current section.
                            </p>
                        </div>

                        {classes.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectView?.(
                                        "classes",
                                    )
                                }
                                className="group flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                            >
                                View all classes

                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        )}
                    </div>

                    {classes.length === 0 ? (
                        <EmptyClassesState />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {classes
                                .slice(0, 6)
                                .map(
                                    (classRecord) => (
                                        <ClassCard
                                            key={
                                                classRecord.id
                                            }
                                            classRecord={
                                                classRecord
                                            }
                                            onOpenClass={
                                                onOpenClass
                                            }
                                        />
                                    ),
                                )}
                        </div>
                    )}
                </section>

                {/* Right column */}
                <aside className="min-w-0 self-start space-y-6">
                    {/* Upcoming activities */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
                        <div className="border-b border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-200">
                                        <Clock3 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <h2 className="font-extrabold text-slate-900">
                                            Upcoming Deadlines
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Your next activities
                                        </p>
                                    </div>
                                </div>

                                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-extrabold text-amber-700 shadow-sm">
                                    {
                                        upcomingActivities.length
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            {upcomingActivities.length ===
                                0 ? (
                                <div className="py-8 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                    </div>

                                    <p className="mt-4 text-sm font-bold text-slate-700">
                                        You are all caught up!
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        No upcoming deadlines.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingActivities.map(
                                        (activity) => (
                                            <UpcomingActivityCard
                                                key={
                                                    activity.id
                                                }
                                                activity={
                                                    activity
                                                }
                                                onOpenActivity={
                                                    onOpenActivity
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            )}

                            {activities.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelectView?.(
                                            "assignments",
                                        )
                                    }
                                    className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                                >
                                    View all activities

                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            )}
                        </div>
                    </section>

                    <StudentMiniCalendar
                        activities={activities}
                        onOpenActivity={
                            onOpenActivity
                        }
                    />
                </aside>
            </div>
        </div>
    );
}