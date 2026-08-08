import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { SkeletonText } from "../components/skeleton/Skeleton";
import { SubmissionImages } from "../components/ReportImageAttachments";
import { getSubmissionFieldRows } from "../utils/submissionDisplay";
import { getApiUrl } from "../api";

export default function ApprovePage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [submission, setSubmission] = useState(null);
  const [reviewerStatus, setReviewerStatus] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [comment, setComment] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setPageError("Invalid review link.");
      return;
    }

    fetch(getApiUrl(`/review/${encodeURIComponent(token)}`), {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Could not load this request.");
        }
        return data;
      })
      .then((data) => {
        setSubmission(data.submission);
        setReviewerStatus(data.reviewerStatus || data.submission?.status);
        setCanReview(Boolean(data.canReview));
        const reviews = data.submission?.supervisorReviews || [];
        const mine = reviews.find((r) => r.email === data.reviewerEmail);
        if (mine?.comment) {
          setComment(mine.comment);
        } else if (data.submission?.supervisorComment) {
          setComment(data.submission.supervisorComment);
        }
      })
      .catch((err) => {
        setPageError(
          err.message ||
            "Could not reach the app server. Run npm run dev and open this link on the same PC (http://localhost:5173)."
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (loading || !canReview || done) return;
    if (intent === "approve" || intent === "reject") {
      openReviewModal(intent);
    }
  }, [loading, canReview, intent, done]);

  function openReviewModal(action) {
    setModalError("");
    setPageError("");
    setModalAction(action);
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setModalError("");
  }

  async function submitFromModal(e) {
    e.preventDefault();
    if (!token || !modalAction || submitting || done) return;
    setModalError("");
    const trimmed = comment.trim();
    if (modalAction === "reject" && !trimmed) {
      setModalError("Please add a comment when rejecting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/review/${encodeURIComponent(token)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: modalAction, comment: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your decision.");
      }
      setSubmission(data.submission || null);
      setReviewerStatus(data.reviewerStatus || data.submission?.status);
      setCanReview(false);
      setDone(true);
      setDoneMessage(data.message || "Decision recorded.");
      setModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const showReview = !loading && !pageError && submission && !done && canReview;
  const showDone = done && submission;
  const showAlreadyFinal =
    !loading && !pageError && submission && !done && !canReview;

  return (
    <div className="app-layout">
      <ReviewSubmitModal
        open={modalOpen}
        action={modalAction}
        submission={submission}
        comment={comment}
        onCommentChange={setComment}
        error={modalError}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={submitFromModal}
      />

      <main className="app-shell approve-page">
        <div className="card card-narrow supervisor-review-card">
          {loading && (
            <div className="skeleton-approve-inline" aria-busy="true" aria-label="Loading review">
              <SkeletonText width="55%" height={28} className="skeleton-title" />
              <SkeletonText width="90%" height={14} />
              <SkeletonText width="65%" height={14} />
            </div>
          )}

          {!loading && pageError && !submission && (
            <>
              <h1 className="card-title">Review unavailable</h1>
              <p className="card-subtitle">{pageError}</p>
              <Link to="/login" className="btn btn-primary supervisor-review-link">
                Open app
              </Link>
            </>
          )}

          {showAlreadyFinal && (
            <>
              <h1 className="card-title">{alreadyFinalTitle(submission, reviewerStatus)}</h1>
              <p className="card-subtitle">{alreadyFinalSubtitle(submission, reviewerStatus)}</p>
              <ReportSummary submission={submission} />
              {reviewerStatus && reviewerStatus !== "pending" && comment && (
                <p className="supervisor-comment-block">
                  <strong>Your comment:</strong> {comment}
                </p>
              )}
              {submission.supervisorComment && submission.status !== "pending" && (
                <p className="supervisor-comment-block">
                  <strong>All comments:</strong> {submission.supervisorComment}
                </p>
              )}
              <Link to="/login" className="btn btn-primary supervisor-review-link">
                Open app
              </Link>
            </>
          )}

          {showReview && (
            <>
              <h1 className="card-title">Supervisor review</h1>
              <p className="card-subtitle">
                Review the report below, then choose Approve or Reject to add a comment and submit.
              </p>
              <ReportSummary submission={submission} />
              <div className="supervisor-review-actions">
                <button type="button" className="btn btn-success" onClick={() => openReviewModal("approve")}>
                  Approve
                </button>
                <button type="button" className="btn btn-danger" onClick={() => openReviewModal("reject")}>
                  Reject
                </button>
              </div>
            </>
          )}

          {showDone && (
            <div className="result-card result-success">
              <h1 className="card-title">{doneTitle(submission, reviewerStatus)}</h1>
              <p className="card-subtitle">{doneMessage}</p>
              <ReportSummary submission={submission} />
              {submission.supervisorComment && (
                <p className="supervisor-comment-block">
                  <strong>Your comment:</strong> {submission.supervisorComment}
                </p>
              )}
              <Link to="/login" className="btn btn-primary supervisor-review-link">
                Open app
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function doneTitle(submission, reviewerStatus) {
  if (submission.status === "approved") return "Fully approved";
  if (submission.status === "rejected") return "Rejected";
  if (reviewerStatus === "approved") return "Your approval recorded";
  return "Decision recorded";
}

function alreadyFinalTitle(submission, reviewerStatus) {
  if (submission.status === "approved") return "Fully approved";
  if (submission.status === "rejected") return "Rejected";
  if (reviewerStatus === "approved") return "You already approved";
  if (reviewerStatus === "rejected") return "You already rejected";
  return "Review closed";
}

function alreadyFinalSubtitle(submission, reviewerStatus) {
  if (submission.status === "approved") {
    return "All supervisors approved this request.";
  }
  if (submission.status === "rejected") {
    return "This request was rejected.";
  }
  if (reviewerStatus === "approved") {
    return "You approved this report. It stays pending until every supervisor approves.";
  }
  if (reviewerStatus === "rejected") {
    return "You rejected this report.";
  }
  return "You cannot change this decision.";
}

function ReviewSubmitModal({
  open,
  action,
  submission,
  comment,
  onCommentChange,
  error,
  submitting,
  onClose,
  onSubmit,
}) {
  if (!open || !action) return null;

  const isApprove = action === "approve";
  const title = isApprove ? "Review & submit approval" : "Review & submit rejection";

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal card supervisor-review-modal"
        role="dialog"
        aria-labelledby="review-submit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="review-submit-title" className="review-modal-title">
          Review &amp; submit
        </h3>
        <p className="card-subtitle review-modal-subtitle">
          {isApprove
            ? "You are approving this issue report. Add an optional comment, then submit."
            : "You are rejecting this issue report. A comment is required."}
        </p>

        {submission && (
          <div className="review-modal-summary">
            <p>
              <strong>
                {submission.empName} · {submission.dept}, Mill {submission.tubeMill}
              </strong>
            </p>
            <p className="review-modal-desc">{submission.description}</p>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="supervisor-comment-modal">Supervisor comment</label>
            <textarea
              id="supervisor-comment-modal"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={
                isApprove
                  ? "Optional note for the employee"
                  : "Required — reason for rejection"
              }
              rows={4}
              maxLength={2000}
              autoFocus
              required={!isApprove}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={isApprove ? "btn btn-success" : "btn btn-danger"}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : isApprove ? "Submit approval" : "Submit rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReportSummary({ submission }) {
  const rows = getSubmissionFieldRows(submission);
  return (
    <dl className="review-summary">
      <div>
        <dt>Department / mill</dt>
        <dd>
          {submission.dept} · {submission.tubeMill}
        </dd>
      </div>
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
      {submission.images?.length > 0 && (
        <div>
          <dt>Photos</dt>
          <dd>
            <SubmissionImages images={submission.images} />
          </dd>
        </div>
      )}
    </dl>
  );
}
