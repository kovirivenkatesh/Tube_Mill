export function getSubmissionFieldRows(submission) {
  if (submission?.formSnapshot?.length) {
    return submission.formSnapshot.map((f) => ({
      label: f.label,
      value: submission.formData?.[f.key] ?? "",
    }));
  }
  return [
    { label: "Employee name", value: submission.empName },
    { label: "Employee ID", value: submission.empId },
    { label: "Section", value: submission.section },
    { label: "Description", value: submission.description },
  ].filter((r) => r.value !== undefined && r.value !== "");
}

/** Per-supervisor approval rows for My Reports (falls back for older submissions). */
export function getSupervisorReviewRows(submission) {
  if (submission?.supervisorReviews?.length) {
    return submission.supervisorReviews;
  }
  const emails =
    submission?.supervisorEmails?.length > 0
      ? submission.supervisorEmails
      : submission?.supervisorEmail
        ? [submission.supervisorEmail]
        : [];
  return emails.map((email) => ({
    email,
    status: submission?.status || "pending",
    comment: submission?.supervisorComment || "",
  }));
}

export function overallStatusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}
