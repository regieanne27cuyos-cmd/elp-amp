import {
    useState,
} from "react";
import {
    Bell,
    BookOpen,
    CalendarDays,
    ClipboardList,
    GraduationCap,
    Home,
    LogOut,
    Menu,
    Megaphone,
    RefreshCw,
    User,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import useStudentDashboard from "../hooks/useStudentDashboard";
import SubjectImage from "../components/subjectImage";
import StudentDashboardHome from "../components/student/studentDashboardHome";
import StudentAssignments from "../components/student/studentAssignments";
import StudentActivityWork from "../components/student/studentActivityWork";
import StudentHeader from "../components/student/studentHeader";
import StudentProfile from "../components/student/studentProfile";

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

function getInitials(name) {
    return String(name || "Student")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function StudentSidebar({
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
                className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-100 bg-white transition-transform lg:static lg:translate-x-0 ${mobileOpen
                    ? "translate-x-0"
                    : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
                    <GraduationCap className="h-6 w-6 text-blue-600" />

                    <span className="text-lg font-bold">
                        ELP-AMP Student
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
                    {navigationItems.map(
                        ({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    onSelectView(key);
                                    onClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeView === key
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

                <div className="border-t border-gray-100 p-3">
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

function StudentClasses({
    classes,
    loading,
    error,
    onRetry,
    onOpenClass,
}) {
    if (loading) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500">
                Loading your classes...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 flex items-center gap-2 font-medium hover:underline"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    My Classes
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View the subjects assigned to your section.
                </p>
            </div>

            {classes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                    No classes are currently assigned to your
                    section.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {classes.map((classRecord) => (
                        <button
                            key={classRecord.id}
                            type="button"
                            onClick={() =>
                                onOpenClass(classRecord)
                            }
                            className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        >
                            <SubjectImage
                                path={classRecord.subject?.image_path}
                                name={
                                    classRecord.subject?.subject_name ||
                                    "Subject unavailable"
                                }
                                className="h-40 w-full"
                            />

                            <div className="p-5">
                                <p className="text-xs font-medium text-blue-600">
                                    {classRecord.subject
                                        ?.subject_code || "—"}
                                </p>

                                <h2 className="mt-1 font-semibold text-gray-900">
                                    {classRecord.subject
                                        ?.subject_name ||
                                        "Subject unavailable"}
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    Grade{" "}
                                    {classRecord.section
                                        ?.grade_level || "—"}
                                    {" · "}
                                    {classRecord.section
                                        ?.section_name || "—"}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Teacher:{" "}
                                    {classRecord.teacher?.profile
                                        ?.full_name ||
                                        "Not available"}
                                </p>

                                <div className="mt-4 rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-600">
                                    Open class
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
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
        classes,
        activities,
        loading,
        error,
        reload,
    } = useStudentDashboard();

    const [selectedActivity, setSelectedActivity] =
        useState(null);

    const [activeView, setActiveView] =
        useState("dashboard");

    const [mobileOpen, setMobileOpen] =
        useState(false);

    const [selectedClass, setSelectedClass] =
        useState(null);

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/", {
            replace: true,
        });
    }

    function handleOpenClass(classRecord) {
        setSelectedClass(classRecord);

        /*
         * The student class workspace can be added next.
         * For now, this opens My Classes.
         */
        setActiveView("classes");
    }

    function renderContent() {

        if (selectedActivity) {
            return (
                <StudentActivityWork
                    activity={selectedActivity}
                    onBack={() => {
                        setSelectedActivity(null);
                        setActiveView("assignments");
                    }}
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
                    onRetry={reload}
                    onOpenClass={handleOpenClass}
                    onSelectView={setActiveView}
                />
            );
        }

        if (activeView === "classes") {
            return (
                <StudentClasses
                    classes={classes}
                    loading={loading}
                    error={error}
                    onRetry={reload}
                    onOpenClass={handleOpenClass}
                />
            );
        }

        if (activeView === "assignments") {
            return (
                <StudentAssignments
                    activities={activities}
                    loading={loading}
                    error={error}
                    onRetry={reload}
                    onOpenActivity={(activity) => {
                        setSelectedActivity(activity);
                    }}
                />
            );
        }

        if (activeView === "calendar") {
            return (
                <PlaceholderView
                    title="Student Calendar"
                    description="Activity deadlines and school events will appear here."
                    icon={CalendarDays}
                />
            );
        }

        if (activeView === "announcements") {
            return (
                <PlaceholderView
                    title="Announcements"
                    description="Active announcements from the school administration will appear here."
                    icon={Megaphone}
                />
            );
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
    }

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
            <StudentSidebar
                activeView={activeView}
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
                onSelectView={(view) => {
                    setActiveView(view);
                    setSelectedClass(null);
                    setSelectedActivity(null);
                }}
                onLogout={handleLogout}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <StudentHeader
                    studentProfile={student}
                    announcementCount={0}
                    onOpenSidebar={() =>
                        setMobileOpen(true)
                    }
                    onSelectView={(view) => {
                        setActiveView(view);
                        setSelectedClass(null);
                        setSelectedActivity(null);
                    }}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {selectedClass &&
                        activeView === "classes" && (
                            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                Selected class:{" "}
                                <strong>
                                    {selectedClass.subject
                                        ?.subject_name}
                                </strong>
                            </div>
                        )}

                    {renderContent()}
                </main>
            </div>
        </div>
    );
}