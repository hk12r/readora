import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useReadora } from "../context/ReadoraContext";
import BookModal from "../components/BookModal";
import api from "../services/api";

function Library() {
  const {
    library,
    removeFromShelf,
    updateShelf,
    updateProgress,
    toggleFavorite,
    toggleOwned,
    toggleUpNext,
    markAsDnf,
    auth,
    openAuthModal,
    fetchLibrary,
    showToast,
  } = useReadora();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  // DNF modal
  const [dnfModalEntry, setDnfModalEntry] = useState(null);
  const [dnfReason, setDnfReason] = useState("Too slow");
  const [dnfPage, setDnfPage] = useState("");

  // Progress update inline state
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [progressPage, setProgressPage] = useState("");

  // Import / Export state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState("storygraph");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Tabs definition
  const tabs = [
    { id: "all", label: "All Books", count: library.entries.length },
    { id: "currentlyReading", label: "Currently Reading", count: library.shelves.currentlyReading.length },
    { id: "wantToRead", label: "Want to Read", count: library.shelves.wantToRead.length },
    { id: "read", label: "Read / Completed", count: library.shelves.read.length },
    { id: "dnf", label: "DNF", count: library.shelves.dnf.length },
    { id: "favorites", label: "Favorites ❤️", count: library.shelves.favorites.length },
    { id: "owned", label: "Owned 📖", count: library.shelves.owned.length },
    { id: "upNext", label: "Up Next Queue ⚡", count: library.shelves.upNext.length },
  ];

  // Filter entries based on active tab & search
  const displayedEntries = useMemo(() => {
    let list = library.entries;

    if (activeTab === "currentlyReading") list = library.shelves.currentlyReading;
    else if (activeTab === "wantToRead") list = library.shelves.wantToRead;
    else if (activeTab === "read") list = library.shelves.read;
    else if (activeTab === "dnf") list = library.shelves.dnf;
    else if (activeTab === "favorites") list = library.shelves.favorites;
    else if (activeTab === "owned") list = library.shelves.owned;
    else if (activeTab === "upNext") list = library.shelves.upNext;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const title = (e.bookId?.title || e.title || "").toLowerCase();
        const author = (e.bookId?.author || e.author || "").toLowerCase();
        return title.includes(q) || author.includes(q);
      });
    }

    return list;
  }, [library, activeTab, search]);

  // Handle DNF confirm
  const handleConfirmDnf = async () => {
    if (!dnfModalEntry) return;
    await markAsDnf(
      dnfModalEntry._id,
      dnfReason,
      parseInt(dnfPage) || dnfModalEntry.currentPage || 0
    );
    setDnfModalEntry(null);
  };

  // Handle Quick Progress Save
  const handleSaveProgress = async (entry) => {
    const pageNum = parseInt(progressPage);
    if (isNaN(pageNum) || pageNum < 0) return;
    const total = entry.bookId?.pages || 300;
    const pct = Math.min(100, Math.round((pageNum / total) * 100));
    await updateProgress(entry._id, pageNum, pct);
    setEditingProgressId(null);
  };

  // Handle CSV / StoryGraph / Goodreads file upload parser
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) {
      showToast("Please select a file or paste CSV content first.", "error");
      return;
    }

    setImporting(true);
    try {
      // Parse CSV into array of objects
      const lines = importText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV does not contain sufficient rows");

      // Simple CSV split handling quotes
      const parseCSVLine = (text) => {
        const res = [];
        let insideQuote = false;
        let entry = "";
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"' && (i === 0 || text[i - 1] !== "\\")) {
            insideQuote = !insideQuote;
          } else if (char === "," && !insideQuote) {
            res.push(entry.trim().replace(/^"|"$/g, ""));
            entry = "";
          } else {
            entry += char;
          }
        }
        res.push(entry.trim().replace(/^"|"$/g, ""));
        return res;
      };

      const headers = parseCSVLine(lines[0]);
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx];
          });
          rows.push(rowObj);
        }
      }

      const res = await api.importLibrary({
        books: rows,
        source: importSource,
      });

      showToast(res.message || "Library imported successfully!");
      setImportModalOpen(false);
      setImportText("");
      await fetchLibrary();
    } catch (err) {
      showToast(err.message || "Import failed. Please check CSV formatting.", "error");
    } finally {
      setImporting(false);
    }
  };

  // Handle Export
  const handleExport = async (format = "csv") => {
    try {
      const res = await api.exportLibrary();
      if (!res?.data) return;

      if (format === "csv") {
        const headers = Object.keys(res.data[0] || {});
        const csvRows = [
          headers.join(","),
          ...res.data.map((row) =>
            headers
              .map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`)
              .join(",")
          ),
        ];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `readora_library_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `readora_library_export_${new Date().toISOString().split("T")[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast(`Library exported successfully as ${format.toUpperCase()}! ✦`);
    } catch (err) {
      showToast("Could not export library: " + err.message, "error");
    }
  };

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER & IMPORT/EXPORT TOOLBAR */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
              <span>📚</span> Personal Library
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
              My Reading Universe
            </h1>
            <p className="mt-2 text-sm text-readora-brown/75">
              Organize your reading shelves, update progress, manage your TBR queue, and export your
              collection.
            </p>
          </div>

          {/* IMPORT & EXPORT ACTIONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to import your library from StoryGraph or Goodreads." });
                  return;
                }
                setImportModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-full border border-readora-purple/20 bg-white/80 px-4 py-2.5 text-xs font-bold text-readora-purple shadow-sm transition hover:border-readora-gold hover:bg-readora-lavenderLight"
            >
              <span>📥</span> Import from StoryGraph / Goodreads
            </button>

            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to export your reading library." });
                  return;
                }
                handleExport("csv");
              }}
              className="flex items-center gap-2 rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream shadow-magical transition hover:bg-readora-plum"
            >
              <span>📤</span> Export Library (CSV)
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition
                ${
                  activeTab === tab.id
                    ? "bg-readora-purple text-readora-cream shadow-sm"
                    : "border border-readora-purple/15 bg-white/70 text-readora-brown hover:border-readora-gold"
                }
              `}
            >
              <span>{tab.label}</span>
              <span
                className={`
                  rounded-full px-2 py-0.5 text-[10px]
                  ${
                    activeTab === tab.id
                      ? "bg-readora-gold text-readora-purple"
                      : "bg-readora-lavenderLight/50 text-readora-purple"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your library..."
            className="w-full max-w-sm rounded-full border border-readora-purple/15 bg-white/80 px-4 py-2.5 text-xs text-readora-brown outline-none focus:border-readora-gold"
          />

          <p className="text-xs font-semibold text-readora-brown/60">
            Showing {displayedEntries.length} of {library.entries.length} books
          </p>
        </div>

        {/* BOOK ENTRIES LIST / CARDS */}
        {displayedEntries.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {displayedEntries.map((entry) => {
              const book = entry.bookId || entry;
              const totalPages = book.pages || 320;
              const currentPg = entry.currentPage || 0;
              const percentage = entry.percentage || Math.round((currentPg / totalPages) * 100);

              return (
                <div
                  key={entry._id || entry.isbn}
                  className="group relative flex flex-col gap-4 rounded-3xl border border-readora-purple/10 bg-white/85 p-5 shadow-sm transition hover:border-readora-gold/40 hover:shadow-magical md:flex-row md:items-center md:justify-between"
                >
                  {/* BOOK INFO */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={
                        book.cover ||
                        (book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg` : "")
                      }
                      alt={book.title}
                      onClick={() => setSelectedBook(book)}
                      className="h-24 w-16 cursor-pointer rounded-xl object-cover shadow-sm transition hover:scale-105"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-readora-lavenderLight/40 px-2.5 py-0.5 text-[10px] font-bold text-readora-purple">
                          {entry.shelf}
                        </span>
                        {entry.isFavorite && (
                          <span className="text-xs" title="Favorite">
                            ❤️
                          </span>
                        )}
                        {entry.isOwned && (
                          <span className="text-xs" title="Owned Book">
                            📖
                          </span>
                        )}
                        {entry.isUpNext && (
                          <span className="text-xs font-bold text-readora-gold" title="Up Next">
                            ⚡ Up Next
                          </span>
                        )}
                        {entry.shelf === "DNF" && entry.dnfReason && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            DNF: {entry.dnfReason}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setSelectedBook(book)}
                        className="mt-1.5 cursor-pointer font-display text-lg font-bold text-readora-purple hover:text-readora-gold transition truncate"
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-readora-brown/70">{book.author}</p>

                      {entry.whyIReadThis && (
                        <p className="mt-1 text-[11px] text-readora-gold font-semibold">
                          ✦ Why I read this: {entry.whyIReadThis}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PROGRESS METER & CONTROLS */}
                  <div className="flex flex-col gap-3 md:w-80">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-readora-purple">
                        <span>
                          Page {currentPg} of {totalPages}
                        </span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-readora-purple/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-readora-gold to-readora-purple transition-all duration-300"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* QUICK PAGE UPDATE ROW */}
                    {editingProgressId === entry._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={progressPage}
                          onChange={(e) => setProgressPage(e.target.value)}
                          placeholder="Page"
                          max={totalPages}
                          className="w-20 rounded-xl border border-readora-purple/20 bg-white px-2 py-1 text-xs text-readora-brown outline-none"
                        />
                        <button
                          onClick={() => handleSaveProgress(entry)}
                          className="rounded-xl bg-readora-purple px-3 py-1 text-xs font-bold text-readora-cream"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingProgressId(null)}
                          className="text-xs text-readora-brown/60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProgressId(entry._id);
                            setProgressPage(currentPg);
                          }}
                          className="rounded-lg border border-readora-purple/15 bg-white/70 px-2 py-1 text-[11px] font-semibold text-readora-brown hover:bg-white"
                        >
                          ✏ Log Page
                        </button>

                        {/* QUICK SHELF SWITCH */}
                        <select
                          value={entry.shelf}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "DNF") {
                              setDnfModalEntry(entry);
                              setDnfPage(currentPg);
                            } else {
                              updateShelf(entry._id, val);
                            }
                          }}
                          className="rounded-lg border border-readora-purple/15 bg-white/70 px-2 py-1 text-[11px] font-semibold text-readora-purple outline-none"
                        >
                          <option value="Want to Read">Want to Read</option>
                          <option value="Currently Reading">Currently Reading</option>
                          <option value="Read">Read / Finished</option>
                          <option value="DNF">DNF (Did Not Finish)</option>
                        </select>

                        {/* FAVORITE TOGGLE */}
                        <button
                          onClick={() => toggleFavorite(entry._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-readora-purple/15 bg-white/70 text-xs hover:bg-white"
                          title="Toggle Favorite"
                        >
                          {entry.isFavorite ? "❤️" : "🤍"}
                        </button>

                        {/* REMOVE BUTTON */}
                        <button
                          onClick={() => removeFromShelf(entry._id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 ml-auto"
                          title="Remove from library"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-readora-purple/20 bg-white/60 p-14 text-center">
            <span className="text-4xl text-readora-gold">📖</span>
            <h3 className="mt-3 font-display text-2xl font-bold text-readora-purple">
              No books found on this shelf
            </h3>
            <p className="mt-2 text-sm text-readora-brown/70">
              Explore the discovery catalog and add titles to begin building your personal library.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex rounded-full bg-readora-gold px-6 py-2.5 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
            >
              Discover Books ✦
            </Link>
          </div>
        )}
      </div>

      {/* DNF REASON MODAL */}
      {dnfModalEntry && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setDnfModalEntry(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <h3 className="font-display text-2xl font-bold text-readora-purple">
              Move to DNF (Did Not Finish)
            </h3>
            <p className="mt-1 text-xs text-readora-brown/75">
              Tracking why you stopped reading helps READORA analyze your reading patterns and
              prevent future reading slumps.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Why are you abandoning this book?
                </label>
                <select
                  value={dnfReason}
                  onChange={(e) => setDnfReason(e.target.value)}
                  className="w-full rounded-xl border border-readora-purple/20 bg-white p-2.5 text-xs font-semibold text-readora-brown outline-none"
                >
                  <option value="Too slow">Pacing was too slow</option>
                  <option value="Too long">Book was too long / dragged out</option>
                  <option value="Disliked characters">Couldn't connect with the characters</option>
                  <option value="Writing style didn't click">Writing style didn't click</option>
                  <option value="Lost interest">Lost interest / got bored</option>
                  <option value="Too dense / difficult">Too dense, complex, or difficult</option>
                  <option value="Disappointing plot">Disappointing plot twists / predictable</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  At what page did you stop reading?
                </label>
                <input
                  type="number"
                  value={dnfPage}
                  onChange={(e) => setDnfPage(e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full rounded-xl border border-readora-purple/20 bg-white p-2.5 text-xs text-readora-brown outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDnfModalEntry(null)}
                className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDnf}
                className="rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white shadow"
              >
                Confirm DNF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {importModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setImportModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-readora-purple">
                Import Your Reading History
              </h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-lg text-readora-brown hover:text-readora-purple"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-readora-brown/75">
              Seamlessly migrate all your shelves, ratings, dates, and reviews from StoryGraph,
              Goodreads, Fable, or standard CSV files.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Select Format / Source
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {["storygraph", "goodreads", "fable", "csv"].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setImportSource(src)}
                      className={`rounded-xl border py-2 capitalize transition ${
                        importSource === src
                          ? "border-readora-purple bg-readora-purple text-readora-cream"
                          : "border-readora-purple/20 bg-white text-readora-brown"
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-readora-brown file:mr-3 file:rounded-full file:border-0 file:bg-readora-gold file:px-4 file:py-2 file:text-xs file:font-bold file:text-readora-purple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Or Paste CSV Data Directly
                </label>
                <textarea
                  rows="5"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Title,Author,ISBN,My Rating,Average Rating,Number of Pages,Exclusive Shelf..."
                  className="w-full rounded-2xl border border-readora-purple/20 bg-white p-3 text-xs font-mono text-readora-brown outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setImportModalOpen(false)}
                className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing}
                className="rounded-full bg-readora-gold px-6 py-2.5 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight"
              >
                {importing ? "Importing Books..." : "Start Import ✦"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK DETAIL MODAL */}
      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </main>
  );
}

export default Library;
