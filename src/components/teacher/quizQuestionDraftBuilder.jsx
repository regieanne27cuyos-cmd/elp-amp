import {
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100";

function createClientId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function createEmptyQuizQuestion() {
  return {
    client_id: createClientId(),
    question_type: "multiple_choice",
    question_text: "",
    points: "1",
    options: ["", "", "", ""],
    correct_answer: "",
    case_sensitive: false,
  };
}

export function prepareQuizQuestions(questions) {
  if (questions.length === 0) {
    throw new Error("Add at least one question to the quiz.");
  }

  return questions.map((question, index) => {
    const questionNumber = index + 1;
    const questionText = question.question_text.trim();
    const points = Number(question.points);

    if (!questionText || !Number.isFinite(points) || points <= 0) {
      throw new Error(
        `Question ${questionNumber} needs question text and valid points.`,
      );
    }

    let options = [];
    let correctAnswer = null;

    if (question.question_type === "multiple_choice") {
      options = question.options
        .map((option) => option.trim())
        .filter(Boolean);

      if (options.length < 2) {
        throw new Error(
          `Question ${questionNumber} needs at least two choices.`,
        );
      }

      if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
        throw new Error(
          `Question ${questionNumber} contains duplicate choices.`,
        );
      }

      correctAnswer = question.correct_answer.trim();
      if (!correctAnswer || !options.includes(correctAnswer)) {
        throw new Error(
          `Select a valid correct answer for question ${questionNumber}.`,
        );
      }
    } else if (question.question_type === "true_false") {
      options = ["True", "False"];
      correctAnswer = question.correct_answer;
      if (!["True", "False"].includes(correctAnswer)) {
        throw new Error(
          `Select True or False for question ${questionNumber}.`,
        );
      }
    }

    return {
      question_type: question.question_type,
      question_text: questionText,
      points,
      options,
      correct_answer: correctAnswer,
      case_sensitive: Boolean(question.case_sensitive),
      position: questionNumber,
    };
  });
}

function QuestionEditor({
  question,
  index,
  questionCount,
  disabled,
  onUpdate,
  onRemove,
}) {
  const cleanedOptions = question.options
    .map((option) => option.trim())
    .filter(Boolean);

  function updateType(questionType) {
    onUpdate({
      ...question,
      question_type: questionType,
      options:
        questionType === "multiple_choice"
          ? question.options.length >= 2
            ? question.options
            : ["", "", "", ""]
          : questionType === "true_false"
            ? ["True", "False"]
            : [],
      correct_answer:
        questionType === "true_false" ? "" : "",
    });
  }

  function updateOption(optionIndex, value) {
    const previousValue = question.options[optionIndex];
    const options = question.options.map((option, currentIndex) =>
      currentIndex === optionIndex ? value : option,
    );

    onUpdate({
      ...question,
      options,
      correct_answer:
        question.correct_answer === previousValue
          ? value
          : question.correct_answer,
    });
  }

  function removeOption(optionIndex) {
    const removedOption = question.options[optionIndex];
    onUpdate({
      ...question,
      options: question.options.filter(
        (_, currentIndex) => currentIndex !== optionIndex,
      ),
      correct_answer:
        question.correct_answer === removedOption
          ? ""
          : question.correct_answer,
    });
  }

  return (
    <article className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
            {index + 1}
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Question {index + 1}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || questionCount === 1}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Remove question ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_130px]">
        <label className="block text-sm font-medium text-gray-700">
          Question type
          <select
            className={`${inputClass} mt-1.5`}
            value={question.question_type}
            onChange={(event) => updateType(event.target.value)}
            disabled={disabled}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True or False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Points
          <input
            className={`${inputClass} mt-1.5`}
            type="number"
            min="0.01"
            step="0.01"
            value={question.points}
            onChange={(event) =>
              onUpdate({ ...question, points: event.target.value })
            }
            disabled={disabled}
            required
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Question
        <textarea
          className={`${inputClass} mt-1.5 min-h-24 resize-y`}
          value={question.question_text}
          onChange={(event) =>
            onUpdate({
              ...question,
              question_text: event.target.value,
            })
          }
          placeholder="Enter the question..."
          disabled={disabled}
          required
        />
      </label>

      {question.question_type === "multiple_choice" && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">Choices</p>
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  ...question,
                  options: [...question.options, ""],
                })
              }
              disabled={disabled || question.options.length >= 8}
              className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:underline disabled:text-gray-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add choice
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={option}
                  onChange={(event) =>
                    updateOption(optionIndex, event.target.value)
                  }
                  placeholder={`Choice ${optionIndex + 1}`}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => removeOption(optionIndex)}
                  disabled={disabled || question.options.length <= 2}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label={`Remove choice ${optionIndex + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-gray-700">
            Correct answer
            <select
              className={`${inputClass} mt-1.5`}
              value={question.correct_answer}
              onChange={(event) =>
                onUpdate({
                  ...question,
                  correct_answer: event.target.value,
                })
              }
              disabled={disabled}
              required
            >
              <option value="">Select the correct answer</option>
              {cleanedOptions.map((option, optionIndex) => (
                <option key={`${option}-${optionIndex}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {question.question_type === "true_false" && (
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Correct answer
          <select
            className={`${inputClass} mt-1.5`}
            value={question.correct_answer}
            onChange={(event) =>
              onUpdate({
                ...question,
                correct_answer: event.target.value,
              })
            }
            disabled={disabled}
            required
          >
            <option value="">Select the correct answer</option>
            <option value="True">True</option>
            <option value="False">False</option>
          </select>
        </label>
      )}

      {question.question_type === "short_answer" && (
        <div className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
          Short answers will be checked and scored manually by the teacher.
        </div>
      )}
    </article>
  );
}

export default function QuizQuestionDraftBuilder({
  questions,
  onChange,
  disabled = false,
  error = "",
}) {
  const totalPoints = questions.reduce(
    (total, question) => total + (Number(question.points) || 0),
    0,
  );

  function updateQuestion(index, updatedQuestion) {
    onChange(
      questions.map((question, questionIndex) =>
        questionIndex === index ? updatedQuestion : question,
      ),
    );
  }

  function removeQuestion(index) {
    onChange(
      questions.filter((_, questionIndex) => questionIndex !== index),
    );
  }

  return (
    <section className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Quiz Questions</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {questions.length} question{questions.length === 1 ? "" : "s"}
            {" · "}
            {totalPoints} total point{totalPoints === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange([...questions, createEmptyQuizQuestion()])}
          disabled={disabled}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {questions.map((question, index) => (
          <QuestionEditor
            key={question.client_id}
            question={question}
            index={index}
            questionCount={questions.length}
            disabled={disabled}
            onUpdate={(updatedQuestion) =>
              updateQuestion(index, updatedQuestion)
            }
            onRemove={() => removeQuestion(index)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-purple-700">
        <CheckCircle2 className="h-4 w-4" />
        The quiz maximum points will be calculated from the question points.
      </div>
    </section>
  );
}
