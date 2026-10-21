import {
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileCheck2,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

const activityStyles = {
  assignment: {
    label: "Assignment",
    icon: ClipboardList,
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    card: "border-blue-100 hover:border-blue-300",
  },

  performance_task: {
    label: "Performance Task",
    icon: FileCheck2,
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
    card: "border-orange-100 hover:border-orange-300",
  },

  quiz: {
    label: "Quiz",
    icon: HelpCircle,
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
    card: "border-purple-100 hover:border-purple-300",
  },

  other: {
    label: "Activity",
    icon: CalendarDays,
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-100 hover:border-emerald-300",
  },
};

const weekDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function dateKey(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function startOfDay(value) {
  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(value);

  date.setHours(0, 0, 0, 0);

  return date;
}

function sameDate(first, second) {
  return dateKey(first) === dateKey(second);
}

function formatMonth(value) {
  return value.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function formatFullDate(value) {
  return value.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDueDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid due date";
  }

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDueTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActivityStyle(activity) {
  return (
    activityStyles[activity.activity_type] ||
    activityStyles.other
  );
}

function getActivityTypeLabel(activity) {
  if (
    activity.activity_type === "other" &&
    activity.custom_activity_type
  ) {
    return activity.custom_activity_type;
  }

  return getActivityStyle(activity).label;
}

function getSubjectName(activity) {
  return (
    activity.subject?.subject_name ||
    activity.teaching_assignment?.subject
      ?.subject_name ||
    activity.class_record?.subject
      ?.subject_name ||
    activity.classRecord?.subject
      ?.subject_name ||
    activity.subject_name ||
    "Subject"
  );
}

function getCalendarDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);

  /*
   * Converts Sunday = 0 into Monday-based
   * calendar position.
   */
  const daysBeforeMonth =
    (firstDay.getDay() + 6) % 7;

  const calendarStart = new Date(
    year,
    month,
    1 - daysBeforeMonth,
  );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const date = new Date(calendarStart);

      date.setDate(
        calendarStart.getDate() + index,
      );

      return date;
    },
  );
}

function ActivityItem({
  activity,
  onOpenActivity,
}) {
  const style = getActivityStyle(activity);
  const Icon = style.icon;

  const isPastDue =
    activity.due_at &&
    new Date(activity.due_at).getTime() <
      Date.now();

  return (
    <button
      type="button"
      onClick={() =>
        onOpenActivity?.(activity)
      }
      className={`w-full rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${style.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.badge}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {activity.title ||
                  "Untitled activity"}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-500">
                {getSubjectName(activity)}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${style.badge}`}
            >
              {getActivityTypeLabel(
                activity,
              )}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div
              className={`flex items-center gap-1.5 text-xs ${
                isPastDue
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />

              {formatDueDate(
                activity.due_at,
              )}
            </div>

            {activity.grading_period && (
              <span className="text-xs text-gray-400">
                Grading{" "}
                {activity.grading_period}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StudentCalendar({
  activities = [],
  loading = false,
  error = "",
  onRetry,
  onOpenActivity,
}) {
  const today = useMemo(
    () => startOfDay(new Date()),
    [],
  );

  const [currentMonth, setCurrentMonth] =
    useState(
      () =>
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
    );

  const [selectedDate, setSelectedDate] =
    useState(today);

  const validActivities = useMemo(
    () =>
      activities
        .filter((activity) => {
          if (!activity?.due_at) {
            return false;
          }

          const dueDate = new Date(
            activity.due_at,
          );

          return !Number.isNaN(
            dueDate.getTime(),
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
        ),
    [activities],
  );

  const activitiesByDate = useMemo(() => {
    const grouped = new Map();

    validActivities.forEach((activity) => {
      const key = dateKey(
        activity.due_at,
      );

      const current =
        grouped.get(key) || [];

      grouped.set(key, [
        ...current,
        activity,
      ]);
    });

    return grouped;
  }, [validActivities]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth],
  );

  const selectedActivities =
    activitiesByDate.get(
      dateKey(selectedDate),
    ) || [];

  const upcomingActivities = useMemo(
    () =>
      validActivities
        .filter(
          (activity) =>
            new Date(
              activity.due_at,
            ).getTime() >=
            today.getTime(),
        )
        .slice(0, 5),
    [validActivities, today],
  );

  function previousMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    );
  }

  function goToToday() {
    const currentToday =
      startOfDay(new Date());

    setSelectedDate(currentToday);

    setCurrentMonth(
      new Date(
        currentToday.getFullYear(),
        currentToday.getMonth(),
        1,
      ),
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <div className="text-center">
          <CalendarDays className="mx-auto h-8 w-8 animate-pulse text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
      >
        <p>{error}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 flex items-center gap-2 font-medium hover:underline"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">
          Student Calendar
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View assignment, quiz, performance
          task, and activity deadlines.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-bold text-gray-900">
                {formatMonth(currentMonth)}
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Select a date to view its
                deadlines
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Today
              </button>

              <button
                type="button"
                onClick={previousMonth}
                aria-label="Previous month"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-1 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = dateKey(day);

              const dayActivities =
                activitiesByDate.get(key) || [];

              const belongsToMonth =
                day.getMonth() ===
                currentMonth.getMonth();

              const selected = sameDate(
                day,
                selectedDate,
              );

              const isToday = sameDate(
                day,
                today,
              );

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      startOfDay(day),
                    )
                  }
                  className={`relative min-h-[90px] border-b border-r border-gray-100 p-1.5 text-left align-top transition sm:min-h-[112px] sm:p-2 ${
                    selected
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  } ${
                    belongsToMonth
                      ? "text-gray-700"
                      : "bg-gray-50/50 text-gray-300"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium sm:text-sm ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : selected
                          ? "bg-blue-100 text-blue-700"
                          : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-1 space-y-1">
                    {dayActivities
                      .slice(0, 2)
                      .map((activity) => {
                        const style =
                          getActivityStyle(
                            activity,
                          );

                        return (
                          <div
                            key={activity.id}
                            className="flex min-w-0 items-center gap-1"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                            />

                            <span className="hidden truncate text-[10px] text-gray-600 sm:block">
                              {activity.title}
                            </span>
                          </div>
                        );
                      })}

                    {dayActivities.length >
                      2 && (
                      <p className="text-[10px] font-medium text-blue-600">
                        +
                        {dayActivities.length -
                          2}{" "}
                        more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-5 py-3">
            {Object.entries(
              activityStyles,
            )
              .filter(
                ([key]) => key !== "other",
              )
              .map(([key, style]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
                  />

                  {style.label}
                </div>
              ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-bold text-gray-900">
                {formatFullDate(
                  selectedDate,
                )}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {selectedActivities.length}{" "}
                {selectedActivities.length ===
                1
                  ? "deadline"
                  : "deadlines"}
              </p>
            </div>

            {selectedActivities.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-gray-300" />

                <p className="mt-2 text-sm text-gray-500">
                  No activities due on this
                  date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedActivities.map(
                  (activity) => (
                    <ActivityItem
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
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-bold text-gray-900">
                Upcoming Deadlines
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Your next five activities
              </p>
            </div>

            {upcomingActivities.length ===
            0 ? (
              <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                No upcoming deadlines.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingActivities.map(
                  (activity) => {
                    const style =
                      getActivityStyle(
                        activity,
                      );

                    return (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() =>
                          onOpenActivity?.(
                            activity,
                          )
                        }
                        className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-gray-50"
                      >
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {activity.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {getSubjectName(
                              activity,
                            )}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />

                            {formatDueTime(
                              activity.due_at,
                            )}
                            {" · "}
                            {new Date(
                              activity.due_at,
                            ).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}