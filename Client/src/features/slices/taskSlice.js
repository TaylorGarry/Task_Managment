// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/tasks";
// // const API_URL = "https://task-managment-5.onrender.com/api/v1/tasks"

// const getToken = () => {
//   const user = JSON.parse(localStorage.getItem("user"));
//   return user?.token || null;
// };

// export const fetchTasks = createAsyncThunk(
//   "tasks/fetchTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       const token = getToken();
//       const query = new URLSearchParams({
//         date: filters.date || "",
//         shift: filters.shift || "",
//         department: filters.department || "",
//         employeeId: filters.employee || "",
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
// export const fetchAllTasks = createAsyncThunk(
//   "allTasks/fetchAllTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       const token = getToken();
//       const query = new URLSearchParams();
//       if (filters.date) query.append("date", filters.date);
//       if (filters.shift) query.append("shift", filters.shift);
//       const res = await axios.get(`${API_URL}/AllTasks?${query.toString()}`, {
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
//       return res.data.task;
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
//       return id;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const updateTaskStatus = createAsyncThunk(
//   "tasks/updateTaskStatus",
//   async ({ id, status }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(
//         `${API_URL}/status/${id}`,
//         { status },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return res.data.updatedStatus;  
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const exportTaskStatusExcel = createAsyncThunk(
//   "tasks/exportTaskStatusExcel",
//   async (_, thunkAPI) => {
//     try {
//       const token = getToken();

//       // Calculate last 12 months (ISO dates)
//       const today = new Date();
//       const endDate = today.toISOString().split("T")[0];
//       const startDateObj = new Date(today);
//       startDateObj.setMonth(startDateObj.getMonth() - 12);
//       const startDate = startDateObj.toISOString().split("T")[0];

//       const query = new URLSearchParams({
//         startDate,
//         endDate,
//       }).toString();

//       // Use arraybuffer for binary safety
//       const res = await axios.get(`${API_URL}/export-status?${query}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         },
//         responseType: "arraybuffer",
//       });

//       // Convert to blob
//       const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
//       const blob = new Blob([res.data], { type: mime });

//       // Try to extract filename from Content-Disposition header if present
//       let filename = `Task_Status_${startDate}_to_${endDate}.xlsx`;
//       const contentDisposition = res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"]);
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="?([^"]+)"?/);
//         if (match && match[1]) filename = match[1];
//       }

//       // Return blob + filename so the caller can trigger download
//       return { blob, filename };
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
//   builder
//     .addCase(fetchTasks.pending, (state) => {
//       state.loading = true;
//       state.error = null;
//     })
//     .addCase(fetchTasks.fulfilled, (state, action) => {
//       state.loading = false;
//       state.tasks = action.payload;
//     })
//     .addCase(fetchTasks.rejected, (state, action) => {
//       state.loading = false;
//       state.error = action.payload;
//     })
//     .addCase(fetchAllTasks.pending, (state) => {
//       state.loading = true;
//       state.error = null;
//     })
//     .addCase(fetchAllTasks.fulfilled, (state, action) => {
//       state.loading = false;
//       state.tasks = action.payload;
//     })
//     .addCase(fetchAllTasks.rejected, (state, action) => {
//       state.loading = false;
//       state.error = action.payload;
//     })
//     .addCase(createTask.fulfilled, (state, action) => {
//       state.tasks.unshift(action.payload.task);
//     })
//     .addCase(updateTask.fulfilled, (state, action) => {
//       const updatedTask = action.payload;
//       state.tasks = state.tasks.map((task) =>
//         task._id === updatedTask._id ? updatedTask : task
//       );
//     })
//     .addCase(deleteTask.fulfilled, (state, action) => {
//       state.tasks = state.tasks.filter((task) => task._id !== action.payload);
//     })
//     .addCase(updateTaskStatus.fulfilled, (state, action) => {
//       const updatedStatus = action.payload;
//       state.tasks = state.tasks.map((task) => {
//         if (task._id === updatedStatus.taskId) {
//           let doneEmployees = task.doneEmployees || [];
//           let notDoneEmployees = task.notDoneEmployees || [];

//           doneEmployees = doneEmployees.filter((e) => e._id !== updatedStatus.employeeId);
//           notDoneEmployees = notDoneEmployees.filter((e) => e._id !== updatedStatus.employeeId);

//           const empObj = {
//             _id: updatedStatus.employeeId,
//             username: updatedStatus.username || "Unknown",
//           };

//           if (updatedStatus.status === "Done") doneEmployees.push(empObj);
//           else notDoneEmployees.push(empObj);

//           return {
//             ...task,
//             doneEmployees,
//             notDoneEmployees,
//             employeeStatus:
//               task.assignedTo?.some((e) => e._id === updatedStatus.employeeId)
//                 ? updatedStatus.status
//                 : task.employeeStatus,
//           };
//         }
//         return task;
//       });
//     });
// }
// });

// export default taskSlice.reducer;












import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/tasks";
const API_URL = "https://task-managment-5.onrender.com/api/v1/tasks"

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};
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
      return res.data.updatedStatus;  
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchAllTasks = createAsyncThunk(
  "allTasks/fetchAllTasks",
  async (filters = {}, thunkAPI) => {
    try {
      const token = getToken();
      const query = new URLSearchParams();
      if (filters.date) query.append("date", filters.date);
      if (filters.shift) query.append("shift", filters.shift);
      const res = await axios.get(`${API_URL}/AllTasks?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, updates }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/update/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.task;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const exportTaskStatusExcel = createAsyncThunk(
  "tasks/exportTaskStatusExcel",
  async (_, thunkAPI) => {
    try {
      const token = getToken();

      // Calculate last 12 months (ISO dates)
      const today = new Date();
      const endDate = today.toISOString().split("T")[0];
      const startDateObj = new Date(today);
      startDateObj.setMonth(startDateObj.getMonth() - 12);
      const startDate = startDateObj.toISOString().split("T")[0];

      const query = new URLSearchParams({
        startDate,
        endDate,
      }).toString();

      // Use arraybuffer for binary safety
      const res = await axios.get(`${API_URL}/export-status?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseType: "arraybuffer",
      });

      // Convert to blob
      const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });

      // Try to extract filename from Content-Disposition header if present
      let filename = `Task_Status_${startDate}_to_${endDate}.xlsx`;
      const contentDisposition = res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"]);
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Return blob + filename so the caller can trigger download
      return { blob, filename };
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
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        state.tasks = state.tasks.map((task) => {
          if (task._id === updatedStatus.taskId) {
            let doneEmployees = task.doneEmployees || [];
            let notDoneEmployees = task.notDoneEmployees || [];

            // Remove previous entry of the employee
            doneEmployees = doneEmployees.filter(
              (e) => e._id !== updatedStatus.employeeId
            );
            notDoneEmployees = notDoneEmployees.filter(
              (e) => e._id !== updatedStatus.employeeId
            );

            const empObj = {
              _id: updatedStatus.employeeId,
              username: updatedStatus.username || "Unknown",
            };

            // Add employee to correct list
            if (updatedStatus.status === "Done") doneEmployees.push(empObj);
            else notDoneEmployees.push(empObj);

            // Update employeeStatus for current user
            return {
              ...task,
              doneEmployees,
              notDoneEmployees,
              employeeStatus:
                task.assignedTo?.some(
                  (e) => e._id === updatedStatus.employeeId
                )
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
