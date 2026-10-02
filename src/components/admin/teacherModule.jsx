import React, { useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { supabase } from "../../lib/supabase";

import {
  Field,
  inputClass,
  Modal,
  RowActions,
  SectionHeader,
  StatusBadge,
} from "./adminUI";

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

function TeacherForm({
  initialData,

  suggestedTeacherNumber,

  onCancel,

  onSave,

  saving,
}) {
  const isEditing = Boolean(initialData);

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    teacher_number: initialData?.teacher_number || suggestedTeacherNumber,

    full_name: initialData?.full_name || "",

    email: initialData?.email || "",

    password: "",

    contact_number: initialData?.contact_number || "",

    employment_type: initialData?.employment_type || "full_time",

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
      !form.teacher_number.trim() ||
      !form.full_name.trim() ||
      !form.email.trim()
    ) {
      window.alert("Teacher number, full name, and email are required.");

      return;
    }

    if (!isEditing && form.password.length < 8) {
      window.alert(
        "The temporary password must contain at least 8 characters.",
      );

      return;
    }

    if (isEditing && form.password && form.password.length < 8) {
      window.alert("The new password must contain at least 8 characters.");

      return;
    }

    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Teacher number">
        {isEditing ? (
          <input
            className={inputClass}
            value={form.teacher_number}
            onChange={(event) => update("teacher_number", event.target.value)}
            placeholder="T-2026-001"
            required
          />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-slate-700">
              {form.teacher_number}
            </p>

            <p className="mt-0.5 text-xs text-gray-400">
              Generated automatically from the latest teacher number
            </p>
          </div>
        )}
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
          placeholder="teacher@ejist.edu.ph"
          required
        />
      </Field>

      <Field
        label={isEditing ? "New password (optional)" : "Temporary password"}
      >
        <div className="relative">
          <input
            className={`${inputClass} pr-11`}
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder={
              isEditing
                ? "Leave blank to keep current password"
                : "Minimum 8 characters"
            }
            minLength={form.password ? 8 : undefined}
            autoComplete="new-password"
            required={!isEditing}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </Field>

      <Field label="Contact number">
        <input
          className={inputClass}
          value={form.contact_number}
          onChange={(event) =>
            update(
              "contact_number",

              event.target.value,
            )
          }
          placeholder="0917 000 0000"
        />
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
          <option value="full_time">Full-time</option>

          <option value="part_time">Part-time</option>
        </select>
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
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
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

  async function handleDelete(teacher) {
    const confirmed = window.confirm(
      `Permanently delete teacher "${teacher.full_name}"?`,
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await callTeacherFunction({
        action: "delete",

        id: teacher.id,
      });

      setTeachers((currentTeachers) =>
        currentTeachers.filter((item) => item.id !== teacher.id),
      );
    } catch (error) {
      console.error(
        "Teacher deletion failed:",

        error,
      );

      setActionError(error.message || "Unable to delete the teacher.");
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
                      onDelete={() => handleDelete(teacher)}
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
          title={modalMode === "edit" ? "Edit Teacher" : "Add Teacher"}
          onClose={closeModal}
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
