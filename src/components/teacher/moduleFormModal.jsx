import {
  useEffect,
  useState,
} from "react";
import {
  Eye,
  FilePlus2,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import ModuleResourceList from "./moduleResourceList";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const acceptedFileTypes = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".mp4",
].join(",");

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  const offset =
    date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() - offset * 60 * 1000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function emptyLink() {
  return {
    id: crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`,
    label: "",
    url: "",
  };
}

export default function ModuleFormModal({
  initialData,
  saving,
  onClose,
  onSave,
  onOpenResource,
}) {
  const isEditing =
    Boolean(initialData);

  const [form, setForm] = useState({
    title: "",
    description: "",
    gradingPeriod: "1",
    status: "draft",
    publishAt: "",
  });

  const [files, setFiles] =
    useState([]);

  const [links, setLinks] =
    useState([]);

  const [
    existingResources,
    setExistingResources,
  ] = useState([]);

  const [
    removedResourceIds,
    setRemovedResourceIds,
  ] = useState([]);

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    setForm({
      title:
        initialData?.title || "",
      description:
        initialData?.description || "",
      gradingPeriod: String(
        initialData?.grading_period || 1,
      ),
      status:
        initialData?.status || "draft",
      publishAt: toDateTimeLocal(
        initialData?.publish_at,
      ),
    });

    setExistingResources(
      initialData?.resources || [],
    );

    setRemovedResourceIds([]);
    setFiles([]);
    setLinks([]);
    setFormError("");
  }, [initialData]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
  }

  function handleFiles(event) {
    const selectedFiles =
      Array.from(
        event.target.files || [],
      );

    const oversizedFile =
      selectedFiles.find(
        (file) =>
          file.size >
          25 * 1024 * 1024,
      );

    if (oversizedFile) {
      setFormError(
        `${oversizedFile.name} exceeds the 25 MB file limit.`,
      );

      event.target.value = "";
      return;
    }

    if (
      files.length +
        selectedFiles.length >
      10
    ) {
      setFormError(
        "You can upload a maximum of 10 files at a time.",
      );

      event.target.value = "";
      return;
    }

    setFiles((current) => [
      ...current,
      ...selectedFiles,
    ]);

    setFormError("");
    event.target.value = "";
  }

  function removeNewFile(index) {
    setFiles((current) =>
      current.filter(
        (_, fileIndex) =>
          fileIndex !== index,
      ),
    );
  }

  function addLink() {
    setLinks((current) => [
      ...current,
      emptyLink(),
    ]);
  }

  function updateLink(
    linkId,
    field,
    value,
  ) {
    setLinks((current) =>
      current.map((link) =>
        link.id === linkId
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function removeLink(linkId) {
    setLinks((current) =>
      current.filter(
        (link) => link.id !== linkId,
      ),
    );
  }

  function removeExistingResource(
    resource,
  ) {
    setExistingResources((current) =>
      current.filter(
        (item) =>
          item.id !== resource.id,
      ),
    );

    setRemovedResourceIds(
      (current) => [
        ...current,
        resource.id,
      ],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError(
        "Enter a module title.",
      );
      return;
    }

    const invalidLink =
      links.find((link) => {
        if (!link.url.trim()) {
          return false;
        }

        try {
          const parsedUrl = new URL(
            link.url,
          );

          return ![
            "http:",
            "https:",
          ].includes(
            parsedUrl.protocol,
          );
        } catch {
          return true;
        }
      });

    if (invalidLink) {
      setFormError(
        "Enter a valid HTTP or HTTPS link.",
      );
      return;
    }

    onSave({
      moduleId:
        initialData?.id || null,
      title: form.title,
      description:
        form.description,
      gradingPeriod:
        form.gradingPeriod,
      status: form.status,
      publishAt:
        form.publishAt || null,
      files,
      links: links.filter(
        (link) => link.url.trim(),
      ),
      removedResourceIds,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-gray-900">
              {isEditing
                ? "Edit Learning Module"
                : "Add Learning Module"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add lesson details, files,
              and external links.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close module form"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-5 p-6">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="module-title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Module title
              </label>

              <input
                id="module-title"
                className={inputClass}
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="Introduction to General Mathematics"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label
                htmlFor="module-description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description or instructions
              </label>

              <textarea
                id="module-description"
                className={`${inputClass} min-h-28 resize-y`}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Explain the lesson and what students need to do..."
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="module-period"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Grading period
                </label>

                <select
                  id="module-period"
                  className={inputClass}
                  value={
                    form.gradingPeriod
                  }
                  onChange={(event) =>
                    updateField(
                      "gradingPeriod",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                >
                  <option value="1">
                    First Grading
                  </option>
                  <option value="2">
                    Second Grading
                  </option>
                  <option value="3">
                    Third Grading
                  </option>
                  <option value="4">
                    Fourth Grading
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="module-status"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>

                <select
                  id="module-status"
                  className={inputClass}
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="module-publish-at"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Publish date (optional)
                </label>

                <input
                  id="module-publish-at"
                  type="datetime-local"
                  className={inputClass}
                  value={form.publishAt}
                  onChange={(event) =>
                    updateField(
                      "publishAt",
                      event.target.value,
                    )
                  }
                  disabled={saving}
                />
              </div>
            </div>

            {existingResources.length >
              0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900">
                  Current attachments
                </h3>

                <div className="mt-3">
                  <ModuleResourceList
                    resources={
                      existingResources
                    }
                    onOpen={
                      onOpenResource
                    }
                    onDelete={
                      removeExistingResource
                    }
                    deleting={saving}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Removed attachments are
                  permanently deleted after
                  saving.
                </p>
              </section>
            )}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Upload files
                  </h3>

                  <p className="text-xs text-gray-400">
                    Maximum 10 files and 25
                    MB per file
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">
                  <FilePlus2 className="h-4 w-4" />
                  Select Files

                  <input
                    type="file"
                    multiple
                    accept={
                      acceptedFileTypes
                    }
                    onChange={handleFiles}
                    disabled={saving}
                    className="sr-only"
                  />
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <FilePlus2 className="h-4 w-4 shrink-0 text-blue-600" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {file.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            {(
                              file.size /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeNewFile(
                              index,
                            )
                          }
                          disabled={saving}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${file.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    External links
                  </h3>

                  <p className="text-xs text-gray-400">
                    Add videos, websites, or
                    online references
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addLink}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </button>
              </div>

              {links.length > 0 && (
                <div className="mt-3 space-y-3">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
                    >
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                          value={
                            link.label
                          }
                          onChange={(event) =>
                            updateLink(
                              link.id,
                              "label",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Link label"
                          disabled={saving}
                          className={`${inputClass} pl-9`}
                        />
                      </div>

                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) =>
                          updateLink(
                            link.id,
                            "url",
                            event.target
                              .value,
                          )
                        }
                        placeholder="https://example.com"
                        disabled={saving}
                        className={
                          inputClass
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeLink(link.id)
                        }
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
              disabled={
                saving ||
                !form.title.trim()
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : form.status ===
                "published" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <FilePlus2 className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Module"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}