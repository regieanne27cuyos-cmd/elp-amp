function escapeCsvValue(value) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function safeFilename(value) {
  return String(value || "attendance")
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function downloadCsv(rows, filename) {
  const csv = rows
    .map((row) =>
      row.map(escapeCsvValue).join(","),
    )
    .join("\n");

  // The BOM helps Microsoft Excel recognize UTF-8 characters.
  const blob = new Blob(
    [`\uFEFF${csv}`],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function createAttendanceRows({
  sheet,
  students,
  classRecord,
}) {
  const records = new Map(
    (sheet.records || []).map((record) => [
      record.student_id,
      record,
    ]),
  );

  const subjectCode =
    classRecord.subject?.subject_code || "";

  const subjectName =
    classRecord.subject?.subject_name || "";

  const gradeLevel =
    classRecord.section?.grade_level || "";

  const sectionName =
    classRecord.section?.section_name || "";

  const schoolYear =
    classRecord.school_year?.name || "";

  const semester =
    classRecord.semester?.name === "first"
      ? "First Semester"
      : classRecord.semester?.name === "second"
        ? "Second Semester"
        : classRecord.semester?.name || "";

  return students.map((student) => {
    const record = records.get(
      student.student_id,
    );

    return [
      sheet.attendance_date,
      sheet.title || "Class Attendance",
      subjectCode,
      subjectName,
      gradeLevel
        ? `Grade ${gradeLevel}`
        : "",
      sectionName,
      schoolYear,
      semester,
      student.student_number || "",
      student.full_name || "",
      student.email || "",
      record?.status
        ? record.status
            .charAt(0)
            .toUpperCase() +
          record.status.slice(1)
        : "No record",
      record?.remarks || "",
    ];
  });
}

const headings = [
  "Attendance Date",
  "Sheet Title",
  "Subject Code",
  "Subject",
  "Grade Level",
  "Section",
  "School Year",
  "Semester",
  "Student Number",
  "Student Name",
  "Email",
  "Attendance Status",
  "Remarks",
];

export function exportAttendanceSheet({
  sheet,
  students,
  classRecord,
}) {
  const rows = createAttendanceRows({
    sheet,
    students,
    classRecord,
  });

  const subjectCode =
    classRecord.subject?.subject_code ||
    "subject";

  const sectionName =
    classRecord.section?.section_name ||
    "section";

  const filename = safeFilename(
    `${subjectCode}-${sectionName}-${sheet.attendance_date}-attendance.csv`,
  );

  downloadCsv(
    [headings, ...rows],
    filename,
  );
}

export function exportAllAttendanceSheets({
  sheets,
  students,
  classRecord,
}) {
  const sortedSheets = [...sheets].sort(
    (first, second) =>
      first.attendance_date.localeCompare(
        second.attendance_date,
      ),
  );

  const rows = sortedSheets.flatMap(
    (sheet) =>
      createAttendanceRows({
        sheet,
        students,
        classRecord,
      }),
  );

  const subjectCode =
    classRecord.subject?.subject_code ||
    "subject";

  const sectionName =
    classRecord.section?.section_name ||
    "section";

  const filename = safeFilename(
    `${subjectCode}-${sectionName}-all-attendance.csv`,
  );

  downloadCsv(
    [headings, ...rows],
    filename,
  );
}