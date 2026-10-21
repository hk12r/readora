import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "");

let socketInstance = null;
let currentSocketToken = null;

/**
 * Connect to Socket.IO server with JWT authentication
 * @param {string} token - The user's JWT token
 * @returns {Socket}
 */
export function connectSocket(token) {
  const targetToken = token || (typeof window !== "undefined" ? localStorage.getItem("readora_token") : "") || "";

  if (socketInstance) {
    if (socketInstance.connected && currentSocketToken === targetToken) {
      return socketInstance;
    }
    socketInstance.disconnect();
    socketInstance = null;
  }

  currentSocketToken = targetToken;
  socketInstance = io(SOCKET_URL, {
    auth: {
      token: targetToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socketInstance.on("connect", () => {
    console.log("[Socket.IO Client] Connected with ID:", socketInstance.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("[Socket.IO Client] Connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[Socket.IO Client] Disconnected:", reason);
  });

  return socketInstance;
}

/**
 * Get active socket instance
 */
export function getSocket() {
  return socketInstance;
}

/**
 * Disconnect and clear socket
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
