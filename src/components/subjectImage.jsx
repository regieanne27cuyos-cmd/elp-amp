import { useState } from "react";
import { BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";

export function getSubjectImageUrl(path) {
  if (!path) return "";

  return supabase.storage
    .from("subject-images")
    .getPublicUrl(path).data.publicUrl;
}

export default function SubjectImage({
  path,
  name,
  className = "h-32 w-full",
}) {
  const [failedPath, setFailedPath] = useState(null);
  const url = getSubjectImageUrl(path);

  return (
    <div
      className={`overflow-hidden bg-blue-600 ${className}`}
    >
      {url && failedPath !== path ? (
        <img
          src={url}
          alt={name || "Subject cover"}
          loading="lazy"
          onError={() => setFailedPath(path)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}