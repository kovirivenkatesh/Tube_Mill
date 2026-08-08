import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import AuthShell, { AuthFooterLink } from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { registered } = await api.verifyForgotPasswordEmail(email);
      if (!registered) {
        showToast("Email not found. Please register.", "error");
        return;
      }
      setStep(2);
      showToast("Email verified. Set a new password.", "success");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      const msg = "Passwords do not match.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setLoading(true);
    try {
      await api.resetForgotPassword({ email, password });
      showToast("Password updated. You can sign in now.", "success");
      navigate("/login");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={step === 1 ? "Forgot password" : "New password"}
      subtitle={
        step === 1
          ? "Enter your email — we will check if you are registered"
          : `Reset password for ${email}`
      }
      footer={<AuthFooterLink text="Remember your password?" linkText="Sign in" to="/login" />}
    >
      {error && <div className="error-banner">{error}</div>}

      {step === 1 ? (
        <form onSubmit={verifyEmail}>
          <div className="field">
            <label htmlFor="fp-email">Email</label>
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Checking…" : "Verify email"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword}>
          <PasswordInput
            id="fp-password"
            label="New password"
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <PasswordInput
            id="fp-confirm"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Change password"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 12 }}
            onClick={() => setStep(1)}
          >
            Use different email
          </button>
        </form>
      )}
    </AuthShell>
  );
}
