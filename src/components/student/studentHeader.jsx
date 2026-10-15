import { useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Megaphone,
  Settings,
  User,
} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    title: "New school announcement",
    message:
      "A new school announcement is available.",
    time: "Just now",
    read: false,
    view: "announcements",
  },
  {
    id: 2,
    title: "Check your assignments",
    message:
      "You may have upcoming activities and deadlines.",
    time: "Today",
    read: false,
    view: "assignments",
  },
  {
    id: 3,
    title: "Welcome to ELP-AMP",
    message:
      "View your classes, activities, and school updates.",
    time: "Today",
    read: false,
    view: "dashboard",
  },
];

function getInitials(name) {
  if (!name) return "ST";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStudentDescription(studentProfile) {
  const gradeLevel =
    studentProfile?.section?.grade_level;

  const sectionName =
    studentProfile?.section?.section_name;

  if (gradeLevel && sectionName) {
    return `Grade ${gradeLevel} · ${sectionName}`;
  }

  return "Student";
}

export default function StudentHeader({
  studentProfile,
  onOpenSidebar,
  onSelectView,
  onLogout,
}) {
  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [notifications, setNotifications] =
    useState(initialNotifications);

  const unreadCount =
    notifications.filter(
      (notification) => !notification.read,
    ).length;

  function toggleNotifications() {
    setNotificationsOpen(
      (current) => !current,
    );
  }

  function openNotification(notification) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              read: true,
            }
          : item,
      ),
    );

    setNotificationsOpen(false);

    if (notification.view) {
      onSelectView(notification.view);
    }
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  function clearNotifications() {
    setNotifications([]);
    setNotificationsOpen(false);
  }

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        {/* Notification button and dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className={`relative rounded-lg p-2 transition-colors ${
              notificationsOpen
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="View notifications"
            aria-expanded={
              notificationsOpen
            }
            aria-haspopup="menu"
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {Math.min(unreadCount, 9)}
                {unreadCount > 9 ? "+" : ""}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(false)
                }
                aria-label="Close notifications"
                className="fixed inset-0 z-40 cursor-default"
              />

              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Notifications
                    </h2>

                    <p className="text-xs text-gray-400">
                      {unreadCount > 0
                        ? `${unreadCount} unread notification${
                            unreadCount === 1
                              ? ""
                              : "s"
                          }`
                        : "You are all caught up"}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                      <Bell className="h-5 w-5 text-gray-400" />
                    </div>

                    <p className="mt-3 text-sm font-medium text-gray-700">
                      No notifications
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      New notifications will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(
                      (notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          role="menuitem"
                          onClick={() =>
                            openNotification(
                              notification,
                            )
                          }
                          className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 ${
                            notification.read
                              ? "bg-white hover:bg-gray-50"
                              : "bg-blue-50/60 hover:bg-blue-50"
                          }`}
                        >
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            <Megaphone className="h-4 w-4 text-blue-600" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <p className="flex-1 text-sm font-medium text-gray-900">
                                {
                                  notification.title
                                }
                              </p>

                              {!notification.read && (
                                <span
                                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                                  aria-label="Unread"
                                />
                              )}
                            </div>

                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                              {
                                notification.message
                              }
                            </p>

                            <p className="mt-1 text-[11px] text-gray-400">
                              {notification.time}
                            </p>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(
                          false,
                        );

                        onSelectView(
                          "announcements",
                        );
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View announcements
                    </button>

                    <button
                      type="button"
                      onClick={
                        clearNotifications
                      }
                      className="text-xs font-medium text-gray-400 hover:text-red-600"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Student account dropdown */}
        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50"
            aria-haspopup="menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {getInitials(
                studentProfile?.full_name,
              )}
            </div>

            <div className="hidden text-left leading-tight sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                {studentProfile?.full_name ||
                  "Student"}
              </p>

              <p className="max-w-40 truncate text-xs text-gray-400">
                {getStudentDescription(
                  studentProfile,
                )}
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-gray-400 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180 sm:block" />
          </button>

          <div
            role="menu"
            className="invisible absolute right-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            <div className="rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-800">
                  {studentProfile?.full_name ||
                    "Student"}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {studentProfile?.email ||
                    "No email"}
                </p>

                {studentProfile?.student_number && (
                  <p className="mt-1 truncate text-xs font-medium text-blue-600">
                    {
                      studentProfile.student_number
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  onSelectView("profile")
                }
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  onSelectView("settings")
                }
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                role="menuitem"
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}