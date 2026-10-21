import { useMemo, useState } from "react";
import {
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
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
    if (activity.custom_activity_type?.trim()) {
        return activity.custom_activity_type.trim();
    }

    if (
        activity.activity_type ===
        "performance_task"
    ) {
        return "Performance Task";
    }

    if (activity.activity_type === "quiz") {
        return "Quiz";
    }

    return "Assignment";
}

function ClassCard({
    classRecord,
    onOpenClass,
}) {
    const subjectName =
        classRecord.subject?.subject_name ||
        "Subject unavailable";

    const teacherName =
        classRecord.teacher?.profile?.full_name ||
        "Teacher unavailable";

    return (
        <button
            type="button"
            onClick={() =>
                onOpenClass?.(classRecord)
            }
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={`Open ${subjectName}`}
        >
            <SubjectImage
                path={
                    classRecord.subject?.image_path
                }
                name={subjectName}
                className="h-40 w-full"
            />

            <div className="p-4">
                <p className="text-xs font-medium text-blue-600">
                    {classRecord.subject?.subject_code ||
                        "—"}
                </p>

                <h3 className="mt-1 font-semibold text-gray-900">
                    {subjectName}
                </h3>

                <p className="mt-2 text-xs text-gray-500">
                    {teacherName}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-4 w-4 shrink-0" />

                    <span>
                        Grade{" "}
                        {classRecord.section?.grade_level ||
                            "—"}
                        {" · "}
                        {classRecord.section?.section_name ||
                            "Section unavailable"}
                    </span>
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-600">
                    Open class
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
        activity.classRecord?.subject
            ?.subject_name ||
        activity.class_record?.subject
            ?.subject_name ||
        activity.subject?.subject_name ||
        "Subject unavailable";

    return (
        <button
            type="button"
            onClick={() =>
                onOpenActivity?.(activity)
            }
            className="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={`Open ${activity.title || "activity"
                }`}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-5 w-5 text-orange-500" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                    {activity.title ||
                        "Untitled activity"}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                    {subjectName}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400">
                    <span>
                        {formatActivityType(activity)}
                    </span>

                    <span aria-hidden="true">·</span>

                    <span>
                        Due{" "}
                        {formatDateTime(
                            activity.due_at ||
                            activity.due_date ||
                            activity.deadline,
                        )}
                    </span>
                </div>
            </div>

            <span className="shrink-0 text-xs font-medium text-blue-600">
                Open
            </span>
        </button>
    );
}

function getActivityDueDate(activity) {
    return (
        activity.due_at ||
        activity.due_date ||
        activity.deadline ||
        null
    );
}

function createDateKey(date) {
    return [
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    ].join("-");
}

function isSameCalendarDay(first, second) {
    return (
        first.getFullYear() ===
        second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
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
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();

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
            let index = firstDay.getDay();
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

    const activitiesByDate = useMemo(() => {
        const groupedActivities = new Map();

        activities.forEach((activity) => {
            const dueValue =
                getActivityDueDate(activity);

            if (!dueValue) return;

            const dueDate = new Date(dueValue);

            if (
                Number.isNaN(dueDate.getTime())
            ) {
                return;
            }

            const key = createDateKey(dueDate);
            const current =
                groupedActivities.get(key) || [];

            groupedActivities.set(key, [
                ...current,
                activity,
            ]);
        });

        return groupedActivities;
    }, [activities]);

    function changeMonth(amount) {
        setVisibleMonth(
            (current) =>
                new Date(
                    current.getFullYear(),
                    current.getMonth() + amount,
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
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="flex items-center gap-2 font-bold text-gray-900">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        Calendar
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        View your activity deadlines.
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={returnToCurrentMonth}
                        className="rounded-lg px-2 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                        Today
                    </button>

                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <p className="mb-3 text-center text-sm font-semibold text-gray-800">
                {visibleMonth.toLocaleDateString(
                    "en-PH",
                    {
                        month: "long",
                        year: "numeric",
                    },
                )}
            </p>

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
                        className="py-2 text-[10px] font-semibold uppercase text-gray-400"
                    >
                        {day}
                    </div>
                ))}

                {calendarDays.map(
                    ({ date, currentMonth }) => {
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
                            dayActivities.length > 0;

                        return (
                            <button
                                key={date.toISOString()}
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
                                                (activity) =>
                                                    activity.title ||
                                                    "Untitled activity",
                                            )
                                            .join("\n")
                                        : undefined
                                }
                                className={`relative flex min-h-11 flex-col items-center justify-center rounded-lg text-xs transition ${currentMonth
                                        ? "text-gray-700"
                                        : "text-gray-300"
                                    } ${hasActivity
                                        ? "cursor-pointer hover:bg-blue-50"
                                        : "cursor-default"
                                    } ${isToday
                                        ? "bg-blue-600 font-bold text-white hover:bg-blue-700"
                                        : ""
                                    }`}
                            >
                                <span>{date.getDate()}</span>

                                {hasActivity && (
                                    <span
                                        className={`mt-1 h-1.5 w-1.5 rounded-full ${isToday
                                                ? "bg-white"
                                                : "bg-red-500"
                                            }`}
                                    />
                                )}

                                {dayActivities.length > 1 && (
                                    <span
                                        className={`absolute right-1 top-1 text-[8px] font-bold ${isToday
                                                ? "text-white"
                                                : "text-blue-600"
                                            }`}
                                    >
                                        {dayActivities.length}
                                    </span>
                                )}
                            </button>
                        );
                    },
                )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Activity deadline
            </div>
        </section>
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
    const upcomingActivities = useMemo(() => {
        const currentTime = Date.now();

        return activities
            .filter((activity) => {
                const dueValue =
                    getActivityDueDate(activity);

                if (!dueValue) return false;

                const dueTime =
                    new Date(dueValue).getTime();

                return (
                    !Number.isNaN(dueTime) &&
                    dueTime >= currentTime
                );
            })
            .sort(
                (first, second) =>
                    new Date(
                        getActivityDueDate(first),
                    ).getTime() -
                    new Date(
                        getActivityDueDate(second),
                    ).getTime(),
            )
            .slice(0, 5);
    }, [activities]);

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-600" />

                    <p className="mt-3 text-sm text-gray-500">
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
                className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700"
            >
                <p className="font-medium">
                    Unable to load dashboard
                </p>

                <p className="mt-1 text-sm">
                    {error}
                </p>

                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 flex items-center gap-2 text-sm font-medium hover:underline"
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
        <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-blue-100">
                            Student Dashboard
                        </p>

                        <h1 className="mt-1 text-2xl font-bold">
                            Welcome back, {firstName}!
                        </h1>

                        <p className="mt-2 text-sm text-blue-100">
                            View your classes, activities,
                            deadlines, and learning progress.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white/15 px-3 py-1.5">
                                {student?.student_number ||
                                    "No student number"}
                            </span>

                            <span className="rounded-full bg-white/15 px-3 py-1.5">
                                Grade{" "}
                                {student?.section
                                    ?.grade_level || "—"}
                                {" · "}
                                {student?.section
                                    ?.section_name ||
                                    "No section"}
                            </span>

                            {student?.section?.strand?.code && (
                                <span className="rounded-full bg-white/15 px-3 py-1.5">
                                    {
                                        student.section.strand
                                            .code
                                    }
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
                        {getInitials(
                            student?.full_name,
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                My Classes
                            </h2>

                            <p className="text-sm text-gray-500">
                                Subjects assigned to your
                                section
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onSelectView?.("classes")
                            }
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            View all
                        </button>
                    </div>

                    {classes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                            <GraduationCap className="mx-auto h-9 w-9 text-gray-300" />

                            <p className="mt-3 font-medium text-gray-700">
                                No classes assigned
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Your classes will appear after
                                teachers are assigned to your
                                section.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {classes
                                .slice(0, 6)
                                .map((classRecord) => (
                                    <ClassCard
                                        key={classRecord.id}
                                        classRecord={
                                            classRecord
                                        }
                                        onOpenClass={
                                            onOpenClass
                                        }
                                    />
                                ))}
                        </div>
                    )}
                </section>

                <aside className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Upcoming Deadlines
                                </h2>

                                <p className="text-xs text-gray-400">
                                    Your next activities
                                </p>
                            </div>

                            <CalendarDays className="h-5 w-5 text-orange-500" />
                        </div>

                        {upcomingActivities.length ===
                            0 ? (
                            <div className="py-10 text-center">
                                <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />

                                <p className="mt-3 text-sm text-gray-500">
                                    No upcoming deadlines.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingActivities.map(
                                    (activity) => (
                                        <UpcomingActivityCard
                                            key={activity.id}
                                            activity={activity}
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
                                className="mt-4 w-full rounded-lg bg-gray-50 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                            >
                                View all activities
                            </button>
                        )}
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