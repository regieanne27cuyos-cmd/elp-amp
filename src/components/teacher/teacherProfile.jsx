import { useMemo } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import useTeacherClasses from "../../hooks/useTeacherClasses";
import SubjectImage from "../subjectImage";

function getInitials(name) {
  if (!name) return "TC";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatEmploymentType(value) {
  if (value === "full_time") {
    return "Full-time Teacher";
  }

  if (value === "part_time") {
    return "Part-time Teacher";
  }

  return value
    ? value.replaceAll("_", " ")
    : "Teacher";
}

function InformationItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
        <Icon className="h-4 w-4 text-blue-700" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold capitalize text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function ClassCard({ classRecord }) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <SubjectImage
        path={classRecord.subject?.image_path}
        name={subjectName}
        className="h-32 w-full"
      />

      <div className="p-4">
        <p className="text-xs font-bold text-blue-600">
          {classRecord.subject?.subject_code ||
            "No subject code"}
        </p>

        <h3 className="mt-1 font-bold text-slate-900">
          {subjectName}
        </h3>

        <p className="mt-2 text-xs capitalize text-slate-500">
          {classRecord.subject?.subject_type ||
            "Subject"}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">
            Assigned section
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Grade{" "}
            {classRecord.section?.grade_level ||
              "—"}
            {" · "}
            {classRecord.section?.section_name ||
              "Section unavailable"}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-xs text-slate-400">
            School year
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {classRecord.school_year?.name ||
              "School year unavailable"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function TeacherProfile({
  teacherProfile,
}) {
  const {
    classes = [],
    loading,
    error,
  } = useTeacherClasses();

  const assignedClasses = useMemo(() => {
    return [...classes].sort((first, second) => {
      const firstSubject =
        first.subject?.subject_name || "";

      const secondSubject =
        second.subject?.subject_name || "";

      return firstSubject.localeCompare(
        secondSubject,
      );
    });
  }, [classes]);

  const assignedSubjectCount = useMemo(
    () =>
      new Set(
        classes
          .map(
            (classRecord) =>
              classRecord.subject_id ||
              classRecord.subject?.id,
          )
          .filter(Boolean),
      ).size,
    [classes],
  );

  const assignedSectionCount = useMemo(
    () =>
      new Set(
        classes
          .map(
            (classRecord) =>
              classRecord.section_id ||
              classRecord.section?.id,
          )
          .filter(Boolean),
      ).size,
    [classes],
  );

  const isActive =
    teacherProfile?.status === "active";

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-xl font-extrabold text-slate-900">
          Teacher Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your account information and assigned
          classes.
        </p>
      </header>

      {/* Teacher identity */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-500">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-[40%] h-48 w-48 rounded-full bg-white/10"
          />
        </div>

        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative z-10 flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-2xl font-extrabold text-blue-700 shadow-md">
              {getInitials(
                teacherProfile?.full_name,
              )}
            </div>

            <div className="min-w-0 flex-1 pt-1 sm:pt-14">
              <h2 className="truncate text-xl font-extrabold text-slate-900">
                {teacherProfile?.full_name ||
                  "Teacher"}
              </h2>

              <p className="mt-1 text-sm font-bold text-blue-600">
                {teacherProfile?.teacher_number ||
                  "No teacher number"}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {formatEmploymentType(
                  teacherProfile?.employment_type,
                )}
              </p>
            </div>

            <span
              className={`mt-1 w-fit rounded-full border px-3 py-1.5 text-xs font-bold capitalize sm:mt-14 ${isActive
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
            >
              <span
                className={`mr-1.5 inline-block h-2 w-2 rounded-full ${isActive
                    ? "bg-green-500"
                    : "bg-slate-400"
                  }`}
              />

              {teacherProfile?.status ||
                "Unknown"}
            </span>
          </div>
        </div>
      </section>

      {/* Teacher information */}
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-extrabold text-slate-900">
            Teacher Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Information registered by the school
            administrator
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InformationItem
            icon={User}
            label="Full name"
            value={teacherProfile?.full_name}
          />

          <InformationItem
            icon={Mail}
            label="School email"
            value={teacherProfile?.email}
          />

          <InformationItem
            icon={GraduationCap}
            label="Teacher number"
            value={
              teacherProfile?.teacher_number
            }
          />

          <InformationItem
            icon={Phone}
            label="Contact number"
            value={
              teacherProfile?.contact_number
            }
          />

          <InformationItem
            icon={BriefcaseBusiness}
            label="Employment type"
            value={formatEmploymentType(
              teacherProfile?.employment_type,
            )}
          />

          <InformationItem
            icon={ShieldCheck}
            label="Account role"
            value="Teacher"
          />

          {teacherProfile?.specialization && (
            <InformationItem
              icon={BookOpen}
              label="Specialization"
              value={
                teacherProfile.specialization
              }
            />
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

          <p className="text-xs leading-5 text-blue-700">
            Contact your administrator if this
            information needs to be corrected.
          </p>
        </div>
      </section>

      {/* Assigned classes */}
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900">
              Assigned Classes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subjects and sections currently assigned
              to you
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {assignedSubjectCount}{" "}
              {assignedSubjectCount === 1
                ? "subject"
                : "subjects"}
            </span>

            <span className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
              {assignedSectionCount}{" "}
              {assignedSectionCount === 1
                ? "section"
                : "sections"}
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
              </div>

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading assigned classes...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          assignedClasses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <BookOpen className="h-7 w-7 text-slate-300" />
              </div>

              <p className="mt-4 text-sm font-bold text-slate-700">
                No assigned classes
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                Your classes will appear after an
                administrator assigns subjects and
                sections to you.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          assignedClasses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assignedClasses.map(
                (classRecord) => (
                  <ClassCard
                    key={classRecord.id}
                    classRecord={classRecord}
                  />
                ),
              )}
            </div>
          )}
      </section>
    </div>
  );
}