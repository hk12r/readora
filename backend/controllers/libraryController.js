const LibraryEntry = require("../models/LibraryEntry");
const Book = require("../models/Book");
const User = require("../models/User");

// Helper to award XP and check streaks
async function awardUserXP(userId, amount, actionName) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.xp = (user.xp || 0) + amount;
    user.level = Math.floor(user.xp / 200) + 1;

    // Check streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastRead = user.streak?.lastReadDate
      ? new Date(user.streak.lastReadDate).setHours(0, 0, 0, 0)
      : 0;

    const diffDays = Math.round((today - lastRead) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak.current = (user.streak.current || 0) + 1;
      if (user.streak.current > (user.streak.longest || 0)) {
        user.streak.longest = user.streak.current;
      }
      user.streak.lastReadDate = new Date();
    } else if (diffDays > 1) {
      user.streak.current = 1;
      user.streak.lastReadDate = new Date();
    }

    // Check milestone badge: 1st book read
    const booksReadCount = await LibraryEntry.countDocuments({
      userId,
      shelf: "Read",
    });

    const hasBadge = (badgeId) =>
      user.badges.some((b) => b.id === badgeId);

    if (booksReadCount >= 1 && !hasBadge("first_finish")) {
      user.badges.push({
        id: "first_finish",
        name: "First Voyage Complete",
        icon: "🏆",
        description: "Finished your first book on Readora!",
        earnedAt: new Date(),
      });
    }

    if (booksReadCount >= 10 && !hasBadge("ten_books")) {
      user.badges.push({
        id: "ten_books",
        name: "Tome Explorer",
        icon: "📚",
        description: "Completed 10 books on Readora!",
        earnedAt: new Date(),
      });
    }

    if (user.streak.current >= 7 && !hasBadge("week_streak")) {
      user.badges.push({
        id: "week_streak",
        name: "Streak of Flame",
        icon: "🔥",
        description: "Maintained a 7-day reading streak!",
        earnedAt: new Date(),
      });
    }

    await user.save();
  } catch (err) {
    console.warn("Error updating user XP/streak:", err.message);
  }
}

// GET - Get all library entries for the authenticated user
const getLibrary = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.query.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const entries = await LibraryEntry.find({ userId })
      .populate("bookId")
      .sort({ updatedAt: -1 });

    // Group entries for convenient consumption
    const shelves = {
      currentlyReading: entries.filter((e) => e.shelf === "Currently Reading"),
      wantToRead: entries.filter((e) => e.shelf === "Want to Read"),
      read: entries.filter((e) => e.shelf === "Read"),
      dnf: entries.filter((e) => e.shelf === "DNF"),
      favorites: entries.filter((e) => e.isFavorite),
      owned: entries.filter((e) => e.isOwned),
      upNext: entries
        .filter((e) => e.isUpNext)
        .sort((a, b) => a.upNextOrder - b.upNextOrder),
    };

    // Extract all unique custom shelves and tags
    const customShelvesSet = new Set();
    const tagsSet = new Set();

    entries.forEach((e) => {
      (e.customShelves || []).forEach((s) => customShelvesSet.add(s));
      (e.tags || []).forEach((t) => tagsSet.add(t));
    });

    res.json({
      totalCount: entries.length,
      shelves,
      entries,
      customShelves: Array.from(customShelvesSet),
      tags: Array.from(tagsSet),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Add a book to user's library
const addToLibrary = async (req, res) => {
  try {
    const userId = req.user._id;
    let {
      bookId,
      bookData,
      shelf = "Want to Read",
      isFavorite = false,
      isOwned = false,
      isUpNext = false,
      customShelves = [],
      tags = [],
      whyIReadThis = null,
    } = req.body;

    // If full bookData is provided (from search / external API / homepage)
    if (!bookId && bookData) {
      let book = null;
      if (bookData.isbn && bookData.isbn !== "0000000000000") {
        book = await Book.findOne({ isbn: bookData.isbn });
      }
      if (!book && bookData.title) {
        book = await Book.findOne({
          title: new RegExp(`^${bookData.title.trim()}$`, "i"),
          author: new RegExp(`^${bookData.author.trim()}$`, "i"),
        });
      }

      if (!book) {
        book = new Book({
          title: bookData.title || "Untitled",
          author: bookData.author || "Unknown",
          isbn: bookData.isbn || `${Date.now()}`,
          pages: bookData.pages || 300,
          genre: bookData.genre || "Fiction",
          rating: bookData.rating || 4.0,
          cover: bookData.cover || `https://covers.openlibrary.org/b/isbn/${bookData.isbn}-M.jpg`,
          blurb: bookData.blurb || "A wonderful story waiting to be explored.",
          publicationYear: bookData.publicationYear || 2020,
          country: bookData.country || "International",
          pace: bookData.pace || "Medium",
          moods: bookData.moods || ["Comforting"],
          isFiction: bookData.isFiction !== undefined ? bookData.isFiction : true,
        });
        await book.save();
      }
      bookId = book._id;
    }

    if (!bookId) {
      return res.status(400).json({ message: "Book ID or bookData is required" });
    }

    // Check if already in library
    let entry = await LibraryEntry.findOne({ userId, bookId });
    if (entry) {
      entry.shelf = shelf;
      if (isFavorite !== undefined) entry.isFavorite = isFavorite;
      if (isOwned !== undefined) entry.isOwned = isOwned;
      if (isUpNext !== undefined) entry.isUpNext = isUpNext;
      if (whyIReadThis) entry.whyIReadThis = whyIReadThis;
      await entry.save();
      entry = await LibraryEntry.findById(entry._id).populate("bookId");
      return res.status(200).json(entry);
    }

    const startDate = shelf === "Currently Reading" ? new Date() : null;
    const finishDate = shelf === "Read" ? new Date() : null;

    entry = new LibraryEntry({
      userId,
      bookId,
      shelf,
      isFavorite,
      isOwned,
      isUpNext,
      customShelves,
      tags,
      whyIReadThis,
      startDate,
      finishDate,
      currentPage: shelf === "Read" ? 100 : 0,
      percentage: shelf === "Read" ? 100 : 0,
    });

    const savedEntry = await entry.save();
    await savedEntry.populate("bookId");

    // Award XP
    await awardUserXP(userId, 25, "Added book to library");

    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT - Update a library entry (shelf, page, ratings, review, DNF)
const updateLibraryEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;

    const entry = await LibraryEntry.findOne({ _id: entryId, userId }).populate("bookId");
    if (!entry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    const prevShelf = entry.shelf;
    const {
      shelf,
      currentPage,
      percentage,
      rating,
      reviewText,
      dnfReason,
      dnfPage,
      whyIReadThis,
      personalNotes,
      isFavorite,
      isOwned,
      isUpNext,
      upNextOrder,
      customShelves,
      tags,
    } = req.body;

    if (shelf) {
      entry.shelf = shelf;
      if (shelf === "Currently Reading" && !entry.startDate) {
        entry.startDate = new Date();
      }
      if (shelf === "Read") {
        if (!entry.finishDate) entry.finishDate = new Date();
        if (entry.bookId?.pages) {
          entry.currentPage = entry.bookId.pages;
          entry.percentage = 100;
        }
        if (prevShelf !== "Read") {
          await awardUserXP(userId, 100, "Finished a book");
        }
      }
      if (shelf === "DNF") {
        entry.dnfPage = dnfPage || entry.currentPage || 0;
        entry.dnfReason = dnfReason || "Lost interest";
      }
    }

    if (currentPage !== undefined) {
      entry.currentPage = Math.max(0, parseInt(currentPage));
      const totalPages = entry.bookId?.pages || 100;
      entry.percentage = Math.min(100, Math.round((entry.currentPage / totalPages) * 100));

      if (entry.percentage >= 100 && entry.shelf !== "Read") {
        entry.shelf = "Read";
        entry.finishDate = new Date();
        await awardUserXP(userId, 100, "Finished book via page progress");
      }
    }

    if (percentage !== undefined && currentPage === undefined) {
      entry.percentage = Math.min(100, Math.max(0, parseInt(percentage)));
      if (entry.bookId?.pages) {
        entry.currentPage = Math.round((entry.percentage / 100) * entry.bookId.pages);
      }
    }

    if (rating !== undefined) entry.rating = rating;
    if (reviewText !== undefined) entry.reviewText = reviewText;
    if (dnfReason !== undefined) entry.dnfReason = dnfReason;
    if (dnfPage !== undefined) entry.dnfPage = dnfPage;
    if (whyIReadThis !== undefined) entry.whyIReadThis = whyIReadThis;
    if (personalNotes !== undefined) entry.personalNotes = personalNotes;
    if (isFavorite !== undefined) entry.isFavorite = isFavorite;
    if (isOwned !== undefined) entry.isOwned = isOwned;
    if (isUpNext !== undefined) entry.isUpNext = isUpNext;
    if (upNextOrder !== undefined) entry.upNextOrder = upNextOrder;
    if (customShelves !== undefined) entry.customShelves = customShelves;
    if (tags !== undefined) entry.tags = tags;

    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - Remove a book from library
const removeFromLibrary = async (req, res) => {
  try {
    const userId = req.user._id;
    const entry = await LibraryEntry.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!entry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    res.json({
      message: "Book removed from library successfully",
      entry,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST - Import CSV or JSON from Goodreads, StoryGraph, Fable, or Readora
const importLibrary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { books = [], source = "csv" } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: "No book rows provided for import" });
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of books) {
      try {
        const title = item.Title || item.title || item["Book Title"] || "Unknown Title";
        const author = item.Author || item.author || item["Author l-f"] || "Unknown Author";
        const isbn =
          item.ISBN || item.ISBN13 || item.isbn || item["ISBN13"] || `${Date.now()}_${Math.random()}`;
        const pages = parseInt(item["Number of Pages"] || item.pages || item.pageCount || 300);

        // Normalize shelf mapping
        let shelf = "Want to Read";
        const rawShelf = (item["Exclusive Shelf"] || item.shelf || item.Status || "").toLowerCase();
        if (rawShelf.includes("currently") || rawShelf.includes("reading")) {
          shelf = "Currently Reading";
        } else if (rawShelf.includes("read") || rawShelf.includes("finished") || rawShelf.includes("completed")) {
          shelf = "Read";
        } else if (rawShelf.includes("dnf") || rawShelf.includes("did not finish") || rawShelf.includes("abandoned")) {
          shelf = "DNF";
        }

        // Find or create book in catalog
        let book = await Book.findOne({
          $or: [
            { isbn: String(isbn).replace(/[^0-9X]/gi, "") },
            { title: new RegExp(`^${title.trim()}$`, "i") },
          ],
        });

        if (!book) {
          book = new Book({
            title,
            author,
            isbn: String(isbn).replace(/[^0-9X]/gi, "") || `${Date.now()}_${Math.random()}`,
            pages: pages > 0 ? pages : 320,
            genre: item.Genre || item.genre || "Fiction",
            rating: parseFloat(item["My Rating"] || item.rating || 4.0),
            cover: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
            blurb: item.blurb || "An imported story from your personal literary journey.",
            publicationYear: parseInt(item["Year Published"] || 2020),
            country: "International",
            pace: "Medium",
            moods: ["Thought-provoking"],
            isFiction: true,
          });
          await book.save();
        }

        // Create or update LibraryEntry
        const existingEntry = await LibraryEntry.findOne({ userId, bookId: book._id });
        if (!existingEntry) {
          const entry = new LibraryEntry({
            userId,
            bookId: book._id,
            shelf,
            rating: item["My Rating"] ? parseFloat(item["My Rating"]) : null,
            reviewText: item["My Review"] || item.review || "",
            currentPage: shelf === "Read" ? book.pages : 0,
            percentage: shelf === "Read" ? 100 : 0,
            startDate: item["Date Started"] ? new Date(item["Date Started"]) : null,
            finishDate: item["Date Read"] ? new Date(item["Date Read"]) : null,
          });
          await entry.save();
          importedCount++;
        } else {
          skippedCount++;
        }
      } catch (rowErr) {
        console.warn("Row import skipped:", rowErr.message);
        skippedCount++;
      }
    }

    await awardUserXP(userId, importedCount * 10, "Imported library");

    res.json({
      message: `Successfully imported ${importedCount} books (${skippedCount} duplicates/skipped).`,
      importedCount,
      skippedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Export full library as JSON or CSV formatted records
const exportLibrary = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");

    const exportData = entries.map((e) => ({
      Title: e.bookId?.title || "Unknown",
      Author: e.bookId?.author || "Unknown",
      ISBN: e.bookId?.isbn || "",
      "My Rating": e.rating || "",
      "Average Rating": e.bookId?.rating || "",
      "Number of Pages": e.bookId?.pages || "",
      "Year Published": e.bookId?.publicationYear || "",
      "Exclusive Shelf": e.shelf,
      "Date Started": e.startDate ? e.startDate.toISOString().split("T")[0] : "",
      "Date Read": e.finishDate ? e.finishDate.toISOString().split("T")[0] : "",
      "My Review": e.reviewText || "",
      "Current Page": e.currentPage || 0,
      "DNF Reason": e.dnfReason || "",
      "Why I Read This": e.whyIReadThis || "",
      Tags: (e.tags || []).join(", "),
      "Custom Shelves": (e.customShelves || []).join(", "),
    }));

    res.json({
      count: exportData.length,
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLibrary,
  addToLibrary,
  updateLibraryEntry,
  removeFromLibrary,
  importLibrary,
  exportLibrary,
};