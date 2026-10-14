import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
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

function ClassCard({
  classRecord,
  onOpen,
}) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  return (
    <button
      type="button"
      onClick={() => onOpen(classRecord)}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
      aria-label={`Open ${subjectName}`}
    >
      <SubjectImage
        path={classRecord.subject?.image_path}
        name={subjectName}
        className="h-48 w-full"
      />

      <div className="p-4">
        <p className="text-xs font-medium text-blue-600">
          {classRecord.subject?.subject_code ||
            "No subject code"}
        </p>

        <h2 className="mt-1 font-semibold text-gray-900">
          {subjectName}
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

            <div>
              <p className="text-xs text-gray-400">
                Section
              </p>

              <p className="text-gray-700">
                Grade{" "}
                {classRecord.section
                  ?.grade_level || "—"}
                {" · "}
                {classRecord.section
                  ?.section_name ||
                  "Section unavailable"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

            <div>
              <p className="text-xs text-gray-400">
                Teacher
              </p>

              <p className="text-gray-700">
                {classRecord.teacher?.profile
                  ?.full_name ||
                  "Teacher unavailable"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 py-2 text-center text-sm font-medium text-blue-600">
          Open class
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
        ]
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            My Classes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Open a subject to view its
            activities, modules, and grades.
          </p>
        </div>

        <button
          type="button"
          onClick={loadClasses}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search subject, code, or teacher..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="flex min-h-64 items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading your classes...
        </div>
      )}

      {!loading &&
        visibleClasses.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-gray-300" />

            <p className="mt-3 font-medium text-gray-700">
              No classes match your search.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        classes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-gray-300" />

            <p className="mt-3 font-medium text-gray-700">
              No assigned classes yet.
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Classes will appear when
              teachers are assigned to your
              section.
            </p>
          </div>
        )}
    </div>
  );
}