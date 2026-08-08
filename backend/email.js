import nodemailer from "nodemailer";
import dns from "node:dns";
import { submissionDetailRows } from "./lib/submissionHelpers.js";
import { reviewsForSubmission } from "./lib/supervisorReviews.js";

const APP_PUBLIC_URL =
  process.env.PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:5173";

export function getAppPublicUrl() {
  return APP_PUBLIC_URL.replace(/\/$/, "");
}

function useResendApi() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Warn when deployed API still points email links at localhost. */
export function warnIfEmailLinksMisconfigured() {
  if (!isEmailConfigured()) return;
  const url = getAppPublicUrl();
  const onRender = Boolean(process.env.RENDER);
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    const where = onRender ? "Render Environment" : "backend/.env";
    console.warn(
      `[email] PUBLIC_APP_URL is "${url}" — supervisor emails will use that host. ` +
        `Set PUBLIC_APP_URL to your Vercel site (https://tube-mill.vercel.app) in ${where}, then redeploy.`
    );
  }
  if (onRender && !useResendApi()) {
    console.warn(
      "[email] Render often cannot reach Gmail SMTP. Add RESEND_API_KEY on Render (free at resend.com) — see backend/README.md."
    );
  }
}

let transporter = null;

export function getSmtpTransportOptions() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env."
    );
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const rawSecure = String(process.env.SMTP_SECURE ?? "").trim().toLowerCase();

  let secure;
  if (["true", "1", "yes", "ssl"].includes(rawSecure)) {
    secure = true;
  } else if (["false", "0", "no", "starttls", "tls"].includes(rawSecure)) {
    secure = false;
  } else {
    secure = port === 465;
  }

  const options = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 60_000,
    greetingTimeout: 30_000,
    socketTimeout: 120_000,
    family: 4,
    lookup: (hostname, _opts, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
  };

  if (port === 587 && !secure) {
    options.requireTLS = true;
  }

  return options;
}

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport(getSmtpTransportOptions());
  return transporter;
}

async function verifySmtpConnection() {
  const transport = getTransporter();
  await transport.verify();
}

/** Startup check — Resend (HTTPS) or SMTP. */
export async function verifyEmailTransport() {
  if (useResendApi()) {
    console.log("[email] Resend API configured (HTTPS — used for sending on production)");
    return;
  }
  await verifySmtpConnection();
  console.log("[email] SMTP ready (real email enabled)");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseImageDataUrl(dataUrl) {
  const match = /^data:(image\/(?:jpeg|jpg|png|gif|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) return null;
  return {
    contentType: match[1].toLowerCase().replace("jpg", "jpeg"),
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extensionForMime(mime) {
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

function buildEmailImageAttachments(images) {
  const attachments = [];
  let htmlBlock = "";
  const list = Array.isArray(images) ? images : [];
  if (!list.length) return { attachments, htmlBlock };

  htmlBlock = "<p><strong>Photos:</strong></p>";
  list.forEach((dataUrl, index) => {
    const parsed = parseImageDataUrl(dataUrl);
    if (!parsed) return;
    const cid = `issue-photo-${index}`;
    const ext = extensionForMime(parsed.contentType);
    attachments.push({
      filename: `issue-photo-${index + 1}.${ext}`,
      content: parsed.buffer,
      contentType: parsed.contentType,
      cid,
    });
    htmlBlock += `<p><img src="cid:${cid}" alt="Issue photo ${index + 1}" style="max-width:480px;width:100%;height:auto;border-radius:8px;border:1px solid #e2e8f0;" /></p>`;
  });
  return { attachments, htmlBlock };
}

function getFromAddress(submitter) {
  if (useResendApi()) {
    return (
      process.env.EMAIL_FROM?.trim() ||
      process.env.RESEND_FROM?.trim() ||
      "Tube Mill Reports <onboarding@resend.dev>"
    );
  }
  const forceFromAccount = process.env.SMTP_FORCE_FROM_ACCOUNT !== "false";
  const fromAddress = forceFromAccount ? process.env.SMTP_USER.trim() : submitter.email;
  return `"${submitter.name}" <${fromAddress}>`;
}

async function sendViaResend({ to, subject, html, replyTo, attachments }) {
  const key = process.env.RESEND_API_KEY.trim();
  const from = getFromAddress({ name: "", email: replyTo });

  const payload = {
    from,
    to: [to],
    subject,
    html,
    reply_to: replyTo,
  };

  if (attachments?.length) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
      content_id: a.cid,
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || JSON.stringify(data) || res.statusText;
    throw new Error(`Resend: ${msg}`);
  }
  return data.id;
}

async function sendViaSmtp({ to, subject, html, replyTo, attachments, from }) {
  const transport = getTransporter();
  const info = await transport.sendMail({
    from,
    to,
    replyTo,
    subject,
    html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      cid: a.cid,
    })),
  });
  return info.messageId;
}

export async function sendSupervisorApprovalEmail(submission, supervisorEmails, submitter) {
  const recipients = Array.isArray(supervisorEmails)
    ? supervisorEmails
    : [supervisorEmails].filter(Boolean);
  if (!recipients.length) {
    throw new Error("No supervisor email addresses provided.");
  }

  const from = getFromAddress(submitter);
  const replyTo = `"${submitter.name}" <${submitter.email}>`;
  const { attachments, htmlBlock: photosHtml } = buildEmailImageAttachments(submission.images);

  const detailRows = submissionDetailRows(submission);
  const fieldsHtml = detailRows
    .filter((row) => row.value)
    .map(
      (row) =>
        `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value).replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");

  const reviews = reviewsForSubmission(submission);
  const messageIds = [];

  for (const rawEmail of recipients) {
    const email = String(rawEmail).trim().toLowerCase();
    const review =
      reviews.find((r) => r.email === email) ||
      reviews.find((r) => r.email === rawEmail.trim()) ||
      reviews[0];
    const token = review?.approveToken || submission.approveToken;
    const reviewUrl = `${getAppPublicUrl()}/approve/${token}`;
    const approveUrl = `${reviewUrl}?intent=approve`;
    const rejectUrl = `${reviewUrl}?intent=reject`;

    const html = `
    <h2>New tube mill issue report</h2>
    <p><strong>Submitted by:</strong> ${escapeHtml(submitter.name)} (${escapeHtml(submitter.email)})</p>
    <p><strong>Department:</strong> ${escapeHtml(submission.dept)}</p>
    <p><strong>Tube mill:</strong> ${escapeHtml(submission.tubeMill)}</p>
    ${fieldsHtml}
    ${photosHtml}
    <p style="margin:16px 0 8px;color:#64748b;font-size:13px;">This link is for <strong>${escapeHtml(email)}</strong>.</p>
    <p style="margin:24px 0 16px;">
      <a href="${approveUrl}" style="display:inline-block;padding:12px 22px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-right:10px;">Approve</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:12px 22px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reject</a>
    </p>
    <p><a href="${reviewUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Review &amp; submit</a></p>
    <p style="color:#666;font-size:12px;margin-top:16px;">Review link: ${reviewUrl}</p>
  `;

    const subject = `[Pending] Issue – ${submission.dept} – ${submission.tubeMill}`;

    let id;
    if (useResendApi()) {
      id = await sendViaResend({
        to: email,
        subject,
        html,
        replyTo: submitter.email,
        attachments,
      });
    } else {
      id = await sendViaSmtp({
        to: email,
        subject,
        html,
        replyTo,
        attachments,
        from,
      });
    }

    messageIds.push(id);
    console.log("[email] Sent to", email, "via", useResendApi() ? "Resend" : "SMTP", "review URL:", reviewUrl);
  }

  return { messageIds };
}

export function isEmailConfigured() {
  if (useResendApi()) return true;
  const pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && pass);
}
