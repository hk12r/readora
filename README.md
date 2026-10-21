# READORA — Complete Reading Universe & Social Platform

READORA is a modern MERN-stack social reading, book tracking, and literary discovery platform. It features synchronous Buddy Reads with 4-checkpoint reading milestones and dynamic spoiler shielding, personal reading shelves, reading streaks, AI-style personalized recommendations ("Pick My Next Book"), Spotify-style "Year in Books" Wrapped, reading analytics, study notes, book clubs, and real-time Socket.IO notifications synchronized with registered email addresses.

---

## Architecture & Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Canvas-Confetti, Socket.IO Client.
- **Backend**: Node.js, Express 5, MongoDB Atlas (Mongoose 9), Socket.IO Server, Nodemailer, JSON Web Tokens (JWT), BcryptJS, Helmet, Express-Rate-Limit, Express-Mongo-Sanitize.
- **Real-Time Communication**: Socket.IO authenticated rooms (`buddyread:message`, `buddyread:progress`, `notification:new`, `challenge:milestone`, `follow:new`, `progress:updated`).
- **Email Synchronization**: Nodemailer service dispatching live real-time updates to registered user inboxes.
- **Deployment**:
  - **Frontend**: Vercel (Single-Page Application with client-side rewrites in `vercel.json`).
  - **Backend**: Render Web Service (`render.yaml`).
  - **Database**: MongoDB Atlas (`MONGO_URI`).
  - **Containerization**: Docker & Docker Compose (`Dockerfile`, `docker-compose.yml`, `nginx.conf`).

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js v18+ / v20+ / v22+
- MongoDB running locally or a MongoDB Atlas connection string

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend starts on `http://localhost:5000` (or `PORT` specified in `.env`).

### 3. Frontend Setup
In a separate terminal:
```bash
npm install
npm run dev
```
The frontend starts on `http://localhost:5173/readora/` (or `http://localhost:5173/`).

---

## Running Automated Tests

Run the Experiment 8 and Socket.IO automated verification suite:
```bash
cd backend
npm test
```
Or directly from root:
```bash
node backend/tests/verify_experiment8.cjs
```

---

## Production Deployment Guide

### A. Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/):
   - Click **Add New Project** and select your `readora` repository.
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
     - `VITE_SOCKET_URL`: `https://your-backend-service.onrender.com`
     - `VERCEL`: `1`
3. Click **Deploy**. Vercel will automatically configure the rewrites specified in `vercel.json` so all routes (`/library`, `/community`, etc.) refresh cleanly without 404s.

### B. Deploy Backend to Render
1. In the [Render Dashboard](https://dashboard.render.com/):
   - Click **New** → **Web Service**.
   - Connect your GitHub repository.
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/health`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `MONGO_URI`: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/readora?retryWrites=true&w=majority`
     - `JWT_SECRET`: `<your_secure_random_jwt_secret>`
     - `FRONTEND_URL`: `https://your-frontend.vercel.app`
     - Optional email SMTP settings (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
2. Click **Create Web Service**.

### C. MongoDB Atlas Network Access
- Under **Network Access** in MongoDB Atlas, add `0.0.0.0/0` (allow access from anywhere) so Render instances can connect dynamically.
- Ensure the database user has Read & Write privileges for the `readora` database.

### D. Docker Deployment (Optional)
To run the full stack locally via Docker:
```bash
docker compose up --build
```
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5001`
