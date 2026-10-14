import React, { useState, useEffect } from "react";
import { useReadora } from "../context/ReadoraContext";
import api from "../services/api";
import { io } from "socket.io-client";

function Community() {
  const { auth, openAuthModal, showToast } = useReadora();

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
  const [socket, setSocket] = useState(null);

  // New Buddy Read Modal
  const [createBuddyModalOpen, setCreateBuddyModalOpen] = useState(false);
  const [newBuddyData, setNewBuddyData] = useState({
    title: "",
    bookId: "",
  });

  // New Book Club Modal
  const [createClubModalOpen, setCreateClubModalOpen] = useState(false);
  const [newClubData, setNewClubData] = useState({
    name: "",
    description: "",
    genre: "Fantasy",
  });

  // Socket.IO connection
  useEffect(() => {
    const s = io("http://localhost:5000", { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("new_buddy_message", (data) => {
      setSelectedBuddyRead((prev) => {
        if (prev && prev._id === data.buddyReadId) {
          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
          };
        }
        return prev;
      });
    });

    return () => s.disconnect();
  }, []);

  // Load feed, buddy reads, clubs, readers
  const loadCommunityData = async () => {
    try {
      const [fData, bData, cData, rData] = await Promise.allSettled([
        api.getActivityFeed(),
        auth.user ? api.getBuddyReads() : Promise.resolve([]),
        api.getBookClubs(),
        api.getCommunityReaders(),
      ]);

      if (fData.status === "fulfilled" && fData.value) setFeed(fData.value);
      if (bData.status === "fulfilled" && bData.value) setBuddyReads(bData.value);
      if (cData.status === "fulfilled" && cData.value) setBookClubs(cData.value);
      if (rData.status === "fulfilled" && rData.value) setReaders(rData.value);
    } catch (err) {
      console.warn("Could not load community data:", err.message);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, [auth.user]);

  // Join Buddy Read room on select
  useEffect(() => {
    if (selectedBuddyRead && socket) {
      socket.emit("join_buddy_read", selectedBuddyRead._id);
    }
  }, [selectedBuddyRead, socket]);

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

  // Post Buddy Message
  const handleSendBuddyMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedBuddyRead) return;

    try {
      const msg = await api.postBuddyMessage(selectedBuddyRead._id, {
        text: chatMessage.trim(),
        page: parseInt(chatPage) || 0,
        isSpoiler: isSpoilerChat,
      });

      if (socket) {
        socket.emit("send_buddy_message", {
          buddyReadId: selectedBuddyRead._id,
          message: msg,
        });
      }

      setSelectedBuddyRead((prev) => ({
        ...prev,
        messages: [...(prev.messages || []), msg],
      }));

      setChatMessage("");
      setChatPage("");
      setIsSpoilerChat(false);
    } catch (err) {
      showToast("Could not send message", "error");
    }
  };

  // Update Buddy Progress
  const handleUpdateBuddyProgress = async (buddyId, page) => {
    try {
      const updated = await api.updateBuddyProgress(buddyId, page);
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

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to start a buddy read." });
                  return;
                }
                setCreateBuddyModalOpen(true);
              }}
              className="rounded-full bg-readora-purple px-5 py-2.5 text-xs font-bold text-readora-cream shadow hover:bg-readora-plum"
            >
              + New Buddy Read ✦
            </button>
            <button
              onClick={() => {
                if (!auth.user) {
                  openAuthModal({ message: "Sign in to create a book club." });
                  return;
                }
                setCreateClubModalOpen(true);
              }}
              className="rounded-full border border-readora-purple/20 bg-white/70 px-4 py-2.5 text-xs font-bold text-readora-purple hover:bg-white"
            >
              + Create Club
            </button>
          </div>
        </div>

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
                <button
                  onClick={() => setSelectedBuddyRead(null)}
                  className="mb-4 text-xs font-bold text-readora-purple hover:underline"
                >
                  ← Back to Buddy Reads list
                </button>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-readora-purple/10 pb-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedBuddyRead.bookId?.cover}
                      alt={selectedBuddyRead.bookId?.title}
                      className="h-20 w-14 rounded-lg object-cover shadow"
                    />
                    <div>
                      <span className="rounded-full bg-readora-gold/20 px-2 py-0.5 text-[10px] font-bold text-readora-purple">
                        Active Buddy Read
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-bold text-readora-purple">
                        {selectedBuddyRead.title}
                      </h2>
                      <p className="text-xs text-readora-brown/70">
                        {selectedBuddyRead.bookId?.title} by {selectedBuddyRead.bookId?.author}
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
                      className="rounded-xl bg-readora-purple px-3 py-1.5 text-xs font-bold text-readora-cream"
                    >
                      Sync Page
                    </button>
                  </div>
                </div>

                {/* SYNCHRONIZED PARTICIPANTS PROGRESS */}
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple">
                    Participants Progress
                  </h4>
                  <div className="mt-3 space-y-3">
                    {(selectedBuddyRead.participants || []).map((p) => {
                      const totalP = selectedBuddyRead.bookId?.pages || 300;
                      return (
                        <div key={p.userId?._id || p._id}>
                          <div className="flex justify-between text-xs font-semibold text-readora-purple">
                            <span>{p.userId?.name || "Buddy Reader"}</span>
                            <span>
                              Page {p.currentPage} / {totalP} ({p.percentage}%)
                            </span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-readora-purple/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-readora-gold"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SPOILER-GUARDED CHAT STREAM */}
                <div className="mt-8 border-t border-readora-purple/10 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-readora-purple mb-4">
                    Buddy Discussion (With Spoiler Shield 🛡️)
                  </h4>

                  <div className="max-h-72 space-y-3 overflow-y-auto p-3 rounded-2xl bg-readora-cream/30 border border-readora-purple/5">
                    {(selectedBuddyRead.messages || []).length === 0 ? (
                      <p className="text-center text-xs text-readora-brown/60 p-4">
                        No messages yet. Start the conversation below!
                      </p>
                    ) : (
                      selectedBuddyRead.messages.map((m, idx) => {
                        const isVeiled =
                          m.isSpoiler &&
                          !unveiledSpoilers.has(m._id || idx) &&
                          m.page > (selectedBuddyRead.myCurrentPage || 0);

                        return (
                          <div
                            key={m._id || idx}
                            className="rounded-xl bg-white p-3 shadow-xs text-xs"
                          >
                            <div className="flex items-center justify-between text-[11px] text-readora-brown/60">
                              <span className="font-bold text-readora-purple">{m.userName}</span>
                              <span>
                                {m.page > 0 && `Page ${m.page} • `}
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* SPOILER GUARD */}
                            {isVeiled ? (
                              <div
                                onClick={() =>
                                  setUnveiledSpoilers(new Set([...unveiledSpoilers, m._id || idx]))
                                }
                                className="mt-2 cursor-pointer rounded-lg bg-amber-50 border border-amber-200 p-2 text-center text-xs font-bold text-amber-800"
                              >
                                ⚠️ Spoiler Warning (Referencing Page {m.page}) — Click to Reveal
                              </div>
                            ) : (
                              <p className="mt-1 text-readora-brown/90 leading-relaxed">{m.text}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* SEND MESSAGE INPUT */}
                  <form onSubmit={handleSendBuddyMessage} className="mt-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Discuss chapter thoughts or plot developments..."
                        className="flex-1 rounded-full border border-readora-purple/15 bg-white px-4 py-2.5 text-xs text-readora-brown outline-none"
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
                        className="rounded-full bg-readora-gold px-5 py-2.5 text-xs font-bold text-readora-purple shadow hover:bg-readora-goldLight"
                      >
                        Send
                      </button>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-readora-brown cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSpoilerChat}
                        onChange={(e) => setIsSpoilerChat(e.target.checked)}
                        className="rounded text-readora-purple"
                      />
                      <span>Mark message as spoiler (veiled for readers behind this page)</span>
                    </label>
                  </form>
                </div>
              </div>
            ) : (
              /* LIST OF BUDDY READS */
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
                          {b.status}
                        </span>
                        <h3 className="mt-1 font-display text-base font-bold text-readora-purple">
                          {b.title}
                        </h3>
                        <p className="text-xs text-readora-brown/70">{b.bookId?.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-readora-purple/10 pt-3 flex justify-between text-xs text-readora-brown/70">
                      <span>{b.participants?.length || 1} Readers</span>
                      <span className="font-bold text-readora-purple">Open Chat →</span>
                    </div>
                  </div>
                ))}
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

                <button
                  onClick={() => handleFollow(reader._id)}
                  className="mt-4 w-full rounded-full border border-readora-purple/20 bg-white py-2 text-xs font-bold text-readora-purple shadow-xs hover:bg-readora-gold hover:text-readora-purple transition"
                >
                  Follow Reader ✦
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE BUDDY READ MODAL */}
      {createBuddyModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-readora-plum/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setCreateBuddyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-readora-gold/30 bg-readora-cream p-7 shadow-2xl animate-scale-in"
          >
            <h3 className="font-display text-2xl font-bold text-readora-purple">
              Start a Buddy Read
            </h3>
            <p className="text-xs text-readora-brown/70 mt-1">
              Read alongside friends with synchronized progress meters and spoiler-free chats.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const b = await api.createBuddyRead(newBuddyData);
                  showToast("Buddy Read created! ✦");
                  setCreateBuddyModalOpen(false);
                  setSelectedBuddyRead(b);
                  await loadCommunityData();
                } catch (err) {
                  showToast("Could not create buddy read: " + err.message, "error");
                }
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Buddy Read Title
                </label>
                <input
                  required
                  type="text"
                  value={newBuddyData.title}
                  onChange={(e) => setNewBuddyData({ ...newBuddyData, title: e.target.value })}
                  placeholder="e.g. October Fantasy Sprint"
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-readora-purple block mb-1">
                  Select Book
                </label>
                <select
                  required
                  value={newBuddyData.bookId}
                  onChange={(e) => setNewBuddyData({ ...newBuddyData, bookId: e.target.value })}
                  className="w-full rounded-xl border border-readora-purple/15 bg-white p-2.5 text-xs outline-none"
                >
                  <option value="">-- Choose a book from catalog --</option>
                  <option value="60d21b4667d0d8992e610c85">The House in the Cerulean Sea</option>
                  <option value="60d21b4667d0d8992e610c86">The Silent Patient</option>
                  <option value="60d21b4667d0d8992e610c87">The Hunger Games</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateBuddyModalOpen(false)}
                  className="rounded-full border border-readora-purple/20 px-4 py-2 text-xs font-bold text-readora-brown"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-readora-purple px-5 py-2 text-xs font-bold text-readora-cream shadow"
                >
                  Start Buddy Read
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
