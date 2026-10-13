import {
  GraduationCap,
  LogOut,
  X,
} from "lucide-react";
import {
  teacherBottomSidebarItems,
  teacherSidebarItems,
} from "./teacherConfig";

export default function TeacherSidebar({
  activeView,
  mobileOpen,
  onClose,
  onSelectView,
  onLogout,
}) {
  function handleSelectView(view) {
    onSelectView?.(view);
    onClose?.();
  }

  function handleLogout() {
    onClose?.();
    onLogout?.();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 h-dvh w-60 shrink-0 overflow-y-auto border-r border-gray-100 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-5">
            <GraduationCap className="h-6 w-6 shrink-0 text-blue-600" />

            <span className="truncate text-lg font-bold">
              ELP-AMP Teacher
            </span>

            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg p-1 text-gray-400 hover:bg-gray-50 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {teacherSidebarItems.map(
              ({
                key,
                icon: Icon,
                label,
              }) => {
                const active =
                  activeView === key;

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() =>
                      handleSelectView(key)
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />

                    <span className="truncate">
                      {label}
                    </span>
                  </button>
                );
              },
            )}
          </nav>

          <div className="space-y-1 border-t border-gray-100 bg-white px-3 py-3">
            {teacherBottomSidebarItems.map(
              ({
                key,
                icon: Icon,
                label,
              }) => {
                const active =
                  activeView === key;

                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() =>
                      handleSelectView(key)
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />

                    <span className="truncate">
                      {label}
                    </span>
                  </button>
                );
              },
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />

              <span className="truncate">
                Log out
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}