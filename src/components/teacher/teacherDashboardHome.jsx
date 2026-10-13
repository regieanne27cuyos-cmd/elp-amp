import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import useTeacherClasses from "../../hooks/useTeacherClasses";
import TeacherClasses, {
  TeacherClassStats,
} from "./teacherClasses";
import AnnouncementList from "./announcementList";

const CLASSES_PER_PAGE = 3;
const ACTIVITIES_LIMIT = 5;

function formatDueDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid due date";
  }

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeActivityType(activity) {
  return String(
    activity.activity_type || "",
  )
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, " ");
}

function getActivityAppearance(activity) {
  const type =
    normalizeActivityType(activity);

  if (type === "quiz") {
    return {
      label: "Quiz",
      icon: CheckSquare,
      iconClass:
        "bg-purple-100 text-purple-600",
      badgeClass:
        "bg-purple-50 text-purple-700",
    };
  }

  if (type === "performance task") {
    return {
      label: "Performance Task",
      icon: Trophy,
      iconClass:
        "bg-orange-100 text-orange-600",
      badgeClass:
        "bg-orange-50 text-orange-700",
    };
  }

  return {
    label: "Assignment",
    icon: ClipboardList,
    iconClass:
      "bg-blue-100 text-blue-600",
    badgeClass:
      "bg-blue-50 text-blue-700",
  };
}

function MiniCalendar() {
  const today = new Date();

  const [visibleMonth, setVisibleMonth] =
    useState(
      () =>
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
    );

  const calendarDays = useMemo(() => {
    const year =
      visibleMonth.getFullYear();

    const month =
      visibleMonth.getMonth();

    const firstDayIndex = new Date(
      year,
      month,
      1,
    ).getDay();

    const daysInMonth = new Date(
      year,
      month + 1,
      0,
    ).getDate();

    const days = [];

    for (
      let index = 0;
      index < firstDayIndex;
      index += 1
    ) {
      days.push({
        key: `empty-${index}`,
        day: null,
      });
    }

    for (
      let day = 1;
      day <= daysInMonth;
      day += 1
    ) {
      days.push({
        key: `${year}-${month}-${day}`,
        day,
      });
    }

    return days;
  }, [visibleMonth]);

  const monthLabel =
    visibleMonth.toLocaleDateString(
      "en-PH",
      {
        month: "long",
        year: "numeric",
      },
    );

  const showingCurrentMonth =
    visibleMonth.getFullYear() ===
      today.getFullYear() &&
    visibleMonth.getMonth() ===
      today.getMonth();

  function changeMonth(amount) {
    setVisibleMonth((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1,
      );
    });
  }

  function returnToCurrentMonth() {
    setVisibleMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">
            Calendar
          </h2>

          <p className="mt-0.5 text-xs text-gray-400">
            {monthLabel}
          </p>
        </div>

        <CalendarDays className="h-5 w-5 text-blue-600" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <p className="text-sm font-semibold text-gray-700">
          {monthLabel}
        </p>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (
          <div
            key={day}
            className="py-1 text-[10px] font-semibold uppercase text-gray-400"
          >
            {day.charAt(0)}
          </div>
        ))}

        {calendarDays.map((calendarDay) => {
          if (!calendarDay.day) {
            return (
              <div
                key={calendarDay.key}
                className="h-9"
              />
            );
          }

          const isToday =
            showingCurrentMonth &&
            calendarDay.day ===
              today.getDate();

          return (
            <div
              key={calendarDay.key}
              className={`flex h-9 items-center justify-center rounded-lg text-xs ${
                isToday
                  ? "bg-blue-600 font-bold text-white"
                  : "text-gray-600 hover:bg-blue-50"
              }`}
            >
              {calendarDay.day}
            </div>
          );
        })}
      </div>

      {!showingCurrentMonth && (
        <button
          type="button"
          onClick={returnToCurrentMonth}
          className="mt-4 w-full rounded-lg bg-blue-50 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100"
        >
          Return to current month
        </button>
      )}
    </section>
  );
}

function UpcomingActivities({
  classes,
  classesLoading,
  onOpenActivity,
}) {
  const [activities, setActivities] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const teachingAssignmentIds =
    useMemo(() => {
      return classes
        .map(
          (classRecord) =>
            classRecord.id,
        )
        .filter(Boolean);
    }, [classes]);

  const assignmentIdsKey =
    teachingAssignmentIds.join(",");

  async function loadUpcomingActivities() {
    if (
      teachingAssignmentIds.length === 0
    ) {
      setActivities([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentTime =
        new Date().toISOString();

      const {
        data,
        error: activitiesError,
      } = await supabase
        .from("class_activities")
        .select(`
          id,
          teaching_assignment_id,
          activity_type,
          grading_period,
          title,
          instructions,
          points,
          due_at,
          status,
          created_at,
          updated_at
        `)
        .in(
          "teaching_assignment_id",
          teachingAssignmentIds,
        )
        .in("activity_type", [
          "assignment",
          "performance_task",
          "quiz",
        ])
        .gte("due_at", currentTime)
        .order("due_at", {
          ascending: true,
        });

      if (activitiesError) {
        throw activitiesError;
      }

      setActivities(
        (data || []).slice(
          0,
          ACTIVITIES_LIMIT,
        ),
      );
    } catch (loadError) {
      console.error(
        "Failed to load upcoming activities:",
        loadError,
      );

      setError(
        loadError.message ||
          "Unable to load upcoming activities.",
      );

      setActivities([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUpcomingActivities();
  }, [assignmentIdsKey]);

  function findClass(activity) {
    return (
      classes.find(
        (classRecord) =>
          classRecord.id ===
          activity.teaching_assignment_id,
      ) || null
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">
            Upcoming Activities
          </h2>

          <p className="mt-0.5 text-xs text-gray-400">
            Assignments, performance tasks,
            and quizzes
          </p>
        </div>

        <button
          type="button"
          onClick={loadUpcomingActivities}
          disabled={
            loading || classesLoading
          }
          aria-label="Refresh upcoming activities"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {(loading || classesLoading) && (
        <div className="py-8 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-600" />

          <p className="mt-2 text-xs text-gray-400">
            Loading activities...
          </p>
        </div>
      )}

      {!loading &&
        !classesLoading &&
        error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600">
            <p>{error}</p>

            <button
              type="button"
              onClick={
                loadUpcomingActivities
              }
              className="mt-2 font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        )}

      {!loading &&
        !classesLoading &&
        !error &&
        activities.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
            <ClipboardList className="mx-auto h-7 w-7 text-gray-300" />

            <p className="mt-2 text-sm font-medium text-gray-600">
              No upcoming activities
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Activities with future deadlines
              will appear here.
            </p>
          </div>
        )}

      {!loading &&
        !classesLoading &&
        !error &&
        activities.length > 0 && (
          <div className="space-y-3">
            {activities.map((activity) => {
              const classRecord =
                findClass(activity);

              const subjectName =
                classRecord?.subject
                  ?.subject_name ||
                "Subject unavailable";

              const appearance =
                getActivityAppearance(
                  activity,
                );

              const ActivityIcon =
                appearance.icon;

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => {
                    if (
                      classRecord &&
                      onOpenActivity
                    ) {
                      onOpenActivity(
                        activity,
                        classRecord,
                      );
                    }
                  }}
                  disabled={
                    !classRecord ||
                    !onOpenActivity
                  }
                  className="flex w-full items-start gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 disabled:cursor-default disabled:opacity-60"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${appearance.iconClass}`}
                  >
                    <ActivityIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold text-gray-900">
                        {activity.title ||
                          "Untitled activity"}
                      </p>

                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${appearance.badgeClass}`}
                      >
                        {appearance.label}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-blue-600">
                      {subjectName}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5 shrink-0" />

                      <span>
                        Due{" "}
                        {formatDueDate(
                          activity.due_at,
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </section>
  );
}

export default function TeacherDashboardHome({
  teacherProfile,
  announcements = [],
  announcementsLoading = false,
  announcementsError = "",
  onSelectView,
  onOpenClass,
  onOpenActivity,
}) {
  const {
    classes,
    loading,
    error,
    reload,
  } = useTeacherClasses();

  const [currentPage, setCurrentPage] =
    useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(
      classes.length / CLASSES_PER_PAGE,
    ),
  );

  useEffect(() => {
    setCurrentPage((current) =>
      Math.min(current, totalPages),
    );
  }, [totalPages]);

  const visibleClasses = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      CLASSES_PER_PAGE;

    return classes.slice(
      startIndex,
      startIndex + CLASSES_PER_PAGE,
    );
  }, [classes, currentPage]);

  function handleOpenClass(classRecord) {
    if (onOpenClass) {
      onOpenClass(classRecord);
      return;
    }

    onSelectView?.("classes");
  }

  function goToPreviousPage() {
    setCurrentPage((current) =>
      Math.max(1, current - 1),
    );
  }

  function goToNextPage() {
    setCurrentPage((current) =>
      Math.min(
        totalPages,
        current + 1,
      ),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-2xl bg-blue-600 p-6 text-white">
          <p className="text-sm text-blue-100">
            Teacher Dashboard
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Welcome back,{" "}
            {teacherProfile?.full_name ||
              "Teacher"}
            !
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            View your assigned subjects,
            sections, and school announcements.
          </p>

          {teacherProfile?.teacher_number && (
            <p className="mt-4 text-xs text-blue-100">
              Teacher number:{" "}
              {
                teacherProfile.teacher_number
              }
            </p>
          )}
        </div>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                My Classes
              </h2>

              <p className="text-sm text-gray-500">
                Active teaching assignments
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onSelectView?.("classes")
              }
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all classes
            </button>
          </div>

          <TeacherClasses
            classes={visibleClasses}
            loading={loading}
            error={error}
            onRetry={reload}
            onOpenClass={handleOpenClass}
          />

          {!loading &&
            !error &&
            classes.length >
              CLASSES_PER_PAGE && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {(currentPage - 1) *
                      CLASSES_PER_PAGE +
                      1}
                  </span>
                  {"–"}
                  <span className="font-medium text-gray-700">
                    {Math.min(
                      currentPage *
                        CLASSES_PER_PAGE,
                      classes.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {classes.length}
                  </span>{" "}
                  classes
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      goToPreviousPage
                    }
                    disabled={
                      currentPage === 1
                    }
                    aria-label="Show previous classes"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="min-w-20 text-center text-sm font-medium text-gray-600">
                    {currentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    aria-label="Show next classes"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900">
              Announcements
            </h2>

            <button
              type="button"
              onClick={() =>
                onSelectView?.(
                  "announcements",
                )
              }
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all
            </button>
          </div>

          <AnnouncementList
            announcements={announcements}
            loading={
              announcementsLoading
            }
            error={announcementsError}
            limit={3}
          />
        </section>

        <MiniCalendar />

        <UpcomingActivities
          classes={classes}
          classesLoading={loading}
          onOpenActivity={onOpenActivity}
        />
      </aside>
    </div>
  );
}