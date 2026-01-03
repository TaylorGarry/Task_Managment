import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../api.js";

export const uploadFile = createAsyncThunk(
  "message/uploadFile",
  async ({ file, chatId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (chatId) {
        formData.append("chatId", chatId);
      }
      
      const res = await api.post("/api/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data.media;
      
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async ({ chatId, text, media = [], repliedTo }, { rejectWithValue }) => {
    try { 
      const payload = { 
        chatId, 
        text: text || "",
        media: media,
        repliedTo: repliedTo || null
      };
      
      const res = await api.post("/api/messages/send", payload, {
        headers: { "Content-Type": "application/json" }
      });
      
      return { 
        chatId, 
        message: res.data.message 
      };
      
    } catch (err) {
      console.error("❌ Error sending message:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendMessageWithFiles = createAsyncThunk(
  "message/sendMessageWithFiles",
  async ({ chatId, text, files = [], repliedTo }, { rejectWithValue, dispatch }) => {
    try {
      const uploadPromises = files.map(file => 
        dispatch(uploadFile({ file, chatId })).unwrap()
      );
      
      const uploadedMedia = await Promise.all(uploadPromises);
      const payload = { 
        chatId, 
        text: text || "",
        media: uploadedMedia,
        repliedTo: repliedTo || null
      };
      
      const res = await api.post("/api/messages/send", payload, {
        headers: { "Content-Type": "application/json" }
      });
      return { 
        chatId, 
        message: res.data.message 
      };
      
    } catch (err) {
      console.error("❌ Error sending message with files:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  "message/editMessage",
  async ({ messageId, text }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/messages/${messageId}`, { 
        text: text.trim() 
      });
      return res.data.message || res.data;
      
    } catch (err) {
      console.error("❌ Error editing message:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "message/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/messages/${messageId}`);
      return { messageId, data: res.data };
      
    } catch (err) {
      console.error("❌ Error deleting message:", err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messagesByChat: {},  
    loading: false,
    uploading: false,
    error: null,
    uploadError: null,
    editingMessageId: null,
    deletingMessageId: null,
    uploadedFiles: [],
  },
  reducers: {
    addIncomingMessage: (state, action) => {
      const { chatId, message } = action.payload;
      
      if (!chatId || !message) {
        console.error("Invalid payload for addIncomingMessage:", action.payload);
        return;
      }
      
      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }
      
      const messageExists = state.messagesByChat[chatId].some(
        m => m._id === message._id
      );
      
      if (!messageExists) {
        state.messagesByChat[chatId].push(message);
        
        state.messagesByChat[chatId].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      } 
    },
    
    setMessagesForChat: (state, action) => {
      const { chatId, messages } = action.payload;
      
      if (!chatId) {
        console.error("No chatId in setMessagesForChat:", action.payload);
        return;
      }
      
      const realMessages = messages.filter(
        m => !m._id?.toString().startsWith('temp_')
      );
      
      state.messagesByChat[chatId] = realMessages;
      
      state.messagesByChat[chatId].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
    },
    
    clearMessages: (state) => {
      state.messagesByChat = {};
    },
    
    replaceTempMessage: (state, action) => {
      const { chatId, tempId, realMessage } = action.payload;
      
      if (!state.messagesByChat[chatId]) return;
      
      state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
        m => m._id !== tempId
      );
      
      if (realMessage) {
        const realMessageExists = state.messagesByChat[chatId].some(
          m => m._id === realMessage._id
        );
        
        if (!realMessageExists) {
          state.messagesByChat[chatId].push(realMessage);
          
          state.messagesByChat[chatId].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
      }
    },
    
    updateEditedMessage: (state, action) => {
      const { chatId, messageId, text, isEdited, editedAt, updatedAt } = action.payload;
      
      if (!state.messagesByChat[chatId]) return;
      
      const messageIndex = state.messagesByChat[chatId].findIndex(
        m => m._id === messageId
      );
      
      if (messageIndex !== -1) {
        state.messagesByChat[chatId][messageIndex].content.text = text;
        state.messagesByChat[chatId][messageIndex].isEdited = isEdited || true;
        state.messagesByChat[chatId][messageIndex].editedAt = editedAt || new Date().toISOString();
        state.messagesByChat[chatId][messageIndex].updatedAt = updatedAt || new Date().toISOString();
      }
    },
    
    updateMessageLocally: (state, action) => {
      const { chatId, messageId, updates } = action.payload;
      
      if (!state.messagesByChat[chatId]) return;
      
      const messageIndex = state.messagesByChat[chatId].findIndex(
        m => m._id === messageId
      );
      
      if (messageIndex !== -1) {
        state.messagesByChat[chatId][messageIndex] = {
          ...state.messagesByChat[chatId][messageIndex],
          ...updates
        };
      }
    },
    removeMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      if (!state.messagesByChat[chatId]) return;
      state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
        m => m._id !== messageId
      );
    },
    setEditingMessageId: (state, action) => {
      state.editingMessageId = action.payload;
    },
    setDeletingMessageId: (state, action) => {
      state.deletingMessageId = action.payload;
    },
    clearEditingState: (state) => {
      state.editingMessageId = null;
      state.deletingMessageId = null;
    },
    clearUploadedFiles: (state) => {
      state.uploadedFiles = [];
    },
    
    addUploadedFile: (state, action) => {
      state.uploadedFiles.push(action.payload);
    },
    
    removeUploadedFile: (state, action) => {
      const { publicId } = action.payload;
      state.uploadedFiles = state.uploadedFiles.filter(
        file => file.publicId !== publicId
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadedFiles.push(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, message } = action.payload;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        
        const messageExists = state.messagesByChat[chatId].some(
          m => m._id === message._id
        );
        
        if (!messageExists) {
          state.messagesByChat[chatId].push(message);
          
          state.messagesByChat[chatId].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("❌ sendMessage rejected:", action.payload);
      })
      .addCase(sendMessageWithFiles.pending, (state) => {
        state.loading = true;
        state.uploading = true;
        state.error = null;
        state.uploadError = null;
      })
      .addCase(sendMessageWithFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.uploading = false;
        const { chatId, message } = action.payload;
        
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        
        const messageExists = state.messagesByChat[chatId].some(
          m => m._id === message._id
        );
        
        if (!messageExists) {
          state.messagesByChat[chatId].push(message);
          
          state.messagesByChat[chatId].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
      })
      .addCase(sendMessageWithFiles.rejected, (state, action) => {
        state.loading = false;
        state.uploading = false;
        state.error = action.payload;
      })
      .addCase(editMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        state.loading = false;
        const updatedMessage = action.payload;
        const chatEntries = Object.entries(state.messagesByChat);
        for (const [chatId, messages] of chatEntries) {
          const messageIndex = messages.findIndex(m => m._id === updatedMessage._id);
          if (messageIndex !== -1) {
            state.messagesByChat[chatId][messageIndex] = {
              ...state.messagesByChat[chatId][messageIndex],
              ...updatedMessage
            };
            break;
          }
        }
        
        state.editingMessageId = null;
      })
      .addCase(editMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.editingMessageId = null;
        console.error("❌ editMessage rejected:", action.payload);
      })
      
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { messageId } = action.payload;
        const chatEntries = Object.entries(state.messagesByChat);
        for (const [chatId, messages] of chatEntries) {
          state.messagesByChat[chatId] = messages.filter(m => m._id !== messageId);
        }
        
        state.deletingMessageId = null;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.deletingMessageId = null;
        console.error("❌ deleteMessage rejected:", action.payload);
      });
  },
});

export const { 
  addIncomingMessage, 
  setMessagesForChat, 
  clearMessages,
  replaceTempMessage,
  updateEditedMessage,
  updateMessageLocally,
  removeMessage,
  setEditingMessageId,
  setDeletingMessageId,
  clearEditingState,
  clearUploadedFiles,
  addUploadedFile,
  removeUploadedFile
} = messageSlice.actions;

export default messageSlice.reducer;



