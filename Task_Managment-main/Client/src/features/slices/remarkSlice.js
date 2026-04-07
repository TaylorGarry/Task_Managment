
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/remarks`;
//  const API_URL = `${import.meta.env.VITE_API_URL || "https://crm-taskmanagement-api-7eos5.ondigitalocean.app"}/api/remarks`;
 const API_URL = `${import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app"}/api/remarks`;

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
  async ({ taskId, message, receiverId = null, sendToAll = false }, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      const res = await axios.post(
        `${API_URL}/${taskId}`,
        { message, receiverId, sendToAll },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.data.sentToAll && Array.isArray(res.data.remarks)) {
        return {
          remarks: res.data.remarks,
          sentToAll: true,
        };
      }
      return {
        remark: res.data.remark,
        sentToAll: false,
      };
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
        `${API_URL}/update/${remarkId}`,
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

export const deleteRemark = createAsyncThunk(
  "remarks/deleteRemark",
  async (remarkId, { rejectWithValue, getState }) => {
    try {
      const token = getToken(getState);
      await axios.delete(`${API_URL}/${remarkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return remarkId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete remark"
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
    addRemarkToState: (state, action) => {
      state.remarks.push(action.payload);
      state.remarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    addRemarksToState: (state, action) => {
      state.remarks.push(...action.payload);
      state.remarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
      .addCase(addRemark.fulfilled, (state, action) => {
        if (action.payload.sentToAll && Array.isArray(action.payload.remarks)) {
          state.remarks.push(...action.payload.remarks);
        } else {
          state.remarks.push(action.payload.remark);
        }
        state.remarks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      })
      .addCase(updateRemark.fulfilled, (state, action) => {
        const index = state.remarks.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.remarks[index] = action.payload;
      })
      .addCase(deleteRemark.fulfilled, (state, action) => {
        state.remarks = state.remarks.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearRemarks, addRemarkToState, addRemarksToState } =
  remarkSlice.actions;

export default remarkSlice.reducer;
