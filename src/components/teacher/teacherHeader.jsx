import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Trash2,
  User,
} from "lucide-react";

const initialNotifications = [
  {
    id: "teacher-notification-1",
    type: "assignment",
    title: "Assignment deadline approaching",
    message:
      "General Mathematics Assignment 1 is due tomorrow.",
    time: "10 minutes ago",
    view: "classes",
    read: false,
  },
  {
    id: "teacher-notification-2",
    type: "submission",
    title: "New student submission",
    message:
      "A student submitted an activity for your class.",
    time: "25 minutes ago",
    view: "classes",
    read: false,
  },
  {
    id: "teacher-notification-3",
    type: "announcement",
    title: "New school announcement",
    message:
      "A new announcement was posted by the school administrator.",
    time: "1 hour ago",
    view: "announcements",
    read: false,
  },
  {
    id: "teacher-notification-4",
    type: "calendar",
    title: "Upcoming school event",
    message:
      "You have an upcoming event scheduled on your calendar.",
    time: "Yesterday",
    view: "calendar",
    read: true,
  },
];

function getInitials(name) {
  if (!name) return "TC";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatEmploymentType(value) {
  if (value === "part_time") {
    return "Part-time Teacher";
  }

  if (value === "full_time") {
    return "Full-time Teacher";
  }

  return "Teacher";
}

function getNotificationStyle(type) {
  if (type === "assignment") {
    return {
      icon: ClipboardList,
      containerClass: "bg-orange-100",
      iconClass: "text-orange-600",
    };
  }

  if (type === "submission") {
    return {
      icon: CheckCheck,
      containerClass: "bg-green-100",
      iconClass: "text-green-600",
    };
  }

  if (type === "calendar") {
    return {
      icon: CalendarDays,
      containerClass: "bg-purple-100",
      iconClass: "text-purple-600",
    };
  }

  return {
    icon: Megaphone,
    containerClass: "bg-blue-100",
    iconClass: "text-blue-600",
  };
}

export default function TeacherHeader({
  teacherProfile,
  onOpenSidebar,
  onSelectView,
  onLogout,
}) {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read,
      ).length,
    [notifications],
  );

  function toggleNotifications() {
    setNotificationsOpen(
      (current) => !current,
    );
  }

  function markNotificationAsRead(
    notificationId,
  ) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
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
  }

  function openNotification(notification) {
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);

    if (notification.view) {
      onSelectView?.(notification.view);
    }
  }

  function openAnnouncements() {
    setNotificationsOpen(false);
    onSelectView?.("announcements");
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

      <div className="relative hidden max-w-xl flex-1 sm:block">
        <label
          htmlFor="teacher-search"
          className="sr-only"
        >
          Search teacher dashboard
        </label>

        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id="teacher-search"
          type="search"
          placeholder="Search classes, students, assignments..."
          className="w-full rounded-lg border border-transparent bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-200 focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        {/* Notification dropdown */}
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
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {unreadCount > 9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() =>
                  setNotificationsOpen(false)
                }
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Notifications
                    </h2>

                    <p className="text-xs text-gray-400">
                      {unreadCount === 0
                        ? "No unread notifications"
                        : `${unreadCount} unread notification${
                            unreadCount === 1
                              ? ""
                              : "s"
                          }`}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <Bell className="mx-auto h-9 w-9 text-gray-300" />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No notifications
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        New notifications will appear
                        here.
                      </p>
                    </div>
                  ) : (
                    notifications.map(
                      (notification) => {
                        const {
                          icon: Icon,
                          containerClass,
                          iconClass,
                        } =
                          getNotificationStyle(
                            notification.type,
                          );

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              openNotification(
                                notification,
                              )
                            }
                            className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                              notification.read
                                ? "bg-white"
                                : "bg-blue-50/40"
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${containerClass}`}
                            >
                              <Icon
                                className={`h-4 w-4 ${iconClass}`}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p className="flex-1 text-sm font-medium text-gray-900">
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-gray-400">
                                {notification.time}
                              </p>
                            </div>
                          </button>
                        );
                      },
                    )
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={openAnnouncements}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View announcements
                    </button>

                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Teacher account dropdown */}
        <div className="group relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50"
            aria-haspopup="menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {getInitials(
                teacherProfile?.full_name,
              )}
            </div>

            <div className="hidden text-left leading-tight sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                {teacherProfile?.full_name ||
                  "Teacher"}
              </p>

              <p className="text-xs text-gray-400">
                {formatEmploymentType(
                  teacherProfile?.employment_type,
                )}
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-gray-400 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180 sm:block" />
          </button>

          <div className="invisible absolute right-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-medium text-gray-800">
                  {teacherProfile?.full_name ||
                    "Teacher"}
                </p>

                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {teacherProfile?.email ||
                    "No email"}
                </p>

                {teacherProfile?.teacher_number && (
                  <p className="mt-1 truncate text-xs font-medium text-blue-600">
                    {
                      teacherProfile.teacher_number
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  onSelectView?.("profile")
                }
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Profile
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