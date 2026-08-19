import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

function Login() {
  return (
    <main className="magical-background min-h-screen">
      <section
        className="
          page-container
          flex min-h-[calc(100vh-80px)]
          items-center justify-center
          py-12
        "
      >
        <div
          className="
            w-full max-w-md
            rounded-[2rem]
            border border-white/70
            bg-white/65
            p-7
            shadow-magical
            backdrop-blur-xl
            sm:p-9
          "
        >
          <div className="text-center">
          <span className="text-4xl text-readora-gold">
            ✦
          </span>
        </div>

          <div className="text-center">
            <h1
              className="
                mt-4 font-display text-3xl
                font-bold text-readora-purple
              "
            >
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-readora-brown/70">
              Return to your reading universe.
            </p>
          </div>

          <form className="mt-8">
            <label className="mb-2 block text-sm font-semibold">
              Email
            </label>

            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
            />

            <label className="mb-2 mt-5 block text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
            />

            <Button
              type="submit"
              className="mt-6 w-full"
            >
              Login
            </Button>
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