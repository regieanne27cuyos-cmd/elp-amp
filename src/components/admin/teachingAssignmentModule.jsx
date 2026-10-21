import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  CheckSquare,
  Pencil,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import {
  Field,
  inputClass,
  Modal,
  SectionHeader,
  StatusBadge,
} from "./adminUI";

const emptyForm = {
  teacher_id: "",

  school_year_id: "",

  section_id: "",

  subject_ids: [],

  subject_id: "",

  status: "active",
};

function normalizeRelation(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeTeacher(teacher) {
  if (!teacher) return null;

  return {
    ...teacher,

    profile: normalizeRelation(teacher.profile),
  };
}

function normalizeAssignment(assignment) {
  return {
    ...assignment,

    teacher: normalizeTeacher(normalizeRelation(assignment.teacher)),

    subject: normalizeRelation(assignment.subject),

    section: normalizeRelation(assignment.section),

    school_year: normalizeRelation(assignment.school_year),
  };
}

export default function TeachingAssignmentModule() {
  const [assignments, setAssignments] = useState([]);

  const [options, setOptions] = useState({
    teachers: [],

    subjects: [],

    sections: [],

    schoolYears: [],
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");

  const [actionError, setActionError] = useState("");

  const [modalMode, setModalMode] = useState(null);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setLoading(true);

    setPageError("");

    try {
      const [
        assignmentsResult,

        teachersResult,

        subjectsResult,

        sectionsResult,

        schoolYearsResult,
      ] = await Promise.all([
        supabase

          .from("teaching_assignments")

          .select(
            `

            id,

            teacher_id,

            subject_id,

            section_id,

            school_year_id,

            status,

            created_at,

            updated_at,



            teacher:teacher_details!teaching_assignments_teacher_id_fkey (

              id,

              teacher_number,

              profile:profiles!teacher_details_id_fkey (

                full_name,

                email,

                status

              )

            ),



            subject:subjects!teaching_assignments_subject_id_fkey (

              id,

              subject_code,

              subject_name,

              grade_level,

              subject_type,

              strand_id,

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

            )

          `,
          )

          .order("created_at", {
            ascending: false,
          }),

        supabase

          .from("teacher_details")

          .select(
            `

            id,

            teacher_number,

            profile:profiles!teacher_details_id_fkey (

              full_name,

              email,

              status

            )

          `,
          )

          .order("teacher_number", {
            ascending: true,
          }),

        supabase

          .from("subjects")

          .select(
            `

            id,

            subject_code,

            subject_name,

            grade_level,

            subject_type,

            strand_id,

            status

          `,
          )

          .eq("status", "active")

          .order("subject_code", {
            ascending: true,
          }),

        supabase

          .from("sections")

          .select(
            `

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

            )

          `,
          )

          .eq("status", "active")

          .order("grade_level", {
            ascending: true,
          })

          .order("section_name", {
            ascending: true,
          }),

        supabase

          .from("school_years")

          .select(
            `

            id,

            name,

            start_date,

            end_date,

            status

          `,
          )

          .eq("status", "active")

          .order("start_date", {
            ascending: false,
          }),
      ]);

      const results = [
        assignmentsResult,

        teachersResult,

        subjectsResult,

        sectionsResult,

        schoolYearsResult,
      ];

      const failedResult = results.find((result) => result.error);

      if (failedResult?.error) {
        throw failedResult.error;
      }

      const teachers = (teachersResult.data || [])

        .map(normalizeTeacher)

        .filter((teacher) => teacher.profile?.status === "active");

      const sections = (sectionsResult.data || []).map((section) => ({
        ...section,

        strand: normalizeRelation(section.strand),
      }));

      setAssignments((assignmentsResult.data || []).map(normalizeAssignment));

      setOptions({
        teachers,

        subjects: subjectsResult.data || [],

        sections,

        schoolYears: schoolYearsResult.data || [],
      });
    } catch (error) {
      console.error(
        "Failed to load teaching assignments:",

        error,
      );

      setPageError(error.message || "Unable to load teaching assignments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);


  const activeSchoolYear =
    useMemo(() => {
      return (
        options.schoolYears.find(
          (schoolYear) =>
            schoolYear.status ===
            "active",
        ) ||
        options.schoolYears[0] ||
        null
      );
    }, [options.schoolYears]);

  const selectedSection = useMemo(
    () =>
      options.sections.find((section) => section.id === form.section_id) ||
      null,

    [options.sections, form.section_id],
  );

  const availableSections = useMemo(
    () =>
      options.sections.filter(
        (section) => section.school_year_id === form.school_year_id,
      ),

    [options.sections, form.school_year_id],
  );

  const availableSubjects = useMemo(() => {
    if (!selectedSection) {
      return [];
    }

    return options.subjects.filter((subject) => {
      const correctGrade =
        Number(subject.grade_level) === Number(selectedSection.grade_level);

      const correctStrand =
        !subject.strand_id || subject.strand_id === selectedSection.strand_id;

      return correctGrade && correctStrand;
    });
  }, [options.subjects, selectedSection]);

  const groupedAssignments = useMemo(() => {
    const normalizedSearch = searchTerm

      .trim()

      .toLowerCase();

    const filteredAssignments = assignments.filter((assignment) => {
      if (!normalizedSearch) return true;

      const searchableValues = [
        assignment.teacher?.profile?.full_name,

        assignment.teacher?.teacher_number,

        assignment.subject?.subject_name,

        assignment.subject?.subject_code,

        assignment.section?.section_name,

        assignment.school_year?.name,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()

          .includes(normalizedSearch),
      );
    });

    const groups = new Map();

    filteredAssignments.forEach((assignment) => {
      const teacherId = assignment.teacher_id;

      if (!groups.has(teacherId)) {
        groups.set(teacherId, {
          teacherId,

          teacher: assignment.teacher,

          assignments: [],
        });
      }

      groups

        .get(teacherId)

        .assignments.push(assignment);
    });

    return Array.from(groups.values()).sort((first, second) => {
      const firstName = first.teacher?.profile?.full_name || "";

      const secondName = second.teacher?.profile?.full_name || "";

      return firstName.localeCompare(secondName);
    });
  }, [assignments, searchTerm]);

  function updateField(field, value) {
    setForm((current) => {
      const updatedForm = {
        ...current,

        [field]: value,
      };

      if (field === "teacher_id") {
        updatedForm.subject_ids = [];
        updatedForm.subject_id = "";
      }

      if (field === "school_year_id") {
        updatedForm.section_id = "";

        updatedForm.subject_ids = [];

        updatedForm.subject_id = "";
      }

      if (field === "section_id") {
        updatedForm.subject_ids = [];

        updatedForm.subject_id = "";
      }

      return updatedForm;
    });
  }

  function toggleSubject(subjectId) {
    const conflict =
      findAssignmentConflict(subjectId);

    if (conflict) {
      setActionError(
        getAssignmentConflictMessage(
          conflict,
        ),
      );
      return;
    }

    setActionError("");

    setForm((current) => {
      const alreadySelected =
        current.subject_ids.includes(
          subjectId,
        );

      return {
        ...current,

        subject_ids: alreadySelected
          ? current.subject_ids.filter(
            (id) => id !== subjectId,
          )
          : [
            ...current.subject_ids,
            subjectId,
          ],
      };
    });
  }

  function selectAllSubjects() {
    const selectableSubjectIds =
      availableSubjects
        .filter(
          (subject) =>
            !findAssignmentConflict(
              subject.id,
            ),
        )
        .map((subject) => subject.id);

    setForm((current) => ({
      ...current,
      subject_ids:
        selectableSubjectIds,
    }));

    setActionError("");
  }

  function clearSubjects() {
    setForm((current) => ({
      ...current,

      subject_ids: [],
    }));
  }

  function openAddModal(
    teacherId = "",
  ) {
    if (!activeSchoolYear) {
      setPageError(
        "There is no active school year. Check the dates in Academic Setup before creating a teaching assignment.",
      );
      return;
    }

    setSelected(null);

    setForm({
      ...emptyForm,

      teacher_id: teacherId,

      school_year_id:
        activeSchoolYear.id,

      section_id: "",

      subject_ids: [],

      subject_id: "",

      status: "active",
    });

    setActionError("");
    setPageError("");
    setModalMode("add");
  }

  function openEditModal(assignment) {
    setSelected(assignment);

    setForm({
      teacher_id: assignment.teacher_id,

      school_year_id: assignment.school_year_id,

      section_id: assignment.section_id,

      subject_ids: [],

      subject_id: assignment.subject_id,

      status: assignment.status || "active",
    });

    setActionError("");

    setModalMode("edit");
  }

  function closeModal() {
    if (saving) return;

    setModalMode(null);

    setSelected(null);

    setForm({
      ...emptyForm,

      subject_ids: [],
    });

    setActionError("");
  }

  function findAssignmentConflict(
    subjectId,
    excludedAssignmentId = null,
  ) {
    return assignments.find(
      (assignment) =>
        assignment.id !==
        excludedAssignmentId &&
        assignment.subject_id ===
        subjectId &&
        assignment.section_id ===
        form.section_id &&
        assignment.school_year_id ===
        form.school_year_id,
    );
  }

  function getAssignmentConflictMessage(
    conflict,
  ) {
    const teacherName =
      conflict.teacher?.profile
        ?.full_name ||
      "Another teacher";

    const subjectName =
      conflict.subject?.subject_name ||
      "This subject";

    const sectionName =
      conflict.section?.section_name ||
      "the selected section";

    return `${subjectName} is already assigned to ${teacherName} in ${sectionName}. Remove or edit the existing assignment first.`;
  }

  function validateCommonFields() {
    if (!form.teacher_id) {
      throw new Error(
        "Select a teacher.",
      );
    }

    if (!form.school_year_id) {
      throw new Error(
        "There is no active school year. Configure the current school year in Academic Setup first.",
      );
    }

    if (!form.section_id) {
      throw new Error(
        "Select a section.",
      );
    }

    if (
      modalMode === "add" &&
      form.school_year_id !==
      activeSchoolYear?.id
    ) {
      throw new Error(
        "New teaching assignments can only be created for the active school year.",
      );
    }

    const section =
      options.sections.find(
        (item) =>
          item.id ===
          form.section_id,
      );

    if (!section) {
      throw new Error(
        "The selected section could not be found.",
      );
    }

    if (
      section.school_year_id !==
      form.school_year_id
    ) {
      throw new Error(
        "The selected section does not belong to the active school year.",
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setActionError("");

    try {
      validateCommonFields();

      if (modalMode === "edit") {
        if (!selected?.id) {
          throw new Error(
            "No teaching assignment was selected.",
          );
        }

        if (!form.subject_id) {
          throw new Error(
            "Select a subject.",
          );
        }

        const conflict =
          findAssignmentConflict(
            form.subject_id,
            selected.id,
          );

        if (conflict) {
          throw new Error(
            getAssignmentConflictMessage(
              conflict,
            ),
          );
        }

        const {
          error: updateError,
        } = await supabase
          .from(
            "teaching_assignments",
          )
          .update({
            teacher_id:
              form.teacher_id,

            subject_id:
              form.subject_id,

            section_id:
              form.section_id,

            school_year_id:
              form.school_year_id,

            status: form.status,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", selected.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        if (
          form.subject_ids.length === 0
        ) {
          throw new Error(
            "Select at least one subject.",
          );
        }

        const conflictingAssignments =
          form.subject_ids
            .map((subjectId) =>
              findAssignmentConflict(
                subjectId,
              ),
            )
            .filter(Boolean);

        if (
          conflictingAssignments.length >
          0
        ) {
          const conflict =
            conflictingAssignments[0];

          throw new Error(
            getAssignmentConflictMessage(
              conflict,
            ),
          );
        }

        const bulkAssignments =
          form.subject_ids.map(
            (subjectId) => ({
              teacher_id:
                form.teacher_id,

              subject_id:
                subjectId,

              section_id:
                form.section_id,

              school_year_id:
                form.school_year_id,

              status: form.status,
            }),
          );

        /*
         * Use insert instead of upsert.
         * An existing subject assignment
         * must produce an error rather than
         * silently changing the teacher.
         */
        const {
          error: insertError,
        } = await supabase
          .from(
            "teaching_assignments",
          )
          .insert(bulkAssignments);

        if (insertError) {
          throw insertError;
        }
      }

      await loadData();
      closeModal();
    } catch (saveError) {
      console.error(
        "Failed to save teaching assignments:",
        saveError,
      );

      if (saveError.code === "23505") {
        setActionError(
          "One or more selected subjects already have an assigned teacher in this section.",
        );
      } else if (
        saveError.code === "23503"
      ) {
        setActionError(
          "One of the selected teachers, subjects, sections, or school years no longer exists.",
        );
      } else {
        setActionError(
          saveError.message ||
          "Unable to save teaching assignments.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assignment) {
    const teacherName =
      assignment.teacher?.profile?.full_name || "this teacher";

    const subjectName = assignment.subject?.subject_name || "this subject";

    const confirmed = window.confirm(
      `Remove ${subjectName} from ${teacherName}?`,
    );

    if (!confirmed) return;

    setPageError("");

    const { error } = await supabase

      .from("teaching_assignments")

      .delete()

      .eq("id", assignment.id);

    if (error) {
      console.error(
        "Failed to delete teaching assignment:",

        error,
      );

      setPageError(
        error.message || "Unable to delete the teaching assignment.",
      );

      return;
    }

    setAssignments((current) =>
      current.filter((item) => item.id !== assignment.id),
    );
  }

  return (
    <div>
      <SectionHeader
        title="Teaching Assignments"
        count={assignments.length}
        addLabel="Assign Subjects"
        onAdd={() => openAddModal()}
      />

      <p className="-mt-3 mb-5 text-sm text-gray-500">
        One teacher can teach multiple subjects and sections.
      </p>

      {pageError && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {pageError}
        </div>
      )}

      <div className="relative mb-5 max-w-lg">
        <label htmlFor="assignment-search" className="sr-only">
          Search teaching assignments
        </label>

        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id="assignment-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search teacher, subject, section, or school year..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400"
        />
      </div>

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          Loading teaching assignments...
        </div>
      )}

      {!loading && groupedAssignments.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          {searchTerm
            ? "No teaching assignments match your search."
            : "No teaching assignments yet."}
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          {groupedAssignments.map((group) => (
            <section
              key={group.teacherId}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <UserRound className="h-5 w-5 text-blue-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {group.teacher?.profile?.full_name || "Unknown teacher"}
                    </h2>

                    <p className="text-xs text-gray-500">
                      {group.teacher?.teacher_number || "No teacher number"}
                      {" · "}
                      {group.assignments.length} subject
                      {group.assignments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openAddModal(group.teacherId)
                  }
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                >
                  <BookOpen className="h-4 w-4" />
                  Add more subjects
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-5 py-3 font-medium">Subject</th>

                      <th className="px-5 py-3 font-medium">Section</th>

                      <th className="px-5 py-3 font-medium">School Year</th>

                      <th className="px-5 py-3 font-medium">Status</th>

                      <th className="px-5 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.assignments.map((assignment) => (
                      <tr
                        key={assignment.id}
                        className="border-t border-gray-50"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">
                            {assignment.subject?.subject_name ||
                              "Unknown subject"}
                          </p>

                          <p className="text-xs text-gray-400">
                            {assignment.subject?.subject_code || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          Grade {assignment.section?.grade_level || "—"}
                          {" · "}
                          {assignment.section?.section_name || "—"}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600">
                          {assignment.school_year?.name || "—"}
                        </td>

                        <td className="px-5 py-3.5">
                          <StatusBadge status={assignment.status} />
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(assignment)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-slate-700"
                              aria-label="Edit teaching assignment"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(assignment)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete teaching assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {modalMode && (
        <Modal
          title={
            modalMode === "edit"
              ? "Edit Teaching Assignment"
              : "Assign Multiple Subjects"
          }
          onClose={closeModal}
          size="xl"
        >
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Teacher">
              <select
                className={inputClass}
                value={form.teacher_id}
                onChange={(event) =>
                  updateField(
                    "teacher_id",

                    event.target.value,
                  )
                }
                required
              >
                <option value="">Select teacher</option>

                {options.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.profile?.full_name || "Unnamed teacher"}

                    {" — "}

                    {teacher.teacher_number}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="School year">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                <p
                  className={`text-sm font-medium ${form.school_year_id
                    ? "text-gray-700"
                    : "text-red-500"
                    }`}
                >
                  {modalMode === "edit"
                    ? selected?.school_year
                      ?.name ||
                    activeSchoolYear?.name ||
                    "School year unavailable"
                    : activeSchoolYear?.name ||
                    "No active school year"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {modalMode === "edit"
                    ? "School year of this teaching assignment"
                    : "Selected automatically from the active school year"}
                </p>
              </div>
            </Field>

            <Field label="Section">
              <select
                className={inputClass}
                value={form.section_id}
                onChange={(event) =>
                  updateField(
                    "section_id",

                    event.target.value,
                  )
                }
                disabled={!form.school_year_id}
                required
              >
                <option value="">Select section</option>

                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    Grade {section.grade_level}
                    {" — "}
                    {section.section_name}
                    {" · "}
                    {section.strand?.code || "No strand"}
                  </option>
                ))}
              </select>
            </Field>

            {modalMode === "edit" ? (
              <Field label="Subject">
                <select
                  className={inputClass}
                  value={form.subject_id}
                  onChange={(event) => {
                    updateField(
                      "subject_id",
                      event.target.value,
                    );

                    setActionError("");
                  }}
                  disabled={!form.section_id}
                  required
                >
                  <option value="">
                    Select subject
                  </option>

                  {availableSubjects.map(
                    (subject) => {
                      const conflict =
                        findAssignmentConflict(
                          subject.id,
                          selected?.id || null,
                        );

                      const assignedTeacher =
                        conflict?.teacher?.profile
                          ?.full_name ||
                        "another teacher";

                      return (
                        <option
                          key={subject.id}
                          value={subject.id}
                          disabled={Boolean(conflict)}
                        >
                          {subject.subject_code}
                          {" — "}
                          {subject.subject_name}
                          {conflict
                            ? ` — Already assigned to ${assignedTeacher}`
                            : ""}
                        </option>
                      );
                    },
                  )}
                </select>

                {!form.section_id && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Select a section first.
                  </p>
                )}
              </Field>
            ) : (
              <Field label="Subjects">
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">
                      {form.subject_ids.length}{" "}
                      selected
                    </span>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={selectAllSubjects}
                        disabled={
                          availableSubjects.length ===
                          0 || saving
                        }
                        className="text-xs font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        Select available
                      </button>

                      <button
                        type="button"
                        onClick={clearSubjects}
                        disabled={
                          form.subject_ids.length ===
                          0 || saving
                        }
                        className="text-xs font-medium text-gray-500 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto p-2">
                    {availableSubjects.map(
                      (subject) => {
                        const checked =
                          form.subject_ids.includes(
                            subject.id,
                          );

                        const existingAssignment =
                          findAssignmentConflict(
                            subject.id,
                          );

                        const assignedTeacherName =
                          existingAssignment?.teacher
                            ?.profile?.full_name ||
                          "another teacher";

                        const unavailable =
                          Boolean(
                            existingAssignment,
                          );

                        return (
                          <label
                            key={subject.id}
                            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${unavailable
                              ? "cursor-not-allowed bg-gray-50 opacity-70"
                              : checked
                                ? "cursor-pointer bg-blue-50"
                                : "cursor-pointer hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleSubject(
                                  subject.id,
                                )
                              }
                              disabled={
                                unavailable || saving
                              }
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 disabled:cursor-not-allowed"
                            />

                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${unavailable
                                  ? "text-gray-500"
                                  : "text-gray-900"
                                  }`}
                              >
                                {subject.subject_name}
                              </p>

                              <p className="text-xs text-gray-400">
                                {subject.subject_code}
                                {" · "}
                                Grade{" "}
                                {subject.grade_level}
                              </p>

                              {existingAssignment && (
                                <p className="mt-1 text-xs font-medium text-orange-600">
                                  Already assigned to{" "}
                                  {
                                    assignedTeacherName
                                  }
                                </p>
                              )}
                            </div>

                            {checked &&
                              !unavailable && (
                                <CheckSquare className="ml-auto h-4 w-4 shrink-0 text-blue-600" />
                              )}
                          </label>
                        );
                      },
                    )}

                    {form.section_id &&
                      availableSubjects.length ===
                      0 && (
                        <p className="px-3 py-6 text-center text-sm text-orange-600">
                          No active subjects match
                          this section&apos;s grade
                          and strand.
                        </p>
                      )}

                    {!form.section_id && (
                      <p className="px-3 py-6 text-center text-sm text-gray-400">
                        Select a section first.
                      </p>
                    )}
                  </div>
                </div>
              </Field>
            )}

            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",

                    event.target.value,
                  )
                }
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  !form.teacher_id ||
                  !form.school_year_id ||
                  !form.section_id ||
                  (modalMode === "edit"
                    ? !form.subject_id
                    : form.subject_ids.length ===
                    0)
                }
                className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : modalMode === "edit"
                    ? "Save Changes"
                    : `Assign ${form.subject_ids.length ||
                    ""
                    } Subject${form.subject_ids.length ===
                      1
                      ? ""
                      : "s"
                    }`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
