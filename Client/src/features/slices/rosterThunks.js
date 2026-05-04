// Client/src/features/slices/rosterThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

const resolveApiBaseUrl = () => {
  const envUrl = import.meta?.env?.VITE_API_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, '');

  const hostname = window?.location?.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:4000' : 'https://fdbs-server-a9gqg.ondigitalocean.app';
};

const API_URL = `${resolveApiBaseUrl()}/api/v1/roster`;

const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token || null;
};

// Common error handler
const handleError = (error, thunkAPI) => {
  const message = error.response?.data?.message || 
                  error.response?.data?.error || 
                  error.message || 'Something went wrong';
  toast.error(message);
  return thunkAPI.rejectWithValue(message);
};

// 1. Excel Upload
export const uploadRosterFromExcel = createAsyncThunk(
  'roster/uploadFromExcel',
  async ({ startDate, endDate, excelFile }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('excelFile', excelFile);

      const response = await axios.post(`${API_URL}/upload-excel`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(response.data.message || 'Roster uploaded successfully');
      return response.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 2. OpsMeta Current Week
export const getOpsMetaCurrentWeekRoster = createAsyncThunk(
  'roster/opsMeta/getCurrentWeek',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/current-week`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 3. Update OpsMeta
export const updateOpsMetaRoster = createAsyncThunk(
  'roster/opsMeta/update',
  async ({ employeeId, updates }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/update`, { employeeId, updates }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 4. Get Roster for Bulk Edit
export const getRosterForBulkEdit = createAsyncThunk(
  'roster/getRosterForBulkEdit',
  async (rosterId, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/bulk-edit/${rosterId}`, {
        params: { includePastWeeks: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 5. Bulk Update Roster Weeks
export const bulkUpdateRosterWeeks = createAsyncThunk(
  'roster/bulkUpdateRosterWeeks',
  async ({ rosterId, data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/bulk-save/${rosterId}`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      return { ...res.data, actionType: 'Bulk Save Weeks' };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 6. Add Roster Week
export const addRosterWeek = createAsyncThunk(
  'roster/addRosterWeek',
  async ({ data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/add-week`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 7. Fetch Single Roster
export const fetchRoster = createAsyncThunk(
  'roster/fetchRoster',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const query = new URLSearchParams({ month, year }).toString();
      const res = await axios.get(`${API_URL}/getroster?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 8. Fetch All Rosters
export const fetchAllRosters = createAsyncThunk(
  'roster/fetchAllRosters',
  async ({ month, year, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const query = new URLSearchParams({ month, year, page, limit }).toString();
      const res = await axios.get(`${API_URL}/rosterdetail?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 9. Update Roster Week
export const updateRosterWeek = createAsyncThunk(
  'roster/updateRosterWeek',
  async ({ weekId, data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/edit-week/${weekId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { ...res.data, actionType: 'Single Week Update' };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 10. Update Roster Employee
export const updateRosterEmployee = createAsyncThunk(
  'roster/updateRosterEmployee',
  async ({ month, year, weekNumber, employeeId, updates, skipHistory = false }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const sanitizedUpdates = { ...updates };
      delete sanitizedUpdates.isCoreTeam;
      delete sanitizedUpdates.shift;
      
      const body = {
        month, year, weekNumber, employeeId,
        updates: sanitizedUpdates,
        skipHistory
      };
      
      const res = await axios.put(`${API_URL}/update-employee`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        ...res.data,
        month, year, weekNumber, employeeId, updates: sanitizedUpdates,
        actionType: 'Single Employee Update'
      };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 11-13. Delete Employee variants
export const deleteEmployeeFromRoster = createAsyncThunk(
  'roster/deleteEmployeeFromRoster',
  async ({ rosterId, weekNumber, employeeId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee`, 
        { rosterId, weekNumber, employeeId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return { ...res.data, employeeId, rosterId, weekNumber };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

export const deleteEmployeeByUserId = createAsyncThunk(
  'roster/deleteEmployeeByUserId',
  async ({ rosterId, weekNumber, userId }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee-by-userid`, 
        { rosterId, weekNumber, userId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

export const deleteEmployeeByName = createAsyncThunk(
  'roster/deleteEmployeeByName',
  async ({ rosterId, weekNumber, employeeName }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/delete-employee-by-name`, 
        { rosterId, weekNumber, employeeName },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 14. Create Roster Range
export const createRosterForDateRange = createAsyncThunk(
  'roster/createRosterForDateRange',
  async ({ data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/create-range`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 15. Copy Employees
export const copyEmployeesToWeek = createAsyncThunk(
  'roster/copyEmployeesToWeek',
  async ({ data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/copy-employees`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 16. Export Saved Roster
export const exportSavedRoster = createAsyncThunk(
  'roster/exportSavedRoster',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/export-saved?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `roster_${month}_${year}_saved.xlsx`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=\"?(.+?)\"?;?/i);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'Saved roster Excel downloaded' };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to export roster');
    }
  }
);

// 17. Bulk Update Weeks
export const bulkUpdateWeeks = createAsyncThunk(
  'roster/bulkUpdateWeeks',
  async ({ data }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.post(`${API_URL}/bulk-update`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      return { ...res.data, actionType: 'Bulk Week Update' };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 18. Export Roster Template
export const exportRosterTemplate = createAsyncThunk(
  'roster/exportTemplate',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/export-template`, {
        params: { startDate, endDate },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const filename = `Roster_Template_${startDate}_to_${endDate}.xlsx`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename=\"?(.+?)\"?;?/i);
        if (match?.[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
      return { success: true };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 19. Rosters by Department
export const fetchRostersByDepartment = createAsyncThunk(
  'roster/fetchByDepartment',
  async ({ department, month, year, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const query = new URLSearchParams({ department, month, year, page, limit }).toString();
      const response = await axios.get(`${API_URL}/by-department?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 20-21. Attendance Updates
export const updateArrivalTime = createAsyncThunk(
  'roster/updateArrivalTime',
  async ({ rosterId, weekNumber, employeeId, date, arrivalTime }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.put(`${API_URL}/update-arrival`, 
        { rosterId, weekNumber, employeeId, date, arrivalTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || 'Arrival time updated');
      return { ...res.data, rosterId, weekNumber, employeeId, date, data: res.data.data };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

export const updateAttendance = createAsyncThunk(
  'roster/updateAttendance',
  async ({ rosterId, weekNumber, employeeId, date, transportStatus, departmentStatus, arrivalTime }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const payload = { rosterId, weekNumber, employeeId, date };
      
      if (transportStatus !== undefined && transportStatus !== '') payload.transportStatus = transportStatus;
      if (departmentStatus !== undefined && departmentStatus !== '') payload.departmentStatus = departmentStatus;
      if (arrivalTime !== undefined && arrivalTime !== '') payload.arrivalTime = arrivalTime;
      
      const res = await axios.put(`${API_URL}/update-attendance`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(res.data.message || 'Attendance updated');
      return { ...res.data, rosterId, weekNumber, employeeId, date, data: res.data.data };
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 22. Employees for Updates
export const getEmployeesForUpdates = createAsyncThunk(
  'roster/getEmployeesForUpdates',
  async ({ rosterId, weekNumber, date, page, limit, q, searchBy, month, year, delegatedFrom }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (q) params.append('q', q);
      if (searchBy) params.append('searchBy', searchBy);
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      if (delegatedFrom) params.append('delegatedFrom', delegatedFrom);
      
      const queryString = params.toString();
      const url = `${API_URL}/updates/${rosterId}/${weekNumber}/${date}${queryString ? '?' + queryString : ''}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

// 23. SuperAdmin Transport Details
export const getTransportDetailForSuperAdmin = createAsyncThunk(
  'roster/getTransportDetailForSuperAdmin',
  async ({ rosterId, weekNumber, date }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axios.get(`${API_URL}/superadmin/transport-details/${rosterId}/${weekNumber}/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      return handleError(error, { rejectWithValue });
    }
  }
);

export default {
  uploadRosterFromExcel,
  getOpsMetaCurrentWeekRoster,
  updateOpsMetaRoster,
  getRosterForBulkEdit,
  bulkUpdateRosterWeeks,
  addRosterWeek,
  fetchRoster,
  fetchAllRosters,
  updateRosterWeek,
  updateRosterEmployee,
  deleteEmployeeFromRoster,
  deleteEmployeeByUserId,
  deleteEmployeeByName,
  createRosterForDateRange,
  copyEmployeesToWeek,
  exportSavedRoster,
  bulkUpdateWeeks,
  exportRosterTemplate,
  fetchRostersByDepartment,
  updateArrivalTime,
  updateAttendance,
  getEmployeesForUpdates,
  getTransportDetailForSuperAdmin,
};
