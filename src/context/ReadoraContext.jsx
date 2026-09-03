import React, { createContext, useContext, useState } from "react";

/* =========================================================
   READORA CONTEXT
   Global State Management using Context API
========================================================= */

const ReadoraContext = createContext(null);

/* =========================================================
   READORA PROVIDER
========================================================= */

export function ReadoraProvider({ children }) {

  /* =======================================================
     AUTH STATE
  ======================================================= */

  const [auth, setAuth] = useState({
    user: null,
    token: null,
    role: "user",
    loading: false,
  });

  /* =======================================================
     LIBRARY STATE
  ======================================================= */

  const [library, setLibrary] = useState({
    shelves: {
      currentlyReading: [],
      wantToRead: [],
      finished: [],
    },

    entries: [],

    selectedBook: null,

    loading: false,
  });

  /* =======================================================
     PROGRESS STATE
  ======================================================= */

  const [progress, setProgress] = useState({
    currentBookProgress: 0,
    streaks: 0,
    loading: false,
  });

  /* =======================================================
     NOTIFICATION STATE
  ======================================================= */

  const [notifications, setNotifications] = useState({
    notifications: [],
    unreadCount: 0,
  });

  /* =======================================================
     UI STATE
  ======================================================= */

  const [ui, setUi] = useState({
    theme: "light",
    sidebar: false,
    loading: false,
  });

  /* =======================================================
     AUTH ACTIONS
  ======================================================= */

  const login = (userData, token) => {
    setAuth({
      user: userData,
      token: token,
      role: userData?.role || "user",
      loading: false,
    });
  };

  const logout = () => {
    setAuth({
      user: null,
      token: null,
      role: "user",
      loading: false,
    });
  };

  const updateProfile = (updatedUser) => {
    setAuth((currentAuth) => ({
      ...currentAuth,
      user: {
        ...currentAuth.user,
        ...updatedUser,
      },
    }));
  };

  /* =======================================================
     LIBRARY ACTIONS
  ======================================================= */

  const fetchLibrary = () => {
    setLibrary((currentLibrary) => ({
      ...currentLibrary,
      loading: true,
    }));

    /*
      Backend API will be connected in a later experiment.
      For now, this demonstrates the state-management action.
    */

    setTimeout(() => {
      setLibrary((currentLibrary) => ({
        ...currentLibrary,
        loading: false,
      }));
    }, 500);
  };

  /* =======================================================
     ADD ITEM
     REQUIRED FOR EXPERIMENT 3
  ======================================================= */

  const addToShelf = (book, shelf = "wantToRead") => {
    setLibrary((currentLibrary) => {

      /* Prevent duplicate books */

      const alreadyExists = currentLibrary.entries.some(
        (entry) => entry.isbn === book.isbn
      );

      if (alreadyExists) {
        return currentLibrary;
      }

      const newEntry = {
        ...book,
        shelf,
        addedAt: new Date().toISOString(),
      };

      return {
        ...currentLibrary,

        entries: [
          ...currentLibrary.entries,
          newEntry,
        ],

        shelves: {
          ...currentLibrary.shelves,

          [shelf]: [
            ...currentLibrary.shelves[shelf],
            newEntry,
          ],
        },
      };
    });
  };

  /* =======================================================
     REMOVE ITEM
     REQUIRED FOR EXPERIMENT 3
  ======================================================= */

  const removeFromShelf = (bookIsbn) => {
    setLibrary((currentLibrary) => {

      const bookToRemove = currentLibrary.entries.find(
        (entry) => entry.isbn === bookIsbn
      );

      if (!bookToRemove) {
        return currentLibrary;
      }

      return {
        ...currentLibrary,

        entries: currentLibrary.entries.filter(
          (entry) => entry.isbn !== bookIsbn
        ),

        shelves: {
          ...currentLibrary.shelves,

          [bookToRemove.shelf]:
            currentLibrary.shelves[bookToRemove.shelf].filter(
              (entry) => entry.isbn !== bookIsbn
            ),
        },
      };
    });
  };

  /* =======================================================
     UPDATE SHELF
  ======================================================= */

  const updateShelf = (bookIsbn, newShelf) => {
    setLibrary((currentLibrary) => {

      const book = currentLibrary.entries.find(
        (entry) => entry.isbn === bookIsbn
      );

      if (!book) {
        return currentLibrary;
      }

      const updatedBook = {
        ...book,
        shelf: newShelf,
      };

      return {
        ...currentLibrary,

        entries: currentLibrary.entries.map(
          (entry) =>
            entry.isbn === bookIsbn
              ? updatedBook
              : entry
        ),

        shelves: {
          ...currentLibrary.shelves,

          [book.shelf]:
            currentLibrary.shelves[book.shelf].filter(
              (entry) => entry.isbn !== bookIsbn
            ),

          [newShelf]: [
            ...currentLibrary.shelves[newShelf],
            updatedBook,
          ],
        },
      };
    });
  };

  /* =======================================================
     SELECT BOOK
  ======================================================= */

  const selectBook = (book) => {
    setLibrary((currentLibrary) => ({
      ...currentLibrary,
      selectedBook: book,
    }));
  };

  /* =======================================================
     PROGRESS ACTIONS
  ======================================================= */

  const updateProgress = (percentage) => {
    setProgress((currentProgress) => ({
      ...currentProgress,
      currentBookProgress: percentage,
    }));
  };

  const updateStreak = (streak) => {
    setProgress((currentProgress) => ({
      ...currentProgress,
      streaks: streak,
    }));
  };

  /* =======================================================
     NOTIFICATION ACTIONS
  ======================================================= */

  const addNotification = (notification) => {
    setNotifications((currentNotifications) => ({
      notifications: [
        ...currentNotifications.notifications,
        notification,
      ],

      unreadCount:
        currentNotifications.unreadCount + 1,
    }));
  };

  const markNotificationsRead = () => {
    setNotifications((currentNotifications) => ({
      ...currentNotifications,
      unreadCount: 0,
    }));
  };

  /* =======================================================
     UI ACTIONS
  ======================================================= */

  const toggleSidebar = () => {
    setUi((currentUi) => ({
      ...currentUi,
      sidebar: !currentUi.sidebar,
    }));
  };

  const setTheme = (theme) => {
    setUi((currentUi) => ({
      ...currentUi,
      theme,
    }));
  };

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = {

    /* Authentication */
    auth,
    login,
    logout,
    updateProfile,

    /* Library */
    library,
    fetchLibrary,
    addToShelf,
    updateShelf,
    removeFromShelf,
    selectBook,

    /* Progress */
    progress,
    updateProgress,
    updateStreak,

    /* Notifications */
    notifications,
    addNotification,
    markNotificationsRead,

    /* UI */
    ui,
    toggleSidebar,
    setTheme,
  };

  return (
    <ReadoraContext.Provider value={value}>
      {children}
    </ReadoraContext.Provider>
  );
}

/* =========================================================
   CUSTOM HOOK
   Allows components to access the global Context
========================================================= */

export function useReadora() {

  const context = useContext(ReadoraContext);

  if (!context) {
    throw new Error(
      "useReadora must be used inside ReadoraProvider"
    );
  }

  return context;
}

export default ReadoraContext;
