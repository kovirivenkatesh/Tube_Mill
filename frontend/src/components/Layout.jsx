import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth";
import Logo from "./Logo";
import UserAvatar from "./UserAvatar";
import ProfilePhotoEditor from "./ProfilePhotoEditor";
import ProfileNameEditor from "./ProfileNameEditor";

function CloseIcon() {
  return (
    <span className="panel-close-icon" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function HamburgerIcon({ open }) {
  return (
    <span className={`hamburger-icon ${open ? "open" : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Layout({ title, subtitle, children, breadcrumb }) {
  const { user, logout } = useAuth();
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const profilePanelRef = useRef(null);
  const profileTriggerDesktopRef = useRef(null);
  const profileTriggerMobileRef = useRef(null);

  useEffect(() => {
    if (!userPanelOpen) return;

    function closeIfOutside(event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (profilePanelRef.current?.contains(target)) return;
      if (profileTriggerDesktopRef.current?.contains(target)) return;
      if (profileTriggerMobileRef.current?.contains(target)) return;
      setUserPanelOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setUserPanelOpen(false);
    }

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userPanelOpen]);

  function toggleUserPanel() {
    setUserPanelOpen((o) => !o);
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <Link to="/departments" className="brand">
          <Logo size="sm" showWordmark />
        </Link>
        <nav className="topnav" aria-label="Main navigation">
          <NavLink to="/departments" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Home
          </NavLink>
          <NavLink to="/my-reports" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            My reports
          </NavLink>
        </nav>
        <div className="topbar-actions">
          {user && (
            <button
              type="button"
              ref={profileTriggerDesktopRef}
              className="user-chip user-chip-desktop user-chip-btn"
              onClick={toggleUserPanel}
              aria-expanded={userPanelOpen}
              aria-controls="user-profile-panel"
            >
              <UserAvatar user={user} size="sm" />
              <span className="user-chip-name">{user.name}</span>
            </button>
          )}
          {user && (
            <button type="button" className="btn btn-ghost btn-sm user-logout-desktop" onClick={logout}>
              Log out
            </button>
          )}
          {user && (
            <button
              type="button"
              ref={profileTriggerMobileRef}
              className="user-menu-btn"
              onClick={toggleUserPanel}
              aria-expanded={userPanelOpen}
              aria-controls="user-profile-panel"
              aria-label={userPanelOpen ? "Close menu" : "Open profile menu"}
            >
              <UserAvatar user={user} size="sm" />
              <HamburgerIcon open={userPanelOpen} />
            </button>
          )}
        </div>
      </header>

      {user && userPanelOpen && (
        <button
          type="button"
          className="user-panel-backdrop"
          aria-label="Close profile menu"
          onClick={() => setUserPanelOpen(false)}
        />
      )}

      {user && (
        <div
          id="user-profile-panel"
          ref={profilePanelRef}
          className={`mobile-user-panel user-profile-panel ${userPanelOpen ? "open" : ""}`}
          aria-hidden={!userPanelOpen}
        >
          <div className="mobile-user-panel-header">
            <p className="mobile-user-panel-heading">Profile</p>
            <button
              type="button"
              className="user-panel-close-btn"
              onClick={() => setUserPanelOpen(false)}
              aria-label="Close profile menu"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="mobile-user-panel-inner user-profile-panel-inner">
            <ProfilePhotoEditor layout="stacked" />
            <ProfileNameEditor />
            <p className="mobile-user-email profile-email-readonly">{user.email}</p>
            <button type="button" className="btn btn-ghost btn-sm user-logout-mobile" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/departments" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}>
          Home
        </NavLink>
        <NavLink to="/my-reports" className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}>
          My reports
        </NavLink>
      </nav>

      <main className="app-shell">
        {breadcrumb}
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

export function Crumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.to || item.label} className="crumb-item">
          {i > 0 && <span className="crumb-sep">›</span>}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
