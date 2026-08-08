import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Layout, { Crumb } from "../components/Layout";
import { ReportsListSkeleton } from "../components/skeleton/AppPageSkeleton";
import { SubmissionImages } from "../components/ReportImageAttachments";
import { getSubmissionFieldRows, overallStatusLabel } from "../utils/submissionDisplay";
import SupervisorReviewStatusList from "../components/SupervisorReviewStatusList";

export default function MyReportsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    api
      .listSubmissions()
      .then(({ submissions }) => setList(submissions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout
      breadcrumb={<Crumb items={[{ to: "/departments", label: "Departments" }, { label: "My reports" }]} />}
      title="My reports"
      subtitle="Track overall status and each supervisor’s decision"
    >
      {error && <div className="error-banner">{error}</div>}
      {loading && !list.length && <ReportsListSkeleton />}
      {!loading && !list.length && (
        <div className="empty-state">
          <p>No reports yet.</p>
          <Link to="/departments" className="btn btn-primary" style={{ width: "auto", textDecoration: "none" }}>
            Create report
          </Link>
        </div>
      )}
      <ul className="submission-list">
        {list.map((s) => (
          <li key={s.id} className="submission-item">
            <header>
              <strong>
                {s.dept} —  {s.tubeMill}
              </strong>
              <span className={`status-badge status-${s.status}`} title="Overall report status">
                {overallStatusLabel(s.status)}
              </span>
            </header>
            <SupervisorReviewStatusList submission={s} />
            <ul className="submission-field-list">
              {getSubmissionFieldRows(s).map((row) => (
                <li key={row.label}>
                  <strong>{row.label}:</strong> {row.value}
                </li>
              ))}
            </ul>
            <SubmissionImages images={s.images} compact />
            {s.supervisorComment && s.status !== "pending" && (
              <p className="submission-supervisor-comment">
                <strong>Summary:</strong> {s.supervisorComment}
              </p>
            )}
            <p style={{ fontSize: "0.75rem" }}>
              {new Date(s.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
