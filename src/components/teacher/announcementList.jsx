import {
  LoaderCircle,
  Megaphone,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

export default function announcementList({
  announcements,
  loading,
  error,
  limit,
}) {
  const visibleAnnouncements =
    typeof limit === "number"
      ? announcements.slice(0, limit)
      : announcements;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading announcements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No active announcements.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleAnnouncements.map(
        (announcement) => (
          <div
            key={announcement.id}
            className="flex items-start gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Megaphone className="h-4 w-4 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {announcement.title}
              </p>

              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                {announcement.details}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {formatDate(
                  announcement.created_at,
                )}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}