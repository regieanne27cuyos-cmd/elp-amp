export const performanceStatuses = {
  on_track: {
    label: "On Track",
    className:
      "bg-green-100 text-green-700",
  },
  needs_attention: {
    label: "Needs Attention",
    className:
      "bg-orange-100 text-orange-700",
  },
  at_risk: {
    label: "At Risk",
    className:
      "bg-red-100 text-red-700",
  },
};

export function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export function roundNumber(
  value,
  decimals = 1,
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  const multiplier =
    10 ** decimals;

  return (
    Math.round(
      Number(value) * multiplier,
    ) / multiplier
  );
}

export function calculatePercentage(
  score,
  maximumScore,
) {
  const maximum =
    safeNumber(maximumScore);

  if (maximum <= 0) {
    return null;
  }

  return roundNumber(
    (safeNumber(score) / maximum) *
      100,
  );
}

export function calculateAttendance({
  records,
  studentId,
}) {
  const studentRecords =
    records.filter(
      (record) =>
        record.student_id === studentId,
    );

  const presentCount =
    studentRecords.filter(
      (record) =>
        record.status === "present",
    ).length;

  const absentCount =
    studentRecords.filter(
      (record) =>
        record.status === "absent",
    ).length;

  const lateCount =
    studentRecords.filter(
      (record) =>
        record.status === "late",
    ).length;

  const totalRecords =
    studentRecords.length;

  const attendedCount =
    presentCount + lateCount;

  const attendancePercentage =
    totalRecords > 0
      ? roundNumber(
          (attendedCount /
            totalRecords) *
            100,
        )
      : null;

  return {
    totalRecords,
    presentCount,
    absentCount,
    lateCount,
    attendancePercentage,
  };
}

export function getPerformanceStatus({
  currentGrade,
  attendancePercentage,
  missingCount,
}) {
  if (
    (currentGrade !== null &&
      currentGrade < 75) ||
    (attendancePercentage !== null &&
      attendancePercentage < 75) ||
    missingCount >= 3
  ) {
    return "at_risk";
  }

  if (
    (currentGrade !== null &&
      currentGrade < 80) ||
    (attendancePercentage !== null &&
      attendancePercentage < 85) ||
    missingCount >= 1
  ) {
    return "needs_attention";
  }

  return "on_track";
}