import { useMemo } from "react";
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
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

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    onClick,
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange:
            "bg-orange-50 text-orange-600",
        purple:
            "bg-purple-50 text-purple-600",
    };

    const content = (
        <>
            <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color] ||
                    colorClasses.blue
                    }`}
            >
                <Icon className="h-5 w-5" />
            </div>

            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
                {value}
            </p>
        </>
    );

    if (!onClick) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                {content}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
        >
            {content}
        </button>
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
                    {classRecord.subject
                        ?.subject_code || "—"}
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
                        {classRecord.section
                            ?.grade_level || "—"}
                        {" · "}
                        {classRecord.section
                            ?.section_name ||
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
        "Subject unavailable";

    const activityType = String(
        activity.activity_type ||
        "activity",
    )
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );

    return (
        <button
            type="button"
            onClick={() =>
                onOpenActivity?.(activity)
            }
            className="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={`Open ${activity.title}`}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-5 w-5 text-orange-500" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                    {activity.title}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-500">
                    {subjectName}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400">
                    <span>{activityType}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                        Due{" "}
                        {formatDateTime(
                            activity.due_at,
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
    const {
        upcomingActivities,
        overdueActivities,
    } = useMemo(() => {
        const currentTime = Date.now();

        const upcoming = activities
            .filter((activity) => {
                if (!activity.due_at) {
                    return false;
                }

                const dueTime = new Date(
                    activity.due_at,
                ).getTime();

                return (
                    !Number.isNaN(dueTime) &&
                    dueTime >= currentTime
                );
            })
            .sort(
                (first, second) =>
                    new Date(
                        first.due_at,
                    ).getTime() -
                    new Date(
                        second.due_at,
                    ).getTime(),
            );

        const overdue = activities
            .filter((activity) => {
                if (!activity.due_at) {
                    return false;
                }

                const dueTime = new Date(
                    activity.due_at,
                ).getTime();

                return (
                    !Number.isNaN(dueTime) &&
                    dueTime < currentTime
                );
            })
            .sort(
                (first, second) =>
                    new Date(
                        second.due_at,
                    ).getTime() -
                    new Date(
                        first.due_at,
                    ).getTime(),
            );

        return {
            upcomingActivities:
                upcoming.slice(0, 5),
            overdueActivities: overdue,
        };
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
                            View your classes,
                            activities, deadlines, and
                            learning progress.
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

                            {student?.section?.strand
                                ?.code && (
                                    <span className="rounded-full bg-white/15 px-3 py-1.5">
                                        {
                                            student.section
                                                .strand.code
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
                                Your classes will appear
                                after teachers are assigned
                                to your section.
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

                <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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
                </aside>
            </div>
        </div>
    );
}