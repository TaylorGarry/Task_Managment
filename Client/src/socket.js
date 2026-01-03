import { io } from "socket.io-client";

const getUserData = () => {
  try {
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;
      if (!userId) {
        console.warn("⚠️ No userId found in user object");
        return null;
      }
      return {
        userId: userId,
        username: user.username || user.name,
        token: localStorage.getItem("token")
      };
    }
    console.warn("⚠️ No user data found in localStorage");
  } catch (error) {
    console.error("❌ Error getting user data:", error);
  }
  return null;
};

const userData = getUserData();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const socket = io("http://localhost:4000", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: {
    userId: userData?.userId,
    token: userData?.token
  },
  query: {
    userId: userData?.userId
  },
  reconnection: true,
  reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  forceNew: false
});

socket.on("connect", () => {
  reconnectAttempts = 0;  
});

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    socket.connect();
  }
});

socket.on("connect_error", (error) => {
  reconnectAttempts++;
  console.error(`❌ Socket connection error (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
  
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error("Max reconnection attempts reached. Please refresh the page.");
  }
});

socket.on("reconnect", (attemptNumber) => {
  reconnectAttempts = 0;
});

socket.on("reconnect_attempt", (attemptNumber) => {
});

socket.on("reconnect_error", (error) => {
  console.error("❌ Socket reconnection error:", error.message);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Socket reconnection failed after all attempts");
});

socket.on("new_message", (data) => {
});

socket.on("message_edited", (data) => {
});

socket.on("message_deleted", (data) => {
});

socket.on("message_reaction", (data) => {
});

socket.on("user_typing", (data) => {
});

socket.on("user_stop_typing", (data) => {
});

socket.on("message_status_update", (data) => {
});

socket.on("user_online", (data) => {
});

socket.on("user_offline", (data) => {
});

export const reconnectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const updateSocketAuth = () => {
  const newUserData = getUserData();
  if (newUserData?.userId) {
    socket.auth = {
      userId: newUserData.userId,
      token: newUserData.token
    };
    if (!socket.connected) {
      socket.connect();
    }
  }
};

export const isSocketReady = () => {
  return socket && socket.connected && socket.auth?.userId;
};

export const getSocketStatus = () => {
  return {
    connected: socket.connected,
    id: socket.id,
    auth: socket.auth,
    reconnecting: socket.reconnecting,
    reconnectionAttempts: reconnectAttempts
  };
};