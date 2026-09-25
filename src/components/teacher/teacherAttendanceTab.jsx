import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    CalendarPlus,
    CheckCircle2,
    Clock3,
    Download,
    Pencil,
    RefreshCw,
    Trash2,
    UserCheck,
    X,
    XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
    exportAllAttendanceSheets,
    exportAttendanceSheet,
} from "../../utils/attendanceExport";

const statuses = [
    {
        value: "present",
        label: "Present",
        icon: CheckCircle2,
        activeClass:
            "border-green-200 bg-green-50 text-green-700",
    },
    {
        value: "absent",
        label: "Absent",
        icon: XCircle,
        activeClass:
            "border-red-200 bg-red-50 text-red-700",
    },
    {
        value: "late",
        label: "Late",
        icon: Clock3,
        activeClass:
            "border-orange-200 bg-orange-50 text-orange-700",
    },
];

function todayString() {
    const date = new Date();
    const offset = date.getTimezoneOffset();

    return new Date(
        date.getTime() - offset * 60 * 1000,
    )
        .toISOString()
        .slice(0, 10);
}

function formatDate(value) {
    if (!value) return "Unknown date";

    return new Date(
        `${value}T00:00:00`,
    ).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function StudentIdentity({ student }) {
    const initials = (
        student.full_name || "Student"
    )
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
            </div>

            <div className="min-w-0">
                <p className="font-medium text-gray-900">
                    {student.full_name || "Unnamed student"}
                </p>

                <p className="truncate text-xs text-gray-400">
                    {student.student_number || "No student number"}
                </p>
            </div>
        </div>
    );
}

function SummaryBadge({ status, count }) {
    const styles = {
        present: "bg-green-100 text-green-700",
        absent: "bg-red-100 text-red-700",
        late: "bg-orange-100 text-orange-700",
    };

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}
        >
            {status}: {count}
        </span>
    );
}

function AttendanceEditor({
    students,
    sheet,
    saving,
    error,
    onClose,
    onSave,
}) {
    const [date, setDate] = useState(
        sheet?.attendance_date || todayString(),
    );

    const [title, setTitle] = useState(
        sheet?.title || "",
    );

    const [records, setRecords] = useState({});

    useEffect(() => {
        const existingRecords = new Map(
            (sheet?.records || []).map((record) => [
                record.student_id,
                record,
            ]),
        );

        setRecords(
            Object.fromEntries(
                students.map((student) => {
                    const existing = existingRecords.get(
                        student.student_id,
                    );

                    return [
                        student.student_id,
                        {
                            status:
                                existing?.status || "present",
                            remarks:
                                existing?.remarks || "",
                        },
                    ];
                }),
            ),
        );
    }, [students, sheet]);

    const counts = useMemo(() => {
        return Object.values(records).reduce(
            (totals, record) => {
                if (record.status in totals) {
                    totals[record.status] += 1;
                }

                return totals;
            },
            {
                present: 0,
                absent: 0,
                late: 0,
            },
        );
    }, [records]);

    function updateRecord(
        studentId,
        field,
        value,
    ) {
        setRecords((current) => ({
            ...current,
            [studentId]: {
                ...current[studentId],
                [field]: value,
            },
        }));
    }

    function markAll(status) {
        setRecords((current) =>
            Object.fromEntries(
                Object.entries(current).map(
                    ([studentId, record]) => [
                        studentId,
                        {
                            ...record,
                            status,
                        },
                    ],
                ),
            ),
        );
    }

    function handleSubmit(event) {
        event.preventDefault();

        onSave({
            sheetId: sheet?.id || null,
            attendanceDate: date,
            title,
            records: students.map((student) => ({
                student_id: student.student_id,
                status:
                    records[student.student_id]
                        ?.status || "present",
                remarks:
                    records[student.student_id]
                        ?.remarks || "",
            })),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
                    <div>
                        <h2 className="font-bold text-gray-900">
                            {sheet
                                ? "Edit Attendance Sheet"
                                : "Create Attendance Sheet"}
                        </h2>

                        <p className="text-xs text-gray-500">
                            Mark every student as present,
                            absent, or late.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                        aria-label="Close attendance editor"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6"
                >
                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="attendance-date"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Attendance date
                            </label>

                            <input
                                id="attendance-date"
                                type="date"
                                value={date}
                                max={todayString()}
                                onChange={(event) =>
                                    setDate(event.target.value)
                                }
                                required
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="attendance-title"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Title (optional)
                            </label>

                            <input
                                id="attendance-title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Regular class attendance"
                                maxLength={150}
                                disabled={saving}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                        <div className="flex flex-wrap gap-2">
                            <SummaryBadge
                                status="present"
                                count={counts.present}
                            />

                            <SummaryBadge
                                status="absent"
                                count={counts.absent}
                            />

                            <SummaryBadge
                                status="late"
                                count={counts.late}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    markAll("present")
                                }
                                disabled={saving}
                                className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
                            >
                                Mark all present
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    markAll("absent")
                                }
                                disabled={saving}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                                Mark all absent
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full min-w-[850px] text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left text-gray-500">
                                    <th className="px-4 py-3 font-medium">
                                        Student
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 font-medium">
                                        Remarks
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {students.map((student) => {
                                    const record =
                                        records[
                                        student.student_id
                                        ] || {
                                            status: "present",
                                            remarks: "",
                                        };

                                    return (
                                        <tr
                                            key={student.student_id}
                                            className="border-t border-gray-100"
                                        >
                                            <td className="px-4 py-3">
                                                <StudentIdentity
                                                    student={student}
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {statuses.map(
                                                        ({
                                                            value,
                                                            label,
                                                            icon: Icon,
                                                            activeClass,
                                                        }) => {
                                                            const selected =
                                                                record.status ===
                                                                value;

                                                            return (
                                                                <button
                                                                    key={value}
                                                                    type="button"
                                                                    disabled={saving}
                                                                    onClick={() =>
                                                                        updateRecord(
                                                                            student.student_id,
                                                                            "status",
                                                                            value,
                                                                        )
                                                                    }
                                                                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${selected
                                                                        ? activeClass
                                                                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                                                                        }`}
                                                                >
                                                                    <Icon className="h-3.5 w-3.5" />
                                                                    {label}
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={record.remarks}
                                                    onChange={(event) =>
                                                        updateRecord(
                                                            student.student_id,
                                                            "remarks",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Optional remarks"
                                                    maxLength={300}
                                                    disabled={saving}
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                !date ||
                                students.length === 0
                            }
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Attendance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TeacherAttendanceTab({
    classRecord,
    students,
    studentsLoading,
    studentsError,
    onRetryStudents,
}) {
    const [sheets, setSheets] = useState([]);
    const [loading, setLoading] =
        useState(true);
    const [saving, setSaving] =
        useState(false);

    const [pageError, setPageError] =
        useState("");
    const [actionError, setActionError] =
        useState("");

    const [editorOpen, setEditorOpen] =
        useState(false);
    const [selectedSheet, setSelectedSheet] =
        useState(null);

    async function loadSheets() {
        setLoading(true);
        setPageError("");

        try {
            const { data, error } = await supabase
                .from("attendance_sheets")
                .select(`
          id,
          teaching_assignment_id,
          attendance_date,
          title,
          created_by,
          created_at,
          updated_at,
          records:attendance_records (
            id,
            student_id,
            status,
            remarks,
            marked_at
          )
        `)
                .eq(
                    "teaching_assignment_id",
                    classRecord.id,
                )
                .order("attendance_date", {
                    ascending: false,
                });

            if (error) throw error;

            setSheets(
                (data || []).map((sheet) => ({
                    ...sheet,
                    records: Array.isArray(
                        sheet.records,
                    )
                        ? sheet.records
                        : [],
                })),
            );
        } catch (error) {
            console.error(
                "Failed to load attendance sheets:",
                error,
            );

            setPageError(
                error.message ||
                "Unable to load attendance sheets.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSheets();
    }, [classRecord.id]);

    function openCreateEditor() {
        setSelectedSheet(null);
        setActionError("");
        setEditorOpen(true);
    }

    function openEditEditor(sheet) {
        setSelectedSheet(sheet);
        setActionError("");
        setEditorOpen(true);
    }

    function closeEditor() {
        if (saving) return;

        setEditorOpen(false);
        setSelectedSheet(null);
        setActionError("");
    }

    async function handleSave(form) {
        setSaving(true);
        setActionError("");

        try {
            const { error } = await supabase.rpc(
                "save_teacher_attendance_sheet",
                {
                    p_teaching_assignment_id:
                        classRecord.id,
                    p_sheet_id: form.sheetId,
                    p_attendance_date:
                        form.attendanceDate,
                    p_title: form.title.trim() || null,
                    p_records: form.records,
                },
            );

            if (error) throw error;

            setEditorOpen(false);
            setSelectedSheet(null);
            setActionError("");

            await loadSheets();
        } catch (error) {
            console.error(
                "Failed to save attendance:",
                error,
            );

            if (error.code === "23505") {
                setActionError(
                    "An attendance sheet already exists for this date.",
                );
            } else {
                setActionError(
                    error.message ||
                    "Unable to save attendance.",
                );
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(sheet) {
        const confirmed = window.confirm(
            `Delete the attendance sheet for ${formatDate(
                sheet.attendance_date,
            )}?`,
        );

        if (!confirmed) return;

        setPageError("");

        const { error } = await supabase
            .from("attendance_sheets")
            .delete()
            .eq("id", sheet.id);

        if (error) {
            console.error(
                "Failed to delete attendance sheet:",
                error,
            );

            setPageError(
                error.message ||
                "Unable to delete attendance sheet.",
            );

            return;
        }

        setSheets((current) =>
            current.filter(
                (currentSheet) =>
                    currentSheet.id !== sheet.id,
            ),
        );
    }

    if (studentsLoading) {
        return (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-gray-500">
                Loading students...
            </div>
        );
    }

    if (studentsError) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    <p>{studentsError}</p>

                    <button
                        type="button"
                        onClick={onRetryStudents}
                        className="mt-3 flex items-center gap-2 font-medium hover:underline"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() =>
                        exportAllAttendanceSheets({
                            sheets,
                            students,
                            classRecord,
                        })
                    }
                    disabled={
                        loading ||
                        sheets.length === 0 ||
                        students.length === 0
                    }
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Download className="h-4 w-4" />
                    Export All
                </button>

                <button
                    type="button"
                    onClick={openCreateEditor}
                    disabled={
                        students.length === 0 || saving
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CalendarPlus className="h-4 w-4" />
                    Create Attendance Sheet
                </button>
            </div>

            {pageError && (
                <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pageError}
                </div>
            )}

            {loading && (
                <div className="rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                    Loading attendance sheets...
                </div>
            )}

            {!loading &&
                students.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                        <UserCheck className="mx-auto h-8 w-8 text-gray-300" />

                        <p className="mt-3 font-medium text-gray-700">
                            No students in this section
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Students assigned by the
                            administrator will appear here.
                        </p>
                    </div>
                )}

            {!loading &&
                students.length > 0 &&
                sheets.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                        <UserCheck className="mx-auto h-8 w-8 text-gray-300" />

                        <p className="mt-3 font-medium text-gray-700">
                            No attendance sheets yet
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Create the first attendance sheet
                            for this class.
                        </p>
                    </div>
                )}

            {!loading && sheets.length > 0 && (
                <div className="space-y-3">
                    {sheets.map((sheet) => {
                        const counts = {
                            present: 0,
                            absent: 0,
                            late: 0,
                        };

                        sheet.records.forEach((record) => {
                            if (record.status in counts) {
                                counts[record.status] += 1;
                            }
                        });

                        return (
                            <div
                                key={sheet.id}
                                className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {sheet.title ||
                                            "Class Attendance"}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {formatDate(
                                            sheet.attendance_date,
                                        )}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <SummaryBadge
                                            status="present"
                                            count={counts.present}
                                        />

                                        <SummaryBadge
                                            status="absent"
                                            count={counts.absent}
                                        />

                                        <SummaryBadge
                                            status="late"
                                            count={counts.late}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            exportAttendanceSheet({
                                                sheet,
                                                students,
                                                classRecord,
                                            })
                                        }
                                        className="rounded-lg p-2 text-gray-400 hover:bg-green-50 hover:text-green-600"
                                        aria-label="Export attendance sheet"
                                        title="Export attendance sheet"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditEditor(sheet)
                                        }
                                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-600"
                                        aria-label="Edit attendance sheet"
                                        title="Edit attendance sheet"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDelete(sheet)
                                        }
                                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        aria-label="Delete attendance sheet"
                                        title="Delete attendance sheet"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editorOpen && (
                <AttendanceEditor
                    students={students}
                    sheet={selectedSheet}
                    saving={saving}
                    error={actionError}
                    onClose={closeEditor}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}