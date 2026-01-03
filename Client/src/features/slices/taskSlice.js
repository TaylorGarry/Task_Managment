// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/tasks";
// // const API_URL = "https://crm-taskmanagement-api-7eos5.ondigitalocean.app/api/v1/tasks";
// // const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks";

// const getToken = () => {
//   const user = JSON.parse(localStorage.getItem("user"));
//   return user?.token || null;
// };

 
// const cache = {
//   tasks: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,  
//   },
//   coreTasks: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,  
//   },
//   defaulters: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,  
//   },
//   defaultList: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,  
//   },
//   adminTasks: {   // <-- add this
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,
//   }
// };


// const isCacheValid = (cacheKey, filters) => {
//   const cacheItem = cache[cacheKey];
//   if (!cacheItem.data || !cacheItem.timestamp) return false;
  
//   const areFiltersSame = JSON.stringify(cacheItem.filters) === JSON.stringify(filters);
//   if (!areFiltersSame) return false;
  
//   const now = Date.now();
//   return (now - cacheItem.timestamp) < cacheItem.CACHE_DURATION;
// };

// export const createTask = createAsyncThunk(
//   "tasks/createTask",
//   async ({ data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.post(`${API_URL}/create`, data, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
      
//       thunkAPI.dispatch(fetchTasks());
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const createCoreTask = createAsyncThunk(
//   "tasks/coretask",
//   async ({ data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.post(`${API_URL}/create/coretask`, data, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.coreTasks.data = null;
//       cache.coreTasks.timestamp = null;
      
//       thunkAPI.dispatch(fetchTasks());
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(
//         err.response?.data?.message || err.message
//       );
//     }
//   }
// );

// export const fetchTasks = createAsyncThunk(
//   "tasks/fetchTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       if (isCacheValid('tasks', filters)) {
//         return cache.tasks.data;
//       }
      
//       const token = getToken();

//       const query = new URLSearchParams({
//         startDate: filters.startDate || "",
//         endDate: filters.endDate || "",
//         shift: filters.shift || "",
//         department: filters.department || "",
//         employeeId: filters.employee || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.tasks.data = res.data;
//       cache.tasks.timestamp = Date.now();
//       cache.tasks.filters = filters;
      
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const fetchCoreTasks = createAsyncThunk(
//   "tasks/fetchCoreTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       if (isCacheValid('coreTasks', filters)) {
//         return cache.coreTasks.data;
//       }
      
//       const token = getToken();

//       const query = new URLSearchParams({
//         department: filters.department || "",
//         employeeId: filters.employee || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}/coreteamTask?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.coreTasks.data = res.data;
//       cache.coreTasks.timestamp = Date.now();
//       cache.coreTasks.filters = filters;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(
//         err.response?.data?.message || err.message
//       );
//     }
//   }
// );

// export const fetchDefaulters = createAsyncThunk(
//   "tasks/fetchDefaulters",
//   async (filters = {}, thunkAPI) => {
//     try {
//       if (isCacheValid('defaulters', filters)) {
//         return cache.defaulters.data;
//       }
      
//       const token = getToken();

//       const query = new URLSearchParams({
//         startDate: filters.startDate || "",
//         endDate: filters.endDate || "",
//         shift: filters.shift || "",
//         department: filters.department || "",
//         employeeId: filters.employee || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}/defaulter?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const { data, totalDefaulters, overallTotalDefaults } = res.data;

//       const responseData = {
//         defaulters: data || [],
//         totalDefaulters: totalDefaulters || 0,
//         overallTotalDefaults: overallTotalDefaults || 0,
//       };
      
//       cache.defaulters.data = responseData;
//       cache.defaulters.timestamp = Date.now();
//       cache.defaulters.filters = filters;

//       return responseData;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const fetchDefaultList = createAsyncThunk(
//   "tasks/fetchDefaultList",
//   async (filters = {}, thunkAPI) => {
//     try {
//       if (isCacheValid('defaultList', filters)) {
//         return cache.defaultList.data;
//       }
      
//       const token = getToken();

//       const query = new URLSearchParams({
//         filterType: filters.filterType || "day",
//         department: filters.department || "",
//         shift: filters.shift || "",
//         employeeId: filters.employeeId || "",
//         startDate: filters.startDate || "",
//         endDate: filters.endDate || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}/defaultList?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const responseData = {
//         totalDefaults: res.data.totalDefaults || 0,
//         data: res.data.data || [],
//       };
      
//       cache.defaultList.data = responseData;
//       cache.defaultList.timestamp = Date.now();
//       cache.defaultList.filters = filters;

//       return responseData;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(
//         err.response?.data?.message || err.message
//       );
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
      
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
      
//       return res.data.updatedStatus;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const updateTaskStatusCoreTeam = createAsyncThunk(
//   "tasks/updateTaskStatusCoreTeam",
//   async ({ id, status }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(
//         `${API_URL}/status/core/${id}`,  
//         { status },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       cache.coreTasks.data = null;
//       cache.coreTasks.timestamp = null;
      
//       return res.data.updatedStatus;
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
      
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
      
//       return id;
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

// export const updateTask = createAsyncThunk(
//   "tasks/updateTask",
//   async ({ id, updates }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(`${API_URL}/update/${id}`, updates, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
      
//       return res.data.task;
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

//       const today = new Date();
//       const endDate = today.toISOString().split("T")[0];
//       const startDateObj = new Date(today);
//       startDateObj.setMonth(startDateObj.getMonth() - 12);
//       const startDate = startDateObj.toISOString().split("T")[0];

//       const query = new URLSearchParams({
//         startDate,
//         endDate,
//       }).toString();

//       const res = await axios.get(`${API_URL}/export-status?${query}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         },
//         responseType: "arraybuffer",
//       });

//       const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
//       const blob = new Blob([res.data], { type: mime });

//       let filename = `Task_Status_${startDate}_to_${endDate}.xlsx`;
//       const contentDisposition = res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"]);
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="?([^"]+)"?/);
//         if (match && match[1]) filename = match[1];
//       }

//       return { blob, filename };
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const fetchAdminTasks = createAsyncThunk(
//   "tasks/fetchAdminTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
//       const token = getToken();
//       const user = JSON.parse(localStorage.getItem("user"));

//       const query = new URLSearchParams({
//         department: filters.department || "",
//         employeeId: filters.employee || user?._id || "", // default to logged-in user
//       }).toString();

//       const res = await axios.get(`${API_URL}/admintask?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       let tasks = [];
//       if (Array.isArray(res.data)) tasks = res.data;
//       else if (res.data?.data && Array.isArray(res.data.data)) tasks = res.data.data;

//       cache.adminTasks.data = tasks;
//       cache.adminTasks.timestamp = Date.now();
//       cache.adminTasks.filters = filters;

//       return tasks;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );





// export const updateAdminTaskStatus = createAsyncThunk(
//   "tasks/updateAdminTaskStatus",
//   async ({ id, status }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(`${API_URL}/admin/status/${id}`, { status }, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       cache.adminTasks.data = null;
//       cache.adminTasks.timestamp = null;

//       return res.data.updatedStatus;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// const taskSlice = createSlice({
//   name: "tasks",
//   initialState: {
//     tasks: [],
//     adminTasks: [], 
//     defaulters: [],
//     defaultList: [],
//     totalDefaulters: 0,
//     overallTotalDefaults: 0,
//     totalDefaults: 0,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     invalidateCache: (state) => {
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
//       cache.coreTasks.data = null;
//       cache.coreTasks.timestamp = null;
//       cache.defaulters.data = null;
//       cache.defaulters.timestamp = null;
//       cache.defaultList.data = null;
//       cache.defaultList.timestamp = null;
//     }
//   },
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
//         state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//       })

//       .addCase(fetchCoreTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCoreTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.tasks = action.payload;  
//       })
//       .addCase(fetchCoreTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//       })

//       .addCase(fetchDefaulters.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDefaulters.fulfilled, (state, action) => {
//         state.loading = false;
//         state.defaulters = action.payload.defaulters;
//         state.totalDefaulters = action.payload.totalDefaulters;
//         state.overallTotalDefaults = action.payload.overallTotalDefaults;
//       })
//       .addCase(fetchDefaulters.rejected, (state, action) => {
//         state.loading = false;
//         state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//       })

//       .addCase(fetchDefaultList.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDefaultList.fulfilled, (state, action) => {
//         state.loading = false;
//         state.defaultList = action.payload.data;
//         state.totalDefaults = action.payload.totalDefaults;
//       })
//       .addCase(fetchDefaultList.rejected, (state, action) => {
//         state.loading = false;
//         state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//       })

//       .addCase(updateTaskStatus.fulfilled, (state, action) => {
//         const updatedStatus = action.payload;
//         state.tasks = state.tasks.map((task) => {
//           if (task._id === updatedStatus.taskId) {
//             let doneEmployees = task.doneEmployees || [];
//             let notDoneEmployees = task.notDoneEmployees || [];

//             doneEmployees = doneEmployees.filter(
//               (e) => e._id !== updatedStatus.employeeId
//             );
//             notDoneEmployees = notDoneEmployees.filter(
//               (e) => e._id !== updatedStatus.employeeId
//             );

//             const empObj = {
//               _id: updatedStatus.employeeId,
//               username: updatedStatus.username || "Unknown",
//             };

//             if (updatedStatus.status === "Done") doneEmployees.push(empObj);
//             else notDoneEmployees.push(empObj);

//             return {
//               ...task,
//               doneEmployees,
//               notDoneEmployees,
//               employeeStatus:
//                 task.assignedTo?.some((e) => e._id === updatedStatus.employeeId)
//                   ? updatedStatus.status
//                   : task.employeeStatus,
//             };
//           }
//           return task;
//         });
//       })

//       .addCase(updateTaskStatusCoreTeam.fulfilled, (state, action) => {
//         const updatedStatus = action.payload;
//         state.tasks = state.tasks.map((task) => {
//           if (task._id === updatedStatus.taskId) {
//             let doneEmployees = task.doneEmployees || [];
//             let notDoneEmployees = task.notDoneEmployees || [];

//             doneEmployees = doneEmployees.filter(
//               (e) => e._id !== updatedStatus.employeeId
//             );
//             notDoneEmployees = notDoneEmployees.filter(
//               (e) => e._id !== updatedStatus.employeeId
//             );

//             const empObj = {
//               _id: updatedStatus.employeeId,
//               username: updatedStatus.username || "Unknown",
//             };

//             if (updatedStatus.status === "Done") doneEmployees.push(empObj);
//             else notDoneEmployees.push(empObj);

//             return {
//               ...task,
//               doneEmployees,
//               notDoneEmployees,
//               employeeStatus:
//                 task.assignedTo?.some((e) => e._id === updatedStatus.employeeId)
//                   ? updatedStatus.status
//                   : task.employeeStatus,
//             };
//           }
//           return task;
//         });
//       })
//       .addCase(fetchAdminTasks.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchAdminTasks.fulfilled, (state, action) => {
//         state.loading = false;
//         state.adminTasks = action.payload;
//       })
//       .addCase(fetchAdminTasks.rejected, (state, action) => {
//         state.loading = false;
//         state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//       })

//       // Update Admin Task Status
//       // Update Admin Task Status
// .addCase(updateAdminTaskStatus.fulfilled, (state, action) => {
//   const updatedStatus = action.payload;
//   state.adminTasks = state.adminTasks.map(task => {
//     if (task._id === updatedStatus.taskId) {
//       // Create copies of arrays
//       let doneEmployees = [...(task.doneEmployees || [])];
//       let notDoneEmployees = [...(task.notDoneEmployees || [])];
      
//       // Remove employee from BOTH arrays first
//       doneEmployees = doneEmployees.filter(e => e._id !== updatedStatus.employeeId);
//       notDoneEmployees = notDoneEmployees.filter(e => e._id !== updatedStatus.employeeId);
      
//       // Create employee object
//       const empObj = { 
//         _id: updatedStatus.employeeId, 
//         username: updatedStatus.username || "Unknown" 
//       };
      
//       // Add to appropriate array based on new status
//       if (updatedStatus.status === "Done") {
//         doneEmployees.push(empObj);
//       } else {
//         notDoneEmployees.push(empObj);
//       }
      
//       return {
//         ...task,
//         doneEmployees,
//         notDoneEmployees,
//         employeeStatus: updatedStatus.status,
//       };
//     }
//     return task;
//   });
// })
//   },
// });

// export const { invalidateCache } = taskSlice.actions;
// export default taskSlice.reducer;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API_URL = "http://localhost:4000/api/v1/tasks";
// const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks";
const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};
const cache = {
  tasks: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  coreTasks: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  defaulters: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  defaultList: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  adminTasks: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  }
};
const isCacheValid = (cacheKey, filters) => {
  const cacheItem = cache[cacheKey];
  if (!cacheItem.data || !cacheItem.timestamp) return false;
  
  const areFiltersSame = JSON.stringify(cacheItem.filters) === JSON.stringify(filters);
  if (!areFiltersSame) return false;
  
  const now = Date.now();
  return (now - cacheItem.timestamp) < cacheItem.CACHE_DURATION;
};
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      cache.tasks.data = null;
      cache.tasks.timestamp = null;
      
      thunkAPI.dispatch(fetchTasks());
      return res.data;
    } catch (err) {
      console.error("❌ createTask error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const createCoreTask = createAsyncThunk(
  "tasks/coretask",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create/coretask`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      cache.coreTasks.data = null;
      cache.coreTasks.timestamp = null;
      
      thunkAPI.dispatch(fetchTasks());
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (filters = {}, thunkAPI) => {
    try {     
      if (isCacheValid('tasks', filters)) {
        return cache.tasks.data;
      }
      
      const token = getToken();
      const user = JSON.parse(localStorage.getItem("user"));

      const query = new URLSearchParams({
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
        shift: filters.shift || "",
        department: filters.department || "",
        employeeId: filters.employee || "",
      }).toString();

      
      const res = await axios.get(`${API_URL}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.length > 0) {
        
      }
     
      
      cache.tasks.data = res.data;
      cache.tasks.timestamp = Date.now();
      cache.tasks.filters = filters;
      
      return res.data;
    } catch (err) {
      console.error("❌ fetchTasks error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchCoreTasks = createAsyncThunk(
  "tasks/fetchCoreTasks",
  async (filters = {}, thunkAPI) => {
    try {
      if (isCacheValid('coreTasks', filters)) {
        return cache.coreTasks.data;
      }
      
      const token = getToken();

      const query = new URLSearchParams({
        department: filters.department || "",
        employeeId: filters.employee || "",
      }).toString();

      const res = await axios.get(`${API_URL}/coreteamTask?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      cache.coreTasks.data = res.data;
      cache.coreTasks.timestamp = Date.now();
      cache.coreTasks.filters = filters;

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);
export const fetchDefaulters = createAsyncThunk(
  "tasks/fetchDefaulters",
  async (filters = {}, thunkAPI) => {
    try {
      if (isCacheValid('defaulters', filters)) {
        return cache.defaulters.data;
      }
      
      const token = getToken();

      const query = new URLSearchParams({
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
        shift: filters.shift || "",
        department: filters.department || "",
        employeeId: filters.employee || "",
      }).toString();

      const res = await axios.get(`${API_URL}/defaulter?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data, totalDefaulters, overallTotalDefaults } = res.data;

      const responseData = {
        defaulters: data || [],
        totalDefaulters: totalDefaulters || 0,
        overallTotalDefaults: overallTotalDefaults || 0,
      };
      
      cache.defaulters.data = responseData;
      cache.defaulters.timestamp = Date.now();
      cache.defaulters.filters = filters;

      return responseData;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchDefaultList = createAsyncThunk(
  "tasks/fetchDefaultList",
  async (filters = {}, thunkAPI) => {
    try {
      if (isCacheValid('defaultList', filters)) {
        return cache.defaultList.data;
      }
      
      const token = getToken();

      const query = new URLSearchParams({
        filterType: filters.filterType || "day",
        department: filters.department || "",
        shift: filters.shift || "",
        employeeId: filters.employeeId || "",
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
      }).toString();

      const res = await axios.get(`${API_URL}/defaultList?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = {
        totalDefaults: res.data.totalDefaults || 0,
        data: res.data.data || [],
      };
      
      cache.defaultList.data = responseData;
      cache.defaultList.timestamp = Date.now();
      cache.defaultList.filters = filters;

      return responseData;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
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
      
      cache.tasks.data = null;
      cache.tasks.timestamp = null;
      
      return res.data.updatedStatus;
    } catch (err) {
      console.error("❌ updateTaskStatus error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const updateTaskStatusCoreTeam = createAsyncThunk(
  "tasks/updateTaskStatusCoreTeam",
  async ({ id, status }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(
        `${API_URL}/status/core/${id}`,  
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      cache.coreTasks.data = null;
      cache.coreTasks.timestamp = null;
      
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
      
      cache.tasks.data = null;
      cache.tasks.timestamp = null;
      
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
      
      cache.tasks.data = null;
      cache.tasks.timestamp = null;
      
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

      const today = new Date();
      const endDate = today.toISOString().split("T")[0];
      const startDateObj = new Date(today);
      startDateObj.setMonth(startDateObj.getMonth() - 12);
      const startDate = startDateObj.toISOString().split("T")[0];

      const query = new URLSearchParams({
        startDate,
        endDate,
      }).toString();

      const res = await axios.get(`${API_URL}/export-status?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseType: "arraybuffer",
      });

      const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([res.data], { type: mime });

      let filename = `Task_Status_${startDate}_to_${endDate}.xlsx`;
      const contentDisposition = res.headers && (res.headers["content-disposition"] || res.headers["Content-Disposition"]);
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      return { blob, filename };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchAdminTasks = createAsyncThunk(
  "tasks/fetchAdminTasks",
  async (filters = {}, thunkAPI) => {
    try {
      
      if (isCacheValid('adminTasks', filters)) {
        return cache.adminTasks.data;
      }
      
      const token = getToken();
      const user = JSON.parse(localStorage.getItem("user"));
      const query = new URLSearchParams({
        department: filters.department || "",
        employeeId: filters.employee || user?._id || "",
      }).toString();

      const res = await axios.get(`${API_URL}/admintask?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let tasks = [];
      if (Array.isArray(res.data)) tasks = res.data;
      else if (res.data?.data && Array.isArray(res.data.data)) tasks = res.data.data;
      
      cache.adminTasks.data = tasks;
      cache.adminTasks.timestamp = Date.now();
      cache.adminTasks.filters = filters;
      
      return tasks;
    } catch (err) {
      console.error("❌ fetchAdminTasks error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const updateAdminTaskStatus = createAsyncThunk(
  "tasks/updateAdminTaskStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/admin/status/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      cache.adminTasks.data = null;
      cache.adminTasks.timestamp = null;
      cache.tasks.data = null;   
      cache.tasks.timestamp = null;   
      
      const state = thunkAPI.getState();
      const currentFilters = {};  
      

      return res.data.updatedStatus;
    } catch (err) {
      console.error("❌ updateAdminTaskStatus error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
export const fetchAdminAssignedTasks = createAsyncThunk(
  "tasks/fetchAdminAssignedTasks",
  async (filters = {}, thunkAPI) => {
    try {
      
      const token = getToken();
      const user = JSON.parse(localStorage.getItem("user"));

      const query = new URLSearchParams({
        department: filters.department || "",
        employeeId: filters.employee || user?._id || "",
      }).toString();

      const res = await axios.get(`${API_URL}/admin-assigned-tasks?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      console.error("❌ fetchAdminAssignedTasks error:", err);
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);
const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    adminTasks: [], 
    defaulters: [],
    defaultList: [],
    adminAssignedTasks: [], 
    totalDefaulters: 0,
    overallTotalDefaults: 0,
    totalDefaults: 0,
    loading: false,
    error: null,
  },
  reducers: {
    invalidateCache: (state) => {
      cache.tasks.data = null;
      cache.tasks.timestamp = null;
      cache.coreTasks.data = null;
      cache.coreTasks.timestamp = null;
      cache.defaulters.data = null;
      cache.defaulters.timestamp = null;
      cache.defaultList.data = null;
      cache.defaultList.timestamp = null;
    }
  },
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
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
      })

      .addCase(fetchCoreTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoreTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchCoreTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
      })

      .addCase(fetchDefaulters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDefaulters.fulfilled, (state, action) => {
        state.loading = false;
        state.defaulters = action.payload.defaulters;
        state.totalDefaulters = action.payload.totalDefaulters;
        state.overallTotalDefaults = action.payload.overallTotalDefaults;
      })
      .addCase(fetchDefaulters.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
      })

      .addCase(fetchDefaultList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDefaultList.fulfilled, (state, action) => {
        state.loading = false;
        state.defaultList = action.payload.data;
        state.totalDefaults = action.payload.totalDefaults;
      })
      .addCase(fetchDefaultList.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
      })

      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        
        state.tasks = state.tasks.map((task) => {
          if (task._id === updatedStatus.taskId) {
            let doneEmployees = task.doneEmployees || [];
            let notDoneEmployees = task.notDoneEmployees || [];

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

            if (updatedStatus.status === "Done") {
              doneEmployees.push(empObj);
            } else {
              notDoneEmployees.push(empObj);
            }
            
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
      })

      .addCase(updateTaskStatusCoreTeam.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        state.tasks = state.tasks.map((task) => {
          if (task._id === updatedStatus.taskId) {
            let doneEmployees = task.doneEmployees || [];
            let notDoneEmployees = task.notDoneEmployees || [];

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
      })
      .addCase(fetchAdminAssignedTasks.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchAdminAssignedTasks.fulfilled, (state, action) => {
      state.loading = false;
      state.adminAssignedTasks = action.payload;
    })
    .addCase(fetchAdminAssignedTasks.rejected, (state, action) => {
      state.loading = false;
      state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
    })
      
      .addCase(fetchAdminTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.adminTasks = action.payload;
      })
      .addCase(fetchAdminTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
      })

      .addCase(updateAdminTaskStatus.fulfilled, (state, action) => {
  const updatedStatus = action.payload;
  const employeeId = updatedStatus.employeeId;

  
  const taskExists = state.tasks.some(task => task._id === updatedStatus.taskId);
  
});
  },
});
export const { invalidateCache } = taskSlice.actions;
export default taskSlice.reducer;