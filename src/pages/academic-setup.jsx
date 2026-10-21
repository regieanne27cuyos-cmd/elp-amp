import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  CalendarDays,
  BookOpen,
  UsersRound,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import SubjectImage, {
  getSubjectImageUrl,
} from "../components/subjectImage";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:bg-white";

const tabs = [
  {
    key: "school_years",
    label: "School Years",
    icon: CalendarDays,
  },
  {
    key: "strands",
    label: "Strands",
    icon: UsersRound,
  },
  {
    key: "subjects",
    label: "Subjects",
    icon: BookOpen,
  },
  {
    key: "sections",
    label: "Sections",
    icon: UsersRound,
  },
];

const sortFields = {
  school_years: "start_date",
  strands: "code",
  subjects: "subject_code",
  sections: "section_name",
};

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const gradeOptions = [
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
];

const textField = (name, label, placeholder = "", required = true) => ({
  name,
  label,
  placeholder,
  required,
  type: "text",
});

const selectField = (name, label, options, required = true) => ({
  name,
  label,
  options,
  required,
  type: "select",
});

const dateFields = [
  { name: "start_date", label: "Start date", type: "date", required: true },
  { name: "end_date", label: "End date", type: "date", required: true },
];

const statusField = selectField("status", "Status", statusOptions);

function formatStatus(value) {
  const text = String(value || "inactive");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCurrentManilaDate() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  return formatter.format(
    new Date(),
  );
}

function datesOverlap(
  firstStart,
  firstEnd,
  secondStart,
  secondEnd,
) {
  return (
    firstStart <= secondEnd &&
    firstEnd >= secondStart
  );
}

function getAutomaticSchoolYearStatus(
  startDate,
  endDate,
) {
  const today =
    getCurrentManilaDate();

  return (
    today >= startDate &&
    today <= endDate
  )
    ? "active"
    : "inactive";
}


function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "active"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-500"
        }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function RecordModal({ title, busy, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();

    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="academic-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 id="academic-modal-title" className="font-bold text-gray-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          Close
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

function buildConfigs(records) {
  const years = records.school_years.map((row) => ({
    value: row.id,
    label: row.name,
  }));
  const strands = records.strands.map((row) => ({
    value: row.id,
    label: `${row.code} — ${row.name}`,
  }));

  const yearName = (id) =>
    records.school_years.find((row) => row.id === id)?.name || "Unknown year";

  const strandName = (id) =>
    !id
      ? "All strands"
      : records.strands.find((row) => row.id === id)?.code || "Unknown strand";

  const statusColumn = {
    label: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  };

  return {
    school_years: {
      singular: "School Year",

      defaults: {
        name: "",
        start_date: "",
        end_date: "",
        status: "inactive",
      },

      fields: [
        textField(
          "name",
          "School year",
          "2026-2027",
        ),

        ...dateFields,
      ],
      columns: [
        { label: "School Year", render: (row) => row.name },
        { label: "Start Date", render: (row) => formatDate(row.start_date) },
        { label: "End Date", render: (row) => formatDate(row.end_date) },
        statusColumn,
      ],
    },
    strands: {
      singular: "Strand",
      defaults: { code: "", name: "", description: "", status: "active" },
      fields: [
        textField("code", "Strand code", "STEM"),
        textField("name", "Strand name", "Science, Technology, Engineering and Mathematics"),
        { name: "description", label: "Description", type: "textarea" },
        statusField,
      ],
      columns: [
        { label: "Code", render: (row) => row.code },
        { label: "Strand", render: (row) => row.name },
        { label: "Description", render: (row) => row.description || "—" },
        statusColumn,
      ],
    },
    subjects: {
      singular: "Subject",

      defaults: {
        subject_code: "",
        subject_name: "",
        grade_level: "11",
        subject_type: "core",
        strand_id: "",
        status: "active",
      },

      fields: [
        textField(
          "subject_code",
          "Subject code",
          "GEN-MATH",
        ),

        textField(
          "subject_name",
          "Subject name",
          "General Mathematics",
        ),

        selectField(
          "grade_level",
          "Grade level",
          gradeOptions,
        ),

        selectField(
          "subject_type",
          "Subject type",
          [
            {
              value: "core",
              label: "Core",
            },
            {
              value: "applied",
              label: "Applied",
            },
            {
              value: "specialized",
              label: "Specialized",
            },
          ],
        ),

        selectField(
          "strand_id",
          "Strand",
          [
            {
              value: "",
              label: "All strands",
            },
            ...strands,
          ],
          false,
        ),

        statusField,
      ],

      columns: [
        {
          label: "Subject",
          render: (row) => (
            <div className="flex items-center gap-3">
              <SubjectImage
                path={row.image_path}
                name={row.subject_name}
                className="h-12 w-20 shrink-0 rounded-lg"
              />

              <div>
                <p className="font-medium text-gray-900">
                  {row.subject_name}
                </p>

                <p className="text-xs text-gray-400">
                  {row.subject_code}
                </p>
              </div>
            </div>
          ),
        },

        {
          label: "Level",
          render: (row) =>
            `Grade ${row.grade_level}`,
        },

        {
          label: "Type",
          render: (row) =>
            formatStatus(row.subject_type),
        },

        {
          label: "Strand",
          render: (row) =>
            strandName(row.strand_id),
        },

        statusColumn,
      ],
    },
    sections: {
      singular: "Section",
      defaults: {
        section_name: "",
        grade_level: "11",
        strand_id: "",
        school_year_id: "",
        status: "active",
      },
      fields: [
        textField("section_name", "Section name", "ICT A"),
        selectField("grade_level", "Grade level", gradeOptions),
        selectField("strand_id", "Strand", strands),
        selectField("school_year_id", "School year", years),
        statusField,
      ],
      columns: [
        { label: "Section", render: (row) => row.section_name },
        { label: "Grade Level", render: (row) => `Grade ${row.grade_level}` },
        { label: "Strand", render: (row) => strandName(row.strand_id) },
        { label: "School Year", render: (row) => yearName(row.school_year_id) },
        statusColumn,
      ],
    },
  };
}

export default function AcademicSetup() {
  const [activeTab, setActiveTab] = useState("school_years");
  const [records, setRecords] = useState({
    school_years: [],
    strands: [],
    subjects: [],
    sections: [],
  });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  const configs = buildConfigs(records);
  const activeConfig = configs[activeTab];

  const activeSchoolYear =
    useMemo(() => {
      const today =
        getCurrentManilaDate();

      return (
        records.school_years.find(
          (schoolYear) =>
            schoolYear.status ===
            "active" &&
            today >=
            schoolYear.start_date &&
            today <=
            schoolYear.end_date,
        ) || null
      );
    }, [records.school_years]);

    
  const groupedSections = useMemo(() => {
    const strandLookup = new Map(
      records.strands.map((strand) => [
        strand.id,
        strand,
      ]),
    );

    const groups = new Map();

    records.sections.forEach((section) => {
      const strand =
        strandLookup.get(section.strand_id) || null;

      const groupKey =
        strand?.id || "unassigned-strand";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          strand,
          sections: [],
        });
      }

      groups.get(groupKey).sections.push(section);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,

        sections: [...group.sections].sort(
          (first, second) =>
            String(first.section_name || "").localeCompare(
              String(second.section_name || ""),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            ),
        ),
      }))
      .sort((first, second) => {
        if (!first.strand && second.strand) return 1;
        if (first.strand && !second.strand) return -1;

        const firstName =
          first.strand?.code ||
          first.strand?.name ||
          "";

        const secondName =
          second.strand?.code ||
          second.strand?.name ||
          "";

        return firstName.localeCompare(
          secondName,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          },
        );
      });
  }, [records.sections, records.strands]);

  const groupedSubjects = useMemo(() => {
    const groups = new Map();

    records.subjects.forEach((subject) => {
      const subjectType =
        String(subject.subject_type || "uncategorized")
          .trim()
          .toLowerCase();

      if (!groups.has(subjectType)) {
        groups.set(subjectType, {
          type: subjectType,
          subjects: [],
        });
      }

      groups.get(subjectType).subjects.push(subject);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,

        subjects: [...group.subjects].sort(
          (first, second) =>
            String(first.subject_name || "").localeCompare(
              String(second.subject_name || ""),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              },
            ),
        ),
      }))
      .sort((first, second) =>
        first.type.localeCompare(
          second.type,
          undefined,
          {
            sensitivity: "base",
          },
        ),
      );
  }, [records.subjects]);

  function getStrandName(strandId) {
    if (!strandId) return "All strands";

    const strand = records.strands.find(
      (record) => record.id === strandId,
    );

    return strand?.code || "Unknown strand";
  }

  function getSchoolYearName(schoolYearId) {
    return (
      records.school_years.find(
        (schoolYear) =>
          schoolYear.id === schoolYearId,
      )?.name || "Unknown school year"
    );
  }

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        const results = await Promise.all(
          tabs.map(({ key }) =>
            supabase
              .from(key)
              .select("*")
              .order(sortFields[key], {
                ascending: key !== "school_years",
              }),
          ),
        );

        if (!active) return;

        const failure = results.find((result) => result.error);
        if (failure) throw failure.error;

        setRecords(
          Object.fromEntries(
            tabs.map(({ key }, index) => [key, results[index].data || []]),
          ),
        );
      } catch (error) {
        if (active) {
          setPageError(error.message || "Unable to load academic records.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function resetModal() {
    setModal(null);
    setForm({});
    setImageFile(null);
    setRemoveImage(false);
    setActionError("");
  }

  function openModal(record = null) {
    if (busyRef.current) return;

    if (
      activeTab === "sections" &&
      !record &&
      !activeSchoolYear
    ) {
      setNotice(
        "There is no active school year. Check the school-year dates before adding a section.",
      );

      return;
    }

    const initialForm = {
      ...activeConfig.defaults,
      ...(record || {}),
    };

    if (
      activeTab === "sections" &&
      !record
    ) {
      initialForm.school_year_id =
        activeSchoolYear.id;
    }

    setForm(initialForm);

    setImageFile(null);
    setRemoveImage(false);

    setFileKey(
      (value) => value + 1,
    );

    setActionError("");
    setNotice("");

    setModal({
      entity: activeTab,
      record,
    });
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!imageTypes[file.type] || file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setActionError("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setActionError("");
  }

  async function cleanOldImage(path) {
    if (!path) return;

    try {
      // A path still referenced by a subject must be kept.
      const { count, error: lookupError } = await supabase
        .from("subjects")
        .select("id", { count: "exact", head: true })
        .eq("image_path", path);

      if (lookupError) throw lookupError;
      if (count !== 0) return;

      const { error } = await supabase.storage
        .from("subject-images")
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error("Subject image cleanup failed:", error);
      setNotice(
        "The record was saved, but an unused image could not be removed from Storage.",
      );
    }
  }

  function createPayload(entity) {
    const payload = {};

    for (const field of configs[entity].fields) {
      const raw = form[field.name] ?? "";
      const value = typeof raw === "string" ? raw.trim() : raw;

      if (field.required && value === "") {
        throw new Error(`${field.label} is required.`);
      }

      payload[field.name] = value;
    }

    if (
      payload.start_date &&
      payload.end_date <
      payload.start_date
    ) {
      throw new Error(
        "End date cannot be before the start date.",
      );
    }

    if (entity === "school_years") {
      const schoolYearNamePattern =
        /^\d{4}-\d{4}$/;

      if (
        !schoolYearNamePattern.test(
          payload.name,
        )
      ) {
        throw new Error(
          "School year must use the format YYYY-YYYY, for example 2026-2027.",
        );
      }

      const [
        startingYear,
        endingYear,
      ] = payload.name
        .split("-")
        .map(Number);

      if (
        endingYear !==
        startingYear + 1
      ) {
        throw new Error(
          "The ending year must be one year after the starting year.",
        );
      }

      const existingOverlap =
        records.school_years.find(
          (schoolYear) =>
            schoolYear.id !==
            modal?.record?.id &&
            datesOverlap(
              payload.start_date,
              payload.end_date,
              schoolYear.start_date,
              schoolYear.end_date,
            ),
        );

      if (existingOverlap) {
        throw new Error(
          `The selected dates overlap with ${existingOverlap.name} (${formatDate(
            existingOverlap.start_date,
          )} to ${formatDate(
            existingOverlap.end_date,
          )}).`,
        );
      }

      payload.status =
        getAutomaticSchoolYearStatus(
          payload.start_date,
          payload.end_date,
        );
    }

    if (entity === "subjects" || entity === "sections") {
      payload.grade_level = Number(payload.grade_level);
    }

    if (entity === "sections") {

      if (!modal?.record) {
        if (!activeSchoolYear) {
          throw new Error(
            "There is no active school year. Configure the current school year first.",
          );
        }

        if (
          payload.school_year_id !==
          activeSchoolYear.id
        ) {
          throw new Error(
            "New sections can only be added to the active school year.",
          );
        }
      }
    }

    if (entity === "subjects") {
      payload.strand_id =
        payload.strand_id || null;

      payload.subject_code =
        payload.subject_code.toUpperCase();
    }

    if (entity === "strands") {
      payload.code = payload.code.toUpperCase();
      payload.description = payload.description || null;
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!modal || busyRef.current) return;

    busyRef.current = true;
    setSaving(true);
    setActionError("");
    setNotice("");

    const { entity, record } = modal;
    let uploadedPath = null;

    try {
      const payload = createPayload(entity);

      if (entity === "subjects") {
        payload.image_path = removeImage ? null : record?.image_path || null;

        if (imageFile) {
          const path = `covers/${crypto.randomUUID()}.${imageTypes[imageFile.type]}`;

          const { error: uploadError } = await supabase.storage
            .from("subject-images")
            .upload(path, imageFile, {
              contentType: imageFile.type,
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;
          uploadedPath = path;
          payload.image_path = path;
        }
      }

      let query;

      if (record) {
        query = supabase.from(entity).update(payload).eq("id", record.id);

        // Prevent overwriting a cover changed by another admin.
        if (entity === "subjects") {
          query = record.image_path
            ? query.eq("image_path", record.image_path)
            : query.is("image_path", null);
        }
      } else {
        query = supabase.from(entity).insert(payload);
      }

      const { data, error } = await query.select("*").single();
      if (error) throw error;

      setRecords((current) => ({
        ...current,
        [entity]: record
          ? current[entity].map((item) => item.id === record.id ? data : item)
          : [...current[entity], data],
      }));

      // Close directly: the user-facing close handler blocks while saving.
      resetModal();

      if (
        entity === "subjects" &&
        record?.image_path &&
        record.image_path !== data.image_path
      ) {
        await cleanOldImage(record.image_path);
      }
    } catch (error) {
      let message = error.message || "Unable to save the record.";

      if (error.code === "23505") message = "This record already exists.";
      if (error.code === "23503") message = "A selected record is missing or still in use.";
      if (error.code === "23514") message = "Check the dates and selected values.";
      if (error.code === "PGRST116") {
        message = "The record changed or could not be updated. Refresh and try again.";
      }

      if (uploadedPath) {
        // Keep the upload when the database result is uncertain.
        // A lost response could mean the database already saved this path.
        message += " An image was uploaded; refresh before retrying to check whether the record saved.";
      }

      setActionError(message);
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    if (busyRef.current) return;
    if (!window.confirm(`Delete this ${activeConfig.singular.toLowerCase()}?`)) return;

    const entity = activeTab;
    busyRef.current = true;
    setSaving(true);
    setPageError("");
    setNotice("");

    try {
      const { data, error } = await supabase
        .from(entity)
        .delete()
        .eq("id", record.id)
        .select("id")
        .single();

      if (error) throw error;
      if (!data) throw new Error("The record could not be deleted.");

      setRecords((current) => ({
        ...current,
        [entity]: current[entity].filter((item) => item.id !== record.id),
      }));

      if (entity === "subjects") await cleanOldImage(record.image_path);
    } catch (error) {
      setPageError(
        error.code === "23503"
          ? "Another record uses this record. Set it to inactive instead."
          : error.message || "Unable to delete the record.",
      );
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  function renderField(field) {
    const isAutomaticSectionYear =
      modal?.entity === "sections" &&
      field.name ===
      "school_year_id" &&
      !modal?.record;

    const props = {
      id: `academic-${field.name}`,

      className: `${inputClass} ${isAutomaticSectionYear
          ? "cursor-not-allowed bg-gray-100 text-gray-600"
          : ""
        }`,

      value:
        form[field.name] ?? "",

      required: field.required,

      disabled:
        saving ||
        isAutomaticSectionYear,

      onChange: (event) => {
        const value =
          event.target.value;

        setForm((current) => ({
          ...current,
          [field.name]: value,
        }));
      },
    };

    return (
      <div key={field.name}>
        <label
          htmlFor={props.id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {field.label}{field.required ? " *" : ""}
        </label>

        {field.type === "select" ? (
          <select {...props}>
            {field.required && <option value="">Select {field.label.toLowerCase()}</option>}
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea {...props} rows={3} placeholder={field.placeholder} />
        ) : (
          <input {...props} type={field.type} placeholder={field.placeholder} />
        )}
      </div>
    );
  }

  const imagePreview = imageFile
    ? previewUrl
    : removeImage
      ? ""
      : getSubjectImageUrl(modal?.record?.image_path);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Academic Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage school years, strands, subjects, and sections.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            disabled={saving}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${activeTab === key
              ? "border-slate-800 text-slate-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{tabs.find((tab) => tab.key === activeTab).label}</h2>
          <p className="text-sm text-gray-500">{records[activeTab].length} total records</p>
        </div>
        <button
          type="button"
          disabled={loading || saving}
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />Add {activeConfig.singular}
        </button>
      </div>

      {pageError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{pageError}</p>}
      {notice && <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{notice}</p>}

      {activeTab === "sections" ? (
        <div className="space-y-6">
          {loading && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              Loading sections...
            </div>
          )}

          {!loading && groupedSections.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              No sections found.
            </div>
          )}

          {!loading &&
            groupedSections.map(
              ({
                id,
                strand,
                sections: strandSections,
              }) => (
                <section
                  key={id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-bold text-white">
                          {strand?.code || "UNASSIGNED"}
                        </span>

                        <h3 className="font-semibold text-gray-900">
                          {strand?.name ||
                            "Sections without a strand"}
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {strandSections.length} section
                        {strandSections.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="bg-white text-left text-gray-500">
                          <th className="px-5 py-3 font-medium">
                            Section
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Grade Level
                          </th>

                          <th className="px-5 py-3 font-medium">
                            School Year
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Status
                          </th>

                          <th className="px-5 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {strandSections.map((section) => (
                          <tr
                            key={section.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-900">
                                {section.section_name}
                              </p>
                            </td>

                            <td className="px-5 py-3.5 text-gray-600">
                              Grade {section.grade_level}
                            </td>

                            <td className="px-5 py-3.5 text-gray-600">
                              {getSchoolYearName(
                                section.school_year_id,
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              <StatusBadge
                                status={section.status}
                              />
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    openModal(section)
                                  }
                                  aria-label={`Edit ${section.section_name}`}
                                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleDelete(section)
                                  }
                                  aria-label={`Delete ${section.section_name}`}
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
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
              ),
            )}
        </div>
      ) : activeTab === "subjects" ? (
        <div className="space-y-6">
          {loading && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              Loading subjects...
            </div>
          )}

          {!loading && groupedSubjects.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
              No subjects found.
            </div>
          )}

          {!loading &&
            groupedSubjects.map(
              ({
                type,
                subjects: typeSubjects,
              }) => (
                <section
                  key={type}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                          {formatStatus(type)}
                        </span>

                        <h3 className="font-semibold text-gray-900">
                          {formatStatus(type)} Subjects
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {typeSubjects.length} subject
                        {typeSubjects.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-sm">
                      <thead>
                        <tr className="bg-white text-left text-gray-500">
                          <th className="px-5 py-3 font-medium">
                            Subject
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Grade Level
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Strand
                          </th>

                          <th className="px-5 py-3 font-medium">
                            Status
                          </th>

                          <th className="px-5 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {typeSubjects.map((subject) => (
                          <tr
                            key={subject.id}
                            className="border-t border-gray-100"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <SubjectImage
                                  path={subject.image_path}
                                  name={subject.subject_name}
                                  className="h-12 w-20 shrink-0 rounded-lg"
                                />

                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {subject.subject_name}
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {subject.subject_code}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-gray-600">
                              Grade {subject.grade_level}
                            </td>

                            <td className="px-5 py-3.5 text-gray-600">
                              {getStrandName(
                                subject.strand_id,
                              )}
                            </td>

                            <td className="px-5 py-3.5">
                              <StatusBadge
                                status={subject.status}
                              />
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    openModal(subject)
                                  }
                                  aria-label={`Edit ${subject.subject_name}`}
                                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    handleDelete(subject)
                                  }
                                  aria-label={`Delete ${subject.subject_name}`}
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
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
              ),
            )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                {activeConfig.columns.map((column) => (
                  <th
                    key={column.label}
                    className="px-5 py-3 font-medium"
                  >
                    {column.label}
                  </th>
                ))}

                <th className="px-5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                records[activeTab].map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-gray-100"
                  >
                    {activeConfig.columns.map(
                      (column) => (
                        <td
                          key={column.label}
                          className="px-5 py-3.5 text-gray-600"
                        >
                          {column.render(record)}
                        </td>
                      ),
                    )}

                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            openModal(record)
                          }
                          aria-label="Edit record"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleDelete(record)
                          }
                          aria-label="Delete record"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {(loading ||
                records[activeTab].length === 0) && (
                  <tr>
                    <td
                      colSpan={
                        activeConfig.columns.length + 1
                      }
                      className="p-10 text-center text-gray-400"
                    >
                      {loading
                        ? "Loading records..."
                        : "No records yet."}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <RecordModal
          title={`${modal.record ? "Edit" : "Add"} ${configs[modal.entity].singular}`}
          busy={saving}
          onClose={() => {
            if (!busyRef.current) resetModal();
          }}
        >
          {actionError && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {actionError}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset disabled={saving} className="space-y-4">
              {configs[modal.entity].fields.map(renderField)}

              {modal.entity ===
                "school_years" && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-medium text-blue-700">
                      Automatic school-year status
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-600">
                      A future school year will be
                      saved as inactive. It will
                      automatically become active
                      when its start date arrives and
                      return to inactive after its end
                      date.
                    </p>

                    {form.start_date &&
                      form.end_date && (
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          Current calculated status:{" "}
                          {formatStatus(
                            getAutomaticSchoolYearStatus(
                              form.start_date,
                              form.end_date,
                            ),
                          )}
                        </p>
                      )}
                  </div>
                )}

              {modal.entity === "subjects" && (
                <div className="space-y-3">
                  <label htmlFor="subject-image" className="block text-sm font-medium text-gray-700">
                    Subject cover image (optional)
                  </label>
                  <input
                    key={fileKey}
                    id="subject-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500">
                    JPG, PNG, or WebP. Maximum 5 MB.
                  </p>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Subject cover preview"
                      className="h-44 w-full rounded-xl object-cover"
                    />
                  )}

                  {(imageFile || (!removeImage && modal.record?.image_path)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setRemoveImage(true);
                        setFileKey((value) => value + 1);
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove image
                    </button>
                  )}

                  {removeImage && modal.record?.image_path && (
                    <button
                      type="button"
                      onClick={() => setRemoveImage(false)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Keep original image
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-slate-800 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </fieldset>
          </form>
        </RecordModal>
      )}
    </div>
  );
}