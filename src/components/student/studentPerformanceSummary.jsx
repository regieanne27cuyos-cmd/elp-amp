import {
    BarChart3,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Loader2,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    UserX,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { supabase } from "../../lib/supabase";

function SummaryCard({
    icon: Icon,
    label,
    value,
    description,
    color = "blue",
}) {
    const colors = {
        blue: {
            wrapper: "bg-blue-50",
            icon: "text-blue-600",
        },
        green: {
            wrapper: "bg-green-50",
            icon: "text-green-600",
        },
        orange: {
            wrapper: "bg-orange-50",
            icon: "text-orange-600",
        },
        red: {
            wrapper: "bg-red-50",
            icon: "text-red-600",
        },
        purple: {
            wrapper: "bg-purple-50",
            icon: "text-purple-600",
        },
        gray: {
            wrapper: "bg-gray-100",
            icon: "text-gray-600",
        },
    };

    const selectedColor =
        colors[color] || colors.blue;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedColor.wrapper}`}
            >
                <Icon
                    className={`h-5 w-5 ${selectedColor.icon}`}
                />
            </div>

            <p className="mt-3 text-xs text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
                {value}
            </p>

            {description && (
                <p className="mt-1 text-xs leading-5 text-gray-500">
                    {description}
                </p>
            )}
        </div>
    );
}

function AttendanceBar({
    label,
    value,
    total,
    color,
}) {
    const percentage =
        total > 0
            ? Math.round((value / total) * 100)
            : 0;

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                    {label}
                </p>

                <p className="text-sm font-medium text-gray-700">
                    {value}{" "}
                    <span className="text-xs text-gray-400">
                        ({percentage}%)
                    </span>
                </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}

export default function StudentPerformanceSummary({
    student,
    classes = [],
}) {
    const [
        activityAccess,
        setActivityAccess,
    ] = useState([]);

    const [
        submissions,
        setSubmissions,
    ] = useState([]);

    const [
        attendanceRecords,
        setAttendanceRecords,
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    async function loadPerformance() {
        const studentId = student?.id;

        if (!studentId) {
            setActivityAccess([]);
            setSubmissions([]);
            setAttendanceRecords([]);
            setLoading(false);
            setError(
                "Student performance is unavailable because the student account could not be identified.",
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [
                activityResult,
                submissionResult,
                attendanceResult,
            ] = await Promise.all([
                supabase
                    .from("activity_students")
                    .select(`
            activity_id,
            student_id,
            can_access,
            activity_status,
            exclusion_reason
          `)
                    .eq("student_id", studentId),

                supabase
                    .from("activity_submissions")
                    .select(`
                    id,
                    activity_id,
                    status
                    `)
                    .eq("student_id", studentId),

                supabase
                    .from("attendance_records")
                    .select(`
                    id,
                    student_id,
                    status,
                    marked_at
                     `)
                    .eq("student_id", studentId),
            ]);

            if (activityResult.error) {
                throw activityResult.error;
            }

            if (submissionResult.error) {
                throw submissionResult.error;
            }

            if (attendanceResult.error) {
                throw attendanceResult.error;
            }

            setActivityAccess(
                activityResult.data || [],
            );

            setSubmissions(
                submissionResult.data || [],
            );

            setAttendanceRecords(
                attendanceResult.data || [],
            );
        } catch (loadError) {
            console.error(
                "Failed to load student performance:",
                {
                    message: loadError?.message,
                    code: loadError?.code,
                    details: loadError?.details,
                    hint: loadError?.hint,
                    originalError: loadError,
                },
            );

            setActivityAccess([]);
            setSubmissions([]);
            setAttendanceRecords([]);

            setError(
                loadError.message ||
                "Unable to load student performance.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPerformance();
    }, [student?.id]);

    const performance = useMemo(() => {
        const uniqueSubjectIds = new Set(
            classes
                .map(
                    (classRecord) =>
                        classRecord.subject_id ||
                        classRecord.subject?.id,
                )
                .filter(Boolean),
        );

        const accessibleActivities =
            activityAccess.filter(
                (record) =>
                    record.can_access !== false,
            );

        const absentActivities =
            activityAccess.filter(
                (record) =>
                    record.can_access === false &&
                    record.exclusion_reason ===
                    "absent",
            );

        const submittedActivityIds =
            new Set(
                submissions
                    .filter((submission) =>
                        [
                            "submitted",
                            "late",
                            "graded",
                        ].includes(
                            String(
                                submission.status || "",
                            ).toLowerCase(),
                        ),
                    )
                    .map(
                        (submission) =>
                            submission.activity_id,
                    ),
            );

        const submittedActivities =
            accessibleActivities.filter(
                (record) =>
                    submittedActivityIds.has(
                        record.activity_id,
                    ),
            ).length;

        const pendingActivities = Math.max(
            accessibleActivities.length -
            submittedActivities,
            0,
        );

        const lateSubmissions =
            submissions.filter(
                (submission) =>
                    String(
                        submission.status || "",
                    ).toLowerCase() === "late",
            ).length;

        const attendance = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
        };

        attendanceRecords.forEach((record) => {
            const status = String(
                record.status || "",
            ).toLowerCase();

            if (
                Object.prototype.hasOwnProperty.call(
                    attendance,
                    status,
                )
            ) {
                attendance[status] += 1;
            }
        });

        const attendanceTotal =
            attendance.present +
            attendance.absent +
            attendance.late +
            attendance.excused;

        const completionPercentage =
            accessibleActivities.length > 0
                ? Math.round(
                    (submittedActivities /
                        accessibleActivities.length) *
                    100,
                )
                : 0;

        const attendanceRate =
            attendanceTotal > 0
                ? Math.round(
                    ((attendance.present +
                        attendance.late) /
                        attendanceTotal) *
                    100,
                )
                : 0;

        return {
            subjectCount:
                uniqueSubjectIds.size,

            assignedActivities:
                accessibleActivities.length,

            submittedActivities,

            pendingActivities,

            absentActivities:
                absentActivities.length,

            lateSubmissions,

            attendance,

            attendanceTotal,

            completionPercentage,

            attendanceRate,
        };
    }, [
        activityAccess,
        submissions,
        attendanceRecords,
        classes,
    ]);

    if (loading) {
        return (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex min-h-[220px] items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

                        <p className="mt-3 text-sm text-gray-500">
                            Loading student performance...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={loadPerformance}
                        className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700 hover:underline"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />

                        <h2 className="font-bold text-gray-900">
                            Student Performance
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Summary of your activities and
                        attendance. Scores and grades are not
                        shown here.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadPerformance}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
                <SummaryCard
                    icon={ShieldCheck}
                    label="Account Status"
                    value={
                        student?.status === "active"
                            ? "Active"
                            : "Inactive"
                    }
                    description="Current student account status"
                    color={
                        student?.status === "active"
                            ? "green"
                            : "gray"
                    }
                />

                <SummaryCard
                    icon={BookOpen}
                    label="Enrolled Subjects"
                    value={performance.subjectCount}
                    description="Subjects in your current section"
                    color="blue"
                />

                <SummaryCard
                    icon={ClipboardCheck}
                    label="Assigned Activities"
                    value={
                        performance.assignedActivities
                    }
                    description="Activities available to you"
                    color="purple"
                />

                <SummaryCard
                    icon={CheckCircle2}
                    label="Submitted"
                    value={
                        performance.submittedActivities
                    }
                    description="Completed activity submissions"
                    color="green"
                />

                <SummaryCard
                    icon={Clock3}
                    label="Pending"
                    value={
                        performance.pendingActivities
                    }
                    description="Activities still requiring submission"
                    color="orange"
                />

                <SummaryCard
                    icon={UserX}
                    label="Missed Due to Absence"
                    value={
                        performance.absentActivities
                    }
                    description="Activities unavailable because of absence"
                    color="red"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Activity Completion
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Submitted activities compared with
                                assigned activities
                            </p>
                        </div>

                        <p className="text-2xl font-bold text-blue-600">
                            {
                                performance.completionPercentage
                            }
                            %
                        </p>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                                width: `${performance.completionPercentage}%`,
                            }}
                        />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-white p-3">
                            <p className="text-lg font-bold text-green-600">
                                {
                                    performance.submittedActivities
                                }
                            </p>

                            <p className="text-xs text-gray-400">
                                Submitted
                            </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                            <p className="text-lg font-bold text-orange-600">
                                {
                                    performance.pendingActivities
                                }
                            </p>

                            <p className="text-xs text-gray-400">
                                Pending
                            </p>
                        </div>

                        <div className="rounded-lg bg-white p-3">
                            <p className="text-lg font-bold text-orange-500">
                                {
                                    performance.lateSubmissions
                                }
                            </p>

                            <p className="text-xs text-gray-400">
                                Submitted Late
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600" />

                                <h3 className="font-semibold text-gray-900">
                                    Attendance Summary
                                </h3>
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                                Attendance records entered by your
                                teachers
                            </p>
                        </div>

                        <p className="text-2xl font-bold text-green-600">
                            {performance.attendanceRate}%
                        </p>
                    </div>

                    {performance.attendanceTotal ===
                        0 ? (
                        <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center">
                            <p className="text-sm font-medium text-gray-600">
                                No attendance records yet
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                                Your attendance summary will appear
                                after your teachers record attendance.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 space-y-4">
                            <AttendanceBar
                                label="Present"
                                value={
                                    performance.attendance.present
                                }
                                total={
                                    performance.attendanceTotal
                                }
                                color="bg-green-500"
                            />

                            <AttendanceBar
                                label="Late"
                                value={
                                    performance.attendance.late
                                }
                                total={
                                    performance.attendanceTotal
                                }
                                color="bg-orange-500"
                            />

                            <AttendanceBar
                                label="Absent"
                                value={
                                    performance.attendance.absent
                                }
                                total={
                                    performance.attendanceTotal
                                }
                                color="bg-red-500"
                            />

                            {performance.attendance
                                .excused > 0 && (
                                    <AttendanceBar
                                        label="Excused"
                                        value={
                                            performance.attendance
                                                .excused
                                        }
                                        total={
                                            performance.attendanceTotal
                                        }
                                        color="bg-blue-500"
                                    />
                                )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}