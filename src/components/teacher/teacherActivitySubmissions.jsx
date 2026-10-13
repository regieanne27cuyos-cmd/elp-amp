import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function normalize(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name) {
  return String(name || "S")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StudentName({ student }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        {initials(student?.full_name)}
      </div>
      <div>
        <p className="font-medium text-gray-900">
          {student?.full_name || "Unknown student"}
        </p>
        <p className="text-xs text-gray-400">
          {student?.student_number || "No student number"}
        </p>
      </div>
    </div>
  );
}

export default function TeacherActivitySubmissions({
  activity,
  classRecord,
  onBack,
}) {
  const isQuiz = activity.activity_type === "quiz";
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [scoreRecords, setScoreRecords] = useState([]);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const [answerScores, setAnswerScores] = useState({});
  const [answerFeedback, setAnswerFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const rosterResult = await supabase.rpc(
        "get_teacher_class_students",
        { p_teaching_assignment_id: classRecord.id },
      );
      if (rosterResult.error) throw rosterResult.error;

      const roster = rosterResult.data || [];
      setStudents(roster);

      if (isQuiz) {
        const { data, error: attemptsError } = await supabase
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
            graded_at,
            answers:quiz_answers (
              id,
              answer,
              points_awarded,
              teacher_feedback,
              question:quiz_questions!quiz_answers_question_id_fkey (
                id,
                question_text,
                question_type,
                points,
                position
              )
            )
          `)
          .eq("activity_id", activity.id)
          .order("submitted_at", { ascending: false });
        if (attemptsError) throw attemptsError;

        const normalizedAttempts = (data || []).map((attempt) => ({
          ...attempt,
          answers: (attempt.answers || [])
            .map((answer) => ({
              ...answer,
              question: normalize(answer.question),
            }))
            .sort(
              (first, second) =>
                Number(first.question?.position || 0) -
                Number(second.question?.position || 0),
            ),
        }));

        const loadedScores = {};
        const loadedFeedback = {};
        normalizedAttempts.forEach((attempt) => {
          attempt.answers.forEach((answer) => {
            loadedScores[answer.id] =
              answer.points_awarded === null
                ? ""
                : String(answer.points_awarded);
            loadedFeedback[answer.id] =
              answer.teacher_feedback || "";
          });
        });
        setAttempts(normalizedAttempts);
        setAnswerScores(loadedScores);
        setAnswerFeedback(loadedFeedback);
      } else {
        const [submissionResult, scoreResult] = await Promise.all([
          supabase
            .from("activity_submissions")
            .select("*")
            .eq("activity_id", activity.id),
          supabase
            .from("activity_scores")
            .select("id, student_id, score")
            .eq("activity_id", activity.id),
        ]);
        if (submissionResult.error) throw submissionResult.error;
        if (scoreResult.error) throw scoreResult.error;

        const loadedSubmissions = submissionResult.data || [];
        const loadedScoreRecords = scoreResult.data || [];
        const loadedScores = {};
        const loadedFeedback = {};

        loadedScoreRecords.forEach((record) => {
          loadedScores[record.student_id] = String(record.score);
        });
        loadedSubmissions.forEach((submission) => {
          loadedFeedback[submission.student_id] =
            submission.teacher_feedback || "";
        });

        setSubmissions(loadedSubmissions);
        setScoreRecords(loadedScoreRecords);
        setScores(loadedScores);
        setFeedback(loadedFeedback);
      }
    } catch (loadError) {
      console.error("Failed to load submissions:", loadError);
      setError(
        loadError.message || "Unable to load submissions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activity.id]);

  const studentById = useMemo(
    () =>
      new Map(
        students.map((student) => [student.student_id, student]),
      ),
    [students],
  );

  const submissionByStudent = useMemo(
    () =>
      new Map(
        submissions.map((submission) => [
          submission.student_id,
          submission,
        ]),
      ),
    [submissions],
  );

  async function downloadSubmission(submission) {
    if (!submission.file_path) return;
    setDownloadingId(submission.id);
    const { data, error: downloadError } = await supabase.storage
      .from("student-submissions")
      .createSignedUrl(submission.file_path, 60, {
        download: submission.file_name || "submission",
      });

    if (downloadError) {
      setError(downloadError.message);
    } else {
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = submission.file_name || "submission";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setDownloadingId(null);
  }

  async function gradeSubmission(
    submission,
  ) {
    const value =
      scores[submission.student_id];

    const numericScore = Number(value);
    const maximumScore = Number(
      activity.points || 0,
    );

    if (
      value === "" ||
      value === undefined ||
      Number.isNaN(numericScore)
    ) {
      setError(
        "Enter a valid numeric score.",
      );
      return;
    }

    if (
      numericScore < 0 ||
      numericScore > maximumScore
    ) {
      setError(
        `Enter a score from 0 to ${maximumScore}.`,
      );
      return;
    }

    setSavingId(submission.id);
    setError("");
    setSuccess("");

    try {
      const {
        data,
        error: gradeError,
      } = await supabase.rpc(
        "grade_activity_submission",
        {
          p_submission_id:
            submission.id,
          p_score: numericScore,
          p_feedback:
            feedback[
              submission.student_id
            ]?.trim() || null,
        },
      );

      if (gradeError) {
        console.error(
          "Submission grading failed:",
          gradeError,
        );

        throw gradeError;
      }

      console.log(
        "Submission grading result:",
        data,
      );

      const studentName =
        studentById.get(
          submission.student_id,
        )?.full_name || "Student";

      setSuccess(
        `${studentName} graded successfully.`,
      );

      await loadData();
    } catch (gradeError) {
      setError(
        gradeError.message ||
        "Unable to save the student's grade.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function gradeQuizAttempt(attempt) {
    const payload = [];

    for (const answer of attempt.answers) {
      const value = answerScores[answer.id];
      const maximum = Number(answer.question?.points || 0);
      if (
        value === "" ||
        value === undefined ||
        Number(value) < 0 ||
        Number(value) > maximum
      ) {
        setError(
          `Every answer needs a score from 0 to its maximum points.`,
        );
        return;
      }
      payload.push({
        answer_id: answer.id,
        points_awarded: Number(value),
        feedback: answerFeedback[answer.id] || null,
      });
    }

    setSavingId(attempt.id);
    setError("");
    setSuccess("");

    const { error: gradeError } = await supabase.rpc(
      "grade_quiz_attempt",
      {
        p_attempt_id: attempt.id,
        p_answer_scores: payload,
        p_feedback: null,
      },
    );

    if (gradeError) setError(gradeError.message);
    else {
      setSuccess("Quiz attempt graded successfully.");
      await loadData();
    }
    setSavingId(null);
  }

  const submittedCount = isQuiz
    ? attempts.length
    : submissions.length;

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" />
        Back to Activities
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {isQuiz ? "Quiz Attempts" : "Activity Submissions"}
          </p>
          <h2 className="text-xl font-bold text-gray-900">
            {activity.title}
          </h2>
          <p className="text-sm text-gray-500">
            {submittedCount} of {students.length} students submitted · {Number(activity.points)} points
          </p>
        </div>
        <button type="button" onClick={loadData} disabled={loading} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">Loading submissions...</div>
      ) : isQuiz ? (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const student = studentById.get(attempt.student_id);
            return (
              <section key={attempt.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <StudentName student={student} />
                  <div className="text-right text-xs text-gray-500">
                    <p className="font-medium capitalize text-gray-700">{attempt.status}{attempt.is_late ? " · Late" : ""}</p>
                    <p>{formatDate(attempt.submitted_at)}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {attempt.answers.map((answer, index) => (
                    <div key={answer.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900">{index + 1}. {answer.question?.question_text}</p>
                      <p className="mt-2 text-sm text-gray-600"><span className="font-medium">Answer:</span> {answer.answer || "No answer"}</p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[140px_minmax(0,1fr)]">
                        <label className="text-xs font-medium text-gray-600">
                          Points
                          <div className="mt-1 flex items-center gap-1">
                            <input type="number" min="0" max={answer.question?.points} step="0.01" value={answerScores[answer.id] ?? ""} onChange={(event) => setAnswerScores((current) => ({ ...current, [answer.id]: event.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-blue-400" />
                            <span className="text-gray-400">/{Number(answer.question?.points || 0)}</span>
                          </div>
                        </label>
                        <label className="text-xs font-medium text-gray-600">
                          Feedback
                          <input value={answerFeedback[answer.id] ?? ""} onChange={(event) => setAnswerFeedback((current) => ({ ...current, [answer.id]: event.target.value }))} placeholder="Optional feedback" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 outline-none focus:border-blue-400" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Current score: {attempt.score ?? "Not graded"} / {Number(activity.points)}</p>
                  <button type="button" onClick={() => gradeQuizAttempt(attempt)} disabled={savingId === attempt.id} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" />{savingId === attempt.id ? "Saving..." : "Save Grade"}</button>
                </div>
              </section>
            );
          })}
          {attempts.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">No quiz attempts yet.</div>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[1100px] text-sm">
            <thead><tr className="bg-gray-50 text-left text-gray-500"><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Submission</th><th className="px-4 py-3 font-medium">Score</th><th className="px-4 py-3 font-medium">Feedback</th><th className="px-4 py-3 font-medium text-right">Action</th></tr></thead>
            <tbody>
              {students.map((student) => {
                const submission = submissionByStudent.get(student.student_id);
                return (
                  <tr key={student.student_id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-4"><StudentName student={student} /></td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${submission?.status === "graded" ? "bg-green-100 text-green-700" : submission?.status === "late" ? "bg-orange-100 text-orange-700" : submission ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{submission?.status || "Missing"}</span>{submission && <p className="mt-2 text-xs text-gray-400">{formatDate(submission.submitted_at)}</p>}</td>
                    <td className="max-w-[300px] px-4 py-4">{submission?.text_answer && <p className="mb-2 whitespace-pre-wrap text-sm text-gray-600">{submission.text_answer}</p>}{submission?.file_path && <button type="button" onClick={() => downloadSubmission(submission)} disabled={downloadingId === submission.id} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"><Download className="h-4 w-4" />{submission.file_name || "Download file"}</button>}{!submission && <span className="text-gray-400">No submission</span>}</td>
                    <td className="px-4 py-4"><div className="flex w-28 items-center gap-1"><input type="number" min="0" max={activity.points} step="0.01" disabled={!submission} value={scores[student.student_id] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [student.student_id]: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-center outline-none focus:border-blue-400 disabled:bg-gray-50" /><span className="text-xs text-gray-400">/{Number(activity.points)}</span></div></td>
                    <td className="px-4 py-4"><textarea disabled={!submission} value={feedback[student.student_id] ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [student.student_id]: event.target.value }))} placeholder="Teacher feedback" className="min-h-20 w-56 resize-y rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400 disabled:bg-gray-50" /></td>
                    <td className="px-4 py-4 text-right"><button type="button" onClick={() => gradeSubmission(submission)} disabled={!submission || savingId === submission?.id} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />{savingId === submission?.id ? "Saving..." : "Grade"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && students.length === 0 && <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-center"><div><Users className="mx-auto h-9 w-9 text-gray-300" /><p className="mt-3 text-gray-500">No students in this class section.</p></div></div>}
    </div>
  );
}
