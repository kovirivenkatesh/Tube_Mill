import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getHomePath, useAuth } from "../auth";
import AuthShell, { AuthFooterLink } from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";
import { useToast } from "../components/Toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      showToast("Signed in successfully.", "success");
      navigate(getHomePath(u));
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue"
      footer={<AuthFooterLink text="No account?" linkText="Create one" to="/register" />}
    >
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <PasswordInput
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="forgot-row">
          <Link to="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
