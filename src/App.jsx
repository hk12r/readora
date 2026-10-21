import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthPromptModal from "./components/AuthPromptModal";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Library from "./pages/Library";
import ReadingJournal from "./pages/ReadingJournal";
import Analytics from "./pages/Analytics";
import ChallengesGoals from "./pages/ChallengesGoals";
import Community from "./pages/Community";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  // Right-side drawer open/close state (hidden by default)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-readora-cream text-readora-brown flex flex-col justify-between">
      {/* RIGHT-SIDE SLIDEOUT SIDEBAR (OPENS ON DEMAND VIA MENU BUTTON) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* TOP HEADER */}
      <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

      {/* MAIN APPLICATION CONTENT (FULL WIDTH, UNCLUTTERED) */}
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />

          {/* PROTECTED ROUTES - ONLY VISIBLE AFTER LOGIN / REGISTRATION */}
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <ReadingJournal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <ChallengesGoals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* INFORMATIONAL & AUTH PAGES */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      <Footer />
      <AuthPromptModal />
    </div>
  );
}

export default App;
