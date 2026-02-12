import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress,
  IconButton, InputAdornment
} from "@mui/material";
import DialogBox from "./Dialogbox";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees, updateUserByAdmin } from "../features/slices/authSlice.js";
import toast from "react-hot-toast";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const shiftOptions = [
  { label: "1am-10am", value: "1am-10am" },
  { label: "4pm-1am", value: "4pm-1am" },
  { label: "5pm-2am", value: "5pm-2am" },
  { label: "6pm-3am", value: "6pm-3am" },
  { label: "8pm-5am", value: "8pm-5am" },
  { label: "11pm-8am", value: "11pm-8am"}
];

const getShiftLabel = (start, end) => {
  if (start === undefined || end === undefined || start === null || end === null)
    return "N/A";

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}${suffix}`;
  };
  return `${formatHour(start)}-${formatHour(end)}`;
};

const ManageEmployee = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.auth);
  const [openDialogBox, setOpenDialogBox] = useState(false)
  const [localEmployees, setLocalEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    department: "",
    shiftLabel: "",
    isCoreTeam: false,
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loadedOnce) {
      dispatch(fetchEmployees())
        .unwrap()
        .then((data) => {
          setLocalEmployees(data);
          setLoadedOnce(true);
        })
        .catch(() => toast.error("Failed to load employees"));
    }
  }, [dispatch, loadedOnce]);

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      department: user.department || "",
      shiftLabel:
        user.shiftLabel ||
        getShiftLabel(user.shiftStartHour, user.shiftEndHour),
      isCoreTeam: user.isCoreTeam || false,
      password: "",
      confirmPassword: ""
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      department: "",
      shiftLabel: "",
      isCoreTeam: false,
      password: "",
      confirmPassword: ""
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      if (formData.password || formData.confirmPassword) {
        if (!formData.password || !formData.confirmPassword) {
          toast.error("Both password fields are required for password reset");
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }
        
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          return;
        }
      }

      let shiftStartHour = null;
      let shiftEndHour = null;

      if (formData.shiftLabel) {
        const [start, end] = formData.shiftLabel.split("-");
        const parseHour = (str) => {
          const hour = parseInt(str);
          const isPM = str.toLowerCase().includes("pm");
          return (isPM && hour !== 12) ? hour + 12 : (hour === 12 && !isPM ? 0 : hour);
        };
        shiftStartHour = parseHour(start);
        shiftEndHour = parseHour(end);
      }

      const updateData = {
        username: formData.username,
        department: formData.department,
        isCoreTeam: formData.isCoreTeam,
        shiftLabel: formData.shiftLabel,
        shiftStartHour,
        shiftEndHour,
      };

      if (formData.password) {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }

      const result = await dispatch(
        updateUserByAdmin({ userId: selectedUser._id, updateData })
      ).unwrap();

      if (formData.password) {
        toast.success("Employee updated and password reset successfully!");
      } else {
        toast.success("Employee updated successfully!");
      }

      setLocalEmployees((prev) =>
        prev.map((u) => (u._id === selectedUser._id ? { ...u, ...result.user } : u))
      );

      handleCloseDialog();
       setOpenDialogBox(true);
    } catch (err) {
      toast.error(err || "Failed to update employee");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (loading && localEmployees.length === 0)
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-slate-600">
          <CircularProgress size={24} />
          <span className="text-sm font-medium">Loading employees...</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 mt-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Employee Workspace</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Manage Employees</h1>
            <p className="mt-2 text-sm text-slate-600">
              Update department, shift, core team status, and password in one place.
            </p>
          </div>
          <div className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
            Total Employees: {localEmployees.length}
          </div>
        </div>
      </div>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
          backgroundColor: "#ffffff",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Username</TableCell>
                <TableCell sx={{ color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Department</TableCell>
                <TableCell sx={{ color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Shift</TableCell>
                <TableCell sx={{ color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Core Team</TableCell>
                <TableCell sx={{ color: "#0f172a", fontWeight: 700, borderBottom: "1px solid #e2e8f0" }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {localEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow
                    key={user._id}
                    hover
                    sx={{
                      "& td": { borderBottom: "1px solid #f1f5f9" },
                      "&:last-child td": { borderBottom: "none" },
                    }}
                  >
                    <TableCell sx={{ color: "#0f172a", fontWeight: 600 }}>{user.username}</TableCell>
                    <TableCell sx={{ color: "#334155" }}>{user.department || "N/A"}</TableCell>
                    <TableCell>
                      {user.shiftLabel
                        ? user.shiftLabel
                        : getShiftLabel(user.shiftStartHour, user.shiftEndHour)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.isCoreTeam
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {user.isCoreTeam ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "9999px",
                          px: 1.8,
                          py: 0.35,
                          minWidth: 0,
                          borderColor: "#93c5fd",
                          color: "#1d4ed8",
                          "&:hover": {
                            borderColor: "#60a5fa",
                            backgroundColor: "#eff6ff",
                          },
                          cursor: "pointer",
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={localEmployees.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        />
      </Paper>

      <Dialog
        open={!!selectedUser}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#0f172a" }}>
          Edit Employee
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#f8fafc" }}>
          <div className="flex flex-col gap-4 mt-2">
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
            />
            <TextField
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
            />
            <TextField
              select
              label="Shift Timing"
              name="shiftLabel"
              value={formData.shiftLabel}
              onChange={handleChange}
              fullWidth
              margin="normal"
              sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
            >
              {shiftOptions.map((shift) => (
                <MenuItem key={shift.value} value={shift.value}>
                  {shift.label}
                </MenuItem>
              ))}
            </TextField>

            <div className="flex items-center gap-2 mb-4">
              <label className="font-medium">Core Team:</label>
              <input
                type="checkbox"
                name="isCoreTeam"
                checked={formData.isCoreTeam}
                onChange={handleChange}
              />
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Reset Password</h3>
              <p className="text-sm text-gray-500 mb-4">
                Leave blank to keep current password
              </p>
              
              <TextField
                label="New Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ cursor: "pointer" }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                margin="normal"
                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end" sx={{ cursor: "pointer" }}>
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
              
              {formData.password && formData.password.length < 6 && (
                <p className="text-red-500 text-sm mt-1">Password must be at least 6 characters</p>
              )}
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ borderTop: "1px solid #e2e8f0", px: 3, py: 2, backgroundColor: "#fff" }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "#475569", cursor: "pointer" }}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleSave}
            disabled={
              (formData.password || formData.confirmPassword) && 
              (formData.password !== formData.confirmPassword || formData.password.length < 6)
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2563eb",
              "&:hover": { backgroundColor: "#1d4ed8" },
              cursor: "pointer",
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

       {/*  SUCCESS DIALOG */}
      <DialogBox
        open={openDialogBox}
        onClose={() => setOpenDialogBox(false)}
      />
    </div>
  );
};

export default ManageEmployee;
