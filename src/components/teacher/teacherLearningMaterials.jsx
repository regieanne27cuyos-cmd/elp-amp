import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import FilePreviewLink from "../filePreviewLink";
import useTeacherClasses from "../../hooks/useTeacherClasses";

const MATERIALS_BUCKET =
  "learning-materials";

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(size / 1024),
    )} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function MaterialResource({ resource }) {
  if (resource.file_path) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">
              {resource.file_name ||
                "Learning material"}
            </p>

            <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-400">
              {resource.file_type && (
                <span>
                  {resource.file_type}
                </span>
              )}

              {resource.file_size && (
                <span>
                  {formatFileSize(
                    resource.file_size,
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <FilePreviewLink
            bucket={MATERIALS_BUCKET}
            path={resource.file_path}
            fileName="Open File"
          />
        </div>
      </div>
    );
  }

  if (resource.external_url) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <Link2 className="h-5 w-5 text-purple-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700">
              External learning resource
            </p>

            <p className="max-w-md truncate text-xs text-gray-400">
              {resource.external_url}
            </p>
          </div>
        </div>

        <a
          href={resource.external_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200"
        >
          Open Link
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return null;
}

function MaterialCard({
  material,
  resources,
}) {
  return (
    <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">
                {material.title ||
                  "Untitled learning module"}
              </h3>

              <p className="mt-1 text-xs text-gray-400">
                Added{" "}
                {formatDate(
                  material.created_at,
                )}
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${material.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                }`}
            >
              {material.status === "published"
                ? "Published"
                : "Draft"}
            </span>
          </div>

          {material.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-500">
              {material.description}
            </p>
          )}

          {resources.length > 0 ? (
            <div className="mt-4 space-y-3">
              {resources.map((resource) => (
                <MaterialResource
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
              No file or external resource attached.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SectionGroup({
  classRecord,
  materials,
  resourcesByModule,
  onOpenClass,
}) {
  const sectionName =
    classRecord.section?.section_name ||
    "Section unavailable";

  const gradeLevel =
    classRecord.section?.grade_level || "—";

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Grade {gradeLevel} · {sectionName}
          </p>

          <p className="text-xs text-gray-400">
            {materials.length}{" "}
            {materials.length === 1
              ? "module"
              : "modules"}
          </p>
        </div>

        {onOpenClass && (
          <button
            type="button"
            onClick={() =>
              onOpenClass(
                classRecord,
                "modules",
              )
            }
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Open class modules
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            resources={
              resourcesByModule.get(
                material.id,
              ) || []
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function TeacherLearningMaterials({
  onOpenClass,
}) {
  const {
    classes = [],
    loading: classesLoading,
    error: classesError,
    reload: reloadClasses,
  } = useTeacherClasses();

  const [materials, setMaterials] =
    useState([]);

  const [resources, setResources] =
    useState([]);

  const [materialsLoading, setMaterialsLoading] =
    useState(true);

  const [materialsError, setMaterialsError] =
    useState("");

  const loadMaterials =
    useCallback(async () => {
      if (classesLoading) return;

      const assignmentIds = classes
        .map(
          (classRecord) =>
            classRecord.id,
        )
        .filter(Boolean);

      if (assignmentIds.length === 0) {
        setMaterials([]);
        setResources([]);
        setMaterialsLoading(false);
        return;
      }

      setMaterialsLoading(true);
      setMaterialsError("");

      try {
        const {
          data: moduleData,
          error: moduleError,
        } = await supabase
          .from("learning_modules")
          .select(`
            id,
            teaching_assignment_id,
            title,
            description,
            status,
            created_at,
            updated_at
          `)
          .in(
            "teaching_assignment_id",
            assignmentIds,
          )
          .order("created_at", {
            ascending: false,
          });

        if (moduleError) {
          throw moduleError;
        }

        const loadedMaterials =
          moduleData || [];

        const moduleIds =
          loadedMaterials.map(
            (material) => material.id,
          );

        let loadedResources = [];

        if (moduleIds.length > 0) {
          const {
            data: resourceData,
            error: resourceError,
          } = await supabase
            .from("module_resources")
            .select(`
              id,
              module_id,
              resource_type,
              file_name,
              file_path,
              file_type,
              file_size,
              external_url,
              created_at
            `)
            .in("module_id", moduleIds)
            .order("created_at", {
              ascending: true,
            });

          if (resourceError) {
            throw resourceError;
          }

          loadedResources =
            resourceData || [];
        }

        setMaterials(loadedMaterials);
        setResources(loadedResources);
      } catch (loadError) {
        console.error(
          "Failed to load learning materials:",
          loadError,
        );

        setMaterials([]);
        setResources([]);

        setMaterialsError(
          loadError.message ||
          "Unable to load learning materials.",
        );
      } finally {
        setMaterialsLoading(false);
      }
    }, [classes, classesLoading]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const classMap = useMemo(
    () =>
      new Map(
        classes.map((classRecord) => [
          classRecord.id,
          classRecord,
        ]),
      ),
    [classes],
  );

  const resourcesByModule = useMemo(() => {
    const grouped = new Map();

    resources.forEach((resource) => {
      if (!grouped.has(resource.module_id)) {
        grouped.set(
          resource.module_id,
          [],
        );
      }

      grouped
        .get(resource.module_id)
        .push(resource);
    });

    return grouped;
  }, [resources]);

  const subjectGroups = useMemo(() => {
    const groups = new Map();

    materials.forEach((material) => {
      const classRecord = classMap.get(
        material.teaching_assignment_id,
      );

      if (!classRecord) return;

      const subject =
        classRecord.subject;

      const subjectId =
        subject?.id ||
        classRecord.subject_id ||
        "unknown-subject";

      if (!groups.has(subjectId)) {
        groups.set(subjectId, {
          id: subjectId,
          subject,
          sections: new Map(),
        });
      }

      const subjectGroup =
        groups.get(subjectId);

      const sectionId =
        classRecord.section?.id ||
        classRecord.section_id ||
        classRecord.id;

      if (
        !subjectGroup.sections.has(
          sectionId,
        )
      ) {
        subjectGroup.sections.set(
          sectionId,
          {
            id: sectionId,
            classRecord,
            materials: [],
          },
        );
      }

      subjectGroup.sections
        .get(sectionId)
        .materials.push(material);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        sections: Array.from(
          group.sections.values(),
        ).sort((first, second) =>
          String(
            first.classRecord.section
              ?.section_name || "",
          ).localeCompare(
            String(
              second.classRecord.section
                ?.section_name || "",
            ),
            undefined,
            {
              numeric: true,
            },
          ),
        ),
      }))
      .sort((first, second) =>
        String(
          first.subject?.subject_name || "",
        ).localeCompare(
          String(
            second.subject?.subject_name || "",
          ),
        ),
      );
  }, [materials, classMap]);

  const loading =
    classesLoading || materialsLoading;

  const error =
    classesError || materialsError;

  async function handleRefresh() {
    await reloadClasses?.();
    await loadMaterials();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Learning Materials
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Files uploaded to your assigned
            classes, organized by subject and
            section.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""
              }`}
          />

          Refresh
        </button>
      </header>

      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <FolderOpen className="h-6 w-6 text-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Total Modules
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {materials.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <BookOpen className="h-6 w-6 text-purple-600" />

            <p className="mt-3 text-sm text-gray-500">
              Subjects
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {subjectGroups.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <FileText className="h-6 w-6 text-green-600" />

            <p className="mt-3 text-sm text-gray-500">
              Files and Links
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {resources.length}
            </p>
          </div>
        </section>
      )}

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
          Loading learning materials...
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        subjectGroups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />

            <h2 className="mt-3 font-semibold text-gray-700">
              No learning materials yet
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Materials uploaded through the
              Modules tab will appear here.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        subjectGroups.map((group) => (
          <section
            key={group.id}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 bg-slate-800 px-5 py-4 text-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <BookOpen className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-300">
                  {group.subject?.subject_code ||
                    "SUBJECT"}
                </p>

                <h2 className="truncate font-semibold">
                  {group.subject
                    ?.subject_name ||
                    "Subject unavailable"}
                </h2>
              </div>

              <span className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                {group.sections.reduce(
                  (total, section) =>
                    total +
                    section.materials.length,
                  0,
                )}{" "}
                modules
              </span>
            </div>

            {group.sections.map(
              (section) => (
                <SectionGroup
                  key={section.id}
                  classRecord={
                    section.classRecord
                  }
                  materials={
                    section.materials
                  }
                  resourcesByModule={
                    resourcesByModule
                  }
                  onOpenClass={onOpenClass}
                />
              ),
            )}
          </section>
        ))}
    </div>
  );
}