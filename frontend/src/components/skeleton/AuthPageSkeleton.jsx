import { Skeleton, SkeletonBlock, SkeletonText } from "./Skeleton";

export default function AuthPageSkeleton() {
  return (
    <div className="auth-page skeleton-page" aria-busy="true" aria-label="Loading">
      <div className="auth-hero skeleton-auth-hero">
        <div className="auth-hero-inner">
          <SkeletonBlock className="skeleton-logo" />
          <SkeletonText width="90%" height={16} />
          <SkeletonText width="75%" height={16} />
          <div className="skeleton-auth-features">
            <SkeletonText width="70%" />
            <SkeletonText width="65%" />
            <SkeletonText width="55%" />
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="card auth-card skeleton-auth-card">
          <SkeletonText width="55%" height={28} className="skeleton-title" />
          <SkeletonText width="40%" height={14} />
          <div className="skeleton-form-fields">
            <SkeletonText width="30%" height={12} />
            <SkeletonBlock className="skeleton-input" />
            <SkeletonText width="30%" height={12} />
            <SkeletonBlock className="skeleton-input" />
            <SkeletonBlock className="skeleton-btn" />
          </div>
        </div>
      </div>
    </div>
  );
}
