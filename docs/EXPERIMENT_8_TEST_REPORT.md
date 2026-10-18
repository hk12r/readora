# READORA — Experiment 8 Test Report: Real-Time Socket.IO Implementation & Verification

**Project**: READORA (MERN Complete Reading Universe)  
**Experiment**: Experiment 8 — Socket.IO Real-Time Architecture, Testing & Verification  
**Date**: October 18, 2026  
**Status**: All Tests Passed (15/15 Passed, 0 Failed, 0 Blocked)  
**Screenshots Folder**: `docs/experiment-8-screenshots/`

---

## 1. Executive Summary & Objective

The objective of **Experiment 8** was to design, implement, and verify a real-time full-stack communication layer using **Socket.IO** in the READORA MERN application. 

The implementation delivers:
1. **Authenticated Real-Time WebSockets**: Handshake authentication using JWT secrets, preventing unauthenticated access and establishing verified server-side user identities.
2. **Authorized Room Architecture**: Private user rooms (`user:${userId}`) for confidential notifications/progress and authorized Buddy Read rooms (`buddy:${buddyReadId}`) ensuring only participants can join, chat, and synchronize reading milestones.
3. **Six Core Real-Time Events**:
   - `progress:updated`
   - `buddyread:message`
   - `buddyread:progress`
   - `notification:new`
   - `challenge:milestone`
   - `follow:new`
4. **Live UI Synchronization**: Instant chat updates, reading progress bar synchronization, and notification badge increments without requiring page reloads or polling.

---

## 2. The Six Socket.IO Events & Specifications

| # | Event Name | Direction | Payload & Purpose | Security & Authorization |
|---|---|---|---|---|
| 1 | `progress:updated` | Server → Client (`user:${userId}`) | `{ entryId, bookId, shelf, currentPage, percentage, updatedAt }`<br>Synchronizes book progress across multiple tabs/devices for the logged-in user in real-time. | Scoped strictly to the authenticated user's private room `user:${userId}`. Clients cannot receive another user's progress. |
| 2 | `buddyread:message` | Bidirectional (`buddy:${buddyReadId}`) | `{ buddyReadId, text, page, isSpoiler, message }`<br>Delivers chat messages instantly within an active Buddy Read room without refreshing the browser. | Server verifies user is a registered participant or creator of the Buddy Read before broadcasting. Sender identity is taken strictly from `socket.user` (anti-spoofing). |
| 3 | `buddyread:progress` | Bidirectional (`buddy:${buddyReadId}`) | `{ buddyReadId, userId, userName, currentPage, percentage, milestones }`<br>Synchronizes reading progress and updates shared reading bars among buddy readers. | Validates page numbers and checks against book total. Automatically checks and completes checkpoints/milestones. |
| 4 | `notification:new` | Server → Client (`user:${userId}`) | `{ _id, title, message, type, link, createdAt }`<br>Pushes in-app alerts (new followers, buddy read invitations, messages, milestones) with immediate toast notification and unread badge count updates. | Delivered exclusively to the target recipient's personal room `user:${userId}`. |
| 5 | `challenge:milestone` | Server → Client (`buddy:${buddyReadId}` & `user:${userId}`) | `{ challengeId / buddyReadId, name, targetPage, userId, userName, xpAwarded, userLevel, totalXp }`<br>Broadcasts milestone completion celebration and triggers XP/level updates upon passing reading targets. | Milestone achievement criteria validated on server; prevents duplicate triggers or illegitimate XP inflation. |
| 6 | `follow:new` | Server → Client (`user:${userId}`) | `{ followerId, followerName, followerAvatar, followersCount }`<br>Notifies a reader in real time when another community member follows their reading profile. | Emitted when authenticated user performs follow action on another user. |

---

## 3. Files Created or Modified

### Backend:
- `backend/services/socketService.js` *(Created)*: Central Socket.IO server initialization, JWT handshake authentication middleware, room authorization handlers (`buddyread:join`, `buddyread:leave`), event listeners (`buddyread:message`, `buddyread:progress`, `progress:updated`), and helper emitters (`emitToUser`, `emitToBuddyRead`).
- `backend/server.js` *(Modified)*: Replaced legacy unauthenticated inline socket handlers with `initSocketServer(server)`.
- `backend/config/db.js` *(Modified)*: Added resilient fallback connection handling to ensure automatic failover between MongoDB Atlas and local MongoDB (`mongodb://127.0.0.1:27017/readora`).
- `backend/controllers/socialController.js` *(Modified)*: Wired real-time socket events `buddyread:message`, `buddyread:progress`, `challenge:milestone`, `follow:new`, and `notification:new` into social controller endpoints.
- `backend/controllers/libraryController.js` *(Modified)*: Wired `progress:updated` emission into `updateLibraryEntry`.
- `backend/controllers/challengeController.js` *(Modified)*: Wired `challenge:milestone` and `notification:new` emission into `updateChallengeProgress`.
- `backend/tests/verify_experiment8.cjs` *(Created)*: Comprehensive automated test suite verifying all 10 security, handshake, room, and event test cases.

### Frontend:
- `src/services/socket.js` *(Created)*: Frontend Socket.IO client module with JWT token passing, reconnection lifecycle management, and socket retrieval.
- `src/context/ReadoraContext.jsx` *(Modified)*: Integrated socket lifecycle into global React context with listeners for `notification:new`, `follow:new`, `challenge:milestone`, and `progress:updated`.
- `src/pages/Community.jsx` *(Modified)*: Integrated authenticated socket room management, real-time message handling, progress bar synchronization, and added live Socket.IO connection badge.

### Scripts & Documentation:
- `scripts/capture_screenshots.cjs` *(Created)*: Browser automation script using headless Chrome (`puppeteer-core`) to capture high-resolution submission screenshots.
- `docs/experiment-8-screenshots/` *(Created)*: Folder containing all genuine submission screenshots.
- `docs/EXPERIMENT_8_TEST_REPORT.md` *(Created)*: This formal university submission report.

---

## 4. Test Execution & Results

### Automated Test Suite Execution:
Run command:
```bash
node backend/tests/verify_experiment8.cjs
```

### Actual Results (15/15 Assertions Passed):
```
=======================================================
  READORA — EXPERIMENT 8 AUTOMATED TEST SUITE
=======================================================

  [PASS] Database Connectivity (Local Fallback)
  [PASS] Socket.IO Server Startup (Dynamic Port)
  [PASS] Test User Provisioning & JWT Generation
  [PASS] Test 1: Unauthenticated Handshake Rejection (Token required)
  [PASS] Test 2: Invalid Token Rejection (Invalid token)
  [PASS] Test 3: Authenticated Handshake for Authorized Users (Alice & Bob connected)
  [PASS] Test 4a: Room Authorization - Unauthorized User Denied (Charlie rejected)
  [PASS] Test 4b: Room Authorization - Authorized Participants Admitted (Joined buddy room)
  [PASS] Test 5: Real-Time Chat Message Delivery (buddyread:message)
  [PASS] Test 6: Real-Time Progress Sync (buddyread:progress)
  [PASS] Test 7: Real-Time Milestone Event (challenge:milestone)
  [PASS] Test 8a: Real-Time Follow Event (follow:new)
  [PASS] Test 8b: Real-Time In-App Notification (notification:new)
  [PASS] Test 9: Personal Library Progress Sync (progress:updated)
  [PASS] Test 10: Clean Disconnect & Reconnect Lifecycle

=======================================================
  RESULTS: 15 PASSED, 0 FAILED out of 15 total assertions.
=======================================================
```

---

## 5. Bugs Discovered & Fixes Applied

1. **Bug**: MongoDB Atlas SRV DNS query timeout on Windows when using custom local network adapters.
   - **Fix**: Added Google DNS servers (`dns.setServers(["8.8.8.8", "8.8.4.4"])`) and implemented automatic failover in `backend/config/db.js` to local MongoDB (`mongodb://127.0.0.1:27017/readora`).
2. **Bug**: In `backend/controllers/challengeController.js`, a duplicate closing bracket caused a syntax error on startup.
   - **Fix**: Removed the redundant bracket and verified with `node -c`.
3. **Bug**: Express 5 `path-to-regexp` routing error with wildcard asterisk (`*`).
   - **Fix**: Replaced asterisk route string with fallback middleware `previewApp.use((req, res) => res.sendFile(...))`.
4. **Bug**: Unauthenticated Socket.IO connections could emit and listen without identity verification.
   - **Fix**: Implemented JWT authentication middleware on `io.use()` that extracts the token, verifies with `JWT_SECRET`, and securely attaches `socket.user`.
5. **Bug**: Unauthorized users could join arbitrary Buddy Read rooms.
   - **Fix**: Added participant verification in `buddyread:join` handler; unauthorized attempts are rejected with `{ success: false, error: "Not authorized to join this Buddy Read room" }`.

---

## 6. Submission Screenshots Inventory

All screenshots have been captured from the running application and saved in `docs/experiment-8-screenshots/`:

| Filename | Description & Verification Evidence |
|---|---|
| `01_readora_running_successfully.png` | READORA homepage running live with hero section, navigation bar, and curated catalog. |
| `02_buddy_read_room_active.png` | Active Buddy Read room showing book details, reading progress tracker, and the green `Socket.IO Live Sync` status pill. |
| `03_realtime_chat_without_refresh.png` | Real-time chat stream showing incoming message from another user (`Julian Sterling`) without page refresh. |
| `04_realtime_progress_sync.png` | Synchronized reading progress updating Julian's page count and percentage bar in real-time. |
| `05_realtime_notification_alert.png` | In-app notification center showing live unread badge count on the notification bell and alert dropdown. |
| `06_challenge_milestones_and_badges.png` | Challenges & Goals page displaying unlocked milestone badges, XP progress, and active reading quests. |
| `07_community_social_hub.png` | Community Social Hub displaying reader fellowship, active Buddy Reads, Book Clubs, and community readers. |
| `08_personal_library_progress.png` | User's personal reading library displaying shelves (*Currently Reading*, *Want to Read*, *Read*, *DNF*) and page tracking. |

---

## 7. How to Run the Application

### 1. Run Backend Server:
```bash
npm run server
```
*Server starts on port `5000` with automated MongoDB connection and Socket.IO initialization.*

### 2. Run Frontend Client:
```bash
npm run dev
```
*Application opens at `http://localhost:5173/`.*

### 3. Run Automated Experiment 8 Test Suite:
```bash
node backend/tests/verify_experiment8.cjs
```
