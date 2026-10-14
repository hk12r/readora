import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";

function SmartNotes() {
  const { auth, library, openAuthModal, showToast } = useReadora();

  const [notes, setNotes] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [newNote, setNewNote] = useState({
    bookId: "",
    type: "Chapter Note",
    title: "",
    content: "",
    chapterOrPage: "",
    tags: "",
  });

  const types = [
    "All",
    "Quote",
    "Chapter Note",
    "Character Analysis",
    "Theme & Idea",
    "Vocabulary / Passage",
  ];

  const fetchNotes = async () => {
    if (!auth.user) return;
    try {
      const data = await api.getNotes({
        type: selectedType !== "All" ? selectedType : undefined,
        search: search.trim() || undefined,
      });
      if (data) setNotes(data);
    } catch (err) {
      console.warn("Could not load notes:", err.message);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [auth.user, selectedType, search]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!auth.user) {
      openAuthModal({ message: "Sign in to save smart study notes." });
      return;
    }

    try {
      const tagsArray = newNote.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createNote({
        bookId: newNote.bookId || library.entries[0]?.bookId?._id || library.entries[0]?._id,
        type: newNote.type,
        title: newNote.title,
        content: newNote.content,
        chapterOrPage: newNote.chapterOrPage,
        tags: tagsArray,
      });

      showToast("Smart note created! +20 XP ✦");
      setIsCreating(false);
      setNewNote({
        bookId: "",
        type: "Chapter Note",
        title: "",
        content: "",
        chapterOrPage: "",
        tags: "",
      });
      await fetchNotes();
    } catch (err) {
      showToast("Could not create note: " + err.message, "error");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      showToast("Note deleted.");
      await fetchNotes();
    } catch (err) {
      showToast("Could not delete note", "error");
    }
  };

  // Export Notes to Markdown
  const handleExportMarkdown = () => {
    if (notes.length === 0) return;
    let md = `# READORA Smart Book Notes\n*Exported on ${new Date().toLocaleDateString()}*\n\n`;

    notes.forEach((n) => {
      md += `### [${n.type}] ${n.title || "Untitled Note"}\n`;
      md += `**Book:** ${n.bookId?.title || "Unknown Book"} | **Reference:** ${
        n.chapterOrPage || "N/A"
      }\n\n`;
      md += `${n.content}\n\n`;
      if (n.tags && n.tags.length > 0) {
        md += `*Tags:* ${n.tags.map((t) => `#${t}`).join(" ")}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `readora_notes_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Notes exported as Markdown file! ✦");
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
              <span>📝</span> Academic & Serious Reader Tools
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
              Smart Book Notes
            </h1>
            <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
              Capture chapter insights, character motives, recurring themes, and memorable
              passages. Perfect for literature students and deep readers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportMarkdown}
              className="rounded-full border border-readora-purple/20 bg-white/80 px-4 py-2.5 text-xs font-bold text-readora-purple shadow-sm hover:bg-readora-lavenderLight"
            >
              📥 Export Markdown (.md)
            </button>
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to create book notes." });
                  return;
                }
                setIsCreating(true);
              }}
              className="rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
            >
              + New Study Note ✦
            </button>
          </div>
        </div>

        {/* TYPE FILTER PILLS & SEARCH */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition
                  ${
                    selectedType === type
                      ? "bg-readora-purple text-readora-cream shadow-sm"
                      : "border border-readora-purple/15 bg-white/70 text-readora-brown hover:bg-white"
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, quotes, or tags..."
            className="w-full sm:w-64 rounded-full border border-readora-purple/15 bg-white px-4 py-2 text-xs text-readora-brown outline-none"
          />
        </div>

        {/* NOTES GRID */}
        {notes.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <div
                key={n._id}
                className="group relative flex flex-col justify-between rounded-3xl border border-readora-purple/10 bg-white/90 p-6 shadow-sm transition hover:border-readora-gold/40 hover:shadow-magical"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-readora-purple">
                      {n.type}
                    </span>
                    {n.chapterOrPage && (
                      <span className="text-[10px] font-bold text-readora-brown/60">
                        {n.chapterOrPage}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 font-display text-base font-bold text-readora-purple">
                    {n.title || "Study Note"}
                  </h3>

                  <p className="mt-1 text-xs text-readora-gold font-semibold">
                    {n.bookId?.title || "Book Reference"}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-readora-brown/85 whitespace-pre-line">
                    {n.content}
                  </p>
                </div>

                <div className="mt-6 border-t border-readora-purple/10 pt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(n.tags || []).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-readora-cream px-2 py-0.5 text-[9px] font-semibold text-readora-purple"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDeleteNote(n._id)}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-readora-purple/20 bg-white/60 p-14 text-center">
            <span className="text-4xl text-readora-gold">📝</span>
            <h3 className="mt-3 font-display text-2xl font-bold text-readora-purple">
              No notes recorded
            </h3>
            <p className="mt-1 text-sm text-readora-brown/70">
              Create chapter notes, character analyses, and literary reflections as you read.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NOTE MODAL */}
      {isCreating && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCreating(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-readora-purple">
                Create Smart Book Note
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-lg text-readora-brown hover:text-readora-purple"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Note Type
                  </label>
                  <select
                    value={newNote.type}
                    onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                  >
                    {types
                      .filter((t) => t !== "All")
                      .map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-readora-purple block mb-1">
                    Chapter / Page Ref
                  </label>
                  <input
                    type="text"
                    value={newNote.chapterOrPage}
                    onChange={(e) => setNewNote({ ...newNote, chapterOrPage: e.target.value })}
                    placeholder="e.g. Ch. 4 / Page 112"
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Book Reference
                </label>
                <select
                  value={newNote.bookId}
                  onChange={(e) => setNewNote({ ...newNote, bookId: e.target.value })}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                >
                  <option value="">-- Select from your library --</option>
                  {library.entries.map((entry) => {
                    const b = entry.bookId || entry;
                    return (
                      <option key={entry._id || b.isbn} value={b._id || entry._id}>
                        {b.title} by {b.author}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="e.g. Symbolism of the Sea in Chapter 3"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Content / Analysis
                </label>
                <textarea
                  required
                  rows="4"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Record your thoughts, quotes, or character analysis..."
                  className="w-full rounded-2xl border border-readora-purple/15 bg-white p-3 text-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  placeholder="e.g. motif, character-arc, quote"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-readora-purple px-5 py-2 text-xs font-bold text-readora-cream shadow"
                >
                  Save Note ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default SmartNotes;
