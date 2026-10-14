import {
  CalendarDays,
  ImageOff,
  Megaphone,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAnnouncementImage(imagePath) {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from("announcement-images")
    .getPublicUrl(imagePath);

  return data?.publicUrl || null;
}

function isAnnouncementActive(announcement) {
  if (!announcement.expires_at) {
    return true;
  }

  const expirationDate = new Date(
    announcement.expires_at,
  );

  if (
    Number.isNaN(expirationDate.getTime())
  ) {
    return true;
  }

  return expirationDate.getTime() >= Date.now();
}

function AnnouncementCard({ announcement }) {
  const imageUrl =
    announcement.image_url ||
    getAnnouncementImage(
      announcement.image_path,
    );

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={announcement.title}
          className="max-h-[420px] w-full bg-gray-100 object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center">
            <ImageOff className="mx-auto h-8 w-8 text-blue-200" />

            <p className="mt-2 text-xs text-blue-300">
              No announcement image
            </p>
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                School Announcement
              </span>
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              {announcement.title ||
                "Untitled announcement"}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
            <CalendarDays className="h-4 w-4" />

            {formatDate(
              announcement.created_at,
            )}
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-600">
          {announcement.details ||
            "No additional details were provided."}
        </p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
          <p>
            Posted:{" "}
            {formatDateTime(
              announcement.created_at,
            )}
          </p>

          {announcement.expires_at && (
            <p>
              Available until:{" "}
              {formatDateTime(
                announcement.expires_at,
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      className="space-y-4"
    >
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="h-32 bg-gray-100" />

          <div className="space-y-3 p-6">
            <div className="h-4 w-28 rounded bg-gray-100" />

            <div className="h-6 w-2/3 rounded bg-gray-100" />

            <div className="h-4 w-full rounded bg-gray-100" />

            <div className="h-4 w-4/5 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onClear }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Megaphone className="h-7 w-7 text-blue-600" />
        </div>

        <h2 className="mt-4 font-bold text-gray-900">
          {hasSearch
            ? "No announcements found"
            : "No active announcements"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {hasSearch
            ? "No active announcements match your search."
            : "New school announcements will appear here when they are posted."}
        </p>

        {hasSearch && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadAnnouncements() {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: announcementsError,
      } = await supabase
        .from("announcements")
        .select(`
          id,
          title,
          details,
          image_path,
          expires_at,
          created_at,
          updated_at,
          created_by
        `)
        .order("created_at", {
          ascending: false,
        });

      if (announcementsError) {
        throw announcementsError;
      }

      const activeAnnouncements = (
        data || []
      )
        .filter(isAnnouncementActive)
        .map((announcement) => ({
          ...announcement,

          image_url:
            getAnnouncementImage(
              announcement.image_path,
            ),
        }));

      setAnnouncements(
        activeAnnouncements,
      );
    } catch (loadError) {
      console.error(
        "Failed to load student announcements:",
        loadError,
      );

      setAnnouncements([]);

      setError(
        loadError.message ||
          "Unable to load announcements.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const filteredAnnouncements =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return announcements;
      }

      return announcements.filter(
        (announcement) => {
          const searchableText = [
            announcement.title,
            announcement.details,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query,
          );
        },
      );
    }, [announcements, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Announcements
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View active announcements from your
            school.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnnouncements}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={loadAnnouncements}
            className="mt-3 text-sm font-medium text-red-700 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="flex items-center justify-between gap-3">
          <p
            role="status"
            className="text-sm text-gray-500"
          >
            {filteredAnnouncements.length} active{" "}
            {filteredAnnouncements.length === 1
              ? "announcement"
              : "announcements"}
          </p>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? null : filteredAnnouncements
          .length === 0 ? (
        <EmptyState
          hasSearch={Boolean(
            search.trim(),
          )}
          onClear={() => setSearch("")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredAnnouncements.map(
            (announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={
                  announcement
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}