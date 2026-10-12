import { useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import TeacherSidebar from "../components/teacher/teacherSidebar";
import TeacherHeader from "../components/teacher/teacherHeader";
import TeacherDashboardHome from "../components/teacher/teacherDashboardHome";
import TeacherModuleContent from "../components/teacher/teacherModuleContent";
import useTeacherDashboardData from "../hooks/useTeacherDashboardData";

export default function TeacherDashboard() {
  const [activeView, setActiveView] =
    useState("dashboard");

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
    setMobileSidebarOpen(false);
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
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <TeacherSidebar
        activeView={activeView}
        mobileOpen={mobileSidebarOpen}
        onClose={() =>
          setMobileSidebarOpen(false)
        }
        onSelectView={selectView}
        onLogout={logout}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {activeView === "dashboard" ? (
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
            />
          ) : (
            <TeacherModuleContent
              activeView={activeView}
              teacherProfile={teacherProfile}
              announcements={announcements}
              announcementsLoading={
                announcementsLoading
              }
              announcementsError={
                announcementsError
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}