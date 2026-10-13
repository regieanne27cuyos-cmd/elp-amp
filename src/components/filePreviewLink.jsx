import {
  ExternalLink,
  FileText,
} from "lucide-react";

export default function FilePreviewLink({
  url,
  fileName = "Open file",
}) {
  if (!url) return null;

  function openFile() {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <button
      type="button"
      onClick={openFile}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
    >
      <FileText className="h-4 w-4" />

      <span className="max-w-[240px] truncate">
        {fileName}
      </span>

      <ExternalLink className="h-4 w-4" />
    </button>
  );
}