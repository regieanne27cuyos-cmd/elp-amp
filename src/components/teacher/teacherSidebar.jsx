import {
  GraduationCap,
  LogOut,
  X,
} from "lucide-react";
import {
  teacherBottomSidebarItems,
  teacherSidebarItems,
} from "./teacherConfig";

export default function teacherSidebar({
  activeView,
  mobileOpen,
  onClose,
  onSelectView,
  onLogout,
}) {
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
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-100 bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <GraduationCap className="h-6 w-6 text-blue-600" />

          <span className="text-lg font-bold">
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {teacherSidebarItems.map(
            ({ key, icon: Icon, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => onSelectView(key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeView === key
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </button>
            ),
          )}
        </nav>

        <div className="space-y-1 border-t border-gray-100 px-3 py-3">
          {teacherBottomSidebarItems.map(
            ({ key, icon: Icon, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => onSelectView(key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  activeView === key
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}