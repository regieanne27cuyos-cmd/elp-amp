import {
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
} from "lucide-react";

export const teacherSidebarItems = [
  {
    key: "dashboard",
    icon: Home,
    label: "Dashboard",
  },
  {
    key: "classes",
    icon: BookOpen,
    label: "My Classes",
  },
  {
    key: "assignments",
    icon: ClipboardList,
    label: "Assignments",
  },
  {
    key: "quizzes",
    icon: CheckSquare,
    label: "Quizzes",
  },
  {
    key: "gradebook",
    icon: BarChart2,
    label: "Gradebook",
  },
  {
    key: "materials",
    icon: FileText,
    label: "Learning Materials",
  },
  {
    key: "announcements",
    icon: Megaphone,
    label: "Announcements",
  },
  {
    key: "calendar",
    icon: Calendar,
    label: "Calendar",
  },
];

export const teacherBottomSidebarItems = [
  {
    key: "profile",
    icon: User,
    label: "Profile",
  },
  {
    key: "settings",
    icon: Settings,
    label: "Settings",
  },
];

export const teacherModuleDescriptions = {
  classes:
    "Assigned subjects, sections, schedules, and student lists will appear here.",
  assignments:
    "Create assignments and review student submissions here.",
  quizzes:
    "Create quizzes, questions, schedules, and attempts here.",
  gradebook:
    "Record and review student grades for each subject and section.",
  materials:
    "Upload learning materials for your assigned classes.",
  calendar:
    "Your class schedules, deadlines, and school events will appear here.",
  profile:
    "View and update your teacher profile information.",
  settings:
    "Manage your teacher account preferences.",
};

export const sampleClasses = [
  {
    id: "sample-class-1",
    subject: "General Mathematics",
    subjectCode: "GEN-MATH",
    section: "STEM A",
    gradeLevel: "Grade 11",
    studentCount: 32,
    schedule: "Monday and Wednesday · 8:00 AM",
    color: "bg-blue-500",
  },
  {
    id: "sample-class-2",
    subject: "Statistics and Probability",
    subjectCode: "STAT-PROB",
    section: "STEM B",
    gradeLevel: "Grade 11",
    studentCount: 30,
    schedule: "Tuesday and Thursday · 9:30 AM",
    color: "bg-purple-500",
  },
  {
    id: "sample-class-3",
    subject: "Practical Research 2",
    subjectCode: "PR-2",
    section: "HUMSS A",
    gradeLevel: "Grade 12",
    studentCount: 34,
    schedule: "Monday and Friday · 1:00 PM",
    color: "bg-emerald-500",
  },
  {
    id: "sample-class-4",
    subject: "Media and Information Literacy",
    subjectCode: "MIL",
    section: "ABM A",
    gradeLevel: "Grade 12",
    studentCount: 31,
    schedule: "Wednesday and Friday · 2:30 PM",
    color: "bg-orange-500",
  },
];

export const sampleDeadlines = [
  {
    id: "deadline-1",
    title: "Check General Mathematics Assignment",
    subject: "General Mathematics",
    date: "September 9, 2026 · 5:00 PM",
  },
  {
    id: "deadline-2",
    title: "Publish Statistics Quiz",
    subject: "Statistics and Probability",
    date: "September 10, 2026 · 8:00 AM",
  },
  {
    id: "deadline-3",
    title: "Submit Grade 11 Progress Report",
    subject: "Faculty requirement",
    date: "September 12, 2026 · 5:00 PM",
  },
];

export const sampleSchedule = [
  {
    id: "schedule-1",
    time: "8:00 AM",
    endTime: "9:00 AM",
    subject: "General Mathematics",
    section: "STEM A",
    room: "Room 201",
  },
  {
    id: "schedule-2",
    time: "10:00 AM",
    endTime: "11:00 AM",
    subject: "Statistics and Probability",
    section: "STEM B",
    room: "Room 204",
  },
  {
    id: "schedule-3",
    time: "1:00 PM",
    endTime: "2:00 PM",
    subject: "Practical Research 2",
    section: "HUMSS A",
    room: "Room 302",
  },
];