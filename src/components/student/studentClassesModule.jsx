import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import SubjectImage from "../subjectImage";
import StudentClassWorkspace from "./studentClassWorkspace";

function normalize(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeClass(classRecord) {
  const teacher = normalize(
    classRecord.teacher,
  );

  return {
    ...classRecord,
    subject: normalize(classRecord.subject),
    section: normalize(classRecord.section),
    school_year: normalize(
      classRecord.school_year,
    ),
    teacher: teacher
      ? {
          ...teacher,
          profile: normalize(teacher.profile),
        }
      : null,
  };
}

function formatSubjectType(value) {
  if (!value) return "Subject";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function ClassCard({
  classRecord,
  onOpen,
}) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  const subjectCode =
    classRecord.subject?.subject_code ||
    "No subject code";

  const subjectType = formatSubjectType(
    classRecord.subject?.subject_type,
  );

  const gradeLevel =
    classRecord.section?.grade_level ||
    "—";

  const sectionName =
    classRecord.section?.section_name ||
    "Section unavailable";

  const teacherName =
    classRecord.teacher?.profile
      ?.full_name ||
    classRecord.teacher?.full_name ||
    "Teacher unavailable";

  const schoolYear =
    classRecord.school_year?.name ||
    classRecord.section?.school_year
      ?.name ||
    "School year unavailable";

  return (
    <button
      type="button"
      onClick={() => onOpen(classRecord)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label={`Open ${subjectName}`}
    >
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

        <span className="absolute right-3 top-3 rounded-lg border border-white/20 bg-slate-950/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {subjectType}
        </span>

        <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-blue-700 opacity-0 shadow-sm backdrop-blur transition duration-200 group-hover:opacity-100">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 min-h-12 font-extrabold leading-6 text-slate-900">
          {subjectName}
        </h2>

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
            <UserRound className="h-4 w-4 shrink-0 text-cyan-600" />

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Teacher
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                {teacherName}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs font-medium text-slate-400">
          School year:{" "}
          <span className="font-bold text-slate-600">
            {schoolYear}
          </span>
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-700 transition-colors group-hover:bg-blue-700 group-hover:text-white">
            Open class

            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StudentClassesModule() {
  const [classes, setClasses] =
    useState([]);

  const [openedClass, setOpenedClass] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadClasses() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw (
          userError ||
          new Error(
            "Your session has expired.",
          )
        );
      }

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("student_details")
        .select("id, section_id")
        .eq("id", user.id)
        .single();

      if (studentError) {
        throw studentError;
      }

      if (!student.section_id) {
        setClasses([]);

        setError(
          "You are not assigned to a section yet.",
        );

        return;
      }

      const {
        data,
        error: classesError,
      } = await supabase
        .from("teaching_assignments")
        .select(`
          id,
          teacher_id,
          subject_id,
          section_id,
          school_year_id,
          status,

          subject:subjects!teaching_assignments_subject_id_fkey (
            id,
            subject_code,
            subject_name,
            subject_type,
            grade_level,
            image_path,
            status
          ),

          section:sections!teaching_assignments_section_id_fkey (
            id,
            section_name,
            grade_level,
            strand_id,
            school_year_id,
            status
          ),

          school_year:school_years!teaching_assignments_school_year_id_fkey (
            id,
            name,
            status
          ),

          teacher:teacher_details!teaching_assignments_teacher_id_fkey (
            id,
            teacher_number,

            profile:profiles!teacher_details_id_fkey (
              id,
              full_name,
              email,
              status
            )
          )
        `)
        .eq(
          "section_id",
          student.section_id,
        )
        .eq("status", "active");

      if (classesError) {
        throw classesError;
      }

      const normalized = (data || [])
        .map(normalizeClass)
        .filter(
          (classRecord) =>
            classRecord.subject?.status ===
              "active" &&
            classRecord.section?.status ===
              "active",
        )
        .sort((first, second) =>
          String(
            first.subject?.subject_name ||
              "",
          ).localeCompare(
            String(
              second.subject?.subject_name ||
                "",
            ),
          ),
        );

      setClasses(normalized);
    } catch (loadError) {
      console.error(
        "Failed to load student classes:",
        loadError,
      );

      setClasses([]);

      setError(
        loadError.message ||
          "Unable to load your classes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  const visibleClasses = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return classes;
    }

    return classes.filter(
      (classRecord) =>
        [
          classRecord.subject
            ?.subject_name,
          classRecord.subject
            ?.subject_code,
          classRecord.subject
            ?.subject_type,
          classRecord.teacher?.profile
            ?.full_name,
          classRecord.section
            ?.section_name,
          classRecord.school_year?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
  }, [classes, search]);

  if (openedClass) {
    return (
      <StudentClassWorkspace
        classRecord={openedClass}
        onBack={() =>
          setOpenedClass(null)
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
            Learning spaces
          </p>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            My Classes
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Open a subject to view its
            activities, modules, and grades.
          </p>
        </div>

        <button
          type="button"
          onClick={loadClasses}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search subject, code, teacher, or section..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading your classes...
            </p>
          </div>
        </div>
      )}

      {!loading &&
        visibleClasses.length > 0 && (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleClasses.map(
              (classRecord) => (
                <ClassCard
                  key={classRecord.id}
                  classRecord={classRecord}
                  onOpen={setOpenedClass}
                />
              ),
            )}
          </div>
        )}

      {!loading &&
        classes.length > 0 &&
        visibleClasses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <Search className="h-7 w-7 text-slate-300" />
            </div>

            <p className="mt-4 font-bold text-slate-700">
              No classes match your search.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Try searching with a different
              subject, code, teacher, or section.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Clear search
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        classes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <BookOpen className="h-7 w-7 text-slate-300" />
            </div>

            <p className="mt-4 font-bold text-slate-700">
              No assigned classes yet.
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">
              Classes will appear when teachers
              are assigned to your section.
            </p>
          </div>
        )}
    </div>
  );
}