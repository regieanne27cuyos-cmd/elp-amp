import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    Send,
    Upload,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedExtensions = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

function safeName(name) {
    return String(name || "submission")
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-");
}

function validateFile(file) {
    if (!file) return "";
    const extension = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
        return "Upload a PDF, DOC, DOCX, PNG, JPG, or JPEG file.";
    }
    if (file.size > MAX_FILE_SIZE) {
        return "The file must not exceed 20 MB.";
    }
    return "";
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

export default function StudentActivityWork({ activity, onBack }) {
    const isQuiz = activity.activity_type === "quiz";
    const [submission, setSubmission] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [textAnswer, setTextAnswer] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadWork() {
        setLoading(true);
        setError("");

        try {
            if (isQuiz) {
                const [questionResult, attemptResult] = await Promise.all([
                    supabase
                        .from("quiz_questions")
                        .select("id, question_type, question_text, options, points, position")
                        .eq("activity_id", activity.id)
                        .order("position"),
                    supabase
                        .from("quiz_attempts")
                        .select("id, status, is_late, score, teacher_feedback, submitted_at, graded_at")
                        .eq("activity_id", activity.id)
                        .maybeSingle(),
                ]);
                if (questionResult.error) throw questionResult.error;
                if (attemptResult.error) throw attemptResult.error;
                setQuestions(questionResult.data || []);
                setAttempt(attemptResult.data || null);
            } else {
                const { data, error: submissionError } = await supabase
                    .from("activity_submissions")
                    .select("*")
                    .eq("activity_id", activity.id)
                    .maybeSingle();
                if (submissionError) throw submissionError;
                setSubmission(data || null);
                setTextAnswer(data?.text_answer || "");
            }
        } catch (loadError) {
            console.error("Failed to load activity work:", loadError);
            setError(loadError.message || "Unable to load this activity.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadWork();
    }, [activity.id]);

    function chooseFile(event) {
        const selected = event.target.files?.[0] || null;
        const validationError = validateFile(selected);
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
        if (!textAnswer.trim() && !file && !submission?.file_path) {
            setError("Enter a response or upload a file.");
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
            if (userError || !user) throw new Error("Please sign in again.");

            let fileData = {
                path: submission?.file_path || null,
                name: submission?.file_name || null,
                type: submission?.file_type || null,
                size: submission?.file_size || null,
            };

            if (file) {
                const uniqueId = globalThis.crypto?.randomUUID?.() || Date.now();
                uploadedPath = `${activity.id}/${user.id}/${uniqueId}-${safeName(file.name)}`;
                const { error: uploadError } = await supabase.storage
                    .from("student-submissions")
                    .upload(uploadedPath, file, {
                        contentType: file.type || "application/octet-stream",
                        upsert: false,
                    });
                if (uploadError) throw uploadError;
                fileData = {
                    path: uploadedPath,
                    name: file.name,
                    type: file.type || "application/octet-stream",
                    size: file.size,
                };
            }

            const { data, error: submitError } = await supabase.rpc(
                "save_activity_submission",
                {
                    p_activity_id: activity.id,
                    p_text_answer: textAnswer.trim() || null,
                    p_file_path: fileData.path,
                    p_file_name: fileData.name,
                    p_file_type: fileData.type,
                    p_file_size: fileData.size,
                },
            );
            if (submitError) throw submitError;

            if (
                submission?.file_path &&
                uploadedPath &&
                submission.file_path !== uploadedPath
            ) {
                await supabase.storage
                    .from("student-submissions")
                    .remove([submission.file_path]);
            }

            setSubmission(data);
            setFile(null);
            setSuccess("Your work was submitted successfully.");
        } catch (submitError) {
            if (uploadedPath) {
                await supabase.storage
                    .from("student-submissions")
                    .remove([uploadedPath]);
            }
            setError(submitError.message || "Unable to submit your work.");
        } finally {
            setSaving(false);
        }
    }

    async function submitQuiz(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = questions.map((question) => ({
                question_id: question.id,
                answer: answers[question.id] || null,
            }));
            const { data, error: submitError } = await supabase.rpc(
                "submit_quiz_attempt",
                {
                    p_activity_id: activity.id,
                    p_answers: payload,
                },
            );
            if (submitError) throw submitError;
            setAttempt(data);
            setSuccess(
                data.status === "graded"
                    ? "Quiz submitted and checked."
                    : "Quiz submitted for teacher checking.",
            );
        } catch (submitError) {
            setError(submitError.message || "Unable to submit the quiz.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-10 text-center text-sm text-gray-400">Loading activity...</div>;
    }

    const locked = submission?.status === "graded";
    const quizSubmitted = attempt && ["submitted", "graded"].includes(attempt.status);

    return (
        <div className="space-y-5">
            {onBack && <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Back to Activities</button>}

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium capitalize text-blue-600">{activity.activity_type.replaceAll("_", " ")}</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900">{activity.title}</h1>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-500">{activity.instructions || "Follow the teacher's instructions."}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500"><span>Due: {formatDate(activity.due_at)}</span><span>{Number(activity.points)} points</span></div>
            </section>

            {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

            {isQuiz ? (
                quizSubmitted ? (
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-green-600" /><h2 className="mt-3 text-lg font-bold text-green-900">Quiz submitted</h2><p className="mt-1 text-sm text-green-700">Status: {attempt.status}{attempt.is_late ? " · Late" : ""}</p>{attempt.status === "graded" && <p className="mt-3 text-xl font-bold text-green-800">Score: {attempt.score} / {Number(activity.points)}</p>}</div>
                ) : (
                    <form onSubmit={submitQuiz} className="space-y-4">
                        {questions.map((question, index) => (
                            <section key={question.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4"><h2 className="font-semibold text-gray-900">{index + 1}. {question.question_text}</h2><span className="shrink-0 text-xs text-gray-400">{Number(question.points)} pts</span></div>
                                {question.question_type === "multiple_choice" && <div className="mt-4 space-y-2">{(question.options || []).map((option) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${answers[question.id] === option ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />{option}</label>)}</div>}
                                {question.question_type === "true_false" && <div className="mt-4 flex gap-3">{["True", "False"].map((option) => <label key={option} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm ${answers[question.id] === option ? "border-blue-300 bg-blue-50" : "border-gray-100"}`}><input type="radio" name={question.id} value={option} checked={answers[question.id] === option} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />{option}</label>)}</div>}
                                {question.question_type === "short_answer" && <textarea value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Enter your answer" className={`${inputClass} mt-4 min-h-24 resize-y`} />}
                            </section>
                        ))}
                        {questions.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">This quiz has no questions yet.</div> : <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Send className="h-4 w-4" />{saving ? "Submitting..." : "Submit Quiz"}</button>}
                    </form>
                )
            ) : (
                <form onSubmit={submitActivity} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    {submission && <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">Status: <span className="font-semibold capitalize">{submission.status}</span> · Submitted {formatDate(submission.submitted_at)}</div>}
                    <label className="block text-sm font-medium text-gray-700">Written response<textarea disabled={locked} value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} placeholder="Enter your response here..." className={`${inputClass} mt-1.5 min-h-36 resize-y disabled:bg-gray-100`} /></label>
                    <div><p className="mb-1.5 text-sm font-medium text-gray-700">Upload file</p>{submission?.file_name && !file && <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600"><FileText className="h-4 w-4" />Current file: {submission.file_name}</div>}<label className={`flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm font-medium ${locked ? "cursor-not-allowed bg-gray-100 text-gray-400" : "cursor-pointer text-blue-600 hover:bg-blue-50"}`}><Upload className="h-5 w-5" />{file ? file.name : "Choose PDF, Word, or image file"}<input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={chooseFile} disabled={locked} className="sr-only" /></label><p className="mt-1 text-xs text-gray-400">Maximum file size: 20 MB.</p></div>
                    {submission?.teacher_feedback && <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800"><span className="font-semibold">Teacher feedback:</span> {submission.teacher_feedback}</div>}
                    {!locked && <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Send className="h-4 w-4" />{saving ? "Submitting..." : submission ? "Update Submission" : "Submit Activity"}</button>}
                </form>
            )}
        </div>
    );
}
