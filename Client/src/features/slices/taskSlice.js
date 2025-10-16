// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "https://task-managment-4.onrender.com/api/v1/tasks";

// // Helper to get token from localStorage
// const getToken = () => {
//   const user = JSON.parse(localStorage.getItem("user"));
//   return user?.token || null;
// };

// // =====================
// // Async Thunks
// // =====================

// // Fetch all tasks
// export const fetchTasks = createAsyncThunk("tasks/fetchTasks", async (_, thunkAPI) => {
//   try {
//     const token = getToken();
//     const res = await axios.get(API_URL, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return res.data; 
//   } catch (err) {
//     return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//   }
// });

// // Create task
// export const createTask = createAsyncThunk(
//   "tasks/createTask",
//   async ({ data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.post(`${API_URL}/create`, data, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data; // Should return created task
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // export const createTask = createAsyncThunk(
// //   "tasks/createTask",
// //   async (taskData, thunkAPI) => {
// //     try {
// //       const token = getToken();
// //       const res = await axios.post(`${API_URL}/create`, taskData, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       return res.data.task; // backend returns { message, task }
// //     } catch (err) {
// //       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
// //     }
// //   }
// // );

// // Update task
// export const updateTask = createAsyncThunk(
//   "tasks/updateTask",
//   async ({ id, updates }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(`${API_URL}/update/${id}`, updates, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data; // Should return updated task
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Delete task
// export const deleteTask = createAsyncThunk("tasks/deleteTask", async (id, thunkAPI) => {
//   try {
//     const token = getToken();
//     await axios.delete(`${API_URL}/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return id;
//   } catch (err) {
//     return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//   }
// });

// // =====================
// // Slice
// // =====================
// const taskSlice = createSlice({
//   name: "tasks",
//   initialState: {
//     tasks: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = action.payload;
//       })
//       .addCase(fetchTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(createTask.fulfilled, (state, action) => {
//         state.tasks.push(action.payload);
//       })
//       .addCase(updateTask.fulfilled, (state, action) => {
//         state.tasks = state.tasks.map((task) =>
//           task._id === action.payload._id ? action.payload : task
//         );
//       })
//       .addCase(deleteTask.fulfilled, (state, action) => {
//         state.tasks = state.tasks.filter((task) => task._id !== action.payload);
//       });
//   },
// });

// export default taskSlice.reducer;

// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/tasks";

// const getToken = () => {
//   const user = JSON.parse(localStorage.getItem("user"));
//   return user?.token || null;
// };

// // Fetch tasks with filters as query params
// export const fetchTasks = createAsyncThunk(
//   "tasks/fetchTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       const token = getToken();
//       const query = new URLSearchParams({
//         date: filters.date || "",
//         shift: filters.shift || "",
//         department: filters.department || "",
//         employeeId: filters.employee || "", // map employee filter to backend
//       }).toString();

//       const res = await axios.get(`${API_URL}?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const createTask = createAsyncThunk(
//   "tasks/createTask",
//   async ({ data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.post(`${API_URL}/create`, data, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       thunkAPI.dispatch(fetchTasks());
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const updateTask = createAsyncThunk(
//   "tasks/updateTask",
//   async ({ id, updates }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(`${API_URL}/update/${id}`, updates, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       thunkAPI.dispatch(fetchTasks());
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const deleteTask = createAsyncThunk(
//   "tasks/deleteTask",
//   async (id, thunkAPI) => {
//     try {
//       const token = getToken();
//       await axios.delete(`${API_URL}/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       thunkAPI.dispatch(fetchTasks());
//       return id;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// // Update task status (employee)
// // In taskSlice.js
// export const updateTaskStatus = createAsyncThunk(
//   "tasks/updateTaskStatus",
//   async ({ id, status }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(
//         `http://localhost:4000/api/v1/task-status/${id}`,
//         { status },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return res.data; // { updatedStatus: {...} }
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );



// const taskSlice = createSlice({
//   name: "tasks",
//   initialState: {
//     tasks: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = action.payload;
//       })
//       .addCase(fetchTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(createTask.fulfilled, (state, action) => {
//         state.tasks.unshift(action.payload);
//       })
//       .addCase(updateTask.fulfilled, (state, action) => {
//         state.tasks = state.tasks.map((task) =>
//           task._id === action.payload._id ? action.payload : task
//         );
//       })
//       .addCase(deleteTask.fulfilled, (state, action) => {
//         state.tasks = state.tasks.filter((task) => task._id !== action.payload);
//       })
//     builder
//       .addCase(updateTaskStatus.fulfilled, (state, action) => {
//         const updatedStatus = action.payload.updatedStatus.status;
//         const taskId = action.payload.updatedStatus.taskId;

//         state.tasks = state.tasks.map((task) =>
//           task._id === taskId ? { ...task, employeeStatus: updatedStatus } : task
//         );
//       });
//   },
// });

// export default taskSlice.reducer;


// taskSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:4000/api/v1/tasks";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

// Fetch tasks
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (filters = {}, thunkAPI) => {
    try {
      const token = getToken();
      const query = new URLSearchParams({
        date: filters.date || "",
        shift: filters.shift || "",
        department: filters.department || "",
        employeeId: filters.employee || "",
      }).toString();
      const res = await axios.get(`${API_URL}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Create a new task
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      thunkAPI.dispatch(fetchTasks());
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update a task
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/update/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      thunkAPI.dispatch(fetchTasks());
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Delete a task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      thunkAPI.dispatch(fetchTasks());
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Update task status (employee only)
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(
        `${API_URL}/status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data.updatedStatus; // return updatedStatus only
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload.task);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.map((task) =>
          task._id === action.payload.task._id ? action.payload.task : task
        );
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task._id !== action.payload);
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        state.tasks = state.tasks.map((task) => {
          if (task._id === updatedStatus.taskId) {
            let doneEmployees = task.doneEmployees || [];
            let notDoneEmployees = task.notDoneEmployees || [];

            doneEmployees = doneEmployees.filter((e) => e._id !== updatedStatus.employeeId);
            notDoneEmployees = notDoneEmployees.filter((e) => e._id !== updatedStatus.employeeId);

            const empObj = { _id: updatedStatus.employeeId, username: updatedStatus.username || "Unknown" };

            if (updatedStatus.status === "Done") doneEmployees.push(empObj);
            else notDoneEmployees.push(empObj);

            return {
              ...task,
              doneEmployees,
              notDoneEmployees,
              employeeStatus:
                task.assignedTo?.some((e) => e._id === updatedStatus.employeeId)
                  ? updatedStatus.status
                  : task.employeeStatus,
            };
          }
          return task;
        });
      });
  },
});

export default taskSlice.reducer;
