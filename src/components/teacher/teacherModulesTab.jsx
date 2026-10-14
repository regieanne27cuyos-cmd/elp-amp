import {
  useMemo,
  useState,
} from "react";
import {
  CalendarClock,
  Edit3,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import useLearningModules from "../../hooks/useLearningModules";
import ModuleFormModal from "./moduleFormModal";
import ModuleResourceList from "./moduleResourceList";

const gradingPeriods = [
  {
    value: "",
    label: "All Grading Periods",
  },
  {
    value: "1",
    label: "First Grading",
  },
  {
    value: "2",
    label: "Second Grading",
  },
  {
    value: "3",
    label: "Third Grading",
  },
  {
    value: "4",
    label: "Fourth Grading",
  },
];

function gradingPeriodLabel(value) {
  const labels = {
    1: "First Grading",
    2: "Second Grading",
    3: "Third Grading",
    4: "Fourth Grading",
  };

  return (
    labels[Number(value)] ||
    "Unknown Grading Period"
  );
}

function formatDate(value) {
  if (!value) return null;

  return new Date(value).toLocaleString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function ModuleCard({
  module,
  saving,
  onEdit,
  onDelete,
  onDeleteResource,
}) {
  const scheduled =
    module.publish_at &&
    new Date(module.publish_at) >
    new Date();

  const published =
    module.status === "published";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {gradingPeriodLabel(
                module.grading_period,
              )}
            </span>

            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${published
                  ? scheduled
                    ? "bg-orange-100 text-orange-700"
                    : "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                }`}
            >
              {published ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}

              {published
                ? scheduled
                  ? "Scheduled"
                  : "Published"
                : "Draft"}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-gray-900">
            {module.title}
          </h3>

          {module.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500">
              {module.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(module)}
            disabled={saving}
            aria-label={`Edit ${module.title}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(module)
            }
            disabled={saving}
            aria-label={`Delete ${module.title}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {module.publish_at && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <CalendarClock className="h-4 w-4" />

          {scheduled
            ? "Scheduled for"
            : "Published from"}{" "}
          {formatDate(module.publish_at)}
        </div>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">
            Resources
          </h4>

          <span className="text-xs text-gray-400">
            {module.resources?.length ||
              0}{" "}
            item
            {(module.resources?.length ||
              0) === 1
              ? ""
              : "s"}
          </span>
        </div>

        <ModuleResourceList
          resources={
            module.resources || []
          }
          onDelete={onDeleteResource}
          deleting={saving}
        />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Last updated{" "}
        {formatDate(module.updated_at)}
      </p>
    </article>
  );
}

export default function TeacherModulesTab({
  classRecord,
}) {
  const {
    modules,
    loading,
    saving,
    error,
    reload,
    saveModule,
    deleteModule,
    deleteResource,
  } = useLearningModules(
    classRecord?.id,
  );

  const [
    periodFilter,
    setPeriodFilter,
  ] = useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [
    selectedModule,
    setSelectedModule,
  ] = useState(null);

  const [notice, setNotice] =
    useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const filteredModules = useMemo(
    () =>
      modules.filter(
        (module) =>
          !periodFilter ||
          Number(
            module.grading_period,
          ) === Number(periodFilter),
      ),
    [modules, periodFilter],
  );

  function openCreateForm() {
    setSelectedModule(null);
    setNotice("");
    setActionError("");
    setFormOpen(true);
  }

  function openEditForm(module) {
    setSelectedModule(module);
    setNotice("");
    setActionError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setSelectedModule(null);
    setFormOpen(false);
    setActionError("");
  }

  async function handleSave(formData) {
    setActionError("");
    setNotice("");

    try {
      await saveModule(formData);

      setNotice(
        formData.moduleId
          ? "Learning module updated successfully."
          : "Learning module created successfully.",
      );

      setFormOpen(false);
      setSelectedModule(null);
    } catch (saveError) {
      setActionError(
        saveError.message ||
        "Unable to save the module.",
      );
    }
  }

  async function handleDelete(module) {
    setActionError("");
    setNotice("");

    const deleted =
      await deleteModule(module);

    if (deleted) {
      setNotice(
        "Learning module deleted successfully.",
      );
    }
  }

  async function handleDeleteResource(
    resource,
  ) {
    setActionError("");
    setNotice("");

    const deleted =
      await deleteResource(resource);

    if (deleted) {
      setNotice(
        "Module resource removed successfully.",
      );
    }
  }

  return (
    <div className="space-y-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900">
            Learning Modules
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add lessons, documents, videos,
            presentations, and external links.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading || saving}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading
                  ? "animate-spin"
                  : ""
                }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
        </div>
      </header>

      {(error || actionError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionError || error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {filteredModules.length} module
            {filteredModules.length === 1
              ? ""
              : "s"}
          </p>

          <p className="text-xs text-gray-400">
            {modules.length} total learning
            modules
          </p>
        </div>

        <select
          value={periodFilter}
          onChange={(event) =>
            setPeriodFilter(
              event.target.value,
            )
          }
          aria-label="Filter by grading period"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          {gradingPeriods.map(
            (period) => (
              <option
                key={
                  period.value || "all"
                }
                value={period.value}
              >
                {period.label}
              </option>
            ),
          )}
        </select>
      </div>

      {loading && (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-gray-100 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Loading learning modules...
            </p>
          </div>
        </div>
      )}

      {!loading &&
        modules.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-6">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <FileText className="h-7 w-7 text-blue-600" />
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                No learning modules yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Add lessons, instructions,
                files, presentations, videos,
                or external references.
              </p>

              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <FilePlus2 className="h-4 w-4" />
                Create First Module
              </button>
            </div>
          </div>
        )}

      {!loading &&
        modules.length > 0 &&
        filteredModules.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No modules in this grading
              period.
            </p>

            <button
              type="button"
              onClick={() =>
                setPeriodFilter("")
              }
              className="mt-2 text-sm font-medium text-blue-600 hover:underline"
            >
              Show all modules
            </button>
          </div>
        )}

      {!loading &&
        filteredModules.length > 0 && (
          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
            {filteredModules.map(
              (module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  saving={saving}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                  onDeleteResource={
                    handleDeleteResource
                  }
                />
              ),
            )}
          </div>
        )}

      {formOpen && (
        <ModuleFormModal
          key={
            selectedModule?.id ||
            "new-learning-module"
          }
          initialData={selectedModule}
          saving={saving}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
}