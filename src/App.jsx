import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthPromptModal from "./components/AuthPromptModal";

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Library from "./pages/Library";
import ReadingJournal from "./pages/ReadingJournal";
import Analytics from "./pages/Analytics";
import ChallengesGoals from "./pages/ChallengesGoals";
import Community from "./pages/Community";
import SmartNotes from "./pages/SmartNotes";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <div className="min-h-screen bg-readora-cream flex flex-col justify-between">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/library" element={<Library />} />
          <Route path="/journal" element={<ReadingJournal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/challenges" element={<ChallengesGoals />} />
          <Route path="/community" element={<Community />} />
          <Route path="/notes" element={<SmartNotes />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>

      <Footer />
      <AuthPromptModal />
    </div>
  );
}

export default App;