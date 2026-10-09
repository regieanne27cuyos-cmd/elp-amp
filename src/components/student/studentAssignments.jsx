import {
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Search,
} from "lucide-react";

const filterClass =
  "rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatActivityType(value) {
  return String(value || "assignment")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDeadline(value) {
  if (!value) return "No deadline";

  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLocalDateKey(value) {
  const date = new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDeadlineStatus(dueAt) {
  if (!dueAt) {
    return {
      key: "no-deadline",
      label: "No deadline",
      className: "bg-gray-100 text-gray-600",
      icon: CalendarDays,
    };
  }

  const dueDate = new Date(dueAt);
  const now = new Date();

  if (dueDate.getTime() < now.getTime()) {
    return {
      key: "overdue",
      label: "Overdue",
      className: "bg-red-50 text-red-700",
      icon: AlertCircle,
    };
  }

  if (
    getLocalDateKey(dueDate) ===
    getLocalDateKey(now)
  ) {
    return {
      key: "today",
      label: "Due today",
      className: "bg-orange-50 text-orange-700",
      icon: Clock,
    };
  }

  return {
    key: "upcoming",
    label: "Upcoming",
    className: "bg-blue-50 text-blue-700",
    icon: CheckCircle2,
  };
}

function ActivityCard({
  activity,
  onOpenActivity,
}) {
  const deadlineStatus = getDeadlineStatus(
    activity.due_at,
  );

  const StatusIcon = deadlineStatus.icon;

  const content = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
              {formatActivityType(
                activity.activity_type,
              )}
            </span>

            {activity.grading_period && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Grading {activity.grading_period}
              </span>
            )}
          </div>

          <h3 className="mt-3 font-semibold text-gray-900">
            {activity.title}
          </h3>
        </div>

        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${deadlineStatus.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {deadlineStatus.label}
        </span>
      </div>

      {activity.instructions && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">
          {activity.instructions}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          {formatDeadline(activity.due_at)}
        </span>

        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          {activity.points || 0} points
        </span>

        {activity.file_name && (
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            {activity.file_name}
          </span>
        )}
      </div>

      {onOpenActivity && (
        <div className="mt-4 rounded-lg bg-blue-50 py-2.5 text-center text-sm font-medium text-blue-600">
          View activity
        </div>
      )}
    </>
  );

  if (!onOpenActivity) {
    return (
      <article className="rounded-xl border border-gray-100 bg-white p-4">
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenActivity(activity)}
      className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {content}
    </button>
  );
}

export default function StudentAssignments({
  activities,
  loading,
  error,
  onRetry,
  onOpenActivity,
}) {
  const [search, setSearch] = useState("");
  const [deadlineFilter, setDeadlineFilter] =
    useState("all");

  const dueActivities = useMemo(
    () =>
      activities.filter(
        (activity) => activity.due_at,
      ),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dueActivities.filter((activity) => {
      const deadlineStatus = getDeadlineStatus(
        activity.due_at,
      );

      const matchesDeadline =
        deadlineFilter === "all" ||
        deadlineStatus.key === deadlineFilter;

      const searchableText = [
        activity.title,
        activity.instructions,
        activity.activity_type,
        activity.grading_period,
        activity.classRecord?.subject?.subject_name,
        activity.classRecord?.subject?.subject_code,
        activity.classRecord?.section?.section_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesDeadline && matchesSearch;
    });
  }, [
    dueActivities,
    search,
    deadlineFilter,
  ]);

  const groupedActivities = useMemo(() => {
    const groups = new Map();

    filteredActivities.forEach((activity) => {
      const subject =
        activity.classRecord?.subject;

      const subjectId =
        subject?.id ||
        activity.teaching_assignment_id;

      if (!groups.has(subjectId)) {
        groups.set(subjectId, {
          id: subjectId,
          subject,
          section:
            activity.classRecord?.section || null,
          activities: [],
        });
      }

      groups.get(subjectId).activities.push(activity);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        activities: group.activities.sort(
          (first, second) =>
            new Date(first.due_at).getTime() -
            new Date(second.due_at).getTime(),
        ),
      }))
      .sort((first, second) =>
        String(
          first.subject?.subject_name || "",
        ).localeCompare(
          String(
            second.subject?.subject_name || "",
          ),
        ),
      );
  }, [filteredActivities]);

  const upcomingCount = dueActivities.filter(
    (activity) =>
      getDeadlineStatus(activity.due_at).key ===
      "upcoming",
  ).length;

  const dueTodayCount = dueActivities.filter(
    (activity) =>
      getDeadlineStatus(activity.due_at).key ===
      "today",
  ).length;

  const overdueCount = dueActivities.filter(
    (activity) =>
      getDeadlineStatus(activity.due_at).key ===
      "overdue",
  ).length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
        Loading assignments...
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
            className="mt-3 font-medium hover:underline"
          >
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
          Assignments
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View assignments, quizzes, and performance
          tasks organized by subject.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Upcoming
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Due Today
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {dueTodayCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Overdue
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {overdueCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label
              htmlFor="student-assignment-search"
              className="sr-only"
            >
              Search assignments
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="student-assignment-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search assignment or subject..."
                className={`${filterClass} w-full pl-9`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="assignment-deadline-filter"
              className="sr-only"
            >
              Filter assignments by deadline
            </label>

            <select
              id="assignment-deadline-filter"
              value={deadlineFilter}
              onChange={(event) =>
                setDeadlineFilter(
                  event.target.value,
                )
              }
              className={`${filterClass} w-full`}
            >
              <option value="all">
                All deadlines
              </option>

              <option value="upcoming">
                Upcoming
              </option>

              <option value="today">
                Due today
              </option>

              <option value="overdue">
                Overdue
              </option>
            </select>
          </div>
        </div>

        <p
          role="status"
          className="mt-3 text-xs text-gray-400"
        >
          Showing {filteredActivities.length} of{" "}
          {dueActivities.length} activities
        </p>
      </section>

      {groupedActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-gray-300" />

          <p className="mt-3 font-medium text-gray-700">
            No assignments found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            There are no published activities matching
            your selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map((group) => (
            <section
              key={group.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      {group.subject?.subject_code ||
                        "Subject"}
                    </p>

                    <h2 className="font-semibold text-gray-900">
                      {group.subject?.subject_name ||
                        "Subject unavailable"}
                    </h2>

                    <p className="text-xs text-gray-400">
                      Grade{" "}
                      {group.section?.grade_level ||
                        "—"}
                      {" · "}
                      {group.section?.section_name ||
                        "Section unavailable"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                  {group.activities.length}{" "}
                  {group.activities.length === 1
                    ? "activity"
                    : "activities"}
                </span>
              </div>

              <div className="space-y-3 p-4">
                {group.activities.map(
                  (activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onOpenActivity={
                        onOpenActivity
                      }
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}