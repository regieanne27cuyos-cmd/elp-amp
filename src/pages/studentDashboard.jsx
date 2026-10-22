import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useStudentDashboard from "../hooks/useStudentDashboard";
import useStudentNotifications from "../hooks/useStudentNotifications";
import StudentDashboardHome from "../components/student/studentDashboardHome";
import StudentAssignments from "../components/student/studentAssignments";
import StudentActivityWork from "../components/student/studentActivityWork";
import StudentHeader from "../components/student/studentHeader";
import StudentProfile from "../components/student/studentProfile";
import StudentClassesModule from "../components/student/studentClassesModule";
import StudentClassWorkspace from "../components/student/studentClassWorkspace";
import StudentAnnouncements from "../components/student/studentAnnouncements";
import StudentCalendar from "../components/student/studentCalendar";
import logo from "../assets/ejist-primary-logo.png";

const navigationItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
  },
  {
    key: "classes",
    label: "My Classes",
    icon: BookOpen,
  },
  {
    key: "assignments",
    label: "Assignments",
    icon: ClipboardList,
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    key: "announcements",
    label: "Announcements",
    icon: Megaphone,
  },
  {
    key: "profile",
    label: "Profile",
    icon: User,
  },
];

function StudentSidebar({
  activeView,
  mobileOpen,
  onClose,
  onSelectView,
  onLogout,
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  function handleSelectView(view) {
    onSelectView?.(view);
    onClose?.();
  }

  function handleLogout() {
    onClose?.();
    onLogout?.();
  }

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  function navigationButtonClass(active) {
    return `group flex w-full items-center rounded-xl py-2.5 text-left text-sm font-medium transition-all duration-200 ${
      collapsed
        ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-2"
        : "gap-3 px-3"
    } ${
      active
        ? "bg-white text-blue-700 shadow-sm"
        : "text-blue-100 hover:bg-white/10 hover:text-white"
    }`;
  }

  function iconClass(active) {
    return `h-[18px] w-[18px] shrink-0 transition-colors ${
      active
        ? "text-blue-600"
        : "text-blue-200 group-hover:text-white"
    }`;
  }

  return (
    <>
      {/* Mobile background overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px] transition-opacity duration-300 ease-in-out lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="h-full w-full"
        />
      </div>

      {/* Student sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-dvh w-60 shrink-0 overflow-visible bg-gradient-to-b from-blue-700 via-blue-700 to-blue-900 text-white shadow-xl transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none ${
          collapsed
            ? "lg:w-20"
            : "lg:w-60"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Desktop middle collapse button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className="absolute right-0 top-1/2 z-50 hidden h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-gray-50 bg-white text-blue-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-blue-50 hover:text-blue-800 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        <div className="flex h-full min-h-full flex-col overflow-y-auto">
          {/* Logo and title */}
          <div
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-white/10 bg-blue-700/95 backdrop-blur transition-all duration-300 ${
              collapsed
                ? "gap-2 px-4 lg:justify-center lg:px-2"
                : "gap-3 px-4"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                handleSelectView("dashboard")
              }
              title="Go to dashboard"
              aria-label="Go to student dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <img
                src={logo}
                alt="EJIST school logo"
                draggable="false"
                className="h-full w-full select-none object-contain"
              />
            </button>

            <span
              className={`truncate text-lg font-bold tracking-tight ${
                collapsed
                  ? "lg:hidden"
                  : ""
              }`}
            >
              ELP-AMP Student
            </span>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="ml-auto rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p
              className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200 ${
                collapsed
                  ? "lg:hidden"
                  : ""
              }`}
            >
              Main Menu
            </p>

            {navigationItems.map(
              ({
                key,
                label,
                icon: Icon,
              }) => {
                const active =
                  activeView === key;

                return (
                  <button
                    key={key}
                    type="button"
                    title={
                      collapsed
                        ? label
                        : undefined
                    }
                    onClick={() =>
                      handleSelectView(key)
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    aria-label={label}
                    className={navigationButtonClass(
                      active,
                    )}
                  >
                    <Icon
                      className={iconClass(
                        active,
                      )}
                    />

                    <span
                      className={`truncate ${
                        collapsed
                          ? "lg:hidden"
                          : ""
                      }`}
                    >
                      {label}
                    </span>

                    {active && !collapsed && (
                      <span
                        aria-hidden="true"
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"
                      />
                    )}
                  </button>
                );
              },
            )}
          </nav>

          {/* Account section */}
          <div className="shrink-0 border-t border-white/10 bg-blue-900/30 px-3 py-3">
            <p
              className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200 ${
                collapsed
                  ? "lg:hidden"
                  : ""
              }`}
            >
              Account
            </p>

            <button
              type="button"
              onClick={handleLogout}
              title={
                collapsed
                  ? "Log out"
                  : undefined
              }
              aria-label="Log out"
              className={`group flex w-full items-center rounded-xl py-2.5 text-left text-sm font-medium text-red-100 transition-all duration-200 hover:bg-red-500/20 hover:text-white ${
                collapsed
                  ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-2"
                  : "gap-3 px-3"
              }`}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0 text-red-200 transition-colors group-hover:text-white" />

              <span
                className={`truncate ${
                  collapsed
                    ? "lg:hidden"
                    : ""
                }`}
              >
                Log out
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function PlaceholderView({
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Icon className="h-7 w-7 text-blue-600" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  const {
    student,
    classes = [],
    activities = [],
    loading,
    error,
    reload,
  } = useStudentDashboard();

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
  } = useStudentNotifications(student?.id);

  const [activeView, setActiveView] =
    useState("dashboard");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState(null);

  async function handleLogout() {
    try {
      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      navigate("/", {
        replace: true,
      });
    } catch (logoutError) {
      console.error(
        "Student logout failed:",
        logoutError,
      );

      window.alert(
        logoutError.message ||
          "Unable to log out. Please try again.",
      );
    }
  }

  function selectView(view) {
    setActiveView(view);
    setSelectedClass(null);
    setSelectedActivity(null);
    setMobileOpen(false);
  }

  function openClass(classRecord) {
    if (!classRecord) return;

    setSelectedClass(classRecord);
    setSelectedActivity(null);
    setActiveView("classes");
    setMobileOpen(false);
  }

  function closeClass() {
    setSelectedClass(null);
    setSelectedActivity(null);
    setActiveView("classes");
  }

  function openActivity(activity) {
    if (!activity) return;

    setSelectedActivity(activity);
    setSelectedClass(null);
    setMobileOpen(false);
  }

  function closeActivity() {
    setSelectedActivity(null);
  }

  function handleRetry() {
    if (reload) {
      reload();
      return;
    }

    window.location.reload();
  }

  function renderContent() {
    if (selectedActivity) {
      return (
        <StudentActivityWork
          activity={selectedActivity}
          onBack={closeActivity}
        />
      );
    }

    if (selectedClass) {
      return (
        <StudentClassWorkspace
          classRecord={selectedClass}
          onBack={closeClass}
          onOpenActivity={openActivity}
        />
      );
    }

    if (activeView === "dashboard") {
      return (
        <StudentDashboardHome
          student={student}
          classes={classes}
          activities={activities}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onSelectView={selectView}
          onOpenClass={openClass}
          onOpenActivity={openActivity}
        />
      );
    }

    if (activeView === "classes") {
      return (
        <StudentClassesModule
          classes={classes}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onOpenClass={openClass}
        />
      );
    }

    if (activeView === "assignments") {
      return (
        <StudentAssignments
          activities={activities}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onOpenActivity={openActivity}
        />
      );
    }

    if (activeView === "calendar") {
      return (
        <StudentCalendar
          activities={activities}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onOpenActivity={openActivity}
        />
      );
    }

    if (activeView === "announcements") {
      return <StudentAnnouncements />;
    }

    if (activeView === "profile") {
      return (
        <StudentProfile
          student={student}
          classes={classes}
          loading={loading}
          error={error}
        />
      );
    }

    return (
      <PlaceholderView
        title="Student Module"
        description="This module is not available yet."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <StudentSidebar
        activeView={activeView}
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
        onSelectView={selectView}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <StudentHeader
          studentProfile={student}
          notifications={notifications}
          notificationCount={unreadCount}
          notificationsLoading={
            notificationsLoading
          }
          notificationsError={
            notificationsError
          }
          onOpenNotification={async (
            notification,
          ) => {
            try {
              await markAsRead(
                notification.id,
              );

              if (
                ["activity", "grade"].includes(
                  notification.notification_type,
                ) &&
                notification.activity_id
              ) {
                const activity =
                  activities.find(
                    (item) =>
                      item.id ===
                      notification.activity_id,
                  );

                if (activity) {
                  openActivity(activity);
                } else {
                  selectView(
                    "assignments",
                  );
                }
              }
            } catch (
              notificationError
            ) {
              console.error(
                "Unable to open notification:",
                notificationError,
              );
            }
          }}
          onMarkAllNotificationsRead={
            markAllAsRead
          }
          onOpenSidebar={() =>
            setMobileOpen(true)
          }
          onSelectView={selectView}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}