
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:4000/api/v1";
// const API_URL = "https://crm-taskmanagement-api-7eos5.ondigitalocean.app/api/v1";
// const API_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";
const EMPLOYEE_SEARCH_THROTTLE_MS = 1200;

const normalizeEmployeeSearch = (value = "") =>
  String(value || "").trim().toLowerCase();

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
        err.response?.data?.message || err.response?.data?.error || err.message
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
        err.response?.data?.message || err.response?.data?.error || err.message
      );
    }
  }
);

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

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  localStorage.removeItem("user");
  await axios.post(`${API_URL}/logout`);
});

export const fetchEmployees = createAsyncThunk(
  "auth/fetchEmployees",
  async ({ search = "", force = false } = {}, thunkAPI) => {
    const state = thunkAPI.getState();
    const normalizedSearch = normalizeEmployeeSearch(search);
    const now = Date.now();

    const cached = state.auth.employeeSearchCache?.[normalizedSearch];
    if (!force && cached && now - cached.fetchedAt < EMPLOYEE_SEARCH_THROTTLE_MS) {
      return cached.data;
    }

    try {
      const token = state.auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employees`, {
        params: normalizedSearch ? { name: search.trim() } : undefined,
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

export const exportEmployeesExcel = createAsyncThunk(
  "auth/exportEmployeesExcel",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employees/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const disposition = res.headers?.["content-disposition"] || "";
      const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = fileNameMatch?.[1] || `Employee_Details_${new Date().toISOString().slice(0, 10)}.xlsx`;

      return { blob: res.data, fileName };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const fetchReportingManagers = createAsyncThunk(
  "auth/fetchReportingManagers",
  async (department = "Ops - Meta", thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employees/managers`, {
        params: { department },
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

export const fetchEmployeeDashboardSummary = createAsyncThunk(
  "auth/fetchEmployeeDashboardSummary",
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.get(`${API_URL}/employee/dashboard-summary`, {
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

export const acceptPolicyAgreement = createAsyncThunk(
  "auth/acceptPolicyAgreement",
  async ({ version = "v1" } = {}, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.post(
        `${API_URL}/employee/policy-accept`,
        { version },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const signPolicyDocument = createAsyncThunk(
  "auth/signPolicyDocument",
  async ({ documentUrl, signatureDataUrl, version = "v1" }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.post(
        `${API_URL}/employee/policy-sign`,
        { documentUrl, signatureDataUrl, version },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  },
  {
    condition: ({ search = "", force = false } = {}, { getState }) => {
      if (force) return true;
      const state = getState().auth;
      const normalizedSearch = normalizeEmployeeSearch(search);
      if (state.loading && state.loadingEmployeesQuery === normalizedSearch) {
        return false;
      }
      return true;
    },
  }
);

export const hrSignPolicyDocument = createAsyncThunk(
  "auth/hrSignPolicyDocument",
  async ({ userId, documentUrl, signatureDataUrl, party = "hr" }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const res = await axios.post(
        `${API_URL}/employee/${userId}/policy-sign-hr`,
        { documentUrl, signatureDataUrl, party },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const uploadEmployeeAsset = createAsyncThunk(
  "auth/uploadEmployeeAsset",
  async ({ file, assetType = "document" }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", assetType);

      const res = await axios.post(`${API_URL}/employee/upload-asset`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.asset;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

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

export const updateUserByAdmin = createAsyncThunk(
  "auth/updateUserByAdmin",
  async ({ userId, updateData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      const dataToSend = { ...updateData };
      
      if (dataToSend.password && !dataToSend.confirmPassword) {
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

export const deleteEmployeeByAdmin = createAsyncThunk(
  "auth/deleteEmployeeByAdmin",
  async ({ userId }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      if (!token) throw new Error("No admin token found");

      const res = await axios.delete(`${API_URL}/employees/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        userId,
        message: res.data?.message || "Employee deleted successfully",
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
  ,
  {
    condition: ({ search = "", force = false } = {}, { getState }) => {
      if (force) return true;
      const state = getState().auth;
      const normalizedSearch = normalizeEmployeeSearch(search);
      if (state.loading && state.loadingEmployeesQuery === normalizedSearch) {
        return false;
      }
      return true;
    },
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,

    // employee caching
    employees: [],
    employeesLoaded: false,
    employeeSearchCache: {},
    loadingEmployeesQuery: "",

    loading: false,
    error: null,
    status: null,
    message: null,
    reportingManagers: [],
    employeeDashboardSummary: null,
    
    passwordResetSuccess: false,
    passwordResetMessage: null,
  },

  reducers: {
    clearPasswordResetState: (state) => {
      state.passwordResetSuccess = false;
      state.passwordResetMessage = null;
      state.error = null;
    },
    
    clearMessages: (state) => {
      state.error = null;
      state.message = null;
      state.passwordResetMessage = null;
      state.passwordResetSuccess = false;
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;

        state.employees = [];
        state.employeesLoaded = false;
        state.employeeSearchCache = {};
        state.loadingEmployeesQuery = "";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.employees = [];
        state.employeesLoaded = false;
        state.employeeSearchCache = {};
        state.loadingEmployeesQuery = "";
      })

      .addCase(fetchEmployees.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.loadingEmployeesQuery = normalizeEmployeeSearch(action.meta?.arg?.search || "");
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        const query = normalizeEmployeeSearch(action.meta?.arg?.search || "");
        state.employeeSearchCache[query] = {
          data: action.payload,
          fetchedAt: Date.now(),
        };
        state.loadingEmployeesQuery = "";
        if (!query) {
          state.employees = action.payload;
          state.employeesLoaded = true;
        }
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loadingEmployeesQuery = "";
      })
      .addCase(fetchReportingManagers.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchReportingManagers.fulfilled, (state, action) => {
        state.reportingManagers = action.payload || [];
      })
      .addCase(fetchReportingManagers.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchEmployeeDashboardSummary.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchEmployeeDashboardSummary.fulfilled, (state, action) => {
        state.employeeDashboardSummary = action.payload;
        const profile = action.payload?.profile || {};
        if (state.user) {
          const nextUser = {
            ...state.user,
            profilePhotoUrl:
              profile.profilePhotoUrl !== undefined
                ? profile.profilePhotoUrl
                : state.user.profilePhotoUrl || "",
            profilePhotoPublicId:
              profile.profilePhotoPublicId !== undefined
                ? profile.profilePhotoPublicId
                : state.user.profilePhotoPublicId || "",
            ctc: profile.ctc ?? state.user.ctc ?? null,
            inHandSalary: profile.inHandSalary ?? state.user.inHandSalary ?? null,
            transportAllowance:
              profile.transportAllowance ?? state.user.transportAllowance ?? null,
            documents: Array.isArray(profile.documents)
              ? profile.documents
              : state.user.documents || [],
          };
          state.user = nextUser;
          localStorage.setItem("user", JSON.stringify(nextUser));
        }
      })
      .addCase(fetchEmployeeDashboardSummary.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(acceptPolicyAgreement.pending, (state) => {
        state.error = null;
      })
      .addCase(acceptPolicyAgreement.fulfilled, (state, action) => {
        const payload = action.payload || {};
        if (state.user) {
          state.user.policyAgreement = payload.policyAgreement || state.user.policyAgreement;
          localStorage.setItem("user", JSON.stringify(state.user));
        }
        if (state.employeeDashboardSummary?.profile) {
          state.employeeDashboardSummary.profile.policyAgreement = payload.policyAgreement;
        }
      })
      .addCase(acceptPolicyAgreement.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(signPolicyDocument.pending, (state) => {
        state.error = null;
      })
      .addCase(signPolicyDocument.fulfilled, (state, action) => {
        const payload = action.payload || {};
        if (state.user) {
          state.user.policyAgreement = payload.policyAgreement || state.user.policyAgreement;
          if (payload.policySignatures) {
            state.user.policySignatures = payload.policySignatures;
          }
          localStorage.setItem("user", JSON.stringify(state.user));
        }
        if (state.employeeDashboardSummary?.profile) {
          state.employeeDashboardSummary.profile.policyAgreement = payload.policyAgreement;
          if (payload.policySignatures) {
            state.employeeDashboardSummary.profile.policySignatures = payload.policySignatures;
          }
        }
      })
      .addCase(signPolicyDocument.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(hrSignPolicyDocument.pending, (state) => {
        state.error = null;
      })
      .addCase(hrSignPolicyDocument.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const targetId = String(payload.userId || "");
        if (targetId && Array.isArray(state.employees)) {
          const idx = state.employees.findIndex((u) => String(u._id) === targetId);
          if (idx >= 0) {
            state.employees[idx] = {
              ...state.employees[idx],
              policySignatures: payload.policySignatures || state.employees[idx].policySignatures || [],
            };
          }
        }
      })
      .addCase(hrSignPolicyDocument.rejected, (state, action) => {
        state.error = action.payload;
      })

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

      .addCase(updateUserByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.passwordResetSuccess = false;
        state.passwordResetMessage = null;
      })
      .addCase(updateUserByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        
        const { user, passwordReset, message } = action.payload;
        
        const index = state.employees.findIndex(
          (u) => u._id === user._id
        );
        if (index !== -1) state.employees[index] = user;
        
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
      })
      .addCase(deleteEmployeeByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployeeByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, message } = action.payload || {};
        if (userId) {
          state.employees = state.employees.filter((u) => String(u._id) !== String(userId));
        }
        state.message = message;
      })
      .addCase(deleteEmployeeByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPasswordResetState, clearMessages } = authSlice.actions;
export default authSlice.reducer;
