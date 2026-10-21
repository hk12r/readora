import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";
import { fallbackBooks } from "../data/fallbackBooks";

function Community() {
  const { auth, openAuthModal, showToast, socket, googleLogin } = useReadora();

  const [activeTab, setActiveTab] = useState("feed");
  const [feed, setFeed] = useState([]);
  const [buddyReads, setBuddyReads] = useState([]);
  const [selectedBuddyRead, setSelectedBuddyRead] = useState(null);
  const [bookClubs, setBookClubs] = useState([]);
  const [readers, setReaders] = useState([]);

  // Comment input state for feed
  const [commentInputs, setCommentInputs] = useState({});

  // Buddy Read Chat & Progress
  const [chatMessage, setChatMessage] = useState("");
  const [chatPage, setChatPage] = useState("");
  const [isSpoilerChat, setIsSpoilerChat] = useState(false);
  const [unveiledSpoilers, setUnveiledSpoilers] = useState(new Set());
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Extensive Catalog & Partner Selection (Preloaded with 74+ curated books)
  const [catalogBooks, setCatalogBooks] = useState(fallbackBooks);
  const [bookSearchQuery, setBookSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerInviteType, setPartnerInviteType] = useState("select"); // "select" or "email"
  const [partnerEmailInput, setPartnerEmailInput] = useState("");
  const [bookFilterGenre, setBookFilterGenre] = useState("all");

  // Real-Time Email Synchronization Modal & History
  const [emailSyncModalOpen, setEmailSyncModalOpen] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  // New Buddy Read Modal
  const [createBuddyModalOpen, setCreateBuddyModalOpen] = useState(false);
  const [newBuddyData, setNewBuddyData] = useState({
    title: "",
    bookId: "",
    partnerId: "",
  });

  // New Book Club Modal
  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);
  const [newClubData, setNewClubData] = useState({
    name: "",
    description: "",
    genre: "Fantasy",
  });

  // New Review Modal
  const [createReviewModalOpen, setCreateReviewModalOpen] = useState(false);
  const [newReviewData, setNewReviewData] = useState({
    bookId: "",
    rating: 5,
    reviewText: "",
    hasSpoilers: false,
    chapterOrPageNote: "",
  });

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClubData.name.trim()) {
      showToast("Please provide a name for the book club", "error");
      return;
    }
    try {
      const created = await api.createBookClub(newClubData);
      showToast(`Book club "${created.name}" created successfully! ✦`);
      setCreateClubModalOpen(false);
      setNewClubData({ name: "", description: "", genre: "Fantasy" });
      setBookClubs((prev) => [created, ...prev]);
      setActiveTab("clubs");
      await loadCommunityData();
    } catch (err) {
      showToast("Could not create book club: " + err.message, "error");
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!newReviewData.bookId) {
      showToast("Please select a book to review", "error");
      return;
    }
    if (!newReviewData.reviewText.trim()) {
      showToast("Please enter your review or discussion thoughts", "error");
      return;
    }
    try {
      const created = await api.createReview(newReviewData);
      showToast("Review published to Community Feed! ✦");
      setCreateReviewModalOpen(false);
      setNewReviewData({
        bookId: "",
        rating: 5,
        reviewText: "",
        hasSpoilers: false,
        chapterOrPageNote: "",
      });
      setFeed((prev) => [created, ...prev]);
      setActiveTab("feed");
      await loadCommunityData();
    } catch (err) {
      showToast("Could not publish review: " + err.message, "error");
    }
  };

  // Load feed, buddy reads, clubs, readers, and full book catalog
  const loadCommunityData = async () => {
    try {
      const [fData, bData, cData, rData, booksData] = await Promise.allSettled([
        api.getActivityFeed(),
        auth.user ? api.getBuddyReads() : Promise.resolve([]),
        api.getBookClubs(),
        api.getCommunityReaders(),
        api.getBooks({ limit: 100 }),
      ]);

      if (fData.status === "fulfilled" && fData.value) setFeed(fData.value);
      if (bData.status === "fulfilled" && bData.value) setBuddyReads(bData.value);
      if (cData.status === "fulfilled" && cData.value) setBookClubs(cData.value);
      if (rData.status === "fulfilled" && rData.value) setReaders(rData.value);
      if (booksData.status === "fulfilled" && booksData.value) {
        const list = booksData.value.books || (Array.isArray(booksData.value) ? booksData.value : []);
        if (list.length > 0) {
          setCatalogBooks(list);
        }
      }
    } catch (err) {
      console.warn("Could not load community data:", err.message);
    }
  };

  const loadEmailHistory = async () => {
    if (!auth.user) return;
    try {
      const res = await api.getEmailHistory();
      if (res?.dispatches) setEmailHistory(res.dispatches);
    } catch (err) {
      console.warn("Could not load email dispatches:", err.message);
    }
  };

  const handleSendTestEmail = async () => {
    if (!auth.user) return;
    setIsSendingTestEmail(true);
    try {
      const res = await api.sendTestEmail();
      showToast(`⚡ Real-time update email sent to ${res.registeredEmail}!`, "success");
      await loadEmailHistory();
    } catch (err) {
      showToast("Could not send test email: " + err.message, "error");
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
    if (auth.user) loadEmailHistory();
  }, [auth.user]);

  // Join Buddy Read room on select & attach real-time listeners
  useEffect(() => {
    if (!selectedBuddyRead || !socket) return;

    // Join authorized room
    socket.emit("buddyread:join", { buddyReadId: selectedBuddyRead._id }, (res) => {
      if (res?.success) {
        console.log("[Community] Successfully joined buddy room:", res.room);
      } else if (res?.error) {
        console.warn("[Community] Could not join buddy room:", res.error);
      }
    });

    // 1. Listen for real-time messages
    const onBuddyMessage = (data) => {
      if (data?.buddyReadId === selectedBuddyRead._id && data.message) {
        setSelectedBuddyRead((prev) => {
          if (!prev || prev._id !== data.buddyReadId) return prev;
          const exists = (prev.messages || []).some(
            (m) => m._id && data.message._id && m._id === data.message._id
          );
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        });
      }
    };

    // 2. Listen for real-time progress updates
    const onBuddyProgress = (data) => {
      if (data?.buddyReadId === selectedBuddyRead._id) {
        setSelectedBuddyRead((prev) => {
          if (!prev || prev._id !== data.buddyReadId) return prev;
          const updatedParticipants = (prev.participants || []).map((p) => {
            const pId = p.userId?._id ? p.userId._id.toString() : p.userId?.toString();
            if (pId === data.userId) {
              return {
                ...p,
                currentPage: data.currentPage,
                percentage: data.percentage,
              };
            }
            return p;
          });
          return {
            ...prev,
            participants: updatedParticipants,
            milestones: data.milestones || prev.milestones,
          };
        });
      }
    };

    // 3. Listen for challenge:milestone in room
    const onBuddyMilestone = (data) => {
      if (data?.buddyReadId === selectedBuddyRead._id) {
        showToast(`🎉 Milestone reached by ${data.userName}: "${data.name}" at page ${data.targetPage}!`, "success");
      }
    };

    socket.on("buddyread:message", onBuddyMessage);
    socket.on("buddyread:progress", onBuddyProgress);
    socket.on("challenge:milestone", onBuddyMilestone);

    return () => {
      socket.emit("buddyread:leave", { buddyReadId: selectedBuddyRead._id });
      socket.off("buddyread:message", onBuddyMessage);
      socket.off("buddyread:progress", onBuddyProgress);
      socket.off("challenge:milestone", onBuddyMilestone);
    };
  }, [selectedBuddyRead, socket, showToast]);

  // Like review in activity feed
  const handleLikeReview = async (reviewId) => {
    if (!auth.user) {
      openAuthModal({ message: "Sign in to like reviews and interact with readers." });
      return;
    }
    try {
      const res = await api.toggleLikeReview(reviewId);
      setFeed((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                likes: res.liked
                  ? [...(r.likes || []), auth.user._id]
                  : (r.likes || []).filter((id) => id !== auth.user._id),
              }
            : r
        )
      );
    } catch (err) {
      showToast("Could not like review", "error");
    }
  };

  // Add comment to review in feed
  const handleAddComment = async (reviewId) => {
    if (!auth.user) {
      openAuthModal({ message: "Sign in to join the discussion." });
      return;
    }
    const text = commentInputs[reviewId];
    if (!text || !text.trim()) return;

    try {
      const updatedComments = await api.commentOnReview(reviewId, text);
      setFeed((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, comments: updatedComments } : r))
      );
      setCommentInputs((prev) => ({ ...prev, [reviewId]: "" }));
      showToast("Comment posted! ✦");
    } catch (err) {
      showToast("Could not post comment", "error");
    }
  };

  // Follow reader
  const handleFollow = async (userId) => {
    if (!auth.user) {
      openAuthModal({ message: "Sign in to follow other readers." });
      return;
    }
    try {
      const res = await api.toggleFollowUser(userId);
      showToast(res.isFollowing ? "Followed reader! ✦" : "Unfollowed reader.");
      await loadCommunityData();
    } catch (err) {
      showToast("Could not follow user", "error");
    }
  };

  // Post Buddy Message via Socket.IO with REST fallback
  const handleSendBuddyMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedBuddyRead) return;

    const payload = {
      buddyReadId: selectedBuddyRead._id,
      text: chatMessage.trim(),
      page: parseInt(chatPage) || 0,
      isSpoiler: isSpoilerChat,
    };

    if (socket && socket.connected) {
      socket.emit("buddyread:message", payload, (res) => {
        if (res?.success) {
          if (res?.message) {
            setSelectedBuddyRead((prev) => {
              if (!prev) return prev;
              const exists = (prev.messages || []).some(
                (m) => m._id && res.message._id && m._id === res.message._id
              );
              if (exists) return prev;
              return {
                ...prev,
                messages: [...(prev.messages || []), res.message],
              };
            });
          }
          setChatMessage("");
          setChatPage("");
          setIsSpoilerChat(false);
        } else {
          // If socket fails, fallback to REST
          fallbackRestMessage(payload);
        }
      });
    } else {
      fallbackRestMessage(payload);
    }
  };

  const fallbackRestMessage = async (payload) => {
    try {
      const msg = await api.postBuddyMessage(payload.buddyReadId, {
        text: payload.text,
        page: payload.page,
        isSpoiler: payload.isSpoiler,
      });

      if (msg && typeof msg === "object" && !Array.isArray(msg) && (msg.text || msg.isSpoiler !== undefined)) {
        const formattedMsg = {
          ...msg,
          createdAt: msg.createdAt || new Date().toISOString(),
          userName: msg.userName || auth.user?.name || "You",
        };
        setSelectedBuddyRead((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), formattedMsg],
        }));
      }

      setChatMessage("");
      setChatPage("");
      setIsSpoilerChat(false);
    } catch (err) {
      showToast("Could not send message", "error");
    }
  };

  // Update Buddy Progress via Socket.IO with REST fallback
  const handleUpdateBuddyProgress = async (buddyId, page) => {
    const pageNum = parseInt(page) || 0;

    if (socket && socket.connected) {
      socket.emit("buddyread:progress", {
        buddyReadId: buddyId,
        currentPage: pageNum,
      });
    }

    try {
      const updated = await api.updateBuddyProgress(buddyId, pageNum);
      setSelectedBuddyRead(updated);
      showToast("Buddy read progress updated! ✦");
    } catch (err) {
      showToast("Could not update progress", "error");
    }
  };

  // Vote for Club Book
  const handleVoteClubBook = async (clubId, bookId) => {
    if (!auth.user) {
      openAuthModal({ message: "Sign in to vote for book club reads." });
      return;
    }
    try {
      await api.voteForClubBook(clubId, bookId);
      showToast("Vote recorded! ✦");
      await loadCommunityData();
    } catch (err) {
      showToast("Could not vote", "error");
    }
  };

  // Filter catalog books for Extensive Library Selector
  const filteredBooks = catalogBooks.filter((b) => {
    const matchesSearch =
      !bookSearchQuery.trim() ||
      b.title?.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.author?.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.genre?.toLowerCase().includes(bookSearchQuery.toLowerCase());

    const matchesGenre =
      bookFilterGenre === "all" ||
      (b.genre && b.genre.toLowerCase() === bookFilterGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  return (
    <main className="min-h-screen bg-readora-cream py-10">
      <div className="page-container">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-readora-gold/30 bg-readora-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-readora-purple">
              <span>👥</span> Community & Social Reading
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-readora-purple sm:text-5xl">
              Literary Fellowship
            </h1>
            <p className="mt-2 text-sm text-readora-brown/75 max-w-xl">
              Share your reading journey with fellow book lovers, start synchronous Buddy Reads with
              built-in spoiler protection, and join Book Clubs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {auth.user && (
              <button
                type="button"
                onClick={() => {
                  loadEmailHistory();
                  setEmailSyncModalOpen(true);
                }}
                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 transition flex items-center gap-1.5"
                title="View real-time email dispatch status"
              >
                <span>📧</span> Live Email Sync
              </button>
            )}
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to start a buddy read." });
                  return;
                }
                setSelectedPartner(null);
                setSelectedBook(null);
                setBookSearchQuery("");
                setCreateBuddyModalOpen(true);
              }}
              className="rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
            >
              + New Buddy Read ✦
            </button>
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to write and publish book reviews." });
                  return;
                }
                setCreateReviewModalOpen(true);
              }}
              className="rounded-full bg-readora-gold px-4 py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight transition"
            >
              + Write Review ✦
            </button>
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to create a book club." });
                  return;
                }
                setCreateClubModalOpen(true);
              }}
              className="rounded-full border border-readora-purple/20 bg-white/70 px-4 py-2.5 text-xs font-bold text-readora-purple hover:bg-white transition"
            >
              + Create Club
            </button>
          </div>
        </div>

        {/* TABS (FOR LOGGED-IN USERS) OR FELLOWSHIP GATEWAY (FOR VISITORS) */}
        {!auth.user ? (
          <div className="mt-8 space-y-10 animate-fade-in">
            {/* HERO BANNER FOR LOGGED OUT VISITORS */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-readora-gold/40 bg-gradient-to-br from-readora-purple via-readora-plum to-readora-purple p-8 text-readora-cream shadow-2xl sm:p-12">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-readora-gold/20 px-3.5 py-1 text-xs font-bold text-readora-gold">
                  ✦ Exclusive Literary Fellowship ✦
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Read Together in Real Time
                </h2>
                <p className="mt-3 text-sm text-readora-cream/80 leading-relaxed sm:text-base">
                  Connect with kindred book lovers, start synchronous Buddy Reads with 4-checkpoint milestones, chat safely behind dynamic spoiler veils, and receive instant updates directly to your registered email.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => openAuthModal({ message: "Sign in with OTP to access Buddy Reads and Literary Fellowship." })}
                    className="rounded-full bg-readora-gold px-7 py-3 text-xs font-bold text-readora-purple shadow-gold hover:bg-readora-goldLight transition"
                  >
                    Join with Email OTP ⚡
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const mockEmail = `reader_${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;
                        await googleLogin({
                          email: mockEmail,
                          name: "Google Reader",
                          avatar: "https://lh3.googleusercontent.com/a/default-user",
                          googleId: `google_${Date.now()}`,
                        });
                        showToast("Signed in with Google! Welcome to the Fellowship ✦");
                      } catch (err) {
                        showToast("Google sign in failed: " + err.message, "error");
                      }
                    }}
                    className="rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-6 py-3 text-xs font-bold text-white hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <span>G</span> Continue with Google
                  </button>
                </div>
              </div>
            </div>

            {/* 3 FELLOWSHIP PILLARS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-readora-purple/10 text-2xl text-readora-purple mb-4">
                  👥
                </div>
                <h3 className="font-display text-lg font-bold text-readora-purple">
                  Synchronous Buddy Reads
                </h3>
                <p className="mt-2 text-xs text-readora-brown/75 leading-relaxed">
                  Invite a reading companion or choose from the community readers. Track percentage sync, page progression, and 25%, 50%, 75%, and 100% reading checkpoints.
                </p>
              </div>

              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-readora-gold/20 text-2xl text-readora-gold mb-4">
                  🛡️
                </div>
                <h3 className="font-display text-lg font-bold text-readora-purple">
                  Dynamic Spoiler Shield
                </h3>
                <p className="mt-2 text-xs text-readora-brown/75 leading-relaxed">
                  Never spoil a twist again! Chapter discussions and reactions are automatically veiled behind spoiler shields until your reading progress reaches that page.
                </p>
              </div>

              <div className="rounded-3xl border border-readora-purple/10 bg-white/85 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700 mb-4">
                  ⚡
                </div>
                <h3 className="font-display text-lg font-bold text-readora-purple">
                  WebSockets & Email Sync
                </h3>
                <p className="mt-2 text-xs text-readora-brown/75 leading-relaxed">
                  Live updates are pushed instantly via Socket.IO and synchronized directly to your registered email address so you never miss a friend's comment or milestone.
                </p>
              </div>
            </div>

            {/* ACTIVE BOOK CLUBS PREVIEW */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-readora-purple">
                    Featured Literary Book Clubs
                  </h3>
                  <p className="text-xs text-readora-brown/70">
                    Join monthly reading circles across genres (Preview Mode)
                  </p>
                </div>
                <button
                  onClick={() => openAuthModal({ message: "Sign in to join Book Clubs." })}
                  className="text-xs font-bold text-readora-purple underline"
                >
                  Sign in to Join →
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {bookClubs.slice(0, 3).map((club) => (
                  <div
                    key={club._id}
                    className="rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-readora-lavenderLight/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-readora-purple">
                        {club.genre}
                      </span>
                      <span className="text-xs text-readora-brown/60">
                        {club.members?.length || 1} members
                      </span>
                    </div>

                    <h4 className="mt-2 font-display text-lg font-bold text-readora-purple">
                      {club.name}
                    </h4>
                    <p className="mt-1 text-xs text-readora-brown/75 line-clamp-2">{club.description}</p>

                    <div className="mt-4 pt-3 border-t border-readora-purple/10 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-readora-brown/60">🔒 Members Only</span>
                      <button
                        onClick={() => openAuthModal({ message: `Sign in to participate in ${club.name}.` })}
                        className="rounded-full bg-readora-purple/10 px-3 py-1 text-xs font-bold text-readora-purple hover:bg-readora-purple hover:text-white transition"
                      >
                        Join Club
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TABS */}
            <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-readora-purple/10">
              {[
                { id: "feed", label: "Community Feed 💬" },
                { id: "buddyReads", label: "Buddy Reads 👥" },
                { id: "clubs", label: "Book Clubs 🏛️" },
                { id: "readers", label: "Discover Readers 🔍" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold transition
                    ${
                      activeTab === tab.id
                        ? "bg-readora-purple text-readora-cream shadow-sm"
                        : "bg-white/70 text-readora-brown hover:bg-white"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

        {/* TAB 1: COMMUNITY ACTIVITY FEED */}
        {activeTab === "feed" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            {/* FEED ITEMS */}
            <div className="space-y-6">
              {/* WRITE REVIEW PROMPT CARD */}
              <div className="rounded-3xl border border-readora-purple/15 bg-white/90 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-readora-purple/10 text-xl text-readora-purple font-bold">
                    ✍️
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-readora-purple">
                      Have thoughts on a recently read book?
                    </h3>
                    <p className="text-xs text-readora-brown/70">
                      Share your rating, chapter analysis, favorite quotes, or spoiler-veiled insights with fellow readers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateReviewModalOpen(true)}
                  className="rounded-full bg-readora-gold px-5 py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight transition whitespace-nowrap shrink-0"
                >
                  + Write Review ✦
                </button>
              </div>
              {feed.length > 0 ? (
                feed.map((review) => {
                  const isLiked = (review.likes || []).includes(auth.user?._id);
                  return (
                    <article
                      key={review._id}
                      className="rounded-3xl border border-readora-purple/10 bg-white/85 p-6 shadow-sm transition hover:shadow-magical"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-readora-purple text-xs font-bold text-readora-cream">
                            {review.userId?.name?.charAt(0).toUpperCase() || "R"}
                          </div>
                          <div>
                            <p className="font-display text-sm font-bold text-readora-purple">
                              {review.userId?.name || "A Reader"}
                            </p>
                            <p className="text-[10px] text-readora-brown/60">
                              Rated ★ {review.rating} •{" "}
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {review.hasSpoilers && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            ⚠️ Spoiler Tagged
                          </span>
                        )}
                      </div>

                      {/* BOOK REFERENCE CARD */}
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-readora-cream/40 p-3 border border-readora-purple/5">
                        <img
                          src={review.bookId?.cover}
                          alt={review.bookId?.title}
                          className="h-14 w-10 rounded object-cover shadow-sm"
                        />
                        <div>
                          <h4 className="font-display text-sm font-bold text-readora-purple">
                            {review.bookId?.title}
                          </h4>
                          <p className="text-xs text-readora-brown/70">{review.bookId?.author}</p>
                        </div>
                      </div>

                      {/* REVIEW TEXT */}
                      <p className="mt-3.5 text-xs leading-relaxed text-readora-brown/90">
                        {review.reviewText}
                      </p>

                      {/* QUOTES */}
                      {review.favoriteQuotes?.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-l-2 border-readora-gold pl-3">
                          {review.favoriteQuotes.map((q, idx) => (
                            <p key={idx} className="text-xs italic text-readora-purple">
                              "{q.text}" {q.page && `(p. ${q.page})`}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* LIKE & COMMENT ACTION ROW */}
                      <div className="mt-4 flex items-center gap-4 border-t border-readora-purple/10 pt-3 text-xs font-semibold text-readora-brown">
                        <button
                          onClick={() => handleLikeReview(review._id)}
                          className={`flex items-center gap-1.5 transition ${
                            isLiked ? "text-red-500 font-bold" : "hover:text-readora-purple"
                          }`}
                        >
                          <span>{isLiked ? "❤️" : "🤍"}</span>
                          <span>{(review.likes || []).length} Likes</span>
                        </button>

                        <span className="text-readora-brown/40">•</span>

                        <span>{(review.comments || []).length} Comments</span>
                      </div>

                      {/* COMMENTS LIST */}
                      {(review.comments || []).length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-readora-purple/5 pt-2">
                          {review.comments.map((c) => (
                            <div key={c._id} className="rounded-xl bg-readora-cream/30 p-2 text-xs">
                              <span className="font-bold text-readora-purple">{c.userName}: </span>
                              <span className="text-readora-brown/85">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADD COMMENT INPUT */}
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[review._id] || ""}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [review._id]: e.target.value })
                          }
                          placeholder="Write a comment..."
                          className="flex-1 rounded-full border border-readora-purple/15 bg-white px-3 py-1.5 text-xs text-readora-brown outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(review._id)}
                          className="rounded-full bg-readora-gold px-4 py-1.5 text-xs font-bold text-readora-purple hover:bg-readora-goldLight"
                        >
                          Reply
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-readora-purple/20 bg-white/60 p-12 text-center">
                  <span className="text-4xl text-readora-gold">💬</span>
                  <p className="mt-2 text-sm text-readora-brown/70">
                    No community activity yet. Be the first to review a book!
                  </p>
                </div>
              )}
            </div>

            {/* SIDEBAR: COMMUNITY LEADERBOARD */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm">
                <h3 className="font-display text-base font-bold text-readora-purple">
                  Top Readers This Month
                </h3>
                <div className="mt-4 space-y-3">
                  {readers.slice(0, 5).map((reader, idx) => (
                    <div key={reader._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-readora-gold">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-readora-purple">{reader.name}</p>
                          <p className="text-[10px] text-readora-brown/60">
                            Level {reader.level || 1} • {reader.streak?.current || 1}-day streak
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollow(reader._id)}
                        className="rounded-full border border-readora-purple/20 px-2.5 py-1 text-[11px] font-bold text-readora-purple hover:bg-readora-lavenderLight"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUDDY READS WITH SPOILER PROTECTION & REAL-TIME CHAT */}
        {activeTab === "buddyReads" && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {selectedBuddyRead ? (
              <div className="rounded-3xl border border-readora-purple/10 bg-white/90 p-7 shadow-sm">
                {/* PROMINENT NAVIGATION & SWITCHER BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-gradient-to-r from-readora-lavenderLight/50 to-readora-gold/15 px-4 py-3 rounded-2xl border border-readora-purple/15">
                  <button
                    onClick={() => setSelectedBuddyRead(null)}
                    className="flex items-center gap-2 text-xs font-bold text-readora-purple hover:text-readora-plum transition w-fit"
                  >
                    <span className="text-sm">←</span>
                    <span>Back to All Buddy Reads ({buddyReads.length})</span>
                  </button>

                  {buddyReads.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] font-bold text-readora-purple uppercase">Switch:</span>
                      <select
                        value={selectedBuddyRead._id}
                        onChange={(e) => {
                          const found = buddyReads.find((b) => b._id === e.target.value);
                          if (found) setSelectedBuddyRead(found);
                        }}
                        className="rounded-xl border border-readora-purple/20 bg-white px-3 py-1.5 text-xs font-bold text-readora-purple shadow-2xs outline-none"
                      >
                        {buddyReads.map((b) => (
                          <option key={b._id} value={b._id}>
                            📖 {b.title || b.bookId?.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div id="buddy-read-header-card" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-readora-purple/10 pb-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedBuddyRead.bookId?.cover}
                      alt={selectedBuddyRead.bookId?.title}
                      className="h-20 w-14 rounded-lg object-cover shadow"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-readora-gold/20 px-2 py-0.5 text-[10px] font-bold text-readora-purple">
                          Active Buddy Read
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Socket.IO Live Sync
                        </span>
                        {/* Live Email Notification Status Button */}
                        <button
                          type="button"
                          onClick={() => {
                            loadEmailHistory();
                            setEmailSyncModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                          title="View real-time email dispatch status"
                        >
                          <span>📧</span> Email Sync: {auth.user?.email || "Registered Email"}
                        </button>
                      </div>
                      <h2 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                        {selectedBuddyRead.title}
                      </h2>
                      <p className="text-xs text-readora-brown/70">
                        {selectedBuddyRead.bookId?.title} by {selectedBuddyRead.bookId?.author} • {selectedBuddyRead.bookId?.pages || 300} pages
                      </p>
                    </div>
                  </div>

                  {/* QUICK PROGRESS UPDATE */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="My Page"
                      id="buddyPageInput"
                      className="w-20 rounded-xl border border-readora-purple/20 bg-white px-2 py-1.5 text-xs outline-none"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("buddyPageInput");
                        if (input && input.value) {
                          handleUpdateBuddyProgress(selectedBuddyRead._id, input.value);
                          input.value = "";
                        }
                      }}
                      className="rounded-xl bg-readora-purple px-3 py-1.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
                    >
                      Sync Page
                    </button>
                  </div>
                </div>

                {/* SYNCHRONIZED PARTICIPANTS PROGRESS */}
                <div id="buddy-participants-progress" className="mt-6 rounded-2xl bg-white p-5 border border-readora-purple/10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                      Participants Progress
                    </h4>
                    <span className="text-[11px] text-readora-brown/60">
                      Synchronized in real-time via WebSockets & Email
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {(selectedBuddyRead.participants || []).map((p) => {
                      const totalP = selectedBuddyRead.bookId?.pages || 300;
                      const isMe = (p.userId?._id || p.userId)?.toString() === auth.user?._id?.toString();
                      return (
                        <div key={p.userId?._id || p._id} className="rounded-xl bg-readora-cream/30 p-2.5">
                          <div className="flex justify-between text-xs font-semibold text-readora-purple">
                            <span className="flex items-center gap-1.5">
                              <span>👤</span> {p.userId?.name || "Buddy Reader"} {isMe && "(You)"}
                              {p.userId?.email && (
                                <span className="text-[10px] text-readora-brown/60 font-normal">
                                  ({p.userId.email})
                                </span>
                              )}
                            </span>
                            <span>
                              Page {p.currentPage} / {totalP} ({p.percentage}%)
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-readora-gold transition-all duration-500"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* READING CHECKPOINTS / MILESTONES */}
                  {selectedBuddyRead.milestones && selectedBuddyRead.milestones.length > 0 && (
                    <div className="mt-4 border-t border-readora-purple/10 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                        Reading Checkpoints & Milestones:
                      </span>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {selectedBuddyRead.milestones.map((m) => {
                          const isDone = m.completedBy?.some(
                            (id) => (id._id || id).toString() === auth.user?._id?.toString()
                          );
                          return (
                            <div
                              key={m._id || m.name}
                              className={`rounded-xl p-2.5 text-xs border transition ${
                                isDone
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs"
                                  : "bg-white border-readora-purple/10 text-readora-brown/80"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{isDone ? "🏆 Unlocked" : "🎯 Target"}</span>
                                <span className="font-mono text-[10px]">p.{m.targetPage}</span>
                              </div>
                              <p className="mt-1 font-semibold truncate text-[11px]">{m.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* SPOILER-GUARDED CHAT STREAM & PARTNER MESSAGING */}
                <div id="buddy-chat-section" className="mt-8 border-t border-readora-purple/10 pt-6 rounded-2xl bg-white p-5 border shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                        Buddy Discussion & Partner Chat (With Spoiler Shield 🛡️)
                      </h4>
                      <p className="text-[11px] text-readora-brown/70">
                        Chat live with your buddy read partner. Messages update in real-time and send notifications to registered emails.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          loadEmailHistory();
                          setEmailSyncModalOpen(true);
                        }}
                        className="rounded-full bg-readora-purple/10 px-3 py-1 text-[11px] font-bold text-readora-purple hover:bg-readora-purple hover:text-white transition"
                      >
                        📧 Email Alerts Log
                      </button>
                    </div>
                  </div>

                  {/* QUICK REACTION BUTTONS FOR PARTNERS */}
                  <div className="mb-3 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold uppercase text-readora-brown/60">Quick Partner Notes:</span>
                    {[
                      { text: "Just finished this chapter! What an unexpected turn! 😱", label: "😱 Plot twist!" },
                      { text: "The writing and character development in this section is incredible! 👏", label: "👏 Loving this" },
                      { text: "Reading through this section now, catching up! 🚀", label: "🚀 Reading now" },
                      { text: "Taking a quick break, continuing tonight! ☕", label: "☕ Break time" },
                    ].map((qr, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setChatMessage(qr.text)}
                        className="rounded-full bg-readora-cream border border-readora-purple/15 px-2.5 py-1 text-[11px] font-semibold text-readora-purple hover:bg-readora-gold hover:text-readora-purple transition shadow-xs"
                      >
                        {qr.label}
                      </button>
                    ))}
                  </div>

                  {/* CHAT MESSAGES STREAM */}
                  <div className="max-h-80 space-y-3 overflow-y-auto p-3.5 rounded-2xl bg-readora-cream/30 border border-readora-purple/5">
                    {(selectedBuddyRead.messages || [])
                      .filter((m) => m && typeof m === "object" && !Array.isArray(m) && (m.text || m.isSpoiler))
                      .map((m, idx) => {
                        const myParticipant = selectedBuddyRead.participants?.find(
                          (p) => (p.userId?._id || p.userId)?.toString() === auth.user?._id?.toString()
                        );
                        const myCurrentPage = myParticipant?.currentPage || 0;
                        const isVeiled =
                          m.isSpoiler &&
                          !unveiledSpoilers.has(m._id || idx) &&
                          m.page > myCurrentPage;

                        const isMe = (m.userId?._id || m.userId)?.toString() === auth.user?._id?.toString();

                        const rawDate = m.createdAt || m.timestamp || m.date;
                        const parsedDate = rawDate ? new Date(rawDate) : new Date();
                        const timeString = isNaN(parsedDate.getTime())
                          ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                        return (
                          <div
                            key={m._id || idx}
                            className={`rounded-xl p-3 shadow-xs text-xs border ${
                              isMe ? "bg-white border-readora-gold/30" : "bg-white border-readora-purple/10"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-readora-brown/60">
                              <span className="font-bold text-readora-purple flex items-center gap-1">
                                <span>👤</span> {m.userName || (isMe ? "You" : "Reader")} {isMe && "(You)"}
                              </span>
                              <span>
                                {m.page > 0 && `Page ${m.page} • `}
                                {timeString}
                              </span>
                            </div>

                            {/* SPOILER GUARD */}
                            {isVeiled ? (
                              <div
                                onClick={() =>
                                  setUnveiledSpoilers(new Set([...unveiledSpoilers, m._id || idx]))
                                }
                                className="mt-2 cursor-pointer rounded-lg bg-amber-50 border border-amber-300 p-2 text-center text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                              >
                                ⚠️ Spoiler Shield (Referencing Page {m.page}) — Click to Reveal
                              </div>
                            ) : (
                              <p className="mt-1 text-readora-brown/90 leading-relaxed font-normal">{m.text}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* SEND MESSAGE INPUT */}
                  <form onSubmit={handleSendBuddyMessage} className="mt-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Discuss chapter thoughts, questions, or reactions with your buddy..."
                        className="flex-1 rounded-full border border-readora-purple/15 bg-white px-4 py-2.5 text-xs text-readora-brown outline-none focus:border-readora-purple"
                      />
                      <input
                        type="number"
                        value={chatPage}
                        onChange={(e) => setChatPage(e.target.value)}
                        placeholder="Page"
                        className="w-16 rounded-full border border-readora-purple/15 bg-white px-3 py-2.5 text-xs text-readora-brown outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-readora-gold px-5 py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight transition"
                      >
                        Send 💬
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-readora-brown/70">
                      <label className="flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSpoilerChat}
                          onChange={(e) => setIsSpoilerChat(e.target.checked)}
                          className="rounded text-readora-purple"
                        />
                        <span>Mark as spoiler (veiled for readers behind this page)</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ⚡ Real-time updates delivered to partner via WebSockets & Email
                      </span>
                    </div>
                  </form>
                </div>
              </div>
            ) : buddyReads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-readora-purple/20 bg-white/75 p-12 text-center">
                <span className="text-4xl text-readora-gold">👥</span>
                <h3 className="mt-3 font-display text-xl font-bold text-readora-purple">
                  No Active Buddy Reads Yet
                </h3>
                <p className="mt-1 text-xs text-readora-brown/70 max-w-md mx-auto">
                  Start reading together with a companion or community member! Set synchronized reading checkpoints and discuss chapters behind spoiler shields.
                </p>
                <button
                  onClick={() => {
                    setSelectedPartner(null);
                    setSelectedBook(null);
                    setBookSearchQuery("");
                    setCreateBuddyModalOpen(true);
                  }}
                  className="mt-5 rounded-full bg-readora-purple px-6 py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
                >
                  + Start a Buddy Read Now ✦
                </button>
              </div>
            ) : (
              /* LIST OF BUDDY READS */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-readora-purple">
                    Your Active Buddy Reads ({buddyReads.length})
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedPartner(null);
                      setSelectedBook(null);
                      setBookSearchQuery("");
                      setCreateBuddyModalOpen(true);
                    }}
                    className="text-xs font-bold text-readora-purple hover:underline"
                  >
                    + Start Another Buddy Read
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {buddyReads.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => setSelectedBuddyRead(b)}
                      className="cursor-pointer rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-readora-gold hover:shadow-magical"
                    >
                      <div className="flex gap-4">
                        <img
                          src={b.bookId?.cover}
                          alt={b.bookId?.title}
                          className="h-20 w-14 rounded-lg object-cover shadow"
                        />
                        <div>
                          <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-readora-purple">
                            {b.status || "In Progress"}
                          </span>
                          <h3 className="mt-1 font-display text-base font-bold text-readora-purple">
                            {b.title}
                          </h3>
                          <p className="text-xs text-readora-brown/70">{b.bookId?.title}</p>
                          <p className="mt-1 text-[10px] text-readora-brown/60">
                            Partner: {b.participants?.find((p) => (p.userId?._id || p.userId)?.toString() !== auth.user?._id?.toString())?.userId?.name || "Reading Companion"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-readora-purple/10 pt-3 flex justify-between text-xs text-readora-brown/70">
                        <span>{b.participants?.length || 1} Readers</span>
                        <span className="font-bold text-readora-purple flex items-center gap-1">
                          Open Chat & Progress →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BOOK CLUBS */}
        {activeTab === "clubs" && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {bookClubs.map((club) => (
              <div
                key={club._id}
                className="rounded-3xl border border-readora-purple/10 bg-white/80 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-readora-lavenderLight/40 px-2.5 py-0.5 text-[10px] font-bold uppercase text-readora-purple">
                    {club.genre}
                  </span>
                  <span className="text-xs text-readora-brown/60">
                    {club.members?.length || 1} members
                  </span>
                </div>

                <h3 className="mt-2 font-display text-xl font-bold text-readora-purple">
                  {club.name}
                </h3>
                <p className="mt-1 text-xs text-readora-brown/75">{club.description}</p>

                {/* CURRENT MONTH BOOK */}
                {club.currentBook?.bookId && (
                  <div className="mt-4 rounded-2xl bg-readora-cream/50 p-3 flex items-center gap-3">
                    <img
                      src={club.currentBook.bookId.cover}
                      alt={club.currentBook.bookId.title}
                      className="h-12 w-8 rounded object-cover shadow"
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase text-readora-gold">
                        Current Club Read
                      </p>
                      <p className="font-display text-xs font-bold text-readora-purple truncate">
                        {club.currentBook.bookId.title}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 border-t border-readora-purple/10 pt-3 flex justify-end">
                  <button
                    onClick={() => {
                      if (!auth.user) {
                        openAuthModal({ message: "Sign in to join book clubs." });
                        return;
                      }
                      showToast(`Joined ${club.name}! ✦`);
                    }}
                    className="rounded-full bg-readora-purple px-4 py-1.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
                  >
                    Join Club
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: DISCOVER READERS */}
        {activeTab === "readers" && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
            {readers.map((reader) => (
              <div
                key={reader._id}
                className="rounded-3xl border border-readora-purple/10 bg-white/85 p-5 text-center shadow-sm"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-readora-purple to-readora-plum text-xl font-bold text-readora-cream shadow">
                  {reader.name?.charAt(0).toUpperCase() || "R"}
                </div>
                <h4 className="mt-3 font-display text-base font-bold text-readora-purple">
                  {reader.name}
                </h4>
                <p className="text-[11px] text-readora-gold font-bold">
                  Level {reader.level || 1} • {reader.streak?.current || 1}-day streak
                </p>
                <p className="mt-2 text-xs text-readora-brown/75 line-clamp-2">{reader.bio}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-1">
                  {(reader.favoriteGenres || ["Fantasy", "Fiction"]).slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-readora-cream px-2 py-0.5 text-[9px] font-semibold text-readora-purple"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFollow(reader._id)}
                    className="flex-1 rounded-full border border-readora-purple/20 bg-white py-1.5 text-[11px] font-bold text-readora-purple shadow-xs hover:bg-readora-gold hover:text-readora-purple transition"
                  >
                    Follow ✦
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!auth.user) {
                        openAuthModal({ message: "Sign in to start a buddy read." });
                        return;
                      }
                      setSelectedPartner(reader);
                      setNewBuddyData({
                        title: "",
                        bookId: "",
                        partnerId: reader._id,
                      });
                      setSelectedBook(null);
                      setBookSearchQuery("");
                      setCreateBuddyModalOpen(true);
                    }}
                    className="flex-1 rounded-full bg-readora-purple py-1.5 text-[11px] font-bold text-readora-cream shadow-xs hover:bg-readora-plum transition flex items-center justify-center gap-1"
                    title={`Start a Buddy Read & Chat with ${reader.name}`}
                  >
                    <span>💬</span> Read & Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* CREATE BUDDY READ MODAL (WITH EXTENSIVE LIBRARY & READING CHECKPOINTS) */}
      {createBuddyModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreateBuddyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-readora-purple uppercase tracking-wider">
                  ✦ Synchronous Buddy Reading ✦
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                  Start a Buddy Read
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateBuddyModalOpen(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center bg-white/60 text-readora-purple hover:bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-readora-brown/70 mt-1">
              Read alongside friends with synchronized progress meters, 4-checkpoint reading milestones, and real-time registered email notifications.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newBuddyData.partnerId) {
                  showToast("Please invite a reading partner or enter their email address", "error");
                  return;
                }
                if (!newBuddyData.bookId) {
                  showToast("Please choose a book from the catalog first", "error");
                  return;
                }
                try {
                  const b = await api.createBuddyRead(newBuddyData);
                  showToast("Buddy Read created! Real-time invite dispatched to partner ✦");
                  setCreateBuddyModalOpen(false);
                  setBuddyReads((prev) => [b, ...prev.filter((item) => item._id !== b._id)]);
                  setSelectedBuddyRead(b);
                  setActiveTab("buddyReads");
                  await loadCommunityData();
                } catch (err) {
                  showToast("Could not create buddy read: " + err.message, "error");
                }
              }}
              className="mt-5 space-y-4"
            >
              {/* STEP 1: INVITE READING PARTNER (REQUIRED) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-readora-purple">
                    1. Invite Reading Partner / Other Reader <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerInviteType("select");
                        setNewBuddyData({ ...newBuddyData, partnerId: "" });
                        setSelectedPartner(null);
                      }}
                      className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                        partnerInviteType === "select"
                          ? "bg-readora-purple text-readora-cream"
                          : "text-readora-brown/70 hover:text-readora-purple bg-white"
                      }`}
                    >
                      Community Readers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartnerInviteType("email");
                        setNewBuddyData({ ...newBuddyData, partnerId: partnerEmailInput });
                        setSelectedPartner(null);
                      }}
                      className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                        partnerInviteType === "email"
                          ? "bg-readora-purple text-readora-cream"
                          : "text-readora-brown/70 hover:text-readora-purple bg-white"
                      }`}
                    >
                      Invite by Email
                    </button>
                  </div>
                </div>

                {partnerInviteType === "select" ? (
                  <select
                    value={newBuddyData.partnerId || ""}
                    onChange={(e) => {
                      const pId = e.target.value;
                      setNewBuddyData({ ...newBuddyData, partnerId: pId });
                      const found = readers.find((r) => r._id === pId);
                      setSelectedPartner(found || null);
                    }}
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                    required
                  >
                    <option value="">-- Choose a reading partner from readers directory --</option>
                    {readers
                      .filter((r) => r._id !== auth.user?._id)
                      .map((r) => (
                        <option key={r._id} value={r._id}>
                          👤 {r.name} {r.email ? `(${r.email})` : ""} • Level {r.level || 1}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="email"
                    value={partnerEmailInput}
                    onChange={(e) => {
                      setPartnerEmailInput(e.target.value);
                      setNewBuddyData({ ...newBuddyData, partnerId: e.target.value });
                    }}
                    placeholder="Enter reader's email (e.g. partner@example.com)..."
                    className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                    required
                  />
                )}

                {newBuddyData.partnerId ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <span>⚡</span> Live sync invitation will be dispatched to partner via WebSockets & registered email!
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-amber-700">
                    ⚠️ A reading partner is required to start a shared Buddy Read session.
                  </p>
                )}
              </div>

              {/* STEP 2: EXTENSIVE BOOK SELECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-readora-purple">
                    2. Choose Book from Readora Library ({catalogBooks.length} Books in Catalog)
                  </label>
                  {selectedBook && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ {selectedBook.title}
                    </span>
                  )}
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder="🔍 Search 70+ books by title, author, or genre..."
                  className="w-full rounded-xl border border-readora-purple/20 bg-white px-3 py-2 text-xs outline-none placeholder:text-readora-brown/50 mb-2 focus:border-readora-purple"
                />

                {/* Genre Filter Pills */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {["all", "Fantasy", "Fiction", "Sci-Fi", "Mystery", "Romance", "Non-Fiction"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setBookFilterGenre(g)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize transition ${
                        bookFilterGenre === g
                          ? "bg-readora-purple text-readora-cream"
                          : "bg-white text-readora-brown/70 hover:bg-readora-cream border border-readora-purple/10"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Scrollable Book Cards Grid */}
                <div className="max-h-52 overflow-y-auto space-y-2 rounded-2xl border border-readora-purple/15 bg-white p-2">
                  {filteredBooks.length === 0 ? (
                    <p className="text-center text-xs text-readora-brown/60 py-4">
                      No books found matching "{bookSearchQuery}". Try another keyword or genre.
                    </p>
                  ) : (
                    filteredBooks.map((b) => (
                      <div
                        key={b._id}
                        onClick={() => {
                          setSelectedBook(b);
                          setNewBuddyData({
                            ...newBuddyData,
                            bookId: b._id,
                            title: newBuddyData.title ? newBuddyData.title : `${b.title} Buddy Read`,
                          });
                        }}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl p-2 transition ${
                          selectedBook?._id === b._id
                            ? "bg-readora-gold/20 border-2 border-readora-gold shadow-xs"
                            : "hover:bg-readora-cream/60 border border-transparent"
                        }`}
                      >
                        <img
                          src={b.cover}
                          alt={b.title}
                          className="h-14 w-10 rounded object-cover shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-display text-xs font-bold text-readora-purple truncate">
                              {b.title}
                            </h5>
                            {selectedBook?._id === b._id && (
                              <span className="text-[10px] font-bold text-readora-purple bg-readora-gold px-2 py-0.5 rounded-full">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-readora-brown/75 truncate">{b.author}</p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-readora-brown/60">
                            <span className="rounded bg-readora-purple/10 px-1.5 py-0.5 font-semibold text-readora-purple">
                              {b.genre || "Fiction"}
                            </span>
                            <span>📖 {b.pages || 300} pages</span>
                            <span>★ {b.rating || "4.5"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* STEP 3: READING CHECKPOINTS PREVIEW */}
              {selectedBook && (
                <div className="rounded-2xl bg-white p-3 border border-readora-purple/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                    4-Checkpoint Reading Milestones (Calculated for {selectedBook.pages || 300} pages):
                  </span>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div className="rounded-lg bg-readora-cream p-1.5 border border-readora-purple/10">
                      <span className="font-bold text-readora-purple">25%</span>
                      <p className="text-readora-brown/70">p.{Math.round((selectedBook.pages || 300) * 0.25)}</p>
                    </div>
                    <div className="rounded-lg bg-readora-cream p-1.5 border border-readora-purple/10">
                      <span className="font-bold text-readora-purple">50%</span>
                      <p className="text-readora-brown/70">p.{Math.round((selectedBook.pages || 300) * 0.5)}</p>
                    </div>
                    <div className="rounded-lg bg-readora-cream p-1.5 border border-readora-purple/10">
                      <span className="font-bold text-readora-purple">75%</span>
                      <p className="text-readora-brown/70">p.{Math.round((selectedBook.pages || 300) * 0.75)}</p>
                    </div>
                    <div className="rounded-lg bg-readora-cream p-1.5 border border-readora-purple/10">
                      <span className="font-bold text-readora-purple">100%</span>
                      <p className="text-readora-brown/70">p.{selectedBook.pages || 300}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: TITLE */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  3. Buddy Read Title
                </label>
                <input
                  required
                  type="text"
                  value={newBuddyData.title}
                  onChange={(e) => setNewBuddyData({ ...newBuddyData, title: e.target.value })}
                  placeholder="e.g. October Fantasy Sprint"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-readora-purple/10">
                <button
                  type="button"
                  onClick={() => setCreateBuddyModalOpen(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBuddyData.bookId}
                  className="rounded-full bg-readora-purple px-6 py-2 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition disabled:opacity-50"
                >
                  Start Buddy Read ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL-TIME EMAIL SYNCHRONIZATION STATUS MODAL */}
      {emailSyncModalOpen && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setEmailSyncModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  ⚡ WebSockets & Registered Email Sync ⚡
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                  Real-Time Email Updates
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailSyncModalOpen(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center bg-white/60 text-readora-purple hover:bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 border border-readora-purple/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-readora-brown/60">
                    Your Registered Email Address:
                  </p>
                  <p className="font-display text-base font-bold text-readora-purple">
                    {auth.user?.email || "No email registered"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sync Active
                </span>
              </div>

              <p className="mt-3 text-xs text-readora-brown/80 leading-relaxed">
                Whenever a reading partner sends a message, reaches a reading checkpoint, or updates reading progress, notifications are dispatched live over WebSockets and sent directly to your registered email!
              </p>

              <button
                type="button"
                disabled={isSendingTestEmail}
                onClick={handleSendTestEmail}
                className="mt-4 w-full rounded-full bg-readora-gold px-4 py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight transition flex items-center justify-center gap-2"
              >
                {isSendingTestEmail ? (
                  <span>Sending test notification email...</span>
                ) : (
                  <>
                    <span>📨</span> Send Test Real-Time Alert to My Registered Email
                  </>
                )}
              </button>
            </div>

            {/* RECENT EMAIL DISPATCHES */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                  Recent Real-Time Email Dispatches
                </h4>
                <button
                  type="button"
                  onClick={loadEmailHistory}
                  className="text-[11px] font-bold text-readora-purple hover:underline"
                >
                  Refresh Log ⟳
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 rounded-2xl border border-readora-purple/10 bg-white p-3">
                {emailHistory.length === 0 ? (
                  <p className="text-center text-xs text-readora-brown/60 py-3">
                    No email dispatches recorded in this session yet. Click the button above to dispatch a test real-time update!
                  </p>
                ) : (
                  emailHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-readora-cream/40 p-2.5 text-xs border border-readora-purple/5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-readora-brown/60">
                        <span className="font-bold text-readora-purple uppercase">{rec.eventType}</span>
                        <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="font-bold text-readora-purple mt-0.5">{rec.subject}</p>
                      <p className="text-[11px] text-emerald-700">✓ Dispatched to: {rec.to}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setEmailSyncModalOpen(false)}
                className="rounded-full bg-readora-purple px-5 py-2 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE BOOK CLUB MODAL */}
      {createClubModalOpen && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreateClubModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-readora-lavenderLight/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                  🏛️ Literary Fellowship
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                  Create a Book Club
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateClubModalOpen(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center bg-white/60 text-readora-purple hover:bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-xs text-readora-brown/70">
              Gather readers around shared genres, host monthly book discussions, and vote on future reads together.
            </p>

            <form onSubmit={handleCreateClub} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Book Club Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={newClubData.name}
                  onChange={(e) => setNewClubData({ ...newClubData, name: e.target.value })}
                  placeholder="e.g. Midnight Fantasy Society"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Genre / Reading Focus
                </label>
                <select
                  value={newClubData.genre}
                  onChange={(e) => setNewClubData({ ...newClubData, genre: e.target.value })}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                >
                  <option value="Fantasy">Fantasy & Worldbuilding</option>
                  <option value="Literary Fiction">Literary Fiction</option>
                  <option value="Sci-Fi">Sci-Fi & Speculative</option>
                  <option value="Mystery">Mystery, Thriller & True Crime</option>
                  <option value="Romance">Romance & Emotional Journeys</option>
                  <option value="Historical Fiction">Historical Fiction</option>
                  <option value="Non-Fiction">Non-Fiction & Memoir</option>
                  <option value="General Fiction">All Genres / Eclectic</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Club Description & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={newClubData.description}
                  onChange={(e) => setNewClubData({ ...newClubData, description: e.target.value })}
                  placeholder="Describe your club's vibe, reading cadence, or discussion topics..."
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-readora-purple/10">
                <button
                  type="button"
                  onClick={() => setCreateClubModalOpen(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-readora-purple px-6 py-2 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition"
                >
                  Create Book Club ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WRITE & PUBLISH BOOK REVIEW MODAL */}
      {createReviewModalOpen && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreateReviewModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-readora-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-readora-purple">
                  ✍️ Community Review
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                  Write a Book Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateReviewModalOpen(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center bg-white/60 text-readora-purple hover:bg-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-xs text-readora-brown/70">
              Share your reading impressions, rating, and insights with the Readora fellowship.
            </p>

            <form onSubmit={handleCreateReview} className="mt-5 space-y-4">
              {/* BOOK SELECTOR */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  1. Select Book to Review <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newReviewData.bookId}
                  onChange={(e) => setNewReviewData({ ...newReviewData, bookId: e.target.value })}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                >
                  <option value="">-- Choose a book from Readora library --</option>
                  {catalogBooks.map((b) => (
                    <option key={b._id} value={b._id}>
                      📖 {b.title} by {b.author}
                    </option>
                  ))}
                </select>
              </div>

              {/* STAR RATING */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  2. Your Star Rating: {newReviewData.rating} / 5 Stars
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewData({ ...newReviewData, rating: star })}
                      className={`text-2xl transition hover:scale-125 ${
                        star <= newReviewData.rating ? "text-readora-gold" : "text-readora-brown/25"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* REVIEW TEXT */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  3. Your Review Thoughts <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newReviewData.reviewText}
                  onChange={(e) => setNewReviewData({ ...newReviewData, reviewText: e.target.value })}
                  placeholder="What did you love or dislike? How was the character depth, pacing, and emotional payoff?..."
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                />
              </div>

              {/* CHAPTER OR PAGE NOTE */}
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  4. Chapter / Milestone Note (Optional)
                </label>
                <input
                  type="text"
                  value={newReviewData.chapterOrPageNote}
                  onChange={(e) => setNewReviewData({ ...newReviewData, chapterOrPageNote: e.target.value })}
                  placeholder="e.g. Completed Chapter 24 • Final impressions"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none focus:border-readora-purple"
                />
              </div>

              {/* SPOILER TOGGLE */}
              <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={newReviewData.hasSpoilers}
                    onChange={(e) => setNewReviewData({ ...newReviewData, hasSpoilers: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>⚠️ This review contains plot spoilers (Veil behind Spoiler Shield)</span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-readora-purple/10">
                <button
                  type="button"
                  onClick={() => setCreateReviewModalOpen(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newReviewData.bookId || !newReviewData.reviewText.trim()}
                  className="rounded-full bg-readora-purple px-6 py-2 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum transition disabled:opacity-50"
                >
                  Publish Review ✦
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Community;
