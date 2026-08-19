import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

function Register() {
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

            <h1
              className="
                mt-3 font-display text-3xl
                font-bold text-readora-purple
              "
            >
              Begin your reading journey
            </h1>

            <p className="mt-2 text-sm text-readora-brown/70">
              Create your own little literary universe.
            </p>
          </div>

          <form className="mt-8">
            <label className="mb-2 block text-sm font-semibold">
              Name
            </label>

            <input
              className="input-field"
              placeholder="Your name"
            />

            <label className="mb-2 mt-5 block text-sm font-semibold">
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
              placeholder="Create a password"
            />

            <Button
              type="submit"
              className="mt-6 w-full"
            >
              Create My READORA
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-readora-brown/70">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-readora-purple hover:text-readora-gold"
            >
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;