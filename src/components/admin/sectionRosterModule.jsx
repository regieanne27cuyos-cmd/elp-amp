import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { StatusBadge } from "./adminUI";

function normalizeRelation(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeSection(section) {
  return {
    ...section,
    strand: normalizeRelation(section.strand),
    school_year: normalizeRelation(
      section.school_year,
    ),
  };
}

function normalizeStudent(student) {
  return {
    ...student,
    profile: normalizeRelation(student.profile),
  };
}

function getInitials(name) {
  if (!name) return "ST";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getErrorMessage(error, fallback) {
  if (
    error?.code === "42501" ||
    error?.message
      ?.toLowerCase()
      .includes("permission")
  ) {
    return "You are not allowed to manage section rosters.";
  }

  return error?.message || fallback;
}

function StudentIdentity({ student }) {
  const fullName =
    student.profile?.full_name ||
    "Unnamed student";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
        {getInitials(fullName)}
      </div>

      <div className="min-w-0">
        <p className="font-medium text-gray-900">
          {fullName}
        </p>

        <p className="truncate text-xs text-gray-400">
          {student.profile?.email || "No email"}
        </p>
      </div>
    </div>
  );
}

function AddStudentsModal({
  section,
  candidates,
  selectedIds,
  search,
  saving,
  currentStudentCount,
  normalAvailableSlots,
  maximumAvailableSlots,
  overrideCapacity,
  onOverrideCapacityChange,
  onSearchChange,
  onToggle,
  onSelectAll,
  onClear,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-bold text-gray-900">
              Add Students
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add unassigned students to Grade{" "}
              {section.grade_level} ·{" "}
              {section.section_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close add students dialog"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">
                Current students
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {currentStudentCount}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">
                Normal capacity
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                40
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-400">
                Available slots
              </p>

              <p className="mt-1 text-lg font-bold text-blue-600">
                {maximumAvailableSlots}
              </p>
            </div>
          </div>

          {currentStudentCount === 40 && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input
                type="checkbox"
                checked={overrideCapacity}
                onChange={(event) =>
                  onOverrideCapacityChange(
                    event.target.checked,
                  )
                }
                disabled={saving}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Override section capacity
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  The section already has 40 students.
                  Enable this option to add one additional
                  student. The absolute maximum is 41.
                </p>
              </div>
            </label>
          )}

          {currentStudentCount >= 41 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              This section has reached the override limit of
              41 students. Remove a student before adding
              another one.
            </div>
          )}

          {currentStudentCount < 40 && (
            <p className="mt-3 text-xs text-gray-500">
              This section has {normalAvailableSlots} normal{" "}
              slot
              {normalAvailableSlots === 1 ? "" : "s"}{" "}
              remaining.
            </p>
          )}

          <div className="relative mt-4">
            <label
              htmlFor="available-student-search"
              className="sr-only"
            >
              Search available students
            </label>

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              id="available-student-search"
              type="search"
              value={search}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Search student name, number, or email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {selectedIds.length} selected
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  onSelectAll(maximumAvailableSlots)
                }
                disabled={
                  candidates.length === 0 ||
                  saving ||
                  maximumAvailableSlots === 0
                }
                className="text-sm font-medium text-blue-600 hover:underline disabled:text-gray-300"
              >
                Select all results
              </button>

              <button
                type="button"
                onClick={onClear}
                disabled={
                  selectedIds.length === 0 || saving
                }
                className="text-sm font-medium text-gray-500 hover:underline disabled:text-gray-300"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="w-14 px-4 py-3">
                    Select
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Student Number
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Student
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {candidates.map((student) => {
                  const checked =
                    selectedIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className="border-t border-gray-100"
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={saving}
                          onChange={() =>
                            onToggle(student.id)
                          }
                          aria-label={`Select ${student.profile
                            ?.full_name ||
                            student.student_number
                            }`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-600">
                        {student.student_number ||
                          "—"}
                      </td>

                      <td className="px-4 py-3">
                        <StudentIdentity
                          student={student}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            student.profile?.status
                          }
                        />
                      </td>
                    </tr>
                  );
                })}

                {candidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No unassigned students match
                      your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              saving ||
              selectedIds.length === 0 ||
              maximumAvailableSlots === 0 ||
              selectedIds.length >
              maximumAvailableSlots
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}

            {saving
              ? "Adding..."
              : `Add ${selectedIds.length} Student${selectedIds.length === 1
                ? ""
                : "s"
              }`}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function SectionRosterModule() {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedSectionId, setSelectedSectionId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [sectionSearch, setSectionSearch] =
    useState("");

  const [rosterSearch, setRosterSearch] =
    useState("");

  const [selectedRosterIds, setSelectedRosterIds] =
    useState([]);

  const [addModalOpen, setAddModalOpen] =
    useState(false);

  const [addSearch, setAddSearch] = useState("");

  const [selectedAddIds, setSelectedAddIds] =
    useState([]);

  const [
    overrideSectionCapacity,
    setOverrideSectionCapacity,
  ] = useState(false);

  async function loadData() {
    setLoading(true);
    setPageError("");

    try {
      const [sectionsResult, studentsResult] =
        await Promise.all([
          supabase
            .from("sections")
            .select(`
              id,
              section_name,
              grade_level,
              strand_id,
              school_year_id,
              status,
              strand:strands (
                id,
                code,
                name
              ),
              school_year:school_years (
                id,
                name
              )
            `)
            .order("section_name", {
              ascending: true,
            }),

          supabase
            .from("student_details")
            .select(`
              id,
              student_number,
              section_id,
              contact_number,
              profile:profiles!student_details_id_fkey (
                id,
                full_name,
                email,
                role,
                status
              )
            `)
            .order("student_number", {
              ascending: true,
            }),
        ]);

      if (sectionsResult.error) {
        throw sectionsResult.error;
      }

      if (studentsResult.error) {
        throw studentsResult.error;
      }

      setSections(
        (sectionsResult.data || [])
          .map(normalizeSection)
          .sort((first, second) => {
            const firstStrand =
              first.strand?.code || "ZZZ";

            const secondStrand =
              second.strand?.code || "ZZZ";

            const strandComparison =
              firstStrand.localeCompare(
                secondStrand,
                undefined,
                { numeric: true },
              );

            if (strandComparison !== 0) {
              return strandComparison;
            }

            return String(
              first.section_name || "",
            ).localeCompare(
              String(second.section_name || ""),
              undefined,
              { numeric: true },
            );
          }),
      );

      setStudents(
        (studentsResult.data || [])
          .map(normalizeStudent)
          .filter(
            (student) =>
              student.profile?.role === "student",
          ),
      );
    } catch (loadError) {
      console.error(
        "Failed to load section rosters:",
        loadError,
      );

      setPageError(
        getErrorMessage(
          loadError,
          "Unable to load section rosters.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedSection = useMemo(
    () =>
      sections.find(
        (section) =>
          section.id === selectedSectionId,
      ) || null,
    [sections, selectedSectionId],
  );

  const sectionCounts = useMemo(() => {
    const counts = new Map();

    students.forEach((student) => {
      if (!student.section_id) return;

      counts.set(
        student.section_id,
        (counts.get(student.section_id) || 0) +
        1,
      );
    });

    return counts;
  }, [students]);

  const selectedSectionStudentCount =
    selectedSection
      ? sectionCounts.get(selectedSection.id) || 0
      : 0;

  const normalAvailableSlots = Math.max(
    0,
    40 - selectedSectionStudentCount,
  );

  const maximumAvailableSlots = Math.max(
    0,
    (overrideSectionCapacity ? 41 : 40) -
    selectedSectionStudentCount,
  );

  const sectionReachedOverrideLimit =
    selectedSectionStudentCount >= 41;

  const filteredSections = useMemo(() => {
    const query = sectionSearch
      .trim()
      .toLowerCase();

    if (!query) return sections;

    return sections.filter((section) =>
      [
        section.section_name,
        section.grade_level,
        section.strand?.code,
        section.strand?.name,
        section.school_year?.name,
        section.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sections, sectionSearch]);

  const rosterStudents = useMemo(() => {
    if (!selectedSectionId) return [];

    return students
      .filter(
        (student) =>
          student.section_id ===
          selectedSectionId,
      )
      .sort((first, second) =>
        String(
          first.profile?.full_name || "",
        ).localeCompare(
          String(
            second.profile?.full_name || "",
          ),
        ),
      );
  }, [students, selectedSectionId]);

  const filteredRosterStudents = useMemo(() => {
    const query = rosterSearch
      .trim()
      .toLowerCase();

    if (!query) return rosterStudents;

    return rosterStudents.filter((student) =>
      [
        student.student_number,
        student.profile?.full_name,
        student.profile?.email,
        student.contact_number,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rosterStudents, rosterSearch]);

  const availableStudents = useMemo(() => {
    const query = addSearch.trim().toLowerCase();

    return students
      .filter(
        (student) =>
          !student.section_id &&
          student.profile?.status === "active",
      )
      .filter((student) => {
        if (!query) return true;

        return [
          student.student_number,
          student.profile?.full_name,
          student.profile?.email,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) =>
        String(
          first.profile?.full_name || "",
        ).localeCompare(
          String(
            second.profile?.full_name || "",
          ),
        ),
      );
  }, [students, addSearch]);

  function openSection(sectionId) {
    setSelectedSectionId(sectionId);
    setRosterSearch("");
    setSelectedRosterIds([]);
    setSuccessMessage("");
    setPageError("");
  }

  function closeSection() {
    setSelectedSectionId("");
    setRosterSearch("");
    setSelectedRosterIds([]);
    setSuccessMessage("");
    setPageError("");
  }

  function toggleRosterStudent(studentId) {
    setSelectedRosterIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function selectAllAddCandidates(maximum) {
    const availableIds = availableStudents
      .slice(0, maximum)
      .map((student) => student.id);

    setSelectedAddIds(availableIds);
    setPageError("");
  }

  function toggleAddStudent(studentId) {
    setSelectedAddIds((current) => {
      if (current.includes(studentId)) {
        return current.filter(
          (id) => id !== studentId,
        );
      }

      if (
        current.length >= maximumAvailableSlots
      ) {
        setPageError(
          overrideSectionCapacity
            ? "The section can only have a maximum of 41 students."
            : "The normal section capacity is 40 students.",
        );

        return current;
      }

      setPageError("");

      return [...current, studentId];
    });
  }

  function openAddStudents() {
    if (!selectedSection) return;

    setAddSearch("");
    setSelectedAddIds([]);
    setOverrideSectionCapacity(false);
    setSuccessMessage("");
    setPageError("");
    setAddModalOpen(true);
  }

  function closeAddStudents() {
    if (saving) return;

    setAddModalOpen(false);
    setAddSearch("");
    setSelectedAddIds([]);
    setOverrideSectionCapacity(false);
  }

  async function addStudentsToSection() {
    if (
      !selectedSection ||
      selectedAddIds.length === 0
    ) {
      return;
    }

    if (
      selectedAddIds.length >
      maximumAvailableSlots
    ) {
      const availableWord =
        maximumAvailableSlots === 1
          ? "student"
          : "students";

      setPageError(
        overrideSectionCapacity
          ? `You can only add ${maximumAvailableSlots} more ${availableWord}. The override maximum is 41 students.`
          : `You can only add ${normalAvailableSlots} more ${availableWord}. The normal section capacity is 40 students.`,
      );

      return;
    }

    setSaving(true);
    setPageError("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "admin_assign_students_to_section",
        {
          p_section_id: selectedSection.id,
          p_student_ids: selectedAddIds,
          p_override_capacity:
            overrideSectionCapacity,
        },
      );

      if (error) throw error;

      const selectedIds = new Set(
        selectedAddIds,
      );

      setStudents((current) =>
        current.map((student) =>
          selectedIds.has(student.id)
            ? {
              ...student,
              section_id: selectedSection.id,
            }
            : student,
        ),
      );

      setSuccessMessage(
        `${data || selectedAddIds.length} student${Number(data) === 1 ? "" : "s"
        } added to ${selectedSection.section_name}.`,
      );

      closeAddStudents();
    } catch (addError) {
      console.error(
        "Failed to add students to section:",
        addError,
      );

      setPageError(
        getErrorMessage(
          addError,
          "Unable to add the selected students.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeSelectedStudents() {
    if (
      !selectedSection ||
      selectedRosterIds.length === 0
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${selectedRosterIds.length} student${selectedRosterIds.length === 1
        ? ""
        : "s"
      } from ${selectedSection.section_name}? Their accounts will not be deleted.`,
    );

    if (!confirmed) return;

    setSaving(true);
    setPageError("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "admin_unassign_students_from_section",
        {
          p_section_id: selectedSection.id,
          p_student_ids: selectedRosterIds,
        },
      );

      if (error) throw error;

      const removedIds = new Set(
        selectedRosterIds,
      );

      setStudents((current) =>
        current.map((student) =>
          removedIds.has(student.id)
            ? {
              ...student,
              section_id: null,
            }
            : student,
        ),
      );

      setSelectedRosterIds([]);

      setSuccessMessage(
        `${data || removedIds.size} student${Number(data) === 1 ? "" : "s"
        } removed from the section. Their accounts remain active.`,
      );
    } catch (removeError) {
      console.error(
        "Failed to remove students from section:",
        removeError,
      );

      setPageError(
        getErrorMessage(
          removeError,
          "Unable to remove the selected students.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading section rosters...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedSection) {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Section Rosters
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View each section and manage its
              enrolled students.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {pageError && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <div className="relative max-w-xl">
          <label
            htmlFor="section-roster-search"
            className="sr-only"
          >
            Search sections
          </label>

          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            id="section-roster-search"
            type="search"
            value={sectionSearch}
            onChange={(event) =>
              setSectionSearch(event.target.value)
            }
            placeholder="Search section, strand, or school year..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-5 py-3 font-medium">
                  Section
                </th>

                <th className="px-5 py-3 font-medium">
                  Strand
                </th>

                <th className="px-5 py-3 font-medium">
                  School Year
                </th>

                <th className="px-5 py-3 font-medium">
                  Students
                </th>

                <th className="px-5 py-3 font-medium">
                  Status
                </th>

                <th className="px-5 py-3 text-right font-medium">
                  Open
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSections.map((section) => (
                <tr
                  key={section.id}
                  className="border-t border-gray-100"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">
                      {section.section_name}
                    </p>

                    <p className="text-xs text-gray-400">
                      Grade {section.grade_level}
                    </p>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {section.strand
                      ? `${section.strand.code} — ${section.strand.name}`
                      : "Not assigned"}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {section.school_year?.name ||
                      "Not assigned"}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {sectionCounts.get(
                        section.id,
                      ) || 0}{" "}
                      students
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge
                      status={section.status}
                    />
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        openSection(section.id)
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-blue-600 hover:bg-blue-50"
                    >
                      View roster
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSections.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    No sections match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={closeSection}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sections
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <UsersRound className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedSection.section_name}
              </h1>

              <p className="text-sm text-gray-500">
                Grade {selectedSection.grade_level}
                {" · "}
                {selectedSection.strand?.code ||
                  "No strand"}
                {" · "}
                {selectedSection.school_year
                  ?.name || "No school year"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            {rosterStudents.length} enrolled student
            {rosterStudents.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddStudents}
          disabled={
            selectedSection.status !== "active" ||
            saving
          }
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          Add Students
        </button>
      </header>

      {pageError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="w-full max-w-xl">
          <label
            htmlFor="roster-student-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search enrolled students
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              id="roster-student-search"
              type="search"
              value={rosterSearch}
              onChange={(event) =>
                setRosterSearch(event.target.value)
              }
              placeholder="Search name, student number, or email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={removeSelectedStudents}
          disabled={
            saving ||
            selectedRosterIds.length === 0
          }
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4" />
          )}

          Remove Selected
          {selectedRosterIds.length > 0 &&
            ` (${selectedRosterIds.length})`}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="w-14 px-5 py-3">
                <input
                  type="checkbox"
                  checked={
                    filteredRosterStudents.length >
                    0 &&
                    filteredRosterStudents.every(
                      (student) =>
                        selectedRosterIds.includes(
                          student.id,
                        ),
                    )
                  }
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAllVisibleRosterStudents();
                    } else {
                      const visibleIds = new Set(
                        filteredRosterStudents.map(
                          (student) => student.id,
                        ),
                      );

                      setSelectedRosterIds(
                        (current) =>
                          current.filter(
                            (id) =>
                              !visibleIds.has(id),
                          ),
                      );
                    }
                  }}
                  aria-label="Select all displayed students"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
              </th>

              <th className="px-5 py-3 font-medium">
                Student Number
              </th>

              <th className="px-5 py-3 font-medium">
                Student
              </th>

              <th className="px-5 py-3 font-medium">
                Contact
              </th>

              <th className="px-5 py-3 font-medium">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredRosterStudents.map(
              (student) => (
                <tr
                  key={student.id}
                  className="border-t border-gray-100"
                >
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedRosterIds.includes(
                        student.id,
                      )}
                      onChange={() =>
                        toggleRosterStudent(
                          student.id,
                        )
                      }
                      aria-label={`Select ${student.profile
                        ?.full_name ||
                        student.student_number
                        }`}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                  </td>

                  <td className="px-5 py-3.5 font-medium text-gray-600">
                    {student.student_number || "—"}
                  </td>

                  <td className="px-5 py-3.5">
                    <StudentIdentity
                      student={student}
                    />
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {student.contact_number ||
                      "Not provided"}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge
                      status={
                        student.profile?.status
                      }
                    />
                  </td>
                </tr>
              ),
            )}

            {filteredRosterStudents.length ===
              0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-400"
                  >
                    {rosterStudents.length === 0
                      ? "No students are currently enrolled in this section."
                      : "No students match your search."}
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {addModalOpen && selectedSection && (
        <AddStudentsModal
          section={selectedSection}
          candidates={availableStudents}
          selectedIds={selectedAddIds}
          search={addSearch}
          saving={saving}
          currentStudentCount={
            selectedSectionStudentCount
          }
          normalAvailableSlots={
            normalAvailableSlots
          }
          maximumAvailableSlots={
            maximumAvailableSlots
          }
          overrideCapacity={
            overrideSectionCapacity
          }
          onOverrideCapacityChange={(checked) => {
            setOverrideSectionCapacity(checked);
            setSelectedAddIds([]);
            setPageError("");
          }}
          onSearchChange={setAddSearch}
          onToggle={toggleAddStudent}
          onSelectAll={selectAllAddCandidates}
          onClear={() => {
            setSelectedAddIds([]);
            setPageError("");
          }}
          onClose={closeAddStudents}
          onSubmit={addStudentsToSection}
        />
      )}
    </div>
  );
}