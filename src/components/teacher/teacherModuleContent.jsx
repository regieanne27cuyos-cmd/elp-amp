import { BookOpen } from "lucide-react";
import AnnouncementList from "./announcementList";
import TeacherMyClasses from "./teacherMyClasses";
import TeacherCalendar from "./teacherCalendar";
import TeacherProfile from "./teacherProfile";
import TeacherSettings from "./teacherSettings";
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
}) {
  if (activeView === "classes") {
    return <TeacherMyClasses />;
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
    return (
      <TeacherSettings
        teacherProfile={teacherProfile}
      />
    );
  }

  if (activeView === "materials") {
    return <TeacherLearningMaterials />;
  }

  if (activeView === "announcements") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Announcements
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View active school announcements.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <AnnouncementList
            announcements={announcements}
            loading={announcementsLoading}
            error={announcementsError}
          />
        </div>
      </div>
    );
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
        teacherModuleDescriptions[activeView] ||
        "This teacher module is ready to be connected."
      }
      icon={Icon}
    />
  );
}