import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function useClassStudents(teachingAssignmentId) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      if (!teachingAssignmentId) {
        setStudents([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_teacher_class_students",
          {
            p_teaching_assignment_id: teachingAssignmentId,
          },
        );

        if (rpcError) throw rpcError;
        if (!active) return;

        setStudents(data || []);
      } catch (loadError) {
        console.error("Failed to load class students:", loadError);

        if (active) {
          setStudents([]);
          setError(
            loadError.message ||
              "Unable to load the students in this section.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, [teachingAssignmentId, reloadKey]);

  return {
    students,
    loading,
    error,
    reload: () => setReloadKey((current) => current + 1),
  };
}