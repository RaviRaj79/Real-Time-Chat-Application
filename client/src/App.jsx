import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import api, { registerAuthHooks } from "./lib/api";
import { connectSocket, disconnectSocket, getSocket } from "./lib/socket";
import { useAuthStore } from "./store/authStore";
import chatArtwork from "./assets/chat-artwork.svg";
import "./App.css";

const CHAT_ARTWORK_URL = "https://plus.unsplash.com/premium_vector-1724323019269-36337af5796a?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const formatTime = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const IconPlus = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const IconEmoji = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="10" r="1.1" fill="currentColor" />
    <circle cx="15" cy="10" r="1.1" fill="currentColor" />
    <path d="M8.4 14.3c1 1.3 2.2 2 3.6 2 1.4 0 2.6-.7 3.6-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconMic = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="4" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M7.5 11.5a4.5 4.5 0 0 0 9 0M12 16v4M9 20h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12 20 4l-4 16-4-6-8-2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.6 3.8h2.8l1.1 4.2-1.9 1.7a14 14 0 0 0 4.8 4.8l1.7-1.9 4.2 1.1v2.8c0 .7-.6 1.3-1.3 1.3C10 18.8 5.2 14 5.2 8.4c0-.7.6-1.3 1.3-1.3Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconVideo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="6.5" width="13" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16.5 10 4-2.5v9l-4-2.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.7" fill="currentColor" />
    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    <circle cx="18" cy="12" r="1.7" fill="currentColor" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor" />
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor" />
  </svg>
);

const IconGoogle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const IconGithub = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconLoader = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24" className="spinner">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const safePlay = async (mediaElement) => {
  if (!mediaElement) {
    return;
  }

  try {
    await mediaElement.play();
  } catch {
    // Autoplay can be blocked by browser policy; user interaction will resume playback.
  }
};

// Password strength checker
const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];
  
  if (!password) {
    return { score: 0, feedback: [], level: "none" };
  }
  
  // Length checks
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("At least 8 characters");
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // Character type checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add lowercase letters");
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add uppercase letters");
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add numbers");
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Add special characters");
  }
  
  // Common password check
  const commonPasswords = ["password", "123456", "qwerty", "abc123", "password123"];
  if (commonPasswords.some(cp => password.toLowerCase().includes(cp))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common passwords");
  }
  
  const level = score <= 2 ? "weak" : score <= 4 ? "medium" : "strong";
  
  return { score: Math.min(score, 6), feedback, level };
};

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function App() {
  const chatArtworkSrc = CHAT_ARTWORK_URL || chatArtwork;
  const { user, accessToken, refreshToken, setAuth, setTokens, clearAuth } = useAuthStore();

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ 
    name: "", 
    email: "", 
    password: "",
    confirmPassword: ""
  });
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [], level: "none" });

  const [theme, setTheme] = useState("light");
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [callState, setCallState] = useState({
    active: false,
    incoming: false,
    callType: "audio",
    conversationId: "",
    fromUserId: "",
  });
  const [callError, setCallError] = useState("");
  const [isAcceptingCall, setIsAcceptingCall] = useState(false);
  const [isCameraUpdating, setIsCameraUpdating] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const typingTimeout = useRef(null);
  const chatBodyRef = useRef(null);
  const profileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const incomingCallMetaRef = useRef({ conversationId: "", callType: "audio", fromUserId: "" });
  const pendingIceCandidatesRef = useRef([]);
  const activeConversationIdRef = useRef("");
  const conversationsRef = useRef([]);
  const callStateRef = useRef({ active: false, incoming: false, callType: "audio", conversationId: "", fromUserId: "" });
  const reconnectTimeoutRef = useRef(null);
  const isIceRestartingRef = useRef(false);
  const activeConversationId = activeConversation?._id || "";

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Handle password strength update
  useEffect(() => {
    if (authMode === "register" && authForm.password) {
      setPasswordStrength(checkPasswordStrength(authForm.password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], level: "none" });
    }
  }, [authForm.password, authMode]);

  // Clear validation errors when form changes
  useEffect(() => {
    setValidationErrors({});
    setAuthError("");
  }, [authForm, authMode]);

  useEffect(() => {
    registerAuthHooks({
      getAuthState: () => ({ accessToken: useAuthStore.getState().accessToken, refreshToken: useAuthStore.getState().refreshToken }),
      setTokens,
      onLogout: clearAuth,
    });
  }, [setTokens, clearAuth]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);

    socket.on("presence:sync", ({ onlineUserIds = [] }) => {
      setOnlineUsers((prev) => {
        const next = { ...prev };
        onlineUserIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    });

    socket.on("presence:update", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: isOnline }));
    });

    socket.on("message:new", ({ conversationId, message }) => {
      setConversations((prev) =>
        [...prev]
          .map((conv) => (conv._id === conversationId ? { ...conv, lastMessageAt: message.createdAt } : conv))
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
      );

      if (activeConversationIdRef.current === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("message:typing", ({ conversationId, userId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        const currentSet = new Set(next[conversationId] || []);

        if (isTyping) {
          currentSet.add(userId);
        } else {
          currentSet.delete(userId);
        }

        next[conversationId] = [...currentSet];
        return next;
      });
    });

    socket.on("message:seen", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== messageId) {
            return item;
          }

          const seenBy = new Set([...(item.seenBy || []), userId]);
          return { ...item, seenBy: [...seenBy], status: "seen" };
        }),
      );
    });

    socket.on("call:offer", async ({ conversationId, offer, fromUserId, callType, isRenegotiation }) => {
      if (isRenegotiation && callStateRef.current.active && peerConnectionRef.current && offer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingIceCandidates();
          const renegotiationAnswer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(renegotiationAnswer);
          const socketInstance = getSocket();
          socketInstance?.emit("call:answer", {
            conversationId,
            answer: peerConnectionRef.current.localDescription,
            callType: "video",
          });
          setCallState((prev) => ({ ...prev, callType: "video" }));
          setCallError("");
        } catch {
          setCallError("Video upgrade failed.");
        }
        return;
      }

      const offerSdp = offer?.sdp || "";
      const isVideoOffer = /m=video/i.test(offerSdp);
      const resolvedCallType = callType || (isVideoOffer ? "video" : "audio");
      incomingOfferRef.current = offer;
      incomingCallMetaRef.current = {
        conversationId: conversationId || "",
        callType: resolvedCallType,
        fromUserId: fromUserId || "",
      };
      setActiveConversation((prev) => {
        if (prev?._id === conversationId) {
          return prev;
        }

        const nextConversation = conversationsRef.current.find((conv) => conv._id === conversationId);
        return nextConversation || prev;
      });
      setCallState({
        active: false,
        incoming: true,
        callType: resolvedCallType,
        conversationId,
        fromUserId: fromUserId || "",
      });
    });

    socket.on("call:answer", async ({ answer, callType }) => {
      if (!peerConnectionRef.current || !answer) {
        return;
      }

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIceCandidates();
      if (callType) {
        setCallState((prev) => ({ ...prev, callType }));
      }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      if (!peerConnectionRef.current || !candidate) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        if (peerConnectionRef.current.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch {
        // Ignore malformed ICE candidates.
      }
    });

    socket.on("call:end", () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      incomingOfferRef.current = null;
      setCallState({
        active: false,
        incoming: false,
        callType: "audio",
        conversationId: "",
        fromUserId: "",
      });
      setCallError("");
      setRemoteHasVideo(false);
      pendingIceCandidatesRef.current = [];
      setMicEnabled(true);
      setCameraEnabled(true);
    });

    return () => {
      socket.off("presence:sync");
      socket.off("presence:update");
      socket.off("message:new");
      socket.off("message:typing");
      socket.off("message:seen");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice-candidate");
      socket.off("call:end");
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const loadInitialData = async () => {
      try {
        const [{ data: meRes }, { data: convRes }] = await Promise.all([
          api.get("/auth/me"),
          api.get("/chat/conversations"),
        ]);

        if (!user || meRes.user.id !== user.id) {
          setAuth({ user: meRes.user, accessToken, refreshToken });
        }

        setConversations(convRes.conversations);
      } catch {
        clearAuth();
      }
    };

    loadInitialData();
  }, [accessToken, clearAuth, refreshToken, setAuth, user]);

  useEffect(() => {
    if (!chatBodyRef.current) {
      return;
    }

    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!callState.active && !callState.incoming) {
      return;
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      safePlay(localVideoRef.current);
    }

    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      safePlay(remoteVideoRef.current);
    }

    if (remoteAudioRef.current && remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      safePlay(remoteAudioRef.current);
    }
  }, [callState.active, callState.incoming]);

  const typingText = useMemo(() => {
    if (!activeConversation) {
      return "";
    }

    const ids = (typingUsers[activeConversation._id] || []).filter((id) => id !== user?.id);
    if (ids.length === 0) {
      return "";
    }

    return ids.length === 1 ? "Someone is typing..." : `${ids.length} people are typing...`;
  }, [typingUsers, activeConversation, user?.id]);

  const userInitials = useMemo(() => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const activeChatUser = useMemo(() => {
    if (!activeConversation || !user) {
      return null;
    }

    if (activeConversation.isGroup) {
      return {
        id: "",
        name: activeConversation.name || "Group",
      };
    }

    const target = (activeConversation.participants || []).find((item) => item._id !== user.id);
    if (!target) {
      return {
        id: "",
        name: activeConversation.name || "Conversation",
      };
    }

    return {
      id: target._id,
      name: target.name || "User",
      isOnline: Boolean(target.isOnline),
      lastSeen: target.lastSeen || "",
    };
  }, [activeConversation, user]);

  const activeChatStatus = useMemo(() => {
    if (!activeChatUser?.id) {
      return activeConversation?.isGroup ? "Group chat" : "Offline";
    }

    const presence = onlineUsers[activeChatUser.id];
    if (typeof presence === "boolean") {
      return presence ? "Online" : "Offline";
    }

    return activeChatUser.isOnline ? "Online" : "Offline";
  }, [activeChatUser, activeConversation?.isGroup, onlineUsers]);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    if (authMode === "register") {
      if (!authForm.name.trim()) {
        errors.name = "Name is required";
      } else if (authForm.name.trim().length < 2) {
        errors.name = "Name must be at least 2 characters";
      }
    }
    
    if (!authForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(authForm.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!authForm.password) {
      errors.password = "Password is required";
    } else if (authMode === "register") {
      if (authForm.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (passwordStrength.level === "weak") {
        errors.password = "Password is too weak. " + passwordStrength.feedback.join(", ");
      }
    }
    
    if (authMode === "register") {
      if (!authForm.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (authForm.password !== authForm.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const doAuth = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setAuthError("");
      setIsLoading(true);
      
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = authMode === "login"
        ? { email: authForm.email, password: authForm.password, rememberMe }
        : { name: authForm.name, email: authForm.email, password: authForm.password };

      const { data } = await api.post(endpoint, payload);
      setAuth({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      setAuthForm({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error) {
      if (!error.response) {
        setAuthError("Server unreachable. Start backend on http://localhost:3001");
        return;
      }

      setAuthError(error.response?.data?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const doLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }

      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }

      clearAuth();
      setConversations([]);
      setMessages([]);
      setActiveConversation(null);
      setMoreMenuOpen(false);
      setShowAttachMenu(false);
      setShowEmojiPicker(false);
      setCameraOpen(false);
      setIsRecording(false);
      setCallState({
        active: false,
        incoming: false,
        callType: "audio",
        conversationId: "",
        fromUserId: "",
      });
      disconnectSocket();
    }
  };

  const searchUsers = async (query) => {
    setUserQuery(query);

    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    const { data } = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
    setUsers(data.users || []);
  };

  const startOneToOne = async (targetUserId) => {
    const { data } = await api.post("/chat/conversations", {
      participantIds: [targetUserId],
      isGroup: false,
    });

    setConversations((prev) => {
      const existing = prev.find((item) => item._id === data.conversation._id);
      if (existing) {
        return prev;
      }
      return [data.conversation, ...prev];
    });

    setActiveConversation(data.conversation);
    setUsers([]);
    setUserQuery("");
  };

  const loadMessages = async (conversation, targetPage = 1, append = false) => {
    const { data } = await api.get(`/chat/conversations/${conversation._id}/messages?page=${targetPage}&limit=20`);

    if (append) {
      setMessages((prev) => [...data.messages, ...prev]);
    } else {
      setMessages(data.messages);
    }

    setHasMore(Boolean(data.hasMore));
    setPage(targetPage);

    await api.post(`/chat/conversations/${conversation._id}/seen`);

    const socket = getSocket();
    socket?.emit("conversation:join", conversation._id);
  };

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    await loadMessages(conversation, 1, false);
  };

  const sendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) {
      return;
    }

    const input = messageInput.trim();
    setMessageInput("");

    const { data } = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
      content: input,
      encrypted: true,
    });

    setMessages((prev) => [...prev, data.message]);

    const socket = getSocket();
    socket?.emit("message:send", { conversationId: activeConversation._id, message: data.message });
    socket?.emit("message:typing", { conversationId: activeConversation._id, isTyping: false });
  };

  const emitTyping = () => {
    if (!activeConversation) {
      return;
    }

    const socket = getSocket();
    socket?.emit("message:typing", { conversationId: activeConversation._id, isTyping: true });

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      socket?.emit("message:typing", { conversationId: activeConversation._id, isTyping: false });
    }, 1000);
  };

  const handleEmojiSelect = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
  };

  const handleWallpaperUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setChatWallpaper(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const updateProfileAvatar = async (file) => {
    if (!file || !user) {
      return;
    }

    try {
      const avatarDataUrl = await fileToDataUrl(file);
      const { data } = await api.patch("/users/me", { avatar: avatarDataUrl });
      const updatedUser = data?.user || { ...user, avatar: avatarDataUrl };

      setAuth({ user: updatedUser, accessToken, refreshToken });

      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: (conversation.participants || []).map((participant) =>
            participant._id === updatedUser.id
              ? { ...participant, avatar: updatedUser.avatar }
              : participant,
          ),
        })),
      );

      setMessages((prev) =>
        prev.map((message) =>
          message.sender?._id === updatedUser.id
            ? { ...message, sender: { ...message.sender, avatar: updatedUser.avatar } }
            : message,
        ),
      );
    } catch {
      // Ignore avatar upload failures to keep chat usable.
    }
  };

  const handleProfileInput = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await updateProfileAvatar(file);
  };

  const sendAttachmentMessage = async (file, forcedType = "") => {
    if (!activeConversation || !file) {
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const attachmentType = forcedType || (file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "file");
    const attachment = { url: dataUrl, type: attachmentType, name: file.name || `${attachmentType}-file`, size: file.size || 0 };
    const { data } = await api.post(`/chat/conversations/${activeConversation._id}/messages`, { content: "", attachments: [attachment], encrypted: false });
    setMessages((prev) => [...prev, data.message]);
    const socket = getSocket();
    socket?.emit("message:send", { conversationId: activeConversation._id, message: data.message });
  };

  const handleAttachmentInput = async (event, forcedType = "") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setShowAttachMenu(false);
    if (!file) return;
    await sendAttachmentMessage(file, forcedType);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) recordingChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await sendAttachmentMessage(audioFile, "audio");
        if (recordingStreamRef.current) { recordingStreamRef.current.getTracks().forEach((track) => track.stop()); recordingStreamRef.current = null; }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch { /* Mic permission denied */ }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const deleteMessage = async (messageId, forEveryone = false) => {
    if (!messageId) return;
    try {
      await api.delete(`/chat/messages/${messageId}`, { data: { forEveryone } });
      setMessages((prev) => prev.map((message) => message.id !== messageId ? message : { ...message, deleted: true, content: "", attachments: [] }));
    } catch { /* Ignore */ }
  };

  const closeCamera = () => {
    setCameraOpen(false);
    setCameraError("");
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((track) => track.stop()); cameraStreamRef.current = null; }
  };

  const openCamera = async () => {
    try {
      setShowAttachMenu(false);
      setCameraError("");
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
    } catch { setCameraError("Camera access denied"); }
  };

  const capturePhoto = async () => {
    if (!cameraVideoRef.current || !cameraCanvasRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const photoFile = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
    await sendAttachmentMessage(photoFile, "image");
    closeCamera();
  };

  const releaseBusyMediaDevices = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const endCall = (notify = true, options = {}) => {
    const { clearError = true } = options;
    if (peerConnectionRef.current) { peerConnectionRef.current.onicecandidate = null; peerConnectionRef.current.ontrack = null; peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((track) => track.stop()); localStreamRef.current = null; }
    if (remoteStreamRef.current) { remoteStreamRef.current.getTracks().forEach((track) => track.stop()); remoteStreamRef.current = null; }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (notify && callState.conversationId) { const socket = getSocket(); socket?.emit("call:end", { conversationId: callState.conversationId }); }
    incomingOfferRef.current = null;
    incomingCallMetaRef.current = { conversationId: "", callType: "audio", fromUserId: "" };
    setCallState({ active: false, incoming: false, callType: "audio", conversationId: "", fromUserId: "" });
    if (clearError) setCallError("");
    setRemoteHasVideo(false);
    pendingIceCandidatesRef.current = [];
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    isIceRestartingRef.current = false;
    setMicEnabled(true);
    setCameraEnabled(true);
    setIsAcceptingCall(false);
  };

  const flushPendingIceCandidates = async () => {
    if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) return;
    const queue = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queue) {
      try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* Ignore */ }
    }
  };

  const createPeerConnection = (conversationId) => {
    const socket = getSocket();
    const peerConnection = new RTCPeerConnection(RTC_CONFIG);
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    peerConnection.onicecandidate = (event) => { if (event.candidate) socket?.emit("call:ice-candidate", { conversationId, candidate: event.candidate.toJSON() }); };
    peerConnection.ontrack = (event) => {
      const [incomingStream] = event.streams || [];
      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incomingStream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = incomingStream;
        if (incomingStream.getVideoTracks().length > 0) setRemoteHasVideo(true);
      } else if (remoteStreamRef.current) {
        const incomingTrack = event.track;
        const alreadyExists = remoteStreamRef.current.getTracks().some((track) => track.id === incomingTrack.id);
        if (!alreadyExists) remoteStreamRef.current.addTrack(incomingTrack);
        if (incomingTrack.kind === "video") setRemoteHasVideo(true);
      }
      if (event.track) {
        event.track.onunmute = () => {
          if (event.track.kind === "video") setRemoteHasVideo(true);
          safePlay(remoteVideoRef.current);
          safePlay(remoteAudioRef.current);
        };
      }
      safePlay(remoteVideoRef.current);
      safePlay(remoteAudioRef.current);
    };
    const restartIceIfNeeded = async () => {
      if (!callStateRef.current.active || isIceRestartingRef.current) {
        return;
      }

      try {
        isIceRestartingRef.current = true;
        const restartOffer = await peerConnection.createOffer({ iceRestart: true });
        await peerConnection.setLocalDescription(restartOffer);
        socket?.emit("call:offer", {
          conversationId,
          offer: peerConnection.localDescription,
          callType: callStateRef.current.callType || "audio",
          isRenegotiation: true,
        });
      } catch {
        setCallError("Connection unstable. Please retry call.");
      } finally {
        isIceRestartingRef.current = false;
      }
    };

    const scheduleRecovery = () => {
      if (reconnectTimeoutRef.current) {
        return;
      }

      reconnectTimeoutRef.current = setTimeout(async () => {
        reconnectTimeoutRef.current = null;
        if (!peerConnectionRef.current) {
          return;
        }

        const unstableStates = ["disconnected", "failed"];
        if (
          unstableStates.includes(peerConnection.connectionState)
          || unstableStates.includes(peerConnection.iceConnectionState)
        ) {
          setCallError("Connection unstable, reconnecting...");
          await restartIceIfNeeded();
        }
      }, 2500);
    };

    const clearRecovery = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        clearRecovery();
        if (callError === "Connection unstable, reconnecting...") {
          setCallError("");
        }
        return;
      }

      if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "failed") {
        scheduleRecovery();
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
        clearRecovery();
        if (callError === "Connection unstable, reconnecting...") {
          setCallError("");
        }
        return;
      }

      if (peerConnection.iceConnectionState === "disconnected" || peerConnection.iceConnectionState === "failed") {
        scheduleRecovery();
      }
    };
    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startCall = async (callType = "audio") => {
    if (!activeConversation) return;
    try {
      releaseBusyMediaDevices();
      setCallError("");
      let resolvedCallType = callType;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
      } catch (error) {
        const isBusyDevice = error?.name === "NotReadableError" || error?.name === "TrackStartError";
        if (callType === "video" && isBusyDevice) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          resolvedCallType = "audio";
          setCallError("Camera busy: call switched to audio.");
        } else {
          throw error;
        }
      }
      stream.getAudioTracks().forEach((track) => { track.enabled = true; });
      stream.getVideoTracks().forEach((track) => { track.enabled = true; });
      localStreamRef.current = stream;
      const hasVideoTrack = stream.getVideoTracks().length > 0;
      setRemoteHasVideo(false);
      setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
      setCameraEnabled(hasVideoTrack && stream.getVideoTracks().some((track) => track.enabled));
      if (resolvedCallType === "video" && !hasVideoTrack) { setCallError("Camera video track unavailable"); return; }
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; safePlay(localVideoRef.current); }
      const peerConnection = createPeerConnection(activeConversation._id);
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const socket = getSocket();
      socket?.emit("call:offer", { conversationId: activeConversation._id, offer: peerConnection.localDescription, callType: resolvedCallType });
      setCallState({ active: true, incoming: false, callType: resolvedCallType, conversationId: activeConversation._id, fromUserId: "" });
    } catch (error) { setCallError(error?.message || "Call permission denied"); }
  };

  const acceptIncomingCall = async () => {
    if (isAcceptingCall) return;
    const incomingMeta = incomingCallMetaRef.current;
    const conversationId = incomingMeta.conversationId || callState.conversationId || activeConversation?._id;
    const incomingOffer = incomingOfferRef.current;
    if (!conversationId || !incomingOffer) {
      setCallError("Incoming call data missing. Please ask caller to retry.");
      return;
    }
    try {
      setIsAcceptingCall(true);
      releaseBusyMediaDevices();
      setCallError("");
      const offerSdp = incomingOffer?.sdp || "";
      const expectsVideo = /m=video/i.test(offerSdp);
      let callType = expectsVideo ? "video" : (incomingMeta.callType || callState.callType || "audio");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
      } catch (error) {
        const isBusyDevice = error?.name === "NotReadableError" || error?.name === "TrackStartError";
        if (callType === "video" && isBusyDevice) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          // Keep video call mode so remote video can still be received.
          setCallError("Camera busy: your camera is off, but remote video will continue.");
        } else {
          throw error;
        }
      }
      stream.getAudioTracks().forEach((track) => { track.enabled = true; });
      stream.getVideoTracks().forEach((track) => { track.enabled = true; });
      localStreamRef.current = stream;
      const hasVideoTrack = stream.getVideoTracks().length > 0;
      setRemoteHasVideo(false);
      setMicEnabled(stream.getAudioTracks().some((track) => track.enabled));
      setCameraEnabled(hasVideoTrack && stream.getVideoTracks().some((track) => track.enabled));
      if (callType === "video" && !hasVideoTrack) {
        setCallError("Camera unavailable on your side. Continuing with remote video only.");
      }
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; safePlay(localVideoRef.current); }
      const peerConnection = createPeerConnection(conversationId);
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      await flushPendingIceCandidates();
      const localAnswer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(localAnswer);
      const socket = getSocket();
      socket?.emit("call:answer", { conversationId, answer: peerConnection.localDescription, callType });
      setCallState((prev) => ({ ...prev, active: true, incoming: false, conversationId, callType }));
      setIsAcceptingCall(false);
    } catch (error) {
      setCallError(error?.message || "Unable to accept call");
      endCall(true, { clearError: false });
    }
  };

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const nextEnabled = !micEnabled;
    localStreamRef.current.getAudioTracks().forEach((track) => { track.enabled = nextEnabled; });
    setMicEnabled(nextEnabled);
  };

  const toggleCamera = () => {
    if (!localStreamRef.current || isCameraUpdating) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextEnabled = !cameraEnabled;
      videoTracks.forEach((track) => { track.enabled = nextEnabled; });
      setCameraEnabled(nextEnabled);
      return;
    }

    const addCameraTrack = async () => {
      if (!peerConnectionRef.current || !callState.conversationId) {
        setCallError("Call not ready for camera update.");
        return;
      }

      try {
        setIsCameraUpdating(true);
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        if (!cameraTrack) {
          setCallError("Camera track unavailable.");
          return;
        }

        localStreamRef.current.addTrack(cameraTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          safePlay(localVideoRef.current);
        }

        const videoTransceiver = peerConnectionRef.current
          .getTransceivers()
          .find((transceiver) => transceiver.receiver?.track?.kind === "video");
        const existingVideoSender = videoTransceiver?.sender
          || peerConnectionRef.current.getSenders().find((sender) => sender.track?.kind === "video");
        if (existingVideoSender) {
          await existingVideoSender.replaceTrack(cameraTrack);
        } else {
          peerConnectionRef.current.addTrack(cameraTrack, localStreamRef.current);
        }

        const renegotiationOffer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(renegotiationOffer);
        const socket = getSocket();
        socket?.emit("call:offer", {
          conversationId: callState.conversationId,
          offer: peerConnectionRef.current.localDescription,
          callType: "video",
          isRenegotiation: true,
        });

        setCameraEnabled(true);
        setCallState((prev) => ({ ...prev, callType: "video" }));
        setCallError("");
      } catch (error) {
        setCallError(error?.message || "Unable to start camera");
      } finally {
        setIsCameraUpdating(false);
      }
    };

    addCameraTrack();
  };

  if (!accessToken || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-hero">
            <div className="hero-visual">
              <img src={chatArtworkSrc} alt="Realtime chat visual" className="hero-image" />
              <span className="floating-badge badge-top">IMG</span>
              <span className="floating-badge badge-left">LIVE</span>
              <span className="floating-badge badge-right">SYNC</span>
            </div>
            <div className="hero-copy">
              <h1>Advanced Realtime Chat</h1>
              <p>JWT + Refresh Tokens + Socket.IO + Presence + Read Receipts</p>
            </div>
          </div>

          {authMode === "register" && (
            <>
              <input
                value={authForm.name}
                placeholder="Full name"
                className={validationErrors.name ? "input-error" : ""}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              {validationErrors.name && <div className="field-error">{validationErrors.name}</div>}
            </>
          )}

          <div className="input-wrapper">
            <input
              type="email"
              value={authForm.email}
              placeholder="Email"
              className={validationErrors.email ? "input-error" : ""}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          {validationErrors.email && <div className="field-error">{validationErrors.email}</div>}

          <div className="input-wrapper password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={authForm.password}
              placeholder="Password"
              className={validationErrors.password ? "input-error" : ""}
              onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          {validationErrors.password && <div className="field-error">{validationErrors.password}</div>}

          {authMode === "register" && (
            <>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={authForm.confirmPassword}
                  placeholder="Confirm password"
                  className={validationErrors.confirmPassword ? "input-error" : ""}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {validationErrors.confirmPassword && <div className="field-error">{validationErrors.confirmPassword}</div>}
              
              {authForm.password && passwordStrength.level !== "none" && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div className={`strength-fill ${passwordStrength.level}`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                  </div>
                  <span className={`strength-label ${passwordStrength.level}`}>
                    {passwordStrength.level === "weak" ? "Weak" : passwordStrength.level === "medium" ? "Medium" : "Strong"}
                  </span>
                </div>
              )}
            </>
          )}

          {authMode === "login" && (
            <div className="auth-options">
              <label className="remember-me">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-password">Forgot password?</button>
            </div>
          )}

          {authError && <div className="error-banner">{authError}</div>}

          <button type="button" className="primary-btn" onClick={doAuth} disabled={isLoading}>
            {isLoading ? <IconLoader /> : (authMode === "login" ? "Login" : "Create Account")}
          </button>

          <div className="social-divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <button type="button" className="social-btn google">
              <IconGoogle />
              <span>Google</span>
            </button>
            <button type="button" className="social-btn github">
              <IconGithub />
              <span>GitHub</span>
            </button>
          </div>

          <button
            type="button"
            className="text-btn"
            onClick={() => setAuthMode((prev) => (prev === "login" ? "register" : "login"))}
          >
            {authMode === "login" ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="chat-shell">
      <aside className="sidebar">
        <div className="panel-header">
          <div className="user-block">
            <div className="user-avatar" role="button" tabIndex={0} onClick={() => profileInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); profileInputRef.current?.click(); } }}>
              {user.avatar ? <img src={user.avatar} alt={`${user.name} avatar`} className="avatar-image" /> : <span>{userInitials}</span>}
              <button type="button" className="avatar-edit-btn" title="Update profile photo" aria-label="Update profile photo" onClick={(event) => { event.stopPropagation(); profileInputRef.current?.click(); }}>+</button>
              <i className="presence-dot" />
            </div>
            <div><strong>{user.name}</strong><p>{user.email}</p></div>
          </div>
          <div className="actions">
            <button type="button" className="theme-btn" onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}>{theme === "light" ? "Dark" : "Light"}</button>
            <button type="button" className="logout-btn" onClick={doLogout}>Logout</button>
          </div>
        </div>
        <input className="search-input" value={userQuery} placeholder="Search users or email" onChange={(event) => searchUsers(event.target.value)} />
        {users.length > 0 && <div className="search-results">{users.map((item) => <button key={item._id} type="button" onClick={() => startOneToOne(item._id)}><span>{item.name}</span><small>{onlineUsers[item._id] || item.isOnline ? "Online" : "Offline"}</small></button>)}</div>}
        <h3>Conversations</h3>
        <div className="conversation-list">
          {conversations.map((conversation) => {
            const title = conversation.isGroup ? conversation.name || "Unnamed Group" : (conversation.participants || []).find((item) => item._id !== user.id)?.name || "Direct chat";
            return <button key={conversation._id} type="button" className={`conversation-item ${activeConversation?._id === conversation._id ? "active" : ""}`} onClick={() => openConversation(conversation)}><strong className="conversation-title">{title}</strong><small>{new Date(conversation.lastMessageAt).toLocaleString()}</small></button>;
          })}
        </div>
      </aside>
      <section className="chat-panel">
        {!activeConversation ? (
          <div className="empty-chat"><img src={chatArtworkSrc} alt="Chat illustration" /><p>Select or create a conversation to start chatting.</p></div>
        ) : (
          <>
            <header className="chat-header">
              <div className="chat-title-wrap"><strong>{activeChatUser?.name || activeConversation.name || "Conversation"}</strong><p>{typingText || activeChatStatus}</p></div>
              <div className="chat-controls">
                <button type="button" className="icon-circle-btn" title="Voice call" onClick={() => startCall("audio")}><IconPhone /></button>
                <button type="button" className="icon-circle-btn" title="Video call" onClick={() => startCall("video")}><IconVideo /></button>
                <button type="button" className="icon-circle-btn" title="More" onClick={() => setMoreMenuOpen((prev) => !prev)}><IconMore /></button>
                {moreMenuOpen && <div className="more-menu"><button type="button" onClick={openCamera}>Camera</button><button type="button" onClick={() => documentInputRef.current?.click()}>Document</button><button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)}>Emoji</button><button type="button" onClick={doLogout}>Logout</button></div>}
              </div>
              {hasMore && <button type="button" className="load-older-btn" onClick={() => loadMessages(activeConversation, page + 1, true)}>Load older</button>}
            </header>
            <div className={`chat-body ${chatWallpaper ? "chat-body-with-wallpaper" : ""}`} style={chatWallpaper ? { backgroundImage: `linear-gradient(rgba(12, 20, 38, 0.3), rgba(12, 20, 38, 0.3)), url(${chatWallpaper})` } : undefined} ref={chatBodyRef}>
              {messages.map((message) => {
                const mine = message.sender?._id === user.id;
                const senderName = message.sender?.name || "User";
                const attachments = message.attachments || [];
                return (
                  <div key={message.id} className={`msg-row ${mine ? "mine" : "other"}`}>
                    {!mine && <div className="msg-avatar">{message.sender?.avatar ? <img src={message.sender.avatar} alt={`${senderName} avatar`} className="msg-avatar-image" /> : senderName.slice(0, 1).toUpperCase()}</div>}
                    <div className="msg-stack">
                      <div className="bubble">
                        {message.deleted ? <p>Message removed</p> : <>
                          {message.content ? <p>{message.content}</p> : null}
                          {attachments.length > 0 && <div className="attachment-list">{attachments.map((attachment, index) => <div key={`${attachment.url}-${index}`} className="attachment-item">{attachment.type === "image" ? <img src={attachment.url} alt={attachment.name || "image"} className="attachment-image" /> : null}{attachment.type === "audio" ? <audio controls src={attachment.url} className="attachment-audio" /> : null}{attachment.type === "file" ? <a href={attachment.url} download={attachment.name || "document"} className="attachment-file">{attachment.name || "Download file"}</a> : null}</div>)}</div>}
                        </>}
                        {!message.deleted && <div className="msg-actions"><button type="button" onClick={() => deleteMessage(message.id, false)}>Delete for me</button>{mine && <button type="button" onClick={() => deleteMessage(message.id, true)}>Delete for everyone</button>}</div>}
                      </div>
                      <small className="msg-time">{formatTime(message.createdAt)} {mine ? `- ${message.status}` : ""}</small>
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="chat-footer">
              {showEmojiPicker && <div className="emoji-picker-panel"><Suspense fallback={<div className="emoji-loader">Loading emojis...</div>}><EmojiPicker onEmojiClick={handleEmojiSelect} width="100%" lazyLoadEmojis theme={theme === "dark" ? "dark" : "light"} /></Suspense></div>}
              {showAttachMenu && <div className="attach-menu"><button type="button" onClick={openCamera}>Camera</button><button type="button" onClick={() => documentInputRef.current?.click()}>Document</button><button type="button" onClick={() => wallpaperInputRef.current?.click()}>Wallpaper</button></div>}
              {cameraOpen && <div className="camera-modal"><div className="camera-panel"><div className="camera-head"><strong>Camera</strong><button type="button" onClick={closeCamera}>Close</button></div><video ref={cameraVideoRef} autoPlay playsInline muted className="camera-preview" />{cameraError ? <p className="camera-error">{cameraError}</p> : null}<div className="camera-actions"><button type="button" onClick={capturePhoto}>Capture</button></div><canvas ref={cameraCanvasRef} className="hidden-input" /></div></div>}
              {callState.incoming && <div className="call-banner"><span>Incoming {callState.callType} call</span><div className="call-actions-inline"><button type="button" onClick={acceptIncomingCall} disabled={isAcceptingCall}>{isAcceptingCall ? "Accepting..." : "Accept"}</button><button type="button" onClick={() => endCall(false)} disabled={isAcceptingCall}>Decline</button></div></div>}
              {callState.active && <div className="call-actions-inline"><button type="button" onClick={toggleMic}>{micEnabled ? "Mute mic" : "Unmute mic"}</button>{callState.callType === "video" && <button type="button" onClick={toggleCamera} disabled={isCameraUpdating}>{isCameraUpdating ? "Updating..." : cameraEnabled ? "Stop camera" : "Start camera"}</button>}<button type="button" onClick={() => endCall(false)}>End call</button></div>}
              {callError ? <p className="call-error">{callError}</p> : null}
              {callState.active && (callState.callType === "video" ? (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" onLoadedMetadata={() => safePlay(remoteVideoRef.current)} />
                  {!remoteHasVideo && <div className="video-waiting">Waiting for remote video...</div>}
                </>
              ) : (
                <>
                  <div className="audio-placeholder">Audio call connected</div>
                </>
              ))}
              <div className="composer-wa">
                <div className="composer-chip">
                  <button type="button" className="icon-btn" title="More options" onClick={() => setShowAttachMenu((prev) => !prev)}><IconPlus /></button>
                  <button type="button" className="icon-btn" title="Emoji picker" onClick={() => setShowEmojiPicker((prev) => !prev)}><IconEmoji /></button>
                  <input className="wa-input" value={messageInput} placeholder="Type a message" onChange={(event) => { setMessageInput(event.target.value); emitTyping(); }} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} />
                  <button type="button" className="icon-btn send-mic-btn" onClick={() => { if (messageInput.trim()) { sendMessage(); } else if (isRecording) { stopVoiceRecording(); } else { startVoiceRecording(); } }} title={messageInput.trim() ? "Send message" : isRecording ? "Stop recording" : "Voice message"}>{messageInput.trim() ? <IconSend /> : <IconMic />}</button>
                </div>
                {isRecording && <div className="recording-indicator">Recording voice...</div>}
                {chatWallpaper && <button type="button" className="clear-wallpaper-inline" onClick={() => setChatWallpaper("")}>Clear wallpaper</button>}
              </div>
              <input ref={profileInputRef} className="hidden-input" type="file" accept="image/*" onChange={handleProfileInput} />
              <input ref={documentInputRef} className="hidden-input" type="file" onChange={(event) => handleAttachmentInput(event, "file")} />
              <input ref={wallpaperInputRef} className="hidden-input" type="file" accept="image/*" onChange={handleWallpaperUpload} />
              <audio ref={remoteAudioRef} autoPlay playsInline className="call-remote-audio" />
              <div className="composer legacy-hidden">
                <input value={messageInput} placeholder="Type a message" onChange={(event) => { setMessageInput(event.target.value); emitTyping(); }} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} />
                <button type="button" className="send-fab" onClick={sendMessage}>Send</button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
