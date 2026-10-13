import { useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import TeacherSidebar from "../components/teacher/teacherSidebar";
import TeacherHeader from "../components/teacher/teacherHeader";
import TeacherDashboardHome from "../components/teacher/teacherDashboardHome";
import TeacherModuleContent from "../components/teacher/teacherModuleContent";
import TeacherClassWorkspace from "../components/teacher/teacherClassWorkspace";
import TeacherActivityWorkspace from "../components/teacher/teacherActivityWorkspace";
import useTeacherDashboardData from "../hooks/useTeacherDashboardData";

export default function TeacherDashboard() {
  const [activeView, setActiveView] =
    useState("dashboard");

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [
    selectedActivityWorkspace,
    setSelectedActivityWorkspace,
  ] = useState(null);

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const {
    teacherProfile,
    profileLoading,
    pageError,
    announcements,
    announcementsLoading,
    announcementsError,
    logout,
  } = useTeacherDashboardData();

  function selectView(view) {
    setActiveView(view);
    setSelectedClass(null);
    setSelectedActivityWorkspace(null);
    setMobileSidebarOpen(false);
  }

  function openClass(classRecord) {
    setSelectedClass(classRecord);
    setSelectedActivityWorkspace(null);
    setActiveView("classes");
    setMobileSidebarOpen(false);
  }

  function closeClassWorkspace() {
    setSelectedClass(null);
    setSelectedActivityWorkspace(null);
    setActiveView("classes");
  }

  function openActivity(
    activity,
    classRecord,
  ) {
    setSelectedActivityWorkspace({
      activity,
      classRecord,
    });

    setSelectedClass(null);

    /*
     * Keep the Dashboard sidebar item active.
     * The activity workspace is a detail page,
     * not a separate sidebar module.
     */
    setActiveView("dashboard");
    setMobileSidebarOpen(false);
  }

  function closeActivityWorkspace() {
    setSelectedActivityWorkspace(null);
    setSelectedClass(null);
    setActiveView("dashboard");
  }

  function renderContent() {
    /*
     * Activity workspace appears inside the
     * dashboard layout. The sidebar and header
     * remain visible.
     */
    if (selectedActivityWorkspace) {
      return (
        <TeacherActivityWorkspace
          activity={
            selectedActivityWorkspace.activity
          }
          classRecord={
            selectedActivityWorkspace.classRecord
          }
          onBack={
            closeActivityWorkspace
          }
        />
      );
    }

    if (selectedClass) {
      return (
        <TeacherClassWorkspace
          classRecord={selectedClass}
          onBack={closeClassWorkspace}
        />
      );
    }

    if (activeView === "dashboard") {
      return (
        <TeacherDashboardHome
          teacherProfile={teacherProfile}
          announcements={announcements}
          announcementsLoading={
            announcementsLoading
          }
          announcementsError={
            announcementsError
          }
          onSelectView={selectView}
          onOpenClass={openClass}
          onOpenActivity={openActivity}
        />
      );
    }

    return (
      <TeacherModuleContent
        activeView={activeView}
        announcements={announcements}
        announcementsLoading={
          announcementsLoading
        }
        announcementsError={
          announcementsError
        }
        onOpenClass={openClass}
      />
    );
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />

          Loading teacher dashboard...
        </div>
      </div>
    );
  }

  if (pageError || !teacherProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <AlertCircle className="h-10 w-10 text-red-500" />

        <p className="max-w-md text-center text-sm text-red-600">
          {pageError ||
            "Unable to load the teacher account."}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>

        <button
          type="button"
          onClick={logout}
          className="text-sm text-gray-500 hover:underline"
        >
          Return to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <TeacherSidebar
        activeView={activeView}
        mobileOpen={mobileSidebarOpen}
        onClose={() =>
          setMobileSidebarOpen(false)
        }
        onSelectView={selectView}
        onLogout={logout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TeacherHeader
          teacherProfile={teacherProfile}
          announcementCount={
            announcements.length
          }
          onOpenSidebar={() =>
            setMobileSidebarOpen(true)
          }
          onSelectView={selectView}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}