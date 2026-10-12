import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

function PasswordRequirement({
  valid,
  children,
}) {
  return (
    <li
      className={`flex items-center gap-2 text-xs ${
        valid
          ? "text-green-600"
          : "text-gray-400"
      }`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {children}
    </li>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  placeholder,
  disabled,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClass} pl-9 pr-11`}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-700 disabled:opacity-50"
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function TeacherSettings({
  teacherProfile,
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const requirements = {
    minimum: form.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(
      form.newPassword,
    ),
    lowercase: /[a-z]/.test(
      form.newPassword,
    ),
    number: /\d/.test(form.newPassword),
    matching: Boolean(
      form.confirmPassword &&
        form.newPassword ===
          form.confirmPassword,
    ),
    different: Boolean(
      form.newPassword &&
        form.currentPassword !==
          form.newPassword,
    ),
  };

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  function toggleVisibility(field) {
    setVisible((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError(
        "Complete all password fields.",
      );
      return;
    }

    if (!requirements.minimum) {
      setError(
        "The new password must contain at least 8 characters.",
      );
      return;
    }

    if (
      !requirements.uppercase ||
      !requirements.lowercase ||
      !requirements.number
    ) {
      setError(
        "The new password must include an uppercase letter, lowercase letter, and number.",
      );
      return;
    }

    if (!requirements.matching) {
      setError(
        "The new password confirmation does not match.",
      );
      return;
    }

    if (!requirements.different) {
      setError(
        "The new password must be different from your current password.",
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw (
          userError ||
          new Error(
            "Your session has expired. Please sign in again.",
          )
        );
      }

      const email =
        user.email ||
        teacherProfile?.email;

      if (!email) {
        throw new Error(
          "Your account email could not be found.",
        );
      }

      const {
        error: verificationError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password: form.currentPassword,
        });

      if (verificationError) {
        throw new Error(
          "Your current password is incorrect.",
        );
      }

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password: form.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setVisible({
        current: false,
        new: false,
        confirm: false,
      });

      setSuccess(
        "Your password was changed successfully.",
      );
    } catch (changeError) {
      console.error(
        "Teacher password change failed:",
        changeError,
      );

      setError(
        changeError.message ||
          "Unable to change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">
          Teacher Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and password.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Account Security
              </h2>

              <p className="text-sm text-gray-500">
                Keep your teacher account secure.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Password recommendations
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-blue-700">
              <li>
                Do not share your password with
                students or other teachers.
              </li>

              <li>
                Avoid using your teacher number as
                your password.
              </li>

              <li>
                Use a password different from your
                personal accounts.
              </li>

              <li>
                Sign out when using a shared
                computer.
              </li>
            </ul>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
              <KeyRound className="h-5 w-5 text-purple-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Change Password
              </h2>

              <p className="text-xs text-gray-500">
                Confirm your current password first
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <PasswordInput
              id="teacher-current-password"
              label="Current password"
              value={form.currentPassword}
              onChange={(value) =>
                updateField(
                  "currentPassword",
                  value,
                )
              }
              visible={visible.current}
              onToggle={() =>
                toggleVisibility("current")
              }
              autoComplete="current-password"
              placeholder="Enter current password"
              disabled={saving}
            />

            <PasswordInput
              id="teacher-new-password"
              label="New password"
              value={form.newPassword}
              onChange={(value) =>
                updateField(
                  "newPassword",
                  value,
                )
              }
              visible={visible.new}
              onToggle={() =>
                toggleVisibility("new")
              }
              autoComplete="new-password"
              placeholder="Enter new password"
              disabled={saving}
            />

            <PasswordInput
              id="teacher-confirm-password"
              label="Confirm new password"
              value={form.confirmPassword}
              onChange={(value) =>
                updateField(
                  "confirmPassword",
                  value,
                )
              }
              visible={visible.confirm}
              onToggle={() =>
                toggleVisibility("confirm")
              }
              autoComplete="new-password"
              placeholder="Confirm new password"
              disabled={saving}
            />
          </div>

          <ul className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4">
            <PasswordRequirement
              valid={requirements.minimum}
            >
              At least 8 characters
            </PasswordRequirement>

            <PasswordRequirement
              valid={requirements.uppercase}
            >
              One uppercase letter
            </PasswordRequirement>

            <PasswordRequirement
              valid={requirements.lowercase}
            >
              One lowercase letter
            </PasswordRequirement>

            <PasswordRequirement
              valid={requirements.number}
            >
              One number
            </PasswordRequirement>

            <PasswordRequirement
              valid={requirements.matching}
            >
              Passwords match
            </PasswordRequirement>

            <PasswordRequirement
              valid={requirements.different}
            >
              Different from current password
            </PasswordRequirement>
          </ul>

          <button
            type="submit"
            disabled={
              saving ||
              !form.currentPassword ||
              !form.newPassword ||
              !form.confirmPassword
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}

            {saving
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}