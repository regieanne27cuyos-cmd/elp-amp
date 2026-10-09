import {
    Bell,
    ChevronDown,
    LogOut,
    Menu,
    Search,
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

export default function StudentHeader({
    studentProfile,
    announcementCount = 0,
    onOpenSidebar,
    onSelectView,
    onLogout,
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
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
                    htmlFor="student-search"
                    className="sr-only"
                >
                    Search student dashboard
                </label>

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                    id="student-search"
                    type="search"
                    placeholder="Search classes and assignments..."
                    className="w-full rounded-lg border border-transparent bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-gray-200"
                />
            </div>

            <div className="ml-auto flex items-center gap-3 sm:gap-5">
                <button
                    type="button"
                    onClick={() =>
                        onSelectView("announcements")
                    }
                    className="relative rounded-lg p-1 text-gray-500 hover:bg-gray-50"
                    aria-label="View announcements"
                >
                    <Bell className="h-5 w-5" />

                    {announcementCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                            {Math.min(
                                announcementCount,
                                9,
                            )}
                            {announcementCount > 9
                                ? "+"
                                : ""}
                        </span>
                    )}
                </button>

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