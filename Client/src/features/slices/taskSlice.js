// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";
// import { toast } from "react-toastify";
// // const API_URL = "http://localhost:4000/api/v1/tasks";
// const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks";
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
//   adminTasks: {
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
//       const user = JSON.parse(localStorage.getItem("user"));

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
      
//       if (res.data.length > 0) {
        
//       }
     
      
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
//       const res =await axios.delete(`${API_URL}/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
      
//       cache.tasks.data = null;
//       cache.tasks.timestamp = null;
//        toast.success(res.data?.message || "Task deleted successfully");
      
//       return id;
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.message || "Failed to delete task";

//       toast.error(errorMessage);

//       return thunkAPI.rejectWithValue(errorMessage);
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
//           toast.success(res.data.message || "Task updated successfully");
//       return res.data.task;
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.message || "Something went wrong";

//       toast.error(errorMessage);

//       return thunkAPI.rejectWithValue(errorMessage);
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
      
//       if (isCacheValid('adminTasks', filters)) {
//         return cache.adminTasks.data;
//       }
      
//       const token = getToken();
//       const user = JSON.parse(localStorage.getItem("user"));
//       const query = new URLSearchParams({
//         department: filters.department || "",
//         employeeId: filters.employee || user?._id || "",
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
//       cache.tasks.data = null;   
//       cache.tasks.timestamp = null;   
      
//       const state = thunkAPI.getState();
//       const currentFilters = {};  
      

//       return res.data.updatedStatus;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );
// export const fetchAdminAssignedTasks = createAsyncThunk(
//   "tasks/fetchAdminAssignedTasks",
//   async (filters = {}, thunkAPI) => {
//     try {
      
//       const token = getToken();
//       const user = JSON.parse(localStorage.getItem("user"));

//       const query = new URLSearchParams({
//         department: filters.department || "",
//         employeeId: filters.employee || user?._id || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}/admin-assigned-tasks?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data;
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
//     adminAssignedTasks: [], 
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

//             if (updatedStatus.status === "Done") {
//               doneEmployees.push(empObj);
//             } else {
//               notDoneEmployees.push(empObj);
//             }
            
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

//       // .addCase(updateTaskStatusCoreTeam.fulfilled, (state, action) => {
//       //   const updatedStatus = action.payload;
//       //   state.tasks = state.tasks.map((task) => {
//       //     if (task._id === updatedStatus.taskId) {
//       //       let doneEmployees = task.doneEmployees || [];
//       //       let notDoneEmployees = task.notDoneEmployees || [];

//       //       doneEmployees = doneEmployees.filter(
//       //         (e) => e._id !== updatedStatus.employeeId
//       //       );
//       //       notDoneEmployees = notDoneEmployees.filter(
//       //         (e) => e._id !== updatedStatus.employeeId
//       //       );

//       //       const empObj = {
//       //         _id: updatedStatus.employeeId,
//       //         username: updatedStatus.username || "Unknown",
//       //       };

//       //       if (updatedStatus.status === "Done") doneEmployees.push(empObj);
//       //       else notDoneEmployees.push(empObj);

//       //       return {
//       //         ...task,
//       //         doneEmployees,
//       //         notDoneEmployees,
//       //         employeeStatus:
//       //           task.assignedTo?.some((e) => e._id === updatedStatus.employeeId)
//       //             ? updatedStatus.status
//       //             : task.employeeStatus,
//       //       };
//       //     }
//       //     return task;
//       //   });
//       // })


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
//       .addCase(fetchAdminAssignedTasks.pending, (state) => {
//       state.loading = true;
//       state.error = null;
//     })
//     .addCase(fetchAdminAssignedTasks.fulfilled, (state, action) => {
//       state.loading = false;
//       state.adminAssignedTasks = action.payload;
//     })
//     .addCase(fetchAdminAssignedTasks.rejected, (state, action) => {
//       state.loading = false;
//       state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
//     })
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
//       .addCase(updateAdminTaskStatus.fulfilled, (state, action) => {
//   const updatedStatus = action.payload;
//   const employeeId = updatedStatus.employeeId;

  
//   const taskExists = state.tasks.some(task => task._id === updatedStatus.taskId);
  
// });
//   },
// });
// export const { invalidateCache } = taskSlice.actions;
// export default taskSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://localhost:4000/api/v1/tasks";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

// Helper to get today's date string in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to check if date is today
const isToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getTodayDateString();
};

// Initialize cache object
let cache = {
  tasks: {
    data: null,
    timestamp: null,
    filters: null,
  },
  coreTasks: {
    data: null,
    timestamp: null,
    filters: null,
  },
  defaulters: {
    data: null,
    timestamp: null,
    filters: null,
  },
  defaultList: {
    data: null,
    timestamp: null,
    filters: null,
  },
  adminTasks: {
    data: null,
    timestamp: null,
    filters: null,
  },
  allTasks: {
    data: null,
    timestamp: null,
    filters: null,
  }
};

// Enhanced cache validation that forces fresh data for today
const isCacheValid = (cacheKey, filters) => {
  const cacheItem = cache[cacheKey];
  
  // If no cache data, not valid
  if (!cacheItem.data || !cacheItem.timestamp) {
    return false;
  }
  
  // Check if we're requesting today's data
  const todayString = getTodayDateString();
  const isRequestingToday = 
    (filters && filters.date === todayString) || 
    (!filters || (!filters.date && !filters.startDate && !filters.endDate));
  
  // If requesting today's data and cache is not from today, invalidate
  if (isRequestingToday) {
    const isCacheFromToday = cacheItem.filters && 
      (cacheItem.filters.date === todayString || 
       (!cacheItem.filters.date && !cacheItem.filters.startDate && !cacheItem.filters.endDate));
    
    if (!isCacheFromToday) {
      console.log(`Cache for ${cacheKey} is not from today, invalidating`);
      return false;
    }
    
    // For today's data, use very short cache (30 seconds)
    const cacheAge = Date.now() - cacheItem.timestamp;
    const TODAY_CACHE_DURATION = 30 * 1000; // 30 seconds
    if (cacheAge > TODAY_CACHE_DURATION) {
      console.log(`Cache for today's ${cacheKey} is stale (${cacheAge}ms old)`);
      return false;
    }
  }
  
  // For non-today data, check filter equality
  const areFiltersSame = JSON.stringify(cacheItem.filters) === JSON.stringify(filters);
  if (!areFiltersSame) {
    return false;
  }
  
  // For historical data, use longer cache (5 minutes)
  const cacheAge = Date.now() - cacheItem.timestamp;
  const HISTORICAL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  return cacheAge < HISTORICAL_CACHE_DURATION;
};

// Helper to invalidate all task-related caches
const invalidateAllTaskCaches = () => {
  console.log("Invalidating all task caches...");
  cache.tasks.data = null;
  cache.tasks.timestamp = null;
  cache.tasks.filters = null;
  
  cache.coreTasks.data = null;
  cache.coreTasks.timestamp = null;
  cache.coreTasks.filters = null;
  
  cache.allTasks.data = null;
  cache.allTasks.timestamp = null;
  cache.allTasks.filters = null;
  
  cache.adminTasks.data = null;
  cache.adminTasks.timestamp = null;
  cache.adminTasks.filters = null;
};

// Invalidate cache specifically for today's data
const invalidateTodayCache = () => {
  const todayString = getTodayDateString();
  console.log("Invalidating cache for today:", todayString);
  
  // Invalidate allTasks cache if it's for today
  if (cache.allTasks.filters && 
      (cache.allTasks.filters.date === todayString || 
       (!cache.allTasks.filters.date && !cache.allTasks.filters.startDate && !cache.allTasks.filters.endDate))) {
    cache.allTasks.data = null;
    cache.allTasks.timestamp = null;
    cache.allTasks.filters = null;
  }
  
  // Invalidate tasks cache if it's for today
  if (cache.tasks.filters && 
      cache.tasks.filters.startDate === todayString && 
      cache.tasks.filters.endDate === todayString) {
    cache.tasks.data = null;
    cache.tasks.timestamp = null;
    cache.tasks.filters = null;
  }
};

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Invalidate today's cache when creating a task
      invalidateTodayCache();
      
      // Dispatch fetchAllTasks to refresh dashboard data
      const todayString = getTodayDateString();
      thunkAPI.dispatch(fetchAllTasks({ date: todayString }));
      
      toast.success("Task created successfully");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
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
      
      // Invalidate today's cache when creating a core task
      invalidateTodayCache();
      
      // Dispatch fetchAllTasks to refresh dashboard data
      const todayString = getTodayDateString();
      thunkAPI.dispatch(fetchAllTasks({ date: todayString }));
      
      toast.success("Core task created successfully");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create core task");
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
      const token = getToken();
      const todayString = getTodayDateString();

      // Always default to today's date if no dates specified
      const effectiveFilters = {
        ...filters,
        startDate: filters.startDate || todayString,
        endDate: filters.endDate || todayString,
      };

      if (isCacheValid('tasks', effectiveFilters)) {
        console.log("Using cached tasks data for", effectiveFilters.startDate);
        return cache.tasks.data;
      }
      
      console.log("Fetching fresh tasks data for", effectiveFilters.startDate);
      const query = new URLSearchParams({
        startDate: effectiveFilters.startDate,
        endDate: effectiveFilters.endDate,
        shift: effectiveFilters.shift || "",
        department: effectiveFilters.department || "",
        employeeId: effectiveFilters.employee || "",
      }).toString();

      const res = await axios.get(`${API_URL}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      cache.tasks.data = res.data;
      cache.tasks.timestamp = Date.now();
      cache.tasks.filters = effectiveFilters;
      
      return res.data;
    } catch (err) {
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
      
      // Invalidate today's cache when updating task status
      invalidateTodayCache();
      
      // Immediately refetch all tasks to update dashboard
      const todayString = getTodayDateString();
      thunkAPI.dispatch(fetchAllTasks({ date: todayString }));
      
      toast.success("Task status updated successfully");
      return res.data.updatedStatus;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update task status");
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
      
      // Invalidate today's cache when updating core task status
      invalidateTodayCache();
      
      // Immediately refetch all tasks to update dashboard
      const todayString = getTodayDateString();
      thunkAPI.dispatch(fetchAllTasks({ date: todayString }));
      
      toast.success("Core task status updated successfully");
      return res.data.updatedStatus;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update core task status");
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Invalidate today's cache when deleting a task
      invalidateTodayCache();
      
      toast.success(res.data?.message || "Task deleted successfully");
      
      return id;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete task";

      toast.error(errorMessage);

      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchAllTasks = createAsyncThunk(
  "tasks/fetchAllTasks",
  async (filters = {}, thunkAPI) => {
    try {
      const token = getToken();
      const todayString = getTodayDateString();
      
      // ALWAYS force today's date for dashboard
      const effectiveFilters = {
        ...filters,
        date: filters.date || todayString, // Default to today if no date specified
      };
      
      console.log("Fetching all tasks for date:", effectiveFilters.date, "Today is:", todayString);
      
      // Only use cache if it's very fresh (30 seconds) for today's data
      if (isCacheValid('allTasks', effectiveFilters)) {
        console.log("Using cached allTasks data for", effectiveFilters.date);
        return cache.allTasks.data;
      }
      
      console.log("Fetching FRESH allTasks data for", effectiveFilters.date);
      const query = new URLSearchParams();
      
      // Always add date parameter
      query.append("date", effectiveFilters.date);
      
      // Add other filters if they exist
      if (filters.startDate) query.append("startDate", filters.startDate);
      if (filters.endDate) query.append("endDate", filters.endDate);
      if (filters.shift) query.append("shift", filters.shift);
      if (filters.department) query.append("department", filters.department);
      
      const queryString = query.toString();
      const url = `${API_URL}/AllTasks?${queryString}`;
      
      console.log("API URL:", url);
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Received", res.data?.length || 0, "tasks for date", effectiveFilters.date);
      
      // Update cache
      cache.allTasks.data = res.data;
      cache.allTasks.timestamp = Date.now();
      cache.allTasks.filters = effectiveFilters;
      
      return res.data;
    } catch (err) {
      console.error("Error fetching all tasks:", err);
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
      
      // Invalidate today's cache when updating a task
      invalidateTodayCache();
      
      toast.success(res.data.message || "Task updated successfully");
      return res.data.task;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Something went wrong";

      toast.error(errorMessage);

      return thunkAPI.rejectWithValue(errorMessage);
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

      // Invalidate today's cache when updating admin task status
      invalidateTodayCache();
      
      // Immediately refetch all tasks to update dashboard
      const todayString = getTodayDateString();
      thunkAPI.dispatch(fetchAllTasks({ date: todayString }));
      
      // toast.success("Admin task status updated successfully");
      return res.data.updatedStatus;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update admin task status");
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
    allTasks: [],
    totalDefaulters: 0,
    overallTotalDefaults: 0,
    totalDefaults: 0,
    loading: false,
    error: null,
    lastFetchDate: null, // Track when data was last fetched
  },
  reducers: {
    invalidateCache: (state) => {
      console.log("Manually invalidating all caches...");
      invalidateAllTaskCaches();
    },
    resetTasks: (state) => {
      state.tasks = [];
      state.adminTasks = [];
      state.allTasks = [];
      state.defaulters = [];
      state.defaultList = [];
      state.adminAssignedTasks = [];
      state.totalDefaulters = 0;
      state.overallTotalDefaults = 0;
      state.totalDefaults = 0;
      state.loading = false;
      state.error = null;
      state.lastFetchDate = null;
    },
    // New action to force refresh today's data
    forceRefreshToday: (state) => {
      console.log("Force refreshing today's data...");
      invalidateTodayCache();
      state.allTasks = [];
      state.lastFetchDate = null;
    },
    // Check and refresh if data is not from today
    ensureTodayData: (state) => {
      const todayString = getTodayDateString();
      if (state.lastFetchDate !== todayString) {
        console.log("Data is not from today, refreshing...");
        state.allTasks = [];
        invalidateTodayCache();
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchTasks
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

      // fetchCoreTasks
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

      // fetchDefaulters
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

      // fetchDefaultList
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

      // updateTaskStatus
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        
        // Update allTasks array
        if (state.allTasks && state.allTasks.length > 0) {
          state.allTasks = state.allTasks.map((task) => {
            if (task._id === updatedStatus.taskId) {
              let doneEmployees = task.doneEmployees || [];
              let notDoneEmployees = task.notDoneEmployees || [];

              // Remove employee from both arrays first
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

              // Add to appropriate array
              if (updatedStatus.status === "Done") {
                doneEmployees.push(empObj);
              } else {
                notDoneEmployees.push(empObj);
              }
              
              return {
                ...task,
                doneEmployees,
                notDoneEmployees,
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
        
        // Update tasks array
        if (state.tasks && state.tasks.length > 0) {
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
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
      })

      // updateTaskStatusCoreTeam
      .addCase(updateTaskStatusCoreTeam.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        
        // Update allTasks array
        if (state.allTasks && state.allTasks.length > 0) {
          state.allTasks = state.allTasks.map((task) => {
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
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
        
        // Update tasks array
        if (state.tasks && state.tasks.length > 0) {
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
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
      })

      // fetchAdminAssignedTasks
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

      // fetchAdminTasks
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

      // updateAdminTaskStatus
      .addCase(updateAdminTaskStatus.fulfilled, (state, action) => {
        const updatedStatus = action.payload;
        
        // Update allTasks if the task exists there
        if (state.allTasks && state.allTasks.length > 0) {
          state.allTasks = state.allTasks.map((task) => {
            if (task._id === updatedStatus.taskId) {
              return {
                ...task,
                status: updatedStatus.status,
                updatedAt: updatedStatus.updatedAt || new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
        
        // Update adminTasks array
        if (state.adminTasks && state.adminTasks.length > 0) {
          state.adminTasks = state.adminTasks.map((task) => {
            if (task._id === updatedStatus.taskId) {
              return {
                ...task,
                status: updatedStatus.status,
                updatedAt: updatedStatus.updatedAt || new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
        
        // Update tasks array if the task exists there
        if (state.tasks && state.tasks.length > 0) {
          state.tasks = state.tasks.map((task) => {
            if (task._id === updatedStatus.taskId) {
              return {
                ...task,
                status: updatedStatus.status,
                updatedAt: updatedStatus.updatedAt || new Date().toISOString(),
                lastUpdated: new Date().toISOString()
              };
            }
            return task;
          });
        }
      })

      // fetchAllTasks - MOST IMPORTANT FOR DASHBOARD
      .addCase(fetchAllTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.allTasks = action.payload;
        state.lastFetchDate = getTodayDateString(); // Track when we fetched
        console.log("All tasks updated in state for date:", state.lastFetchDate, "Count:", action.payload?.length, "tasks");
        
        // Log dates for debugging
        if (action.payload && action.payload.length > 0) {
          const uniqueDates = [...new Set(action.payload.map(task => task.date))];
          console.log("Unique dates in fetched tasks:", uniqueDates);
        }
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === "string" ? action.payload : "Something went wrong";
        console.error("Error fetching all tasks:", action.payload);
      })

      // createTask
      .addCase(createTask.fulfilled, (state, action) => {
        // Already handled in the thunk with toast
      })

      // createCoreTask
      .addCase(createCoreTask.fulfilled, (state, action) => {
        // Already handled in the thunk with toast
      })

      // deleteTask
      .addCase(deleteTask.fulfilled, (state, action) => {
        const deletedTaskId = action.payload;
        state.tasks = state.tasks.filter(task => task._id !== deletedTaskId);
        state.adminTasks = state.adminTasks.filter(task => task._id !== deletedTaskId);
        state.allTasks = state.allTasks.filter(task => task._id !== deletedTaskId);
      })

      // updateTask
      .addCase(updateTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        
        // Update allTasks array
        state.allTasks = state.allTasks.map(task => 
          task._id === updatedTask._id ? { ...updatedTask, lastUpdated: new Date().toISOString() } : task
        );
        
        // Update tasks array
        state.tasks = state.tasks.map(task => 
          task._id === updatedTask._id ? { ...updatedTask, lastUpdated: new Date().toISOString() } : task
        );
        
        // Update adminTasks array
        state.adminTasks = state.adminTasks.map(task => 
          task._id === updatedTask._id ? { ...updatedTask, lastUpdated: new Date().toISOString() } : task
        );
      })

      // exportTaskStatusExcel
      .addCase(exportTaskStatusExcel.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportTaskStatusExcel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportTaskStatusExcel.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload || "Failed to export Excel");
      });
  },
});

export const { invalidateCache, resetTasks, forceRefreshToday, ensureTodayData } = taskSlice.actions;
export default taskSlice.reducer;