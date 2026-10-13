import {
  BookOpen,
  GraduationCap,
  Layers,
} from "lucide-react";
import SubjectImage from "../subjectImage";

export function TeacherClassStats({
  classes,
  loading,
  error,
}) {
  const stats = [
    {
      label: "Active Class Assignments",
      value: classes.length,
      icon: BookOpen,
    },
    {
      label: "Assigned Subjects",
      value: new Set(
        classes.map(
          (classRecord) => classRecord.subject_id,
        ),
      ).size,
      icon: Layers,
    },
    {
      label: "Assigned Sections",
      value: new Set(
        classes.map(
          (classRecord) => classRecord.section_id,
        ),
      ).size,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>

          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading || error ? "—" : value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ClassCard({
  classRecord,
  onOpenClass,
}) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  const cardContent = (
    <>
      <SubjectImage
        path={classRecord.subject?.image_path}
        name={subjectName}
        className="h-80 w-full"
      />

      <div className="p-4">
        <p className="text-xs font-medium text-blue-600">
          {classRecord.subject?.subject_code || "—"}
        </p>

        <h3 className="mt-1 font-semibold text-gray-900">
          {subjectName}
        </h3>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-gray-400">
              Section
            </dt>

            <dd className="text-gray-700">
              Grade{" "}
              {classRecord.section?.grade_level ||
                "—"}
              {" · "}
              {classRecord.section?.section_name ||
                "Section unavailable"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-gray-400">
              School year
            </dt>

            <dd className="text-gray-700">
              {classRecord.school_year?.name ||
                "School year unavailable"}
            </dd>
          </div>
        </dl>

        {onOpenClass && (
          <div className="mt-4 rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-600">
            Open class
          </div>
        )}
      </div>
    </>
  );

  if (!onOpenClass) {
    return (
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {cardContent}
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenClass(classRecord)}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      aria-label={`Open ${subjectName}`}
    >
      {cardContent}
    </button>
  );
}

export default function TeacherClasses({
  classes,
  loading,
  error,
  onRetry,
  onOpenClass,
}) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 text-sm text-gray-500">
        Loading your assigned classes...
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
      >
        <p>{error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-medium underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
        No active teaching assignments yet. Your
        school administrator can assign subjects and
        sections to you.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {classes.map((classRecord) => (
        <ClassCard
          key={classRecord.id}
          classRecord={classRecord}
          onOpenClass={onOpenClass}
        />
      ))}
    </div>
  );
}