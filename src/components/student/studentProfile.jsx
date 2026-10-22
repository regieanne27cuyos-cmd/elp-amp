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
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/70 disabled:cursor-not-allowed disabled:opacity-60";

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
  color = "blue",
}) {
  const colorClasses = {
    blue: {
      wrapper:
        "bg-blue-50 text-blue-700",
      border:
        "group-hover:border-blue-200",
    },

    emerald: {
      wrapper:
        "bg-emerald-50 text-emerald-700",
      border:
        "group-hover:border-emerald-200",
    },

    violet: {
      wrapper:
        "bg-violet-50 text-violet-700",
      border:
        "group-hover:border-violet-200",
    },

    amber: {
      wrapper:
        "bg-amber-50 text-amber-700",
      border:
        "group-hover:border-amber-200",
    },
  };

  const selectedColor =
    colorClasses[color] ||
    colorClasses.blue;

  return (
    <div
      className={`group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedColor.border}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedColor.wrapper}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  action,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

function SubjectCard({ classRecord }) {
  const subjectName =
    classRecord.subject?.subject_name ||
    "Subject unavailable";

  const teacherName =
    classRecord.teacher?.profile
      ?.full_name ||
    classRecord.teacher?.full_name ||
    "Teacher unavailable";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <div className="relative overflow-hidden">
        <SubjectImage
          path={
            classRecord.subject?.image_path
          }
          name={subjectName}
          className="h-36 w-full transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />

        <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-sm backdrop-blur">
          {classRecord.subject
            ?.subject_code ||
            "No subject code"}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900">
          {subjectName}
        </h3>

        <p className="mt-1.5 text-xs font-medium capitalize text-slate-500">
          {classRecord.subject
            ?.subject_type ||
            "Subject"}
        </p>

        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
            {getInitials(teacherName)}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Teacher
            </p>

            <p className="truncate text-xs font-semibold text-slate-700">
              {teacherName}
            </p>
          </div>
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
      className={`flex items-center gap-2 text-xs transition-colors ${valid
        ? "font-medium text-emerald-600"
        : "text-slate-400"
        }`}
    >
      <CheckCircle2
        className={`h-3.5 w-3.5 shrink-0 ${valid
          ? "fill-emerald-50"
          : ""
          }`}
      />

      {children}
    </li>
  );
}

function PasswordField({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  visible,
  onToggle,
  onChange,
  disabled,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          className={`${inputClass} pl-10 pr-11`}
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
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

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

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
      passwordForm.newPassword.length >=
      8,

    uppercase:
      /[A-Z]/.test(
        passwordForm.newPassword,
      ),

    lowercase:
      /[a-z]/.test(
        passwordForm.newPassword,
      ),

    number:
      /\d/.test(
        passwordForm.newPassword,
      ),

    matching:
      Boolean(
        passwordForm.confirmPassword &&
        passwordForm.newPassword ===
        passwordForm.confirmPassword,
      ),

    different:
      Boolean(
        passwordForm.newPassword,
      ) &&
      passwordForm.newPassword !==
      passwordForm.currentPassword,
  };

  const sectionLabel =
    student?.section?.section_name ||
    "Not assigned";

  const gradeLabel =
    student?.section?.grade_level
      ? `Grade ${student.section.grade_level}`
      : "Grade not assigned";

  const strandLabel =
    student?.section?.strand?.code ||
    "No strand";

  function updatePasswordField(
    field,
    value,
  ) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  }

  async function handleChangePassword(
    event,
  ) {
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
      const {
        data: {
          user: currentUser,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !currentUser
      ) {
        throw new Error(
          "Your session has expired. Please sign in again.",
        );
      }

      const email =
        student?.email ||
        currentUser.email;

      if (!email) {
        throw new Error(
          "Your account email could not be found.",
        );
      }

      const {
        data: verificationData,
        error: verificationError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password:
              passwordForm.currentPassword,
          },
        );

      if (
        verificationError ||
        !verificationData.user
      ) {
        throw new Error(
          "The current password is incorrect.",
        );
      }

      if (
        verificationData.user.id !==
        currentUser.id
      ) {
        throw new Error(
          "The verified account does not match the current student account.",
        );
      }

      const {
        error: updatePasswordError,
      } =
        await supabase.auth.updateUser({
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
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
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
        className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
          My account
        </p>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
          Student Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your personal information,
          academic record, enrolled subjects,
          and account security.
        </p>
      </header>

      {/* Digital student ID banner */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-white shadow-sm">
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-500">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[32px] border-white/10" />

          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/10 blur-sm" />

          <div className="absolute left-8 top-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              ELP-AMP Student Portal
            </p>

            <p className="mt-1 text-sm text-white/75">
              Digital student profile
            </p>
          </div>
        </div>

        <div className="relative px-5 pb-6 sm:px-7">
          <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-blue-50 to-cyan-100 text-3xl font-extrabold text-blue-700 shadow-lg">
              {getInitials(
                student?.full_name,
              )}
            </div>

            <div className="min-w-0 flex-1 sm:pt-16">
              <h2 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">
                {student?.full_name ||
                  "Student"}
              </h2>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {student?.student_number ||
                    "No student number"}
                </span>

                <span className="text-xs font-medium text-slate-500">
                  {gradeLabel}
                </span>

                <span className="text-slate-300">
                  •
                </span>

                <span className="text-xs font-medium text-slate-500">
                  {sectionLabel}
                </span>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold capitalize sm:mt-16 ${student?.status === "active"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${student?.status === "active"
                  ? "bg-emerald-500"
                  : "bg-slate-400"
                  }`}
              />

              {student?.status ||
                "Unknown"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Grade level
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {gradeLabel}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Section
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {sectionLabel}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Strand
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {strandLabel}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Subjects
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {enrolledSubjects.length} enrolled
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          {/* Student information */}
          <section className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-5 shadow-sm sm:p-6">
            <SectionHeading
              title="Student Information"
              description="Personal and academic information registered by the school."
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InformationItem
                icon={User}
                label="Full name"
                value={student?.full_name}
                color="blue"
              />

              <InformationItem
                icon={Mail}
                label="School email"
                value={student?.email}
                color="violet"
              />

              <InformationItem
                icon={Phone}
                label="Contact number"
                value={
                  student?.contact_number
                }
                color="emerald"
              />

              <InformationItem
                icon={GraduationCap}
                label="Grade level"
                value={gradeLabel}
                color="amber"
              />

              <InformationItem
                icon={School}
                label="Section"
                value={sectionLabel}
                color="blue"
              />

              <InformationItem
                icon={MapPin}
                label="Strand"
                value={
                  student?.section?.strand
                    ? `${student.section.strand.code} — ${student.section.strand.name}`
                    : "Not assigned"
                }
                color="violet"
              />

              <InformationItem
                icon={BookOpen}
                label="School year"
                value={
                  student?.section
                    ?.school_year?.name ||
                  "Not assigned"
                }
                color="emerald"
              />

              <InformationItem
                icon={ShieldCheck}
                label="Account role"
                value="Student"
                color="amber"
              />
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-700">
              Contact your school administrator
              if any registered information needs
              to be corrected.
            </div>
          </section>

          {/* Student performance */}
          <StudentPerformanceSummary
            student={student}
            classes={classes}
          />

          {/* Enrolled subjects */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              title="Enrolled Subjects"
              description="Subjects assigned to your current section."
              action={
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                  {enrolledSubjects.length}{" "}
                  {enrolledSubjects.length ===
                    1
                    ? "subject"
                    : "subjects"}
                </span>
              }
            />

            {enrolledSubjects.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <BookOpen className="h-7 w-7 text-slate-300" />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-700">
                  No enrolled subjects
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Subjects will appear here
                  after teachers are assigned
                  to your section.
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

        {/* Account security */}
        <aside className="min-w-0">
          <form
            onSubmit={
              handleChangePassword
            }
            className="sticky top-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-200">
                  <KeyRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Account Security
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Update your account password
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-white/70 px-3.5 py-3 text-xs leading-5 text-blue-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />

                Confirm your current password
                before creating a new one.
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {passwordError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div
                  role="status"
                  className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                >
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
                <PasswordField
                  id="student-current-password"
                  label="Current password"
                  value={
                    passwordForm.currentPassword
                  }
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  visible={
                    showCurrentPassword
                  }
                  onToggle={() =>
                    setShowCurrentPassword(
                      (current) =>
                        !current,
                    )
                  }
                  onChange={(value) =>
                    updatePasswordField(
                      "currentPassword",
                      value,
                    )
                  }
                  disabled={
                    savingPassword
                  }
                />

                <PasswordField
                  id="student-new-password"
                  label="New password"
                  value={
                    passwordForm.newPassword
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  visible={showNewPassword}
                  onToggle={() =>
                    setShowNewPassword(
                      (current) =>
                        !current,
                    )
                  }
                  onChange={(value) =>
                    updatePasswordField(
                      "newPassword",
                      value,
                    )
                  }
                  disabled={
                    savingPassword
                  }
                />

                <PasswordField
                  id="student-confirm-password"
                  label="Confirm new password"
                  value={
                    passwordForm.confirmPassword
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  visible={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  onChange={(value) =>
                    updatePasswordField(
                      "confirmPassword",
                      value,
                    )
                  }
                  disabled={
                    savingPassword
                  }
                />
              </div>

              <ul className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
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
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}

                {savingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}