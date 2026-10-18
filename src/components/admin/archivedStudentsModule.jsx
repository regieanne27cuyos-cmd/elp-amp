import {
    Archive,
    ArrowLeft,
    CheckSquare,
    RefreshCw,
    RotateCcw,
    Search,
    Square,
    Users,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { supabase } from "../../lib/supabase";

function normalizeRelation(value) {
    if (Array.isArray(value)) {
        return value[0] || null;
    }

    return value || null;
}

function normalizeStudent(student) {
    const section = normalizeRelation(
        student.section,
    );

    return {
        ...student,
        section: section
            ? {
                ...section,
                strand: normalizeRelation(
                    section.strand,
                ),
                school_year:
                    normalizeRelation(
                        section.school_year,
                    ),
            }
            : null,
    };
}

function formatStudentName(student) {
    const formattedName = [
        student.last_name,
        student.first_name,
        student.middle_name,
        student.suffix,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        formattedName ||
        student.full_name ||
        "Unnamed student"
    );
}

function formatDateTime(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        },
    );
}

export default function ArchivedStudentsModule({
    adminProfile,
    onBack,
}) {
    const [students, setStudents] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [restoringIds, setRestoringIds] =
        useState([]);

    const [selectedIds, setSelectedIds] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [error, setError] =
        useState("");

    const [notice, setNotice] =
        useState("");

    const isSuperAdmin =
        adminProfile?.role ===
        "super_admin";

    async function callStudentFunction(
        body,
    ) {
        const {
            data,
            error: functionError,
        } =
            await supabase.functions.invoke(
                "manage-student",
                {
                    body,
                },
            );

        if (functionError) {
            let message =
                functionError.message;

            try {
                const responseBody =
                    await functionError.context?.json();

                if (responseBody?.error) {
                    message =
                        responseBody.error;
                }
            } catch {
                // Use the original function error.
            }

            throw new Error(message);
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        return data;
    }

    async function loadArchivedStudents() {
        if (!isSuperAdmin) {
            setStudents([]);
            setLoading(false);
            setError(
                "Only a super administrator can view archived students.",
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result =
                await callStudentFunction({
                    action: "list_archived",
                });

            const normalizedStudents = (
                result?.students || []
            )
                .map(normalizeStudent)
                .sort((first, second) =>
                    String(
                        first.last_name || "",
                    ).localeCompare(
                        String(
                            second.last_name || "",
                        ),
                        undefined,
                        {
                            sensitivity: "base",
                        },
                    ),
                );

            setStudents(
                normalizedStudents,
            );

            setSelectedIds((current) =>
                current.filter((id) =>
                    normalizedStudents.some(
                        (student) =>
                            student.id === id,
                    ),
                ),
            );
        } catch (loadError) {
            console.error(
                "Failed to load archived students:",
                loadError,
            );

            setStudents([]);

            setError(
                loadError.message ||
                "Unable to load archived students.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadArchivedStudents();
    }, [isSuperAdmin]);

    const filteredStudents =
        useMemo(() => {
            const query =
                search.trim().toLowerCase();

            if (!query) {
                return students;
            }

            return students.filter(
                (student) => {
                    const searchableText = [
                        student.student_number,
                        student.first_name,
                        student.middle_name,
                        student.last_name,
                        student.suffix,
                        student.full_name,
                        student.email,
                        student.contact_number,
                        student.section
                            ?.section_name,
                        student.section
                            ?.grade_level,
                        student.section
                            ?.strand?.code,
                        student.section
                            ?.strand?.name,
                        student.section
                            ?.school_year?.name,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchableText.includes(
                        query,
                    );
                },
            );
        }, [students, search]);

    const filteredIds =
        filteredStudents.map(
            (student) => student.id,
        );

    const allFilteredSelected =
        filteredIds.length > 0 &&
        filteredIds.every((id) =>
            selectedIds.includes(id),
        );

    function toggleStudent(studentId) {
        setSelectedIds((current) =>
            current.includes(studentId)
                ? current.filter(
                    (id) => id !== studentId,
                )
                : [...current, studentId],
        );
    }

    function toggleAllFiltered() {
        if (allFilteredSelected) {
            setSelectedIds((current) =>
                current.filter(
                    (id) =>
                        !filteredIds.includes(id),
                ),
            );

            return;
        }

        setSelectedIds((current) => [
            ...new Set([
                ...current,
                ...filteredIds,
            ]),
        ]);
    }

    async function restoreStudent(
        student,
    ) {
        const confirmed =
            window.confirm(
                `Restore student "${formatStudentName(
                    student,
                )}"?\n\nThe account will be reactivated and the student will be able to sign in again.`,
            );

        if (!confirmed) return;

        setRestoringIds((current) => [
            ...current,
            student.id,
        ]);

        setError("");
        setNotice("");

        try {
            await callStudentFunction({
                action: "restore",
                id: student.id,
            });

            setStudents((current) =>
                current.filter(
                    (currentStudent) =>
                        currentStudent.id !==
                        student.id,
                ),
            );

            setSelectedIds((current) =>
                current.filter(
                    (id) =>
                        id !== student.id,
                ),
            );

            setNotice(
                `${formatStudentName(
                    student,
                )} was restored successfully.`,
            );
        } catch (restoreError) {
            console.error(
                "Student restore failed:",
                restoreError,
            );

            setError(
                restoreError.message ||
                "Unable to restore the student.",
            );
        } finally {
            setRestoringIds(
                (current) =>
                    current.filter(
                        (id) =>
                            id !== student.id,
                    ),
            );
        }
    }

    async function restoreSelected() {
        const selectedStudents =
            students.filter((student) =>
                selectedIds.includes(
                    student.id,
                ),
            );

        if (
            selectedStudents.length === 0
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Restore ${selectedStudents.length} selected student${selectedStudents.length === 1
                    ? ""
                    : "s"
                }?\n\nTheir login accounts will be reactivated.`,
            );

        if (!confirmed) return;

        setError("");
        setNotice("");

        const restoredIds = [];
        const failedStudents = [];

        for (
            const student of
            selectedStudents
        ) {
            setRestoringIds(
                (current) => [
                    ...current,
                    student.id,
                ],
            );

            try {
                await callStudentFunction({
                    action: "restore",
                    id: student.id,
                });

                restoredIds.push(
                    student.id,
                );
            } catch (restoreError) {
                console.error(
                    `Failed to restore ${formatStudentName(
                        student,
                    )}:`,
                    restoreError,
                );

                failedStudents.push(
                    student,
                );
            } finally {
                setRestoringIds(
                    (current) =>
                        current.filter(
                            (id) =>
                                id !== student.id,
                        ),
                );
            }
        }

        if (restoredIds.length > 0) {
            setStudents((current) =>
                current.filter(
                    (student) =>
                        !restoredIds.includes(
                            student.id,
                        ),
                ),
            );

            setNotice(
                `${restoredIds.length} student${restoredIds.length === 1
                    ? ""
                    : "s"
                } restored successfully.`,
            );
        }

        setSelectedIds(
            failedStudents.map(
                (student) => student.id,
            ),
        );

        if (
            failedStudents.length > 0
        ) {
            setError(
                `${failedStudents.length} student${failedStudents.length === 1
                    ? ""
                    : "s"
                } could not be restored.`,
            );
        }
    }

    if (!isSuperAdmin) {
        return (
            <div
                role="alert"
                className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700"
            >
                Only a super administrator can
                access archived student accounts.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="flex w-fit items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Student Management
                </button>
            )}

            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        Archived Students
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View and restore archived
                        student accounts.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        loadArchivedStudents
                    }
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${loading
                            ? "animate-spin"
                            : ""
                            }`}
                    />

                    Refresh
                </button>
            </header>

            {notice && (
                <div
                    role="status"
                    className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {notice}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <label
                    htmlFor="archived-student-search"
                    className="sr-only"
                >
                    Search archived students
                </label>

                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                    />

                    <input
                        id="archived-student-search"
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value,
                            )
                        }
                        placeholder="Search student number, name, email, or section..."
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </section>

            {selectedIds.length > 0 && (
                <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-blue-800">
                            {selectedIds.length}{" "}
                            student
                            {selectedIds.length === 1
                                ? ""
                                : "s"}{" "}
                            selected
                        </p>

                        <p className="text-xs text-blue-600">
                            Restore the selected
                            student accounts.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setSelectedIds([])
                            }
                            disabled={
                                restoringIds.length > 0
                            }
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Clear
                        </button>

                        <button
                            type="button"
                            onClick={
                                restoreSelected
                            }
                            disabled={
                                restoringIds.length > 0
                            }
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="h-4 w-4" />

                            {restoringIds.length > 0
                                ? "Restoring..."
                                : "Restore Selected"}
                        </button>
                    </div>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                            <Archive className="h-5 w-5 text-amber-600" />
                        </div>

                        <div>
                            <h2 className="font-bold text-gray-900">
                                Archived Accounts
                            </h2>

                            <p className="text-xs text-gray-500">
                                {students.length} archived
                                student
                                {students.length === 1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1150px] text-sm">
                        <thead>
                            <tr className="bg-white text-left text-gray-500">
                                <th className="w-12 px-5 py-3">
                                    <button
                                        type="button"
                                        onClick={
                                            toggleAllFiltered
                                        }
                                        className="text-gray-400 hover:text-blue-600"
                                        aria-label={
                                            allFilteredSelected
                                                ? "Deselect all students"
                                                : "Select all students"
                                        }
                                    >
                                        {allFilteredSelected ? (
                                            <CheckSquare className="h-4 w-4 text-blue-600" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                </th>

                                <th className="px-5 py-3 font-medium">
                                    Student Number
                                </th>

                                <th className="px-5 py-3 font-medium">
                                    Student
                                </th>

                                <th className="px-5 py-3 font-medium">
                                    Previous Section
                                </th>

                                <th className="px-5 py-3 font-medium">
                                    Archived Date
                                </th>

                                <th className="px-5 py-3 font-medium">
                                    Archived By
                                </th>

                                <th className="px-5 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-12 text-center text-gray-400"
                                    >
                                        Loading archived
                                        students...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredStudents.map(
                                    (student) => {
                                        const selected =
                                            selectedIds.includes(
                                                student.id,
                                            );

                                        const restoring =
                                            restoringIds.includes(
                                                student.id,
                                            );

                                        return (
                                            <tr
                                                key={student.id}
                                                className="border-t border-gray-100"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleStudent(
                                                                student.id,
                                                            )
                                                        }
                                                        className="text-gray-400 hover:text-blue-600"
                                                        aria-label={
                                                            selected
                                                                ? `Deselect ${formatStudentName(
                                                                    student,
                                                                )}`
                                                                : `Select ${formatStudentName(
                                                                    student,
                                                                )}`
                                                        }
                                                    >
                                                        {selected ? (
                                                            <CheckSquare className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <Square className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </td>

                                                <td className="px-5 py-3.5 font-medium text-gray-600">
                                                    {student.student_number ||
                                                        "—"}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <p className="font-medium text-gray-900">
                                                        {formatStudentName(
                                                            student,
                                                        )}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {student.email ||
                                                            "No email"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-3.5 text-gray-600">
                                                    {student.section ? (
                                                        <>
                                                            Grade{" "}
                                                            {
                                                                student
                                                                    .section
                                                                    .grade_level
                                                            }
                                                            {" · "}
                                                            {
                                                                student
                                                                    .section
                                                                    .section_name
                                                            }

                                                            <p className="mt-1 text-xs text-gray-400">
                                                                {student
                                                                    .section
                                                                    .strand
                                                                    ?.code ||
                                                                    "No strand"}
                                                                {" · "}
                                                                {student
                                                                    .section
                                                                    .school_year
                                                                    ?.name ||
                                                                    "No school year"}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        "Not assigned"
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5 text-gray-600">
                                                    {formatDateTime(
                                                        student.archived_at,
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5 text-gray-600">
                                                    {student
                                                        .archived_by_profile
                                                        ?.full_name ||
                                                        student
                                                            .archived_by_profile
                                                            ?.email ||
                                                        "Unknown administrator"}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                restoreStudent(
                                                                    student,
                                                                )
                                                            }
                                                            disabled={
                                                                restoring
                                                            }
                                                            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />

                                                            {restoring
                                                                ? "Restoring..."
                                                                : "Restore"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}

                            {!loading &&
                                filteredStudents.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center"
                                        >
                                            <Users className="mx-auto h-8 w-8 text-gray-300" />

                                            <p className="mt-3 text-sm font-medium text-gray-600">
                                                {students.length ===
                                                    0
                                                    ? "No archived students"
                                                    : "No students match your search"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {students.length ===
                                                    0
                                                    ? "Archived students will appear here."
                                                    : "Try a different search term."}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}