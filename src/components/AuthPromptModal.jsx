import React from "react";
import { useNavigate } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";

function AuthPromptModal() {
  const { authModal, closeAuthModal, demoLogin } = useReadora();
  const navigate = useNavigate();

  if (!authModal.isOpen) return null;

  const handleLogin = () => {
    closeAuthModal();
    navigate("/login");
  };

  const handleRegister = () => {
    closeAuthModal();
    navigate("/register");
  };

  const handleDemoSignIn = async () => {
    await demoLogin();
    closeAuthModal();
  };

  return (
    <div
      className="
        fixed inset-0 z-[200]
        flex items-center justify-center
        bg-readora-plum/70 p-4
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
          shadow-2xl sm:p-9
          animate-scale-in
        "
      >
        <button
          onClick={closeAuthModal}
          className="
            absolute right-4 top-4
            flex h-9 w-9 items-center justify-center
            rounded-full bg-readora-purple/10
            text-lg text-readora-purple
            transition hover:bg-readora-gold hover:text-readora-purple
          "
        >
          ✕
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-readora-purple to-readora-plum shadow-magical">
            <span className="text-2xl text-readora-gold">✦</span>
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold text-readora-purple sm:text-3xl">
            Save to Your Library
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-readora-brown/80">
            {authModal.message ||
              "Join READORA to keep track of this book, log reading sessions, and build your literary universe."}
          </p>

          {authModal.bookToSave && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-readora-purple/10 bg-white/70 p-3 text-left">
              {authModal.bookToSave.cover && (
                <img
                  src={authModal.bookToSave.cover}
                  alt={authModal.bookToSave.title}
                  className="h-12 w-9 rounded object-cover shadow-sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-readora-purple">
                  {authModal.bookToSave.title}
                </p>
                <p className="truncate text-[11px] text-readora-brown/70">
                  {authModal.bookToSave.author}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleLogin}
              className="
                w-full rounded-full
                bg-readora-gold px-6 py-3
                text-sm font-bold text-readora-purple
                shadow-gold transition-all duration-300
                hover:-translate-y-0.5 hover:bg-readora-goldLight
              "
            >
              Log In to Save Book ✦
            </button>

            <button
              onClick={handleRegister}
              className="
                w-full rounded-full
                border border-readora-purple/20
                bg-white/80 px-6 py-3
                text-sm font-bold text-readora-purple
                transition hover:bg-readora-lavenderLight
              "
            >
              Create Free Account
            </button>

            <button
              onClick={handleDemoSignIn}
              className="
                mt-1 text-xs font-semibold
                text-readora-purple/70 underline-offset-4
                hover:text-readora-purple hover:underline
              "
            >
              Continue with One-Click Demo Reader Account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPromptModal;
