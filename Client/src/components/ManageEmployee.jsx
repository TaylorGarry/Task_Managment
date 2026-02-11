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
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );

  return (
    <div className="p-6 mt-10 ">
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "oklch(70.4% 0.04 256.788)" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Username</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Department</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Shift</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Core Team</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {localEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.department || "N/A"}</TableCell>
                    <TableCell>
                      {user.shiftLabel
                        ? user.shiftLabel
                        : getShiftLabel(user.shiftStartHour, user.shiftEndHour)}
                    </TableCell>
                    <TableCell>{user.isCoreTeam ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleOpenDialog(user)}
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
        />
      </Paper>

      <Dialog open={!!selectedUser} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-4 mt-2">
            <TextField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Shift Timing"
              name="shiftLabel"
              value={formData.shiftLabel}
              onChange={handleChange}
              fullWidth
              margin="normal"
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
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

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={
              (formData.password || formData.confirmPassword) && 
              (formData.password !== formData.confirmPassword || formData.password.length < 6)
            }
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