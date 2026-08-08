import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHomePath, useAuth } from "../auth";
import AuthShell, { AuthFooterLink } from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";
import { useToast } from "../components/Toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await register(name, email, password);
      showToast("Account created. Welcome!", "success");
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
      title="Create account"
      subtitle="Register to access departments and tube mills"
      footer={<AuthFooterLink text="Already registered?" linkText="Sign in" to="/login" />}
    >
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
          autoComplete="new-password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>
    </AuthShell>
  );
}
