import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let socket;

export function connectSocket(token) {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SERVER_URL, {
    autoConnect: true,
    auth: { token: `Bearer ${token}` },
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}