import AuthPageSkeleton from "./skeleton/AuthPageSkeleton";
import AppPageSkeleton from "./skeleton/AppPageSkeleton";

export default function RouteLoadingScreen({ variant = "auth" }) {
  if (variant === "app") {
    return <AppPageSkeleton variant="dashboard" />;
  }
  return <AuthPageSkeleton />;
}
