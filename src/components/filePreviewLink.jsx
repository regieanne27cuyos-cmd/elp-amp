import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function FilePreviewLink({
  bucket,
  path,
  url,
  fileName = "Open file",
  className = "",
}) {
  const [opening, setOpening] =
    useState(false);

  async function handleOpen(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (opening) return;

    setOpening(true);

    // Create the tab immediately to prevent
    // the browser from blocking it.
    const previewWindow = window.open(
      "",
      "_blank",
    );

    try {
      let previewUrl = url;

      if (
        !previewUrl &&
        bucket &&
        path
      ) {
        const {
          data,
          error,
        } = await supabase.storage
          .from(bucket)
          .createSignedUrl(
            path,
            60 * 10,
          );

        if (error) throw error;

        previewUrl = data?.signedUrl;
      }

      if (!previewUrl) {
        throw new Error(
          "The file path or URL is missing.",
        );
      }

      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.href =
          previewUrl;
      } else {
        window.location.href = previewUrl;
      }
    } catch (error) {
      previewWindow?.close();

      console.error(
        "File preview failed:",
        error,
      );

      window.alert(
        error.message ||
        "Unable to open this file.",
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={
        opening || (!path && !url)
      }
      className={`inline-flex max-w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {opening ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : path || url ? (
        <ExternalLink className="h-4 w-4 shrink-0" />
      ) : (
        <FileText className="h-4 w-4 shrink-0" />
      )}

      <span className="truncate">
        {opening ? "Opening..." : fileName}
      </span>
    </button>
  );
}