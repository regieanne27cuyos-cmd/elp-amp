import { BookOpen } from "lucide-react";
import TeacherMyClasses from "./teacherMyClasses";
import TeacherCalendar from "./teacherCalendar";
import TeacherProfile from "./teacherProfile";
import TeacherSettings from "./teacherSettings";
import TeacherAnnouncements from "./teacherAnnouncements";
import TeacherLearningMaterials from "./teacherLearningMaterials";
import {
  teacherBottomSidebarItems,
  teacherModuleDescriptions,
  teacherSidebarItems,
} from "./teacherConfig";

function findNavigationItem(view) {
  return [
    ...teacherSidebarItems,
    ...teacherBottomSidebarItems,
  ].find((item) => item.key === view);
}

function EmptyModule({
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

export default function TeacherModuleContent({
  activeView,
  teacherProfile,
  announcements,
  announcementsLoading,
  announcementsError,
  onOpenClass,
}) {
  if (activeView === "classes") {
    return (
      <TeacherMyClasses
        onOpenClass={onOpenClass}
      />
    );
  }

  if (activeView === "materials") {
    return (
      <TeacherLearningMaterials
        onOpenClass={onOpenClass}
      />
    );
  }

  if (activeView === "calendar") {
    return <TeacherCalendar />;
  }

  if (activeView === "profile") {
    return (
      <TeacherProfile
        teacherProfile={teacherProfile}
      />
    );
  }

  if (activeView === "settings") {
    return <TeacherSettings />;
  }

  if (activeView === "announcements") {
    return <TeacherAnnouncements />;
  }

  const navigationItem =
    findNavigationItem(activeView);

  const Icon =
    navigationItem?.icon || BookOpen;

  return (
    <EmptyModule
      title={
        navigationItem?.label ||
        "Teacher Module"
      }
      description={
        teacherModuleDescriptions[
        activeView
        ] ||
        "This teacher module is ready to be connected."
      }
      icon={Icon}
    />
  );
}