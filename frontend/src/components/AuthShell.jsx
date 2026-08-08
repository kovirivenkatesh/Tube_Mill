import { Link } from "react-router-dom";

import Logo from "./Logo";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-inner">
          <Logo size="lg" showWordmark className="logo-hero" />
          <p className="auth-hero-tagline">
            Log issues by department and mill. Supervisors approve by email — status updates live in the app.
          </p>
          <ul className="auth-features">
            <li>Mechanical — gears, mills, wrenches</li>
            <li>Electrical — power, wiring, controls</li>
            <li>9 tube mills · email approval</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="card auth-card">
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">{subtitle}</p>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, to }) {
  return (
    <p>
      {text} <Link to={to}>{linkText}</Link>
    </p>
  );
}
