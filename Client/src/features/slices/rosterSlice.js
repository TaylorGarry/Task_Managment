// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/roster";
// //  const API_URL = `${import.meta.env.VITE_API_URL || "https://crm-taskmanagement-api-7eos5.ondigitalocean.app"}/api/v1/roster`;
// //  const API_URL = `${import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app"}/api/v1/roster`;

// const getToken = () => {
//   const user = JSON.parse(localStorage.getItem("user"));
//   return user?.token || null;
// };

// const cache = {
//   roster: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,
//   },
//   allRosters: {
//     data: null,
//     timestamp: null,
//     filters: null,
//     CACHE_DURATION: 5 * 60 * 1000,
//   },
// };

// const isCacheValid = (cacheKey, filters) => {
//   const cacheItem = cache[cacheKey];
//   if (!cacheItem.data || !cacheItem.timestamp) return false;
//   const areFiltersSame = JSON.stringify(cacheItem.filters) === JSON.stringify(filters);
//   if (!areFiltersSame) return false;
//   const now = Date.now();
//   return now - cacheItem.timestamp < cacheItem.CACHE_DURATION;
// };

// export const addRosterWeek = createAsyncThunk(
//   "roster/addRosterWeek",
//   async ({ data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.post(`${API_URL}/add-week`, data, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//       });

//       // Invalidate cache
//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const fetchRoster = createAsyncThunk(
//   "roster/fetchRoster",
//   async (filters = {}, thunkAPI) => {
//     try {
//       if (isCacheValid("roster", filters)) {
//         return cache.roster.data;
//       }

//       const token = getToken();
//       const query = new URLSearchParams({
//         month: filters.month || "",
//         year: filters.year || "",
//       }).toString();

//       const res = await axios.get(`${API_URL}/getroster?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       cache.roster.data = res.data;
//       cache.roster.timestamp = Date.now();
//       cache.roster.filters = filters;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const fetchAllRosters = createAsyncThunk(
//   "roster/fetchAllRosters",
//   async (filters = {}, thunkAPI) => {
//     try {
//       const { month, year, page = 1, limit = 10 } = filters;
      
//       if (isCacheValid("allRosters", filters)) {
//         return cache.allRosters.data;
//       }

//       const token = getToken();
//       const query = new URLSearchParams();
      
//       if (month) query.append('month', month);
//       if (year) query.append('year', year);
//       query.append('page', page);
//       query.append('limit', limit);

//       const res = await axios.get(`${API_URL}/rosterdetail?${query}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       cache.allRosters.data = res.data;
//       cache.allRosters.timestamp = Date.now();
//       cache.allRosters.filters = filters;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const updateRosterWeek = createAsyncThunk(
//   "roster/updateRosterWeek",
//   async ({ weekId, data }, thunkAPI) => {
//     try {
//       const token = getToken();
//       const res = await axios.put(`${API_URL}/edit-week/${weekId}`, data, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const exportRosterExcel = createAsyncThunk(
//   "roster/exportRosterExcel",
//   async ({ month, year }, thunkAPI) => {
//     try {
//       const token = getToken();

//       const response = await fetch(
//         `${API_URL}/exportroster?month=${month}&year=${year}`,
//         {
//           headers: { 
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
      
//       let filename = `roster_${month}_${year}.xlsx`;
//       const contentDisposition = response.headers.get('Content-Disposition');
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="?(.+)"?/);
//         if (match && match[1]) {
//           filename = match[1];
//         }
//       }

//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);

//       return { success: true, message: "Excel file downloaded successfully" };
      
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.message || "Failed to export Excel file");
//     }
//   }
// );

// export const exportSavedRoster = createAsyncThunk(
//   "roster/exportSavedRoster",
//   async ({ month, year }, thunkAPI) => {
//     try {
//       const token = getToken();

//       const response = await fetch(
//         `${API_URL}/export-saved?month=${month}&year=${year}`,
//         {
//           headers: { 
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
      
//       let filename = `roster_${month}_${year}_saved.xlsx`;
//       const contentDisposition = response.headers.get('Content-Disposition');
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="?(.+)"?/);
//         if (match && match[1]) {
//           filename = match[1];
//         }
//       }

//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);

//       return { 
//         success: true, 
//         message: "Saved roster Excel file downloaded successfully" 
//       };
      
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.message || "Failed to export saved roster Excel file");
//     }
//   }
// );

// export const updateRosterEmployee = createAsyncThunk(
//   "roster/updateRosterEmployee",
//   async ({ month, year, weekNumber, employeeId, updates }, thunkAPI) => {
//     try {
//       const token = getToken();

//       const sanitizedUpdates = { ...updates };
//       delete sanitizedUpdates.isCoreTeam;
//       delete sanitizedUpdates.shift;

//       const body = {
//         month,
//         year,
//         weekNumber,
//         employeeId,
//         updates: sanitizedUpdates
//       };

//       const res = await axios.put(`${API_URL}/update-employee`, body, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       // Invalidate cache
//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       // Return data needed for immediate UI update
//       return {
//         ...res.data,
//         month,
//         year,
//         weekNumber,
//         employeeId,
//         updates: sanitizedUpdates
//       };
      
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// ); 

// export const deleteEmployeeFromRoster = createAsyncThunk(
//   "roster/deleteEmployeeFromRoster",
//   async ({ rosterId, weekNumber, employeeId }, thunkAPI) => {
//     try {
//       const token = getToken();
      
//       const res = await axios.post(`${API_URL}/delete-employee`, 
//         { rosterId, weekNumber, employeeId },
//         {
//           headers: { 
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//         }
//       );

//       // Invalidate cache
//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       // Return data with employeeId for UI update
//       return {
//         ...res.data,
//         employeeId, // Include employeeId in response
//         rosterId,
//         weekNumber
//       };
      
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const deleteEmployeeByUserId = createAsyncThunk(
//   "roster/deleteEmployeeByUserId",
//   async ({ rosterId, weekNumber, userId }, thunkAPI) => {
//     try {
//       const token = getToken();
      
//       const res = await axios.post(`${API_URL}/delete-employee-by-userid`, 
//         { rosterId, weekNumber, userId },
//         {
//           headers: { 
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//         }
//       );

//       // Invalidate cache
//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// export const deleteEmployeeByName = createAsyncThunk(
//   "roster/deleteEmployeeByName",
//   async ({ rosterId, weekNumber, employeeName }, thunkAPI) => {
//     try {
//       const token = getToken();
      
//       const res = await axios.post(`${API_URL}/delete-employee-by-name`, 
//         { rosterId, weekNumber, employeeName },
//         {
//           headers: { 
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//         }
//       );

//       // Invalidate cache
//       cache.roster.data = null;
//       cache.roster.timestamp = null;
//       cache.allRosters.data = null;
//       cache.allRosters.timestamp = null;

//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
//     }
//   }
// );

// const findEmployeeIndex = (roster, weekNumber, employeeId) => {
//   if (!roster?.weeks) return -1;
  
//   const weekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//   if (weekIndex === -1) return -1;
  
//   const employeeIndex = roster.weeks[weekIndex].employees.findIndex(e => 
//     e._id === employeeId || (e.userId && e.userId._id === employeeId)
//   );
  
//   return { weekIndex, employeeIndex };
// };

// const rosterSlice = createSlice({
//   name: "roster",
//   initialState: {
//     roster: null,
//     allRosters: null,
//     loading: false,
//     error: null,
//     exportLoading: false,
//     exportSuccess: false,
//     savedExportLoading: false,
//     savedExportSuccess: false,
//     rosterDetailLoading: false,
//     rosterDetailError: null,
//     deleteLoading: false, // Add this
//     deleteSuccess: false, 
//     deleteError: null,
//     pagination: {
//       currentPage: 1,
//       totalPages: 1,
//       totalItems: 0,
//       itemsPerPage: 10,
//     },
//   },
//   reducers: {
//     clearExportState: (state) => {
//       state.exportLoading = false;
//       state.exportSuccess = false;
//       state.savedExportLoading = false;
//       state.savedExportSuccess = false;
//       state.error = null;
//     },
//     clearRosterDetailState: (state) => {
//       state.allRosters = null;
//       state.rosterDetailError = null;
//       state.pagination = {
//         currentPage: 1,
//         totalPages: 1,
//         totalItems: 0,
//         itemsPerPage: 10,
//       };
//     },
//     clearError: (state) => {
//       state.error = null;
//       state.rosterDetailError = null;
//       state.deleteError = null;
//     },
//       clearDeleteState: (state) => { 
//       state.deleteLoading = false;
//       state.deleteSuccess = false;
//       state.deleteError = null;
//     },
//     updateRosterData: (state, action) => {
//       state.allRosters = action.payload;
//     },
//     updateRosterDataLocally: (state, action) => {
//       const { month, year, weekNumber, employeeId, updates } = action.payload;
      
//       if (state.roster && state.roster.month === month && state.roster.year === year) {
//         const result = findEmployeeIndex(state.roster, weekNumber, employeeId);
//         if (result.weekIndex !== -1 && result.employeeIndex !== -1) {
//           state.roster.weeks[result.weekIndex].employees[result.employeeIndex] = {
//             ...state.roster.weeks[result.weekIndex].employees[result.employeeIndex],
//             ...updates
//           };
//         }
//       }
      
//       if (state.allRosters?.data) {
//         const rosterIndex = state.allRosters.data.findIndex(r => 
//           r.month === month && r.year === year
//         );
        
//         if (rosterIndex !== -1) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
          
//           if (weekIndex !== -1) {
//             const employeeIndex = state.allRosters.data[rosterIndex].weeks[weekIndex].employees.findIndex(
//               e => e._id === employeeId || (e.userId && e.userId._id === employeeId)
//             );
            
//             if (employeeIndex !== -1) {
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex] = {
//                 ...state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex],
//                 ...updates
//               };
//             }
//           }
//         }
//       }
//     },
//     removeEmployeeFromRosterLocally: (state, action) => {
//       const { rosterId, weekNumber, employeeId } = action.payload;
      
//       if (state.roster && state.roster._id === rosterId) {
//         const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//         if (weekIndex !== -1) {
//           state.roster.weeks[weekIndex].employees = state.roster.weeks[weekIndex].employees.filter(
//             emp => emp._id !== employeeId
//           );
//         }
//       }
//       if (state.allRosters?.data) {
//         const rosterIndex = state.allRosters.data.findIndex(r => r._id === rosterId);
//         if (rosterIndex !== -1) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
//           if (weekIndex !== -1) {
//             state.allRosters.data[rosterIndex].weeks[weekIndex].employees = 
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees.filter(
//                 emp => emp._id !== employeeId
//               );
//           }
//         }
//       }
//     },
 
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(addRosterWeek.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(addRosterWeek.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload.roster) {
//           state.roster = action.payload.roster;
//         }
//       })
//       .addCase(addRosterWeek.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       .addCase(fetchRoster.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchRoster.fulfilled, (state, action) => {
//         state.loading = false;
//         state.roster = action.payload;
//       })
//       .addCase(fetchRoster.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       .addCase(fetchAllRosters.pending, (state) => {
//         state.rosterDetailLoading = true;
//         state.rosterDetailError = null;
//       })
//       .addCase(fetchAllRosters.fulfilled, (state, action) => {
//         state.rosterDetailLoading = false;
        
//         if (action.payload.success) {
//           state.allRosters = action.payload.data || [];
          
//           if (action.payload.pagination) {
//             state.pagination = {
//               currentPage: action.payload.pagination.currentPage || 1,
//               totalPages: action.payload.pagination.totalPages || 1,
//               totalItems: action.payload.pagination.totalItems || 0,
//               itemsPerPage: action.payload.pagination.itemsPerPage || 10,
//             };
//           }
//         } else {
//           state.allRosters = Array.isArray(action.payload) ? action.payload : [];
//         }
        
//         if (!state.allRosters) {
//           state.allRosters = [];
//         }
//       })
//       .addCase(fetchAllRosters.rejected, (state, action) => {
//         state.rosterDetailLoading = false;
//         state.rosterDetailError = action.payload;
//         state.allRosters = [];
//       })
//       .addCase(deleteEmployeeFromRoster.pending, (state) => {
//       state.deleteLoading = true;
//       state.deleteSuccess = false;
//       state.deleteError = null;
//     })
//     .addCase(deleteEmployeeFromRoster.fulfilled, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = true;
//       state.deleteError = null;
      
//       const { rosterId, weekNumber, employeeId } = action.payload || action.meta.arg;
      
//       // Safely update main roster state
//       if (state.roster && state.roster.weeks) {
//         const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//         if (weekIndex !== -1) {
//           state.roster.weeks[weekIndex].employees = state.roster.weeks[weekIndex].employees.filter(
//             emp => emp._id !== employeeId
//           );
//         }
//       }
      
//       // Update allRosters state
//       if (state.allRosters?.data && Array.isArray(state.allRosters.data)) {
//         const rosterIndex = state.allRosters.data.findIndex(r => r._id === rosterId);
//         if (rosterIndex !== -1 && state.allRosters.data[rosterIndex]?.weeks) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
//           if (weekIndex !== -1 && state.allRosters.data[rosterIndex].weeks[weekIndex]?.employees) {
//             state.allRosters.data[rosterIndex].weeks[weekIndex].employees = 
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees.filter(
//                 emp => emp._id !== employeeId
//               );
//           }
//         }
//       }
//     })
//     .addCase(deleteEmployeeFromRoster.rejected, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = false;
//       state.deleteError = action.payload;
//     }) 
//     .addCase(deleteEmployeeByUserId.pending, (state) => {
//       state.deleteLoading = true;
//       state.deleteSuccess = false;
//       state.deleteError = null;
//     })
//     .addCase(deleteEmployeeByUserId.fulfilled, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = true;
//       state.deleteError = null;
      
//       const { rosterId, weekNumber, userId } = action.payload || action.meta.arg; 
//       if (state.roster && state.roster.weeks) {
//         const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//         if (weekIndex !== -1) {
//           state.roster.weeks[weekIndex].employees = state.roster.weeks[weekIndex].employees.filter(
//             emp => !emp.userId || emp.userId.toString() !== userId
//           );
//         }
//       } 
//       if (state.allRosters?.data && Array.isArray(state.allRosters.data)) {
//         const rosterIndex = state.allRosters.data.findIndex(r => r._id === rosterId);
//         if (rosterIndex !== -1 && state.allRosters.data[rosterIndex]?.weeks) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
//           if (weekIndex !== -1 && state.allRosters.data[rosterIndex].weeks[weekIndex]?.employees) {
//             state.allRosters.data[rosterIndex].weeks[weekIndex].employees = 
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees.filter(
//                 emp => !emp.userId || emp.userId.toString() !== userId
//               );
//           }
//         }
//       }
//     })
//     .addCase(deleteEmployeeByUserId.rejected, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = false;
//       state.deleteError = action.payload;
//     })
    
    
//     .addCase(deleteEmployeeByName.pending, (state) => {
//       state.deleteLoading = true;
//       state.deleteSuccess = false;
//       state.deleteError = null;
//     })
//     .addCase(deleteEmployeeByName.fulfilled, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = true;
//       state.deleteError = null;
      
//       const { rosterId, weekNumber, employeeName } = action.payload || action.meta.arg;
      
       
//       if (state.roster && state.roster.weeks) {
//         const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//         if (weekIndex !== -1) {
//           state.roster.weeks[weekIndex].employees = state.roster.weeks[weekIndex].employees.filter(
//             emp => !emp.name || emp.name.toLowerCase() !== employeeName.toLowerCase()
//           );
//         }
//       }
      
    
//       if (state.allRosters?.data && Array.isArray(state.allRosters.data)) {
//         const rosterIndex = state.allRosters.data.findIndex(r => r._id === rosterId);
//         if (rosterIndex !== -1 && state.allRosters.data[rosterIndex]?.weeks) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
//           if (weekIndex !== -1 && state.allRosters.data[rosterIndex].weeks[weekIndex]?.employees) {
//             state.allRosters.data[rosterIndex].weeks[weekIndex].employees = 
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees.filter(
//                 emp => !emp.name || emp.name.toLowerCase() !== employeeName.toLowerCase()
//               );
//           }
//         }
//       }
//     })
//     .addCase(deleteEmployeeByName.rejected, (state, action) => {
//       state.deleteLoading = false;
//       state.deleteSuccess = false;
//       state.deleteError = action.payload;
//     })

      
//       .addCase(updateRosterWeek.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateRosterWeek.fulfilled, (state, action) => {
//         state.loading = false;
//         if (action.payload.roster) {
//           state.roster = action.payload.roster;
//         }
//       })
//       .addCase(updateRosterWeek.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       .addCase(exportRosterExcel.pending, (state) => {
//         state.exportLoading = true;
//         state.exportSuccess = false;
//         state.error = null;
//       })
//       .addCase(exportRosterExcel.fulfilled, (state) => {
//         state.exportLoading = false;
//         state.exportSuccess = true;
//       })
//       .addCase(exportRosterExcel.rejected, (state, action) => {
//         state.exportLoading = false;
//         state.error = action.payload;
//       })
      
//       .addCase(exportSavedRoster.pending, (state) => {
//         state.savedExportLoading = true;
//         state.savedExportSuccess = false;
//         state.error = null;
//       })
//       .addCase(exportSavedRoster.fulfilled, (state) => {
//         state.savedExportLoading = false;
//         state.savedExportSuccess = true;
//       })
//       .addCase(exportSavedRoster.rejected, (state, action) => {
//         state.savedExportLoading = false;
//         state.error = action.payload;
//       })
      
//       .addCase(updateRosterEmployee.pending, (state) => {
//       state.loading = true;
//       state.error = null;
//     })
//     .addCase(updateRosterEmployee.fulfilled, (state, action) => {
//       state.loading = false;
      
//       const { month, year, weekNumber, employeeId, updates, employee } = action.payload;
      
//       if (state.roster && state.roster.month === month && state.roster.year === year) {
//         const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//         if (weekIndex !== -1) {
//           const employeeIndex = state.roster.weeks[weekIndex].employees.findIndex(
//             emp => emp._id === employeeId
//           );
//           if (employeeIndex !== -1) {
//             state.roster.weeks[weekIndex].employees[employeeIndex] = {
//               ...state.roster.weeks[weekIndex].employees[employeeIndex],
//               ...updates
//             };
//           }
//         }
//       }
//       if (state.allRosters?.data) {
//         const rosterIndex = state.allRosters.data.findIndex(r => 
//           r.month === month && r.year === year
//         );
        
//         if (rosterIndex !== -1) {
//           const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
//             w => w.weekNumber === weekNumber
//           );
          
//           if (weekIndex !== -1) {
//             const employeeIndex = state.allRosters.data[rosterIndex].weeks[weekIndex].employees.findIndex(
//               e => e._id === employeeId
//             );
            
//             if (employeeIndex !== -1) {
//               state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex] = {
//                 ...state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex],
//                 ...updates
//               };
//             }
//           }
//         }
//       }
//     })
//     .addCase(updateRosterEmployee.rejected, (state, action) => {
//       state.loading = false;
//       state.error = action.payload;
//     });
//   },
// });

// export const { 
//   clearExportState, 
//   clearRosterDetailState, 
//   clearError,
//   clearDeleteState,
//   updateRosterData,
//   updateRosterDataLocally,
//   removeEmployeeFromRosterLocally 

// } = rosterSlice.actions;
// export default rosterSlice.reducer;


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// const API_URL = "http://localhost:4000/api/v1/roster";
 const API_URL = `${import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app"}/api/v1/roster`;

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

// Enhanced cache management
const cache = {
  roster: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  allRosters: {
    data: null,
    timestamp: null,
    filters: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
  bulkEditRoster: {
    data: null,
    timestamp: null,
    rosterId: null,
    CACHE_DURATION: 5 * 60 * 1000,
  },
};

const clearAllRosterCaches = () => {
  cache.roster.data = null;
  cache.roster.timestamp = null;
  cache.roster.filters = null;
  
  cache.allRosters.data = null;
  cache.allRosters.timestamp = null;
  cache.allRosters.filters = null;
  
  cache.bulkEditRoster.data = null;
  cache.bulkEditRoster.timestamp = null;
  cache.bulkEditRoster.rosterId = null;
  
  console.log("All roster caches cleared");
};

const clearRosterCache = () => {
  cache.roster.data = null;
  cache.roster.timestamp = null;
  cache.roster.filters = null;
  console.log("Roster cache cleared");
};

const clearAllRostersCache = () => {
  cache.allRosters.data = null;
  cache.allRosters.timestamp = null;
  cache.allRosters.filters = null;
  console.log("All rosters cache cleared");
};

const clearBulkEditCache = (rosterId = null) => {
  if (rosterId && cache.bulkEditRoster.rosterId === rosterId) {
    cache.bulkEditRoster.data = null;
    cache.bulkEditRoster.timestamp = null;
    cache.bulkEditRoster.rosterId = null;
    console.log(`Bulk edit cache cleared for roster: ${rosterId}`);
  } else if (!rosterId) {
    cache.bulkEditRoster.data = null;
    cache.bulkEditRoster.timestamp = null;
    cache.bulkEditRoster.rosterId = null;
    console.log("All bulk edit caches cleared");
  }
};

const isCacheValid = (cacheKey, filters) => {
  const cacheItem = cache[cacheKey];
  if (!cacheItem.data || !cacheItem.timestamp) return false;
  
  // For roster and allRosters, check filters
  if (cacheKey === 'roster' || cacheKey === 'allRosters') {
    const areFiltersSame = JSON.stringify(cacheItem.filters) === JSON.stringify(filters);
    if (!areFiltersSame) return false;
  }
  
  if (cacheKey === 'bulkEditRoster' && filters && cacheItem.rosterId !== filters) {
    return false;
  }
  
  const now = Date.now();
  return now - cacheItem.timestamp < cacheItem.CACHE_DURATION;
};

export const getRosterForBulkEdit = createAsyncThunk(
  "roster/getRosterForBulkEdit",
  async (rosterId, thunkAPI) => {
    const state = thunkAPI.getState().roster;

    if (
      state.bulkEditRoster &&
      isCacheValid("bulkEditRoster", rosterId)
    ) {
      return state.bulkEditRoster;
    }

    const token = getToken();
    const res = await axios.get(`${API_URL}/bulk-edit/${rosterId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    cache.bulkEditRoster.data = res.data;
    cache.bulkEditRoster.timestamp = Date.now();
    cache.bulkEditRoster.rosterId = rosterId;

    return res.data;
  }
);


export const bulkUpdateRosterWeeks = createAsyncThunk(
  "roster/bulkUpdateRosterWeeks",
  async ({ rosterId, data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/bulk-save/${rosterId}`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      // Clear ALL caches after successful bulk update
      clearAllRosterCaches();
      
      console.log("Bulk update successful, all caches cleared");

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const addRosterWeek = createAsyncThunk(
  "roster/addRosterWeek",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/add-week`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Clear all caches after adding roster week
      clearAllRosterCaches();
      
      console.log("Roster week added, all caches cleared");

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchRoster = createAsyncThunk(
  "roster/fetchRoster",
  async (filters = {}, thunkAPI) => {
    try {
      const token = getToken();
      const query = new URLSearchParams({
        month: filters.month,
        year: filters.year,
      }).toString();

      const res = await axios.get(`${API_URL}/getroster?${query}`, {
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


export const fetchAllRosters = createAsyncThunk(
  "roster/fetchAllRosters",
  async (filters = {}, thunkAPI) => {
    try {
      const { month, year, page = 1, limit = 10 } = filters;
      
      if (isCacheValid("allRosters", filters)) {
        console.log("Returning cached all rosters data");
        return cache.allRosters.data;
      }

      const token = getToken();
      const query = new URLSearchParams();
      
      if (month) query.append('month', month);
      if (year) query.append('year', year);
      query.append('page', page);
      query.append('limit', limit);

      const res = await axios.get(`${API_URL}/rosterdetail?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      cache.allRosters.data = res.data;
      cache.allRosters.timestamp = Date.now();
      cache.allRosters.filters = filters;
      
      console.log("Fetched fresh all rosters data and cached it");

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateRosterWeek = createAsyncThunk(
  "roster/updateRosterWeek",
  async ({ weekId, data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/edit-week/${weekId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear all caches after updating roster week
      clearAllRosterCaches();
      
      console.log("Roster week updated, all caches cleared");

      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateRosterEmployee = createAsyncThunk(
  "roster/updateRosterEmployee",
  async ({ month, year, weekNumber, employeeId, updates }, thunkAPI) => {
    try {
      const token = getToken();
      const sanitizedUpdates = { ...updates };
      delete sanitizedUpdates.isCoreTeam;
      delete sanitizedUpdates.shift;
      const body = {
        month,
        year,
        weekNumber,
        employeeId,
        updates: sanitizedUpdates
      };
      const res = await axios.put(`${API_URL}/update-employee`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear all caches after updating employee
      clearAllRosterCaches();
      
      console.log("Employee updated, all caches cleared");
      
      return {
        ...res.data,
        month,
        year,
        weekNumber,
        employeeId,
        updates: sanitizedUpdates
      };
      
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
); 

// DELETE OPERATIONS - ALL CLEAR CACHE PROPERLY

export const deleteEmployeeFromRoster = createAsyncThunk(
  "roster/deleteEmployeeFromRoster",
  async ({ rosterId, weekNumber, employeeId }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee`, 
        { rosterId, weekNumber, employeeId },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      // Clear all caches after deleting employee
      clearAllRosterCaches();
      
      console.log("Employee deleted, all caches cleared");
      
      return {
        ...res.data,
        employeeId,  
        rosterId,
        weekNumber
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteEmployeeByUserId = createAsyncThunk(
  "roster/deleteEmployeeByUserId",
  async ({ rosterId, weekNumber, userId }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee-by-userid`, 
        { rosterId, weekNumber, userId },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      // Clear all caches after deleting employee
      clearAllRosterCaches();
      
      console.log("Employee deleted by user ID, all caches cleared");
      
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteEmployeeByName = createAsyncThunk(
  "roster/deleteEmployeeByName",
  async ({ rosterId, weekNumber, employeeName }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee-by-name`, 
        { rosterId, weekNumber, employeeName },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      // Clear all caches after deleting employee
      clearAllRosterCaches();
      
      console.log("Employee deleted by name, all caches cleared");
      
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// OTHER OPERATIONS THAT SHOULD CLEAR CACHE

export const createRosterForDateRange = createAsyncThunk(
  "roster/createRosterForDateRange",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create-range`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Clear all caches after creating roster range
      clearAllRosterCaches();
      
      console.log("Roster range created, all caches cleared");
      
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


export const copyEmployeesToWeek = createAsyncThunk(
  "roster/copyEmployeesToWeek",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/copy-employees`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Clear all caches after copying employees
      clearAllRosterCaches();
      
      console.log("Employees copied, all caches cleared");
      
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const exportSavedRoster = createAsyncThunk(
  "roster/exportSavedRoster",
  async ({ month, year }, thunkAPI) => {
    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/export-saved?month=${month}&year=${year}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      let filename = `roster_${month}_${year}_saved.xlsx`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: "Saved roster Excel file downloaded successfully" 
      };
      
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Failed to export saved roster Excel file");
    }
  }
);

export const bulkUpdateWeeks = createAsyncThunk(
  "roster/bulkUpdateWeeks",
  async ({ data }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/bulk-update`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      // Clear all caches after bulk update
      clearAllRosterCaches();
      
      console.log("Bulk weeks update, all caches cleared");
      
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Helper function remains the same
const findEmployeeIndex = (roster, weekNumber, employeeId) => {
  if (!roster?.weeks) return -1;
  const weekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
  if (weekIndex === -1) return -1;
  const employeeIndex = roster.weeks[weekIndex].employees.findIndex(e => 
    e._id === employeeId || (e.userId && e.userId._id === employeeId)
  );
  return { weekIndex, employeeIndex };
};

// UPDATED SLICE WITH BULK EDIT STATES
const rosterSlice = createSlice({
  name: "roster",
  initialState: {
    roster: undefined,
    allRosters: undefined,
    bulkEditRoster: undefined, // NEW: for bulk edit data
    loading: false,
    isHydrated: false,
    bulkEditHydrated: false,
    error: null,
    exportLoading: false,
    exportSuccess: false,
    savedExportLoading: false,
    savedExportSuccess: false,
    rosterDetailLoading: false,
    rosterDetailError: null,
    deleteLoading: false,
    deleteSuccess: false, 
    deleteError: null,
    createRangeLoading: false,
    createRangeSuccess: false,
    createRangeError: null,
    copyEmployeesLoading: false,
    copyEmployeesSuccess: false,
    copyEmployeesError: null,
    bulkUpdateLoading: false,
    bulkUpdateSuccess: false,
    bulkUpdateError: null,
    // NEW STATES FOR BULK EDIT
    bulkEditLoading: false,
    bulkEditError: null,
    bulkSaveLoading: false,
    bulkSaveSuccess: false,
    bulkSaveError: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
    },
  },
  reducers: {
    clearExportState: (state) => {
      state.exportLoading = false;
      state.exportSuccess = false;
      state.savedExportLoading = false;
      state.savedExportSuccess = false;
      state.error = null;
    },
    clearRosterDetailState: (state) => {
      state.allRosters = null;
      state.rosterDetailError = null;
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      };
    },
    clearError: (state) => {
      state.error = null;
      state.rosterDetailError = null;
      state.deleteError = null;
      state.createRangeError = null;
      state.copyEmployeesError = null;
      state.bulkUpdateError = null;
      state.bulkEditError = null; // NEW
      state.bulkSaveError = null; // NEW
    },
    clearDeleteState: (state) => { 
      state.deleteLoading = false;
      state.deleteSuccess = false;
      state.deleteError = null;
    },
    clearCreateRangeState: (state) => {
      state.createRangeLoading = false;
      state.createRangeSuccess = false;
      state.createRangeError = null;
    },
    clearCopyEmployeesState: (state) => {
      state.copyEmployeesLoading = false;
      state.copyEmployeesSuccess = false;
      state.copyEmployeesError = null;
    },
    clearBulkUpdateState: (state) => {
      state.bulkUpdateLoading = false;
      state.bulkUpdateSuccess = false;
      state.bulkUpdateError = null;
    },
    // NEW REDUCERS FOR BULK EDIT
    clearBulkEditState: (state) => {
      state.bulkEditRoster = undefined;
      state.bulkEditLoading = false;
      state.bulkEditError = null;
      state.bulkSaveLoading = false;
      state.bulkSaveSuccess = false;
      state.bulkSaveError = null;
      // Also clear cache
      clearBulkEditCache();
    },
    clearBulkSaveState: (state) => {
      state.bulkSaveLoading = false;
      state.bulkSaveSuccess = false;
      state.bulkSaveError = null;
    },
    // Force refresh roster data (useful when you know data changed)
    forceRefreshRoster: (state) => {
      clearAllRosterCaches();
      state.roster = undefined;
      state.allRosters = undefined;
      state.bulkEditRoster = undefined;
      console.log("Forced roster refresh - all data cleared");
    },
    // Manually update local data after edit (immediate UI update)
    updateRosterData: (state, action) => {
      state.allRosters = action.payload;
    },
    updateRosterDataLocally: (state, action) => {
      const { month, year, weekNumber, employeeId, updates } = action.payload;
      
      // Update main roster
      if (state.roster && state.roster.month === month && state.roster.year === year) {
        const result = findEmployeeIndex(state.roster, weekNumber, employeeId);
        if (result.weekIndex !== -1 && result.employeeIndex !== -1) {
          state.roster.weeks[result.weekIndex].employees[result.employeeIndex] = {
            ...state.roster.weeks[result.weekIndex].employees[result.employeeIndex],
            ...updates
          };
        }
      }
      
      // Update allRosters
      if (state.allRosters?.data) {
        const rosterIndex = state.allRosters.data.findIndex(r => 
          r.month === month && r.year === year
        );
        if (rosterIndex !== -1) {
          const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
            w => w.weekNumber === weekNumber
          );
          if (weekIndex !== -1) {
            const employeeIndex = state.allRosters.data[rosterIndex].weeks[weekIndex].employees.findIndex(
              e => e._id === employeeId || (e.userId && e.userId._id === employeeId)
            );
            
            if (employeeIndex !== -1) {
              state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex] = {
                ...state.allRosters.data[rosterIndex].weeks[weekIndex].employees[employeeIndex],
                ...updates
              };
            }
          }
        }
      }
      
      // Also update bulkEditRoster if it exists
      if (state.bulkEditRoster?.data) {
        const week = state.bulkEditRoster.data.weeks?.find(w => w.weekNumber === weekNumber);
        if (week) {
          const employee = week.employees?.find(e => e._id === employeeId);
          if (employee) {
            Object.assign(employee, updates);
          }
        }
      }
      
      console.log("Local roster data updated immediately");
    },
    removeEmployeeFromRosterLocally: (state, action) => {
      const { rosterId, weekNumber, employeeId } = action.payload;
      
      // Update main roster
      if (state.roster && state.roster._id === rosterId) {
        const weekIndex = state.roster.weeks.findIndex(w => w.weekNumber === weekNumber);
        if (weekIndex !== -1) {
          state.roster.weeks[weekIndex].employees = state.roster.weeks[weekIndex].employees.filter(
            emp => emp._id !== employeeId
          );
        }
      }
      
      // Update allRosters
      if (state.allRosters?.data) {
        const rosterIndex = state.allRosters.data.findIndex(r => r._id === rosterId);
        if (rosterIndex !== -1) {
          const weekIndex = state.allRosters.data[rosterIndex].weeks.findIndex(
            w => w.weekNumber === weekNumber
          );
          if (weekIndex !== -1) {
            state.allRosters.data[rosterIndex].weeks[weekIndex].employees = 
              state.allRosters.data[rosterIndex].weeks[weekIndex].employees.filter(
                emp => emp._id !== employeeId
              );
          }
        }
      }
      
      // Also update bulkEditRoster if it exists
      if (state.bulkEditRoster?.data?._id === rosterId) {
        const week = state.bulkEditRoster.data.weeks?.find(w => w.weekNumber === weekNumber);
        if (week) {
          week.employees = week.employees?.filter(emp => emp._id !== employeeId) || [];
        }
      }
      
      console.log("Employee removed locally immediately");
    },
  },
  extraReducers: (builder) => {
    builder
      // Existing reducers...
      .addCase(addRosterWeek.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRosterWeek.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.roster) {
          state.roster = action.payload.roster;
        }
      })
      .addCase(addRosterWeek.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(exportSavedRoster.pending, (state) => {
        state.savedExportLoading = true;
        state.savedExportSuccess = false;
        state.error = null;
      })
      .addCase(exportSavedRoster.fulfilled, (state) => {
        state.savedExportLoading = false;
        state.savedExportSuccess = true;
      })
      .addCase(exportSavedRoster.rejected, (state, action) => {
        state.savedExportLoading = false;
        state.error = action.payload;
      })
      
      .addCase(fetchRoster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoster.fulfilled, (state, action) => {
        state.loading = false;
        state.roster = action.payload;
        state.isHydrated = true;
      })
      .addCase(fetchRoster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isHydrated = true;
      })
      
      .addCase(fetchAllRosters.pending, (state) => {
        state.rosterDetailLoading = true;
        state.rosterDetailError = null;
      })
      .addCase(fetchAllRosters.fulfilled, (state, action) => {
        state.rosterDetailLoading = false;
        if (action.payload.success) {
          state.allRosters = action.payload.data || [];
          if (action.payload.pagination) {
            state.pagination = {
              currentPage: action.payload.pagination.currentPage || 1,
              totalPages: action.payload.pagination.totalPages || 1,
              totalItems: action.payload.pagination.totalItems || 0,
              itemsPerPage: action.payload.pagination.itemsPerPage || 10,
            };
          }
        } else {
          state.allRosters = Array.isArray(action.payload) ? action.payload : [];
        }
        if (!state.allRosters) {
          state.allRosters = [];
        }
      })
      .addCase(fetchAllRosters.rejected, (state, action) => {
        state.rosterDetailLoading = false;
        state.rosterDetailError = action.payload;
        state.allRosters = [];
      })
      
      // DELETE OPERATIONS - with immediate UI update
      .addCase(deleteEmployeeFromRoster.pending, (state) => {
        state.deleteLoading = true;
        state.deleteSuccess = false;
        state.deleteError = null;
      })
      .addCase(deleteEmployeeFromRoster.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = true;
        state.deleteError = null;
        // The local update is handled in updateRosterDataLocally reducer
      })
      .addCase(deleteEmployeeFromRoster.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteSuccess = false;
        state.deleteError = action.payload;
      })
      
      // BULK EDIT OPERATIONS
     .addCase(getRosterForBulkEdit.pending, (state) => {
  state.bulkEditLoading = true;
  state.bulkEditError = null;
  state.bulkEditHydrated = false;
})

.addCase(getRosterForBulkEdit.fulfilled, (state, action) => {
  state.bulkEditLoading = false;
  state.bulkEditRoster = action.payload;
  state.bulkEditHydrated = true;
})

.addCase(getRosterForBulkEdit.rejected, (state, action) => {
  state.bulkEditLoading = false;
  state.bulkEditError = action.payload;
  state.bulkEditHydrated = true;
})

      
      .addCase(bulkUpdateRosterWeeks.pending, (state) => {
        state.bulkSaveLoading = true;
        state.bulkSaveSuccess = false;
        state.bulkSaveError = null;
      })
      .addCase(bulkUpdateRosterWeeks.fulfilled, (state, action) => {
        state.bulkSaveLoading = false;
        state.bulkSaveSuccess = true;
        state.bulkEditError = undefined;
        // Clear bulk edit data after successful save
        state.bulkEditRoster = null;
      })
      .addCase(bulkUpdateRosterWeeks.rejected, (state, action) => {
        state.bulkSaveLoading = false;
        state.bulkSaveSuccess = false;
        state.bulkSaveError = action.payload;
      })
      
      // Add other existing cases...
      .addCase(updateRosterEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRosterEmployee.fulfilled, (state, action) => {
        state.loading = false;
        // Local update is handled by updateRosterDataLocally reducer
      })
      .addCase(updateRosterEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
      
    // Add other existing extraReducers...
  },
});

export const { 
  clearExportState, 
  clearRosterDetailState, 
  clearError,
  clearDeleteState,
  clearCreateRangeState,
  clearCopyEmployeesState,
  clearBulkUpdateState,
  clearBulkEditState,      // NEW
  clearBulkSaveState,      // NEW
  forceRefreshRoster,      // NEW
  updateRosterData,
  updateRosterDataLocally,
  removeEmployeeFromRosterLocally 
} = rosterSlice.actions;

export default rosterSlice.reducer;