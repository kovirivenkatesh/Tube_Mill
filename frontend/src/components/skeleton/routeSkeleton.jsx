import AuthPageSkeleton from "./AuthPageSkeleton";
import AppPageSkeleton from "./AppPageSkeleton";

export function getAppSkeletonVariant(pathname) {
  if (pathname.startsWith("/approve")) return "approve";
  if (pathname.includes("/report")) return "form";
  if (pathname.includes("/mills")) return "mills";
  if (pathname === "/my-reports") return "reports";
  return "dashboard";
}

export function isAuthRoute(pathname) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password")
  );
}

export function RouteSkeletonForPath({ pathname }) {
  if (isAuthRoute(pathname)) {
    return <AuthPageSkeleton />;
  }
  return <AppPageSkeleton variant={getAppSkeletonVariant(pathname)} />;
}
