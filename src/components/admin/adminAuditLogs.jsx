import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ExternalLink,
  Filter,
  LoaderCircle,
  Paperclip,
  Search,
  ShieldCheck,
  GraduationCap,
  User,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEntityType(value) {
  return String(value || "record")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function actionStyle(action) {
  const styles = {
    create: "bg-green-100 text-green-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
    archive: "bg-orange-100 text-orange-700",
    restore: "bg-purple-100 text-purple-700",
    reset_password: "bg-amber-100 text-amber-700",
    reset_passkeys: "bg-indigo-100 text-indigo-700",
  };

  return styles[action] || "bg-gray-100 text-gray-600";
}

function formatAction(action) {
  return String(action || "action")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatActivityType(value) {
  return String(value || "")
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function DataViewer({ title, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>

      <pre className="max-h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function formatFileSize(value) {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return "Unknown size";
  }

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function LogAttachment({ log }) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");

  const filePath =
    log?.metadata?.file_path ||
    log?.new_data?.file_path ||
    log?.old_data?.file_path;

  const fileName =
    log?.metadata?.file_name ||
    log?.new_data?.file_name ||
    log?.old_data?.file_name ||
    "Attached file";

  const fileType =
    log?.metadata?.file_type ||
    log?.new_data?.file_type ||
    log?.old_data?.file_type;

  const fileSize =
    log?.metadata?.file_size ||
    log?.new_data?.file_size ||
    log?.old_data?.file_size;

  const externalUrl =
    log?.metadata?.external_url ||
    log?.new_data?.external_url ||
    log?.old_data?.external_url;

  const bucket =
    log?.metadata?.storage_bucket ||
    (log?.entity_type === "class_activity"
      ? "activity-instructions"
      : "learning-materials");

  if (!filePath && !externalUrl) return null;

  async function openAttachment() {
    setOpening(true);
    setOpenError("");

    try {
      if (externalUrl && !filePath) {
        window.open(externalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 300);

      if (error) throw error;
      if (!data?.signedUrl) {
        throw new Error("The file link could not be created.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open audit attachment:", error);
      setOpenError(error.message || "Unable to open the attached file.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Attached File
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
            <Paperclip className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {fileName}
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {[fileType, formatFileSize(fileSize)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAttachment}
          disabled={opening}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {opening ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {opening ? "Opening..." : "Open file"}
        </button>
      </div>

      {openError && <p className="mt-2 text-xs text-red-600">{openError}</p>}
    </div>
  );
}

function LogDetailsModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-bold text-gray-900">
              {log.source === "teacher"
                ? "Teacher Log Details"
                : "Admin Log Details"}
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              {formatDate(log.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit details"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400">
                {log.source === "teacher" ? "Teacher" : "Administrator"}
              </p>

              <p className="mt-1 font-medium text-gray-900">
                {log.actor_name || "Unknown user"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {log.actor_email || "No email"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Role</p>

              <p className="mt-1 font-medium capitalize text-gray-900">
                {String(log.actor_role || "unknown").replace("_", " ")}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Action</p>

              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${actionStyle(
                  log.action,
                )}`}
              >
                {formatAction(log.action)}
              </span>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400">Record</p>

              <p className="mt-1 font-medium text-gray-900">
                {formatEntityType(log.entity_type)}
              </p>

              <p className="mt-1 break-all text-xs text-gray-500">
                ID: {log.entity_id || "—"}
              </p>
            </div>
          </div>

          {log.description && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Description
              </p>

              <p className="rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
                {log.description}
              </p>
            </div>
          )}

          {log.source === "teacher" && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Class Information
              </p>

              <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Subject</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {log.metadata?.subject_code
                      ? `${log.metadata.subject_code} — `
                      : ""}
                    {log.metadata?.subject_name || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Section</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {log.metadata?.grade_level
                      ? `Grade ${log.metadata.grade_level} — `
                      : ""}
                    {log.metadata?.section_name || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Strand</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {log.metadata?.strand_code || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Activity/Record Type</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatActivityType(
                      log.metadata?.activity_type || log.entity_type,
                    ) || "Not available"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <LogAttachment log={log} />

          <DataViewer title="Previous Data" value={log.old_data} />

          <DataViewer title="New Data" value={log.new_data} />

          <DataViewer title="Additional Information" value={log.metadata} />
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLogs() {
  const [logSource, setLogSource] = useState("admin");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const [page, setPage] = useState(1);

  const [selectedLog, setSelectedLog] = useState(null);

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const isTeacherLogs = logSource === "teacher";

      const query = isTeacherLogs
        ? supabase.from("teacher_audit_logs").select(`
              id,
              teacher_id,
              teacher_name,
              teacher_email,
              action,
              entity_type,
              entity_id,
              description,
              old_data,
              new_data,
              metadata,
              created_at
            `)
        : supabase.from("admin_audit_logs").select(`
              id,
              actor_id,
              actor_name,
              actor_email,
              actor_role,
              action,
              entity_type,
              entity_id,
              description,
              old_data,
              new_data,
              metadata,
              created_at
            `);

      const { data, error: logsError } = await query.order("created_at", {
        ascending: false,
      });

      if (logsError) {
        throw logsError;
      }

      const normalizedLogs = (data || []).map((log) =>
        isTeacherLogs
          ? {
            ...log,
            source: "teacher",
            actor_id: log.teacher_id,
            actor_name: log.teacher_name,
            actor_email: log.teacher_email,
            actor_role: "teacher",
          }
          : {
            ...log,
            source: "admin",
          },
      );

      setLogs(normalizedLogs);
    } catch (loadError) {
      console.error("Failed to load audit logs:", loadError);

      setError(loadError.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [logSource]);

  function changeLogSource(source) {
    setLogSource(source);
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setSelectedLog(null);
    setPage(1);
  }

  const entityOptions = useMemo(
    () =>
      Array.from(
        new Set(logs.map((log) => log.entity_type).filter(Boolean)),
      ).sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          log.actor_name,
          log.actor_email,
          log.action,
          log.entity_type,
          log.entity_id,
          log.description,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesAction = !actionFilter || log.action === actionFilter;

      const matchesEntity = !entityFilter || log.entity_type === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const visibleLogs = filteredLogs.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function updateSearch(value) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              System Audit Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review actions performed by administrators and teachers.
            </p>
          </div>
        </div>
      </header>

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => changeLogSource("admin")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${logSource === "admin"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Admin Logs
        </button>

        <button
          type="button"
          onClick={() => changeLogSource("teacher")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${logSource === "teacher"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
        >
          <GraduationCap className="h-4 w-4" />
          Teacher Logs
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total logs</p>

          <p className="mt-1 text-2xl font-bold text-gray-900">{logs.length}</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Today</p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {
              logs.filter(
                (log) =>
                  new Date(log.created_at).toDateString() ===
                  new Date().toDateString(),
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">
            {logSource === "teacher" ? "Teachers" : "Administrators"}
          </p>

          <p className="mt-1 text-2xl font-bold text-purple-600">
            {new Set(logs.map((log) => log.actor_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder={`Search ${logSource === "teacher" ? "teacher" : "administrator"
                }, action, or record...`}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-400"
            >
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="archive">Archive</option>
              <option value="restore">Restore</option>
            </select>
          </div>

          <select
            value={entityFilter}
            onChange={(event) => {
              setEntityFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          >
            <option value="">All modules</option>

            {entityOptions.map((entity) => (
              <option key={entity} value={entity}>
                {formatEntityType(entity)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">Date</th>

                <th className="px-5 py-3 font-medium">
                  {logSource === "teacher" ? "Teacher" : "Administrator"}
                </th>

                <th className="px-5 py-3 font-medium">Action</th>

                <th className="px-5 py-3 font-medium">
                  {logSource === "teacher" ? "Subject" : "Module"}
                </th>

                {logSource === "teacher" && (
                  <th className="px-5 py-3 font-medium">Section</th>
                )}

                {logSource === "teacher" && (
                  <th className="px-5 py-3 font-medium">Activity Type</th>
                )}

                <th className="px-5 py-3 font-medium">Description</th>

                <th className="px-5 py-3 text-right font-medium">Details</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={logSource === "teacher" ? 8 : 6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />

                    <p className="mt-2">Loading audit logs...</p>
                  </td>
                </tr>
              )}

              {!loading &&
                visibleLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100">
                    <td className="px-5 py-3.5 text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-gray-400" />

                        {formatDate(log.created_at)}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${logSource === "teacher"
                              ? "bg-blue-100"
                              : "bg-purple-100"
                            }`}
                        >
                          {logSource === "teacher" ? (
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-purple-600" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {log.actor_name || "Unknown"}
                          </p>

                          <p className="text-xs text-gray-400">
                            {log.actor_email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${actionStyle(
                          log.action,
                        )}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-gray-600">
                      {logSource === "teacher" ? (
                        <div>
                          <p className="font-medium text-gray-800">
                            {log.metadata?.subject_name || "Not available"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {log.metadata?.subject_code || "No subject code"}
                          </p>
                        </div>
                      ) : (
                        formatEntityType(log.entity_type)
                      )}
                    </td>

                    {logSource === "teacher" && (
                      <td className="px-5 py-3.5 text-gray-600">
                        <p className="font-medium text-gray-800">
                          {log.metadata?.section_name || "Not available"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {log.metadata?.grade_level
                            ? `Grade ${log.metadata.grade_level}`
                            : "No grade level"}
                          {log.metadata?.strand_code
                            ? ` · ${log.metadata.strand_code}`
                            : ""}
                        </p>
                      </td>
                    )}

                    {logSource === "teacher" && (
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {formatActivityType(
                            log.metadata?.activity_type || log.entity_type,
                          )}
                        </span>
                      </td>
                    )}

                    <td className="max-w-xs px-5 py-3.5">
                      <p className="truncate text-gray-600">
                        {log.description || "Administrative action"}
                      </p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          aria-label="View log details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && visibleLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={logSource === "teacher" ? 8 : 6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    <Activity className="mx-auto h-7 w-7" />

                    <p className="mt-2">No audit logs found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredLogs.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-400">
              Page {safePage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
