import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminCode, setIsAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useReadora();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const role = isAdminCode && adminCode === "READORA_ADMIN_2026" ? "admin" : "user";
      const data = await api.register({ name, email, password, role });
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed. Please check your information.");
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
            <h1 className="mt-3 font-display text-3xl font-bold text-readora-purple">
              Begin your reading journey
            </h1>
            <p className="mt-2 text-sm text-readora-brown/70">
              Create your own little literary universe.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-100 p-3 text-center text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-readora-purple">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />

            <label className="mb-2 mt-4 block text-sm font-semibold text-readora-purple">
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
              placeholder="Create a password"
            />

            {/* OPTIONAL ADMIN INVITATION CODE */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsAdminCode(!isAdminCode)}
                className="text-[11px] font-semibold text-readora-brown/60 hover:text-readora-purple"
              >
                {isAdminCode ? "− Hide Administrator Invitation Code" : "+ Have an Administrator code?"}
              </button>
              {isAdminCode && (
                <input
                  type="text"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin invite passkey (e.g. READORA_ADMIN_2026)"
                  className="mt-2 input-field text-xs"
                />
              )}
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create My READORA ✦"}
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
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-readora-purple hover:text-readora-gold">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;