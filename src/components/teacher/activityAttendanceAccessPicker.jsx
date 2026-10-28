import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function localDateString(value = new Date()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function publicationDate(initialData) {
  if (!initialData) return localDateString();

  return localDateString(
    initialData.published_at || initialData.created_at || new Date(),
  );
}

function statusStyle(status) {
  if (status === "absent") return "bg-red-100 text-red-700";
  if (status === "late") return "bg-orange-100 text-orange-700";
  return "bg-green-100 text-green-700";
}

export default function ActivityAttendanceAccessPicker({
  classRecordId,
  students = [],
  studentsLoading = false,
  studentsError = "",
  initialData = null,
  existingAccess = [],
  disabled = false,
  onChange,
}) {
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [lateAllowedStudentIds, setLateAllowedStudentIds] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  const accessByStudent = useMemo(
    () => new Map(existingAccess.map((record) => [record.student_id, record])),
    [existingAccess],
  );

  const accessDate = useMemo(
    () => publicationDate(initialData),
    [initialData?.id, initialData?.published_at, initialData?.created_at],
  );

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      if (!classRecordId) {
        setAttendanceByStudent({});
        setLoadingAttendance(false);
        return;
      }

      setLoadingAttendance(true);
      setAttendanceError("");

      try {
        const { data, error } = await supabase
          .from("attendance_sheets")
          .select(
            `
            id,
            attendance_date,
            records:attendance_records (
              student_id,
              status,
              remarks
            )
          `,
          )
          .eq("teaching_assignment_id", classRecordId)
          .eq("attendance_date", accessDate)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        const nextAttendance = Object.fromEntries(
          (data?.records || []).map((record) => [record.student_id, record]),
        );

        setAttendanceByStudent(nextAttendance);
      } catch (error) {
        console.error("Failed to load activity attendance:", error);

        if (active) {
          setAttendanceByStudent({});
          setAttendanceError(
            error.message || "Unable to load attendance for this date.",
          );
        }
      } finally {
        if (active) setLoadingAttendance(false);
      }
    }

    loadAttendance();

    return () => {
      active = false;
    };
  }, [classRecordId, accessDate]);

  useEffect(() => {
    if (students.length === 0 || loadingAttendance) {
      if (students.length === 0) {
        setSelectedStudentIds([]);
        setLateAllowedStudentIds([]);
      }
      return;
    }

    const selected = [];
    const lateAllowed = [];

    students.forEach((student) => {
      const studentId = student.student_id;
      const attendanceStatus =
        attendanceByStudent[studentId]?.status ||
        accessByStudent.get(studentId)?.attendance_status ||
        "present";
      const previousAccess = accessByStudent.get(studentId);
      const previouslyAllowedLate = Boolean(
        previousAccess?.late_submission_allowed,
      );

      if (previouslyAllowedLate) {
        lateAllowed.push(studentId);
      }

      if (initialData && existingAccess.length > 0) {
        if (previousAccess?.can_access) selected.push(studentId);
      } else if (attendanceStatus !== "absent") {
        selected.push(studentId);
      }
    });

    setSelectedStudentIds(selected);
    setLateAllowedStudentIds(lateAllowed);
  }, [
    students,
    loadingAttendance,
    attendanceByStudent,
    accessByStudent,
    initialData,
    existingAccess.length,
  ]);

  useEffect(() => {
    onChange?.({
      selectedStudentIds,
      lateAllowedStudentIds,
      attendanceByStudent,
      attendanceDate: accessDate,
    });
  }, [
    selectedStudentIds,
    lateAllowedStudentIds,
    attendanceByStudent,
    accessDate,
  ]);

  const absentCount = students.filter(
    (student) => attendanceByStudent[student.student_id]?.status === "absent",
  ).length;

  const availableStudentIds = students
    .filter(
      (student) => attendanceByStudent[student.student_id]?.status !== "absent",
    )
    .map((student) => student.student_id);

  const allAvailableSelected =
    availableStudentIds.length > 0 &&
    availableStudentIds.every((studentId) =>
      selectedStudentIds.includes(studentId),
    );

  function toggleAllAvailable() {
    setSelectedStudentIds((current) => {
      if (allAvailableSelected) {
        return current.filter(
          (studentId) => !availableStudentIds.includes(studentId),
        );
      }

      return Array.from(new Set([...current, ...availableStudentIds]));
    });
  }

  function toggleAvailableStudent(studentId) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function toggleLateAccess(studentId) {
    const currentlyAllowed = lateAllowedStudentIds.includes(studentId);

    setLateAllowedStudentIds((current) =>
      currentlyAllowed
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );

    setSelectedStudentIds((current) => {
      if (currentlyAllowed) {
        return current.filter((id) => id !== studentId);
      }

      return current.includes(studentId) ? current : [...current, studentId];
    });
  }

  if (studentsLoading || loadingAttendance) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Loading students and attendance...
      </div>
    );
  }

  if (studentsError || attendanceError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {studentsError || attendanceError}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b border-gray-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Student access for {accessDate}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedStudentIds.length} students can access · {absentCount}{" "}
              absent
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAllAvailable}
            disabled={disabled || availableStudentIds.length === 0}
            className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {allAvailableSelected
              ? "Unselect available students"
              : "Select all available students"}
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">
          No students are enrolled in this section.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {students.map((student) => {
            const studentId = student.student_id;
            const attendanceStatus =
              attendanceByStudent[studentId]?.status || "present";
            const absent = attendanceStatus === "absent";
            const lateAllowed = lateAllowedStudentIds.includes(studentId);
            const checked = selectedStudentIds.includes(studentId);

            return (
              <div
                key={studentId}
                className={`flex flex-col gap-3 border-b border-gray-100 p-3 last:border-b-0 sm:flex-row sm:items-center ${
                  absent && !lateAllowed ? "bg-red-50" : "bg-white"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {absent ? (
                    <UserX className="h-5 w-5 shrink-0 text-red-500" />
                  ) : attendanceStatus === "late" ? (
                    <Clock3 className="h-5 w-5 shrink-0 text-orange-500" />
                  ) : (
                    <UserCheck className="h-5 w-5 shrink-0 text-green-500" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {student.full_name || "Unnamed student"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {student.student_number || "No student number"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(
                      attendanceStatus,
                    )}`}
                  >
                    {attendanceStatus}
                  </span>
                </div>

                {absent ? (
                  <button
                    type="button"
                    onClick={() => toggleLateAccess(studentId)}
                    disabled={disabled}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                      lateAllowed
                        ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    {lateAllowed
                      ? "Remove late access"
                      : "Allow late submission"}
                  </button>
                ) : (
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAvailableStudent(studentId)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    {checked ? (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Can access
                      </span>
                    ) : (
                      "No access"
                    )}
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
