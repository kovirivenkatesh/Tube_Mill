import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, UserRoute, AdminRoute } from "./ProtectedRoute";
import NavigationLoader from "./components/NavigationLoader";
import PageTransition from "./components/PageTransition";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import TubeMillsPage from "./pages/TubeMillsPage";
import ReportFormPage from "./pages/ReportFormPage";
import MyReportsPage from "./pages/MyReportsPage";
import ApprovePage from "./pages/ApprovePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <>
      <NavigationLoader />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/approve/:token" element={<ApprovePage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route element={<UserRoute />}>
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:dept/mills" element={<TubeMillsPage />} />
            <Route path="/departments/:dept/mills/:mill/report" element={<ReportFormPage />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </PageTransition>
    </>
  );
}
