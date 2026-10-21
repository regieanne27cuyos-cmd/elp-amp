import {
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Trophy,
  Users,
} from "lucide-react";
import TeacherActivitySubmissions from "./teacherActivitySubmissions";

const tabs = [
  {
    key: "overview",
    label: "Overview",
    icon: FileText,
  },
  {
    key: "submissions",
    label: "Submissions",
    icon: Users,
  },
];

function formatDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid deadline";
  }

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatActivityType(
  value,
  customActivityType,
) {
  if (customActivityType?.trim()) {
    return customActivityType.trim();
  }

  if (value === "performance_task") {
    return "Performance Task";
  }

  if (value === "quiz") {
    return "Quiz";
  }

  return "Assignment";
}

function formatGradingPeriod(value) {
  const gradingPeriod = Number(value);

  if (gradingPeriod === 1) {
    return "First Grading";
  }

  if (gradingPeriod === 2) {
    return "Second Grading";
  }

  if (gradingPeriod === 3) {
    return "Third Grading";
  }

  if (gradingPeriod === 4) {
    return "Fourth Grading";
  }

  return "Grading period unavailable";
}

function getActivityAppearance(type) {
  if (type === "quiz") {
    return {
      icon: CheckSquare,
      color:
        "bg-purple-100 text-purple-600",
    };
  }

  if (type === "performance_task") {
    return {
      icon: Trophy,
      color:
        "bg-orange-100 text-orange-600",
    };
  }

  return {
    icon: ClipboardList,
    color: "bg-blue-100 text-blue-600",
  };
}

function InformationCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <p className="mt-2 text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}

function ActivityOverview({
  activity,
  classRecord,
  onViewSubmissions,
}) {
  const appearance =
    getActivityAppearance(
      activity.activity_type,
    );

  const ActivityIcon = appearance.icon;

  const deadlinePassed =
    activity.due_at &&
    new Date(activity.due_at) <
    new Date();

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${appearance.color}`}
          >
            <ActivityIcon className="h-6 w-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {formatActivityType(
                  activity.activity_type,
                  activity.custom_activity_type,
                )}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${activity.status ===
                  "published" ||
                  activity.status ===
                  "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                  }`}
              >
                {activity.status || "Draft"}
              </span>

              {deadlinePassed && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                  Deadline passed
                </span>
              )}
            </div>

            <h2 className="mt-3 text-xl font-bold text-gray-900">
              {activity.title ||
                "Untitled activity"}
            </h2>

            <p className="mt-1 text-sm text-blue-600">
              {classRecord?.subject
                ?.subject_name ||
                "Subject unavailable"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewSubmissions}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Users className="h-4 w-4" />

          {activity.activity_type === "quiz"
            ? "View Attempts"
            : "View Submissions"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InformationCard
          icon={GraduationCap}
          label="Section"
          value={
            classRecord?.section
              ? `Grade ${classRecord.section
                .grade_level || "—"
              } · ${classRecord.section
                .section_name || "—"
              }`
              : "Section unavailable"
          }
        />

        <InformationCard
          icon={CalendarDays}
          label="Grading period"
          value={formatGradingPeriod(
            activity.grading_period,
          )}
        />

        <InformationCard
          icon={BarChart3}
          label="Maximum points"
          value={`${Number(
            activity.points || 0,
          )} points`}
        />

        <InformationCard
          icon={Clock}
          label="Due date"
          value={formatDate(
            activity.due_at,
          )}
        />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="font-bold text-gray-900">
            Instructions
          </h3>
        </div>

        <div className="p-5">
          <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
            {activity.instructions ||
              "No instructions were provided for this activity."}
          </p>
        </div>
      </section>

      {(activity.instruction_file_url ||
        activity.instruction_file_path ||
        activity.attachment_url) && (
          <section className="rounded-xl border border-gray-100 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-bold text-gray-900">
                Instruction File
              </h3>
            </div>

            <div className="p-5">
              <a
                href={
                  activity.instruction_file_url ||
                  activity.attachment_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                <FileText className="h-4 w-4" />
                Open instruction file
              </a>
            </div>
          </section>
        )}
    </div>
  );
}

export default function TeacherActivityWorkspace({
  activity,
  classRecord,
  onBack,
}) {
  const [activeTab, setActiveTab] =
    useState("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [activity.id]);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <header>
        <p className="text-sm font-medium text-blue-600">
          {classRecord?.subject
            ?.subject_code ||
            "Activity"}
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          {activity.title ||
            "Untitled Activity"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {formatActivityType(
            activity.activity_type,
            activity.custom_activity_type,
          )}
          {" · "}
          {classRecord?.section
            ?.section_name ||
            "Section unavailable"}
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div
          role="tablist"
          aria-label="Activity workspace"
          className="flex overflow-x-auto border-b border-gray-100"
        >
          {tabs.map(
            ({
              key,
              label,
              icon: Icon,
            }) => {
              const active =
                activeTab === key;

              return (
                <button
                  key={key}
                  id={`activity-${key}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`activity-${key}-panel`}
                  onClick={() =>
                    setActiveTab(key)
                  }
                  className={`flex min-w-fit items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium ${active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            },
          )}
        </div>

        <div
          id={`activity-${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`activity-${activeTab}-tab`}
        >
          {activeTab === "overview" && (
            <ActivityOverview
              activity={activity}
              classRecord={classRecord}
              onViewSubmissions={() =>
                setActiveTab(
                  "submissions",
                )
              }
            />
          )}

          {activeTab === "submissions" && (
            <TeacherActivitySubmissions
              activity={activity}
              classRecord={classRecord}
              onBack={() =>
                setActiveTab("overview")
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}