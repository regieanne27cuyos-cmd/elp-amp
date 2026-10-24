import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

const emptyForm = {
  question_type: "multiple_choice",
  question_text: "",
  points: "1",
  options: ["", "", "", ""],
  correct_answer: "",
  case_sensitive: false,
};

function normalize(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function typeLabel(value) {
  if (value === "true_false") return "True or False";
  if (value === "short_answer") return "Short Answer";
  return "Multiple Choice";
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function TeacherQuizBuilder({ activity, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  async function loadQuestions() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("quiz_questions")
      .select(`
        id,
        activity_id,
        question_type,
        question_text,
        options,
        points,
        position,
        answer_key:quiz_answer_keys!quiz_answer_keys_question_id_fkey (
          correct_answer,
          case_sensitive
        )
      `)
      .eq("activity_id", activity.id)
      .order("position", { ascending: true });

    if (loadError) {
      console.error("Failed to load quiz questions:", loadError);
      setError(loadError.message || "Unable to load quiz questions.");
      setQuestions([]);
    } else {
      setQuestions(
        (data || []).map((question) => ({
          ...question,
          answer_key: normalize(question.answer_key),
        })),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, [activity.id]);

  function openAdd() {
    setSelected(null);
    setForm({ ...emptyForm, options: ["", "", "", ""] });
    setError("");
    setModalMode("add");
  }

  function openEdit(question) {
    const savedOptions = Array.isArray(question.options)
      ? question.options
      : [];
    setSelected(question);
    setForm({
      question_type: question.question_type,
      question_text: question.question_text,
      points: String(question.points),
      options:
        question.question_type === "multiple_choice"
          ? [...savedOptions, "", "", "", ""].slice(0, Math.max(4, savedOptions.length))
          : ["", "", "", ""],
      correct_answer: question.answer_key?.correct_answer || "",
      case_sensitive: question.answer_key?.case_sensitive || false,
    });
    setError("");
    setModalMode("edit");
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateOption(index, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  }

  async function syncQuizPoints(questionList) {
    const total = questionList.reduce(
      (sum, question) => sum + Number(question.points),
      0,
    );
    if (total > 0) {
      const { error: updateError } = await supabase
        .from("class_activities")
        .update({ points: total })
        .eq("id", activity.id);
      if (updateError) throw updateError;
    }
  }

  async function saveQuestion(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const options = form.question_type === "multiple_choice"
        ? form.options.map((option) => option.trim()).filter(Boolean)
        : form.question_type === "true_false"
          ? ["True", "False"]
          : [];

      if (!form.question_text.trim() || Number(form.points) <= 0) {
        throw new Error("Enter the question and its points.");
      }
      if (form.question_type === "multiple_choice" && options.length < 2) {
        throw new Error("A multiple-choice question needs at least two choices.");
      }
      if (
        form.question_type !== "short_answer" &&
        !form.correct_answer.trim()
      ) {
        throw new Error("Select or enter the correct answer.");
      }
      if (
        form.question_type === "multiple_choice" &&
        !options.includes(form.correct_answer.trim())
      ) {
        throw new Error("The correct answer must match one of the choices.");
      }

      const questionPayload = {
        activity_id: activity.id,
        question_type: form.question_type,
        question_text: form.question_text.trim(),
        options,
        points: Number(form.points),
        position: selected?.position || questions.length + 1,
        updated_at: new Date().toISOString(),
      };

      const query = selected
        ? supabase.from("quiz_questions").update(questionPayload).eq("id", selected.id)
        : supabase.from("quiz_questions").insert(questionPayload);
      const { data: savedQuestion, error: questionError } =
        await query.select().single();
      if (questionError) throw questionError;

      if (form.question_type === "short_answer") {
        const { error: keyDeleteError } = await supabase
          .from("quiz_answer_keys")
          .delete()
          .eq("question_id", savedQuestion.id);
        if (keyDeleteError) throw keyDeleteError;
      } else {
        const { error: keyError } = await supabase
          .from("quiz_answer_keys")
          .upsert(
            {
              question_id: savedQuestion.id,
              correct_answer: form.correct_answer.trim(),
              case_sensitive: form.case_sensitive,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "question_id" },
          );
        if (keyError) throw keyError;
      }

      const nextQuestions = selected
        ? questions.map((question) =>
            question.id === savedQuestion.id
              ? savedQuestion
              : question,
          )
        : [...questions, savedQuestion];
      await syncQuizPoints(nextQuestions);
      setModalMode(null);
      setSelected(null);
      await loadQuestions();
    } catch (saveError) {
      console.error("Failed to save quiz question:", saveError);
      setError(saveError.message || "Unable to save the question.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(question) {
    if (!window.confirm("Delete this quiz question?")) return;

    const { error: deleteError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("id", question.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const nextQuestions = questions.filter((item) => item.id !== question.id);
    try {
      await syncQuizPoints(nextQuestions);
      await loadQuestions();
    } catch (syncError) {
      setError(syncError.message);
    }
  }

  const totalPoints = questions.reduce(
    (total, question) => total + Number(question.points),
    0,
  );

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" />Back to Activities
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-purple-600">Quiz Builder</p>
          <h2 className="text-xl font-bold text-gray-900">{activity.title}</h2>
          <p className="text-sm text-gray-500">{questions.length} questions · {totalPoints} total points</p>
        </div>
        <button type="button" onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"><Plus className="h-4 w-4" />Add Question</button>
      </div>

      {error && !modalMode && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-gray-400">Loading quiz questions...</div>
      ) : questions.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-center"><div><HelpCircle className="mx-auto h-10 w-10 text-gray-300" /><h3 className="mt-3 font-semibold text-gray-800">No quiz questions yet</h3><p className="mt-1 text-sm text-gray-500">Add the first question to build this quiz.</p></div></div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{typeLabel(question.question_type)}</span><span className="text-xs text-gray-400">{Number(question.points)} point{Number(question.points) === 1 ? "" : "s"}</span></div>
                  <p className="mt-2 font-medium text-gray-900">{question.question_text}</p>
                  {question.question_type === "multiple_choice" && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{(question.options || []).map((option) => <div key={option} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${option === question.answer_key?.correct_answer ? "border-green-200 bg-green-50 text-green-700" : "border-gray-100 text-gray-600"}`}>{option === question.answer_key?.correct_answer && <CheckCircle2 className="h-4 w-4" />}{option}</div>)}</div>}
                  {question.question_type === "true_false" && <p className="mt-3 text-sm text-green-700">Correct answer: {question.answer_key?.correct_answer}</p>}
                  {question.question_type === "short_answer" && <p className="mt-3 text-sm text-orange-600">Teacher will check this answer manually.</p>}
                </div>
                <div className="flex shrink-0 gap-1"><button type="button" onClick={() => openEdit(question)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-blue-600" aria-label="Edit question"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteQuestion(question)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete question"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalMode && (
        <Modal title={modalMode === "edit" ? "Edit Quiz Question" : "Add Quiz Question"} onClose={() => !saving && setModalMode(null)}>
          <form onSubmit={saveQuestion} className="space-y-4">
            {error && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <label className="block text-sm font-medium text-gray-700">Question type<select className={`${inputClass} mt-1.5`} value={form.question_type} onChange={(event) => update("question_type", event.target.value)}><option value="multiple_choice">Multiple Choice</option><option value="true_false">True or False</option></select></label>
            <label className="block text-sm font-medium text-gray-700">Question<textarea className={`${inputClass} mt-1.5 min-h-24 resize-y`} value={form.question_text} onChange={(event) => update("question_text", event.target.value)} required /></label>
            <label className="block text-sm font-medium text-gray-700">Points<input className={`${inputClass} mt-1.5`} type="number" min="0.01" step="0.01" value={form.points} onChange={(event) => update("points", event.target.value)} required /></label>

            {form.question_type === "multiple_choice" && <div><p className="mb-2 text-sm font-medium text-gray-700">Choices</p><div className="space-y-2">{form.options.map((option, index) => <input key={index} className={inputClass} value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Choice ${index + 1}`} />)}</div><label className="mt-4 block text-sm font-medium text-gray-700">Correct answer<select className={`${inputClass} mt-1.5`} value={form.correct_answer} onChange={(event) => update("correct_answer", event.target.value)} required><option value="">Select correct answer</option>{form.options.filter((option) => option.trim()).map((option) => <option key={option} value={option.trim()}>{option}</option>)}</select></label></div>}
            {form.question_type === "true_false" && <label className="block text-sm font-medium text-gray-700">Correct answer<select className={`${inputClass} mt-1.5`} value={form.correct_answer} onChange={(event) => update("correct_answer", event.target.value)} required><option value="">Select correct answer</option><option value="True">True</option><option value="False">False</option></select></label>}
            {form.question_type !== "short_answer" && <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={form.case_sensitive} onChange={(event) => update("case_sensitive", event.target.checked)} />Case-sensitive checking</label>}

            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalMode(null)} disabled={saving} className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">{saving ? "Saving..." : "Save Question"}</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
