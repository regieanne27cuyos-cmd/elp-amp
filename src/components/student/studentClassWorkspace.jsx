import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  UserRound,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import SubjectImage from "../subjectImage";
import StudentActivityWork from "./studentActivityWork";

const MODULE_BUCKET = "learning-materials";

const tabs = [
  {
    key: "overview",
    label: "Overview",
    icon: BookOpen,
  },
  {
    key: "activities",
    label: "Activities",
    icon: CalendarClock,
  },
  {
    key: "modules",
    label: "Modules",
    icon: FileText,
  },
  {
    key: "grades",
    label: "Grades",
    icon: BarChart3,
  },
];

function normalize(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function formatDate(value) {
  if (!value) {
    return "No due date";
  }

  return new Date(
    value,
  ).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityTypeLabel(value) {
  if (value === "performance_task") {
    return "Performance Task";
  }

  if (value === "quiz") {
    return "Quiz";
  }

  return "Assignment";
}

function ActivityStatus({
  activity,
  submission,
  attempt,
}) {
  const record =
    activity.activity_type === "quiz"
      ? attempt
      : submission;

  let label = "Not submitted";
  let style =
    "bg-gray-100 text-gray-600";

  if (record?.status === "graded") {
    label = "Graded";
    style =
      "bg-green-100 text-green-700";
  } else if (
    record?.status === "late" ||
    record?.is_late
  ) {
    label = "Submitted late";
    style =
      "bg-orange-100 text-orange-700";
  } else if (record) {
    label =
      record.status === "in_progress"
        ? "In progress"
        : "Submitted";

    style =
      "bg-blue-100 text-blue-700";
  } else if (
    activity.due_at &&
    new Date(activity.due_at) <
      new Date()
  ) {
    label = "Missing";
    style = "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export default function StudentClassWorkspace({
  classRecord,
  onBack,
}) {
  const [activeTab, setActiveTab] =
    useState("overview");

  const [
    selectedActivity,
    setSelectedActivity,
  ] = useState(null);

  const [activities, setActivities] =
    useState([]);

  const [submissions, setSubmissions] =
    useState([]);

  const [attempts, setAttempts] =
    useState([]);

  const [scores, setScores] =
    useState([]);

  const [modules, setModules] =
    useState([]);

  const [resources, setResources] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    downloadingId,
    setDownloadingId,
  ] = useState(null);

  async function loadWorkspace() {
    if (!classRecord?.id) return;

    setLoading(true);
    setError("");

    try {
      const [
        activityResult,
        moduleResult,
      ] = await Promise.all([
        supabase
          .from("class_activities")
          .select("*")
          .eq(
            "teaching_assignment_id",
            classRecord.id,
          )
          .eq("status", "published")
          .order("due_at", {
            ascending: true,
          }),

        supabase
          .from("learning_modules")
          .select(`
            id,
            teaching_assignment_id,
            title,
            description,
            status,
            created_at,
            updated_at
          `)
          .eq(
            "teaching_assignment_id",
            classRecord.id,
          )
          .eq("status", "published")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (activityResult.error) {
        throw activityResult.error;
      }

      if (moduleResult.error) {
        throw moduleResult.error;
      }

      const loadedActivities =
        activityResult.data || [];

      const loadedModules =
        moduleResult.data || [];

      const activityIds =
        loadedActivities.map(
          (item) => item.id,
        );

      const moduleIds =
        loadedModules.map(
          (item) => item.id,
        );

      let loadedSubmissions = [];
      let loadedAttempts = [];
      let loadedScores = [];
      let loadedResources = [];

      if (activityIds.length > 0) {
        const [
          submissionResult,
          attemptResult,
          scoreResult,
        ] = await Promise.all([
          supabase
            .from(
              "activity_submissions",
            )
            .select(`
              id,
              activity_id,
              student_id,
              status,
              teacher_feedback,
              submitted_at,
              graded_at
            `)
            .in(
              "activity_id",
              activityIds,
            ),

          supabase
            .from("quiz_attempts")
            .select(`
              id,
              activity_id,
              student_id,
              status,
              is_late,
              score,
              teacher_feedback,
              submitted_at,
              graded_at
            `)
            .in(
              "activity_id",
              activityIds,
            ),

          supabase
            .from("activity_scores")
            .select(`
              id,
              activity_id,
              student_id,
              score
            `)
            .in(
              "activity_id",
              activityIds,
            ),
        ]);

        if (submissionResult.error) {
          throw submissionResult.error;
        }

        if (attemptResult.error) {
          throw attemptResult.error;
        }

        if (scoreResult.error) {
          throw scoreResult.error;
        }

        loadedSubmissions =
          submissionResult.data || [];

        loadedAttempts =
          attemptResult.data || [];

        loadedScores =
          scoreResult.data || [];
      }

      if (moduleIds.length > 0) {
        const {
          data: resourceData,
          error: resourceError,
        } = await supabase
          .from("module_resources")
          .select(`
            id,
            module_id,
            resource_type,
            file_name,
            file_path,
            file_type,
            file_size,
            external_url,
            created_at
          `)
          .in("module_id", moduleIds)
          .order("created_at", {
            ascending: true,
          });

        if (resourceError) {
          throw resourceError;
        }

        loadedResources =
          resourceData || [];
      }

      setActivities(loadedActivities);
      setModules(loadedModules);
      setSubmissions(
        loadedSubmissions,
      );
      setAttempts(loadedAttempts);
      setScores(loadedScores);
      setResources(loadedResources);
    } catch (loadError) {
      console.error(
        "Failed to load student class workspace:",
        loadError,
      );

      setError(
        loadError.message ||
          "Unable to load this class.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setActiveTab("overview");
    setSelectedActivity(null);
    loadWorkspace();
  }, [classRecord?.id]);

  const submissionByActivity =
    useMemo(
      () =>
        new Map(
          submissions.map((item) => [
            item.activity_id,
            item,
          ]),
        ),
      [submissions],
    );

  const attemptByActivity = useMemo(
    () =>
      new Map(
        attempts.map((item) => [
          item.activity_id,
          item,
        ]),
      ),
    [attempts],
  );

  const scoreByActivity = useMemo(
    () =>
      new Map(
        scores.map((item) => [
          item.activity_id,
          item,
        ]),
      ),
    [scores],
  );

  const resourcesByModule = useMemo(
    () => {
      const grouped = new Map();

      resources.forEach((resource) => {
        if (
          !grouped.has(
            resource.module_id,
          )
        ) {
          grouped.set(
            resource.module_id,
            [],
          );
        }

        grouped
          .get(resource.module_id)
          .push(resource);
      });

      return grouped;
    },
    [resources],
  );

  const gradedActivities =
    activities.filter((activity) => {
      if (
        activity.activity_type ===
        "quiz"
      ) {
        return (
          attemptByActivity.get(
            activity.id,
          )?.status === "graded"
        );
      }

      return scoreByActivity.has(
        activity.id,
      );
    });

  async function downloadResource(
    resource,
  ) {
    if (!resource.file_path) return;

    setDownloadingId(resource.id);
    setError("");

    try {
      const {
        data,
        error: downloadError,
      } = await supabase.storage
        .from(MODULE_BUCKET)
        .createSignedUrl(
          resource.file_path,
          60,
          {
            download:
              resource.file_name ||
              "learning-material",
          },
        );

      if (downloadError) {
        throw downloadError;
      }

      const link =
        document.createElement("a");

      link.href = data.signedUrl;
      link.download =
        resource.file_name ||
        "learning-material";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadError) {
      console.error(
        "Material download failed:",
        downloadError,
      );

      setError(
        downloadError.message ||
          "Unable to download this material.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  if (selectedActivity) {
    return (
      <StudentActivityWork
        activity={selectedActivity}
        onBack={() => {
          setSelectedActivity(null);
          loadWorkspace();
        }}
      />
    );
  }

  const subject = normalize(
    classRecord.subject,
  );

  const section = normalize(
    classRecord.section,
  );

  const teacher = normalize(
    classRecord.teacher,
  );

  const teacherProfile = normalize(
    teacher?.profile,
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Classes
      </button>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          <SubjectImage
            path={subject?.image_path}
            name={
              subject?.subject_name ||
              "Subject"
            }
            className="h-52 w-full lg:h-full"
          />

          <div className="p-6">
            <p className="text-sm font-medium text-blue-600">
              {subject?.subject_code ||
                "No subject code"}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {subject?.subject_name ||
                "Subject unavailable"}
            </h1>

            <p className="mt-2 text-sm capitalize text-gray-500">
              {subject?.subject_type ||
                "Subject"}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <GraduationCap className="h-4 w-4 text-gray-400" />

                <p className="mt-2 text-xs text-gray-400">
                  Section
                </p>

                <p className="text-sm font-medium text-gray-700">
                  Grade{" "}
                  {section?.grade_level ||
                    "—"}
                  {" · "}
                  {section?.section_name ||
                    "Unassigned"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <UserRound className="h-4 w-4 text-gray-400" />

                <p className="mt-2 text-xs text-gray-400">
                  Teacher
                </p>

                <p className="text-sm font-medium text-gray-700">
                  {teacherProfile?.full_name ||
                    "Teacher unavailable"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <BookOpen className="h-4 w-4 text-gray-400" />

                <p className="mt-2 text-xs text-gray-400">
                  School year
                </p>

                <p className="text-sm font-medium text-gray-700">
                  {classRecord.school_year
                    ?.name || "Unavailable"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div
          role="tablist"
          className="flex overflow-x-auto border-b border-gray-100"
        >
          {tabs.map(
            ({
              key,
              label,
              icon: Icon,
            }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={
                  activeTab === key
                }
                onClick={() =>
                  setActiveTab(key)
                }
                className={`flex min-w-fit items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ),
          )}
        </div>

        {error && (
          <div className="m-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading class...
          </div>
        )}

        {!loading &&
          !error &&
          activeTab === "overview" && (
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Published Activities
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {activities.length}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    Learning Modules
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-900">
                    {modules.length}
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50 p-4">
                  <p className="text-sm text-purple-700">
                    Graded Activities
                  </p>

                  <p className="mt-1 text-2xl font-bold text-purple-900">
                    {gradedActivities.length}
                  </p>
                </div>
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          activeTab === "activities" && (
            <div className="space-y-3 p-5">
              {activities.map(
                (activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() =>
                      setSelectedActivity(
                        activity,
                      )
                    }
                    className="flex w-full flex-col gap-3 rounded-xl border border-gray-100 p-4 text-left hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        {activityTypeLabel(
                          activity.activity_type,
                        )}
                        {" · "}
                        Grading{" "}
                        {
                          activity.grading_period
                        }
                      </p>

                      <h3 className="mt-1 font-semibold text-gray-900">
                        {activity.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Due{" "}
                        {formatDate(
                          activity.due_at,
                        )}
                        {" · "}
                        {Number(
                          activity.points,
                        )}{" "}
                        points
                      </p>
                    </div>

                    <ActivityStatus
                      activity={activity}
                      submission={submissionByActivity.get(
                        activity.id,
                      )}
                      attempt={attemptByActivity.get(
                        activity.id,
                      )}
                    />
                  </button>
                ),
              )}

              {activities.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
                  No published activities yet.
                </div>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          activeTab === "modules" && (
            <div className="space-y-4 p-5">
              {modules.map((module) => {
                const moduleResources =
                  resourcesByModule.get(
                    module.id,
                  ) || [];

                return (
                  <article
                    key={module.id}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {module.title}
                    </h3>

                    {module.description && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                        {module.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      {moduleResources.map(
                        (resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                          >
                            <FileText className="h-5 w-5 shrink-0 text-blue-600" />

                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                              {resource.file_name ||
                                resource.external_url ||
                                "Resource"}
                            </p>

                            {resource.external_url ? (
                              <a
                                href={
                                  resource.external_url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-2 text-blue-600 hover:bg-blue-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadResource(
                                    resource,
                                  )
                                }
                                disabled={
                                  downloadingId ===
                                  resource.id
                                }
                                className="rounded p-2 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                              >
                                {downloadingId ===
                                resource.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        ),
                      )}

                      {moduleResources.length ===
                        0 && (
                        <p className="text-sm text-gray-400">
                          No resources attached.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}

              {modules.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
                  No published modules yet.
                </div>
              )}
            </div>
          )}

        {!loading &&
          !error &&
          activeTab === "grades" && (
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">
                      Activity
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Type
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Grading
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Score
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map(
                    (activity) => {
                      const attempt =
                        attemptByActivity.get(
                          activity.id,
                        );

                      const score =
                        activity.activity_type ===
                        "quiz"
                          ? attempt?.score
                          : scoreByActivity.get(
                              activity.id,
                            )?.score;

                      const graded =
                        score !== null &&
                        score !== undefined;

                      return (
                        <tr
                          key={activity.id}
                          className="border-t border-gray-100"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {activity.title}
                          </td>

                          <td className="px-4 py-3 text-gray-600">
                            {activityTypeLabel(
                              activity.activity_type,
                            )}
                          </td>

                          <td className="px-4 py-3 text-gray-600">
                            {
                              activity.grading_period
                            }
                          </td>

                          <td className="px-4 py-3 text-gray-700">
                            {graded
                              ? `${Number(
                                  score,
                                )} / ${Number(
                                  activity.points,
                                )}`
                              : "—"}
                          </td>

                          <td className="px-4 py-3">
                            {graded ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Graded
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                                Not graded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>

              {activities.length === 0 && (
                <p className="p-8 text-center text-sm text-gray-500">
                  No activities available.
                </p>
              )}
            </div>
          )}
      </section>
    </div>
  );
}