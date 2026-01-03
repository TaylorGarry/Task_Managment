import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import taskReducer from "./slices/taskSlice.js";
import reviewReducer from "./slices/reviewSlice.js";
import remarkReducer from "./slices/remarkSlice.js";
import rosterReducer from "./slices/rosterSlice.js";
import chatReducer from "./slices/chatSlice.js";
import messageReducer from "./slices/messageSlice.js";
const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    reviews: reviewReducer,
    remarks: remarkReducer,
    roster: rosterReducer,
    chat: chatReducer,
    message: messageReducer,
  },
});

export default store;
