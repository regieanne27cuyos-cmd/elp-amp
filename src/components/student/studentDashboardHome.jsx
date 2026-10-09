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

    return new Date(value).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatActivityType(value) {
    return String(value || "activity")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
}) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color]
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
        </div>
    );
}

function ClassCard({
    classRecord,
    onOpenClass,
}) {
    const subject =
        classRecord.subject?.subject_name ||
        "Subject unavailable";

    const teacherName =
        classRecord.teacher?.profile?.full_name ||
        "Teacher unavailable";

    return (
        <button
            type="button"
            onClick={() => onOpenClass?.(classRecord)}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
            <SubjectImage
                path={classRecord.subject?.image_path}
                name={subject}
                className="h-32 w-full"
            />

            <div className="p-4">
                <p className="text-xs font-medium text-blue-600">
                    {classRecord.subject?.subject_code || "—"}
                </p>

                <h3 className="mt-1 font-semibold text-gray-900">
                    {subject}
                </h3>

                <p className="mt-2 text-xs text-gray-500">
                    {teacherName}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-4 w-4" />

                    Grade{" "}
                    {classRecord.section?.grade_level || "—"}
                    {" · "}
                    {classRecord.section?.section_name ||
                        "Section unavailable"}
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-600">
                    Open class
                </div>
            </div>
        </button>
    );
}

export default function StudentDashboardHome({
    student,
    classes,
    activities,
    loading,
    error,
    onRetry,
    onOpenClass,
    onSelectView,
}) {
    const now = new Date();

    const upcomingActivities = activities
        .filter(
            (activity) =>
                activity.due_at &&
                new Date(activity.due_at) >= now,
        )
        .slice(0, 5);

    const overdueActivities = activities.filter(
        (activity) =>
            activity.due_at &&
            new Date(activity.due_at) < now,
    );

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

                <p className="mt-1 text-sm">{error}</p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 flex items-center gap-2 text-sm font-medium hover:underline"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        );
    }

    const firstName =
        student?.full_name?.split(" ")[0] ||
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
                            View your classes, activities, deadlines,
                            and learning progress.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white/15 px-3 py-1.5">
                                {student?.student_number ||
                                    "No student number"}
                            </span>

                            <span className="rounded-full bg-white/15 px-3 py-1.5">
                                Grade{" "}
                                {student?.section?.grade_level || "—"}
                                {" · "}
                                {student?.section?.section_name ||
                                    "No section"}
                            </span>

                            {student?.section?.strand?.code && (
                                <span className="rounded-full bg-white/15 px-3 py-1.5">
                                    {student.section.strand.code}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
                        {getInitials(student?.full_name)}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={BookOpen}
                    label="My Classes"
                    value={classes.length}
                    color="blue"
                />

                <StatCard
                    icon={ClipboardList}
                    label="Published Activities"
                    value={activities.length}
                    color="green"
                />

                <StatCard
                    icon={Clock}
                    label="Upcoming Deadlines"
                    value={upcomingActivities.length}
                    color="orange"
                />

                <StatCard
                    icon={CheckCircle2}
                    label="Past Deadlines"
                    value={overdueActivities.length}
                    color="purple"
                />
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                My Classes
                            </h2>

                            <p className="text-sm text-gray-500">
                                Subjects assigned to your section
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                onSelectView("classes")
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
                                Your classes will appear after teachers
                                are assigned to your section.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {classes.slice(0, 6).map(
                                (classRecord) => (
                                    <ClassCard
                                        key={classRecord.id}
                                        classRecord={classRecord}
                                        onOpenClass={onOpenClass}
                                    />
                                ),
                            )}
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

                    {upcomingActivities.length === 0 ? (
                        <div className="py-10 text-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />

                            <p className="mt-3 text-sm text-gray-500">
                                No upcoming deadlines.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="rounded-xl border border-gray-100 p-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-600">
                                                {formatActivityType(
                                                    activity.activity_type,
                                                )}
                                            </span>

                                            <p className="mt-2 truncate text-sm font-medium text-gray-900">
                                                {activity.title}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-gray-500">
                                                {activity.classRecord?.subject
                                                    ?.subject_name ||
                                                    "Subject unavailable"}
                                            </p>

                                            <p className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDateTime(
                                                    activity.due_at,
                                                )}
                                            </p>
                                        </div>

                                        <span className="shrink-0 text-xs font-medium text-gray-500">
                                            {activity.points || 0} pts
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}