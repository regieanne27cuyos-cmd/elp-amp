import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

export default function useStudentNotifications(
  studentId,
) {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadNotifications =
    useCallback(async () => {
      if (!studentId) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const {
          data,
          error: notificationsError,
        } = await supabase
          .from("student_notifications")
          .select(`
            id,
            student_id,
            activity_id,
            notification_type,
            title,
            message,
            is_read,
            read_at,
            created_at
          `)
          .eq("student_id", studentId)
          .order("created_at", {
            ascending: false,
          })
          .limit(30);

        if (notificationsError) {
          throw notificationsError;
        }

        setNotifications(data || []);
      } catch (loadError) {
        console.error(
          "Failed to load student notifications:",
          loadError,
        );

        setError(
          loadError.message ||
            "Unable to load notifications.",
        );
      } finally {
        setLoading(false);
      }
    }, [studentId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!studentId) return undefined;

    const channel = supabase
      .channel(
        `student-notifications-${studentId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_notifications",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          setNotifications((current) => {
            const alreadyExists =
              current.some(
                (notification) =>
                  notification.id ===
                  payload.new.id,
              );

            if (alreadyExists) {
              return current;
            }

            return [
              payload.new,
              ...current,
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "student_notifications",
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          setNotifications((current) =>
            current.map((notification) =>
              notification.id ===
              payload.new.id
                ? payload.new
                : notification,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  async function markAsRead(
    notificationId,
  ) {
    const {
      error: updateError,
    } = await supabase
      .from("student_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("student_id", studentId);

    if (updateError) {
      throw updateError;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
              read_at:
                new Date().toISOString(),
            }
          : notification,
      ),
    );
  }

  async function markAllAsRead() {
    const {
      error: updateError,
    } = await supabase
      .from("student_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .eq("is_read", false);

    if (updateError) {
      throw updateError;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at:
          notification.read_at ||
          new Date().toISOString(),
      })),
    );
  }

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read,
    ).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}