import {
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  User,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import SubjectImage from "../subjectImage";
import StudentPerformanceSummary from "./studentPerformanceSummary";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

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

        <p className="mt-1 break-words text-sm font-medium text-gray-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function SubjectCard({ classRecord }) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  const teacherName =
    classRecord.teacher?.profile?.full_name ||
    "Teacher unavailable";

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
            Teacher
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700">
            {teacherName}
          </p>
        </div>
      </div>
    </article>
  );
}

function PasswordRequirement({
  valid,
  children,
}) {
  return (
    <li
      className={`flex items-center gap-2 text-xs ${valid
          ? "text-green-600"
          : "text-gray-400"
        }`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {children}
    </li>
  );
}

export default function StudentProfile({
  student,
  classes = [],
  loading,
  error,
}) {
  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    savingPassword,
    setSavingPassword,
  ] = useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [
    passwordSuccess,
    setPasswordSuccess,
  ] = useState("");

  const enrolledSubjects = useMemo(() => {
    const subjectMap = new Map();

    classes.forEach((classRecord) => {
      const subjectId =
        classRecord.subject_id ||
        classRecord.subject?.id;

      if (
        subjectId &&
        !subjectMap.has(subjectId)
      ) {
        subjectMap.set(
          subjectId,
          classRecord,
        );
      }
    });

    return Array.from(
      subjectMap.values(),
    ).sort((first, second) =>
      String(
        first.subject?.subject_name || "",
      ).localeCompare(
        String(
          second.subject?.subject_name || "",
        ),
      ),
    );
  }, [classes]);

  const passwordRequirements = {
    minimum:
      passwordForm.newPassword.length >= 8,

    uppercase:
      /[A-Z]/.test(
        passwordForm.newPassword,
      ),

    lowercase:
      /[a-z]/.test(
        passwordForm.newPassword,
      ),

    number:
      /\d/.test(passwordForm.newPassword),

    matching:
      Boolean(
        passwordForm.confirmPassword &&
        passwordForm.newPassword ===
        passwordForm.confirmPassword,
      ),

    different:
      Boolean(passwordForm.newPassword) &&
      passwordForm.newPassword !==
      passwordForm.currentPassword,
  };

  function updatePasswordField(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError(
        "Complete all password fields.",
      );
      return;
    }

    if (!passwordRequirements.minimum) {
      setPasswordError(
        "Your new password must contain at least 8 characters.",
      );
      return;
    }

    if (
      !passwordRequirements.uppercase ||
      !passwordRequirements.lowercase ||
      !passwordRequirements.number
    ) {
      setPasswordError(
        "Your new password must include an uppercase letter, lowercase letter, and number.",
      );
      return;
    }

    if (!passwordRequirements.matching) {
      setPasswordError(
        "The password confirmation does not match.",
      );
      return;
    }

    if (!passwordRequirements.different) {
      setPasswordError(
        "The new password must be different from your current password.",
      );
      return;
    }

    setSavingPassword(true);

    try {
      /*
       * Get the currently logged-in account before
       * verifying the existing password.
       */
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error(
          "Your session has expired. Please sign in again.",
        );
      }

      const email =
        student?.email || currentUser.email;

      if (!email) {
        throw new Error(
          "Your account email could not be found.",
        );
      }

      /*
       * Supabase has no direct verify-password method.
       * Signing in using the existing email and password
       * confirms that the current password is correct.
       */
      const {
        data: verificationData,
        error: verificationError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password:
            passwordForm.currentPassword,
        });

      if (
        verificationError ||
        !verificationData.user
      ) {
        throw new Error(
          "The current password is incorrect.",
        );
      }

      /*
       * Confirm that the verified user is still the
       * same student who opened this page.
       */
      if (
        verificationData.user.id !==
        currentUser.id
      ) {
        throw new Error(
          "The verified account does not match the current student account.",
        );
      }

      /*
       * Change the password only after verification.
       */
      const {
        error: updatePasswordError,
      } = await supabase.auth.updateUser({
        password:
          passwordForm.newPassword,
      });

      if (updatePasswordError) {
        throw updatePasswordError;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setPasswordSuccess(
        "Your password was changed successfully.",
      );
    } catch (changeError) {
      console.error(
        "Student password change failed:",
        changeError,
      );

      setPasswordError(
        changeError.message ||
        "Unable to change your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Loading student profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">
          Student Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          View your account, enrollment, subjects,
          and security information.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />

        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-30 w-30 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-sm">
              {getInitials(
                student?.full_name,
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-xl font-bold text-gray-900">
                {student?.full_name ||
                  "Student"}
              </h2>

              <p className="mt-1 text-sm font-medium text-blue-600">
                {student?.student_number ||
                  "No student number"}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-medium capitalize ${student?.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                }`}
            >
              {student?.status || "Unknown"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="font-bold text-gray-900">
                Student Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Information registered by the school
                administrator
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InformationItem
                icon={User}
                label="Full name"
                value={student?.full_name}
              />

              <InformationItem
                icon={Mail}
                label="School email"
                value={student?.email}
              />

              <InformationItem
                icon={Phone}
                label="Contact number"
                value={student?.contact_number}
              />

              <InformationItem
                icon={GraduationCap}
                label="Grade level"
                value={
                  student?.section?.grade_level
                    ? `Grade ${student.section.grade_level}`
                    : "Not assigned"
                }
              />

              <InformationItem
                icon={School}
                label="Section"
                value={
                  student?.section?.section_name ||
                  "Not assigned"
                }
              />

              <InformationItem
                icon={MapPin}
                label="Strand"
                value={
                  student?.section?.strand
                    ? `${student.section.strand.code} — ${student.section.strand.name}`
                    : "Not assigned"
                }
              />

              <InformationItem
                icon={BookOpen}
                label="School year"
                value={
                  student?.section?.school_year
                    ?.name || "Not assigned"
                }
              />

              <InformationItem
                icon={ShieldCheck}
                label="Account role"
                value="Student"
              />
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Contact your administrator if any
              information needs to be corrected.
            </p>
          </section>

          <StudentPerformanceSummary
            student={student}
            classes={classes}
          />

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-900">
                  Enrolled Subjects
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Subjects assigned to your current
                  section
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                {enrolledSubjects.length}{" "}
                {enrolledSubjects.length === 1
                  ? "subject"
                  : "subjects"}
              </span>
            </div>

            {enrolledSubjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No enrolled subjects
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Subjects will appear after teachers
                  are assigned to your section.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {enrolledSubjects.map(
                  (classRecord) => (
                    <SubjectCard
                      key={classRecord.id}
                      classRecord={
                        classRecord
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <aside>
          <form
            onSubmit={handleChangePassword}
            className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
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

            {passwordError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div
                role="status"
                className="mt-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {passwordSuccess}
              </div>
            )}

            <div className="mt-5">
              <label
                htmlFor="student-current-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Current password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="student-current-password"
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(event) =>
                    updatePasswordField(
                      "currentPassword",
                      event.target.value,
                    )
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={savingPassword}
                  required
                  className={`${inputClass} pl-9 pr-11`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (current) => !current,
                    )
                  }
                  disabled={savingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="student-new-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                New password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="student-new-password"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.newPassword
                  }
                  onChange={(event) =>
                    updatePasswordField(
                      "newPassword",
                      event.target.value,
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={savingPassword}
                  required
                  className={`${inputClass} pl-9 pr-11`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (current) => !current,
                    )
                  }
                  disabled={savingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="student-confirm-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Confirm new password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="student-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(event) =>
                    updatePasswordField(
                      "confirmPassword",
                      event.target.value,
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={savingPassword}
                  required
                  className={`${inputClass} pl-9 pr-11`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  disabled={savingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <ul className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4">
              <PasswordRequirement
                valid={
                  passwordRequirements.minimum
                }
              >
                At least 8 characters
              </PasswordRequirement>

              <PasswordRequirement
                valid={
                  passwordRequirements.uppercase
                }
              >
                One uppercase letter
              </PasswordRequirement>

              <PasswordRequirement
                valid={
                  passwordRequirements.lowercase
                }
              >
                One lowercase letter
              </PasswordRequirement>

              <PasswordRequirement
                valid={
                  passwordRequirements.number
                }
              >
                One number
              </PasswordRequirement>

              <PasswordRequirement
                valid={
                  passwordRequirements.matching
                }
              >
                Passwords match
              </PasswordRequirement>

              <PasswordRequirement
                valid={
                  passwordRequirements.different
                }
              >
                Different from current password
              </PasswordRequirement>
            </ul>

            <button
              type="submit"
              disabled={
                savingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}

              {savingPassword
                ? "Confirming and Changing..."
                : "Confirm and Change Password"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}