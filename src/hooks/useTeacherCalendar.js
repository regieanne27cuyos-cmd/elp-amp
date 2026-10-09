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

function normalizeActivity(activity) {
    const teachingAssignment = normalizeRelation(
        activity.teaching_assignment,
    );

    return {
        ...activity,
        source: "activity",
        calendar_date: activity.due_date?.slice(0, 10),
        teaching_assignment: teachingAssignment
            ? {
                ...teachingAssignment,
                subject: normalizeRelation(
                    teachingAssignment.subject,
                ),
                section: normalizeRelation(
                    teachingAssignment.section,
                ),
            }
            : null,
    };
}

function normalizeEvent(event) {
    return {
        ...event,
        source: "event",
        calendar_date: event.event_date,
    };
}

export default function useTeacherCalendar() {
    const [activities, setActivities] = useState([]);
    const [events, setEvents] = useState([]);
    const [teacherId, setTeacherId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw userError || new Error("Teacher session not found.");
            }

            setTeacherId(user.id);

            const [
                activitiesResult,
                eventsResult,
            ] = await Promise.all([
                supabase
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
    created_by,

    teaching_assignment:teaching_assignments!inner (
      id,
      teacher_id,

      subject:subjects (
        id,
        subject_code,
        subject_name
      ),

      section:sections (
        id,
        section_name,
        grade_level
      )
    )
  `)
                    .eq(
                        "teaching_assignment.teacher_id",
                        user.id,
                    )
                    .not("due_at", "is", null)
                    .order("due_at", {
                        ascending: true,
                    }),

                supabase
                    .from("teacher_calendar_events")
                    .select("*")
                    .eq("teacher_id", user.id)
                    .order("event_date", {
                        ascending: true,
                    }),
            ]);

            if (activitiesResult.error) {
                throw activitiesResult.error;
            }

            if (eventsResult.error) {
                throw eventsResult.error;
            }

            setActivities(
                (activitiesResult.data || []).map(
                    normalizeActivity,
                ),
            );

            setEvents(
                (eventsResult.data || []).map(
                    normalizeEvent,
                ),
            );
        } catch (loadError) {
            console.error(
                "Failed to load teacher calendar:",
                loadError,
            );

            setError(
                loadError.message ||
                "Unable to load the teacher calendar.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    async function saveEvent(values, eventId = null) {
        if (!teacherId) {
            throw new Error("Teacher session not found.");
        }

        const payload = {
            teacher_id: teacherId,
            title: values.title.trim(),
            description:
                values.description.trim() || null,
            event_date: values.event_date,
            start_time: values.start_time || null,
            end_time: values.end_time || null,
            color: values.color,
            updated_at: new Date().toISOString(),
        };

        let result;

        if (eventId) {
            result = await supabase
                .from("teacher_calendar_events")
                .update(payload)
                .eq("id", eventId)
                .eq("teacher_id", teacherId)
                .select()
                .single();
        } else {
            result = await supabase
                .from("teacher_calendar_events")
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) {
            throw result.error;
        }

        const savedEvent = normalizeEvent(result.data);

        setEvents((current) => {
            if (eventId) {
                return current.map((event) =>
                    event.id === eventId
                        ? savedEvent
                        : event,
                );
            }

            return [...current, savedEvent];
        });

        return savedEvent;
    }

    async function deleteEvent(eventId) {
        if (!teacherId) {
            throw new Error("Teacher session not found.");
        }

        const { error: deleteError } = await supabase
            .from("teacher_calendar_events")
            .delete()
            .eq("id", eventId)
            .eq("teacher_id", teacherId);

        if (deleteError) {
            throw deleteError;
        }

        setEvents((current) =>
            current.filter((event) => event.id !== eventId),
        );
    }

    return {
        activities,
        events,
        loading,
        error,
        reload,
        saveEvent,
        deleteEvent,
    };
}