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

function formatDateTime(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEmploymentType(value) {
  if (value === "part_time") {
    return "Part-time";
  }

  if (value === "full_time") {
    return "Full-time";
  }

  return "Not provided";
}

export default function ArchivedTeachersModule({
  adminProfile,
  onBack,
}) {
  const [teachers, setTeachers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    restoringIds,
    setRestoringIds,
  ] = useState([]);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const isSuperAdmin =
    adminProfile?.role ===
    "super_admin";

  async function callTeacherFunction(
    body,
  ) {
    const {
      data,
      error: functionError,
    } =
      await supabase.functions.invoke(
        "manage-teacher",
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
        // Keep the original function error.
      }

      throw new Error(message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async function loadArchivedTeachers() {
    if (!isSuperAdmin) {
      setTeachers([]);
      setLoading(false);

      setError(
        "Only a super administrator can view archived teachers.",
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const result =
        await callTeacherFunction({
          action: "list_archived",
        });

      const sortedTeachers = [
        ...(result?.teachers || []),
      ].sort((first, second) =>
        String(
          first.full_name || "",
        ).localeCompare(
          String(
            second.full_name || "",
          ),
          undefined,
          {
            sensitivity: "base",
          },
        ),
      );

      setTeachers(sortedTeachers);

      setSelectedIds((current) =>
        current.filter((id) =>
          sortedTeachers.some(
            (teacher) =>
              teacher.id === id,
          ),
        ),
      );
    } catch (loadError) {
      console.error(
        "Failed to load archived teachers:",
        loadError,
      );

      setTeachers([]);

      setError(
        loadError.message ||
          "Unable to load archived teachers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArchivedTeachers();
  }, [isSuperAdmin]);

  const filteredTeachers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return teachers;
      }

      return teachers.filter(
        (teacher) => {
          const searchableText = [
            teacher.teacher_number,
            teacher.full_name,
            teacher.email,
            teacher.contact_number,
            teacher.employment_type,
            teacher
              .archived_by_profile
              ?.full_name,
            teacher
              .archived_by_profile
              ?.email,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query,
          );
        },
      );
    }, [teachers, search]);

  const filteredIds =
    filteredTeachers.map(
      (teacher) => teacher.id,
    );

  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) =>
      selectedIds.includes(id),
    );

  function toggleTeacher(teacherId) {
    setSelectedIds((current) =>
      current.includes(teacherId)
        ? current.filter(
            (id) =>
              id !== teacherId,
          )
        : [...current, teacherId],
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

  async function restoreTeacher(
    teacher,
  ) {
    const confirmed =
      window.confirm(
        `Restore teacher "${teacher.full_name || "Unnamed teacher"}"?\n\nThe account will be reactivated and the teacher will be able to sign in again.`,
      );

    if (!confirmed) return;

    setRestoringIds((current) => [
      ...current,
      teacher.id,
    ]);

    setError("");
    setNotice("");

    try {
      await callTeacherFunction({
        action: "restore",
        id: teacher.id,
      });

      setTeachers((current) =>
        current.filter(
          (currentTeacher) =>
            currentTeacher.id !==
            teacher.id,
        ),
      );

      setSelectedIds((current) =>
        current.filter(
          (id) =>
            id !== teacher.id,
        ),
      );

      setNotice(
        `${
          teacher.full_name ||
          "Teacher"
        } was restored successfully.`,
      );
    } catch (restoreError) {
      console.error(
        "Teacher restore failed:",
        restoreError,
      );

      setError(
        restoreError.message ||
          "Unable to restore the teacher.",
      );
    } finally {
      setRestoringIds((current) =>
        current.filter(
          (id) =>
            id !== teacher.id,
        ),
      );
    }
  }

  async function restoreSelected() {
    const selectedTeachers =
      teachers.filter((teacher) =>
        selectedIds.includes(
          teacher.id,
        ),
      );

    if (
      selectedTeachers.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Restore ${selectedTeachers.length} selected teacher${
          selectedTeachers.length === 1
            ? ""
            : "s"
        }?\n\nTheir login accounts will be reactivated.`,
      );

    if (!confirmed) return;

    setError("");
    setNotice("");

    const restoredIds = [];
    const failedTeachers = [];

    for (
      const teacher of selectedTeachers
    ) {
      setRestoringIds(
        (current) => [
          ...current,
          teacher.id,
        ],
      );

      try {
        await callTeacherFunction({
          action: "restore",
          id: teacher.id,
        });

        restoredIds.push(
          teacher.id,
        );
      } catch (restoreError) {
        console.error(
          `Failed to restore ${
            teacher.full_name ||
            teacher.teacher_number
          }:`,
          restoreError,
        );

        failedTeachers.push(
          teacher,
        );
      } finally {
        setRestoringIds(
          (current) =>
            current.filter(
              (id) =>
                id !== teacher.id,
            ),
        );
      }
    }

    if (restoredIds.length > 0) {
      setTeachers((current) =>
        current.filter(
          (teacher) =>
            !restoredIds.includes(
              teacher.id,
            ),
        ),
      );

      setNotice(
        `${restoredIds.length} teacher${
          restoredIds.length === 1
            ? ""
            : "s"
        } restored successfully.`,
      );
    }

    setSelectedIds(
      failedTeachers.map(
        (teacher) => teacher.id,
      ),
    );

    if (
      failedTeachers.length > 0
    ) {
      setError(
        `${failedTeachers.length} teacher${
          failedTeachers.length === 1
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
        access archived teacher accounts.
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
          Back to Teacher Management
        </button>
      )}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Archived Teachers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and restore archived
            teacher accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadArchivedTeachers
          }
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
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
          htmlFor="archived-teacher-search"
          className="sr-only"
        >
          Search archived teachers
        </label>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />

          <input
            id="archived-teacher-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search teacher number, name, email, or employment type..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {selectedIds.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {selectedIds.length}{" "}
              teacher
              {selectedIds.length === 1
                ? ""
                : "s"}{" "}
              selected
            </p>

            <p className="text-xs text-blue-600">
              Restore the selected teacher
              accounts.
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
              onClick={restoreSelected}
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
                {teachers.length} archived
                teacher
                {teachers.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
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
                        ? "Deselect all teachers"
                        : "Select all teachers"
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
                  Teacher Number
                </th>

                <th className="px-5 py-3 font-medium">
                  Teacher
                </th>

                <th className="px-5 py-3 font-medium">
                  Contact
                </th>

                <th className="px-5 py-3 font-medium">
                  Employment
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
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    Loading archived teachers...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredTeachers.map(
                  (teacher) => {
                    const selected =
                      selectedIds.includes(
                        teacher.id,
                      );

                    const restoring =
                      restoringIds.includes(
                        teacher.id,
                      );

                    return (
                      <tr
                        key={teacher.id}
                        className="border-t border-gray-100"
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              toggleTeacher(
                                teacher.id,
                              )
                            }
                            className="text-gray-400 hover:text-blue-600"
                            aria-label={
                              selected
                                ? `Deselect ${teacher.full_name}`
                                : `Select ${teacher.full_name}`
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
                          {teacher.teacher_number ||
                            "—"}
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">
                            {teacher.full_name ||
                              "Unnamed teacher"}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {teacher.email ||
                              "No email"}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          {teacher.contact_number ||
                            "Not provided"}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          {formatEmploymentType(
                            teacher.employment_type,
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          {formatDateTime(
                            teacher.archived_at,
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="text-gray-700">
                            {teacher
                              .archived_by_profile
                              ?.full_name ||
                              "Unknown administrator"}
                          </p>

                          {teacher
                            .archived_by_profile
                            ?.email && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {
                                teacher
                                  .archived_by_profile
                                  .email
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              restoreTeacher(
                                teacher,
                              )
                            }
                            disabled={
                              restoring
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw
                              className={`h-4 w-4 ${
                                restoring
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />

                            {restoring
                              ? "Restoring..."
                              : "Restore"}
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}

              {!loading &&
                filteredTeachers.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <Users className="mx-auto h-9 w-9 text-gray-300" />

                      <p className="mt-3 font-medium text-gray-600">
                        {search.trim()
                          ? "No archived teachers match your search."
                          : "No archived teachers found."}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {search.trim()
                          ? "Try a different search."
                          : "Archived teacher accounts will appear here."}
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