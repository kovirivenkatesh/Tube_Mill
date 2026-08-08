import { randomUUID } from "crypto";

export function buildSupervisorReviews(supervisorEmails) {
  return supervisorEmails.map((email) => ({
    email: String(email).trim().toLowerCase(),
    status: "pending",
    comment: "",
    approveToken: randomUUID(),
    decidedAt: null,
  }));
}

export function reviewsForSubmission(submission) {
  if (Array.isArray(submission.supervisorReviews) && submission.supervisorReviews.length) {
    return submission.supervisorReviews;
  }
  const emails =
    Array.isArray(submission.supervisorEmails) && submission.supervisorEmails.length
      ? submission.supervisorEmails
      : submission.supervisorEmail
        ? [submission.supervisorEmail]
        : [];
  return emails.map((email) => ({
    email: String(email).trim().toLowerCase(),
    status: submission.status || "pending",
    comment: submission.supervisorComment || "",
    approveToken: submission.approveToken,
    decidedAt: null,
  }));
}

export function findReviewByToken(submission, token) {
  const reviews = reviewsForSubmission(submission);
  const match = reviews.find((r) => r.approveToken === token);
  if (match) return match;
  if (submission.approveToken === token && reviews.length) {
    return reviews[0];
  }
  return null;
}

export function computeOverallStatus(reviews) {
  if (reviews.some((r) => r.status === "rejected")) return "rejected";
  if (reviews.length && reviews.every((r) => r.status === "approved")) return "approved";
  return "pending";
}

export function aggregateSupervisorComment(reviews) {
  const parts = reviews
    .filter((r) => r.comment?.trim())
    .map((r) => `${r.email}: ${r.comment.trim()}`);
  return parts.join("\n\n");
}

export function applyReviewDecision(submission, token, action, comment) {
  const reviews = reviewsForSubmission(submission).map((r) => ({ ...r }));
  const review = findReviewByToken({ ...submission, supervisorReviews: reviews }, token);
  if (!review) return { error: "not_found" };
  if (review.status !== "pending") {
    return { error: "already", submission, review };
  }

  review.status = action === "approve" ? "approved" : "rejected";
  review.comment = comment;
  review.decidedAt = new Date();

  const idx = reviews.findIndex((r) => r.approveToken === review.approveToken);
  if (idx >= 0) reviews[idx] = review;

  const status = computeOverallStatus(reviews);
  return {
    supervisorReviews: reviews,
    status,
    supervisorComment: aggregateSupervisorComment(reviews),
    review,
  };
}

export function publicSupervisorReviews(submission) {
  return reviewsForSubmission(submission).map(({ email, status, comment, decidedAt }) => ({
    email,
    status,
    comment: comment || "",
    decidedAt: decidedAt instanceof Date ? decidedAt.toISOString() : decidedAt || null,
  }));
}
