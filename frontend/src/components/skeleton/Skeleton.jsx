export function Skeleton({ className = "", style, ...props }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ width = "100%", height = 14, className = "" }) {
  return <Skeleton className={`skeleton-text ${className}`} style={{ width, height }} />;
}

export function SkeletonBlock({ className = "", style }) {
  return <Skeleton className={`skeleton-block ${className}`} style={style} />;
}
