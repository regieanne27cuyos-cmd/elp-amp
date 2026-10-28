import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    LoaderCircle,
    RotateCcw,
    UserX,
    X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function formatDate(value) {
    if (!value) return "Unknown date";

    return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getDisplayName(profile) {
    if (!profile) return "Unknown student";
    return profile.full_name || "Unknown student";
}

export default function TeacherAbsentActivityAccess({ activity }) {
    const [open, setOpen] = useState(false);
    const [records, setRecords] = useState([]);
    const [studentsById, setStudentsById] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");

    const absentRecords = useMemo(
        () => records.filter((record) => record.attendance_status === "absent"),
        [records],
    );

    async function loadAbsentStudents({ showLoader = true } = {}) {
        if (!activity?.id) return;

        if (showLoader) setLoading(true);
        setError("");

        try {
            const { data: accessRows, error: accessError } = await supabase
                .from("activity_students")
                .select(
                    `
          id,
          activity_id,
          student_id,
          can_access,
          activity_status,
          exclusion_reason,
          attendance_status,
          attendance_date,
          late_submission_allowed,
          late_allowed_at
        `,
                )
                .eq("activity_id", activity.id)
                .eq("attendance_status", "absent")
                .order("student_id", { ascending: true });

            if (accessError) throw accessError;

            const rows = accessRows || [];
            const studentIds = rows.map((record) => record.student_id);
            const nextStudents = new Map();

            if (studentIds.length > 0) {
                const [profileResult, detailsResult] = await Promise.all([
                    supabase
                        .from("profiles")
                        .select("id, full_name, email")
                        .in("id", studentIds),
                    supabase
                        .from("student_details")
                        .select("id, student_number")
                        .in("id", studentIds),
                ]);

                if (profileResult.error) throw profileResult.error;
                if (detailsResult.error) throw detailsResult.error;

                const detailsById = new Map(
                    (detailsResult.data || []).map((detail) => [detail.id, detail]),
                );

                (profileResult.data || []).forEach((profile) => {
                    nextStudents.set(profile.id, {
                        ...profile,
                        student_number:
                            detailsById.get(profile.id)?.student_number ||
                            "No student number",
                    });
                });
            }

            setRecords(rows);
            setStudentsById(nextStudents);
        } catch (loadError) {
            console.error("Failed to load absent activity students:", loadError);
            setError(
                loadError.message ||
                "Unable to load absent students for this activity.",
            );
        } finally {
            if (showLoader) setLoading(false);
        }
    }

    useEffect(() => {
        loadAbsentStudents();
    }, [activity?.id]);

    async function updateAccess(record, allow) {
        setSavingId(record.student_id);
        setError("");

        try {
            const { error: updateError } = await supabase.rpc(
                "set_absent_student_activity_access",
                {
                    p_activity_id: activity.id,
                    p_student_id: record.student_id,
                    p_allow: allow,
                },
            );

            if (updateError) throw updateError;
            await loadAbsentStudents({ showLoader: false });
        } catch (updateError) {
            console.error("Failed to update absent student access:", updateError);
            setError(
                updateError.message ||
                "Unable to update the student's activity access.",
            );
        } finally {
            setSavingId(null);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
                <UserX className="h-4 w-4" />
                Absent students
                {absentRecords.length > 0 && (
                    <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">
                        {absentRecords.length}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Absent Students — {activity.title}
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Allow selected absent students to access and submit this
                                    activity late.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                                aria-label="Close absent students"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                                    <LoaderCircle className="h-5 w-5 animate-spin" />
                                    Loading absent students...
                                </div>
                            )}

                            {!loading && absentRecords.length === 0 && (
                                <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
                                    <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
                                    <p className="mt-3 font-medium text-green-800">
                                        No absent students
                                    </p>
                                    <p className="mt-1 text-sm text-green-700">
                                        Everyone with attendance for this date can access the
                                        activity.
                                    </p>
                                </div>
                            )}

                            {!loading && absentRecords.length > 0 && (
                                <div className="space-y-3">
                                    {absentRecords.map((record) => {
                                        const student = studentsById.get(record.student_id);
                                        const allowed = record.late_submission_allowed;
                                        const saving = savingId === record.student_id;

                                        return (
                                            <div
                                                key={record.id || record.student_id}
                                                className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium text-gray-900">
                                                            {getDisplayName(student)}
                                                        </p>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${allowed
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {allowed
                                                                ? "Late access allowed"
                                                                : "Missing — Absent"}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {student?.student_number || "No student number"}
                                                        {record.attendance_date
                                                            ? ` · Absent on ${formatDate(record.attendance_date)}`
                                                            : ""}
                                                    </p>
                                                </div>

                                                {allowed ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAccess(record, false)}
                                                        disabled={saving}
                                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                                                    >
                                                        {saving ? (
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-4 w-4" />
                                                        )}
                                                        Revoke late access
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAccess(record, true)}
                                                        disabled={saving}
                                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                                                    >
                                                        {saving ? (
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Clock3 className="h-4 w-4" />
                                                        )}
                                                        Allow late submission
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
