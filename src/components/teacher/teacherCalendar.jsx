import {
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import useTeacherCalendar from "../../hooks/useTeacherCalendar";

const emptyEvent = {
  title: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  color: "blue",
};

const colorClasses = {
  blue: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
  },
  green: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
  },
  orange: {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700",
  },
  purple: {
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700",
  },
  red: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
  },
};

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) return "Date unavailable";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}

function formatTime(value) {
  if (!value) return "";

  return new Date(
    `2000-01-01T${value}`,
  ).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityColor(type) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("quiz")) {
    return "purple";
  }

  if (
    normalized.includes("performance") ||
    normalized.includes("task")
  ) {
    return "orange";
  }

  return "blue";
}

function CalendarModal({
  form,
  editing,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">
            {editing ? "Edit Event" : "Add Event"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Close event form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 p-6"
        >
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Event title
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                onChange("title", event.target.value)
              }
              placeholder="Faculty meeting"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Event date
            </label>

            <input
              type="date"
              value={form.event_date}
              onChange={(event) =>
                onChange(
                  "event_date",
                  event.target.value,
                )
              }
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start time
              </label>

              <input
                type="time"
                value={form.start_time}
                onChange={(event) =>
                  onChange(
                    "start_time",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End time
              </label>

              <input
                type="time"
                value={form.end_time}
                onChange={(event) =>
                  onChange(
                    "end_time",
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Event color
            </label>

            <select
              value={form.color}
              onChange={(event) =>
                onChange("color", event.target.value)
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="orange">Orange</option>
              <option value="purple">Purple</option>
              <option value="red">Red</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                onChange(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Optional event details"
              rows={4}
              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeacherCalendar() {
  const {
    activities,
    events,
    loading,
    error,
    reload,
    saveEvent,
    deleteEvent,
  } = useTeacherCalendar();

  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ),
  );

  const [selectedDate, setSelectedDate] = useState(
    () => toDateKey(new Date()),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState(null);
  const [form, setForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] =
    useState("");

  const calendarEntries = useMemo(() => {
    const activityEntries = activities.map(
      (activity) => ({
        ...activity,
        color: activityColor(
          activity.activity_type,
        ),
      }),
    );

    return [...activityEntries, ...events];
  }, [activities, events]);

  const entriesByDate = useMemo(() => {
    const grouped = new Map();

    calendarEntries.forEach((entry) => {
      if (!entry.calendar_date) return;

      if (!grouped.has(entry.calendar_date)) {
        grouped.set(entry.calendar_date, []);
      }

      grouped.get(entry.calendar_date).push(entry);
    });

    return grouped;
  }, [calendarEntries]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    for (let index = firstDay.getDay(); index > 0; index -= 1) {
      days.push(
        new Date(
          year,
          month,
          1 - index,
        ),
      );
    }

    for (
      let day = 1;
      day <= lastDay.getDate();
      day += 1
    ) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      const finalDate = days[days.length - 1];

      days.push(
        new Date(
          finalDate.getFullYear(),
          finalDate.getMonth(),
          finalDate.getDate() + 1,
        ),
      );
    }

    return days;
  }, [visibleMonth]);

  const selectedEntries =
    entriesByDate.get(selectedDate) || [];

  function openAddEvent(date = selectedDate) {
    setEditingEvent(null);
    setForm({
      ...emptyEvent,
      event_date: date,
    });
    setActionError("");
    setModalOpen(true);
  }

  function openEditEvent(event) {
    setEditingEvent(event);
    setForm({
      title: event.title || "",
      description: event.description || "",
      event_date: event.event_date || "",
      start_time: event.start_time?.slice(0, 5) || "",
      end_time: event.end_time?.slice(0, 5) || "",
      color: event.color || "blue",
    });
    setActionError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingEvent(null);
    setForm(emptyEvent);
    setActionError("");
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.event_date) {
      setActionError(
        "Event title and date are required.",
      );
      return;
    }

    if (
      form.start_time &&
      form.end_time &&
      form.end_time <= form.start_time
    ) {
      setActionError(
        "End time must be later than start time.",
      );
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      await saveEvent(
        form,
        editingEvent?.id || null,
      );

      setSelectedDate(form.event_date);
      setVisibleMonth(
        new Date(`${form.event_date}T00:00:00`),
      );

      closeModal();
    } catch (saveError) {
      console.error(
        "Failed to save calendar event:",
        saveError,
      );

      setActionError(
        saveError.message ||
          "Unable to save the calendar event.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event) {
    const confirmed = window.confirm(
      `Delete the event "${event.title}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteEvent(event.id);
    } catch (deleteError) {
      console.error(
        "Failed to delete calendar event:",
        deleteError,
      );

      window.alert(
        deleteError.message ||
          "Unable to delete the event.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Calendar
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View activity deadlines and manage your
            personal events.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => openAddEvent()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() - 1,
                      1,
                    ),
                )
              }
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h2 className="font-bold text-gray-900">
              {visibleMonth.toLocaleDateString(
                "en-PH",
                {
                  month: "long",
                  year: "numeric",
                },
              )}
            </h2>

            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + 1,
                      1,
                    ),
                )
              }
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const dateKey = toDateKey(date);
              const dateEntries =
                entriesByDate.get(dateKey) || [];

              const currentMonth =
                date.getMonth() ===
                visibleMonth.getMonth();

              const selected =
                selectedDate === dateKey;

              const today =
                dateKey === toDateKey(new Date());

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() =>
                    setSelectedDate(dateKey)
                  }
                  className={`min-h-28 border-b border-r border-gray-100 p-2 text-left align-top transition ${
                    selected
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      today
                        ? "bg-blue-600 font-semibold text-white"
                        : currentMonth
                          ? "text-gray-700"
                          : "text-gray-300"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  <div className="mt-1 space-y-1">
                    {dateEntries
                      .slice(0, 3)
                      .map((entry) => (
                        <div
                          key={`${entry.source}-${entry.id}`}
                          className="flex items-center gap-1 truncate text-[11px] text-gray-600"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              colorClasses[
                                entry.color || "blue"
                              ].dot
                            }`}
                          />

                          <span className="truncate">
                            {entry.title}
                          </span>
                        </div>
                      ))}

                    {dateEntries.length > 3 && (
                      <p className="text-[10px] text-gray-400">
                        +{dateEntries.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                {formatDisplayDate(selectedDate)}
              </h2>

              <p className="text-xs text-gray-400">
                {selectedEntries.length} calendar item
                {selectedEntries.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                openAddEvent(selectedDate)
              }
              className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
              aria-label="Add event on selected date"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {selectedEntries.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-gray-300" />

              <p className="mt-3 text-sm text-gray-500">
                No deadlines or events on this date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEntries.map((entry) => {
                const color =
                  colorClasses[
                    entry.color || "blue"
                  ];

                const isActivity =
                  entry.source === "activity";

                return (
                  <article
                    key={`${entry.source}-${entry.id}`}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium capitalize ${color.badge}`}
                        >
                          {isActivity
                            ? entry.activity_type ||
                              "Activity deadline"
                            : "Personal event"}
                        </span>

                        <h3 className="mt-2 font-medium text-gray-900">
                          {entry.title}
                        </h3>

                        {isActivity && (
                          <p className="mt-1 text-xs text-gray-500">
                            {entry
                              .teaching_assignment
                              ?.subject?.subject_name ||
                              "Subject unavailable"}
                            {" · "}
                            {entry
                              .teaching_assignment
                              ?.section?.section_name ||
                              "Section unavailable"}
                          </p>
                        )}

                        {!isActivity &&
                          entry.start_time && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5" />

                              {formatTime(
                                entry.start_time,
                              )}

                              {entry.end_time &&
                                ` – ${formatTime(
                                  entry.end_time,
                                )}`}
                            </p>
                          )}

                        {!isActivity &&
                          entry.description && (
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                              {entry.description}
                            </p>
                          )}
                      </div>

                      {!isActivity && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openEditEvent(entry)
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            aria-label={`Edit ${entry.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(entry)
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${entry.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {modalOpen && (
        <CalendarModal
          form={form}
          editing={Boolean(editingEvent)}
          saving={saving}
          error={actionError}
          onChange={(field, value) =>
            setForm((current) => ({
              ...current,
              [field]: value,
            }))
          }
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}