const ReadingSession = require("../models/ReadingSession");
const LibraryEntry = require("../models/LibraryEntry");
const Book = require("../models/Book");
const User = require("../models/User");

// 1. Reading Sessions (Reading Tracking & Journal)
const createSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bookId,
      durationMinutes = 20,
      pagesRead = 15,
      startPage = 0,
      endPage = 15,
      mood = "Thoughtful",
      thoughts = "",
      favoriteQuote = "",
    } = req.body;

    const session = new ReadingSession({
      userId,
      bookId,
      durationMinutes: parseInt(durationMinutes),
      pagesRead: parseInt(pagesRead),
      startPage: parseInt(startPage),
      endPage: parseInt(endPage),
      mood,
      thoughts,
      favoriteQuote,
      date: new Date(),
    });

    await session.save();
    await session.populate("bookId");

    // Update library entry progress if it exists
    const entry = await LibraryEntry.findOne({ userId, bookId });
    if (entry) {
      if (entry.shelf === "Want to Read") {
        entry.shelf = "Currently Reading";
        entry.startDate = new Date();
      }
      entry.currentPage = Math.max(entry.currentPage || 0, parseInt(endPage));
      const totalPages = entry.bookId?.pages || 100;
      entry.percentage = Math.min(100, Math.round((entry.currentPage / totalPages) * 100));

      if (entry.percentage >= 100 && entry.shelf !== "Read") {
        entry.shelf = "Read";
        entry.finishDate = new Date();
      }
      await entry.save();
    }

    // Award XP and streak update
    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + 30 + Math.min(50, parseInt(pagesRead));
      user.level = Math.floor(user.xp / 200) + 1;

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

      await user.save();
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId } = req.query;

    const query = { userId };
    if (bookId) query.bookId = bookId;

    const sessions = await ReadingSession.find(query)
      .populate("bookId")
      .sort({ date: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Reading Goals
const getGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Year start and month start
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    // Books read this year and this month
    const readEntries = await LibraryEntry.find({
      userId,
      shelf: "Read",
      finishDate: { $gte: startOfYear },
    }).populate("bookId");

    const booksThisYear = readEntries.length;
    const booksThisMonth = readEntries.filter(
      (e) => e.finishDate && new Date(e.finishDate) >= startOfMonth
    ).length;

    // Total pages read from sessions or read books this year
    const sessions = await ReadingSession.find({
      userId,
      date: { $gte: startOfYear },
    });

    const pagesFromSessions = sessions.reduce((acc, s) => acc + (s.pagesRead || 0), 0);
    const minutesRead = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const pagesFromBooks = readEntries.reduce((acc, e) => acc + (e.bookId?.pages || 0), 0);
    const totalPagesThisYear = Math.max(pagesFromSessions, pagesFromBooks);

    const goalSettings = user.readingGoal || {
      annualTarget: 25,
      monthlyTarget: 2,
      pagesTarget: 7500,
      minutesTarget: 600,
      streakTarget: 30,
    };

    res.json({
      goals: {
        annual: {
          target: goalSettings.annualTarget || 25,
          current: booksThisYear,
          percentage: Math.min(
            100,
            Math.round((booksThisYear / (goalSettings.annualTarget || 25)) * 100)
          ),
        },
        monthly: {
          target: goalSettings.monthlyTarget || 2,
          current: booksThisMonth,
          percentage: Math.min(
            100,
            Math.round((booksThisMonth / (goalSettings.monthlyTarget || 2)) * 100)
          ),
        },
        pages: {
          target: goalSettings.pagesTarget || 7500,
          current: totalPagesThisYear,
          percentage: Math.min(
            100,
            Math.round((totalPagesThisYear / (goalSettings.pagesTarget || 7500)) * 100)
          ),
        },
        time: {
          target: goalSettings.minutesTarget || 600,
          current: minutesRead,
          percentage: Math.min(
            100,
            Math.round((minutesRead / (goalSettings.minutesTarget || 600)) * 100)
          ),
        },
        streak: {
          target: goalSettings.streakTarget || 30,
          current: user.streak?.current || 1,
          longest: user.streak?.longest || 1,
          percentage: Math.min(
            100,
            Math.round(((user.streak?.current || 1) / (goalSettings.streakTarget || 30)) * 100)
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.readingGoal = {
      ...user.readingGoal,
      ...req.body,
    };
    await user.save();

    res.json({
      message: "Reading goals updated successfully",
      readingGoal: user.readingGoal,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Reading Analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");
    const sessions = await ReadingSession.find({ userId });
    const user = await User.findById(userId);

    const readBooks = entries.filter((e) => e.shelf === "Read");
    const currentlyReading = entries.filter((e) => e.shelf === "Currently Reading");
    const wantToRead = entries.filter((e) => e.shelf === "Want to Read");
    const dnfBooks = entries.filter((e) => e.shelf === "DNF");

    // Total books and pages
    const totalBooksRead = readBooks.length;
    let totalPagesRead = readBooks.reduce((sum, e) => sum + (e.bookId?.pages || 0), 0);
    const sessionPages = sessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
    totalPagesRead = Math.max(totalPagesRead, sessionPages);

    // Average rating
    const ratedEntries = entries.filter((e) => e.rating && e.rating > 0);
    const avgRating = ratedEntries.length
      ? Math.round(
          (ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length) * 10
        ) / 10
      : 0;

    // Average book length
    const avgBookLength = readBooks.length
      ? Math.round(
          readBooks.reduce((sum, e) => sum + (e.bookId?.pages || 300), 0) / readBooks.length
        )
      : (entries.length ? Math.round(entries.reduce((sum, e) => sum + (e.bookId?.pages || 300), 0) / entries.length) : 0);

    // Genre distribution - from read books or all library books
    const genreMap = {};
    const sourceBooks = readBooks.length > 0 ? readBooks : entries;
    sourceBooks.forEach((e) => {
      const g = e.bookId?.genre || "Fiction";
      genreMap[g] = (genreMap[g] || 0) + 1;
    });

    // Rating distribution (1 to 5 stars)
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedEntries.forEach((e) => {
      const star = Math.round(e.rating);
      if (ratingDistribution[star] !== undefined) {
        ratingDistribution[star]++;
      }
    });

    // Fiction vs Nonfiction
    let fictionCount = 0;
    let nonfictionCount = 0;
    sourceBooks.forEach((e) => {
      if (e.bookId?.isFiction === false) nonfictionCount++;
      else fictionCount++;
    });

    // Monthly breakdown (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();

      const booksInMonth = readBooks.filter((e) => {
        const entryDate = e.finishDate ? new Date(e.finishDate) : new Date(e.updatedAt || e.createdAt);
        return entryDate.getFullYear() === mYear && entryDate.getMonth() === mMonth;
      }).length;

      const pagesInMonth = sessions
        .filter((s) => {
          const sd = new Date(s.date);
          return sd.getFullYear() === mYear && sd.getMonth() === mMonth;
        })
        .reduce((sum, s) => sum + s.pagesRead, 0);

      monthlyData.push({
        month: monthNames[mMonth],
        books: booksInMonth,
        pages: pagesInMonth || (booksInMonth * 280),
      });
    }

    // Reading speed (pages per hour)
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const readingPacePerHour =
      totalMinutes > 0
        ? Math.round((sessionPages / totalMinutes) * 60)
        : (sessionPages > 0 ? 40 : 0);

    // Author diversity
    const authorMap = {};
    readBooks.forEach((e) => {
      const a = e.bookId?.author || "Unknown";
      authorMap[a] = (authorMap[a] || 0) + 1;
    });

    res.json({
      overview: {
        totalBooksRead,
        totalPagesRead,
        currentlyReading: currentlyReading.length,
        wantToRead: wantToRead.length,
        dnfCount: dnfBooks.length,
        averageRating: avgRating,
        averageBookLength: avgBookLength,
        readingPacePerHour,
        currentStreak: user?.streak?.current || 1,
        longestStreak: user?.streak?.longest || 1,
        level: user?.level || 1,
        xp: user?.xp || 0,
      },
      genreDistribution: genreMap,
      ratingDistribution,
      fictionVsNonfiction: {
        fiction: fictionCount,
        nonfiction: nonfictionCount,
      },
      monthlyData,
      authorDiversity: {
        uniqueAuthors: Object.keys(authorMap).length,
        topAuthors: Object.entries(authorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([author, count]) => ({ author, count })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Reader Personality Profile Generator
const getReaderPersonality = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");
    const sessions = await ReadingSession.find({ userId });
    const user = await User.findById(userId);

    const readBooks = entries.filter((e) => e.shelf === "Read");

    // Dominant genre
    const genreCounts = {};
    readBooks.forEach((e) => {
      const g = e.bookId?.genre || "Fiction";
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    let topGenre = "Fantasy";
    let maxGCount = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > maxGCount) {
        maxGCount = count;
        topGenre = genre;
      }
    }

    // Pace analysis
    let fastCount = 0, slowCount = 0, medCount = 0;
    readBooks.forEach((e) => {
      if (e.bookId?.pace === "Fast") fastCount++;
      else if (e.bookId?.pace === "Slow") slowCount++;
      else medCount++;
    });

    const preferredPace =
      fastCount >= medCount && fastCount >= slowCount
        ? "Fast-paced"
        : slowCount > fastCount && slowCount > medCount
        ? "Atmospheric & Slow"
        : "Moderate & Steady";

    // Average page count
    const avgLength = readBooks.length
      ? Math.round(
          readBooks.reduce((s, e) => s + (e.bookId?.pages || 320), 0) / readBooks.length
        )
      : 360;

    // Archetype selection
    let archetype = "The Cosmic Voyager";
    let description = "You read with an expansive sense of wonder, seeking stories that transport you beyond everyday bounds.";
    let icon = "🌌";

    if (topGenre.toLowerCase().includes("fantasy") || topGenre.toLowerCase().includes("magic")) {
      archetype = "The Worldbuilder Weaver";
      description = "Drawn to rich mythologies and intricate world lore, you treat every book as an enchanted realm to inhabit.";
      icon = "🏰";
    } else if (topGenre.toLowerCase().includes("mystery") || topGenre.toLowerCase().includes("thriller")) {
      archetype = "The Nocturnal Sleuth";
      description = "Driven by plot twists and psychological riddles, you stay up way past midnight to read just one more chapter.";
      icon = "🔍";
    } else if (topGenre.toLowerCase().includes("romance")) {
      archetype = "The Heartfelt Romantic";
      description = "You cherish deep emotional bonds, character chemistry, and hopeful, passionate journeys that stay with you forever.";
      icon = "✨";
    } else if (topGenre.toLowerCase().includes("dystopian") || topGenre.toLowerCase().includes("sci")) {
      archetype = "The Speculative Thinker";
      description = "Fascinated by visionary futures and philosophical dilemmas, you ponder humanity's greatest questions through fiction.";
      icon = "🚀";
    } else if (avgLength > 450) {
      archetype = "The Tome Conqueror";
      description = "Epic sagas and substantial doorstoppers are your true home. You embrace long, deep reading commitments with passion.";
      icon = "📚";
    }

    res.json({
      archetype,
      icon,
      description,
      topGenre,
      preferredPace,
      averageLength: avgLength,
      readingConsistency: user?.streak?.current > 5 ? "Highly Consistent" : "Flexible Explorer",
      traits: [
        `Favorite Realm: ${topGenre}`,
        `Preferred Pace: ${preferredPace}`,
        `Sweet Spot: ~${avgLength} pages`,
        `Curiosity Index: ${Math.min(98, 70 + (readBooks.length * 3))}%`,
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. DNF Analysis
const getDnfAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");

    const dnfEntries = entries.filter((e) => e.shelf === "DNF");
    const totalStarted = entries.filter(
      (e) => e.shelf === "Read" || e.shelf === "DNF" || e.shelf === "Currently Reading"
    ).length;

    const abandonmentRate = totalStarted
      ? Math.round((dnfEntries.length / totalStarted) * 100)
      : 0;

    // Reason frequency
    const reasonCounts = {
      "Too slow": 0,
      "Too long": 0,
      "Disliked characters": 0,
      "Writing style didn't click": 0,
      "Lost interest": 0,
      "Too dense / difficult": 0,
      "Disappointing plot": 0,
      Other: 0,
    };

    let totalDnfPage = 0;
    let pageCounted = 0;

    dnfEntries.forEach((e) => {
      const reason = e.dnfReason || "Lost interest";
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;

      if (e.dnfPage && e.dnfPage > 0) {
        totalDnfPage += e.dnfPage;
        pageCounted++;
      }
    });

    const averageDnfPage = pageCounted ? Math.round(totalDnfPage / pageCounted) : 85;

    // Find top reason
    let topReason = "Lost interest";
    let topCount = 0;
    for (const [r, c] of Object.entries(reasonCounts)) {
      if (c > topCount) {
        topCount = c;
        topReason = r;
      }
    }

    let patternInsight = "You give books a fair shot before letting go.";
    if (topReason === "Too slow") {
      patternInsight = "You value compelling narrative momentum. Slow burn stories are more prone to abandonment.";
    } else if (topReason === "Writing style didn't click") {
      patternInsight = "Prose aesthetics matter deeply to you. If the voice doesn't resonate within the first 50 pages, you move on.";
    } else if (averageDnfPage > 150) {
      patternInsight = "You are patient and read deep into books before making the final decision to DNF.";
    }

    res.json({
      dnfCount: dnfEntries.length,
      abandonmentRate,
      averageDnfPage,
      topReason,
      reasonCounts,
      patternInsight,
      dnfBooks: dnfEntries.map((e) => ({
        id: e._id,
        title: e.bookId?.title,
        author: e.bookId?.author,
        cover: e.bookId?.cover,
        dnfReason: e.dnfReason || "Lost interest",
        dnfPage: e.dnfPage || e.currentPage || 0,
        totalPages: e.bookId?.pages || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Pick My Next Book ("Surprise Me")
const pickNextBook = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      mood,
      length, // 'short' (<250), 'medium' (250-450), 'epic' (>450)
      pace,   // 'Fast', 'Medium', 'Slow'
      source = "all", // 'tbr' or 'all'
    } = req.body;

    let candidateBooks = [];

    if (source === "tbr") {
      const tbrEntries = await LibraryEntry.find({
        userId,
        shelf: "Want to Read",
      }).populate("bookId");
      candidateBooks = tbrEntries.map((e) => e.bookId).filter(Boolean);
    }

    if (candidateBooks.length === 0) {
      candidateBooks = await Book.find({});
    }

    // Filter candidates
    let filtered = candidateBooks;

    if (mood && mood !== "Any") {
      filtered = filtered.filter((b) => (b.moods || []).includes(mood));
    }

    if (pace && pace !== "Any") {
      filtered = filtered.filter((b) => b.pace === pace);
    }

    if (length === "short") {
      filtered = filtered.filter((b) => (b.pages || 300) < 250);
    } else if (length === "medium") {
      filtered = filtered.filter((b) => (b.pages || 300) >= 250 && (b.pages || 300) <= 450);
    } else if (length === "epic") {
      filtered = filtered.filter((b) => (b.pages || 300) > 450);
    }

    if (filtered.length === 0) {
      filtered = candidateBooks;
    }

    // Random selection from matched set
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const chosenBook = filtered[randomIndex] || candidateBooks[0];

    const matchReason = `Matched your desire for a ${mood || "captivating"} ${
      pace ? `${pace.toLowerCase()} ` : ""
    }story in ${chosenBook.genre || "fiction"}.`;

    res.json({
      book: chosenBook,
      matchReason,
      availableOptionsCount: filtered.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Personalized Recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");

    // Gather user preferences
    const likedGenres = new Set();
    const likedMoods = new Set();
    const readIsbns = new Set(entries.map((e) => e.bookId?.isbn).filter(Boolean));

    entries.forEach((e) => {
      if ((e.rating && e.rating >= 4) || e.shelf === "Read" || e.isFavorite) {
        if (e.bookId?.genre) likedGenres.add(e.bookId.genre);
        (e.bookId?.moods || []).forEach((m) => likedMoods.add(m));
      }
    });

    const allBooks = await Book.find({});
    const unreadBooks = allBooks.filter((b) => !readIsbns.has(b.isbn));

    // Score each unread book
    const scored = unreadBooks.map((b) => {
      let score = b.rating || 4.0;
      let reason = "Highly rated in the Readora catalog";

      if (likedGenres.has(b.genre)) {
        score += 2.0;
        reason = `Because you enjoyed books in ${b.genre}`;
      }

      const matchingMoods = (b.moods || []).filter((m) => likedMoods.has(m));
      if (matchingMoods.length > 0) {
        score += 1.5;
        reason = `Because you love ${matchingMoods.join(" & ")} stories`;
      }

      return {
        book: b,
        score,
        reason,
        matchPercentage: Math.min(99, Math.round((score / 8.5) * 100)),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 12));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Literary World Map
const getWorldMap = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({ userId }).populate("bookId");

    const countryMap = {};

    entries.forEach((e) => {
      const country = e.bookId?.country || "International";
      if (!countryMap[country]) {
        countryMap[country] = {
          country,
          count: 0,
          books: [],
        };
      }
      countryMap[country].count++;
      countryMap[country].books.push({
        id: e.bookId?._id,
        title: e.bookId?.title,
        author: e.bookId?.author,
        cover: e.bookId?.cover,
        shelf: e.shelf,
      });
    });

    const list = Object.values(countryMap).sort((a, b) => b.count - a.count);

    res.json({
      totalCountries: list.length,
      countries: list,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Reading Timeline
const getTimeline = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await LibraryEntry.find({
      userId,
      shelf: "Read",
    })
      .populate("bookId")
      .sort({ finishDate: -1, updatedAt: -1 });

    const timeline = entries.map((e) => {
      const date = e.finishDate || e.updatedAt || new Date();
      const dObj = new Date(date);
      return {
        id: e._id,
        book: e.bookId,
        year: dObj.getFullYear(),
        month: dObj.toLocaleString("default", { month: "long" }),
        dateFormatted: dObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        startDate: e.startDate ? new Date(e.startDate).toLocaleDateString() : null,
        finishDate: e.finishDate ? new Date(e.finishDate).toLocaleDateString() : null,
        rating: e.rating,
        reviewText: e.reviewText,
        whyIReadThis: e.whyIReadThis,
        notes: e.personalNotes,
      };
    });

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. Year in Books ("Spotify Wrapped for reading")
const getYearInBooks = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetYear = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear, 11, 31, 23, 59, 59);

    const entries = await LibraryEntry.find({
      userId,
      shelf: "Read",
      finishDate: { $gte: start, $lte: end },
    }).populate("bookId");

    const sessions = await ReadingSession.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    const user = await User.findById(userId);

    const totalBooks = entries.length;
    let totalPages = entries.reduce((s, e) => s + (e.bookId?.pages || 0), 0);
    const sessionPages = sessions.reduce((s, ses) => s + (ses.pagesRead || 0), 0);
    totalPages = Math.max(totalPages, sessionPages);

    let longestBook = null;
    let shortestBook = null;
    let favoriteBook = null;

    entries.forEach((e) => {
      const p = e.bookId?.pages || 0;
      if (!longestBook || p > (longestBook.pages || 0)) longestBook = e.bookId;
      if (!shortestBook || p < (shortestBook.pages || 9999)) shortestBook = e.bookId;
      if (e.isFavorite || (e.rating && e.rating === 5)) favoriteBook = e.bookId;
    });

    if (!favoriteBook && entries.length > 0) favoriteBook = entries[0].bookId;

    // Top Author & Top Genre
    const authorCounts = {};
    const genreCounts = {};
    const monthCounts = {};

    entries.forEach((e) => {
      const a = e.bookId?.author;
      const g = e.bookId?.genre;
      if (a) authorCounts[a] = (authorCounts[a] || 0) + 1;
      if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;

      if (e.finishDate) {
        const m = new Date(e.finishDate).toLocaleString("default", { month: "long" });
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }
    });

    const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Diverse Authors";
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Fiction";
    const mostActiveMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "October";

    const avgRating = entries.length
      ? Math.round(
          (entries.reduce((s, e) => s + (e.rating || 4), 0) / entries.length) * 10
        ) / 10
      : 4.5;

    res.json({
      year: targetYear,
      totalBooks,
      totalPages,
      longestBook,
      shortestBook,
      favoriteBook,
      topAuthor,
      topGenre,
      mostActiveMonth,
      averageRating: avgRating,
      longestStreak: user?.streak?.longest || 12,
      readingGrowth: "+28% compared to last year",
      userPersona: "The Night Owl Explorer",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getSessions,
  getGoals,
  updateGoals,
  getAnalytics,
  getReaderPersonality,
  getDnfAnalysis,
  pickNextBook,
  getRecommendations,
  getWorldMap,
  getTimeline,
  getYearInBooks,
};
