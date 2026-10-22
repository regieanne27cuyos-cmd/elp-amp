import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  Megaphone,
  Settings,
  User,
} from "lucide-react";

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

function formatNotificationDate(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const difference =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    difference / 60000,
  );

  const hours = Math.floor(
    difference / 3600000,
  );

  const days = Math.floor(
    difference / 86400000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"
      } ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"
      } ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"
      } ago`;
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentHeader({
  studentProfile,
  notifications = [],
  notificationCount = 0,
  notificationsLoading = false,
  notificationsError = "",
  onOpenNotification,
  onMarkAllNotificationsRead,
  onOpenSidebar,
  onSelectView,
  onLogout,
}) {
  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const notificationRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target,
        )
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleNotificationClick(
    notification,
  ) {
    try {
      await onOpenNotification?.(
        notification,
      );

      setNotificationsOpen(false);
    } catch (error) {
      console.error(
        "Unable to open notification:",
        error,
      );
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await onMarkAllNotificationsRead?.();
    } catch (error) {
      console.error(
        "Unable to mark notifications as read:",
        error,
      );
    }
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
        {/* Notification bell */}
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() =>
              setNotificationsOpen(
                (current) => !current,
              )
            }
            className={`relative rounded-lg p-2 transition-colors ${notificationsOpen
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50"
              }`}
            aria-label="Open notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell className="h-5 w-5" />

            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                {notificationCount > 9
                  ? "9+"
                  : notificationCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Notifications
                  </h2>

                  <p className="text-xs text-gray-400">
                    {notificationCount} unread
                  </p>
                </div>

                {notificationCount > 0 && (
                  <button
                    type="button"
                    onClick={
                      handleMarkAllAsRead
                    }
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading && (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-400">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading notifications...
                  </div>
                )}

                {!notificationsLoading &&
                  notificationsError && (
                    <div className="m-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                      {notificationsError}
                    </div>
                  )}

                {!notificationsLoading &&
                  !notificationsError &&
                  notifications.length ===
                  0 && (
                    <div className="px-5 py-10 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                        <Bell className="h-5 w-5 text-gray-400" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No notifications
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        New activities will
                        appear here.
                      </p>
                    </div>
                  )}

                {!notificationsLoading &&
                  !notificationsError &&
                  notifications.map(
                    (notification) => (
                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          handleNotificationClick(
                            notification,
                          )
                        }
                        className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${notification.is_read
                            ? "bg-white"
                            : "bg-blue-50/60"
                          }`}
                      >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                          <Megaphone className="h-4 w-4 text-blue-600" />

                          {!notification.is_read && (
                            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm text-gray-900 ${notification.is_read
                                  ? "font-medium"
                                  : "font-semibold"
                                }`}
                            >
                              {
                                notification.title
                              }
                            </p>

                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                            {
                              notification.message
                            }
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {formatNotificationDate(
                              notification.created_at,
                            )}
                          </p>
                        </div>
                      </button>
                    ),
                  )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  onSelectView?.(
                    "assignments",
                  );
                }}
                className="w-full border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                View all activities
              </button>
            </div>
          )}
        </div>

        {/* Student account menu */}
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

            <ChevronDown className="hidden h-4 w-4 text-gray-400 transition-transform group-hover:rotate-180 group-focus-within:rotate-180 sm:block" />
          </button>

          <div className="invisible absolute right-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
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