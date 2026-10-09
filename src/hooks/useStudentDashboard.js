import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

function normalizeRelation(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

export default function useStudentDashboard() {
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw (
          userError ||
          new Error("Student session was not found.")
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          status
        `)
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.role !== "student") {
        throw new Error(
          "This account is not a student account.",
        );
      }

      if (profile.status !== "active") {
        throw new Error(
          "Your student account is currently inactive.",
        );
      }

      const {
        data: studentDetails,
        error: studentError,
      } = await supabase
        .from("student_details")
        .select(`
          id,
          student_number,
          section_id,
          contact_number,

          section:sections (
            id,
            section_name,
            grade_level,
            strand_id,
            school_year_id,
            status,

            strand:strands (
              id,
              code,
              name
            ),

            school_year:school_years (
              id,
              name,
              status
            )
          )
        `)
        .eq("id", user.id)
        .single();

      if (studentError) {
        throw studentError;
      }

      const section = normalizeRelation(
        studentDetails.section,
      );

      const normalizedStudent = {
        ...profile,
        ...studentDetails,
        section: section
          ? {
              ...section,
              strand: normalizeRelation(
                section.strand,
              ),
              school_year: normalizeRelation(
                section.school_year,
              ),
            }
          : null,
      };

      setStudent(normalizedStudent);

      if (!studentDetails.section_id) {
        setClasses([]);
        setActivities([]);
        return;
      }

      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabase
        .from("teaching_assignments")
        .select(`
          id,
          teacher_id,
          subject_id,
          section_id,
          school_year_id,
          status,

          subject:subjects (
            id,
            subject_code,
            subject_name,
            subject_type,
            image_path,
            status
          ),

          section:sections (
            id,
            section_name,
            grade_level
          ),

          school_year:school_years (
            id,
            name
          ),

          teacher:teacher_details (
            id,
            teacher_number,

            profile:profiles (
              full_name,
              email
            )
          )
        `)
        .eq(
          "section_id",
          studentDetails.section_id,
        )
        .eq("status", "active")
        .order("created_at", {
          ascending: true,
        });

      if (assignmentError) {
        throw assignmentError;
      }

      const normalizedClasses = (
        assignmentData || []
      ).map((record) => {
        const teacher = normalizeRelation(
          record.teacher,
        );

        return {
          ...record,
          subject: normalizeRelation(record.subject),
          section: normalizeRelation(record.section),
          school_year: normalizeRelation(
            record.school_year,
          ),
          teacher: teacher
            ? {
                ...teacher,
                profile: normalizeRelation(
                  teacher.profile,
                ),
              }
            : null,
        };
      });

      setClasses(normalizedClasses);

      const assignmentIds = normalizedClasses.map(
        (record) => record.id,
      );

      if (assignmentIds.length === 0) {
        setActivities([]);
        return;
      }

      const {
        data: activityData,
        error: activityError,
      } = await supabase
        .from("class_activities")
        .select(`
          id,
          teaching_assignment_id,
          activity_type,
          title,
          instructions,
          due_at,
          points,
          status,
          grading_period,
          file_path,
          file_name,
          file_type,
          created_at
        `)
        .in(
          "teaching_assignment_id",
          assignmentIds,
        )
        .eq("status", "published")
        .order("due_at", {
          ascending: true,
        });

      if (activityError) {
        throw activityError;
      }

      const classMap = new Map(
        normalizedClasses.map((classRecord) => [
          classRecord.id,
          classRecord,
        ]),
      );

      setActivities(
        (activityData || []).map((activity) => ({
          ...activity,
          classRecord:
            classMap.get(
              activity.teaching_assignment_id,
            ) || null,
        })),
      );
    } catch (loadError) {
      console.error(
        "Failed to load student dashboard:",
        loadError,
      );

      setError(
        loadError.message ||
          "Unable to load the student dashboard.",
      );

      setStudent(null);
      setClasses([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    student,
    classes,
    activities,
    loading,
    error,
    reload: loadDashboard,
  };
}