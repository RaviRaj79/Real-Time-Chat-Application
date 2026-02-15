const User = require("../models/User");
const Conversation = require("../models/Conversation");

const onlineUsers = new Map();

async function setUserOnline(userId, socketId) {
  const userKey = userId.toString();
  if (!onlineUsers.has(userKey)) {
    onlineUsers.set(userKey, new Set());
  }

  onlineUsers.get(userKey).add(socketId);
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: null });
}

async function setUserOffline(userId, socketId) {
  const userKey = userId.toString();
  const sockets = onlineUsers.get(userKey);
  if (!sockets) {
    return;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userKey);
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
  }
}

function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

async function emitCallEventToParticipants(io, conversationId, fromUserId, eventName, payload) {
  const conversation = await Conversation.findById(conversationId).select("participants").lean();
  if (!conversation?.participants?.length) {
    return;
  }

  const fromUserKey = fromUserId.toString();
  conversation.participants.forEach((participantId) => {
    const participantKey = participantId.toString();
    if (participantKey === fromUserKey) {
      return;
    }

    io.to(`user:${participantKey}`).emit(eventName, payload);
  });
}

function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const { verifyAccessToken } = require("../utils/jwt");
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, name: payload.name, email: payload.email };
      return next();
    } catch (_error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    await setUserOnline(userId, socket.id);
    socket.emit("presence:sync", { onlineUserIds: [...onlineUsers.keys()] });
    io.emit("presence:update", { userId, isOnline: true });

    socket.on("conversation:join", (conversationId) => {
      if (conversationId) {
        socket.join(conversationId);
      }
    });

    socket.on("message:send", ({ conversationId, message }) => {
      if (!conversationId || !message) {
        return;
      }

      socket.to(conversationId).emit("message:new", { conversationId, message });
    });

    socket.on("message:typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("message:typing", {
        conversationId,
        userId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("message:delivered", ({ conversationId, messageId }) => {
      socket.to(conversationId).emit("message:delivered", { conversationId, messageId, userId });
    });

    socket.on("message:seen", ({ conversationId, messageId }) => {
      socket.to(conversationId).emit("message:seen", { conversationId, messageId, userId });
    });

    socket.on("call:offer", async ({ conversationId, offer, callType, isRenegotiation }) => {
      if (!conversationId || !offer) {
        return;
      }

      const payload = {
        conversationId,
        offer,
        fromUserId: userId,
        callType: callType || "audio",
        isRenegotiation: Boolean(isRenegotiation),
      };
      await emitCallEventToParticipants(io, conversationId, userId, "call:offer", payload);
    });

    socket.on("call:answer", async ({ conversationId, answer, callType }) => {
      if (!conversationId || !answer) {
        return;
      }

      const payload = {
        conversationId,
        answer,
        fromUserId: userId,
        callType: callType || "audio",
      };
      await emitCallEventToParticipants(io, conversationId, userId, "call:answer", payload);
    });

    socket.on("call:ice-candidate", async ({ conversationId, candidate }) => {
      if (!conversationId || !candidate) {
        return;
      }

      const payload = {
        conversationId,
        candidate,
        fromUserId: userId,
      };
      await emitCallEventToParticipants(io, conversationId, userId, "call:ice-candidate", payload);
    });

    socket.on("call:end", async ({ conversationId }) => {
      if (!conversationId) {
        return;
      }

      const payload = {
        conversationId,
        fromUserId: userId,
      };
      await emitCallEventToParticipants(io, conversationId, userId, "call:end", payload);
    });

    socket.on("disconnect", async () => {
      await setUserOffline(userId, socket.id);
      if (!isUserOnline(userId)) {
        io.emit("presence:update", { userId, isOnline: false, lastSeen: new Date().toISOString() });
      }
    });
  });
}

module.exports = setupSocket;
