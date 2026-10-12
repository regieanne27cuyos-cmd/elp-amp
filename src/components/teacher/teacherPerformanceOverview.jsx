import {
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import useClassPerformance from "../../hooks/useClassPerformance";
import {
  performanceStatuses,
} from "../../utils/gradeCalculations";
import StudentPerformanceDetails from "./studentPerformanceDetails";

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function displayValue(value, suffix = "") {
  return value === null ||
    value === undefined
    ? "—"
    : `${value}${suffix}`;
}

function csvCell(value) {
  const text = String(
    value ?? "",
  ).replaceAll('"', '""');

  return `"${text}"`;
}

function downloadCsv({
  classRecord,
  gradingPeriod,
  students,
}) {
  const headers = [
    "Student Number",
    "Student Name",
    "Activity Percentage",
    "Exam Percentage",
    "Current Grade",
    "Attendance Percentage",
    "Present",
    "Absent",
    "Late",
    "Missing Activities",
    "Late Submissions",
    "Performance Status",
  ];

  const rows = students.map(
    (student) => [
      student.student_number,
      student.full_name,
      student.activity_percentage,
      student.exam_percentage,
      student.current_grade,
      student.attendance_percentage,
      student.presentCount,
      student.absentCount,
      student.lateCount,
      student.missing_count,
      student.late_submission_count,
      performanceStatuses[
        student.performance_status
      ].label,
    ],
  );

  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      row.map(csvCell).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8",
  });

  const url =
    URL.createObjectURL(blob);

  const subject =
    classRecord.subject
      ?.subject_code ||
    classRecord.subject
      ?.subject_name ||
    "class";

  const section =
    classRecord.section
      ?.section_name || "section";

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = `${subject}-${section}-grading-${gradingPeriod}-performance.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green:
      "bg-green-100 text-green-600",
    orange:
      "bg-orange-100 text-orange-600",
    red: "bg-red-100 text-red-600",
    purple:
      "bg-purple-100 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

export default function TeacherPerformanceOverview({
  classRecord,
  students,
  studentsLoading,
  studentsError,
}) {
  const [
    gradingPeriod,
    setGradingPeriod,
  ] = useState(1);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("name");

  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);

  const {
    students: performanceStudents,
    summary,
    loading,
    error,
    reload,
  } = useClassPerformance({
    classRecord,
    students,
    gradingPeriod,
  });

  const visibleStudents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return performanceStudents
      .filter((student) => {
        const matchesSearch =
          !query ||
          [
            student.full_name,
            student.student_number,
            student.email,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          !statusFilter ||
          student.performance_status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      })
      .sort((first, second) => {
        if (sortBy === "grade") {
          return (
            (second.current_grade ??
              -1) -
            (first.current_grade ??
              -1)
          );
        }

        if (
          sortBy === "attendance"
        ) {
          return (
            (second.attendance_percentage ??
              -1) -
            (first.attendance_percentage ??
              -1)
          );
        }

        if (
          sortBy === "missing"
        ) {
          return (
            second.missing_count -
            first.missing_count
          );
        }

        return String(
          first.full_name || "",
        ).localeCompare(
          String(
            second.full_name || "",
          ),
        );
      });
  }, [
    performanceStudents,
    search,
    statusFilter,
    sortBy,
  ]);

  if (
    studentsLoading ||
    loading
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading student performance...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900">
            Student Performance Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor grades, attendance,
            missing activities, and students
            who may need assistance.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              downloadCsv({
                classRecord,
                gradingPeriod,
                students:
                  visibleStudents,
              })
            }
            disabled={
              visibleStudents.length ===
              0
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      {(error || studentsError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error || studentsError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Users}
          label="Total Students"
          value={
            summary.totalStudents
          }
          color="blue"
        />

        <SummaryCard
          icon={TrendingUp}
          label="Class Average"
          value={displayValue(
            summary.classAverage,
            "%",
          )}
          color="purple"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Passing Students"
          value={`${summary.passingStudents}/${summary.gradedStudents}`}
          color="green"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Students At Risk"
          value={
            summary.studentsAtRisk
          }
          color="red"
        />

        <SummaryCard
          icon={UserCheck}
          label="Average Attendance"
          value={displayValue(
            summary.averageAttendance,
            "%",
          )}
          color="orange"
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="performance-period"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Grading period
            </label>

            <select
              id="performance-period"
              value={gradingPeriod}
              onChange={(event) =>
                setGradingPeriod(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className={selectClass}
            >
              <option value={1}>
                First Grading
              </option>
              <option value={2}>
                Second Grading
              </option>
              <option value={3}>
                Third Grading
              </option>
              <option value={4}>
                Fourth Grading
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="performance-search"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Search student
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="performance-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Name or student number"
                className={`${selectClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="performance-status"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Performance status
            </label>

            <select
              id="performance-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              className={selectClass}
            >
              <option value="">
                All statuses
              </option>
              <option value="on_track">
                On Track
              </option>
              <option value="needs_attention">
                Needs Attention
              </option>
              <option value="at_risk">
                At Risk
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="performance-sort"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Sort by
            </label>

            <select
              id="performance-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value,
                )
              }
              className={selectClass}
            >
              <option value="name">
                Student name
              </option>
              <option value="grade">
                Highest grade
              </option>
              <option value="attendance">
                Highest attendance
              </option>
              <option value="missing">
                Most missing work
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[1050px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">
                Student
              </th>
              <th className="px-5 py-3 font-medium">
                Activities
              </th>
              <th className="px-5 py-3 font-medium">
                Exam
              </th>
              <th className="px-5 py-3 font-medium">
                Current Grade
              </th>
              <th className="px-5 py-3 font-medium">
                Attendance
              </th>
              <th className="px-5 py-3 font-medium">
                Missing
              </th>
              <th className="px-5 py-3 font-medium">
                Status
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Details
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map(
              (student) => {
                const status =
                  performanceStatuses[
                    student
                      .performance_status
                  ];

                return (
                  <tr
                    key={
                      student.student_id
                    }
                    className="border-t border-gray-100"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">
                        {student.full_name}
                      </p>

                      <p className="text-xs text-gray-400">
                        {student.student_number}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">
                      {displayValue(
                        student.activity_percentage,
                        "%",
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">
                      {displayValue(
                        student.exam_percentage,
                        "%",
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {student.current_grade ===
                      null ? (
                        <span className="text-xs text-gray-400">
                          Incomplete
                        </span>
                      ) : (
                        <span
                          className={`font-bold ${
                            student.current_grade >=
                            75
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {
                            student.current_grade
                          }
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">
                      {displayValue(
                        student.attendance_percentage,
                        "%",
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={
                          student.missing_count >
                          0
                            ? "font-semibold text-red-600"
                            : "text-gray-500"
                        }
                      >
                        {
                          student.missing_count
                        }
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStudent(
                            student,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <BarChart3 className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              },
            )}

            {visibleStudents.length ===
              0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-gray-400"
                >
                  No students match the
                  selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedStudent && (
        <StudentPerformanceDetails
          student={selectedStudent}
          onClose={() =>
            setSelectedStudent(null)
          }
        />
      )}
    </div>
  );
}