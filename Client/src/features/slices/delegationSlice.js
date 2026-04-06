import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

const API_URL = `${API_BASE_URL}/delegations`;

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.token || null;
};

const getAuthConfig = () => {
  const token = getToken();
  if (!token) throw new Error("No token found");
  return {
    timeout: 15000,
    headers: { Authorization: `Bearer ${token}` },
  };
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);
export const createDelegation = createAsyncThunk(
  'delegation/create',
  async (delegationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}`, delegationData, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get all active delegations (HR/SuperAdmin)
export const fetchActiveDelegations = createAsyncThunk(
  'delegation/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/active`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get delegations where current user is assignee
export const fetchMyDelegations = createAsyncThunk(
  'delegation/fetchMyDelegations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/my-delegations`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get delegations where current user is delegator
export const fetchMyDelegatedWork = createAsyncThunk(
  'delegation/fetchMyDelegatedWork',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/my-delegated-work`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// End delegation early
export const endDelegationEarly = createAsyncThunk(
  'delegation/endEarly',
  async ({ delegationId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${delegationId}/end`, { reason }, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get delegation history for a specific team leader
export const fetchDelegationHistory = createAsyncThunk(
  'delegation/fetchHistory',
  async (delegatorId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/history/${delegatorId}`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get all team leaders (for dropdown)
export const fetchTeamLeaders = createAsyncThunk(
  'delegation/fetchTeamLeaders',
  async (date = null, { rejectWithValue }) => {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      const response = await axios.get(`${API_URL}/team-leaders${query}`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Get team members for a specific team leader
export const fetchTeamMembers = createAsyncThunk(
  'delegation/fetchTeamMembers',
  async ({ teamLeaderId, date = null }, { rejectWithValue }) => {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      const response = await axios.get(`${API_URL}/team-leaders/${teamLeaderId}/members${query}`, getAuthConfig());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ==================== Initial State ====================

const initialState = {
  // Data states
  activeDelegations: [],
  myDelegations: [],
  myDelegatedWork: [], // New: delegations where user is the delegator
  delegationHistory: [],
  teamLeaders: [],
  teamMembers: [],
  
  // Loading states
  loading: false,
  creating: false,
  ending: false,
  fetchingHistory: false,
  
  // Error states
  error: null,
  createError: null,
  endError: null,
  historyError: null,
  
  // Current delegation being viewed
  currentDelegation: null,
  
  // Pagination
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 10,
  
  // Filters
  filters: {
    status: 'active',
    startDate: null,
    endDate: null,
    delegatorId: null,
    assigneeId: null,
  },
};

// ==================== Slice ====================

const delegationSlice = createSlice({
  name: 'delegation',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.endError = null;
      state.historyError = null;
    },
    
    setCurrentDelegation: (state, action) => {
      state.currentDelegation = action.payload;
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    clearDelegationData: (state) => {
      state.activeDelegations = [];
      state.myDelegations = [];
      state.myDelegatedWork = [];
      state.delegationHistory = [];
      state.teamLeaders = [];
      state.teamMembers = [];
      state.currentDelegation = null;
    },
    
    setPagination: (state, action) => {
      state.currentPage = action.payload.page;
      state.itemsPerPage = action.payload.limit;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== Create Delegation ==========
      .addCase(createDelegation.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createDelegation.fulfilled, (state, action) => {
        state.creating = false;
        const createdDelegation = action.payload?.delegation;
        if (createdDelegation) {
          state.activeDelegations.unshift(createdDelegation);
          // If the current user is the assignee, add to myDelegations
          // This will be handled by fetch on refresh
        }
        state.createError = null;
      })
      .addCase(createDelegation.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      })
      
      // ========== Fetch Active Delegations ==========
      .addCase(fetchActiveDelegations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDelegations.fulfilled, (state, action) => {
        const safeList = ensureArray(action.payload);
        state.loading = false;
        state.activeDelegations = safeList;
        state.totalCount = safeList.length;
        state.error = null;
        console.log('Active delegations loaded:', safeList.length);
      })
      .addCase(fetchActiveDelegations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch active delegations:', action.payload);
      })
      
      // ========== Fetch My Delegations (Assignee View) ==========
      .addCase(fetchMyDelegations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDelegations.fulfilled, (state, action) => {
        const safeList = ensureArray(action.payload);
        state.loading = false;
        state.myDelegations = safeList;
        state.error = null;
        console.log('My delegations (as assignee) loaded:', safeList.length);
        // Log each delegation for debugging
        safeList.forEach(d => {
          console.log(`  - Delegation: ${d.delegator?.username} -> ${d.assignee?.username} (${d.startDate} to ${d.endDate})`);
        });
      })
      .addCase(fetchMyDelegations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch my delegations:', action.payload);
      })
      
      // ========== Fetch My Delegated Work (Delegator View) ==========
      .addCase(fetchMyDelegatedWork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDelegatedWork.fulfilled, (state, action) => {
        const safeList = ensureArray(action.payload);
        state.loading = false;
        state.myDelegatedWork = safeList;
        state.error = null;
        console.log('My delegated work (as delegator) loaded:', safeList.length);
      })
      .addCase(fetchMyDelegatedWork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch my delegated work:', action.payload);
      })
      
      // ========== End Delegation Early ==========
      .addCase(endDelegationEarly.pending, (state) => {
        state.ending = true;
        state.endError = null;
      })
      .addCase(endDelegationEarly.fulfilled, (state, action) => {
        state.ending = false;
        const updatedDelegation = action.payload;
        if (updatedDelegation?._id) {
          // Update in active delegations
          const index = state.activeDelegations.findIndex(d => d._id === updatedDelegation._id);
          if (index !== -1) {
            state.activeDelegations[index] = updatedDelegation;
          }
          // Update in my delegations
          const myIndex = state.myDelegations.findIndex(d => d._id === updatedDelegation._id);
          if (myIndex !== -1) {
            state.myDelegations[myIndex] = updatedDelegation;
          }
          // Update in my delegated work
          const workIndex = state.myDelegatedWork.findIndex(d => d._id === updatedDelegation._id);
          if (workIndex !== -1) {
            state.myDelegatedWork[workIndex] = updatedDelegation;
          }
        }
        state.endError = null;
      })
      .addCase(endDelegationEarly.rejected, (state, action) => {
        state.ending = false;
        state.endError = action.payload;
      })
      
      // ========== Fetch Delegation History ==========
      .addCase(fetchDelegationHistory.pending, (state) => {
        state.fetchingHistory = true;
        state.historyError = null;
      })
      .addCase(fetchDelegationHistory.fulfilled, (state, action) => {
        state.fetchingHistory = false;
        state.delegationHistory = ensureArray(action.payload);
        state.historyError = null;
      })
      .addCase(fetchDelegationHistory.rejected, (state, action) => {
        state.fetchingHistory = false;
        state.historyError = action.payload;
      })
      
      // ========== Fetch Team Leaders ==========
      .addCase(fetchTeamLeaders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamLeaders.fulfilled, (state, action) => {
        state.loading = false;
        state.teamLeaders = ensureArray(action.payload);
        state.error = null;
        console.log('Team leaders loaded:', state.teamLeaders.length);
      })
      .addCase(fetchTeamLeaders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch team leaders:', action.payload);
      })
      
      // ========== Fetch Team Members ==========
      .addCase(fetchTeamMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.teamMembers = ensureArray(action.payload);
        state.error = null;
        console.log('Team members loaded:', state.teamMembers.length);
      })
      .addCase(fetchTeamMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch team members:', action.payload);
      });
  },
});

// ==================== Selectors ====================

export const selectActiveDelegations = (state) => state.delegation.activeDelegations;
export const selectMyDelegations = (state) => state.delegation.myDelegations;
export const selectMyDelegatedWork = (state) => state.delegation.myDelegatedWork;
export const selectDelegationHistory = (state) => state.delegation.delegationHistory;
export const selectTeamLeaders = (state) => state.delegation.teamLeaders;
export const selectTeamMembers = (state) => state.delegation.teamMembers;

export const selectDelegationLoading = (state) => state.delegation.loading;
export const selectDelegationCreating = (state) => state.delegation.creating;
export const selectDelegationEnding = (state) => state.delegation.ending;
export const selectHistoryLoading = (state) => state.delegation.fetchingHistory;

export const selectDelegationError = (state) => state.delegation.error;
export const selectCreateError = (state) => state.delegation.createError;
export const selectEndError = (state) => state.delegation.endError;

export const selectCurrentDelegation = (state) => state.delegation.currentDelegation;
export const selectDelegationFilters = (state) => state.delegation.filters;

export const selectActiveDelegationForTeamLeader = (state, teamLeaderId) => {
  return state.delegation.activeDelegations.find(
    d => d.delegator?._id === teamLeaderId && d.status === 'active'
  );
};

export const selectIsUserDelegated = (state, userId) => {
  return state.delegation.activeDelegations.some(
    d => d.delegator?._id === userId && d.status === 'active'
  );
};

export const selectIsUserAssignee = (state, userId) => {
  return state.delegation.myDelegations.some(
    d => d.assignee?._id === userId && d.status === 'active'
  );
};

export const selectCurrentUserActiveDelegation = (state, currentUserId) => {
  // As delegator (user is on leave)
  const asDelegator = state.delegation.activeDelegations.find(
    d => d.delegator?._id === currentUserId && d.status === 'active'
  );
  if (asDelegator) return { type: 'delegator', data: asDelegator };
  
  // As assignee (user is handling someone's work)
  const asAssignee = state.delegation.myDelegations.find(
    d => d.assignee?._id === currentUserId && d.status === 'active'
  );
  if (asAssignee) return { type: 'assignee', data: asAssignee };
  
  return null;
};

// ==================== Export Actions ====================

export const {
  clearErrors,
  setCurrentDelegation,
  setFilters,
  resetFilters,
  clearDelegationData,
  setPagination,
} = delegationSlice.actions;

export default delegationSlice.reducer;
