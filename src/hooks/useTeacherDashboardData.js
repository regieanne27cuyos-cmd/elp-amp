import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function useTeacherDashboardData() {
  const navigate = useNavigate();

  const [teacherProfile, setTeacherProfile] =
    useState(null);
  const [profileLoading, setProfileLoading] =
    useState(true);
  const [pageError, setPageError] = useState("");

  const [announcements, setAnnouncements] =
    useState([]);
  const [
    announcementsLoading,
    setAnnouncementsLoading,
  ] = useState(true);
  const [
    announcementsError,
    setAnnouncementsError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTeacherProfile() {
      setProfileLoading(true);
      setPageError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate("/", {
            replace: true,
          });
          return;
        }

        const [
          profileResult,
          teacherDetailsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, email, role, status",
            )
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("teacher_details")
            .select(
              "teacher_number, contact_number, employment_type",
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (teacherDetailsResult.error) {
          throw teacherDetailsResult.error;
        }

        const profile = profileResult.data;

        if (
          !profile ||
          profile.role !== "teacher" ||
          profile.status !== "active"
        ) {
          await supabase.auth.signOut({
            scope: "local",
          });

          navigate("/", {
            replace: true,
          });

          return;
        }

        if (!active) return;

        setTeacherProfile({
          ...profile,
          ...(teacherDetailsResult.data || {}),
        });
      } catch (error) {
        console.error(
          "Failed to load teacher profile:",
          error,
        );

        if (active) {
          setPageError(
            error.message ||
              "Unable to load the teacher dashboard.",
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadTeacherProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!teacherProfile) return;

    let active = true;

    async function loadAnnouncements() {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const { data, error } = await supabase
          .from("announcements")
          .select(`
            id,
            title,
            details,
            image_path,
            expires_at,
            created_at
          `)
          .gt(
            "expires_at",
            new Date().toISOString(),
          )
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (!active) return;

        setAnnouncements(data || []);
      } catch (error) {
        console.error(
          "Failed to load announcements:",
          error,
        );

        if (active) {
          setAnnouncements([]);
          setAnnouncementsError(
            error.message ||
              "Unable to load announcements.",
          );
        }
      } finally {
        if (active) {
          setAnnouncementsLoading(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      active = false;
    };
  }, [teacherProfile]);

  async function logout() {
    await supabase.auth.signOut({
      scope: "local",
    });

    navigate("/", {
      replace: true,
    });
  }

  return {
    teacherProfile,
    profileLoading,
    pageError,
    announcements,
    announcementsLoading,
    announcementsError,
    logout,
  };
}