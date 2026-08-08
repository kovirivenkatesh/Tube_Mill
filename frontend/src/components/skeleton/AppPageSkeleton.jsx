import { SkeletonBlock, SkeletonText } from "./Skeleton";

function SkeletonTopbar() {
  return (
    <header className="topbar skeleton-topbar">
      <SkeletonBlock className="skeleton-brand" />
      <div className="skeleton-nav-links">
        <SkeletonBlock className="skeleton-nav-pill" />
        <SkeletonBlock className="skeleton-nav-pill" />
      </div>
      <SkeletonBlock className="skeleton-user-chip" />
    </header>
  );
}

function DashboardBody() {
  return (
    <>
      <div className="panel skeleton-panel">
        <SkeletonText width="40%" height={18} />
        <SkeletonText width="95%" height={14} />
        <SkeletonText width="80%" height={14} />
        <div className="skeleton-inline-form">
          <SkeletonBlock className="skeleton-input skeleton-input-grow" />
          <SkeletonBlock className="skeleton-btn skeleton-btn-sm" />
        </div>
      </div>
      <SkeletonText width="30%" height={16} className="skeleton-section-label" />
      <div className="grid-2">
        <SkeletonBlock className="skeleton-dept-card" />
        <SkeletonBlock className="skeleton-dept-card" />
      </div>
    </>
  );
}

function MillsBody() {
  return (
    <div className="grid-mills">
      {Array.from({ length: 9 }, (_, i) => (
        <SkeletonBlock key={i} className="skeleton-mill-card" />
      ))}
    </div>
  );
}

function FormBody() {
  return (
    <div className="panel skeleton-panel">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton-field">
          <SkeletonText width="28%" height={12} />
          <SkeletonBlock className="skeleton-input" />
        </div>
      ))}
      <SkeletonBlock className="skeleton-textarea" />
      <SkeletonBlock className="skeleton-btn" />
    </div>
  );
}

function ReportsBody() {
  return (
    <ul className="skeleton-submission-list">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="skeleton-submission-item">
          <div className="skeleton-submission-head">
            <SkeletonText width="45%" height={16} />
            <SkeletonBlock className="skeleton-badge" />
          </div>
          <SkeletonText width="70%" height={14} />
          <SkeletonText width="100%" height={14} />
          <SkeletonText width="35%" height={12} />
        </li>
      ))}
    </ul>
  );
}

function ApproveBody() {
  return (
    <div className="card card-narrow skeleton-approve-card">
      <SkeletonText width="50%" height={28} className="skeleton-title" />
      <SkeletonText width="85%" height={14} />
      <SkeletonText width="60%" height={14} />
      <SkeletonBlock className="skeleton-btn skeleton-btn-inline" />
    </div>
  );
}

const BODIES = {
  dashboard: DashboardBody,
  mills: MillsBody,
  form: FormBody,
  reports: ReportsBody,
  approve: ApproveBody,
};

export default function AppPageSkeleton({ variant = "dashboard" }) {
  const Body = BODIES[variant] || DashboardBody;
  const showHead = variant !== "approve";

  return (
    <div className="app-layout skeleton-page" aria-busy="true" aria-label="Loading">
      {variant !== "approve" && <SkeletonTopbar />}
      <main className={`app-shell ${variant === "approve" ? "approve-page" : ""}`}>
        {showHead && (
          <div className="page-head">
            <SkeletonText width="min(280px, 55%)" height={32} className="skeleton-page-title" />
            <SkeletonText width="min(420px, 80%)" height={16} />
          </div>
        )}
        <Body />
      </main>
    </div>
  );
}

export function ReportsListSkeleton() {
  return <ReportsBody />;
}
