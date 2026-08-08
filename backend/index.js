import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { connectDatabase } from "./db/connect.js";
import {
  findUserByEmail,
  getUserById,
  addUser,
  updateUser,
  addSubmission,
  getSubmissionById,
  findSubmissionByApproveToken,
  updateSubmission,
  getSubmissionsByUserId,
  updatePasswordByEmail,
} from "./data/store.js";
import { sendSupervisorApprovalEmail, isEmailConfigured, verifySmtpConnection, warnIfEmailLinksMisconfigured, getAppPublicUrl } from "./email.js";
import { createConfigRouter, createAdminConfigRouter } from "./routes/configRoutes.js";
import {
  buildSupervisorReviews,
  applyReviewDecision,
  findReviewByToken,
  publicSupervisorReviews,
} from "./lib/supervisorReviews.js";
import { resolveUserRole, validateAndNormalizeSubmissionInput } from "./lib/submissionHelpers.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const DEFAULT_SUPERVISOR_EMAIL = process.env.DEFAULT_SUPERVISOR_EMAIL || "";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toPublicUser(user) {
  const role = user.role === "admin" ? "admin" : "user";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    supervisorEmail: user.supervisorEmail ?? DEFAULT_SUPERVISOR_EMAIL ?? "",
    profileImage: user.profileImage || null,
    role,
  };
}

async function syncUserRoleRecord(user) {
  if (!user) return user;
  const resolved = resolveUserRole(user.email, user.role || "user");
  if (resolved === (user.role || "user")) return user;
  const updated = await updateUser(user.id, { role: resolved });
  return updated || { ...user, role: resolved };
}

async function adminMiddleware(req, res, next) {
  const dbUser = await getUserById(req.user.id);
  if (!dbUser) return res.status(401).json({ error: "Unauthorized" });
  const synced = await syncUserRoleRecord(dbUser);
  if (synced.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

const MAX_PROFILE_IMAGE_CHARS = 900_000;
const MAX_SUBMISSION_IMAGES = 4;

function isValidProfileImage(value) {
  if (value === null || value === "") return true;
  if (typeof value !== "string") return false;
  if (!value.startsWith("data:image/")) return false;
  if (value.length > MAX_PROFILE_IMAGE_CHARS) return false;
  return true;
}

function normalizeSubmissionImages(raw) {
  if (raw == null || raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_SUBMISSION_IMAGES) return null;
  const out = [];
  for (const img of raw) {
    if (typeof img !== "string" || !isValidProfileImage(img)) return null;
    out.push(img);
  }
  return out;
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Name, email, and password required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (await findUserByEmail(email)) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    supervisorEmail: DEFAULT_SUPERVISOR_EMAIL,
    role: resolveUserRole(email.trim().toLowerCase(), "user"),
  };
  await addUser(user);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.status(201).json({
    token,
    user: toPublicUser(user),
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const synced = await syncUserRoleRecord(user);
  const token = jwt.sign({ id: synced.id, email: synced.email, name: synced.name }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({
    token,
    user: toPublicUser(synced),
  });
});

app.post("/api/auth/forgot-password/verify-email", async (req, res) => {
  const { email } = req.body;
  if (!email?.trim() || !isValidEmail(email.trim())) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  const user = await findUserByEmail(email);
  res.json({ registered: Boolean(user) });
});

app.post("/api/auth/forgot-password/reset", async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !isValidEmail(email.trim())) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "Email not registered. Please register first." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await updatePasswordByEmail(email, passwordHash);
  res.json({ success: true, message: "Password updated successfully" });
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const synced = await syncUserRoleRecord(user);
  res.json({ user: toPublicUser(synced), emailConfigured: isEmailConfigured() });
});

app.patch("/api/user/supervisor-email", authMiddleware, async (req, res) => {
  const { supervisorEmail } = req.body;
  if (!supervisorEmail?.trim() || !isValidEmail(supervisorEmail.trim())) {
    return res.status(400).json({ error: "Valid supervisor email is required" });
  }
  const updated = await updateUser(req.user.id, {
    supervisorEmail: supervisorEmail.trim().toLowerCase(),
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ user: toPublicUser(updated) });
});

app.patch("/api/user/name", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  const trimmed = name.trim();
  if (trimmed.length > 120) {
    return res.status(400).json({ error: "Name is too long" });
  }
  const updated = await updateUser(req.user.id, { name: trimmed });
  if (!updated) return res.status(404).json({ error: "User not found" });
  const token = jwt.sign(
    { id: updated.id, email: updated.email, name: updated.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ user: toPublicUser(updated), token });
});

app.patch("/api/user/profile-image", authMiddleware, async (req, res) => {
  const { profileImage } = req.body;
  if (profileImage !== null && profileImage !== "" && !isValidProfileImage(profileImage)) {
    return res.status(400).json({
      error: "Invalid image. Use JPEG, PNG, or WebP under ~650 KB.",
    });
  }
  const value = profileImage === null || profileImage === "" ? null : profileImage;
  const updated = await updateUser(req.user.id, { profileImage: value });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ user: toPublicUser(updated) });
});

app.delete("/api/user/profile-image", authMiddleware, async (req, res) => {
  const updated = await updateUser(req.user.id, { profileImage: null });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ user: toPublicUser(updated) });
});

app.use("/api/config", createConfigRouter(authMiddleware));
app.use("/api/admin", createAdminConfigRouter(authMiddleware, adminMiddleware));

app.post("/api/submissions", authMiddleware, async (req, res) => {
  const parsed = await validateAndNormalizeSubmissionInput(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { department, mill, formData, formSnapshot, legacy, supervisorEmails, images } = parsed;

  const normalizedImages = normalizeSubmissionImages(images);
  if (normalizedImages === null) {
    return res.status(400).json({
      error: `Invalid photos. Up to ${MAX_SUBMISSION_IMAGES} JPEG/PNG/WebP images under ~650 KB each.`,
    });
  }

  const toSupervisors = supervisorEmails;
  const dbUser = await getUserById(req.user.id);

  await updateUser(req.user.id, { supervisorEmail: toSupervisors[0] });

  const supervisorReviews = buildSupervisorReviews(toSupervisors);

  const submission = {
    id: randomUUID(),
    userId: req.user.id,
    supervisorEmail: toSupervisors[0],
    supervisorEmails: toSupervisors,
    submittedByName: dbUser?.name || req.user.name,
    submittedByEmail: dbUser?.email || req.user.email,
    empName: legacy.empName,
    empId: legacy.empId,
    dept: legacy.dept,
    section: legacy.section,
    description: legacy.description,
    tubeMill: legacy.tubeMill,
    departmentSlug: department.slug,
    millSlug: mill.slug,
    formData,
    formSnapshot,
    images: normalizedImages,
    status: "pending",
    supervisorReviews,
    approveToken: supervisorReviews[0].approveToken,
  };

  try {
    await addSubmission(submission);
  } catch (err) {
    console.error("[submission]", err);
    return res.status(500).json({
      error: "Could not save the report. Check MongoDB connection.",
    });
  }

  try {
    await sendSupervisorApprovalEmail(submission, toSupervisors, {
      name: submission.submittedByName,
      email: submission.submittedByEmail,
    });
  } catch (err) {
    console.error("[email]", err);
    let message = err.message || "Failed to send email.";
    if (message.includes("BadCredentials") || message.includes("535")) {
      message =
        "Gmail rejected SMTP login. Use an App Password (not your normal password), 2-Step Verification on, and SMTP_USER matching that Gmail account.";
    } else if (
      message.includes("Connection timeout") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ESOCKET")
    ) {
      message =
        "Could not connect to Gmail SMTP (timeout). On Render, add all SMTP_* vars in the dashboard. Try SMTP_PORT=587 and SMTP_SECURE=false. Report was saved.";
    } else if (message.includes("SMTP is not configured")) {
      message =
        "SMTP is not configured on this server. Add SMTP_HOST, SMTP_USER, SMTP_PASS to Render Environment (or backend/.env locally). Report was saved.";
    }
    return res.status(502).json({
      error: message,
      submission: sanitizeSubmission(submission),
    });
  }
  const freshUser = await getUserById(req.user.id);
  res.status(201).json({
    submission: sanitizeSubmission(submission),
    user: toPublicUser(freshUser || dbUser),
  });
});

app.get("/api/submissions", authMiddleware, async (req, res) => {
  const list = (await getSubmissionsByUserId(req.user.id)).map(sanitizeSubmission);
  res.json({ submissions: list });
});

app.get("/api/submissions/:id", authMiddleware, async (req, res) => {
  const sub = await getSubmissionById(req.params.id);
  if (!sub || sub.userId !== req.user.id) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({ submission: sanitizeSubmission(sub) });
});

function sanitizeSubmission(s) {
  const { approveToken, supervisorReviews, ...rest } = s;
  const reviews = Array.isArray(supervisorReviews)
    ? supervisorReviews.map(({ approveToken: _t, ...r }) => r)
    : publicSupervisorReviews(s);
  return { ...rest, supervisorReviews: reviews };
}

function reviewContextForToken(sub, token) {
  const review = findReviewByToken(sub, token);
  return {
    reviewerEmail: review?.email || null,
    reviewerStatus: review?.status || sub.status,
    canReview: sub.status === "pending" && review?.status === "pending",
  };
}

app.get("/api/review/:token", async (req, res) => {
  const sub = await findSubmissionByApproveToken(req.params.token);
  if (!sub) {
    return res.status(404).json({ error: "Invalid or expired link." });
  }
  const ctx = reviewContextForToken(sub, req.params.token);
  return res.json({
    submission: sanitizeSubmission(sub),
    reviewerEmail: ctx.reviewerEmail,
    reviewerStatus: ctx.reviewerStatus,
    canReview: ctx.canReview,
    finalized: !ctx.canReview,
  });
});

app.post("/api/review/:token", async (req, res) => {
  const { action, comment } = req.body || {};
  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({ error: "Action must be approve or reject." });
  }

  const sub = await findSubmissionByApproveToken(req.params.token);
  if (!sub) {
    return res.status(404).json({ error: "Invalid or expired link." });
  }

  const trimmed = String(comment || "").trim();
  if (action === "reject" && !trimmed) {
    return res.status(400).json({ error: "Comment is required when rejecting." });
  }
  if (trimmed.length > 2000) {
    return res.status(400).json({ error: "Comment must be 2000 characters or less." });
  }

  const result = applyReviewDecision(sub, req.params.token, action, trimmed);
  if (result.error === "not_found") {
    return res.status(404).json({ error: "Invalid or expired link." });
  }
  if (result.error === "already") {
    return res.status(409).json({
      error: `You already ${result.review.status} this request.`,
      submission: sanitizeSubmission(result.submission),
      reviewerStatus: result.review.status,
      finalized: true,
    });
  }

  const updated = await updateSubmission(sub.id, {
    status: result.status,
    supervisorComment: result.supervisorComment,
    supervisorReviews: result.supervisorReviews,
  });

  const ctx = reviewContextForToken(updated, req.params.token);
  let message =
    action === "approve" ? "Your approval was recorded." : "Your rejection was recorded.";
  if (action === "approve" && updated.status === "pending") {
    message += " Waiting for other supervisors to approve.";
  } else if (updated.status === "approved") {
    message = "All supervisors approved this request.";
  } else if (updated.status === "rejected") {
    message = "This request is now rejected.";
  }

  return res.json({
    success: true,
    message,
    submission: sanitizeSubmission(updated),
    reviewerStatus: ctx.reviewerStatus,
    finalized: !ctx.canReview,
  });
});

/** Legacy one-click approve links redirect to the review page in the browser. */
app.get("/api/approve/:token", async (req, res) => {
  const appUrl = getAppPublicUrl();
  const reviewUrl = `${appUrl}/approve/${encodeURIComponent(req.params.token)}`;
  const wantsJson =
    req.headers.accept?.includes("application/json") || req.query.format === "json";
  if (wantsJson) {
    return res.status(400).json({
      error: "Open the review link to approve or reject with an optional comment.",
      reviewUrl,
    });
  }
  return res.redirect(302, reviewUrl);
});

async function start() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    if (!isEmailConfigured()) {
      console.warn(
        "[email] SMTP not configured — copy backend/.env.example to backend/.env before submitting reports."
      );
      return;
    }
    verifySmtpConnection()
      .then(() => {
        console.log("[email] SMTP ready (real email enabled)");
        warnIfEmailLinksMisconfigured();
      })
      .catch((err) => {
        console.error("[email] SMTP connection failed:", err.message);
        console.error(
          "[email] Gmail SSL: SMTP_PORT=465 and SMTP_SECURE=SSL (or true). Gmail STARTTLS: SMTP_PORT=587 and SMTP_SECURE=false"
        );
      });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[server] Port ${PORT} is already in use. Stop the other API process (Task Manager → Node.js) or close the other terminal running npm run dev, then try again.`
      );
      process.exit(1);
    }
    throw err;
  });
}

start().catch((err) => {
  console.error("[mongodb] Failed to connect:", err.message);
  process.exit(1);
});

