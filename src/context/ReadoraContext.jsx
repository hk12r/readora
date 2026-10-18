import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

const ReadoraContext = createContext(null);

export function ReadoraProvider({ children }) {
  // Auth state
  const [auth, setAuth] = useState(() => {
    const savedToken = localStorage.getItem("readora_token");
    const savedUser = localStorage.getItem("readora_user");
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken || null,
      role: savedUser ? JSON.parse(savedUser).role || "user" : "user",
      loading: false,
    };
  });

  // Auth modal prompt state for logged-out visitors
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    message: "",
    bookToSave: null,
  });

  // Library state
  const [library, setLibrary] = useState({
    shelves: {
      currentlyReading: [],
      wantToRead: [],
      read: [],
      dnf: [],
      favorites: [],
      owned: [],
      upNext: [],
    },
    entries: [],
    customShelves: [],
    tags: [],
    loading: false,
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    list: [],
    unreadCount: 0,
  });

  // Toast alert state
  const [toast, setToast] = useState(null);
  const [socket, setSocket] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Auth actions
  const login = (userData, token) => {
    localStorage.setItem("readora_token", token);
    localStorage.setItem("readora_user", JSON.stringify(userData));
    setAuth({
      user: userData,
      token: token,
      role: userData?.role || "user",
      loading: false,
    });
    showToast(`Welcome back, ${userData.name}! ✦`);

    // If there was a pending book to save from modal prompt, save it now
    if (authModal.bookToSave) {
      setTimeout(() => {
        addToShelf(authModal.bookToSave, "Want to Read", true);
        setAuthModal({ isOpen: false, message: "", bookToSave: null });
      }, 500);
    }
  };

  const logout = () => {
    localStorage.removeItem("readora_token");
    localStorage.removeItem("readora_user");
    setAuth({
      user: null,
      token: null,
      role: "user",
      loading: false,
    });
    setLibrary({
      shelves: {
        currentlyReading: [],
        wantToRead: [],
        read: [],
        dnf: [],
        favorites: [],
        owned: [],
        upNext: [],
      },
      entries: [],
      customShelves: [],
      tags: [],
      loading: false,
    });
    showToast("You have been signed out.");
  };

  const demoLogin = async () => {
    try {
      // First try to login as demo user
      const res = await api.login({
        email: "reader@readora.com",
        password: "password123",
      }).catch(async () => {
        // If demo user does not exist yet, register them
        return await api.register({
          name: "Lyra Valerius",
          email: "reader@readora.com",
          password: "password123",
          role: "user",
        });
      });

      if (res && res.token) {
        login(res.user, res.token);
      }
    } catch (err) {
      // Offline fallback demo user
      const mockUser = {
        _id: "demo_user_1",
        name: "Lyra Valerius",
        email: "reader@readora.com",
        role: "user",
        level: 3,
        xp: 480,
        avatar: "",
        bio: "Night owl explorer navigating speculative and cosy worlds.",
        favoriteQuote: "There is no friend as loyal as a book.",
        favoriteGenres: ["Fantasy", "Literary Fiction", "Mystery"],
        streak: { current: 5, longest: 14 },
        badges: [
          { id: "b1", name: "New Explorer", icon: "✦", description: "Began journey" },
          { id: "b2", name: "First Finish", icon: "🏆", description: "Completed a book" },
        ],
        readingGoal: { annualTarget: 25, monthlyTarget: 2, pagesTarget: 7500 },
      };
      login(mockUser, "demo_jwt_token_local");
    }
  };

  const openAuthModal = ({ message, bookToSave = null }) => {
    setAuthModal({
      isOpen: true,
      message: message || "Sign in to save books to your personal reading library.",
      bookToSave,
    });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, message: "", bookToSave: null });
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      if (res?.user) {
        setAuth((prev) => ({
          ...prev,
          user: res.user,
        }));
        localStorage.setItem("readora_user", JSON.stringify(res.user));
        showToast("Profile updated successfully!");
      }
    } catch (err) {
      // Local update fallback
      setAuth((prev) => {
        const updated = { ...prev.user, ...profileData };
        localStorage.setItem("readora_user", JSON.stringify(updated));
        return { ...prev, user: updated };
      });
      showToast("Profile updated locally.");
    }
  };

  // Fetch Library
  const fetchLibrary = useCallback(async () => {
    if (!auth.token) return;

    setLibrary((prev) => ({ ...prev, loading: true }));
    try {
      const data = await api.getLibrary();
      if (data) {
        setLibrary({
          shelves: data.shelves || {
            currentlyReading: [],
            wantToRead: [],
            read: [],
            dnf: [],
            favorites: [],
            owned: [],
            upNext: [],
          },
          entries: data.entries || [],
          customShelves: data.customShelves || [],
          tags: data.tags || [],
          loading: false,
        });
      }
    } catch (err) {
      setLibrary((prev) => ({ ...prev, loading: false }));
    }
  }, [auth.token]);

  useEffect(() => {
    if (auth.token) {
      fetchLibrary();
    }
  }, [auth.token, fetchLibrary]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!auth.token) return;
    try {
      const res = await api.getNotifications();
      if (res) {
        setNotifications({
          list: res.notifications || [],
          unreadCount: res.unreadCount || 0,
        });
      }
    } catch (err) {
      // silent catch
    }
  }, [auth.token]);

  useEffect(() => {
    if (auth.token) {
      fetchNotifications();
    }
  }, [auth.token, fetchNotifications]);

  // Socket.IO Real-time Lifecycle & Global Listeners
  useEffect(() => {
    if (!auth.token) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    const s = connectSocket(auth.token);
    setSocket(s);

    // 1. Event: notification:new
    const handleNewNotification = (data) => {
      console.log("[Socket.IO Client] Received notification:new", data);
      setNotifications((prev) => ({
        list: [data, ...(prev.list || [])],
        unreadCount: (prev.unreadCount || 0) + 1,
      }));
      showToast(`🔔 ${data.title}: ${data.message}`, "info");
    };

    // 2. Event: follow:new
    const handleNewFollow = (data) => {
      console.log("[Socket.IO Client] Received follow:new", data);
      showToast(`👥 ${data.followerName} started following your reading universe! ✦`, "success");
    };

    // 3. Event: challenge:milestone
    const handleMilestone = (data) => {
      console.log("[Socket.IO Client] Received challenge:milestone", data);
      showToast(`🏆 Milestone Achieved: ${data.name || data.title}! +${data.xpAwarded || 50} XP ✦`, "success");
      if (data.totalXp) {
        setAuth((prev) =>
          prev.user
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  xp: data.totalXp,
                  level: data.userLevel || prev.user.level,
                },
              }
            : prev
        );
      }
    };

    // 4. Event: progress:updated
    const handleProgressUpdated = (data) => {
      console.log("[Socket.IO Client] Received progress:updated", data);
      if (data?.entryId) {
        setLibrary((prev) => ({
          ...prev,
          entries: prev.entries.map((e) =>
            e._id === data.entryId
              ? {
                  ...e,
                  currentPage: data.currentPage !== undefined ? data.currentPage : e.currentPage,
                  percentage: data.percentage !== undefined ? data.percentage : e.percentage,
                  shelf: data.shelf || e.shelf,
                }
              : e
          ),
        }));
      }
    };

    s.on("notification:new", handleNewNotification);
    s.on("follow:new", handleNewFollow);
    s.on("challenge:milestone", handleMilestone);
    s.on("progress:updated", handleProgressUpdated);

    return () => {
      s.off("notification:new", handleNewNotification);
      s.off("follow:new", handleNewFollow);
      s.off("challenge:milestone", handleMilestone);
      s.off("progress:updated", handleProgressUpdated);
    };
  }, [auth.token]);

  // Add Book to Shelf
  const addToShelf = async (bookInput, shelf = "Want to Read", bypassAuthCheck = false) => {
    // Crucial requirement: Show login pop up if not logged in!
    if (!auth.user && !bypassAuthCheck) {
      openAuthModal({
        message: `Sign in to add "${bookInput.title || "this book"}" to your reading list.`,
        bookToSave: bookInput,
      });
      return false;
    }

    try {
      const payload = {
        bookId: bookInput._id || bookInput.id,
        bookData: {
          title: bookInput.title,
          author: bookInput.author,
          isbn: bookInput.isbn || "0000000000000",
          genre: bookInput.genre || "Fiction",
          pages: bookInput.pages || 320,
          rating: bookInput.rating || 4.2,
          cover:
            bookInput.cover ||
            (bookInput.isbn ? `https://covers.openlibrary.org/b/isbn/${bookInput.isbn}-M.jpg` : ""),
          blurb: bookInput.blurb || "A memorable story to treasure in your library.",
          publicationYear: bookInput.publicationYear || 2020,
          country: bookInput.country || "International",
          pace: bookInput.pace || "Medium",
          moods: bookInput.moods || ["Comforting"],
          isFiction: bookInput.isFiction !== undefined ? bookInput.isFiction : true,
        },
        shelf,
      };

      const savedEntry = await api.addToLibrary(payload);
      showToast(`Added to ${shelf}! +25 XP ✦`);
      await fetchLibrary();
      return savedEntry;
    } catch (err) {
      // Local optimistic fallback
      const entryObj = {
        _id: `local_${Date.now()}`,
        isbn: bookInput.isbn,
        bookId: bookInput,
        shelf,
        currentPage: shelf === "Read" ? bookInput.pages || 300 : 0,
        percentage: shelf === "Read" ? 100 : 0,
        isFavorite: false,
        isOwned: false,
        isUpNext: false,
      };

      setLibrary((prev) => {
        const exists = prev.entries.some(
          (e) => e.isbn === bookInput.isbn || e.bookId?.isbn === bookInput.isbn
        );
        if (exists) return prev;

        return {
          ...prev,
          entries: [entryObj, ...prev.entries],
          shelves: {
            ...prev.shelves,
            wantToRead: shelf === "Want to Read" ? [entryObj, ...prev.shelves.wantToRead] : prev.shelves.wantToRead,
            currentlyReading: shelf === "Currently Reading" ? [entryObj, ...prev.shelves.currentlyReading] : prev.shelves.currentlyReading,
            read: shelf === "Read" ? [entryObj, ...prev.shelves.read] : prev.shelves.read,
            dnf: shelf === "DNF" ? [entryObj, ...prev.shelves.dnf] : prev.shelves.dnf,
          },
        };
      });
      showToast(`Added to ${shelf}! ✦`);
      return entryObj;
    }
  };

  // Remove from shelf
  const removeFromShelf = async (bookIdentifier) => {
    // Find entry
    const entry = library.entries.find(
      (e) => e._id === bookIdentifier || e.isbn === bookIdentifier || e.bookId?.isbn === bookIdentifier
    );

    if (entry && entry._id && !entry._id.startsWith("local_")) {
      try {
        await api.removeFromLibrary(entry._id);
      } catch (err) {
        console.warn("Could not delete from server:", err.message);
      }
    }

    setLibrary((prev) => ({
      ...prev,
      entries: prev.entries.filter(
        (e) =>
          e._id !== bookIdentifier &&
          e.isbn !== bookIdentifier &&
          e.bookId?.isbn !== bookIdentifier
      ),
      shelves: {
        currentlyReading: prev.shelves.currentlyReading.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        wantToRead: prev.shelves.wantToRead.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        read: prev.shelves.read.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        dnf: prev.shelves.dnf.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        favorites: prev.shelves.favorites.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        owned: prev.shelves.owned.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
        upNext: prev.shelves.upNext.filter(
          (e) => e._id !== bookIdentifier && e.bookId?.isbn !== bookIdentifier
        ),
      },
    }));

    showToast("Book removed from library.");
  };

  // Update shelf / status
  const updateShelf = async (entryId, newShelf) => {
    try {
      await api.updateLibraryEntry(entryId, { shelf: newShelf });
      showToast(`Shelf moved to: ${newShelf} ✦`);
      await fetchLibrary();
    } catch (err) {
      // Local optimistic update
      setLibrary((prev) => {
        const updatedEntries = prev.entries.map((e) =>
          e._id === entryId ? { ...e, shelf: newShelf } : e
        );
        return {
          ...prev,
          entries: updatedEntries,
        };
      });
      showToast(`Updated shelf to ${newShelf}`);
    }
  };

  // Update progress
  const updateProgress = async (entryId, currentPage, percentage) => {
    try {
      await api.updateLibraryEntry(entryId, { currentPage, percentage });
      showToast("Progress logged! +15 XP ✦");
      await fetchLibrary();
    } catch (err) {
      setLibrary((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e._id === entryId ? { ...e, currentPage, percentage } : e
        ),
      }));
    }
  };

  // Toggle favorite
  const toggleFavorite = async (entryId) => {
    const entry = library.entries.find((e) => e._id === entryId);
    if (!entry) return;
    const newFav = !entry.isFavorite;

    try {
      await api.updateLibraryEntry(entryId, { isFavorite: newFav });
      showToast(newFav ? "Added to Favorites ❤️" : "Removed from Favorites");
      await fetchLibrary();
    } catch (err) {
      setLibrary((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e._id === entryId ? { ...e, isFavorite: newFav } : e
        ),
      }));
    }
  };

  // Toggle owned
  const toggleOwned = async (entryId) => {
    const entry = library.entries.find((e) => e._id === entryId);
    if (!entry) return;
    const newOwned = !entry.isOwned;

    try {
      await api.updateLibraryEntry(entryId, { isOwned: newOwned });
      showToast(newOwned ? "Marked as Owned 📖" : "Unmarked as Owned");
      await fetchLibrary();
    } catch (err) {
      setLibrary((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e._id === entryId ? { ...e, isOwned: newOwned } : e
        ),
      }));
    }
  };

  // Toggle Up Next
  const toggleUpNext = async (entryId) => {
    const entry = library.entries.find((e) => e._id === entryId);
    if (!entry) return;
    const newUpNext = !entry.isUpNext;

    try {
      await api.updateLibraryEntry(entryId, { isUpNext: newUpNext });
      showToast(newUpNext ? "Added to Up Next reading queue ✦" : "Removed from queue");
      await fetchLibrary();
    } catch (err) {
      setLibrary((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e._id === entryId ? { ...e, isUpNext: newUpNext } : e
        ),
      }));
    }
  };

  // Set DNF
  const markAsDnf = async (entryId, dnfReason, dnfPage) => {
    try {
      await api.updateLibraryEntry(entryId, {
        shelf: "DNF",
        dnfReason,
        dnfPage,
      });
      showToast("Book moved to DNF shelf with reason.");
      await fetchLibrary();
    } catch (err) {
      setLibrary((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e._id === entryId ? { ...e, shelf: "DNF", dnfReason, dnfPage } : e
        ),
      }));
    }
  };

  const value = {
    auth,
    login,
    logout,
    demoLogin,
    updateProfile,
    authModal,
    openAuthModal,
    closeAuthModal,
    library,
    fetchLibrary,
    addToShelf,
    removeFromShelf,
    updateShelf,
    updateProgress,
    toggleFavorite,
    toggleOwned,
    toggleUpNext,
    markAsDnf,
    notifications,
    fetchNotifications,
    socket,
    toast,
    showToast,
  };

  return (
    <ReadoraContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 rounded-2xl border border-readora-gold/30 bg-readora-purple px-5 py-3.5 text-sm font-bold text-readora-cream shadow-2xl animate-fade-in backdrop-blur-md">
          <span className="text-readora-gold">✦</span>
          <span>{toast.message}</span>
        </div>
      )}
    </ReadoraContext.Provider>
  );
}

export function useReadora() {
  const context = useContext(ReadoraContext);
  if (!context) {
    throw new Error("useReadora must be used within a ReadoraProvider");
  }
  return context;
}

export default ReadoraContext;