import { useEffect, useMemo, useState } from "react";

import { Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";

import {
  Field,
  inputClass,
  Modal,
  RowActions,
  SectionHeader,
  StatusBadge,
} from "./adminUI";

import { supabase } from "../../lib/supabase";

function normalizeRelation(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeSection(section) {
  if (!section) return null;

  return {
    ...section,
    strand: normalizeRelation(section.strand),
    school_year: normalizeRelation(section.school_year),
  };
}

function sectionLabel(section) {
  return [
    `Grade ${section.grade_level}`,
    section.section_name,
    section.strand?.code || "No strand",
    section.school_year?.name || "No school year",
  ].join(" · ");
}

function generateEmailCode() {
  const randomValue = new Uint32Array(1);

  window.crypto.getRandomValues(randomValue);

  return String(randomValue[0] % 1_000_000).padStart(6, "0");
}

function createStudentRow() {
  return {
    first_name: "",

    middle_name: "",

    last_name: "",

    email_code: generateEmailCode(),

    contact_number: "",
  };
}

function normalizeLastName(value) {
  return String(value || "")
    .trim()

    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .replace(/[^a-z0-9]/g, "");
}

function buildStudentEmail(lastName, emailCode) {
  const normalizedLastName = normalizeLastName(lastName);

  if (!normalizedLastName) return "";

  return `${normalizedLastName}.${emailCode}@ejist.edu.ph`;
}

function buildFullName(student) {
  return [student.first_name, student.middle_name, student.last_name]

    .map((name) => String(name || "").trim())

    .filter(Boolean)

    .join(" ");
}

function StudentForm({
  initialData,

  sections,

  sectionsLoading,

  onCancel,

  onSave,

  saving,
}) {
  const [form, setForm] = useState({
    student_number: initialData?.student_number || "",

    full_name: initialData?.full_name || "",

    email: initialData?.email || "",

    password: "",

    section_id: initialData?.section_id || "",

    contact_number: initialData?.contact_number || "",

    status: initialData?.status || "active",
  });

  function update(field, value) {
    setForm((current) => ({
      ...current,

      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.student_number.trim() ||
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.section_id
    ) {
      window.alert("Please complete all required fields.");

      return;
    }

    if (form.password && form.password.length < 8) {
      window.alert("The new password must contain at least 8 characters.");

      return;
    }

    onSave({
      ...form,

      student_number: form.student_number.trim(),

      full_name: form.full_name.trim(),

      email: form.email.trim().toLowerCase(),

      contact_number: form.contact_number.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Student number">
        <input
          className={inputClass}
          value={form.student_number}
          onChange={(event) => update("student_number", event.target.value)}
          placeholder="S-2026-001"
          required
        />
      </Field>

      <Field label="Full name">
        <input
          className={inputClass}
          value={form.full_name}
          onChange={(event) => update("full_name", event.target.value)}
          placeholder="Juan Dela Cruz"
          required
        />
      </Field>

      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          placeholder="student@ejist.edu.ph"
          required
        />
      </Field>

      <Field label="New temporary password (optional)">
        <input
          className={inputClass}
          type="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          placeholder="Leave blank to keep current password"
          minLength={form.password ? 8 : undefined}
        />
      </Field>

      <Field label="Section">
        <select
          className={inputClass}
          value={form.section_id}
          onChange={(event) => update("section_id", event.target.value)}
          disabled={sectionsLoading}
          required
        >
          <option value="">
            {sectionsLoading ? "Loading sections..." : "Select a section"}
          </option>

          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {sectionLabel(section)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Contact number">
        <input
          className={inputClass}
          type="tel"
          value={form.contact_number}
          onChange={(event) => update("contact_number", event.target.value)}
          placeholder="0917 000 0000"
        />
      </Field>

      <Field label="Account status">
        <select
          className={inputClass}
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
        >
          <option value="active">Active</option>

          <option value="inactive">Inactive</option>
        </select>
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            sectionsLoading ||
            sections.length === 0 ||
            !form.section_id
          }
          className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function getNextStudentNumber(
  existingStudents,

  rowIndex = 0,
) {
  const highestNumber = existingStudents.reduce(
    (highest, student) => {
      const match = String(student.student_number || "").match(/(\d+)$/);

      const number = match ? Number.parseInt(match[1], 10) : 0;

      return Math.max(highest, number);
    },

    0,
  );

  const nextNumber = highestNumber + rowIndex + 1;

  const year = new Date().getFullYear();

  return `S-${year}-${String(nextNumber).padStart(
    3,

    "0",
  )}`;
}

function BulkStudentForm({
  existingStudents,

  sections,

  sectionsLoading,

  saving,

  onCancel,

  onSave,
}) {
  const [sectionId, setSectionId] = useState("");

  const [password, setPassword] = useState("ejist123");

  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState("active");

  const [rows, setRows] = useState(() => [
    createStudentRow(),

    createStudentRow(),
  ]);

  const [formError, setFormError] = useState("");

  function updateRow(index, field, value) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
            ...row,

            [field]: value,
          }
          : row,
      ),
    );
  }

  function addRow() {
    if (rows.length >= 50) {
      setFormError("You can add a maximum of 50 students per batch.");

      return;
    }

    setRows((currentRows) => [...currentRows, createStudentRow()]);

    setFormError("");
  }

  function removeRow(index) {
    setRows((currentRows) => {
      if (currentRows.length === 1) {
        return currentRows;
      }

      return currentRows.filter((_, rowIndex) => rowIndex !== index);
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    setFormError("");

    if (!sectionId) {
      setFormError("Please select a section.");

      return;
    }

    if (password.length < 8) {
      setFormError(
        "The temporary password must contain at least 8 characters.",
      );

      return;
    }

    const incompleteRowIndex = rows.findIndex(
      (row) => !row.first_name.trim() || !row.last_name.trim(),
    );

    if (incompleteRowIndex !== -1) {
      setFormError(
        `Student ${incompleteRowIndex + 1} must have a first name and last name.`,
      );

      return;
    }

    const students = rows.map((row, index) => ({
      student_number: getNextStudentNumber(
        existingStudents,
        index,
      ),
      full_name: buildFullName(row),
      first_name: row.first_name.trim(),
      middle_name: row.middle_name.trim() || null,
      last_name: row.last_name.trim(),
      email: buildStudentEmail(
        row.last_name,
        row.email_code,
      ),
      contact_number:
        row.contact_number.trim() || null,
    }));

    const emails = students.map((student) => student.email.toLowerCase());

    if (new Set(emails).size !== emails.length) {
      setFormError(
        "Generated email addresses must not be repeated. Generate a new email for the duplicated student.",
      );

      return;
    }

    onSave({
      section_id: sectionId,

      password,

      status,

      students,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Section">
          <select
            className={inputClass}
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
            disabled={sectionsLoading || sections.length === 0}
            required
          >
            <option value="">
              {sectionsLoading
                ? "Loading available sections..."
                : sections.length === 0
                  ? "No active sections available"
                  : "Select a section"}
            </option>

            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {sectionLabel(section)}
              </option>
            ))}
          </select>

          {!sectionsLoading && sections.length === 0 && (
            <p className="mt-2 text-xs text-orange-600">
              No active sections were found. Create or activate a section in
              Academic Setup, then reopen this form.
            </p>
          )}
        </Field>

        <Field label="Account status">
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>

      <Field label="Temporary password for all students">
        <div className="relative">
          <input
            className={`${inputClass} pr-11`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-700"
            aria-label={
              showPassword
                ? "Hide temporary password"
                : "Show temporary password"
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <p className="mt-1.5 text-xs text-orange-600">
          Every student in this batch will initially use this password.
        </p>
      </Field>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Students</h3>

            <p className="text-xs text-gray-400">
              {rows.length} of 50 students
            </p>
          </div>

          <button
            type="button"
            onClick={addRow}
            disabled={saving || rows.length >= 50}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <div className="grid max-h-[600px] grid-cols-1 gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
          {rows.map((row, index) => {
            const studentNumber = getNextStudentNumber(
              existingStudents,

              index,
            );

            const generatedEmail = buildStudentEmail(
              row.last_name,

              row.email_code,
            );

            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Student {index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={saving || rows.length === 1}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove student ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Student number
                    </label>

                    <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5">
                      <p className="text-sm font-semibold text-slate-700">
                        {studentNumber}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Generated automatically
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      First name *
                    </label>

                    <input
                      className={inputClass}
                      value={row.first_name}
                      onChange={(event) =>
                        updateRow(
                          index,

                          "first_name",

                          event.target.value,
                        )
                      }
                      placeholder="Juan"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Middle name
                    </label>

                    <input
                      className={inputClass}
                      value={row.middle_name}
                      onChange={(event) =>
                        updateRow(
                          index,

                          "middle_name",

                          event.target.value,
                        )
                      }
                      placeholder="Santos"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Last name *
                    </label>

                    <input
                      className={inputClass}
                      value={row.last_name}
                      onChange={(event) =>
                        updateRow(
                          index,

                          "last_name",

                          event.target.value,
                        )
                      }
                      placeholder="Dela Cruz"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <label className="block text-xs font-medium text-gray-600">
                        Generated email
                      </label>
                    </div>

                    <input
                      className={`${inputClass} cursor-default bg-gray-100 text-gray-600`}
                      type="email"
                      value={generatedEmail}
                      placeholder="Enter the last name first"
                      readOnly
                      tabIndex={-1}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Contact number
                    </label>

                    <input
                      className={inputClass}
                      type="tel"
                      value={row.contact_number}
                      onChange={(event) =>
                        updateRow(
                          index,

                          "contact_number",

                          event.target.value,
                        )
                      }
                      placeholder="0917 000 0000"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            saving || sectionsLoading || sections.length === 0 || !sectionId
          }
          className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Creating Students..."
            : `Create ${rows.length} Student${rows.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}

export default function StudentModule({
  students,

  setStudents,

  loading,

  error,
}) {
  const [modalMode, setModalMode] = useState(null);

  const [selected, setSelected] = useState(null);

  const [saving, setSaving] = useState(false);

  const [actionError, setActionError] = useState("");

  const [notice, setNotice] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [sectionFilter, setSectionFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [sections, setSections] = useState([]);

  const [sectionsLoading, setSectionsLoading] = useState(true);

  async function loadSections() {
    setSectionsLoading(true);
    try {
      const { data, error: sectionsError } = await supabase

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

        ),

        school_year:school_years (

          id,

          name

        )

      `,
        )

        .order("grade_level", {
          ascending: true,
        })

        .order("section_name", {
          ascending: true,
        });

      if (sectionsError) {
        throw sectionsError;
      }

      const availableSections = (data || [])

        .map(normalizeSection)

        .filter(
          (section) => String(section.status || "").toLowerCase() === "active",
        );

      setSections(availableSections);

      if (availableSections.length === 0) {
        setActionError(
          "No active sections are available. Create or activate a section in Academic Setup.",
        );
      }
    } catch (loadError) {
      console.error(
        "Failed to load available sections:",

        loadError,
      );

      setSections([]);

      setActionError(loadError.message || "Unable to load available sections.");
    } finally {
      setSectionsLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  async function openBulkAddModal() {
    setSelected(null);
    setNotice("");
    setActionError("");
    setModalMode("bulk-add");

    await loadSections();
  }

  function closeModal() {
    if (saving) return;

    setModalMode(null);

    setSelected(null);

    setActionError("");
  }

  function attachSection(student) {
    const assignedSection = sections.find(
      (section) => section.id === student.section_id,
    );

    return {
      ...student,

      section: assignedSection || null,
    };
  }

  async function callStudentFunction(body) {
    const { data, error: functionError } = await supabase.functions.invoke(
      "manage-student",
      {
        body,
      },
    );

    if (functionError) {
      let message = functionError.message;

      try {
        const responseBody = await functionError.context?.json();

        if (responseBody?.error) {
          message = responseBody.error;
        }
      } catch {
        // Use the original Edge Function error.
      }

      throw new Error(message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async function handleEdit(form) {
    setSaving(true);

    setActionError("");

    setNotice("");

    try {
      if (!selected?.id) {
        throw new Error("No student was selected.");
      }

      const result = await callStudentFunction({
        action: "update",

        id: selected.id,

        ...form,
      });

      if (!result?.student) {
        throw new Error("The server did not return the updated student.");
      }

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === selected.id ? attachSection(result.student) : student,
        ),
      );

      setModalMode(null);

      setSelected(null);

      setNotice("Student updated successfully.");
    } catch (saveError) {
      console.error("Student update failed:", saveError);

      setActionError(saveError.message || "Unable to update the student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkCreate(form) {
    setSaving(true);

    setActionError("");

    setNotice("");

    try {
      const result = await callStudentFunction({
        action: "bulk_create",

        ...form,
      });

      const createdStudents = (result?.students || []).map(attachSection);

      if (createdStudents.length > 0) {
        setStudents((currentStudents) => [
          ...currentStudents,

          ...createdStudents,
        ]);
      }

      const failures = result?.failures || [];

      setModalMode(null);

      setSelected(null);

      if (failures.length === 0) {
        setNotice(
          `${createdStudents.length} student account${createdStudents.length === 1 ? "" : "s"
          } created successfully.`,
        );
      } else {
        const failureDetails = failures

          .slice(0, 5)

          .map((failure) => `Row ${failure.row}: ${failure.error}`)

          .join(" ");

        const remaining =
          failures.length > 5 ? ` ${failures.length - 5} more failed.` : "";

        setActionError(
          `${createdStudents.length} created, ${failures.length
          } failed. ${failureDetails}${remaining}`,
        );
      }
    } catch (saveError) {
      console.error(
        "Bulk student creation failed:",

        saveError,
      );

      setActionError(
        saveError.message || "Unable to create the student accounts.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Permanently delete student "${student.full_name}"?`,
    );

    if (!confirmed) return;

    setActionError("");

    setNotice("");

    try {
      await callStudentFunction({
        action: "delete",

        id: student.id,
      });

      setStudents((currentStudents) =>
        currentStudents.filter(
          (currentStudent) => currentStudent.id !== student.id,
        ),
      );

      setNotice("Student deleted successfully.");
    } catch (deleteError) {
      console.error(
        "Student deletion failed:",

        deleteError,
      );

      setActionError(deleteError.message || "Unable to delete the student.");
    }
  }

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students

      .filter((student) => {
        const studentSectionId =
          student.section_id || student.section?.id || "";

        const matchesSection =
          !sectionFilter || studentSectionId === sectionFilter;

        const matchesStatus = !statusFilter || student.status === statusFilter;

        const searchableText = [
          student.student_number,

          student.full_name,

          student.email,

          student.contact_number,

          student.section?.section_name,

          student.section?.grade_level
            ? `Grade ${student.section.grade_level}`
            : "",

          student.section?.strand?.code,

          student.section?.strand?.name,

          student.section?.school_year?.name,

          student.status,
        ]

          .filter(Boolean)

          .join(" ")

          .toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);

        return matchesSearch && matchesSection && matchesStatus;
      })

      .sort((first, second) =>
        String(first.full_name || "").localeCompare(
          String(second.full_name || ""),
        ),
      );
  }, [students, searchTerm, sectionFilter, statusFilter]);

  const hasFilters = Boolean(
    searchTerm.trim() || sectionFilter || statusFilter,
  );

  function clearFilters() {
    setSearchTerm("");

    setSectionFilter("");

    setStatusFilter("");
  }

  return (
    <div>
      <SectionHeader
        title="Student Management"
        count={students.length}
        addLabel="Add Students"
        onAdd={openBulkAddModal}
      />

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_260px_180px_auto]">
          <div className="relative">
            <label htmlFor="student-search" className="sr-only">
              Search students
            </label>

            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />

            <input
              id="student-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, student number..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div>
            <label htmlFor="student-section-filter" className="sr-only">
              Filter students by section
            </label>

            <select
              id="student-section-filter"
              value={sectionFilter}
              onChange={(event) => setSectionFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All sections</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Grade {section.grade_level} — {section.section_name}
                  {section.strand?.code ? ` · ${section.strand.code}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="student-status-filter" className="sr-only">
              Filter students by status
            </label>

            <select
              id="student-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        <p role="status" className="mt-3 text-xs text-gray-400">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {(error || actionError) && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError || error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Student Number</th>

              <th className="px-5 py-3 font-medium">Student</th>

              <th className="px-5 py-3 font-medium">Grade &amp; Section</th>

              <th className="px-5 py-3 font-medium">Strand</th>

              <th className="px-5 py-3 font-medium">School Year</th>

              <th className="px-5 py-3 font-medium">Contact</th>

              <th className="px-5 py-3 font-medium">Status</th>

              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-600">
                    {student.student_number}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">
                      {student.full_name}
                    </p>

                    <p className="text-xs text-gray-400">{student.email}</p>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {student.section ? (
                      <>
                        Grade {student.section.grade_level}
                        {" · "}
                        {student.section.section_name}
                      </>
                    ) : (
                      <span className="text-orange-500">Not assigned</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {student.section?.strand?.code || "Not assigned"}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {student.section?.school_year?.name || "Not assigned"}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {student.contact_number || "Not provided"}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={student.status} />
                  </td>

                  <td className="px-5 py-3.5">
                    <RowActions
                      onEdit={() => {
                        setSelected(student);

                        setActionError("");

                        setNotice("");

                        setModalMode("edit");
                      }}
                      onDelete={() => handleDelete(student)}
                    />
                  </td>
                </tr>
              ))}

            {loading && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                  Loading student accounts...
                </td>
              </tr>
            )}

            {!loading && filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-gray-400"
                >
                  {students.length === 0
                    ? "No student accounts found."
                    : "No students match your search or filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode === "bulk-add" && (
        <Modal
          title="Add Students by Section"
          onClose={closeModal}
          maxWidth="max-w-6xl"
        >
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <BulkStudentForm
            existingStudents={students}
            sections={sections}
            sectionsLoading={sectionsLoading}
            saving={saving}
            onCancel={closeModal}
            onSave={handleBulkCreate}
          />
        </Modal>
      )}

      {modalMode === "edit" && selected && (
        <Modal title="Edit Student" onClose={closeModal}>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <StudentForm
            key={selected.id}
            initialData={selected}
            sections={sections}
            sectionsLoading={sectionsLoading}
            onCancel={closeModal}
            onSave={handleEdit}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}
