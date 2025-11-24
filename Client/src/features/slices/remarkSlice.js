import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || " https://task-managment-7.onrender.com"}/api/remarks`;

const getToken = (getState) =>
  getState().auth.user?.token || JSON.parse(localStorage.getItem("user"))?.token;

export const fetchRemarks = createAsyncThunk(
  "remarks/fetchRemarks",
  async (taskId, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const res = await axios.get(`${API_URL}/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data;  
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch remarks"
      );
    }
  }
);

export const addRemark = createAsyncThunk(
  "remarks/addRemark",
  async ({ taskId, message, receiverId = null }, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);

      const res = await axios.post(
        `${API_URL}/${taskId}`,
        { message, receiverId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.remark;  
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add remark"
      );
    }
  }
);

export const updateRemark = createAsyncThunk(
  "remarks/updateRemark",
  async ({ remarkId, message }, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);

      const res = await axios.put(
        `${API_URL}/${remarkId}`,
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.data.remark;  
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update remark"
      );
    }
  }
);

const remarkSlice = createSlice({
  name: "remarks",
  initialState: {
    remarks: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearRemarks: (state) => {
      state.remarks = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchRemarks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRemarks.fulfilled, (state, action) => {
        state.loading = false;
        state.remarks = action.payload;
      })
      .addCase(fetchRemarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addRemark.pending, (state) => {
        state.error = null;
      })
      .addCase(addRemark.fulfilled, (state, action) => {
        state.remarks.push(action.payload);

        state.remarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      })
      .addCase(addRemark.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(updateRemark.pending, (state) => {
        state.error = null;
      })
      .addCase(updateRemark.fulfilled, (state, action) => {
        const index = state.remarks.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.remarks[index] = action.payload;
      })
      .addCase(updateRemark.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearRemarks } = remarkSlice.actions;
export default remarkSlice.reducer;
