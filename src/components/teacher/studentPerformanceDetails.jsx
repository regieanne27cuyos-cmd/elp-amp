import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  X,
  XCircle,
} from "lucide-react";
import {
  performanceStatuses,
} from "../../utils/gradeCalculations";

function displayPercentage(value) {
  return value === null ||
    value === undefined
    ? "Not available"
    : `${value}%`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StudentPerformanceDetails({
  student,
  onClose,
}) {
  if (!student) return null;

  const status =
    performanceStatuses[
      student.performance_status
    ];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close student details"
      />

      <aside className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {student.full_name ||
                "Student"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {student.student_number ||
                "No student number"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Close performance details"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 p-6">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${status.className}`}
          >
            Performance status:{" "}
            {status.label}
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Current grade"
              value={
                student.current_grade ===
                null
                  ? "Incomplete"
                  : student.current_grade
              }
            />

            <Metric
              label="Activities"
              value={displayPercentage(
                student.activity_percentage,
              )}
            />

            <Metric
              label="Exam"
              value={displayPercentage(
                student.exam_percentage,
              )}
            />

            <Metric
              label="Attendance"
              value={displayPercentage(
                student.attendance_percentage,
              )}
            />
          </section>

          <section>
            <h3 className="font-bold text-gray-900">
              Activities
            </h3>

            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">
                      Activity
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Type
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Score
                    </th>
                    <th className="px-4 py-3 font-medium">
                      Submission
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {student.activityDetails.map(
                    (activity) => (
                      <tr
                        key={activity.id}
                        className="border-t border-gray-100"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {activity.title}
                        </td>

                        <td className="px-4 py-3 capitalize text-gray-500">
                          {String(
                            activity.activity_type,
                          ).replaceAll(
                            "_",
                            " ",
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {activity.hasScore
                            ? `${activity.score} / ${activity.points}`
                            : "Not scored"}
                        </td>

                        <td className="px-4 py-3">
                          {activity.missing ? (
                            <Status
                              icon={
                                AlertTriangle
                              }
                              text="Missing"
                              className="bg-red-100 text-red-700"
                            />
                          ) : activity.isLate ? (
                            <Status
                              icon={Clock3}
                              text="Late"
                              className="bg-orange-100 text-orange-700"
                            />
                          ) : activity.submitted ? (
                            <Status
                              icon={
                                CheckCircle2
                              }
                              text="Submitted"
                              className="bg-green-100 text-green-700"
                            />
                          ) : (
                            <Status
                              icon={
                                FileQuestion
                              }
                              text="Pending"
                              className="bg-gray-100 text-gray-600"
                            />
                          )}
                        </td>
                      </tr>
                    ),
                  )}

                  {student.activityDetails
                    .length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No activities in this
                        grading period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900">
              Quarterly Examination
            </h3>

            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="font-medium text-gray-800">
                {student.exam_title}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {student.exam_score === null
                  ? "No examination score recorded."
                  : `${student.exam_score} / ${student.exam_possible} · ${student.exam_percentage}%`}
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-gray-900">
              Attendance Summary
            </h3>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <AttendanceCard
                label="Present"
                value={
                  student.presentCount
                }
                color="green"
              />

              <AttendanceCard
                label="Absent"
                value={
                  student.absentCount
                }
                color="red"
              />

              <AttendanceCard
                label="Late"
                value={
                  student.lateCount
                }
                color="orange"
              />
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {student.attendance_records.map(
                (record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gray-400" />

                      <span className="text-sm text-gray-600">
                        {formatDate(
                          record.attendance_date,
                        )}
                      </span>
                    </div>

                    <span className="text-sm font-medium capitalize text-gray-700">
                      {record.status}
                    </span>
                  </div>
                ),
              )}

              {student.attendance_records
                .length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">
                  No attendance records.
                </p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Status({
  icon: Icon,
  text,
  className,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function AttendanceCard({
  label,
  value,
  color,
}) {
  const styles = {
    green:
      "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    orange:
      "bg-orange-50 text-orange-700",
  };

  const Icon =
    color === "green"
      ? CheckCircle2
      : color === "red"
        ? XCircle
        : Clock3;

  return (
    <div
      className={`rounded-xl p-4 ${styles[color]}`}
    >
      <Icon className="h-4 w-4" />

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

      <p className="text-xs">{label}</p>
    </div>
  );
}