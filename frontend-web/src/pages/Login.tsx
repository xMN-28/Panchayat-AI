import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKey,
  Microphone,
  ShieldCheck,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Brand from "../components/Brand";
import { useAuthStore } from "../store/auth";
import type { LoginResponse } from "../types/api";

export default function Login() {
  const [email, setEmail] = useState("resident@society.com");
  const [password, setPassword] = useState("resident123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      navigate("/home", { replace: true });
    } catch (error: any) {
      setError(
        error?.response?.data?.detail ||
          "We could not sign you in. Check your email and password, then try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-page login-page">
      <section className="auth-story">
        <Brand inverse />
        <div className="auth-story-copy">
          <p>Society help, in your language</p>
          <h1>
            The shortest path from <em>asking</em> to done.
          </h1>
        </div>
        <div className="auth-proof">
          <div className="auth-voice">
            <span>
              <Microphone size={24} weight="fill" />
            </span>
            <div>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <ul>
            <li>
              <Check />
              Hindi, Marathi, and English
            </li>
            <li>
              <Check />
              Permission-checked actions
            </li>
            <li>
              <Check />
              Manual control at every step
            </li>
          </ul>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <Link to="/" className="back-link">
            <ArrowLeft size={17} />
            Back to Panchayat AI
          </Link>
          <div className="auth-heading">
            <span className="auth-lock">
              <ShieldCheck size={24} weight="duotone" />
            </span>
            <h2>Welcome back</h2>
            <p>Sign in with your approved society account.</p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <div className="feedback error" role="alert">
                {error}
              </div>
            ) : null}
            <button
              className="button button-shift"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "Signing in..." : "Sign in"}</span>
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="demo-note">
            <LockKey size={17} />
            <span>
              <strong>Resident demo</strong>resident@society.com · resident123
            </span>
          </div>
          <p className="auth-switch">
            Not approved yet? <Link to="/register">Request access</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
