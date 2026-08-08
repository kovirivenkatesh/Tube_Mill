import { getSupervisorReviewRows } from "../utils/submissionDisplay";

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default function SupervisorReviewStatusList({ submission }) {
  const reviews = getSupervisorReviewRows(submission);
  if (!reviews.length) return null;

  return (
    <div className="supervisor-review-status-block">
      <p className="supervisor-review-status-heading">
        <strong>Supervisor approvals</strong>
        {submission.status === "pending" && reviews.length > 1 && (
          <span className="supervisor-review-status-hint">
            Overall status stays pending until every supervisor approves.
          </span>
        )}
      </p>
      <ul className="supervisor-review-status-list">
        {reviews.map((r) => (
          <li key={r.email}>
            <span className="supervisor-review-email">{r.email}</span>
            <StatusBadge status={r.status} />
            {r.comment && (
              <p className="supervisor-review-row-comment">{r.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
