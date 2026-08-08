import { User } from "../models/User.js";
import { Submission } from "../models/Submission.js";
import { reviewsForSubmission } from "../lib/supervisorReviews.js";

function toIso(value) {
  if (!value) return value;
  return value instanceof Date ? value.toISOString() : value;
}

function userToPlain(doc) {
  if (!doc) return null;
  const u = doc.toObject ? doc.toObject() : doc;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    supervisorEmail: u.supervisorEmail ?? "",
    profileImage: u.profileImage || null,
    role: u.role || "user",
    createdAt: toIso(u.createdAt),
    updatedAt: toIso(u.updatedAt),
  };
}

function submissionToPlain(doc) {
  if (!doc) return null;
  const s = doc.toObject ? doc.toObject() : doc;
  return {
    id: s.id,
    userId: s.userId,
    supervisorEmail: s.supervisorEmail,
    supervisorEmails: Array.isArray(s.supervisorEmails)
      ? s.supervisorEmails
      : s.supervisorEmail
        ? [s.supervisorEmail]
        : [],
    submittedByName: s.submittedByName,
    submittedByEmail: s.submittedByEmail,
    empName: s.empName,
    empId: s.empId,
    dept: s.dept,
    section: s.section,
    description: s.description,
    tubeMill: s.tubeMill,
    status: s.status,
    supervisorComment: s.supervisorComment ?? "",
    images: Array.isArray(s.images) ? s.images : [],
    departmentSlug: s.departmentSlug || "",
    millSlug: s.millSlug || "",
    formData: s.formData && typeof s.formData === "object" ? s.formData : {},
    formSnapshot: Array.isArray(s.formSnapshot) ? s.formSnapshot : [],
    supervisorReviews: reviewsForSubmission(s).map(
      ({ email, status, comment, approveToken, decidedAt }) => ({
        email,
        status,
        comment: comment || "",
        approveToken,
        decidedAt: toIso(decidedAt),
      })
    ),
    approveToken: s.approveToken,
    createdAt: toIso(s.createdAt),
    updatedAt: toIso(s.updatedAt),
  };
}

export async function findUserByEmail(email) {
  const doc = await User.findOne({ email: email.toLowerCase().trim() });
  return userToPlain(doc);
}

export async function getUserById(id) {
  const doc = await User.findOne({ id });
  return userToPlain(doc);
}

export async function addUser(user) {
  const doc = await User.create(user);
  return userToPlain(doc);
}

export async function updateUser(id, patch) {
  const doc = await User.findOneAndUpdate({ id }, { $set: patch }, { new: true });
  return userToPlain(doc);
}

export async function updatePasswordByEmail(email, passwordHash) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return updateUser(user.id, { passwordHash });
}

export async function addSubmission(submission) {
  const doc = await Submission.create(submission);
  return submissionToPlain(doc);
}

export async function getSubmissionById(id) {
  const doc = await Submission.findOne({ id });
  return submissionToPlain(doc);
}

export async function findSubmissionByApproveToken(token) {
  let doc = await Submission.findOne({ approveToken: token });
  if (!doc) {
    doc = await Submission.findOne({ "supervisorReviews.approveToken": token });
  }
  return submissionToPlain(doc);
}

export async function updateSubmission(id, patch) {
  const doc = await Submission.findOneAndUpdate({ id }, { $set: patch }, { new: true });
  return submissionToPlain(doc);
}

export async function getSubmissionsByUserId(userId) {
  const docs = await Submission.find({ userId }).sort({ createdAt: -1 });
  return docs.map(submissionToPlain);
}
