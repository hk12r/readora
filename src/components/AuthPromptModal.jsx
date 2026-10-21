import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function AuthPromptModal() {
  const { authModal, closeAuthModal, sendOtp, verifyOtp, googleLogin, showToast } = useReadora();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!authModal.isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to dispatch OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError("Please enter the 6-digit OTP sent to your registered email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp.trim());
      closeAuthModal();
      setStep("email");
      setOtp("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const mockEmail = email && email.includes("@") ? email : `reader_${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;
      await googleLogin({
        email: mockEmail,
        name: "Google Reader",
        avatar: "https://lh3.googleusercontent.com/a/default-user",
        googleId: `g_${Date.now()}`,
      });
      closeAuthModal();
    } catch (err) {
      setError("Google sign-in error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[200]
        flex items-center justify-center
        bg-readora-plum/75 p-4
        backdrop-blur-md
        animate-fade-in
      "
      onClick={closeAuthModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-md
          overflow-hidden rounded-3xl
          border border-readora-gold/30
          bg-readora-cream p-7
          shadow-2xl sm:p-8
          animate-scale-in
        "
      >
        <button
          onClick={closeAuthModal}
          className="
            absolute right-4 top-4
            flex h-8 w-8 items-center justify-center
            rounded-full bg-readora-purple/10
            text-sm text-readora-purple
            transition hover:bg-readora-gold hover:text-readora-purple
          "
        >
          ✕
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-readora-purple to-readora-plum shadow-magical">
            <span className="text-2xl text-readora-gold">✦</span>
          </div>

          <h2 className="mt-3 font-display text-2xl font-bold text-readora-purple">
            Sign In with OTP
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-readora-brown/75">
            {authModal.message ||
              "Sign in with your registered email OTP or Google to sync reading progress and buddy reads."}
          </p>

          {authModal.bookToSave && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-readora-purple/10 bg-white/70 p-2.5 text-left">
              {authModal.bookToSave.cover && (
                <img
                  src={authModal.bookToSave.cover}
                  alt={authModal.bookToSave.title}
                  className="h-10 w-8 rounded object-cover shadow-2xs"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-readora-purple">
                  {authModal.bookToSave.title}
                </p>
                <p className="truncate text-[10px] text-readora-brown/70">
                  {authModal.bookToSave.author}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 p-2.5 text-center text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* SIGN IN WITH GOOGLE BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2.5 rounded-full border border-readora-purple/20 bg-white px-4 py-2.5 text-xs font-bold text-readora-purple shadow-2xs hover:bg-readora-lavenderLight transition"
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
            <span className="absolute bg-readora-cream px-3 text-[10px] uppercase font-bold text-readora-brown/50">
              or use registered email OTP
            </span>
          </div>

          {/* OTP STEP 1: ENTER EMAIL */}
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email address..."
                className="w-full rounded-full border border-readora-purple/20 bg-white px-4 py-2.5 text-xs text-readora-brown outline-none focus:border-readora-purple shadow-inner"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-readora-purple py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
              >
                {loading ? "Sending One-Time Code..." : "Send OTP Code ⚡"}
              </button>
            </form>
          ) : (
            /* OTP STEP 2: ENTER 6-DIGIT CODE */
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="rounded-xl bg-readora-lavenderLight/40 p-2 text-[11px] text-readora-purple">
                Code sent to <strong>{email}</strong>
              </div>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code (e.g. 123456)..."
                className="w-full rounded-full border border-readora-purple/25 bg-white px-4 py-2.5 text-center text-sm font-mono tracking-widest text-readora-purple outline-none focus:border-readora-purple"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-readora-gold py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight transition"
              >
                {loading ? "Verifying Code..." : "Verify & Sign In ✦"}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-[11px] text-readora-purple underline font-semibold"
              >
                ← Change Email Address
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-readora-purple/10 flex items-center justify-between text-[11px] text-readora-brown/70">
            <Link
              to="/login"
              onClick={closeAuthModal}
              className="font-bold text-readora-purple hover:underline"
            >
              Password Login
            </Link>
            <Link
              to="/register"
              onClick={closeAuthModal}
              className="font-bold text-readora-purple hover:underline"
            >
              Create New Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPromptModal;
