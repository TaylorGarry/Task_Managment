import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import taskReducer from "./slices/taskSlice.js";
import reviewReducer from "./slices/reviewSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    reviews: reviewReducer,
  },
});

export default store;
