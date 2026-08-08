import { Navigate, Outlet } from "react-router-dom";
import { getHomePath, useAuth } from "./auth";
import RouteLoadingScreen from "./components/RouteLoadingScreen";

/** Must be signed in (any role). */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <RouteLoadingScreen variant="app" />;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <RouteLoadingScreen variant="auth" />;
  }
  if (user) return <Navigate to={getHomePath(user)} replace />;
  return <Outlet />;
}

/** Employee app — admins are sent to the admin console. */
export function UserRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <RouteLoadingScreen variant="app" />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Outlet />;
}

/** Admin console — only users with role `admin` in the database. */
export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <RouteLoadingScreen variant="app" />;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/departments" replace />;
  return <Outlet />;
}
