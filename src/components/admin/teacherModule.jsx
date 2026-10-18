import React, { useState } from "react";

import {
  Archive,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import {
  Field,
  inputClass,
  Modal,
  RowActions,
  SectionHeader,
  StatusBadge,
} from "./adminUI";

const teacherSuffixes = [
  "",
  "Jr.",
  "Sr.",
  "II",
  "III",
  "IV",
  "V",
];

function sanitizeTeacherName(value) {
  return String(value || "")
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s{2,}/g, " ");
}

function isValidTeacherName(
  value,
  required = true,
) {
  const normalizedValue = String(
    value || "",
  ).trim();

  if (!normalizedValue) {
    return !required;
  }

  return /^[\p{L}]+(?:\s[\p{L}]+)*$/u.test(
    normalizedValue,
  );
}

function sanitizeContactNumber(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

function isValidContactNumber(value) {
  const normalizedValue = String(
    value || "",
  ).trim();

  return (
    !normalizedValue ||
    /^09\d{9}$/.test(normalizedValue)
  );
}

function getNextTeacherNumber(teachers) {
  const highestNumber = teachers.reduce((highest, teacher) => {
    const match = String(teacher.teacher_number || "").match(/(\d+)$/);
    const number = match ? Number.parseInt(match[1], 10) : 0;

    return Math.max(highest, number);
  }, 0);

  const year = new Date().getFullYear();
  const nextNumber = String(highestNumber + 1).padStart(3, "0");

  return `T-${year}-${nextNumber}`;
}

function createSixDigitNumber() {
  return String(
    Math.floor(100000 + Math.random() * 900000),
  );
}

function getLastName(fullName) {
  const nameParts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return nameParts[nameParts.length - 1] || "";
}

function normalizeEmailName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function generateTeacherEmail(
  fullName,
  randomNumber,
) {
  const lastName = normalizeEmailName(
    getLastName(fullName),
  );

  if (!lastName) return "";

  return `${lastName}.${randomNumber}@ejist.edu.ph`;
}

function getExistingEmailNumber(email) {
  const match = String(email || "").match(
    /\.(\d{6})@ejist\.edu\.ph$/i,
  );

  return match?.[1] || createSixDigitNumber();
}

function splitTeacherName(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let title = "";
  let suffix = "";

  if (
    ["Mr.", "Mrs.", "Ms."].includes(
      parts[0],
    )
  ) {
    title = parts.shift();
  }

  const possibleSuffix =
    parts[parts.length - 1];

  if (
    teacherSuffixes.includes(
      possibleSuffix,
    ) &&
    possibleSuffix
  ) {
    suffix = parts.pop();
  }

  if (parts.length === 0) {
    return {
      title,
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix,
    };
  }

  if (parts.length === 1) {
    return {
      title,
      first_name: parts[0],
      middle_name: "",
      last_name: "",
      suffix,
    };
  }

  return {
    title,

    first_name: parts[0],

    middle_name: parts
      .slice(1, -1)
      .join(" "),

    last_name:
      parts[parts.length - 1],

    suffix,
  };
}

function buildTeacherFullName(form) {
  return [
    form.title,
    form.first_name,
    form.middle_name,
    form.last_name,
    form.suffix,
  ]
    .map((value) =>
      String(value || "").trim(),
    )
    .filter(Boolean)
    .join(" ");
}

function TeacherForm({
  initialData,
  suggestedTeacherNumber,
  onCancel,
  onSave,
  saving,
}) {
  const isEditing = Boolean(initialData);

  const existingName = splitTeacherName(
    initialData?.full_name,
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [emailNumber] = useState(() =>
    getExistingEmailNumber(
      initialData?.email,
    ),
  );

  const [form, setForm] = useState(() => ({
    teacher_number:
      initialData?.teacher_number ||
      suggestedTeacherNumber,

    title: existingName.title || "Mr.",

    first_name:
      existingName.first_name || "",

    middle_name:
      existingName.middle_name || "",

    last_name:
      existingName.last_name || "",

    suffix:
      existingName.suffix || "",

    email:
      initialData?.email ||
      generateTeacherEmail(
        existingName.last_name,
        emailNumber,
      ),

    password: isEditing ? "" : "ejist123",

    contact_number:
      initialData?.contact_number || "",

    employment_type:
      initialData?.employment_type ||
      "full_time",

    status:
      initialData?.status || "active",
  }));

  function update(field, value) {
    let updatedValue = value;

    if (
      [
        "first_name",
        "middle_name",
        "last_name",
      ].includes(field)
    ) {
      updatedValue =
        sanitizeTeacherName(value);
    }

    if (field === "contact_number") {
      updatedValue =
        sanitizeContactNumber(value);
    }

    setForm((current) => {
      const updatedForm = {
        ...current,
        [field]: updatedValue,
      };

      if (
        field === "last_name" &&
        !isEditing
      ) {
        updatedForm.email =
          generateTeacherEmail(
            updatedValue,
            emailNumber,
          );
      }

      return updatedForm;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const firstName =
      form.first_name.trim();

    const middleName =
      form.middle_name.trim();

    const lastName =
      form.last_name.trim();

    const contactNumber =
      form.contact_number.trim();

    if (!form.teacher_number.trim()) {
      window.alert(
        "Teacher number is required.",
      );
      return;
    }

    if (!form.title) {
      window.alert(
        "Please select a title.",
      );
      return;
    }

    if (
      !isValidTeacherName(
        firstName,
        true,
      )
    ) {
      window.alert(
        "First name is required and may only contain letters and spaces.",
      );
      return;
    }

    if (
      !isValidTeacherName(
        middleName,
        false,
      )
    ) {
      window.alert(
        "Middle name may only contain letters and spaces.",
      );
      return;
    }

    if (
      !isValidTeacherName(
        lastName,
        true,
      )
    ) {
      window.alert(
        "Last name is required and may only contain letters and spaces.",
      );
      return;
    }

    if (
      form.suffix &&
      !teacherSuffixes.includes(
        form.suffix,
      )
    ) {
      window.alert(
        "Please select a valid suffix.",
      );
      return;
    }

    if (
      !isValidContactNumber(
        contactNumber,
      )
    ) {
      window.alert(
        "Contact number must contain exactly 11 digits and begin with 09.",
      );
      return;
    }

    const fullName =
      buildTeacherFullName({
        ...form,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
      });

    const normalizedEmail =
      form.email.trim().toLowerCase();

    if (!normalizedEmail) {
      window.alert(
        "School email is required.",
      );
      return;
    }

    if (
      !isEditing &&
      form.password.length < 8
    ) {
      window.alert(
        "The temporary password must contain at least 8 characters.",
      );
      return;
    }

    if (
      isEditing &&
      form.password &&
      form.password.length < 8
    ) {
      window.alert(
        "The new password must contain at least 8 characters.",
      );
      return;
    }

    onSave({
      teacher_number:
        form.teacher_number.trim(),

      full_name: fullName,

      email: normalizedEmail,

      password: form.password,

      contact_number:
        contactNumber || null,

      employment_type:
        form.employment_type,

      status: form.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Field label="Teacher number">
        {isEditing ? (
          <input
            className={inputClass}
            value={form.teacher_number}
            onChange={(event) =>
              update(
                "teacher_number",
                event.target.value,
              )
            }
            placeholder="T-2026-001"
            required
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-slate-700">
              {form.teacher_number}
            </p>

            <p className="mt-0.5 text-xs text-gray-400">
              Generated automatically from the
              latest teacher number
            </p>
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
        <Field label="Title">
          <select
            className={inputClass}
            value={form.title}
            onChange={(event) =>
              update("title", event.target.value)
            }
            required
          >
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Ms.">Ms.</option>
          </select>
        </Field>

        <Field label="First name">
          <input
            className={inputClass}
            value={form.first_name}
            onChange={(event) =>
              update(
                "first_name",
                event.target.value,
              )
            }
            placeholder="Juan"
            maxLength={50}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Middle name">
          <input
            className={inputClass}
            value={form.middle_name}
            onChange={(event) =>
              update(
                "middle_name",
                event.target.value,
              )
            }
            placeholder="Santos"
            maxLength={50}
          />

          <p className="mt-1 text-xs text-gray-400">
            Optional
          </p>
        </Field>

        <Field label="Last name">
          <input
            className={inputClass}
            value={form.last_name}
            onChange={(event) =>
              update(
                "last_name",
                event.target.value,
              )
            }
            placeholder="Dela Cruz"
            maxLength={50}
            required
          />
        </Field>

        <Field label="Suffix">
          <select
            className={inputClass}
            value={form.suffix}
            onChange={(event) =>
              update(
                "suffix",
                event.target.value,
              )
            }
          >
            <option value="">
              No suffix
            </option>

            <option value="Jr.">
              Jr.
            </option>

            <option value="Sr.">
              Sr.
            </option>

            <option value="II">
              II
            </option>

            <option value="III">
              III
            </option>

            <option value="IV">
              IV
            </option>

            <option value="V">
              V
            </option>
          </select>
        </Field>
      </div>

      <Field label="Complete name">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
          <p
            className={`text-sm font-medium ${buildTeacherFullName(form)
              ? "text-slate-700"
              : "text-gray-400"
              }`}
          >
            {buildTeacherFullName(form) ||
              "Complete the name fields"}
          </p>
        </div>
      </Field>

      <Field label="School email">
        {isEditing ? (
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(event) =>
              update("email", event.target.value)
            }
            placeholder="teacher@ejist.edu.ph"
            required
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p
              className={`break-all text-sm font-medium ${form.email
                ? "text-slate-700"
                : "text-gray-400"
                }`}
            >
              {form.email ||
                "Enter the teacher's last name"}
            </p>

            <p className="mt-0.5 text-xs text-gray-400">
              Generated automatically using the
              last name
            </p>
          </div>
        )}
      </Field>

      <Field
        label={
          isEditing
            ? "New password (optional)"
            : "Temporary password"
        }
      >
        <div className="relative">
          <input
            className={`${inputClass} pr-11`}
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={form.password}
            onChange={(event) =>
              update(
                "password",
                event.target.value,
              )
            }
            placeholder={
              isEditing
                ? "Leave blank to keep current password"
                : "Minimum 8 characters"
            }
            minLength={
              form.password ? 8 : undefined
            }
            autoComplete="new-password"
            required={!isEditing}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) => !current,
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-700"
            aria-label={
              showPassword
                ? "Hide password"
                : "Show password"
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {!isEditing && (
          <p className="mt-1 text-xs text-gray-400">
            Default password: ejist123
          </p>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact number">
          <input
            className={inputClass}
            type="tel"
            inputMode="numeric"
            value={form.contact_number}
            onChange={(event) =>
              update(
                "contact_number",
                event.target.value,
              )
            }
            placeholder="09XXXXXXXXX"
            minLength={
              form.contact_number
                ? 11
                : undefined
            }
            maxLength={11}
            pattern="09[0-9]{9}"
            title="Enter exactly 11 digits beginning with 09."
          />

          <p className="mt-1 text-xs text-gray-400">
            Optional. Enter exactly 11 digits
            beginning with 09.
          </p>
        </Field>

        <Field label="Employment type">
          <select
            className={inputClass}
            value={form.employment_type}
            onChange={(event) =>
              update(
                "employment_type",
                event.target.value,
              )
            }
          >
            <option value="full_time">
              Full-time
            </option>

            <option value="part_time">
              Part-time
            </option>
          </select>
        </Field>
      </div>

      <Field label="Account status">
        <select
          className={inputClass}
          value={form.status}
          onChange={(event) =>
            update(
              "status",
              event.target.value,
            )
          }
        >
          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
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
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.email
          }
          className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function TeacherModule({
  teachers,
  setTeachers,
  loading,
  error,
  canDelete = false,
  onOpenArchivedTeachers,
}) {
  const [modalMode, setModalMode] = useState(null);

  const [selected, setSelected] = useState(null);

  const [saving, setSaving] = useState(false);

  const [actionError, setActionError] = useState("");

  function closeModal() {
    if (saving) return;

    setModalMode(null);

    setSelected(null);

    setActionError("");
  }

  async function callTeacherFunction(body) {
    const {
      data,

      error: functionError,
    } = await supabase.functions.invoke(
      "manage-teacher",

      { body },
    );

    if (functionError) {
      let message = functionError.message;

      try {
        const response = await functionError.context?.json();

        if (response?.error) {
          message = response.error;
        }
      } catch {
        // Keep the original function message.
      }

      throw new Error(message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async function handleSave(form) {
    setSaving(true);

    setActionError("");

    try {
      if (modalMode === "edit") {
        if (!selected?.id) {
          throw new Error("No teacher was selected.");
        }

        const result = await callTeacherFunction({
          action: "update",

          id: selected.id,

          ...form,
        });

        if (!result?.teacher) {
          throw new Error("The function did not return the updated teacher.");
        }

        setTeachers((currentTeachers) =>
          currentTeachers.map((teacher) =>
            teacher.id === selected.id ? result.teacher : teacher,
          ),
        );
      } else {
        const result = await callTeacherFunction({
          action: "create",

          ...form,
        });

        if (!result?.teacher) {
          throw new Error("The function did not return the new teacher.");
        }

        setTeachers((currentTeachers) => [...currentTeachers, result.teacher]);
      }

      setModalMode(null);

      setSelected(null);

      setActionError("");
    } catch (error) {
      console.error(
        "Teacher save failed:",

        error,
      );

      setActionError(error.message || "Unable to save the teacher.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(teacher) {
    const confirmed = window.confirm(
      `Archive teacher "${teacher.full_name}"? The teacher will no longer be able to log in.`,
    );

    if (!confirmed) return;

    setSaving(true);
    setActionError("");

    try {
      await callTeacherFunction({
        action: "archive",
        id: teacher.id,
      });

      setTeachers((currentTeachers) =>
        currentTeachers.filter(
          (currentTeacher) =>
            currentTeacher.id !== teacher.id,
        ),
      );
    } catch (archiveError) {
      console.error(
        "Teacher archiving failed:",
        archiveError,
      );

      setActionError(
        archiveError.message ||
        "Unable to archive the teacher.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Teacher Management"
        count={teachers.length}
        addLabel="Add Teacher"
        onAdd={() => {
          setSelected(null);

          setActionError("");

          setModalMode("add");
        }}
      />

      {canDelete && onOpenArchivedTeachers && (
        <div className="-mt-3 mb-5 flex justify-end">
          <button
            type="button"
            onClick={onOpenArchivedTeachers}
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Archive className="h-4 w-4" />
            Archived Teachers
          </button>
        </div>
      )}

      {(error || actionError) && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError || error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Teacher Number</th>

              <th className="px-5 py-3 font-medium">Teacher</th>

              <th className="px-5 py-3 font-medium">Contact</th>

              <th className="px-5 py-3 font-medium">Employment</th>

              <th className="px-5 py-3 font-medium">Status</th>

              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-600">
                    {teacher.teacher_number}
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">
                      {teacher.full_name}
                    </p>

                    <p className="text-xs text-gray-400">{teacher.email}</p>
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {teacher.contact_number || "Not provided"}
                  </td>

                  <td className="px-5 py-3.5 text-gray-600">
                    {teacher.employment_type === "part_time"
                      ? "Part-time"
                      : "Full-time"}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge status={teacher.status} />
                  </td>

                  <td className="px-5 py-3.5">
                    <RowActions
                      disabled={saving}
                      onEdit={() => {
                        setSelected(teacher);
                        setActionError("");
                        setModalMode("edit");
                      }}
                      onDelete={
                        canDelete
                          ? () => handleArchive(teacher)
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}

            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  Loading teacher accounts...
                </td>
              </tr>
            )}

            {!loading && teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  No teacher accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalMode && (
        <Modal
          title={
            modalMode === "edit"
              ? "Edit Teacher"
              : "Add Teacher"
          }
          onClose={closeModal}
          size="xl"
        >
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <TeacherForm
            key={selected?.id || `new-${getNextTeacherNumber(teachers)}`}
            initialData={selected}
            suggestedTeacherNumber={getNextTeacherNumber(teachers)}
            onCancel={closeModal}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}
