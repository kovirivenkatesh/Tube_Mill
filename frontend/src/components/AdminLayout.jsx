import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Logo from "./Logo";

export default function AdminLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout admin-app-layout">
      <header className="topbar admin-topbar">
        <Link to="/admin" className="brand">
          <Logo size="sm" showWordmark />
          <span className="admin-brand-badge">Admin</span>
        </Link>
        <div className="topbar-actions">
          {user && (
            <span className="admin-user-label">{user.name}</span>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-shell">
        {(title || subtitle) && (
          <div className="page-head">
            {title && <h2 className="page-title">{title}</h2>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
