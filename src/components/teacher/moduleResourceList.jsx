import {
  FileText,
  Link2,
  Trash2,
} from "lucide-react";
import FilePreviewLink from "../filePreviewLink";

const MODULE_BUCKET =
  "learning-materials";

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!size || Number.isNaN(size)) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function ModuleResourceList({
  resources = [],
  onDelete,
  deleting = false,
  allowDelete = true,
}) {
  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
        <FileText className="mx-auto h-7 w-7 text-gray-300" />

        <p className="mt-2 text-sm text-gray-400">
          No resources attached.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const external =
          Boolean(resource.external_url);

        const title =
          resource.file_name ||
          resource.external_url ||
          "Learning resource";

        const fileDetails = [
          resource.file_type,
          formatFileSize(
            resource.file_size,
          ),
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={resource.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:flex-row sm:items-center"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              {external ? (
                <Link2 className="h-5 w-5 text-blue-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {title}
              </p>

              <p className="mt-0.5 text-xs text-gray-400">
                {external
                  ? "External link"
                  : fileDetails ||
                    "Uploaded file"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <FilePreviewLink
                bucket={MODULE_BUCKET}
                path={resource.file_path}
                url={resource.external_url}
                fileName={
                  external
                    ? "Open link"
                    : "Open file"
                }
              />

              {allowDelete && onDelete && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(resource);
                  }}
                  disabled={deleting}
                  aria-label={`Delete ${title}`}
                  className="rounded-lg border border-red-100 bg-white p-2.5 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}