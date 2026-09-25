import { useEffect, useMemo, useState } from "react";
import {
    BarChart3,
    RefreshCw,
    Save,
    Settings2,
    Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const periods = [
    { value: 1, label: "1st Grading" },
    { value: 2, label: "2nd Grading" },
    { value: 3, label: "3rd Grading" },
    { value: 4, label: "4th Grading" },
];

function activityKey(activityId, studentId) {
    return `${activityId}:${studentId}`;
}

function examKey(period, studentId) {
    return `${period}:${studentId}`;
}

function defaultExamSettings() {
    return {
        1: { title: "Quarterly Exam", points: "100" },
        2: { title: "Quarterly Exam", points: "100" },
        3: { title: "Quarterly Exam", points: "100" },
        4: { title: "Quarterly Exam", points: "100" },
    };
}

function initials(name) {
    return String(name || "S")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function activityType(value) {
    if (value === "performance_task") return "Performance Task";
    if (value === "quiz") return "Quiz";
    return "Assignment";
}

function StudentCell({ student }) {
    return (
        <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {initials(student.full_name)}
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                    {student.full_name || "Unnamed student"}
                </p>
                <p className="truncate text-xs text-gray-400">
                    {student.student_number || "No student number"}
                </p>
            </div>
        </div>
    );
}

export default function TeacherGradebookTab({
    classRecord,
    students = [],
    studentsLoading,
    studentsError,
    onRetryStudents,
}) {
    const [period, setPeriod] = useState(1);
    const [activities, setActivities] = useState([]);
    const [activityRecords, setActivityRecords] = useState([]);
    const [activityValues, setActivityValues] = useState({});
    const [exams, setExams] = useState([]);
    const [examRecords, setExamRecords] = useState([]);
    const [examValues, setExamValues] = useState({});
    const [examSettings, setExamSettings] = useState(defaultExamSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadGradebook() {
        if (!classRecord?.id) return;

        setLoading(true);
        setError("");

        try {
            const [activitiesResult, examsResult] = await Promise.all([
                supabase
                    .from("class_activities")
                    .select(
                        "id, activity_type, title, points, grading_period, status, due_at",
                    )
                    .eq("teaching_assignment_id", classRecord.id)
                    .order("due_at", { ascending: true }),
                supabase
                    .from("grading_exams")
                    .select(
                        "id, teaching_assignment_id, grading_period, title, points",
                    )
                    .eq("teaching_assignment_id", classRecord.id),
            ]);

            if (activitiesResult.error) throw activitiesResult.error;
            if (examsResult.error) throw examsResult.error;

            const loadedActivities = activitiesResult.data || [];
            const loadedExams = examsResult.data || [];
            let loadedActivityRecords = [];
            let loadedExamRecords = [];

            if (loadedActivities.length > 0) {
                const { data, error: scoresError } = await supabase
                    .from("activity_scores")
                    .select("id, activity_id, student_id, score")
                    .in(
                        "activity_id",
                        loadedActivities.map((activity) => activity.id),
                    );
                if (scoresError) throw scoresError;
                loadedActivityRecords = data || [];
            }

            if (loadedExams.length > 0) {
                const { data, error: examScoresError } = await supabase
                    .from("grading_exam_scores")
                    .select("id, grading_exam_id, student_id, score")
                    .in(
                        "grading_exam_id",
                        loadedExams.map((exam) => exam.id),
                    );
                if (examScoresError) throw examScoresError;
                loadedExamRecords = data || [];
            }

            const loadedActivityValues = {};
            loadedActivityRecords.forEach((record) => {
                loadedActivityValues[
                    activityKey(record.activity_id, record.student_id)
                ] = String(record.score);
            });

            const loadedExamValues = {};
            loadedExamRecords.forEach((record) => {
                const exam = loadedExams.find(
                    (item) => item.id === record.grading_exam_id,
                );
                if (exam) {
                    loadedExamValues[
                        examKey(exam.grading_period, record.student_id)
                    ] = String(record.score);
                }
            });

            const settings = defaultExamSettings();
            loadedExams.forEach((exam) => {
                settings[Number(exam.grading_period)] = {
                    title: exam.title,
                    points: String(exam.points),
                };
            });

            setActivities(loadedActivities);
            setActivityRecords(loadedActivityRecords);
            setActivityValues(loadedActivityValues);
            setExams(loadedExams);
            setExamRecords(loadedExamRecords);
            setExamValues(loadedExamValues);
            setExamSettings(settings);
        } catch (loadError) {
            console.error("Failed to load gradebook:", loadError);
            setError(
                loadError.message || "Unable to load the gradebook.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setPeriod(1);
        loadGradebook();
    }, [classRecord?.id]);

    const periodActivities = useMemo(
        () =>
            activities.filter(
                (activity) =>
                    Number(activity.grading_period) === period,
            ),
        [activities, period],
    );

    const periodCounts = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        activities.forEach((activity) => {
            const itemPeriod = Number(activity.grading_period);
            if (counts[itemPeriod] !== undefined) {
                counts[itemPeriod] += 1;
            }
        });
        return counts;
    }, [activities]);

    const currentExam = exams.find(
        (exam) => Number(exam.grading_period) === period,
    );
    const currentExamSettings = examSettings[period];
    const examPoints = Number(currentExamSettings.points) || 0;
    const activityPossible = periodActivities.reduce(
        (total, activity) => total + Number(activity.points),
        0,
    );
    const totalPossible = activityPossible + examPoints;

    function updateExamSetting(field, value) {
        setExamSettings((current) => ({
            ...current,
            [period]: {
                ...current[period],
                [field]: value,
            },
        }));
        setSuccess("");
    }

    function studentTotal(studentId) {
        const activityTotal = periodActivities.reduce(
            (total, activity) => {
                const value =
                    activityValues[
                    activityKey(activity.id, studentId)
                    ];
                return value === "" || value === undefined
                    ? total
                    : total + Number(value);
            },
            0,
        );
        const examValue = examValues[examKey(period, studentId)];
        return (
            activityTotal +
            (examValue === "" || examValue === undefined
                ? 0
                : Number(examValue))
        );
    }

    function isComplete(studentId) {
        const activitiesComplete = periodActivities.every(
            (activity) => {
                const value =
                    activityValues[
                    activityKey(activity.id, studentId)
                    ];
                return value !== "" && value !== undefined;
            },
        );
        const examValue = examValues[examKey(period, studentId)];
        return (
            activitiesComplete &&
            examValue !== "" &&
            examValue !== undefined
        );
    }

    function percentage(studentId) {
        if (!isComplete(studentId) || totalPossible <= 0) return null;
        return (studentTotal(studentId) / totalPossible) * 100;
    }

    function validateScores() {
        if (!currentExamSettings.title.trim()) {
            throw new Error("Enter an exam title.");
        }
        if (examPoints <= 0) {
            throw new Error("Exam maximum points must be greater than zero.");
        }

        for (const student of students) {
            for (const activity of periodActivities) {
                const value =
                    activityValues[
                    activityKey(activity.id, student.student_id)
                    ];
                if (
                    value !== "" &&
                    value !== undefined &&
                    (Number(value) < 0 ||
                        Number(value) > Number(activity.points))
                ) {
                    throw new Error(
                        `${student.full_name}'s score for ${activity.title} must be between 0 and ${activity.points}.`,
                    );
                }
            }

            const examValue =
                examValues[examKey(period, student.student_id)];
            if (
                examValue !== "" &&
                examValue !== undefined &&
                (Number(examValue) < 0 ||
                    Number(examValue) > examPoints)
            ) {
                throw new Error(
                    `${student.full_name}'s exam score must be between 0 and ${examPoints}.`,
                );
            }
        }
    }

    async function saveScores() {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            validateScores();

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error(
                    "Your session has expired. Please sign in again.",
                );
            }

            const { data: savedExam, error: examError } =
                await supabase
                    .from("grading_exams")
                    .upsert(
                        {
                            teaching_assignment_id: classRecord.id,
                            grading_period: period,
                            title: currentExamSettings.title.trim(),
                            points: examPoints,
                            created_by: user.id,
                            updated_at: new Date().toISOString(),
                        },
                        {
                            onConflict:
                                "teaching_assignment_id,grading_period",
                        },
                    )
                    .select()
                    .single();
            if (examError) throw examError;

            const activityIds = new Set(
                periodActivities.map((activity) => activity.id),
            );
            const activityRows = [];

            periodActivities.forEach((activity) => {
                students.forEach((student) => {
                    const value =
                        activityValues[
                        activityKey(activity.id, student.student_id)
                        ];
                    if (value !== "" && value !== undefined) {
                        activityRows.push({
                            activity_id: activity.id,
                            student_id: student.student_id,
                            score: Number(value),
                            graded_by: user.id,
                        });
                    }
                });
            });

            const activityDeleteIds = activityRecords
                .filter(
                    (record) =>
                        activityIds.has(record.activity_id) &&
                        (activityValues[
                            activityKey(record.activity_id, record.student_id)
                        ] === "" ||
                            activityValues[
                            activityKey(record.activity_id, record.student_id)
                            ] === undefined),
                )
                .map((record) => record.id);

            if (activityDeleteIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from("activity_scores")
                    .delete()
                    .in("id", activityDeleteIds);
                if (deleteError) throw deleteError;
            }

            if (activityRows.length > 0) {
                const { error: activityUpsertError } = await supabase
                    .from("activity_scores")
                    .upsert(activityRows, {
                        onConflict: "activity_id,student_id",
                    });
                if (activityUpsertError) throw activityUpsertError;
            }

            const examRows = students.flatMap((student) => {
                const value =
                    examValues[examKey(period, student.student_id)];
                return value === "" || value === undefined
                    ? []
                    : [
                        {
                            grading_exam_id: savedExam.id,
                            student_id: student.student_id,
                            score: Number(value),
                            graded_by: user.id,
                        },
                    ];
            });

            const oldExamId = currentExam?.id || savedExam.id;
            const examDeleteIds = examRecords
                .filter(
                    (record) =>
                        record.grading_exam_id === oldExamId &&
                        (examValues[
                            examKey(period, record.student_id)
                        ] === "" ||
                            examValues[
                            examKey(period, record.student_id)
                            ] === undefined),
                )
                .map((record) => record.id);

            if (examDeleteIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from("grading_exam_scores")
                    .delete()
                    .in("id", examDeleteIds);
                if (deleteError) throw deleteError;
            }

            if (examRows.length > 0) {
                const { error: examScoresError } = await supabase
                    .from("grading_exam_scores")
                    .upsert(examRows, {
                        onConflict: "grading_exam_id,student_id",
                    });
                if (examScoresError) throw examScoresError;
            }

            await loadGradebook();
            setSuccess(
                `${periods[period - 1].label} activity and exam scores saved.`,
            );
        } catch (saveError) {
            console.error("Failed to save gradebook:", saveError);
            setError(
                saveError.message || "Unable to save the gradebook.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (studentsLoading || loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-gray-400">
                Loading gradebook...
            </div>
        );
    }

    if (studentsError) {
        return (
            <div className="p-5">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    <p>{studentsError}</p>
                    <button
                        type="button"
                        onClick={onRetryStudents}
                        className="mt-3 font-medium hover:underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-gray-900">
                        Class Gradebook
                    </h2>
                    <p className="text-sm text-gray-500">
                        Record activity and examination scores per grading period.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={loadGradebook}
                        disabled={saving}
                        className="rounded-lg border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        aria-label="Refresh gradebook"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={saveScores}
                        disabled={saving || students.length === 0}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Gradebook"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <div
                role="tablist"
                className="flex overflow-x-auto border-b border-gray-200"
            >
                {periods.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        role="tab"
                        aria-selected={period === item.value}
                        onClick={() => {
                            setPeriod(item.value);
                            setError("");
                            setSuccess("");
                        }}
                        className={`flex min-w-fit items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium ${period === item.value
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                            }`}
                    >
                        {item.label}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {periodCounts[item.value]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">
                        {periods[period - 1].label} Examination
                    </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-purple-800">
                            Exam title
                        </label>
                        <input
                            value={currentExamSettings.title}
                            onChange={(event) =>
                                updateExamSetting("title", event.target.value)
                            }
                            placeholder="Quarterly Exam"
                            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-purple-800">
                            Maximum points
                        </label>
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={currentExamSettings.points}
                            onChange={(event) =>
                                updateExamSetting("points", event.target.value)
                            }
                            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                    <div>
                        <Users className="mx-auto h-9 w-9 text-gray-300" />
                        <p className="mt-3 font-medium text-gray-700">
                            No students in this section
                        </p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table
                        className="w-full text-sm"
                        style={{
                            minWidth: `${520 + periodActivities.length * 150}px`,
                        }}
                    >
                        <thead>
                            <tr className="bg-gray-50 text-left text-gray-500">
                                <th className="sticky left-0 z-10 min-w-[250px] bg-gray-50 px-4 py-3 font-medium">
                                    Student
                                </th>
                                {periodActivities.map((activity) => (
                                    <th
                                        key={activity.id}
                                        className="min-w-[150px] px-3 py-3 text-center font-medium"
                                    >
                                        <p className="line-clamp-2 text-gray-700">
                                            {activity.title}
                                        </p>
                                        <p className="mt-1 text-xs font-normal text-gray-400">
                                            {activityType(activity.activity_type)} ·{" "}
                                            {Number(activity.points)} pts
                                        </p>
                                    </th>
                                ))}
                                <th className="min-w-[170px] bg-purple-50 px-3 py-3 text-center font-medium text-purple-800">
                                    <p className="line-clamp-2">
                                        {currentExamSettings.title || "Examination"}
                                    </p>
                                    <p className="mt-1 text-xs font-normal text-purple-500">
                                        Exam · {examPoints || 0} pts
                                    </p>
                                </th>
                                <th className="min-w-[130px] px-3 py-3 text-center font-medium">
                                    Total
                                </th>
                                <th className="min-w-[120px] px-3 py-3 text-center font-medium">
                                    Raw %
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => {
                                const total = studentTotal(student.student_id);
                                const rawPercentage = percentage(student.student_id);

                                return (
                                    <tr
                                        key={student.student_id}
                                        className="border-t border-gray-100"
                                    >
                                        <td className="sticky left-0 z-10 bg-white px-4 py-3">
                                            <StudentCell student={student} />
                                        </td>
                                        {periodActivities.map((activity) => {
                                            const key = activityKey(
                                                activity.id,
                                                student.student_id,
                                            );
                                            return (
                                                <td
                                                    key={activity.id}
                                                    className="px-3 py-3 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-[110px] items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={activity.points}
                                                            step="0.01"
                                                            value={activityValues[key] ?? ""}
                                                            onChange={(event) => {
                                                                setActivityValues((current) => ({
                                                                    ...current,
                                                                    [key]: event.target.value,
                                                                }));
                                                                setSuccess("");
                                                            }}
                                                            aria-label={`${student.full_name} score for ${activity.title}`}
                                                            className="w-full rounded-lg border border-gray-200 px-2 py-2 text-center outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                        />
                                                        <span className="text-xs text-gray-400">
                                                            /{Number(activity.points)}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="bg-purple-50/50 px-3 py-3 text-center">
                                            <div className="mx-auto flex max-w-[125px] items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={examPoints || undefined}
                                                    step="0.01"
                                                    value={
                                                        examValues[
                                                        examKey(period, student.student_id)
                                                        ] ?? ""
                                                    }
                                                    onChange={(event) => {
                                                        const key = examKey(
                                                            period,
                                                            student.student_id,
                                                        );
                                                        setExamValues((current) => ({
                                                            ...current,
                                                            [key]: event.target.value,
                                                        }));
                                                        setSuccess("");
                                                    }}
                                                    aria-label={`${student.full_name} examination score`}
                                                    className="w-full rounded-lg border border-purple-200 bg-white px-2 py-2 text-center outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                                                />
                                                <span className="text-xs text-purple-500">
                                                    /{examPoints || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-semibold text-gray-700">
                                            {total.toFixed(2)} / {totalPossible.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rawPercentage === null
                                                        ? "bg-gray-100 text-gray-500"
                                                        : "bg-blue-50 text-blue-700"
                                                    }`}
                                            >
                                                {rawPercentage === null
                                                    ? "Incomplete"
                                                    : `${rawPercentage.toFixed(2)}%`}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {periodActivities.length === 0 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    No activities are assigned to {periods[period - 1].label} yet. You can still record the examination scores.
                </div>
            )}

            <p className="text-xs text-gray-400">
                Raw percentage includes all activity points and the examination points. It appears after all score entries for a student are completed. No grade transmutation is applied.
            </p>
        </div>
    );
}
