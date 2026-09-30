import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api.js";

export const getUserChats = createAsyncThunk(
  "chat/getUserChats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/chats"); 
      return res.data.chats;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getOrCreateOneToOneChat = createAsyncThunk(
  "chat/getOrCreateOneToOneChat",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/chats/one-to-one/${userId}`); 
      return res.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/chats/search?query=${query}`); // <-- add /api prefix
      return res.data.users;  
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    searchResults: [],
    activeChat: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearActiveChat: (state) => {
      state.activeChat = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(getUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getOrCreateOneToOneChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateOneToOneChat.fulfilled, (state, action) => {
        state.loading = false;
        state.activeChat = action.payload;
      })
      .addCase(getOrCreateOneToOneChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchUsers.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(searchUsers.fulfilled, (state, action) => {
    state.loading = false;
    state.searchResults = action.payload;  
  })
  .addCase(searchUsers.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  },
});

export const { clearActiveChat } = chatSlice.actions;
export default chatSlice.reducer;
