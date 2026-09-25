import React from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  Search,
  Bell,
  Mail,
  ChevronDown,
  Home,
  BookOpen,
  ClipboardList,
  CheckSquare,
  BarChart2,
  FileText,
  Megaphone,
  Calendar,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  Share2,
  Brain,
  Shield,
  MoreVertical,
} from "lucide-react";
import { supabase } from "../lib/supabase";


const sidebarItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: BookOpen, label: "My Courses" },
  { icon: ClipboardList, label: "Assignments" },
  { icon: CheckSquare, label: "Quizzes" },
  { icon: BarChart2, label: "Grades" },
  { icon: FileText, label: "Resources" },
  { icon: Megaphone, label: "Announcements" },
  { icon: Calendar, label: "Calendar" },
];

const bottomSidebarItems = [
  { icon: User, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

const statCards = [
  {
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    label: "My Courses",
    value: "6",
    action: "View all",
  },
  {
    icon: ClipboardList,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    label: "Assignments Due",
    value: "3",
    action: "View all",
  },
  {
    icon: () => <span className="text-xl">🏆</span>,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    label: "Quizzes Due",
    value: "2",
    action: "View all",
  },
  {
    icon: BarChart2,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    label: "Average Grade",
    value: "85%",
    action: "View grades",
  },
];

const courses = [
  {
    title: "Web Development",
    professor: "Prof. Rahul Verma",
    icon: Code2,
    bg: "bg-purple-500",
    progress: 75,
  },
  {
    title: "Data Structures",
    professor: "Prof. Neha Singh",
    icon: BarChart2,
    bg: "bg-blue-500",
    progress: 60,
  },
  {
    title: "Database Management Systems",
    professor: "Prof. Amit Kumar",
    icon: Database,
    bg: "bg-green-500",
    progress: 40,
  },
  {
    title: "Operating Systems",
    professor: "Prof. Anjali Mehta",
    icon: Share2,
    bg: "bg-amber-500",
    progress: 55,
  },
  {
    title: "Artificial Intelligence",
    professor: "Prof. Suresh Iyer",
    icon: Brain,
    bg: "bg-pink-500",
    progress: 20,
  },
  {
    title: "Cyber Security",
    professor: "Prof. Vikram Rao",
    icon: Shield,
    bg: "bg-teal-500",
    progress: 20,
  },
];

const deadlines = [
  {
    title: "Web Development Assignment",
    date: "May 17, 2024 · 11:59 PM",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "DBMS Quiz",
    date: "May 18, 2024 · 11:59 PM",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Data Structures Assignment",
    date: "May 20, 2024 · 11:59 PM",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
];

const announcements = [
  {
    title: "Midterm Exam Schedule",
    body: "The midterm exams will start from May 25, 2024.",
    date: "May 10, 2024",
  },
  {
    title: "New Study Material Added",
    body: "New lecture notes are added for Operating Systems.",
    date: "May 8, 2024",
  },
];

const calendarDays = [
  [28, 29, 30, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, 1],
];

function StatCard({ icon: Icon, iconBg, iconColor, label, value, action }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <a href="#" className="text-sm text-blue-600 font-medium hover:underline">
        {action}
      </a>
    </div>
  );
}

function CourseCard({ title, professor, icon: Icon, bg, progress }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className={`${bg} h-32 flex items-center justify-center`}>
        <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug pr-2">
            {title}
          </h3>
          <button className="text-gray-400 hover:text-gray-600 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{professor}</p>
        <div className="mt-3">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">{progress}% Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  async function handleLogout() {
  await supabase.auth.signOut();
  navigate("/", { replace: true });
}

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">E-LMS</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ icon: Icon, label, active }) => (
            <a
              key={label}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </a>
          ))}
        </nav>

        <div className="px-3 py-2 space-y-1 border-t border-gray-100">
          {bottomSidebarItems.map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </a>
          ))}
        </div>

        <div className="m-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start justify-between mb-1">
            <p className="font-semibold text-sm">Need Help?</p>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Contact support for any assistance.
          </p>
          <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-6 shrink-0">
          <button className="text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 max-w-xl relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses, materials, assignments..."
              className="w-full bg-gray-50 rounded-lg pl-9 pr-4 py-2 text-sm outline-none border border-transparent focus:border-gray-200"
            />
          </div>
          <div className="flex items-center gap-5 ml-auto">
            <button className="relative text-gray-500">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <button className="text-gray-500">
              <Mail className="w-5 h-5" />
            </button>
            <div className="relative pl-2 group">
              <button className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  AS
                </div>
                <div className="leading-tight text-left">
                  <p className="text-sm font-semibold">Aarav Sharma</p>
                  <p className="text-xs text-gray-400">Student</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-hover:rotate-180" />
              </button>

              <div className="absolute right-0 top-full w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-50 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
                <a
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </a>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="min-w-0 space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 flex items-center justify-between overflow-hidden">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, Aarav!
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Here's what's happening with your learning today.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                  <StatCard key={card.label} {...card} />
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">My Courses</h2>
                  <a
                    href="#"
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    View all courses
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <CourseCard key={course.title} {...course} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Calendar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Calendar</h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    <button className="hover:text-gray-600">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="hover:text-gray-600">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-center text-sm font-semibold text-gray-700 mb-3">
                  May 2024
                </p>
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (d) => (
                          <th key={d} className="font-medium pb-2">
                            {d}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarDays.map((week, i) => (
                      <tr key={i}>
                        {week.map((day, j) => {
                          const isOtherMonth =
                            (i === 0 && day > 20) || (i === 4 && day < 20);
                          const isToday = i === 2 && day === 15;
                          return (
                            <td key={j} className="py-1.5">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                  isToday
                                    ? "bg-blue-600 text-white font-semibold"
                                    : isOtherMonth
                                    ? "text-gray-300"
                                    : "text-gray-700"
                                }`}
                              >
                                {day}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Upcoming Deadlines</h3>
                  <a
                    href="#"
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    View all
                  </a>
                </div>
                <div className="space-y-4">
                  {deadlines.map((d) => (
                    <div key={d.title} className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg ${d.iconBg} flex items-center justify-center shrink-0`}
                      >
                        <ClipboardList className={`w-4 h-4 ${d.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {d.title}
                        </p>
                        <p className="text-xs text-gray-400">{d.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Announcements</h3>
                  <a
                    href="#"
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    View all
                  </a>
                </div>
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {a.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.body}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href="#"
                  className="block text-center text-sm text-blue-600 font-medium mt-4 hover:underline"
                >
                  Go to Announcements
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}