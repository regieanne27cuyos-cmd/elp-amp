import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  RefreshCw,
  Search,
} from "lucide-react";
import useTeacherClasses from "../../hooks/useTeacherClasses";
import TeacherClasses, {
  TeacherClassStats,
} from "./teacherClasses";
import TeacherClassWorkspace from "./teacherClassWorkspace";

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatSemester(value) {
  if (value === "first" || Number(value) === 1) {
    return "First Semester";
  }

  if (value === "second" || Number(value) === 2) {
    return "Second Semester";
  }

  return value || "Semester unavailable";
}

function uniqueOptions(records, idField, getLabel) {
  const options = new Map();

  records.forEach((record) => {
    const id = record[idField];

    if (id) {
      options.set(id, getLabel(record));
    }
  });

  return Array.from(
    options,
    ([value, label]) => ({
      value,
      label,
    }),
  ).sort((first, second) =>
    first.label.localeCompare(
      second.label,
      undefined,
      { numeric: true },
    ),
  );
}

export default function TeacherMyClasses() {
  const {
    classes,
    loading,
    error,
    reload,
  } = useTeacherClasses();

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [search, setSearch] = useState("");
  const [schoolYearId, setSchoolYearId] =
    useState("");
  const [semesterId, setSemesterId] =
    useState("");
  const [sectionId, setSectionId] =
    useState("");

  useEffect(() => {
    if (!selectedClass) return;

    const updatedClass = classes.find(
      (classRecord) =>
        classRecord.id === selectedClass.id,
    );

    if (updatedClass) {
      setSelectedClass(updatedClass);
    } else if (!loading) {
      setSelectedClass(null);
    }
  }, [classes, loading, selectedClass?.id]);

  const schoolYears = useMemo(
    () =>
      uniqueOptions(
        classes,
        "school_year_id",
        (record) =>
          record.school_year?.name ||
          "School year unavailable",
      ),
    [classes],
  );

  const yearClasses = useMemo(
    () =>
      classes.filter(
        (record) =>
          !schoolYearId ||
          record.school_year_id === schoolYearId,
      ),
    [classes, schoolYearId],
  );

  const semesters = useMemo(
    () =>
      uniqueOptions(
        yearClasses,
        "semester_id",
        (record) =>
          `${formatSemester(
            record.semester?.name,
          )} · ${
            record.school_year?.name ||
            "School year unavailable"
          }`,
      ),
    [yearClasses],
  );

  const termClasses = useMemo(
    () =>
      yearClasses.filter(
        (record) =>
          !semesterId ||
          record.semester_id === semesterId,
      ),
    [yearClasses, semesterId],
  );

  const sections = useMemo(
    () =>
      uniqueOptions(
        termClasses,
        "section_id",
        (record) =>
          `Grade ${
            record.section?.grade_level || "—"
          } · ${
            record.section?.section_name ||
            "Section unavailable"
          }`,
      ),
    [termClasses],
  );

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return termClasses
      .filter((record) => {
        if (
          sectionId &&
          record.section_id !== sectionId
        ) {
          return false;
        }

        if (!query) return true;

        const searchableText = [
          record.subject?.subject_name,
          record.subject?.subject_code,
          record.subject?.subject_type,
          record.section?.section_name,
          `Grade ${
            record.section?.grade_level || ""
          }`,
          record.school_year?.name,
          formatSemester(record.semester?.name),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort((first, second) =>
        (
          first.subject?.subject_name || ""
        ).localeCompare(
          second.subject?.subject_name || "",
        ),
      );
  }, [
    termClasses,
    sectionId,
    search,
  ]);

  const hasFilters = Boolean(
    search.trim() ||
      schoolYearId ||
      semesterId ||
      sectionId,
  );

  function clearFilters() {
    setSearch("");
    setSchoolYearId("");
    setSemesterId("");
    setSectionId("");
  }

  if (selectedClass) {
    return (
      <TeacherClassWorkspace
        classRecord={selectedClass}
        onBack={() => setSelectedClass(null)}
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
            Select an assigned subject to open its
            classroom.
          </p>
        </div>

        <button
          type="button"
          onClick={reload}
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

      <TeacherClassStats
        classes={classes}
        loading={loading}
        error={error}
      />

      <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div>
          <label
            htmlFor="my-classes-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search classes
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              id="my-classes-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subject name, code, or section..."
              className={`${selectClass} pl-9`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="class-year"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              School year
            </label>

            <select
              id="class-year"
              value={schoolYearId}
              onChange={(event) => {
                setSchoolYearId(event.target.value);
                setSemesterId("");
                setSectionId("");
              }}
              className={selectClass}
            >
              <option value="">
                All school years
              </option>

              {schoolYears.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="class-semester"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Semester
            </label>

            <select
              id="class-semester"
              value={semesterId}
              onChange={(event) => {
                setSemesterId(event.target.value);
                setSectionId("");
              }}
              className={selectClass}
            >
              <option value="">
                All semesters
              </option>

              {semesters.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="class-section"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Section
            </label>

            <select
              id="class-section"
              value={sectionId}
              onChange={(event) =>
                setSectionId(event.target.value)
              }
              className={selectClass}
            >
              <option value="">
                All sections
              </option>

              {sections.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </section>

      <section aria-labelledby="assigned-classes-heading">
        <div className="mb-4">
          <h2
            id="assigned-classes-heading"
            className="text-lg font-bold text-gray-900"
          >
            Assigned Classes
          </h2>

          {!loading && !error && (
            <p className="text-sm text-gray-500">
              Showing {filteredClasses.length} of{" "}
              {classes.length} active class assignments
            </p>
          )}
        </div>

        {!loading &&
        !error &&
        classes.length > 0 &&
        filteredClasses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-gray-300" />

            <p className="mt-3 font-medium text-gray-700">
              No classes match your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Show all classes
            </button>
          </div>
        ) : (
          <TeacherClasses
            classes={filteredClasses}
            loading={loading}
            error={error}
            onRetry={reload}
            onOpenClass={setSelectedClass}
          />
        )}
      </section>
    </div>
  );
}