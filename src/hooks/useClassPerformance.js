import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import {
  calculateAttendance,
  calculatePercentage,
  getPerformanceStatus,
  roundNumber,
  safeNumber,
} from "../utils/gradeCalculations";

function activityScoreKey(
  activityId,
  studentId,
) {
  return `${activityId}:${studentId}`;
}

function examScoreKey(
  examId,
  studentId,
) {
  return `${examId}:${studentId}`;
}

function submissionKey(
  activityId,
  studentId,
) {
  return `${activityId}:${studentId}`;
}

function normalizeRecords(data) {
  return Array.isArray(data) ? data : [];
}

export default function useClassPerformance({
  classRecord,
  students = [],
  gradingPeriod = 1,
}) {
  const [activities, setActivities] =
    useState([]);

  const [
    activityScores,
    setActivityScores,
  ] = useState([]);

  const [exams, setExams] =
    useState([]);

  const [examScores, setExamScores] =
    useState([]);

  const [
    attendanceRecords,
    setAttendanceRecords,
  ] = useState([]);

  const [
    activitySubmissions,
    setActivitySubmissions,
  ] = useState([]);

  const [
    quizAttempts,
    setQuizAttempts,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadPerformance =
    useCallback(async () => {
      if (!classRecord?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          activitiesResult,
          examsResult,
          attendanceResult,
        ] = await Promise.all([
          supabase
            .from("class_activities")
            .select(`
              id,
              teaching_assignment_id,
              activity_type,
              title,
              points,
              grading_period,
              status,
              due_at
            `)
            .eq(
              "teaching_assignment_id",
              classRecord.id,
            )
            .order("due_at", {
              ascending: true,
            }),

          supabase
            .from("grading_exams")
            .select(`
              id,
              teaching_assignment_id,
              grading_period,
              title,
              points
            `)
            .eq(
              "teaching_assignment_id",
              classRecord.id,
            ),

          supabase
            .from("attendance_sheets")
            .select(`
              id,
              teaching_assignment_id,
              attendance_date,
              records:attendance_records (
                id,
                student_id,
                status,
                remarks,
                marked_at
              )
            `)
            .eq(
              "teaching_assignment_id",
              classRecord.id,
            ),
        ]);

        if (activitiesResult.error) {
          throw activitiesResult.error;
        }

        if (examsResult.error) {
          throw examsResult.error;
        }

        if (attendanceResult.error) {
          throw attendanceResult.error;
        }

        const loadedActivities =
          activitiesResult.data || [];

        const loadedExams =
          examsResult.data || [];

        const activityIds =
          loadedActivities.map(
            (activity) => activity.id,
          );

        const examIds =
          loadedExams.map(
            (exam) => exam.id,
          );

        let loadedActivityScores = [];
        let loadedExamScores = [];
        let loadedSubmissions = [];
        let loadedAttempts = [];

        if (activityIds.length > 0) {
          const [
            scoresResult,
            submissionsResult,
            attemptsResult,
          ] = await Promise.all([
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

            supabase
              .from(
                "activity_submissions",
              )
              .select(`
  id,
  activity_id,
  student_id,
  status,
  submitted_at
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
                submitted_at
              `)
              .in(
                "activity_id",
                activityIds,
              ),
          ]);

          if (scoresResult.error) {
            throw scoresResult.error;
          }

          if (
            submissionsResult.error
          ) {
            throw submissionsResult.error;
          }

          if (attemptsResult.error) {
            throw attemptsResult.error;
          }

          loadedActivityScores =
            scoresResult.data || [];

          loadedSubmissions =
            submissionsResult.data || [];

          loadedAttempts =
            attemptsResult.data || [];
        }

        if (examIds.length > 0) {
          const {
            data,
            error: examScoreError,
          } = await supabase
            .from(
              "grading_exam_scores",
            )
            .select(`
              id,
              grading_exam_id,
              student_id,
              score
            `)
            .in(
              "grading_exam_id",
              examIds,
            );

          if (examScoreError) {
            throw examScoreError;
          }

          loadedExamScores =
            data || [];
        }

        const flattenedAttendance =
          (attendanceResult.data || [])
            .flatMap((sheet) =>
              normalizeRecords(
                sheet.records,
              ).map((record) => ({
                ...record,
                attendance_sheet_id:
                  sheet.id,
                attendance_date:
                  sheet.attendance_date,
              })),
            );

        setActivities(
          loadedActivities,
        );

        setActivityScores(
          loadedActivityScores,
        );

        setExams(loadedExams);
        setExamScores(loadedExamScores);

        setActivitySubmissions(
          loadedSubmissions,
        );

        setQuizAttempts(
          loadedAttempts,
        );

        setAttendanceRecords(
          flattenedAttendance,
        );
      } catch (loadError) {
        console.error(
          "Failed to load class performance:",
          loadError,
        );

        setError(
          loadError.message ||
          "Unable to load class performance.",
        );
      } finally {
        setLoading(false);
      }
    }, [classRecord?.id]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const performanceStudents =
    useMemo(() => {
      const period = Number(
        gradingPeriod,
      );

      const periodActivities =
        activities.filter(
          (activity) =>
            Number(
              activity.grading_period,
            ) === period,
        );

      const periodExam =
        exams.find(
          (exam) =>
            Number(
              exam.grading_period,
            ) === period,
        ) || null;

      const scoreMap = new Map(
        activityScores.map(
          (record) => [
            activityScoreKey(
              record.activity_id,
              record.student_id,
            ),
            record,
          ],
        ),
      );

      const examScoreMap =
        new Map(
          examScores.map(
            (record) => [
              examScoreKey(
                record.grading_exam_id,
                record.student_id,
              ),
              record,
            ],
          ),
        );

      const submissionMap =
        new Map(
          activitySubmissions.map(
            (submission) => [
              submissionKey(
                submission.activity_id,
                submission.student_id,
              ),
              submission,
            ],
          ),
        );

      const attemptMap = new Map(
        quizAttempts.map(
          (attempt) => [
            submissionKey(
              attempt.activity_id,
              attempt.student_id,
            ),
            attempt,
          ],
        ),
      );

      return students.map(
        (student) => {
          const studentId =
            student.student_id ||
            student.id;

          let earnedActivityPoints = 0;
          let possibleActivityPoints = 0;
          let recordedActivityCount = 0;
          let missingCount = 0;
          let lateSubmissionCount = 0;

          const activityDetails =
            periodActivities.map(
              (activity) => {
                const scoreRecord =
                  scoreMap.get(
                    activityScoreKey(
                      activity.id,
                      studentId,
                    ),
                  );

                const workRecord =
                  activity.activity_type ===
                    "quiz"
                    ? attemptMap.get(
                      submissionKey(
                        activity.id,
                        studentId,
                      ),
                    )
                    : submissionMap.get(
                      submissionKey(
                        activity.id,
                        studentId,
                      ),
                    );

                const hasScore =
                  scoreRecord?.score !==
                  null &&
                  scoreRecord?.score !==
                  undefined;

                const maximumPoints =
                  safeNumber(
                    activity.points,
                  );

                const score = hasScore
                  ? safeNumber(
                    scoreRecord.score,
                  )
                  : null;

                possibleActivityPoints +=
                  maximumPoints;

                if (hasScore) {
                  earnedActivityPoints +=
                    score;

                  recordedActivityCount += 1;
                }

                const due =
                  activity.due_at &&
                  new Date(
                    activity.due_at,
                  ) < new Date();

                const submitted =
                  Boolean(workRecord) ||
                  hasScore;

                const missing =
                  Boolean(due) &&
                  !submitted &&
                  activity.status !==
                  "draft";

                if (missing) {
                  missingCount += 1;
                }

                if (
                  workRecord?.is_late
                ) {
                  lateSubmissionCount += 1;
                }

                return {
                  ...activity,
                  score,
                  hasScore,
                  submitted,
                  missing,
                  isLate:
                    Boolean(
                      workRecord?.is_late,
                    ),
                  submissionStatus:
                    workRecord?.status ||
                    null,
                };
              },
            );

          const examScoreRecord =
            periodExam
              ? examScoreMap.get(
                examScoreKey(
                  periodExam.id,
                  studentId,
                ),
              )
              : null;

          const hasExamScore =
            examScoreRecord?.score !==
            null &&
            examScoreRecord?.score !==
            undefined;

          const examScore =
            hasExamScore
              ? safeNumber(
                examScoreRecord.score,
              )
              : null;

          const examPossible =
            periodExam
              ? safeNumber(
                periodExam.points,
              )
              : 0;

          const activityPercentage =
            possibleActivityPoints > 0
              ? calculatePercentage(
                earnedActivityPoints,
                possibleActivityPoints,
              )
              : null;

          const examPercentage =
            hasExamScore &&
              examPossible > 0
              ? calculatePercentage(
                examScore,
                examPossible,
              )
              : null;

          /*
           * This follows your current
           * Gradebook: total activity
           * points plus examination points.
           * The grade only appears when all
           * activity and exam scores exist.
           */
          const activitiesComplete =
            periodActivities.every(
              (activity) =>
                scoreMap.has(
                  activityScoreKey(
                    activity.id,
                    studentId,
                  ),
                ),
            );

          const gradeComplete =
            periodActivities.length >
            0 &&
            activitiesComplete &&
            Boolean(periodExam) &&
            hasExamScore;

          const totalPossible =
            possibleActivityPoints +
            examPossible;

          const totalEarned =
            earnedActivityPoints +
            safeNumber(examScore);

          const currentGrade =
            gradeComplete &&
              totalPossible > 0
              ? roundNumber(
                (totalEarned /
                  totalPossible) *
                100,
              )
              : null;

          const attendance =
            calculateAttendance({
              records:
                attendanceRecords,
              studentId,
            });

          const performanceStatus =
            getPerformanceStatus({
              currentGrade,
              attendancePercentage:
                attendance.attendancePercentage,
              missingCount,
            });

          return {
            ...student,
            student_id: studentId,

            activityDetails,
            activity_count:
              periodActivities.length,

            recorded_activity_count:
              recordedActivityCount,

            earned_activity_points:
              earnedActivityPoints,

            possible_activity_points:
              possibleActivityPoints,

            activity_percentage:
              activityPercentage,

            exam_title:
              periodExam?.title ||
              "Quarterly Exam",

            exam_score: examScore,
            exam_possible:
              examPossible,

            exam_percentage:
              examPercentage,

            current_grade:
              currentGrade,

            grade_complete:
              gradeComplete,

            missing_count:
              missingCount,

            late_submission_count:
              lateSubmissionCount,

            ...attendance,

            attendance_records:
              attendanceRecords.filter(
                (record) =>
                  record.student_id ===
                  studentId,
              ),

            performance_status:
              performanceStatus,
          };
        },
      );
    }, [
      activities,
      activityScores,
      exams,
      examScores,
      activitySubmissions,
      quizAttempts,
      attendanceRecords,
      students,
      gradingPeriod,
    ]);

  const summary = useMemo(() => {
    const gradedStudents =
      performanceStudents.filter(
        (student) =>
          student.current_grade !==
          null,
      );

    const attendanceStudents =
      performanceStudents.filter(
        (student) =>
          student.attendance_percentage !==
          null,
      );

    const classAverage =
      gradedStudents.length > 0
        ? roundNumber(
          gradedStudents.reduce(
            (total, student) =>
              total +
              student.current_grade,
            0,
          ) /
          gradedStudents.length,
        )
        : null;

    const averageAttendance =
      attendanceStudents.length > 0
        ? roundNumber(
          attendanceStudents.reduce(
            (total, student) =>
              total +
              student.attendance_percentage,
            0,
          ) /
          attendanceStudents.length,
        )
        : null;

    return {
      totalStudents:
        performanceStudents.length,

      classAverage,

      averageAttendance,

      passingStudents:
        gradedStudents.filter(
          (student) =>
            student.current_grade >=
            75,
        ).length,

      gradedStudents:
        gradedStudents.length,

      studentsAtRisk:
        performanceStudents.filter(
          (student) =>
            student.performance_status ===
            "at_risk",
        ).length,

      studentsNeedingAttention:
        performanceStudents.filter(
          (student) =>
            student.performance_status ===
            "needs_attention",
        ).length,

      missingSubmissions:
        performanceStudents.reduce(
          (total, student) =>
            total +
            student.missing_count,
          0,
        ),
    };
  }, [performanceStudents]);

  return {
    students: performanceStudents,
    summary,
    loading,
    error,
    reload: loadPerformance,
  };
}