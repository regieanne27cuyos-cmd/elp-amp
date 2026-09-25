import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function one(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

export default function useTeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadClasses() {
      setLoading(true);
      setError("");
      setClasses([]);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Please sign in again.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        if (profile.role !== "teacher" || profile.status !== "active") {
          throw new Error("An active teacher account is required.");
        }

        const { data, error: queryError } = await supabase
          .from("teaching_assignments")
          .select(`
            id, subject_id, section_id, semester_id, school_year_id, status,
            subject:subjects!teaching_assignments_subject_id_fkey (
              id, subject_code, subject_name, subject_type, grade_level,
              image_path
            ),
            section:sections!teaching_assignments_section_id_fkey (
              id, section_name, grade_level
            ),
            semester:semesters!teaching_assignments_semester_id_fkey (
              id, name
            ),
            school_year:school_years!teaching_assignments_school_year_id_fkey (
              id, name
            )
          `)
          .eq("teacher_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;
        if (!active) return;

        setClasses(
          (data || []).map((record) => ({
            ...record,
            subject: one(record.subject),
            section: one(record.section),
            semester: one(record.semester),
            school_year: one(record.school_year),
          })),
        );
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load your classes.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadClasses();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return {
    classes,
    loading,
    error,
    reload: () => setReloadKey((current) => current + 1),
  };
}