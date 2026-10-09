import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Upload,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const allowedExtensions = [
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
];

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70";

function safeName(name) {
  return String(name || "submission")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

function validateFile(file) {
  if (!file) return "";

  const extension = String(file.name || "")
    .split(".")
    .pop()
    .toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return "Upload a PDF, DOC, DOCX, PNG, JPG, or JPEG file.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "The file must not exceed 20 MB.";
  }

  return "";
}

function formatDate(value) {
  if (!value) return "No deadline";

  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(value) {
  const bytes = Number(value || 0);

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatActivityType(value) {
  return String(value || "activity")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function normalizeResult(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeOptions(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function isQuizActivity(activity) {
  return (
    String(activity?.activity_type || "")
      .trim()
      .toLowerCase() === "quiz"
  );
}

function getSubmissionBadge(status) {
  const badges = {
    submitted: {
      label: "Submitted",
      className: "bg-green-50 text-green-700",
      icon: CheckCircle2,
    },
    late: {
      label: "Submitted Late",
      className: "bg-orange-50 text-orange-700",
      icon: Clock,
    },
    graded: {
      label: "Graded",
      className: "bg-blue-50 text-blue-700",
      icon: CheckCircle2,
    },
    in_progress: {
      label: "In Progress",
      className: "bg-yellow-50 text-yellow-700",
      icon: Clock,
    },
  };

  return (
    badges[status] || {
      label: "Not Submitted",
      className: "bg-gray-100 text-gray-600",
      icon: AlertCircle,
    }
  );
}

function QuestionOptions({
  question,
  answer,
  disabled,
  onChange,
}) {
  const options = normalizeOptions(
    question.options,
  );

  if (
    question.question_type ===
    "multiple_choice"
  ) {
    return (
      <div className="mt-4 space-y-2">
        {options.map((option, optionIndex) => {
          const optionValue = String(option);
          const selected =
            answer === optionValue;

          return (
            <label
              key={`${question.id}-${optionIndex}`}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                disabled
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer"
              } ${
                selected
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-100 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={optionValue}
                checked={selected}
                disabled={disabled}
                onChange={(event) =>
                  onChange(event.target.value)
                }
                className="h-4 w-4 border-gray-300 text-blue-600"
              />

              <span>{optionValue}</span>
            </label>
          );
        })}

        {options.length === 0 && (
          <p className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
            This question has no available choices.
          </p>
        )}
      </div>
    );
  }

  if (
    question.question_type === "true_false"
  ) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {["True", "False"].map((option) => {
          const selected = answer === option;

          return (
            <label
              key={option}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                disabled
                  ? "cursor-not-allowed opacity-70"
                  : "cursor-pointer"
              } ${
                selected
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-100 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={selected}
                disabled={disabled}
                onChange={(event) =>
                  onChange(event.target.value)
                }
                className="h-4 w-4 border-gray-300 text-blue-600"
              />

              {option}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <textarea
      value={answer || ""}
      onChange={(event) =>
        onChange(event.target.value)
      }
      disabled={disabled}
      placeholder="Enter your answer"
      className={`${inputClass} mt-4 min-h-24 resize-y`}
    />
  );
}

export default function StudentActivityWork({
  activity,
  onBack,
}) {
  const fileInputRef = useRef(null);

  const isQuiz = isQuizActivity(activity);

  const [submission, setSubmission] =
    useState(null);

  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});

  const [textAnswer, setTextAnswer] =
    useState("");

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const deadlinePassed = useMemo(
    () =>
      Boolean(
        activity?.due_at &&
          new Date(activity.due_at).getTime() <
            Date.now(),
      ),
    [activity?.due_at],
  );

  const submissionLocked =
    submission?.status === "graded";

  const quizSubmitted =
    attempt &&
    ["submitted", "graded"].includes(
      attempt.status,
    );

  const currentStatus = isQuiz
    ? attempt?.status
    : submission?.status;

  const statusBadge =
    getSubmissionBadge(currentStatus);

  const StatusIcon = statusBadge.icon;

  async function loadWork() {
    setLoading(true);
    setError("");
    setSuccess("");
    setSubmission(null);
    setAttempt(null);
    setQuestions([]);
    setAnswers({});
    setTextAnswer("");
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      if (isQuiz) {
        const [
          questionResult,
          attemptResult,
        ] = await Promise.all([
          supabase
            .from("quiz_questions")
            .select(`
              id,
              question_type,
              question_text,
              options,
              points,
              position
            `)
            .eq("activity_id", activity.id)
            .order("position", {
              ascending: true,
            }),

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
            .eq("activity_id", activity.id)
            .maybeSingle(),
        ]);

        if (questionResult.error) {
          throw questionResult.error;
        }

        if (attemptResult.error) {
          throw attemptResult.error;
        }

        setQuestions(
          questionResult.data || [],
        );

        setAttempt(
          attemptResult.data || null,
        );

        return;
      }

      const {
        data,
        error: submissionError,
      } = await supabase
        .from("activity_submissions")
        .select(`
          id,
          activity_id,
          student_id,
          text_answer,
          file_path,
          file_name,
          file_type,
          file_size,
          status,
          teacher_feedback,
          submitted_at,
          graded_at,
          updated_at
        `)
        .eq("activity_id", activity.id)
        .maybeSingle();

      if (submissionError) {
        throw submissionError;
      }

      setSubmission(data || null);
      setTextAnswer(data?.text_answer || "");
    } catch (loadError) {
      console.error(
        "Failed to load activity work:",
        loadError,
      );

      setError(
        loadError.message ||
          "Unable to load this activity.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activity?.id) {
      loadWork();
    }
  }, [activity?.id]);

  function chooseFile(event) {
    const selected =
      event.target.files?.[0] || null;

    const validationError =
      validateFile(selected);

    setSuccess("");

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  }

  async function submitActivity(event) {
    event.preventDefault();

    if (submissionLocked) {
      setError(
        "This submission has already been graded and can no longer be changed.",
      );
      return;
    }

    const normalizedText =
      textAnswer.trim();

    if (
      !normalizedText &&
      !file &&
      !submission?.file_path
    ) {
      setError(
        "Enter a written response or upload a file.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let uploadedPath = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again.",
        );
      }

      let fileData = {
        path: submission?.file_path || null,
        name: submission?.file_name || null,
        type: submission?.file_type || null,
        size: submission?.file_size || null,
      };

      if (file) {
        const validationError =
          validateFile(file);

        if (validationError) {
          throw new Error(validationError);
        }

        const uniqueId =
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

        uploadedPath = [
          activity.id,
          user.id,
          `${uniqueId}-${safeName(file.name)}`,
        ].join("/");

        const {
          error: uploadError,
        } = await supabase.storage
          .from("student-submissions")
          .upload(uploadedPath, file, {
            contentType:
              file.type ||
              "application/octet-stream",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        fileData = {
          path: uploadedPath,
          name: file.name,
          type:
            file.type ||
            "application/octet-stream",
          size: file.size,
        };
      }

      const oldFilePath =
        submission?.file_path || null;

      const {
        data,
        error: submitError,
      } = await supabase.rpc(
        "save_activity_submission",
        {
          p_activity_id: activity.id,
          p_text_answer:
            normalizedText || null,
          p_file_path: fileData.path,
          p_file_name: fileData.name,
          p_file_type: fileData.type,
          p_file_size: fileData.size,
        },
      );

      if (submitError) {
        throw submitError;
      }

      const savedSubmission =
        normalizeResult(data);

      if (!savedSubmission) {
        throw new Error(
          "The server did not return the saved submission.",
        );
      }

      setSubmission(savedSubmission);
      setTextAnswer(
        savedSubmission.text_answer || "",
      );
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (
        uploadedPath &&
        oldFilePath &&
        oldFilePath !== uploadedPath
      ) {
        const {
          error: removeOldFileError,
        } = await supabase.storage
          .from("student-submissions")
          .remove([oldFilePath]);

        if (removeOldFileError) {
          console.error(
            "Unable to remove the replaced file:",
            removeOldFileError,
          );
        }
      }

      setSuccess(
        savedSubmission.status === "late"
          ? "Your activity was submitted successfully and marked late."
          : submission
            ? "Your submission was updated successfully."
            : "Your activity was submitted successfully.",
      );
    } catch (submitError) {
      console.error(
        "Unable to submit activity:",
        submitError,
      );

      if (uploadedPath) {
        const { error: cleanupError } =
          await supabase.storage
            .from("student-submissions")
            .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Unable to remove the failed upload:",
            cleanupError,
          );
        }
      }

      setError(
        submitError.message ||
          "Unable to submit your work.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitQuiz(event) {
    event.preventDefault();

    if (quizSubmitted) return;

    if (questions.length === 0) {
      setError(
        "This quiz does not have any questions yet.",
      );
      return;
    }

    const unansweredQuestionIndex =
      questions.findIndex((question) => {
        const answer = answers[question.id];

        return (
          answer === undefined ||
          answer === null ||
          String(answer).trim() === ""
        );
      });

    if (unansweredQuestionIndex !== -1) {
      setError(
        `Please answer question ${
          unansweredQuestionIndex + 1
        } before submitting.`,
      );
      return;
    }

    const confirmed = window.confirm(
      "Submit this quiz? You cannot change your answers after submission.",
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = questions.map(
        (question) => ({
          question_id: question.id,
          answer: answers[question.id],
        }),
      );

      const {
        data,
        error: submitError,
      } = await supabase.rpc(
        "submit_quiz_attempt",
        {
          p_activity_id: activity.id,
          p_answers: payload,
        },
      );

      if (submitError) {
        throw submitError;
      }

      const savedAttempt =
        normalizeResult(data);

      if (!savedAttempt) {
        throw new Error(
          "The server did not return the submitted quiz attempt.",
        );
      }

      setAttempt(savedAttempt);

      setSuccess(
        savedAttempt.status === "graded"
          ? "Your quiz was submitted and checked successfully."
          : "Your quiz was submitted for teacher checking.",
      );
    } catch (submitError) {
      console.error(
        "Unable to submit quiz:",
        submitError,
      );

      setError(
        submitError.message ||
          "Unable to submit the quiz.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function downloadSubmission() {
    if (!submission?.file_path) return;

    setDownloading(true);
    setError("");

    try {
      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from("student-submissions")
        .createSignedUrl(
          submission.file_path,
          60,
          {
            download:
              submission.file_name ||
              "submission",
          },
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (downloadError) {
      console.error(
        "Unable to download submission:",
        downloadError,
      );

      setError(
        downloadError.message ||
          "Unable to download the submitted file.",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading activity...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </button>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-600">
              {formatActivityType(
                activity.activity_type,
              )}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {activity.title}
            </h1>

            {activity.classRecord?.subject && (
              <p className="mt-2 text-sm text-gray-500">
                {
                  activity.classRecord.subject
                    .subject_code
                }
                {" · "}
                {
                  activity.classRecord.subject
                    .subject_name
                }
              </p>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${statusBadge.className}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {statusBadge.label}
          </span>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Instructions
          </h2>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {activity.instructions ||
              "Follow the teacher's instructions."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              deadlinePassed
                ? "bg-red-50 text-red-700"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            Due: {formatDate(activity.due_at)}
          </span>

          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            {Number(activity.points || 0)} points
          </span>

          {activity.grading_period && (
            <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700">
              Grading {activity.grading_period}
            </span>
          )}
        </div>

        {deadlinePassed &&
          !submission &&
          !attempt && (
            <p className="mt-3 text-xs text-red-600">
              The deadline has passed. Your work may be
              marked late when submitted.
            </p>
          )}
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {isQuiz ? (
        quizSubmitted ? (
          <section className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />

            <h2 className="mt-3 text-lg font-bold text-green-900">
              Quiz submitted
            </h2>

            <p className="mt-1 text-sm capitalize text-green-700">
              Status: {attempt.status}
              {attempt.is_late ? " · Late" : ""}
            </p>

            {attempt.status === "graded" &&
              attempt.score !== null &&
              attempt.score !== undefined && (
                <p className="mt-4 text-2xl font-bold text-green-800">
                  Score: {attempt.score} /{" "}
                  {Number(
                    activity.points || 0,
                  )}
                </p>
              )}

            {attempt.teacher_feedback && (
              <div className="mx-auto mt-5 max-w-xl rounded-xl border border-green-200 bg-white/70 p-4 text-left">
                <p className="text-sm font-semibold text-green-900">
                  Teacher feedback
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-green-700">
                  {attempt.teacher_feedback}
                </p>
              </div>
            )}
          </section>
        ) : (
          <form
            onSubmit={submitQuiz}
            className="space-y-4"
          >
            {questions.map(
              (question, index) => (
                <section
                  key={question.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-semibold text-gray-900">
                      {index + 1}.{" "}
                      {question.question_text}
                    </h2>

                    <span className="shrink-0 text-xs text-gray-400">
                      {Number(
                        question.points || 0,
                      )}{" "}
                      pts
                    </span>
                  </div>

                  <QuestionOptions
                    question={question}
                    answer={
                      answers[question.id]
                    }
                    disabled={saving}
                    onChange={(value) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }
                  />
                </section>
              ),
            )}

            {questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
                This quiz has no questions yet.
              </div>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}

                {saving
                  ? "Submitting Quiz..."
                  : "Submit Quiz"}
              </button>
            )}
          </form>
        )
      ) : (
        <form
          onSubmit={submitActivity}
          className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div>
            <h2 className="font-bold text-gray-900">
              Your Submission
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter a written response, upload a file,
              or submit both.
            </p>
          </div>

          {submission && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${statusBadge.className}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Status:{" "}
                  <span className="font-semibold">
                    {statusBadge.label}
                  </span>
                </span>

                <span className="text-xs">
                  Submitted{" "}
                  {formatDate(
                    submission.submitted_at,
                  )}
                </span>
              </div>
            </div>
          )}

          {submissionLocked && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              This activity has been graded and can no
              longer be changed.
            </div>
          )}

          <div>
            <label
              htmlFor="student-activity-response"
              className="block text-sm font-medium text-gray-700"
            >
              Written response
            </label>

            <textarea
              id="student-activity-response"
              disabled={
                submissionLocked || saving
              }
              value={textAnswer}
              onChange={(event) =>
                setTextAnswer(event.target.value)
              }
              placeholder="Enter your response here..."
              className={`${inputClass} mt-1.5 min-h-36 resize-y`}
            />
          </div>

          {submission?.file_path && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">
                Current submitted file
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-blue-600" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {submission.file_name ||
                        "Submitted file"}
                    </p>

                    <p className="text-xs text-gray-400">
                      {formatFileSize(
                        submission.file_size,
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSubmission}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}

                  Download
                </button>
              </div>
            </div>
          )}

          {!submissionLocked && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">
                {submission?.file_path
                  ? "Replace submitted file"
                  : "Upload file"}
              </p>

              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50">
                <Upload className="h-5 w-5" />

                <span className="truncate">
                  {file
                    ? file.name
                    : "Choose PDF, Word, or image file"}
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={chooseFile}
                  disabled={saving}
                  className="sr-only"
                />
              </label>

              {file && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Paperclip className="h-4 w-4" />
                  {file.name}
                  {" · "}
                  {formatFileSize(file.size)}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-400">
                PDF, DOC, DOCX, PNG, JPG or JPEG.
                Maximum file size: 20 MB.
              </p>
            </div>
          )}

          {submission?.teacher_feedback && (
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-900">
                Teacher feedback
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-purple-800">
                {submission.teacher_feedback}
              </p>

              {submission.graded_at && (
                <p className="mt-2 text-xs text-purple-500">
                  Graded{" "}
                  {formatDate(
                    submission.graded_at,
                  )}
                </p>
              )}
            </div>
          )}

          {!submissionLocked && (
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              {saving
                ? "Submitting..."
                : submission
                  ? "Update Submission"
                  : "Submit Activity"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}