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
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium capitalize text-gray-700">
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
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <SubjectImage
        path={classRecord.subject?.image_path}
        name={subjectName}
        className="h-28 w-full"
      />

      <div className="p-4">
        <p className="text-xs font-medium text-blue-600">
          {classRecord.subject?.subject_code ||
            "No subject code"}
        </p>

        <h3 className="mt-1 font-semibold text-gray-900">
          {subjectName}
        </h3>

        <p className="mt-2 text-xs capitalize text-gray-500">
          {classRecord.subject?.subject_type ||
            "Subject"}
        </p>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            Assigned section
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700">
            Grade{" "}
            {classRecord.section?.grade_level ||
              "—"}
            {" · "}
            {classRecord.section?.section_name ||
              "Section unavailable"}
          </p>
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-400">
            School year
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700">
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
    classes,
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
        classes.map(
          (classRecord) =>
            classRecord.subject_id ||
            classRecord.subject?.id,
        ),
      ).size,
    [classes],
  );

  const assignedSectionCount = useMemo(
    () =>
      new Set(
        classes.map(
          (classRecord) =>
            classRecord.section_id ||
            classRecord.section?.id,
        ),
      ).size,
    [classes],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">
          Teacher Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View your account information and assigned
          classes.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />

        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-35 w-35 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-sm">
              {getInitials(
                teacherProfile?.full_name,
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-xl font-bold text-gray-900">
                {teacherProfile?.full_name ||
                  "Teacher"}
              </h2>

              <p className="mt-1 text-sm font-medium text-blue-600">
                {teacherProfile?.teacher_number ||
                  "No teacher number"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {formatEmploymentType(
                  teacherProfile?.employment_type,
                )}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                teacherProfile?.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {teacherProfile?.status || "Unknown"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-bold text-gray-900">
            Teacher Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
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
            value={teacherProfile?.teacher_number}
          />

          <InformationItem
            icon={Phone}
            label="Contact number"
            value={teacherProfile?.contact_number}
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

        <p className="mt-4 text-xs text-gray-400">
          Contact your administrator if this
          information needs to be corrected.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">
              Assigned Classes
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Subjects and sections currently assigned
              to you
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
              {assignedSubjectCount} subject
              {assignedSubjectCount === 1
                ? ""
                : "s"}
            </span>

            <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600">
              {assignedSectionCount} section
              {assignedSectionCount === 1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-48 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
                Loading assigned classes...
              </p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          assignedClasses.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No assigned classes
              </p>

              <p className="mt-1 text-xs text-gray-400">
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