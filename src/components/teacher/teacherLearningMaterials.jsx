import { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileText,
  FolderOpen,
  Image,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import useTeacherLearningMaterials from "../../hooks/useTeacherLearningMaterials";

const MODULE_BUCKET = "learning-materials";

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getFileIcon(resource) {
  const type = String(
    resource.file_type || "",
  ).toLowerCase();

  const name = String(
    resource.file_name || "",
  ).toLowerCase();

  if (
    type.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp)$/.test(name)
  ) {
    return Image;
  }

  if (
    type.includes("pdf") ||
    name.endsWith(".pdf")
  ) {
    return FileText;
  }

  if (
    /\.(zip|rar|7z)$/.test(name)
  ) {
    return FileArchive;
  }

  if (
    resource.external_url ||
    resource.resource_type === "link"
  ) {
    return Link2;
  }

  return File;
}

function ResourceItem({
  resource,
  onDownload,
  downloading,
}) {
  const Icon = getFileIcon(resource);
  const isLink = Boolean(
    resource.external_url,
  );

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {resource.file_name ||
            resource.external_url ||
            "Learning resource"}
        </p>

        <p className="mt-0.5 text-xs text-gray-400">
          {isLink
            ? "External link"
            : formatFileSize(
                resource.file_size,
              ) || "Uploaded file"}
        </p>
      </div>

      {isLink ? (
        <a
          href={resource.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
          aria-label="Open external resource"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() =>
            onDownload(resource)
          }
          disabled={
            !resource.file_path ||
            downloading
          }
          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Download ${
            resource.file_name || "resource"
          }`}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

function ModuleCard({
  module,
  onDownload,
  downloadingId,
}) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {module.title}
          </h4>

          {module.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-500">
              {module.description}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
            module.status === "published"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {module.status || "draft"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {module.resources.map(
          (resource) => (
            <ResourceItem
              key={resource.id}
              resource={resource}
              onDownload={onDownload}
              downloading={
                downloadingId === resource.id
              }
            />
          ),
        )}

        {module.resources.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-400">
            This module does not have any files
            or links.
          </div>
        )}
      </div>
    </article>
  );
}

export default function TeacherLearningMaterials() {
  const {
    materials,
    loading,
    error,
    reload,
  } = useTeacherLearningMaterials();

  const [search, setSearch] =
    useState("");
  const [sectionId, setSectionId] =
    useState("");
  const [downloadingId, setDownloadingId] =
    useState(null);
  const [downloadError, setDownloadError] =
    useState("");

  const sections = useMemo(() => {
    const options = new Map();

    materials.forEach((module) => {
      const section =
        module.classRecord?.section;

      const id =
        module.classRecord?.section_id ||
        section?.id;

      if (!id) return;

      options.set(id, {
        id,
        label: `Grade ${
          section?.grade_level || "—"
        } · ${
          section?.section_name ||
          "Unknown section"
        }`,
      });
    });

    return Array.from(options.values()).sort(
      (first, second) =>
        first.label.localeCompare(
          second.label,
          undefined,
          { numeric: true },
        ),
    );
  }, [materials]);

  const groupedMaterials = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    const filtered = materials.filter(
      (module) => {
        const classRecord =
          module.classRecord;

        if (
          sectionId &&
          classRecord?.section_id !==
            sectionId &&
          classRecord?.section?.id !==
            sectionId
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const resourceNames =
          module.resources
            .map(
              (resource) =>
                resource.file_name ||
                resource.external_url ||
                "",
            )
            .join(" ");

        const searchableText = [
          module.title,
          module.description,
          classRecord?.subject
            ?.subject_name,
          classRecord?.subject
            ?.subject_code,
          classRecord?.section
            ?.section_name,
          classRecord?.section
            ?.grade_level,
          resourceNames,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch,
        );
      },
    );

    const sectionGroups = new Map();

    filtered.forEach((module) => {
      const classRecord =
        module.classRecord;

      const section =
        classRecord?.section;

      const currentSectionId =
        classRecord?.section_id ||
        section?.id ||
        "unassigned";

      if (
        !sectionGroups.has(currentSectionId)
      ) {
        sectionGroups.set(currentSectionId, {
          id: currentSectionId,
          section,
          subjects: new Map(),
        });
      }

      const sectionGroup =
        sectionGroups.get(currentSectionId);

      const subject =
        classRecord?.subject;

      const subjectId =
        classRecord?.subject_id ||
        subject?.id ||
        "unknown-subject";

      if (
        !sectionGroup.subjects.has(
          subjectId,
        )
      ) {
        sectionGroup.subjects.set(
          subjectId,
          {
            id: subjectId,
            subject,
            modules: [],
          },
        );
      }

      sectionGroup.subjects
        .get(subjectId)
        .modules.push(module);
    });

    return Array.from(
      sectionGroups.values(),
    )
      .map((group) => ({
        ...group,
        subjects: Array.from(
          group.subjects.values(),
        ).sort((first, second) =>
          String(
            first.subject?.subject_name ||
              "",
          ).localeCompare(
            String(
              second.subject?.subject_name ||
                "",
            ),
          ),
        ),
      }))
      .sort((first, second) => {
        const firstName =
          first.section?.section_name || "";

        const secondName =
          second.section?.section_name || "";

        return firstName.localeCompare(
          secondName,
          undefined,
          { numeric: true },
        );
      });
  }, [materials, search, sectionId]);

  async function handleDownload(resource) {
    if (!resource.file_path) return;

    setDownloadingId(resource.id);
    setDownloadError("");

    try {
      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from(MODULE_BUCKET)
        .createSignedUrl(
          resource.file_path,
          60,
          {
            download:
              resource.file_name ||
              "learning-material",
          },
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      const link =
        document.createElement("a");

      link.href = data.signedUrl;
      link.download =
        resource.file_name ||
        "learning-material";

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (downloadFailure) {
      console.error(
        "Learning-material download failed:",
        downloadFailure,
      );

      setDownloadError(
        downloadFailure.message ||
          "Unable to download this material.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const moduleCount = materials.length;

  const resourceCount = materials.reduce(
    (total, module) =>
      total + module.resources.length,
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Learning Materials
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Files and links uploaded to your
            assigned classes
          </p>
        </div>

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
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <BookOpen className="h-5 w-5 text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Modules
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : moduleCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <FileText className="h-5 w-5 text-green-600" />

          <p className="mt-3 text-sm text-gray-500">
            Files and Links
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : resourceCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <Users className="h-5 w-5 text-purple-600" />

          <p className="mt-3 text-sm text-gray-500">
            Sections
          </p>

          <p className="text-2xl font-bold text-gray-900">
            {loading ? "—" : sections.length}
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <label
            htmlFor="material-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search materials
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              id="material-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subject, module, or file..."
              className={`${selectClass} pl-9`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="material-section"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Section
          </label>

          <select
            id="material-section"
            value={sectionId}
            onChange={(event) =>
              setSectionId(
                event.target.value,
              )
            }
            className={selectClass}
          >
            <option value="">
              All sections
            </option>

            {sections.map((section) => (
              <option
                key={section.id}
                value={section.id}
              >
                {section.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {(error || downloadError) && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {downloadError || error}
        </div>
      )}

      {loading && (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />

          <span className="ml-3 text-sm text-gray-500">
            Loading learning materials...
          </span>
        </div>
      )}

      {!loading &&
        !error &&
        groupedMaterials.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <FolderOpen className="mx-auto h-9 w-9 text-gray-300" />

            <h2 className="mt-3 font-semibold text-gray-800">
              No learning materials found
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload modules inside one of your
              assigned classes.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        groupedMaterials.map(
          (sectionGroup) => (
            <section
              key={sectionGroup.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 bg-slate-800 px-5 py-4 text-white">
                <p className="text-xs text-slate-300">
                  Grade{" "}
                  {sectionGroup.section
                    ?.grade_level || "—"}
                </p>

                <h2 className="font-bold">
                  {sectionGroup.section
                    ?.section_name ||
                    "Unknown section"}
                </h2>
              </div>

              <div className="space-y-6 p-5">
                {sectionGroup.subjects.map(
                  (subjectGroup) => (
                    <div
                      key={subjectGroup.id}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {subjectGroup.subject
                              ?.subject_name ||
                              "Unknown subject"}
                          </h3>

                          <p className="text-xs text-gray-400">
                            {subjectGroup.subject
                              ?.subject_code ||
                              "No subject code"}
                            {" · "}
                            {
                              subjectGroup.modules
                                .length
                            }{" "}
                            module
                            {subjectGroup.modules
                              .length === 1
                              ? ""
                              : "s"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {subjectGroup.modules.map(
                          (module) => (
                            <ModuleCard
                              key={module.id}
                              module={module}
                              onDownload={
                                handleDownload
                              }
                              downloadingId={
                                downloadingId
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          ),
        )}
    </div>
  );
}