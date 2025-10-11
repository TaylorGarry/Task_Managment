import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "https://task-managment-4.onrender.com/api/v1/review";

// Helper to get token from localStorage
const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

// =====================
// Async Thunks
// =====================

// Add a new review
export const addReview = createAsyncThunk("reviews/addReview", async (data, thunkAPI) => {
  try {
    const token = getToken();
    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Should return created review
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Get reviews for a specific task
export const getReviewsByTask = createAsyncThunk(
  "reviews/getReviewsByTask",
  async (taskId, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // Should return array of reviews
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Resolve a review
export const resolveReview = createAsyncThunk(
  "reviews/resolveReview",
  async (reviewId, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/${reviewId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // Should return updated review
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// =====================
// Slice
// =====================
const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addReview.fulfilled, (state, action) => {
        state.reviews.push(action.payload);
      })
      .addCase(getReviewsByTask.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(resolveReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
      })
      .addCase(addReview.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(getReviewsByTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(resolveReview.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default reviewSlice.reducer;
