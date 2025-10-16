// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "https://task-managment-4.onrender.com/api/v1"; 


// export const loginUser = createAsyncThunk(
//   "auth/loginUser",
//   async (userData, thunkAPI) => {
//     try {
//       const res = await axios.post(`${API_URL}/login`, userData);
//       localStorage.setItem(
//         "user",
//         JSON.stringify({ ...res.data.user, token: res.data.token })
//       );
//       return { ...res.data.user, token: res.data.token };
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const signupUser = createAsyncThunk(
//   "auth/signupUser",
//   async (userData, thunkAPI) => {
//     try {
//       const res = await axios.post(`${API_URL}/signup`, userData);
//       localStorage.setItem(
//         "user",
//         JSON.stringify({ ...res.data.user, token: res.data.token || null })
//       );
//       return { ...res.data.user, token: res.data.token || null };
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
//   localStorage.removeItem("user");
//   await axios.post(`${API_URL}/logout`);
// });


// export const fetchEmployees = createAsyncThunk(
//   "auth/fetchEmployees",
//   async (_, thunkAPI) => {
//     try {
//       const state = thunkAPI.getState();
//       const token = state.auth.user?.token;
//       if (!token) throw new Error("No token found");

//       const res = await axios.get(`${API_URL}/employees`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       return res.data; // array of employee objects
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     user: JSON.parse(localStorage.getItem("user")) || null,
//     employees: [], 
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(signupUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(signupUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload;
//       })
//       .addCase(signupUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(logoutUser.fulfilled, (state) => {
//         state.user = null;
//       })
//       .addCase(fetchEmployees.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchEmployees.fulfilled, (state, action) => {
//         state.loading = false;
//         state.employees = action.payload;
//       })
//       .addCase(fetchEmployees.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default authSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "https://task-managment-4.onrender.com/api/v1"; 
const API_URL = "http://localhost:4000/api/v1"

// =====================
// Async Thunks
// =====================

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, thunkAPI) => {
    try {
      const res = await axios.post(`${API_URL}/login`, userData);
      // Save user + token in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...res.data.user, token: res.data.token })
      );
      return { ...res.data.user, token: res.data.token };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, thunkAPI) => {
    try {
      const res = await axios.post(`${API_URL}/signup`, userData);
      // Save user + token in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...res.data.user, token: res.data.token || null })
      );
      return { ...res.data.user, token: res.data.token || null };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async () => {
    localStorage.removeItem("user");
    await axios.post(`${API_URL}/logout`);
  }
);

export const fetchEmployees = createAsyncThunk(
  "auth/fetchEmployees",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data; // array of employee objects
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// =====================
// Slice
// =====================

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // store signed up user
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      // Fetch Employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;
