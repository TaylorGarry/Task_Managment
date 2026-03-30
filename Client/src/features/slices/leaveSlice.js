import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:4000/api/v1/leaves";

const getToken = (state) => state.auth?.user?.token;

const getAuthHeaders = (state) => {
  const token = getToken(state);
  if (!token) throw new Error("No token found");
  return { Authorization: `Bearer ${token}` };
};

const normalizeError = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong";

export const fetchMyLeaveSummary = createAsyncThunk("leave/fetchMyLeaveSummary", async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const res = await axios.get(`${API_URL}/me/summary`, {
      headers: getAuthHeaders(state),
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(normalizeError(err));
  }
});

export const fetchMyLeaveRequests = createAsyncThunk("leave/fetchMyLeaveRequests", async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const res = await axios.get(`${API_URL}/me/requests`, {
      headers: getAuthHeaders(state),
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(normalizeError(err));
  }
});

export const applyLeave = createAsyncThunk("leave/applyLeave", async (payload, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const res = await axios.post(`${API_URL}/apply`, payload, {
      headers: getAuthHeaders(state),
    });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(normalizeError(err));
  }
});

export const fetchAdminLeaveDashboard = createAsyncThunk(
  "leave/fetchAdminLeaveDashboard",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const res = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: getAuthHeaders(state),
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(normalizeError(err));
    }
  }
);

export const fetchAdminLeaveRequests = createAsyncThunk(
  "leave/fetchAdminLeaveRequests",
  async ({ status = "pending", search = "" } = {}, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const res = await axios.get(`${API_URL}/admin/requests`, {
        headers: getAuthHeaders(state),
        params: { status, search },
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(normalizeError(err));
    }
  }
);

export const reviewLeaveRequest = createAsyncThunk(
  "leave/reviewLeaveRequest",
  async ({ requestId, action, comment = "" }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const res = await axios.patch(
        `${API_URL}/admin/requests/${requestId}`,
        { action, comment },
        { headers: getAuthHeaders(state) }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(normalizeError(err));
    }
  }
);

const initialState = {
  mySummary: null,
  myRequests: [],
  adminDashboard: null,
  adminRequests: [],
  loadingSummary: false,
  loadingRequests: false,
  loadingAdminDashboard: false,
  loadingAdminRequests: false,
  applying: false,
  reviewing: false,
  error: null,
  message: null,
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    clearLeaveMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaveSummary.pending, (state) => {
        state.loadingSummary = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveSummary.fulfilled, (state, action) => {
        state.loadingSummary = false;
        state.mySummary = action.payload;
      })
      .addCase(fetchMyLeaveSummary.rejected, (state, action) => {
        state.loadingSummary = false;
        state.error = action.payload;
      })
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.loadingRequests = true;
        state.error = null;
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.loadingRequests = false;
        state.myRequests = action.payload?.requests || [];
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.loadingRequests = false;
        state.error = action.payload;
      })
      .addCase(applyLeave.pending, (state) => {
        state.applying = true;
        state.error = null;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.applying = false;
        if (action.payload?.request) {
          state.myRequests = [action.payload.request, ...state.myRequests];
        }
        state.message = "Leave request submitted successfully";
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.applying = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminLeaveDashboard.pending, (state) => {
        state.loadingAdminDashboard = true;
        state.error = null;
      })
      .addCase(fetchAdminLeaveDashboard.fulfilled, (state, action) => {
        state.loadingAdminDashboard = false;
        state.adminDashboard = action.payload;
      })
      .addCase(fetchAdminLeaveDashboard.rejected, (state, action) => {
        state.loadingAdminDashboard = false;
        state.error = action.payload;
      })
      .addCase(fetchAdminLeaveRequests.pending, (state) => {
        state.loadingAdminRequests = true;
        state.error = null;
      })
      .addCase(fetchAdminLeaveRequests.fulfilled, (state, action) => {
        state.loadingAdminRequests = false;
        state.adminRequests = action.payload?.requests || [];
      })
      .addCase(fetchAdminLeaveRequests.rejected, (state, action) => {
        state.loadingAdminRequests = false;
        state.error = action.payload;
      })
      .addCase(reviewLeaveRequest.pending, (state) => {
        state.reviewing = true;
        state.error = null;
      })
      .addCase(reviewLeaveRequest.fulfilled, (state, action) => {
        state.reviewing = false;
        const updated = action.payload?.request;
        if (updated) {
          state.adminRequests = state.adminRequests.map((row) =>
            String(row._id) === String(updated._id) ? updated : row
          );
          state.myRequests = state.myRequests.map((row) =>
            String(row._id) === String(updated._id) ? updated : row
          );
        }
        state.message = "Leave request reviewed";
      })
      .addCase(reviewLeaveRequest.rejected, (state, action) => {
        state.reviewing = false;
        state.error = action.payload;
      });
  },
});

export const { clearLeaveMessage } = leaveSlice.actions;
export default leaveSlice.reducer;

