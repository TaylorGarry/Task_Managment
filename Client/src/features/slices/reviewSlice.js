import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "https://task-managment-4.onrender.com/api/v1/review";


const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

export const addReview = createAsyncThunk("reviews/addReview", async (data, thunkAPI) => {
  try {
    const token = getToken();
    const res = await axios.post(API_URL, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;  
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const getReviewsByTask = createAsyncThunk(
  "reviews/getReviewsByTask",
  async (taskId, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;  
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const resolveReview = createAsyncThunk(
  "reviews/resolveReview",
  async (reviewId, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/${reviewId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; 
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


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
