import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function Login() {
  const [authMode, setAuthMode] = useState("otp"); // "otp" or "password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, sendOtp, verifyOtp, googleLogin, showToast } = useReadora();
  const navigate = useNavigate();

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid registered email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      showToast(`One-time code dispatched to ${email}! Check your inbox.`, "success");
    } catch (err) {
      setError(err.message || "Could not dispatch OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp.trim());
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password Submit
  const handlePasswordSubmit = async (e) => {
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

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const mockEmail = email && email.includes("@") ? email : `reader_${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;
      await googleLogin({
        email: mockEmail,
        name: "Google Reader",
        avatar: "https://lh3.googleusercontent.com/a/default-user",
        googleId: `google_${Date.now()}`,
      });
      navigate("/");
    } catch (err) {
      setError("Google sign-in error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="magical-background min-h-screen">
      <section className="page-container flex min-h-[calc(100vh-80px)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-magical backdrop-blur-xl sm:p-9 animate-scale-in">
          <div className="text-center">
            <span className="text-4xl text-readora-gold">✦</span>
            <h1 className="mt-3 font-display text-3xl font-bold text-readora-purple">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-readora-brown/70">
              Sign in to sync your reading journey, buddy reads, & library.
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-100 p-3 text-center text-xs font-bold text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* SIGN IN WITH GOOGLE */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2.5 rounded-full border border-readora-purple/20 bg-white px-4 py-2.5 text-xs font-bold text-readora-purple shadow-xs hover:bg-readora-lavenderLight transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-readora-purple/15"></div>
            <span className="absolute bg-white px-3 text-[10px] uppercase font-bold text-readora-brown/50">
              or continue with
            </span>
          </div>

          {/* AUTH MODE TOGGLE PILLS */}
          <div className="flex rounded-full bg-readora-lavenderLight/40 p-1 border border-readora-purple/10 mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setError("");
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${
                authMode === "otp"
                  ? "bg-readora-purple text-readora-cream shadow-xs"
                  : "text-readora-brown/70 hover:text-readora-purple"
              }`}
            >
              Email OTP ⚡
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setError("");
              }}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${
                authMode === "password"
                  ? "bg-readora-purple text-readora-cream shadow-xs"
                  : "text-readora-brown/70 hover:text-readora-purple"
              }`}
            >
              Password
            </button>
          </div>

          {/* MODE 1: OTP AUTHENTICATION */}
          {authMode === "otp" ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-readora-purple">
                    Registered Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field text-xs"
                    placeholder="you@example.com"
                  />
                  <p className="mt-1 text-[11px] text-readora-brown/60">
                    A secure 6-digit one-time code will be dispatched to this inbox.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Dispatching Code..." : "Send Verification OTP ⚡"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-xl bg-readora-lavenderLight/40 p-3 text-xs text-readora-purple">
                  <span>Code dispatched to: </span>
                  <strong>{email}</strong>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-readora-purple">
                    6-Digit One-Time Code (OTP)
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-field text-center font-mono text-base tracking-widest text-readora-purple"
                    placeholder="123456"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP & Sign In ✦"}
                </Button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-readora-purple underline font-semibold"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-readora-purple font-semibold hover:underline"
                  >
                    Resend Code ⟳
                  </button>
                </div>
              </form>
            )
          ) : (
            /* MODE 2: PASSWORD AUTHENTICATION */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-readora-purple">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field text-xs"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-readora-purple">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field text-xs"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Authenticating..." : "Login with Password ✦"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-readora-brown/70">
            New to READORA?{" "}
            <Link
              to="/register"
              className="font-bold text-readora-purple hover:text-readora-gold underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
