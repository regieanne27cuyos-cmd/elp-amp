import useTeacherClasses from "../../hooks/useTeacherClasses";
import TeacherClasses, {
  TeacherClassStats,
} from "./teacherClasses";
import AnnouncementList from "./announcementList";

export default function TeacherDashboardHome({
  teacherProfile,
  announcements = [],
  announcementsLoading = false,
  announcementsError = "",
  onSelectView,
  onOpenClass,
}) {
  const {
    classes,
    loading,
    error,
    reload,
  } = useTeacherClasses();

  function handleOpenClass(classRecord) {
    if (onOpenClass) {
      onOpenClass(classRecord);
      return;
    }

    onSelectView?.("classes");
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
            View your assigned subjects, sections,
            and school announcements.
          </p>

          {teacherProfile?.teacher_number && (
            <p className="mt-4 text-xs text-blue-100">
              Teacher number:{" "}
              {teacherProfile.teacher_number}
            </p>
          )}
        </div>

        <TeacherClassStats
          classes={classes}
          loading={loading}
          error={error}
        />

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                My Classes
              </h2>

              <p className="text-sm text-gray-500">
                Active teaching assignments from your
                school administrator
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
            classes={classes}
            loading={loading}
            error={error}
            onRetry={reload}
            onOpenClass={handleOpenClass}
          />
        </section>
      </div>

      <aside>
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900">
              Announcements
            </h2>

            <button
              type="button"
              onClick={() =>
                onSelectView?.("announcements")
              }
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View all
            </button>
          </div>

          <AnnouncementList
            announcements={announcements}
            loading={announcementsLoading}
            error={announcementsError}
            limit={3}
          />
        </section>
      </aside>
    </div>
  );
}