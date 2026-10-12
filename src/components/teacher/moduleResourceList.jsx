import {
  Download,
  ExternalLink,
  File,
  FileArchive,
  FileImage,
  FileText,
  Link2,
  Presentation,
  Sheet,
  Trash2,
} from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) return "";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getResourceIcon(resource) {
  if (
    resource.resource_type === "link"
  ) {
    return Link2;
  }

  const type =
    resource.file_type || "";

  const name = (
    resource.file_name || ""
  ).toLowerCase();

  if (type.startsWith("image/")) {
    return FileImage;
  }

  if (
    type.includes("presentation") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ) {
    return Presentation;
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return Sheet;
  }

  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    name.endsWith(".zip") ||
    name.endsWith(".rar")
  ) {
    return FileArchive;
  }

  if (
    type.includes("pdf") ||
    type.includes("word") ||
    type.startsWith("text/")
  ) {
    return FileText;
  }

  return File;
}

export default function ModuleResourceList({
  resources = [],
  onOpen,
  onDelete,
  deleting = false,
  allowDelete = true,
}) {
  if (resources.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        No files or links attached.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {resources.map((resource) => {
        const Icon =
          getResourceIcon(resource);

        const resourceName =
          resource.resource_type ===
          "link"
            ? resource.link_label ||
              resource.external_url
            : resource.file_name ||
              "Attached file";

        return (
          <div
            key={resource.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800">
                {resourceName}
              </p>

              <p className="mt-0.5 truncate text-xs text-gray-400">
                {resource.resource_type ===
                "link"
                  ? resource.external_url
                  : [
                      resource.file_type,
                      formatFileSize(
                        resource.file_size,
                      ),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onOpen(resource)
              }
              className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
              aria-label={`Open ${resourceName}`}
            >
              {resource.resource_type ===
              "link" ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>

            {allowDelete && onDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  onDelete(resource)
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                aria-label={`Delete ${resourceName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}