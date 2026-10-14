import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function Admin() {
  const { auth, showToast } = useReadora();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // New Book form state
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    isbn: "",
    genre: "Fantasy",
    pages: 350,
    rating: 4.5,
    cover: "",
    blurb: "",
    publicationYear: 2026,
    country: "United Kingdom",
    pace: "Medium",
    moods: "Magical, Comforting",
  });

  const loadAdminData = async () => {
    try {
      const [sData, uData, rData] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAllUsers(),
        api.getReportedReviews(),
      ]);

      if (sData.status === "fulfilled" && sData.value) setStats(sData.value);
      if (uData.status === "fulfilled" && uData.value) setUsers(uData.value);
      if (rData.status === "fulfilled" && rData.value) setReports(rData.value);
    } catch (err) {
      console.warn("Could not load admin data:", err.message);
    }
  };

  useEffect(() => {
    if (auth.user?.role === "admin") {
      loadAdminData();
    }
  }, [auth.user]);

  // Handle user role update
  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    try {
      await api.updateUserRole(userId, nextRole);
      showToast(`User role updated to ${nextRole.toUpperCase()}`);
      await loadAdminData();
    } catch (err) {
      showToast("Could not update role", "error");
    }
  };

  // Handle add book
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const moodsArray = newBook.moods.split(",").map((m) => m.trim()).filter(Boolean);
      await api.createBook({
        ...newBook,
        pages: parseInt(newBook.pages),
        rating: parseFloat(newBook.rating),
        publicationYear: parseInt(newBook.publicationYear),
        moods: moodsArray,
      });

      showToast("Book added to Readora Catalog! ✦");
      setNewBook({
        title: "",
        author: "",
        isbn: "",
        genre: "Fantasy",
        pages: 350,
        rating: 4.5,
        cover: "",
        blurb: "",
        publicationYear: 2026,
        country: "United Kingdom",
        pace: "Medium",
        moods: "Magical, Comforting",
      });
      await loadAdminData();
    } catch (err) {
      showToast("Could not add book: " + err.message, "error");
    }
  };

  // Moderate review
  const handleDismissReport = async (reviewId) => {
    try {
      await api.dismissReviewReport(reviewId);
      showToast("Report dismissed.");
      await loadAdminData();
    } catch (err) {
      showToast("Error dismissing report", "error");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.deleteReviewModerated(reviewId);
      showToast("Review deleted by moderator.");
      await loadAdminData();
    } catch (err) {
      showToast("Error deleting review", "error");
    }
  };

  if (auth.user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-readora-cream py-16">
        <div className="page-container text-center">
          <span className="text-4xl text-red-500">🔒</span>
          <h1 className="mt-4 font-display text-3xl font-bold text-readora-purple">
            Administrator Access Required
          </h1>
          <p className="mt-2 text-sm text-readora-brown/75">
            This portal is restricted to authorized platform administrators.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-readora-purple/20 bg-readora-purple/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
            <span>⚙️</span> Platform Administration
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-readora-brown/75">
            Manage users, oversee catalog additions, review reports, and inspect system telemetry.
          </p>
        </div>

        {/* STATS TILES */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total Readers", val: stats?.totalUsers ?? users.length, icon: "👤" },
            { label: "Catalog Books", val: stats?.totalBooks ?? 77, icon: "📚" },
            { label: "Total Reviews", val: stats?.totalReviews ?? 24, icon: "💬" },
            { label: "Shelf Entries", val: stats?.totalEntries ?? 120, icon: "📖" },
            { label: "Flagged Content", val: stats?.reportedReviews ?? reports.length, icon: "⚠️" },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-3xl border border-readora-purple/10 bg-white/80 p-5 shadow-sm"
            >
              <span className="text-xl">{t.icon}</span>
              <p className="mt-2 font-display text-2xl font-bold text-readora-purple">{t.val}</p>
              <p className="text-[11px] font-semibold text-readora-brown/65">{t.label}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="mt-8 flex gap-2 border-b border-readora-purple/10 pb-2">
          {[
            { id: "overview", label: "Manage Users 👥" },
            { id: "addBook", label: "Add Catalog Book ➕" },
            { id: "reports", label: `Review Moderation (${reports.length}) 🛡️` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-readora-purple text-readora-cream shadow-sm"
                  : "bg-white/70 text-readora-brown hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: MANAGE USERS */}
        {activeTab === "overview" && (
          <div className="mt-6 rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm animate-fade-in overflow-x-auto">
            <h3 className="font-display text-lg font-bold text-readora-purple mb-4">
              Registered Readers ({users.length})
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-readora-purple/10 text-readora-brown/60 uppercase">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Level / XP</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-readora-purple/5 font-semibold text-readora-purple">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-readora-cream/30">
                    <td className="py-3">{u.name}</td>
                    <td className="py-3 text-readora-brown/70">{u.email}</td>
                    <td className="py-3">
                      Lvl {u.level || 1} ({u.xp || 0} XP)
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleRole(u._id, u.role)}
                        className="rounded-lg border border-readora-purple/20 px-2.5 py-1 text-[11px] font-bold text-readora-purple hover:bg-readora-lavenderLight"
                      >
                        {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: ADD BOOK TO CATALOG */}
        {activeTab === "addBook" && (
          <form
            onSubmit={handleAddBook}
            className="mt-6 max-w-2xl rounded-3xl border border-readora-purple/10 bg-white/80 p-8 shadow-sm animate-fade-in space-y-4"
          >
            <h3 className="font-display text-xl font-bold text-readora-purple">
              Add New Book to Readora Catalog
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Book Title"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Author</label>
                <input
                  required
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Author Name"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">ISBN</label>
                <input
                  required
                  type="text"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  placeholder="9780000000000"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Genre</label>
                <input
                  type="text"
                  value={newBook.genre}
                  onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                  placeholder="Genre"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Pages</label>
                <input
                  type="number"
                  value={newBook.pages}
                  onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-readora-purple block mb-1">
                Description / Blurb
              </label>
              <textarea
                rows="3"
                value={newBook.blurb}
                onChange={(e) => setNewBook({ ...newBook, blurb: e.target.value })}
                placeholder="Comprehensive book synopsis..."
                className="w-full rounded-2xl border border-readora-purple/15 bg-white p-3 text-xs outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">Country</label>
                <input
                  type="text"
                  value={newBook.country}
                  onChange={(e) => setNewBook({ ...newBook, country: e.target.value })}
                  placeholder="e.g. Japan, UK, USA"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Moods (comma-separated)
                </label>
                <input
                  type="text"
                  value={newBook.moods}
                  onChange={(e) => setNewBook({ ...newBook, moods: e.target.value })}
                  placeholder="e.g. Comforting, Magical"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 rounded-full bg-readora-gold px-8 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
            >
              Add Book to Catalog ✦
            </button>
          </form>
        )}

        {/* TAB 3: REVIEW MODERATION */}
        {activeTab === "reports" && (
          <div className="mt-6 rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm animate-fade-in space-y-4">
            <h3 className="font-display text-lg font-bold text-readora-purple">
              Reported Reviews Queue ({reports.length})
            </h3>

            {reports.length > 0 ? (
              reports.map((r) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-red-200 bg-red-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-red-700">Flagged: {r.reportReason || "Content"}</span>
                    <p className="mt-1 font-bold text-readora-purple">{r.bookId?.title}</p>
                    <p className="text-readora-brown/80 italic">"{r.reviewText}"</p>
                    <p className="text-[10px] text-readora-brown/60">Reviewed by {r.userId?.name}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismissReport(r._id)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r._id)}
                      className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white shadow hover:bg-red-700"
                    >
                      Delete Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-readora-brown/60 py-6">
                No reported reviews in the queue. Everything looks clean!
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Admin;
