import React from "react";
import { Link } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function ProtectedRoute({ children, role }) {
  const { auth, openAuthModal } = useReadora();

  if (auth.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-readora-purple border-t-transparent"></div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full rounded-3xl border border-readora-gold/30 bg-white/85 p-8 text-center shadow-xl backdrop-blur-md animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-readora-purple to-readora-plum text-2xl text-readora-gold shadow-magical">
            🔒
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-readora-purple">
            Authentication Required
          </h2>
          <p className="mt-2 text-xs text-readora-brown/75 leading-relaxed">
            This literary feature is reserved for registered READORA readers. Sign in with your registered email OTP or Google to access your private library, reading progress, and personalized insights.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => openAuthModal({ message: "Sign in with OTP or Google to access this feature." })}
              className="w-full rounded-full bg-readora-purple py-3 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
            >
              Sign In with Email OTP ⚡
            </button>
            <Link
              to="/login"
              className="w-full rounded-full border border-readora-purple/20 bg-white py-2.5 text-xs font-bold text-readora-purple hover:bg-readora-lavenderLight transition"
            >
              Sign In or Register with Password / Google
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (role && auth.user.role !== role) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white p-8 rounded-3xl border border-red-200">
          <h2 className="font-display text-2xl font-bold text-red-700">Access Denied</h2>
          <p className="mt-2 text-xs text-readora-brown/70">
            You do not have the required permissions ({role}) to view this area.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-full bg-readora-purple px-5 py-2 text-xs font-bold text-readora-cream"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return children;
}

export default ProtectedRoute;
