// Readora API Client

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("readora_token");

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // If backend isn't running or network error, let caller handle or pass descriptive error
    console.warn(`API call error at ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  getMe: () => request("/auth/me"),
  updateProfile: (profileData) => request("/auth/profile", { method: "PUT", body: JSON.stringify(profileData) }),

  // Books
  getBooks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/books?${qs}`);
  },
  getBookById: (id) => request(`/books/${id}`),
  createBook: (bookData) => request("/books", { method: "POST", body: JSON.stringify(bookData) }),
  searchBooks: (query, external = true) =>
    request(`/search?q=${encodeURIComponent(query)}&external=${external}`),

  // Library
  getLibrary: () => request("/library"),
  addToLibrary: (payload) => request("/library", { method: "POST", body: JSON.stringify(payload) }),
  updateLibraryEntry: (id, payload) =>
    request(`/library/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  removeFromLibrary: (id) => request(`/library/${id}`, { method: "DELETE" }),
  importLibrary: (payload) => request("/library/import", { method: "POST", body: JSON.stringify(payload) }),
  exportLibrary: () => request("/library/export"),

  // Reading & Analytics
  createSession: (sessionData) =>
    request("/reading/sessions", { method: "POST", body: JSON.stringify(sessionData) }),
  getSessions: (bookId) => request(`/reading/sessions${bookId ? `?bookId=${bookId}` : ""}`),
  getGoals: () => request("/reading/goals"),
  updateGoals: (goals) => request("/reading/goals", { method: "PUT", body: JSON.stringify(goals) }),
  getAnalytics: () => request("/reading/analytics"),
  getPersonality: () => request("/reading/personality"),
  getDnfAnalysis: () => request("/reading/dnf-analysis"),
  pickNextBook: (preferences) =>
    request("/reading/pick-next", { method: "POST", body: JSON.stringify(preferences) }),
  getRecommendations: () => request("/reading/recommendations"),
  getWorldMap: () => request("/reading/world-map"),
  getTimeline: () => request("/reading/timeline"),
  getYearInBooks: (year) => request(`/reading/year-in-books?year=${year || new Date().getFullYear()}`),

  // Reviews
  getBookReviews: (bookId) => request(`/reviews/book/${bookId}`),
  createReview: (reviewData) => request("/reviews", { method: "POST", body: JSON.stringify(reviewData) }),
  toggleLikeReview: (reviewId) => request(`/reviews/${reviewId}/like`, { method: "POST" }),
  commentOnReview: (reviewId, text) =>
    request(`/reviews/${reviewId}/comment`, { method: "POST", body: JSON.stringify({ text }) }),
  getActivityFeed: () => request("/reviews/feed"),
  reportReview: (reviewId, reason) =>
    request(`/reviews/${reviewId}/report`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Notes
  getNotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notes?${qs}`);
  },
  createNote: (noteData) => request("/notes", { method: "POST", body: JSON.stringify(noteData) }),
  updateNote: (id, noteData) => request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(noteData) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),

  // Challenges
  getChallenges: () => request("/challenges"),
  createChallenge: (challengeData) =>
    request("/challenges", { method: "POST", body: JSON.stringify(challengeData) }),
  joinChallenge: (id) => request(`/challenges/${id}/join`, { method: "POST" }),
  updateChallengeProgress: (id, progressData) =>
    request(`/challenges/${id}/progress`, { method: "PUT", body: JSON.stringify(progressData) }),

  // Social
  getBuddyReads: () => request("/social/buddy-reads"),
  createBuddyRead: (data) => request("/social/buddy-reads", { method: "POST", body: JSON.stringify(data) }),
  getBuddyReadById: (id) => request(`/social/buddy-reads/${id}`),
  joinBuddyRead: (id) => request(`/social/buddy-reads/${id}/join`, { method: "POST" }),
  updateBuddyProgress: (id, page) =>
    request(`/social/buddy-reads/${id}/progress`, { method: "PUT", body: JSON.stringify({ currentPage: page }) }),
  postBuddyMessage: (id, messageData) =>
    request(`/social/buddy-reads/${id}/messages`, { method: "POST", body: JSON.stringify(messageData) }),
  getBookClubs: () => request("/social/book-clubs"),
  createBookClub: (data) => request("/social/book-clubs", { method: "POST", body: JSON.stringify(data) }),
  joinBookClub: (id) => request(`/social/book-clubs/${id}/join`, { method: "POST" }),
  voteForClubBook: (clubId, bookId) =>
    request(`/social/book-clubs/${clubId}/vote`, { method: "POST", body: JSON.stringify({ bookId }) }),
  getUserProfile: (userId) => request(`/social/profile/${userId}`),
  toggleFollowUser: (userId) => request(`/social/follow/${userId}`, { method: "POST" }),
  getCommunityReaders: () => request("/social/readers"),

  // Notifications
  getNotifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "PUT" }),

  // Admin
  getAdminStats: () => request("/admin/stats"),
  getAllUsers: () => request("/admin/users"),
  updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  getReportedReviews: () => request("/admin/reports"),
  dismissReviewReport: (id) => request(`/admin/reviews/${id}/dismiss`, { method: "PUT" }),
  deleteReviewModerated: (id) => request(`/admin/reviews/${id}`, { method: "DELETE" }),
};

export default api;
