
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1";
const API_URL = "https://crm-taskmanagement-api-7eos5.ondigitalocean.app/api/v1";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token;
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, thunkAPI) => {
    try {
      const res = await axios.post(`${API_URL}/login`, userData);

      localStorage.setItem(
        "user",
        JSON.stringify({ ...res.data.user, token: res.data.token })
      );

      return { ...res.data.user, token: res.data.token };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);


export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      const res = await axios.post(`${API_URL}/signup`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { user: res.data.user, createdByAdmin: true };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// CREATE CORE TEAM USER
// ======================================================================
export const createCoreTeamUser = createAsyncThunk(
  "auth/createCoreTeamUser",
  async (userData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      const res = await axios.post(`${API_URL}/createcoreUser`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { user: res.data.user, createdByAdmin: true };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// LOGOUT
// ======================================================================
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  localStorage.removeItem("user");
  await axios.post(`${API_URL}/logout`);
});

// ======================================================================
// FETCH EMPLOYEES (Optimized)
// ======================================================================
export const fetchEmployees = createAsyncThunk(
  "auth/fetchEmployees",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState();

    // 🔥 Prevent duplicate calls
    if (state.auth.employeesLoaded) {
      return state.auth.employees;
    }

    try {
      const token = state.auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// UPDATE PROFILE
// ======================================================================
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (updateData, thunkAPI) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No token found");

      const res = await axios.post(`${API_URL}/update-profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = { ...res.data.user, token };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// UPDATE USER BY ADMIN (WITH PASSWORD RESET SUPPORT)
// ======================================================================
export const updateUserByAdmin = createAsyncThunk(
  "auth/updateUserByAdmin",
  async ({ userId, updateData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      // Prepare the update data
      const dataToSend = { ...updateData };
      
      // If password reset is being done, ensure confirmPassword is included
      if (dataToSend.password && !dataToSend.confirmPassword) {
        // If only password is provided without confirmPassword, use the same value
        dataToSend.confirmPassword = dataToSend.password;
      }

      const res = await axios.put(`${API_URL}/update/${userId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        user: res.data.user,
        passwordReset: res.data.passwordReset || false,
        message: res.data.message || "User updated successfully"
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// RESET USER PASSWORD (SPECIALIZED ACTION FOR PASSWORD RESET ONLY)
// ======================================================================
export const resetUserPassword = createAsyncThunk(
  "auth/resetUserPassword",
  async ({ userId, password, confirmPassword }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      if (!password || !confirmPassword) {
        throw new Error("Password and confirm password are required");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await axios.put(
        `${API_URL}/update/${userId}`,
        { password, confirmPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        user: res.data.user,
        passwordReset: true,
        message: res.data.message || "Password reset successfully"
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

// ======================================================================
// SLICE
// ======================================================================
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,

    // employee caching
    employees: [],
    employeesLoaded: false,

    loading: false,
    error: null,
    status: null,
    message: null,
    
    // Password reset specific state
    passwordResetSuccess: false,
    passwordResetMessage: null,
  },

  reducers: {
    // Clear password reset state
    clearPasswordResetState: (state) => {
      state.passwordResetSuccess = false;
      state.passwordResetMessage = null;
      state.error = null;
    },
    
    // Clear all messages
    clearMessages: (state) => {
      state.error = null;
      state.message = null;
      state.passwordResetMessage = null;
      state.passwordResetSuccess = false;
    }
  },

  extraReducers: (builder) => {
    builder
      // ---------------------------------------------------
      // LOGIN
      // ---------------------------------------------------
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;

        // reset employee cache when user logs in
        state.employees = [];
        state.employeesLoaded = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------------------------------------------
      // SIGNUP
      // ---------------------------------------------------
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------------------------------------------
      // CREATE CORE TEAM USER
      // ---------------------------------------------------
      .addCase(createCoreTeamUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoreTeamUser.fulfilled, (state) => {
        state.loading = false;
        state.status = "succeeded";
      })
      .addCase(createCoreTeamUser.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload;
      })

      // ---------------------------------------------------
      // LOGOUT
      // ---------------------------------------------------
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.employees = [];
        state.employeesLoaded = false;
      })

      // ---------------------------------------------------
      // FETCH EMPLOYEES — optimized
      // ---------------------------------------------------
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
        state.employeesLoaded = true; // 🔥 important
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------------------------------------------
      // UPDATE PROFILE
      // ---------------------------------------------------
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ---------------------------------------------------
      // UPDATE USER BY ADMIN
      // ---------------------------------------------------
      .addCase(updateUserByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSuccess = false;
        state.passwordResetMessage = null;
      })
      .addCase(updateUserByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        
        const { user, passwordReset, message } = action.payload;
        
        // Update employees list
        const index = state.employees.findIndex(
          (u) => u._id === user._id
        );
        if (index !== -1) state.employees[index] = user;
        
        // Handle password reset success state
        if (passwordReset) {
          state.passwordResetSuccess = true;
          state.passwordResetMessage = message;
        }
        
        state.message = message;
      })
      .addCase(updateUserByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.passwordResetSuccess = false;
      })

      // ---------------------------------------------------
      // RESET USER PASSWORD (SPECIALIZED ACTION)
      // ---------------------------------------------------
      .addCase(resetUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSuccess = false;
        state.passwordResetMessage = null;
      })
      .addCase(resetUserPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.passwordResetSuccess = true;
        state.passwordResetMessage = action.payload.message;
        
        // Update employees list with updated user
        const { user } = action.payload;
        const index = state.employees.findIndex(
          (u) => u._id === user._id
        );
        if (index !== -1) state.employees[index] = user;
        
        state.message = action.payload.message;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.passwordResetSuccess = false;
      });
  },
});

export const { clearPasswordResetState, clearMessages } = authSlice.actions;
export default authSlice.reducer;