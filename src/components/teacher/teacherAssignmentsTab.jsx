import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  HelpCircle,
  ListChecks,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import FilePreviewLink from "../filePreviewLink";
import TeacherActivitySubmissions from "./teacherActivitySubmissions";
import TeacherQuizBuilder from "./teacherQuizBuilder";
import useClassStudents from "../../hooks/useClassStudents";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const BUCKET = "activity-instructions";
const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
];

const types = {
  assignment: {
    label: "Assignment",
    icon: ClipboardList,
    badge: "bg-blue-100 text-blue-700",
    iconStyle: "bg-blue-50 text-blue-600",
  },
  performance_task: {
    label: "Performance Task",
    icon: FileCheck2,
    badge: "bg-orange-100 text-orange-700",
    iconStyle: "bg-orange-50 text-orange-600",
  },
  quiz: {
    label: "Quiz",
    icon: HelpCircle,
    badge: "bg-purple-100 text-purple-700",
    iconStyle: "bg-purple-50 text-purple-600",
  },
};

const emptyForm = {
  activity_type: "assignment",
  grading_period: "1",
  title: "",
  instructions: "",
  due_at: "",
  points: "100",
  status: "published",
};

const gradingPeriods = [
  { value: "1", label: "1st Grading" },
  { value: "2", label: "2nd Grading" },
  { value: "3", label: "3rd Grading" },
  { value: "4", label: "4th Grading" },
];

function gradingLabel(value) {
  return gradingPeriods.find(
    (period) => Number(period.value) === Number(value),
  )?.label || "Unknown grading period";
}

function fileExtension(name) {
  return String(name || "").split(".").pop().toLowerCase();
}

function validateFile(file) {
  if (!file) return "";
  if (!ALLOWED_EXTENSIONS.includes(fileExtension(file.name))) {
    return "Only PDF, DOC, and DOCX files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "The instruction file must not exceed 10 MB.";
  }
  return "";
}

function safeFileName(name) {
  return String(name || "instructions")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatFileSize(bytes) {
  if (!Number.isFinite(Number(bytes))) return "";
  if (Number(bytes) < 1024 * 1024) {
    return `${Math.max(1, Math.round(Number(bytes) / 1024))} KB`;
  }
  return `${(Number(bytes) / (1024 * 1024)).toFixed(1)} MB`;
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function formatDueDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dueState(value) {
  const hours = (new Date(value).getTime() - Date.now()) / 3_600_000;
  if (hours < 0) return { label: "Past due", style: "bg-red-100 text-red-700" };
  if (hours <= 24) return { label: "Due soon", style: "bg-amber-100 text-amber-700" };
  return { label: "Upcoming", style: "bg-green-100 text-green-700" };
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function ActivityForm({
  initialData,
  students = [],
  studentsLoading,
  studentsError,
  existingAccess = [],
  saving,
  error,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
        activity_type:
          initialData.activity_type,
        grading_period: String(
          initialData.grading_period || 1,
        ),
        title: initialData.title || "",
        instructions:
          initialData.instructions || "",
        due_at: toLocalInput(
          initialData.due_at,
        ),
        points: String(
          initialData.points ?? 100,
        ),
        status:
          initialData.status || "published",
      }
      : { ...emptyForm },
  );

  const [
    selectedStudentIds,
    setSelectedStudentIds,
  ] = useState([]);

  const [file, setFile] = useState(null);

  const [
    removeExistingFile,
    setRemoveExistingFile,
  ] = useState(false);

  const [fileError, setFileError] =
    useState("");

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentIds([]);
      return;
    }

    if (initialData) {
      const accessibleStudentIds =
        existingAccess
          .filter((record) => record.can_access)
          .map((record) => record.student_id);

      /*
       * Older activities may not have access records.
       * In that situation, select all students.
       */
      setSelectedStudentIds(
        existingAccess.length > 0
          ? accessibleStudentIds
          : students.map(
            (student) => student.student_id,
          ),
      );

      return;
    }

    setSelectedStudentIds(
      students.map(
        (student) => student.student_id,
      ),
    );
  }, [
    initialData,
    students,
    existingAccess,
  ]);

  const allStudentsSelected =
    students.length > 0 &&
    selectedStudentIds.length ===
    students.length;

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleAllStudents() {
    if (allStudentsSelected) {
      setSelectedStudentIds([]);
      return;
    }

    setSelectedStudentIds(
      students.map(
        (student) => student.student_id,
      ),
    );
  }

  function toggleStudent(studentId) {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter(
          (id) => id !== studentId,
        );
      }

      return [...current, studentId];
    });
  }

  function chooseFile(event) {
    const selectedFile =
      event.target.files?.[0] || null;

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setFile(null);
      setFileError(validationError);
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setFileError("");
    setRemoveExistingFile(false);
  }

  function submit(event) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.due_at ||
      Number(form.points) <= 0 ||
      fileError
    ) {
      return;
    }

    onSave({
      activity_type: form.activity_type,
      grading_period: Number(
        form.grading_period,
      ),
      title: form.title.trim(),
      instructions:
        form.instructions.trim() || null,
      due_at: new Date(
        form.due_at,
      ).toISOString(),
      points: Number(form.points),
      status: form.status,
      selectedStudentIds,
      instructionFile: file,
      removeExistingFile,
    });
  }

  const showExisting =
    initialData?.file_path &&
    !removeExistingFile &&
    !file;

  return (
    <form
      onSubmit={submit}
      className="space-y-4"
    >
      {(error || fileError) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {fileError || error}
        </div>
      )}

      <Field label="Activity type" required>
        <select
          className={inputClass}
          value={form.activity_type}
          onChange={(event) =>
            update(
              "activity_type",
              event.target.value,
            )
          }
          required
        >
          <option value="assignment">
            Assignment
          </option>

          <option value="performance_task">
            Performance Task
          </option>

          <option value="quiz">
            Quiz
          </option>
        </select>
      </Field>

      <Field label="Grading period" required>
        <select
          className={inputClass}
          value={form.grading_period}
          onChange={(event) =>
            update(
              "grading_period",
              event.target.value,
            )
          }
          required
        >
          {gradingPeriods.map((period) => (
            <option
              key={period.value}
              value={period.value}
            >
              {period.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title" required>
        <input
          className={inputClass}
          value={form.title}
          onChange={(event) =>
            update("title", event.target.value)
          }
          placeholder="Enter the activity title"
          maxLength={180}
          required
        />
      </Field>

      <Field label="Written instructions">
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          value={form.instructions}
          onChange={(event) =>
            update(
              "instructions",
              event.target.value,
            )
          }
          placeholder="Describe what students need to do..."
        />
      </Field>

      <Field label="Instruction file (optional)">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          {showExisting && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border bg-white p-3">
              <Paperclip className="h-5 w-5 shrink-0 text-blue-600" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">
                  {initialData.file_name ||
                    "Instruction file"}
                </p>

                <p className="text-xs text-gray-400">
                  {formatFileSize(
                    initialData.file_size,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRemoveExistingFile(true)
                }
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {file && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <Paperclip className="h-5 w-5 shrink-0 text-blue-600" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">
                  {file.name}
                </p>

                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-gray-200 hover:bg-blue-50">
            <Upload className="h-4 w-4" />

            {showExisting || file
              ? "Choose another file"
              : "Choose instruction file"}

            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={chooseFile}
              className="sr-only"
            />
          </label>

          <p className="mt-2 text-center text-xs text-gray-400">
            PDF, DOC, or DOCX only. Maximum size:
            10 MB.
          </p>
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Due date and time"
          required
        >
          <input
            className={inputClass}
            type="datetime-local"
            value={form.due_at}
            onChange={(event) =>
              update(
                "due_at",
                event.target.value,
              )
            }
            required
          />
        </Field>

        <Field label="Maximum points" required>
          <input
            className={inputClass}
            type="number"
            min="1"
            step="0.01"
            value={form.points}
            onChange={(event) =>
              update(
                "points",
                event.target.value,
              )
            }
            required
          />
        </Field>
      </div>

      <Field label="Visibility" required>
        <select
          className={inputClass}
          value={form.status}
          onChange={(event) =>
            update("status", event.target.value)
          }
          required
        >
          <option value="published">
            Published — visible to selected students
          </option>

          <option value="draft">
            Draft — teacher only
          </option>

          <option value="hidden">
            Hidden — unavailable to students
          </option>
        </select>
      </Field>

      <Field label="Student access">
        <p className="mb-3 text-xs leading-5 text-gray-500">
          All students are selected automatically.
          Uncheck absent students so they cannot view
          the activity. They will appear as Missing —
          Absent in the gradebook.
        </p>

        {studentsError && (
          <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {studentsError}
          </div>
        )}

        {studentsLoading ? (
          <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
            Loading students...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <label className="flex cursor-pointer items-center gap-3 border-b border-gray-200 bg-blue-50 p-3">
              <input
                type="checkbox"
                checked={allStudentsSelected}
                onChange={toggleAllStudents}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-blue-700">
                  Select all students
                </p>

                <p className="text-xs text-blue-500">
                  {selectedStudentIds.length} of{" "}
                  {students.length} selected
                </p>
              </div>
            </label>

            <div className="max-h-64 overflow-y-auto">
              {students.map((student) => {
                const checked =
                  selectedStudentIds.includes(
                    student.student_id,
                  );

                return (
                  <label
                    key={student.student_id}
                    className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 p-3 last:border-b-0 ${checked
                      ? "bg-white"
                      : "bg-red-50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleStudent(
                          student.student_id,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {student.full_name ||
                          "Unnamed student"}
                      </p>

                      <p className="text-xs text-gray-400">
                        {student.student_number ||
                          "No student number"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${checked
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {checked
                        ? "Can access"
                        : "Absent"}
                    </span>
                  </label>
                );
              })}

              {students.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400">
                  No students are assigned to this
                  section.
                </p>
              )}
            </div>
          </div>
        )}
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            Boolean(fileError) ||
            studentsLoading
          }
          className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : initialData
              ? "Save Changes"
              : "Create"}
        </button>
      </div>
    </form>
  );
}

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onViewSubmissions,
  onManageQuiz,
  deleting,
}) {
  const type =
    types[activity.activity_type] ||
    types.assignment;

  const TypeIcon = type.icon;
  const due = dueState(activity.due_at);

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${type.iconStyle}`}
          >
            <TypeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${type.badge}`}
              >
                {type.label}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${due.style}`}
              >
                {due.label}
              </span>

              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-700">
                {gradingLabel(
                  activity.grading_period,
                )}
              </span>

              {activity.status ===
                "draft" && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    Draft
                  </span>
                )}
            </div>

            <h3 className="mt-2 text-base font-semibold text-gray-900">
              {activity.title}
            </h3>

            {activity.instructions && (
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-500">
                {activity.instructions}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" />

                Due{" "}
                {formatDueDate(
                  activity.due_at,
                )}
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />

                {Number(activity.points)}{" "}
                points
              </span>
            </div>

            {activity.file_path && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <FilePreviewLink
                  bucket={BUCKET}
                  path={
                    activity.file_path
                  }
                  fileName={
                    activity.file_name
                      ? `View ${activity.file_name}`
                      : "View instructions"
                  }
                />

                {activity.file_size && (
                  <span className="text-xs text-gray-400">
                    {formatFileSize(
                      activity.file_size,
                    )}
                  </span>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {activity.activity_type ===
                "quiz" && (
                  <button
                    type="button"
                    onClick={() =>
                      onManageQuiz(activity)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Manage Quiz
                  </button>
                )}

              <button
                type="button"
                onClick={() =>
                  onViewSubmissions(
                    activity,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
              >
                <ListChecks className="h-4 w-4" />
                View Submissions
              </button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() =>
              onEdit(activity)
            }
            disabled={deleting}
            aria-label={`Edit ${activity.title}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(activity)
            }
            disabled={deleting}
            aria-label={`Delete ${activity.title}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TeacherAssignmentsTab({ classRecord }) {

  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    reload: reloadStudents,
  } = useClassStudents(classRecord.id);

  const [
    existingStudentAccess,
    setExistingStudentAccess,
  ] = useState([]);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [gradingFilter, setGradingFilter] = useState("all");
  const [activityWorkspace, setActivityWorkspace] = useState(null);

  async function loadActivities() {
    if (!classRecord?.id) return;
    setLoading(true);
    setPageError("");
    const { data, error } = await supabase.from("class_activities").select("*").eq("teaching_assignment_id", classRecord.id).order("due_at");
    if (error) {
      console.error(error);
      setActivities([]);
      setPageError(error.message || "Unable to load class activities.");
    } else setActivities(data || []);
    setLoading(false);
  }

  useEffect(() => { loadActivities(); }, [classRecord?.id]);

  const visibleActivities = useMemo(
    () => activities.filter((item) => {
      const matchesType =
        typeFilter === "all" ||
        item.activity_type === typeFilter;
      const matchesGrading =
        gradingFilter === "all" ||
        Number(item.grading_period) === Number(gradingFilter);
      return matchesType && matchesGrading;
    }),
    [activities, typeFilter, gradingFilter],
  );
  const counts = useMemo(() => ({
    all: activities.length,
    assignment: activities.filter((item) => item.activity_type === "assignment").length,
    performance_task: activities.filter((item) => item.activity_type === "performance_task").length,
    quiz: activities.filter((item) => item.activity_type === "quiz").length,
  }), [activities]);

  function closeModal() {
    if (saving) return;

    setModalMode(null);
    setSelected(null);
    setExistingStudentAccess([]);
    setActionError("");
  }

  async function uploadFile(file) {
    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);
    const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${classRecord.id}/${uniqueId}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    return path;
  }

  async function openEditModal(activity) {
    setSelected(activity);
    setActionError("");
    setExistingStudentAccess([]);
    setModalMode("edit");

    try {
      const { data, error } = await supabase
        .from("activity_students")
        .select(`
        student_id,
        can_access,
        activity_status,
        exclusion_reason
      `)
        .eq("activity_id", activity.id);

      if (error) throw error;

      setExistingStudentAccess(data || []);
    } catch (accessError) {
      console.error(
        "Failed to load activity access:",
        accessError,
      );

      setActionError(
        accessError.message ||
        "Unable to load student access.",
      );
    }
  }

  async function handleSave(values) {
    setSaving(true);
    setActionError("");

    const {
      instructionFile,
      removeExistingFile,
      selectedStudentIds,
      ...databaseValues
    } = values;

    const oldPath =
      selected?.file_path || null;

    let newPath = null;
    let savedActivity = null;

    try {
      if (instructionFile) {
        newPath =
          await uploadFile(instructionFile);

        Object.assign(databaseValues, {
          file_path: newPath,
          file_name: instructionFile.name,
          file_type:
            instructionFile.type ||
            "application/octet-stream",
          file_size: instructionFile.size,
        });
      } else if (
        modalMode === "edit" &&
        removeExistingFile
      ) {
        Object.assign(databaseValues, {
          file_path: null,
          file_name: null,
          file_type: null,
          file_size: null,
        });
      }

      let activityQuery;

      if (modalMode === "edit") {
        activityQuery = supabase
          .from("class_activities")
          .update(databaseValues)
          .eq("id", selected.id)
          .eq(
            "teaching_assignment_id",
            classRecord.id,
          );
      } else {
        activityQuery = supabase
          .from("class_activities")
          .insert({
            teaching_assignment_id:
              classRecord.id,
            ...databaseValues,
          });
      }

      const {
        data: activityData,
        error: activityError,
      } = await activityQuery
        .select("*")
        .single();

      if (activityError) {
        throw activityError;
      }

      savedActivity = activityData;

      /*
       * Load current access records so submitted and
       * graded statuses are not erased while editing.
       */
      const {
        data: currentAccessRows,
        error: currentAccessError,
      } = await supabase
        .from("activity_students")
        .select(`
        student_id,
        activity_status
      `)
        .eq("activity_id", savedActivity.id);

      if (currentAccessError) {
        throw currentAccessError;
      }

      const statusByStudent = new Map(
        (currentAccessRows || []).map(
          (record) => [
            record.student_id,
            record.activity_status,
          ],
        ),
      );

      const accessRows = students.map(
        (student) => {
          const studentId =
            student.student_id;

          const selectedForActivity =
            selectedStudentIds.includes(
              studentId,
            );

          const previousStatus =
            statusByStudent.get(studentId);

          let activityStatus;

          if (!selectedForActivity) {
            activityStatus = "missing";
          } else if (
            previousStatus === "submitted" ||
            previousStatus === "graded"
          ) {
            activityStatus = previousStatus;
          } else {
            activityStatus = "assigned";
          }

          return {
            activity_id: savedActivity.id,
            student_id: studentId,
            can_access:
              selectedForActivity,
            activity_status:
              activityStatus,
            exclusion_reason:
              selectedForActivity
                ? null
                : "absent",
            updated_at:
              new Date().toISOString(),
          };
        },
      );

      if (accessRows.length > 0) {
        const { error: accessError } =
          await supabase
            .from("activity_students")
            .upsert(accessRows, {
              onConflict:
                "activity_id,student_id",
            });

        if (accessError) {
          throw accessError;
        }
      }

      if (
        oldPath &&
        oldPath !== savedActivity.file_path
      ) {
        const { error: cleanupError } =
          await supabase.storage
            .from(BUCKET)
            .remove([oldPath]);

        if (cleanupError) {
          console.error(
            "Old file cleanup failed:",
            cleanupError,
          );
        }
      }

      setActivities((current) => {
        const next =
          modalMode === "edit"
            ? current.map((item) =>
              item.id === savedActivity.id
                ? savedActivity
                : item,
            )
            : [...current, savedActivity];

        return next.sort(
          (first, second) =>
            new Date(first.due_at) -
            new Date(second.due_at),
        );
      });

      setModalMode(null);
      setSelected(null);
      setExistingStudentAccess([]);
    } catch (saveError) {
      if (newPath && !savedActivity) {
        await supabase.storage
          .from(BUCKET)
          .remove([newPath]);
      }

      console.error(
        "Activity save failed:",
        saveError,
      );

      setActionError(
        saveError.message ||
        "Unable to save the activity.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(activity) {
    if (!window.confirm(`Permanently delete “${activity.title}”?`)) return;
    setDeletingId(activity.id);
    const { error } = await supabase.from("class_activities").delete().eq("id", activity.id).eq("teaching_assignment_id", classRecord.id);
    if (error) setPageError(error.message || "Unable to delete the activity.");
    else {
      if (activity.file_path) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([activity.file_path]);
        if (cleanupError) console.error("File cleanup failed:", cleanupError);
      }
      setActivities((current) => current.filter((item) => item.id !== activity.id));
    }
    setDeletingId(null);
  }

  if (activityWorkspace?.mode === "submissions") {
    return (
      <TeacherActivitySubmissions
        activity={activityWorkspace.activity}
        classRecord={classRecord}
        onBack={() => {
          setActivityWorkspace(null);
          loadActivities();
        }}
      />
    );
  }

  if (activityWorkspace?.mode === "quiz") {
    return (
      <TeacherQuizBuilder
        activity={activityWorkspace.activity}
        onBack={() => {
          setActivityWorkspace(null);
          loadActivities();
        }}
      />
    );
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">Class Activities</h2>
          <p className="text-sm text-gray-500">Create activities and attach PDF or Word instruction files.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadActivities} disabled={loading} className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50" aria-label="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button type="button" onClick={() => { setSelected(null); setActionError(""); setModalMode("create"); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Create Activity</button>
        </div>
      </div>

      {pageError && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>}

      <div className="flex flex-wrap gap-2">
        {[["all", "All"], ["assignment", "Assignments"], ["performance_task", "Performance Tasks"], ["quiz", "Quizzes"]].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setTypeFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${typeFilter === value ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label} ({counts[value]})</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setGradingFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${gradingFilter === "all"
            ? "bg-cyan-700 text-white"
            : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
            }`}
        >
          All Grading Periods
        </button>
        {gradingPeriods.map((period) => (
          <button
            key={period.value}
            type="button"
            onClick={() => setGradingFilter(period.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${gradingFilter === period.value
              ? "bg-cyan-700 text-white"
              : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">Loading class activities...</div>}
      {!loading && visibleActivities.length === 0 && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
          <div><ClipboardList className="mx-auto h-9 w-9 text-gray-300" /><h3 className="mt-3 font-semibold text-gray-800">No class activities yet</h3><p className="mt-1 text-sm text-gray-500">Create an activity and optionally attach instructions.</p></div>
        </div>
      )}
      {!loading && visibleActivities.length > 0 && (
        <div className="space-y-3">
          {visibleActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onViewSubmissions={(item) =>
                setActivityWorkspace({
                  mode: "submissions",
                  activity: item,
                })
              }
              onManageQuiz={(item) =>
                setActivityWorkspace({
                  mode: "quiz",
                  activity: item,
                })
              }
              deleting={
                deletingId === activity.id
              }
            />
          ))}        </div>
      )}

      {modalMode && (
        <Modal
          title={
            modalMode === "edit"
              ? "Edit Class Activity"
              : "Create Class Activity"
          }
          onClose={closeModal}
        >
          <ActivityForm
            key={selected?.id || "new"}
            initialData={selected}
            students={students}
            studentsLoading={studentsLoading}
            studentsError={studentsError}
            existingAccess={
              existingStudentAccess
            }
            saving={saving}
            error={actionError}
            onCancel={closeModal}
            onSave={handleSave}
          />
        </Modal>
      )}
    </div>
  );
}
