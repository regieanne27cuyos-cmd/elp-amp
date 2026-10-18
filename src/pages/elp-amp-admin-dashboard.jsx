import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BookUser,
  ShieldCheck,
  CheckCheck,
  ClipboardList,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Users,
  UsersRound,
  GraduationCap,
  Megaphone,
  UserCog,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

import AcademicSetup from "./academic-setup";
import TeacherModule from "../components/admin/teacherModule";
import StudentModule from "../components/admin/studentModule";
import AnnouncementModule from "../components/admin/announcementModule";
import TeachingAssignmentModule from "../components/admin/teachingAssignmentModule";
import SectionRosterModule from "../components/admin/sectionRosterModule";
import ArchivedStudentsModule from "../components/admin/archivedStudentsModule";
import ArchivedTeachersModule from "../components/admin/archivedTeachersModule";

import {
  Field,
  inputClass,
  Modal,
  RowActions,
  StatusBadge,
} from "../components/admin/adminUI";

const initialAdminNotifications = [
  {
    id: "admin-notification-1",
    type: "student",
    title: "New student account",
    message:
      "A new student account was recently added to the system.",
    time: "10 minutes ago",
    view: "students",
    read: false,
  },
  {
    id: "admin-notification-2",
    type: "teacher",
    title: "Teacher account updated",
    message:
      "A teacher account was recently updated.",
    time: "30 minutes ago",
    view: "teachers",
    read: false,
  },
  {
    id: "admin-notification-3",
    type: "assignment",
    title: "Teaching assignment created",
    message:
      "A teacher was assigned to a subject and section.",
    time: "1 hour ago",
    view: "teaching_assignments",
    read: false,
  },
  {
    id: "admin-notification-4",
    type: "announcement",
    title: "Announcement published",
    message:
      "A school announcement is currently active.",
    time: "Yesterday",
    view: "announcements",
    read: true,
  },
];

function getAdminNotificationStyle(type) {
  if (type === "student") {
    return {
      icon: GraduationCap,
      containerClass: "bg-green-100",
      iconClass: "text-green-600",
    };
  }

  if (type === "teacher") {
    return {
      icon: Users,
      containerClass: "bg-purple-100",
      iconClass: "text-purple-600",
    };
  }

  if (type === "assignment") {
    return {
      icon: ClipboardList,
      containerClass: "bg-orange-100",
      iconClass: "text-orange-600",
    };
  }

  return {
    icon: Megaphone,
    containerClass: "bg-blue-100",
    iconClass: "text-blue-600",
  };
}

const sidebarItems = [
  { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    key: "academic",
    icon: BookOpen,
    label: "Academic Setup",
  },
  {
    key: "section_rosters",
    label: "Section Rosters",
    icon: UsersRound,
  },
  {
    key: "teaching_assignments", icon: BookUser, label: "Teaching Assignments",
  },
  { key: "teachers", icon: Users, label: "Teachers" },
  { key: "students", icon: GraduationCap, label: "Students" },
  { key: "announcements", icon: Megaphone, label: "Announcements" },
  { key: "admins", icon: UserCog, label: "Admins" },
];

function getInitials(name) {
  if (!name) return "AD";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRole(role) {
  if (!role) return "Admin";

  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AdminForm({
  initialData,
  onCancel,
  onSave,
  saving,
}) {
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState({
    full_name: initialData?.full_name || "",
    email: initialData?.email || "",
    password: "",
    role: initialData?.role || "admin",
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
      !form.full_name.trim() ||
      !form.email.trim()
    ) {
      return;
    }

    if (!isEditing && form.password.length < 8) {
      return;
    }

    onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Field label="Full name">
        <input
          className={inputClass}
          value={form.full_name}
          onChange={(event) =>
            update("full_name", event.target.value)
          }
          placeholder="Juan Dela Cruz"
          required
        />
      </Field>

      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={form.email}
          onChange={(event) =>
            update("email", event.target.value)
          }
          placeholder="admin@ejist.edu.ph"
          required
        />
      </Field>

      <Field
        label={
          isEditing
            ? "New password (optional)"
            : "Password"
        }
      >
        <input
          className={inputClass}
          type="password"
          value={form.password}
          onChange={(event) =>
            update("password", event.target.value)
          }
          placeholder={
            isEditing
              ? "Leave blank to keep current password"
              : "Minimum 8 characters"
          }
          minLength={form.password ? 8 : undefined}
          required={!isEditing}
        />
      </Field>

      <Field label="Role">
        <select
          className={inputClass}
          value={form.role}
          onChange={(event) =>
            update("role", event.target.value)
          }
        >
          <option value="admin">Admin</option>
          <option value="super_admin">
            Super Admin
          </option>
        </select>
      </Field>

      <Field label="Status">
        <select
          className={inputClass}
          value={form.status}
          onChange={(event) =>
            update("status", event.target.value)
          }
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

function AdminModule({
  admins,
  setAdmins,
  loading,
  error,
  currentAdmin,
}) {
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const canManage =
    currentAdmin?.role === "super_admin" &&
    currentAdmin?.status === "active";

  function closeModal() {
    if (saving) return;

    setModalMode(null);
    setSelected(null);
    setActionError("");
  }

  async function callAdminFunction(body) {
    const { data, error: functionError } =
      await supabase.functions.invoke(
        "manage-admin",
        { body },
      );

    if (functionError) {
      let message = functionError.message;

      try {
        const responseBody =
          await functionError.context?.json();

        if (responseBody?.error) {
          message = responseBody.error;
        }
      } catch {

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
        const result = await callAdminFunction({
          action: "update",
          id: selected.id,
          ...form,
        });

        setAdmins((list) =>
          list.map((admin) =>
            admin.id === selected.id
              ? result.admin
              : admin,
          ),
        );
      } else {
        const result = await callAdminFunction({
          action: "create",
          ...form,
        });

        setAdmins((list) =>
          [...list, result.admin].sort(
            (first, second) =>
              new Date(first.created_at) -
              new Date(second.created_at),
          ),
        );
      }

      setModalMode(null);
      setSelected(null);
    } catch (saveError) {
      console.error(saveError);

      setActionError(
        saveError.message ||
        "Unable to save the administrator.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(admin) {
    const confirmed = window.confirm(
      `Permanently delete "${admin.full_name}"?`,
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await callAdminFunction({
        action: "delete",
        id: admin.id,
      });

      setAdmins((list) =>
        list.filter((item) => item.id !== admin.id),
      );
    } catch (deleteError) {
      console.error(deleteError);

      setActionError(
        deleteError.message ||
        "Unable to delete the administrator.",
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Registered Admins
          </h2>

          <p className="text-sm text-gray-400">
            {loading
              ? "Loading records..."
              : `${admins.length} total records`}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setActionError("");
              setModalMode("add");
            }}
            className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-900"
          >
            <Plus className="w-4 h-4" />
            Add Admin
          </button>
        )}
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError || error}
        </div>
      )}

      {!canManage && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Only a super administrator can add, edit,
          or delete administrator accounts.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">
                Admin ID
              </th>

              <th className="px-5 py-3 font-medium">
                Name
              </th>

              <th className="px-5 py-3 font-medium">
                Role
              </th>

              <th className="px-5 py-3 font-medium">
                Status
              </th>

              {canManage && (
                <th className="px-5 py-3 font-medium text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {admins.map((admin) => (
              <tr
                key={admin.id}
                className="border-t border-gray-50"
              >
                <td
                  className="px-5 py-3.5 text-gray-500 font-mono text-xs"
                  title={admin.id}
                >
                  {admin.id.slice(0, 8).toUpperCase()}
                </td>

                <td className="px-5 py-3.5">
                  <p className="font-medium text-gray-900">
                    {admin.full_name}
                  </p>

                  <p className="text-xs text-gray-400">
                    {admin.email || "No email saved"}
                  </p>
                </td>

                <td className="px-5 py-3.5 text-gray-600">
                  {formatRole(admin.role)}
                </td>

                <td className="px-5 py-3.5">
                  <StatusBadge status={admin.status} />
                </td>

                {canManage && (
                  <td className="px-5 py-3.5">
                    <RowActions
                      onEdit={() => {
                        setSelected(admin);
                        setActionError("");
                        setModalMode("edit");
                      }}
                      onDelete={() =>
                        handleDelete(admin)
                      }
                    />
                  </td>
                )}
              </tr>
            ))}

            {loading && (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-5 py-8 text-center text-gray-400"
                >
                  Loading registered admins...
                </td>
              </tr>
            )}

            {!loading && admins.length === 0 && (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-5 py-8 text-center text-gray-400"
                >
                  No registered administrator accounts.
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
              ? "Edit Administrator"
              : "Add Administrator"
          }
          onClose={closeModal}
        >
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          <AdminForm
            initialData={selected}
            onCancel={closeModal}
            onSave={handleSave}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}

function OverviewCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div
        className={`w-11 h-11 rounded-xl ${tint} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Overview({
  adminProfile,
  teachers,
  students,
  announcements,
  admins,
  onNavigate,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {adminProfile?.full_name || "Admin"}
        </h1>
        <p className="text-slate-300 mt-1">
          Here&apos;s an overview of ELP-AMP&apos;s current records.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard
          icon={Users}
          label="Total Teachers"
          value={teachers.length}
          tint="bg-blue-100 text-blue-600"
        />
        <OverviewCard
          icon={GraduationCap}
          label="Total Students"
          value={students.length}
          tint="bg-green-100 text-green-600"
        />
        <OverviewCard
          icon={Megaphone}
          label="Announcements"
          value={announcements.length}
          tint="bg-orange-100 text-orange-600"
        />
        <OverviewCard
          icon={UserCog}
          label="Admin Accounts"
          value={admins.length}
          tint="bg-purple-100 text-purple-600"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: "teachers", icon: Users, label: "Manage Teachers" },
          { key: "students", icon: GraduationCap, label: "Manage Students" },
          {
            key: "announcements",
            icon: Megaphone,
            label: "Manage Announcements",
          },
          { key: "admins", icon: UserCog, label: "Manage Admins" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => onNavigate(key)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:border-slate-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
              <span className="font-semibold text-gray-900">{label}</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  //admin
  const [activeView, setActiveView] = useState("dashboard");
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const canDelete =
    adminProfile?.role === "super_admin";

  const [
    notifications,
    setNotifications,
  ] = useState(initialAdminNotifications);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const unreadNotificationCount =
    notifications.filter(
      (notification) => !notification.read,
    ).length;

  function toggleNotifications() {
    setNotificationsOpen(
      (current) => !current,
    );
  }

  function closeNotifications() {
    setNotificationsOpen(false);
  }

  function markNotificationAsRead(
    notificationId,
  ) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
            ...notification,
            read: true,
          }
          : notification,
      ),
    );
  }

  function markAllNotificationsAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function openNotification(notification) {
    markNotificationAsRead(notification.id);
    setNotificationsOpen(false);

    if (notification.view) {
      setActiveView(notification.view);
    }
  }

  //teacher
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [teachersError, setTeachersError] = useState("");

  //student
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] =
    useState(true);
  const [studentsError, setStudentsError] =
    useState("");

  //announcement
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState("");


  //use effect for teachers
  useEffect(() => {
    if (!adminProfile) return;

    let active = true;

    async function loadTeachers() {
      setTeachersLoading(true);
      setTeachersError("");

      try {
        const { data, error } = await supabase
          .from("teacher_details")
          .select(`
          id,
          teacher_number,
          contact_number,
          employment_type,
          created_at,
          updated_at,
          profile:profiles!teacher_details_id_fkey (
  full_name,
  email,
  role,
  status,
  archived_at,
  archived_by
)
        `)
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        if (!active) return;

        const formattedTeachers = (data || []).map(
          (teacher) => {
            const profile = Array.isArray(teacher.profile)
              ? teacher.profile[0]
              : teacher.profile;

            return {
              id: teacher.id,
              teacher_number: teacher.teacher_number,
              contact_number: teacher.contact_number,
              employment_type: teacher.employment_type,
              created_at: teacher.created_at,
              updated_at: teacher.updated_at,
              full_name:
                profile?.full_name || "Unnamed Teacher",
              email: profile?.email || "",
              role: profile?.role || "teacher",
              status: profile?.status || "inactive",

              archived_at:
                profile?.archived_at || null,

              archived_by:
                profile?.archived_by || null,
            };
          },
        );

        const activeTeachers =
          formattedTeachers
            .filter(
              (teacher) =>
                !teacher.archived_at,
            )
            .sort((first, second) =>
              String(
                first.full_name || "",
              ).localeCompare(
                String(
                  second.full_name || "",
                ),
                undefined,
                {
                  sensitivity: "base",
                },
              ),
            );

        setTeachers(activeTeachers);

      } catch (error) {
        console.error("Failed to load teachers:", error);

        if (active) {
          setTeachers([]);
          setTeachersError(
            error.message ||
            "Unable to load teacher accounts.",
          );
        }
      } finally {
        if (active) {
          setTeachersLoading(false);
        }
      }
    }

    loadTeachers();

    return () => {
      active = false;
    };
  }, [adminProfile]);


  useEffect(() => {
    if (!adminProfile) return;

    let active = true;

    async function loadStudents() {
      setStudentsLoading(true);
      setStudentsError("");

      try {
        const {
          data,
          error: queryError,
        } = await supabase
          .from("student_details")
          .select(`
        id,
        student_number,
        first_name,
        middle_name,
        last_name,
        suffix,
        section_id,
        contact_number,
        created_at,
        updated_at,
        profile:profiles!student_details_id_fkey (
  full_name,
  email,
  role,
  status,
  archived_at,
  archived_by
),
        section:sections!student_details_section_id_fkey (
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
        )
      `)
          .order("last_name", {
            ascending: true,
          })
          .order("first_name", {
            ascending: true,
          });

        if (queryError) {
          throw queryError;
        }

        if (!active) return;

        const formattedStudents = (
          data || []
        ).map((student) => {
          const profile = Array.isArray(
            student.profile,
          )
            ? student.profile[0] || null
            : student.profile || null;

          const rawSection = Array.isArray(
            student.section,
          )
            ? student.section[0] || null
            : student.section || null;

          const section = rawSection
            ? {
              ...rawSection,

              strand: Array.isArray(
                rawSection.strand,
              )
                ? rawSection.strand[0] ||
                null
                : rawSection.strand ||
                null,

              school_year: Array.isArray(
                rawSection.school_year,
              )
                ? rawSection
                  .school_year[0] ||
                null
                : rawSection.school_year ||
                null,
            }
            : null;

          return {
            ...student,

            first_name:
              student.first_name || "",

            middle_name:
              student.middle_name || "",

            last_name:
              student.last_name || "",

            suffix:
              student.suffix || "",

            full_name:
              profile?.full_name || "",

            email:
              profile?.email || "",

            role:
              profile?.role ||
              "student",

            status:
              profile?.status ||
              "inactive",

            archived_at:
              profile?.archived_at ||
              null,

            archived_by:
              profile?.archived_by ||
              null,

            section,
          };
        });

        const activeStudents =
          formattedStudents.filter(
            (student) =>
              !student.archived_at,
          );

        setStudents(activeStudents);
      } catch (loadError) {
        console.error(
          "Failed to load students:",
          loadError,
        );

        if (active) {
          setStudents([]);

          setStudentsError(
            loadError instanceof Error
              ? loadError.message
              : loadError?.message ||
              "Unable to load student accounts.",
          );
        }
      } finally {
        if (active) {
          setStudentsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, [adminProfile]);

  useEffect(() => {
    if (!adminProfile) return;

    let active = true;

    async function loadAnnouncements() {
      setAnnouncementsLoading(true);
      setAnnouncementsError("");

      try {
        const { data, error } = await supabase
          .from("announcements")
          .select(`
          id,
          title,
          details,
          image_path,
          expires_at,
          created_at,
          updated_at,
          created_by
        `)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (!active) return;

        const formattedAnnouncements = (data || []).map(
          (announcement) => {
            let imageUrl = null;

            if (announcement.image_path) {
              const { data: publicUrlData } = supabase.storage
                .from("announcement-images")
                .getPublicUrl(announcement.image_path);

              imageUrl = publicUrlData?.publicUrl || null;
            }

            return {
              ...announcement,
              image_url: imageUrl,
            };
          },
        );

        setAnnouncements(formattedAnnouncements);
      } catch (error) {
        console.error("Failed to load announcements:", error);

        if (active) {
          setAnnouncements([]);
          setAnnouncementsError(
            error.message || "Unable to load announcements.",
          );
        }
      } finally {
        if (active) {
          setAnnouncementsLoading(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      active = false;
    };
  }, [adminProfile]);


  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      setProfileLoading(true);
      setAdminsLoading(true);
      setDashboardError("");
      setAdminsError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, status")
          .eq("id", user.id)
          .single();

        const allowedRoles = ["admin", "super_admin"];

        if (
          profileError ||
          !profile ||
          !allowedRoles.includes(profile.role) ||
          profile.status !== "active"
        ) {
          await supabase.auth.signOut();
          navigate("/admin/login", { replace: true });
          return;
        }

        if (!active) return;

        setAdminProfile(profile);
        setProfileLoading(false);

        const {
          data: registeredAdmins,
          error: registeredAdminsError,
        } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, status, created_at")
          .in("role", ["admin", "super_admin"])
          .order("created_at", { ascending: true });

        if (!active) return;

        if (registeredAdminsError) {
          console.error(
            "Failed to load registered admins:",
            registeredAdminsError,
          );

          setAdminsError(
            "Unable to load the registered administrator accounts.",
          );

          setAdmins([]);
        } else {
          setAdmins(registeredAdmins || []);
        }
      } catch (error) {
        console.error("Failed to load admin dashboard:", error);

        if (active) {
          setDashboardError(
            "Unable to load the admin dashboard. Please refresh the page.",
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
          setAdminsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  if (dashboardError || !adminProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col gap-4 items-center justify-center p-6">
        <p className="text-sm text-red-600">
          {dashboardError || "Unable to load the administrator profile."}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Try again
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:underline"
        >
          Return to login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <aside className="w-60 bg-slate-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/15">
          <ShieldCheck className="w-6 h-6 text-white" />

          <span className="font-bold text-lg text-white">
            ELP-AMP Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map(({ key, icon: Icon, label }) => (
            <button
              type="button"
              key={key}
              onClick={() => setActiveView(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === key
                ? "bg-white/15 text-white"
                : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className={`relative rounded-lg p-2 transition-colors ${notificationsOpen
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
                  }`}
                aria-label="View notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" />

                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unreadNotificationCount > 9
                      ? "9+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <button
                    type="button"
                    onClick={closeNotifications}
                    aria-label="Close notifications"
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          Notifications
                        </h2>

                        <p className="text-xs text-gray-400">
                          {unreadNotificationCount === 0
                            ? "No unread notifications"
                            : `${unreadNotificationCount} unread notification${unreadNotificationCount === 1
                              ? ""
                              : "s"
                            }`}
                        </p>
                      </div>

                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          onClick={
                            markAllNotificationsAsRead
                          }
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <Bell className="mx-auto h-9 w-9 text-gray-300" />

                          <p className="mt-3 text-sm font-medium text-gray-700">
                            No notifications
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            New notifications will appear
                            here.
                          </p>
                        </div>
                      ) : (
                        notifications.map(
                          (notification) => {
                            const {
                              icon: Icon,
                              containerClass,
                              iconClass,
                            } =
                              getAdminNotificationStyle(
                                notification.type,
                              );

                            return (
                              <button
                                key={notification.id}
                                type="button"
                                onClick={() =>
                                  openNotification(
                                    notification,
                                  )
                                }
                                className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${notification.read
                                  ? "bg-white"
                                  : "bg-blue-50/40"
                                  }`}
                              >
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${containerClass}`}
                                >
                                  <Icon
                                    className={`h-4 w-4 ${iconClass}`}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-2">
                                    <p className="flex-1 text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>

                                    {!notification.read && (
                                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                  </div>

                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                    {notification.message}
                                  </p>

                                  <p className="mt-1 text-[11px] text-gray-400">
                                    {notification.time}
                                  </p>
                                </div>
                              </button>
                            );
                          },
                        )
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView(
                              "announcements",
                            );
                            closeNotifications();
                          }}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          View announcements
                        </button>

                        <button
                          type="button"
                          onClick={clearNotifications}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Admin account menu */}
            <div className="group relative pl-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-50"
                aria-haspopup="menu"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                  {getInitials(
                    adminProfile?.full_name,
                  )}
                </div>

                <div className="hidden text-left leading-tight sm:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-gray-900">
                    {adminProfile?.full_name ||
                      "Administrator"}
                  </p>

                  <p className="text-xs text-gray-400">
                    {formatRole(adminProfile?.role)}
                  </p>
                </div>

                <ChevronDown className="hidden h-4 w-4 text-gray-400 transition-transform group-hover:rotate-180 group-focus-within:rotate-180 sm:block" />
              </button>

              <div className="invisible absolute right-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {adminProfile?.full_name ||
                        "Administrator"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {adminProfile?.email ||
                        "No email"}
                    </p>

                    <p className="mt-1 text-xs font-medium text-blue-600">
                      {formatRole(
                        adminProfile?.role,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeView === "dashboard" && (
            <Overview
              adminProfile={adminProfile}
              teachers={teachers}
              students={students}
              announcements={announcements}
              admins={admins}
              onNavigate={setActiveView}
            />
          )}

          {activeView === "teachers" && (
            <TeacherModule
              teachers={teachers}
              setTeachers={setTeachers}
              loading={teachersLoading}
              error={teachersError}
              canDelete={
                adminProfile?.role ===
                "super_admin"
              }
              onOpenArchivedTeachers={() =>
                setActiveView(
                  "archived-teachers",
                )
              }
            />
          )}

          {activeView ===
            "archived-teachers" && (
              <>
                {adminProfile?.role ===
                  "super_admin" ? (
                  <ArchivedTeachersModule
                    adminProfile={adminProfile}
                    onBack={() =>
                      setActiveView("teachers")
                    }
                  />
                ) : (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
                  >
                    Only a super administrator can
                    view archived teachers.
                  </div>
                )}
              </>
            )}

          {activeView === "teaching_assignments" && (
            <TeachingAssignmentModule />
          )}

          {activeView === "students" && (
            <StudentModule
              students={students}
              setStudents={setStudents}
              loading={studentsLoading}
              error={studentsError}
              canDelete={
                adminProfile?.role ===
                "super_admin"
              }
              onOpenArchivedStudents={() =>
                setActiveView(
                  "archived-students",
                )
              }
            />
          )}

          {activeView ===
            "archived-students" && (
              <>
                {adminProfile?.role ===
                  "super_admin" ? (
                  <ArchivedStudentsModule
                    adminProfile={adminProfile}
                    onBack={() =>
                      setActiveView("students")
                    }
                  />
                ) : (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-700"
                  >
                    Only a super administrator can
                    view archived students.
                  </div>
                )}
              </>
            )}

          {activeView === "announcements" && (
            <AnnouncementModule
              announcements={announcements}
              setAnnouncements={setAnnouncements}
              loading={announcementsLoading}
              error={announcementsError}
            />
          )}

          {activeView === "academic" && (
            <AcademicSetup
              canDelete={canDelete}
            />
          )}

          {activeView === "section_rosters" && (
            <SectionRosterModule />
          )}

          {activeView === "admins" && (
            <AdminModule
              admins={admins}
              setAdmins={setAdmins}
              loading={adminsLoading}
              error={adminsError}
              currentAdmin={adminProfile}
            />
          )}
        </main>
      </div>
    </div>
  );
}