import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, demoLogin, showToast } = useReadora();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    await demoLogin();
    navigate("/");
  };

  return (
    <main className="magical-background min-h-screen">
      <section className="page-container flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-7 shadow-magical backdrop-blur-xl sm:p-9 animate-scale-in">
          <div className="text-center">
            <span className="text-4xl text-readora-gold">✦</span>
            <h1 className="mt-4 font-display text-3xl font-bold text-readora-purple">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-readora-brown/70">
              Return to your reading universe.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-100 p-3 text-center text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-readora-purple">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />

            <label className="mb-2 mt-4 block text-sm font-semibold text-readora-purple">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />

            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Login ✦"}
            </Button>

            <button
              type="button"
              onClick={handleDemo}
              className="mt-3 w-full rounded-full border border-readora-gold/40 bg-readora-gold/15 py-2.5 text-xs font-bold text-readora-purple hover:bg-readora-gold transition"
            >
              One-Click Demo Guest Sign-In →
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-readora-brown/70">
            New to READORA?{" "}
            <Link
              to="/register"
              className="font-bold text-readora-purple hover:text-readora-gold"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;