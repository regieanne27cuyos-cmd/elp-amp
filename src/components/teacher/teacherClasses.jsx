import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Layers,
  School,
} from "lucide-react";
import SubjectImage from "../subjectImage";

export function TeacherClassStats({
  classes = [],
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
        classes
          .map(
            (classRecord) =>
              classRecord.subject_id,
          )
          .filter(Boolean),
      ).size,
      icon: Layers,
    },
    {
      label: "Assigned Sections",
      value: new Set(
        classes
          .map(
            (classRecord) =>
              classRecord.section_id,
          )
          .filter(Boolean),
      ).size,
      icon: GraduationCap,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(
        ({
          label,
          value,
          icon: Icon,
        }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Icon className="h-5 w-5 text-blue-700" />
            </div>

            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {loading || error ? "—" : value}
            </p>
          </div>
        ),
      )}
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

  const subjectCode =
    classRecord.subject?.subject_code ||
    "No subject code";

  const gradeLevel =
    classRecord.section?.grade_level ||
    "—";

  const sectionName =
    classRecord.section?.section_name ||
    "Section unavailable";

  const schoolYear =
    classRecord.school_year?.name ||
    classRecord.section?.school_year
      ?.name ||
    "School year unavailable";

  const cardContent = (
    <>
      <div className="relative overflow-hidden">
        <SubjectImage
          path={
            classRecord.subject?.image_path
          }
          name={subjectName}
          className="h-44 w-full transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent" />

        <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-blue-700 shadow-sm backdrop-blur">
          {subjectCode}
        </span>

        {onOpenClass && (
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-blue-700 opacity-0 shadow-sm backdrop-blur transition duration-200 group-hover:opacity-100">
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-12 font-extrabold leading-6 text-slate-900">
          {subjectName}
        </h3>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <GraduationCap className="h-4 w-4 shrink-0 text-blue-600" />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Section
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                Grade {gradeLevel}
                {" · "}
                {sectionName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <School className="h-4 w-4 shrink-0 text-cyan-600" />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                School year
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                {schoolYear}
              </p>
            </div>
          </div>
        </div>

        {onOpenClass && (
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-700 transition-colors group-hover:bg-blue-700 group-hover:text-white">
              Open class

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!onOpenClass) {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        {cardContent}
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        onOpenClass(classRecord)
      }
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label={`Open ${subjectName}`}
    >
      {cardContent}
    </button>
  );
}

export default function TeacherClasses({
  classes = [],
  loading,
  error,
  onRetry,
  onOpenClass,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <BookOpen className="h-5 w-5 animate-pulse text-blue-700" />
        </div>

        <p className="mt-3 text-sm font-medium text-slate-500">
          Loading your assigned classes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
      >
        <p>{error}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-bold underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
          <BookOpen className="h-7 w-7 text-slate-300" />
        </div>

        <p className="mt-4 font-bold text-slate-700">
          No assigned classes
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Your administrator can assign subjects and
          sections to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-3">
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