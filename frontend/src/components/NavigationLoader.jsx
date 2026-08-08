import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { RouteSkeletonForPath } from "./skeleton/routeSkeleton";

export default function NavigationLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const skipNextRef = useRef(true);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 420);
    return () => window.clearTimeout(hide);
  }, [location.pathname, location.key]);

  if (!visible) return null;

  return (
    <div
      className="nav-skeleton-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
    >
      <RouteSkeletonForPath pathname={location.pathname} />
    </div>
  );
}
