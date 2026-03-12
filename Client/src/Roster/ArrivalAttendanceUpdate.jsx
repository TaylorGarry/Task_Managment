import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateArrivalTime,
  updateAttendance,
  getEmployeesForUpdates,
} from "../features/slices/rosterSlice.js";
import Navbar from "../pages/Navbar.jsx";
import AdminNavbar from "../components/AdminNavbar.jsx"; 
import { Clock, CheckCircle, AlertCircle, Truck, Users } from "lucide-react";
import { toast } from "react-toastify";
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};
const STATUS_OPTIONS = [
  { value: "P", label: "Present (P)", color: "bg-green-100 text-green-800" },
  { value: "WO", label: "Weekly Off (WO)", color: "bg-blue-100 text-blue-800" },
  { value: "L", label: "Leave (L)", color: "bg-yellow-100 text-yellow-800" },
  { value: "NCNS", label: "No Call No Show (NCNS)", color: "bg-red-100 text-red-800" },
  { value: "UL", label: "Unpaid Leave (UL)", color: "bg-orange-100 text-orange-800" },
  { value: "LWP", label: "Leave Without Pay (LWP)", color: "bg-purple-100 text-purple-800" },
  { value: "BL", label: "Bereavement Leave (BL)", color: "bg-indigo-100 text-indigo-800" },
  { value: "H", label: "Holiday (H)", color: "bg-pink-100 text-pink-800" },
  { value: "LWD", label: "Last Working Day (LWD)", color: "bg-gray-100 text-gray-800" },
  { value: "HD", label: "Half Day (HD)", color: "bg-cyan-100 text-cyan-800" }
];

const ArrivalAttendanceUpdate = ({ rosterId }) => {
  const dispatch = useDispatch();
  const currentUser = getCurrentUser();
  const { updateEmployeesData, loading } = useSelector((state) => state.roster);
  const initialFetchDone = useRef(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedWeek, setSelectedWeek] = useState("");
  const [updates, setUpdates] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [viewType, setViewType] = useState({});
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  if (!rosterId) {
    return (
      <div className="min-h-screen bg-gray-100">
        {viewType.isSuperAdmin ? <AdminNavbar /> : <Navbar />}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">No Roster Selected</h3>
            <p className="text-gray-500 mt-2">
              Please select a roster from the list to start updating attendance.
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (currentUser) {
      setViewType({
        isSuperAdmin: currentUser.accountType === "superAdmin",
        isTransport: currentUser.department === "Transport",
        isTeamLeader: currentUser.accountType === "employee" &&
          ["Ops - Meta", "Marketing", "CS", "Ticketing", "HR"].includes(currentUser.department),
        username: currentUser.username,
        department: currentUser.department
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (rosterId && !initialFetchDone.current) {
      setSelectedWeek("1");
      initialFetchDone.current = true;
    }
  }, [rosterId]);

  useEffect(() => {
    if (rosterId && selectedWeek && selectedDate) {
      dispatch(getEmployeesForUpdates({
        rosterId,
        weekNumber: parseInt(selectedWeek),
        date: selectedDate
      }));
    }
  }, [dispatch, rosterId, selectedWeek, selectedDate]);

  useEffect(() => {
    if (updateEmployeesData?.data) {
      const responseData = updateEmployeesData.data;

      if (responseData.weekNumber) {
        setWeekInfo({
          weekNumber: responseData.weekNumber,
          startDate: responseData.startDate,
          endDate: responseData.endDate,
          canEdit: responseData.canEdit,
          editMessage: responseData.editMessage
        });
      }

      const weeks = responseData.weeks || [];
      if (JSON.stringify(weeks) !== JSON.stringify(availableWeeks)) {
        setAvailableWeeks(weeks);
      }

      if (!selectedWeek && weeks.length > 0) {
        setSelectedWeek(weeks[0].weekNumber.toString());
      }
    }
  }, [updateEmployeesData]);

  const rosterEntries = updateEmployeesData?.data?.rosterEntries || [];

  const handleTransportArrivalChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        transportArrivalTime: value
      }
    }));
  };

  const handleDepartmentArrivalChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        departmentArrivalTime: value
      }
    }));
  };

  const handleTransportStatusChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        transportStatus: value
      }
    }));
  };

  const handleDepartmentStatusChange = (employeeId, value) => {
    setUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        departmentStatus: value
      }
    }));
  };

  const handleTransportArrivalUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.transportArrivalTime) {
      alert(`Please select transport arrival time for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateArrivalTime({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          arrivalTime: employeeUpdate.transportArrivalTime,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          transportArrivalTime: ""
        }
      }));

      toast.success(`Transport arrival updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update transport arrival:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDepartmentArrivalUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.departmentArrivalTime) {
      alert(`Please select department arrival time for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          ...(employeeUpdate.departmentStatus && { departmentStatus: employeeUpdate.departmentStatus }),
          ...(employeeUpdate.transportStatus && { transportStatus: employeeUpdate.transportStatus }),
          arrivalTime: employeeUpdate.departmentArrivalTime,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          departmentArrivalTime: ""
        }
      }));

      toast.success(`Department arrival updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department arrival:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTransportStatusUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.transportStatus) {
      alert(`Please select transport status for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          transportStatus: employeeUpdate.transportStatus,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          transportStatus: ""
        }
      }));

      toast.success(`Transport status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update transport status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDepartmentStatusUpdate = async (employee) => {
    const employeeUpdate = updates[employee._id];
    if (!employeeUpdate?.departmentStatus) {
      alert(`Please select department status for ${employee.name}`);
      return;
    }

    setUpdatingId(employee._id);

    try {
      await dispatch(
        updateAttendance({
          rosterId,
          weekNumber: parseInt(selectedWeek),
          employeeId: employee._id,
          date: selectedDate,
          departmentStatus: employeeUpdate.departmentStatus,
        })
      ).unwrap();

      setUpdates(prev => ({
        ...prev,
        [employee._id]: {
          ...prev[employee._id],
          departmentStatus: ""
        }
      }));

      toast.success(`Department status updated for ${employee.name}`);
    } catch (error) {
      console.error("Failed to update department status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getTodayStatus = (employee) => {
    if (!employee?.dailyStatus) return null;

    return employee.dailyStatus.find(
      d => new Date(d.date).toDateString() === new Date(selectedDate).toDateString()
    );
  };

 const formatTimeForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

const formatTimeForDisplay = (dateString) => {
  if (!dateString) return '--:--';
  try {
    const date = new Date(dateString);
    // Use UTC methods to prevent timezone conversion
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return '--:--';
  }
};

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const canUpdateTransport = (viewType.isTransport || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;
  const canUpdateDepartment = (viewType.isTeamLeader || viewType.isSuperAdmin) && weekInfo?.canEdit !== false;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Please login to continue</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ✅ Conditional navbar based on user type */}
      {viewType.isSuperAdmin ? <AdminNavbar /> : <Navbar />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Attendance & Arrival Updates
              </h1>
              <p className="text-gray-600 mt-1">
                Update employee attendance and arrival times
              </p>
            </div>

            {/* User Role Badge */}
            <div className={`px-4 py-2 rounded-lg ${viewType.isSuperAdmin ? "bg-purple-100 text-purple-800" :
                viewType.isTransport ? "bg-blue-100 text-blue-800" :
                  "bg-green-100 text-green-800"
              }`}>
              <span className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {viewType.isSuperAdmin && "👑 Super Admin"}
                {viewType.isTransport && "🚌 Transport"}
                {viewType.isTeamLeader && `👥 Team Leader: ${currentUser.username}`}
              </span>
            </div>
          </div>

          {/* Week Info Banner */}
          {weekInfo && (
            <div className={`mt-4 p-3 rounded-lg ${weekInfo.canEdit ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
              }`}>
              <p className="text-sm font-medium">
                Week {weekInfo.weekNumber}: {new Date(weekInfo.startDate).toLocaleDateString()} - {new Date(weekInfo.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs mt-1">{weekInfo.editMessage}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Choose a week</option>
                {availableWeeks.map((week) => (
                  <option key={week.weekNumber} value={week.weekNumber}>
                    Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}) - {week.employeeCount || 0} employees
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Employees:</span> {rosterEntries.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Department:</span> {currentUser.department}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-semibold">Team Leader:</span> {currentUser.username}
              </p>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
        ) : rosterEntries.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cab Route</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Leader</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Arrival</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept Arrival</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rosterEntries.map((employee) => {
                  const todayStatus = getTodayStatus(employee);
                  const employeeUpdate = updates[employee._id] || {};
                  const isUpdating = updatingId === employee._id;

                  return (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{employee.department}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${employee.transport === "Yes"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          }`}>
                          {employee.transport || "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{employee.cabRoute || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{employee.teamLeader || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {employee.shiftStartHour}:00 - {employee.shiftEndHour}:00
                      </td>

                      {/* Transport Status Display */}
                      <td className="px-4 py-3">
                        {todayStatus?.transportStatus ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.transportStatus)}`}>
                            {todayStatus.transportStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not set</span>
                        )}
                      </td>

                      {/* Department Status Display */}
                      <td className="px-4 py-3">
                        {todayStatus?.departmentStatus ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todayStatus.departmentStatus)}`}>
                            {todayStatus.departmentStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          {(() => {
                            const updates = [];

                            if (todayStatus?.transportStatus && todayStatus.transportStatusUpdatedAt) {
                              updates.push({
                                type: 'Transport Status',
                                value: todayStatus.transportStatus,
                                time: new Date(todayStatus.transportStatusUpdatedAt).getTime(),
                                icon: '🚌',
                                color: 'text-blue-600'
                              });
                            }

                            if (todayStatus?.departmentStatus && todayStatus.departmentStatusUpdatedAt) {
                              updates.push({
                                type: 'Dept Status',
                                value: todayStatus.departmentStatus,
                                time: new Date(todayStatus.departmentStatusUpdatedAt).getTime(),
                                icon: '👥',
                                color: 'text-green-600'
                              });
                            }

                            if (todayStatus?.transportArrivalTime && todayStatus.transportUpdatedAt) {
                              updates.push({
                                type: 'Transport Arrival',
                                value: formatTimeForDisplay(todayStatus.transportArrivalTime), // ✅ Use your function
                                time: new Date(todayStatus.transportUpdatedAt).getTime(),
                                icon: '🚌',
                                color: 'text-blue-600'
                              });
                            }

                            if (todayStatus?.departmentArrivalTime && todayStatus.departmentUpdatedAt) {
                              updates.push({
                                type: 'Dept Arrival',
                                value: formatTimeForDisplay(todayStatus.departmentArrivalTime), // ✅ Use your function
                                time: new Date(todayStatus.departmentUpdatedAt).getTime(),
                                icon: '👥',
                                color: 'text-green-600'
                              });
                            }

                            // Sort by time (most recent first) and take the first one
                            const mostRecent = updates.sort((a, b) => b.time - a.time)[0];

                            if (mostRecent) {
                              return (
                                <div className={`${mostRecent.color} flex items-center gap-1`}
                                  title={`${mostRecent.type} - ${new Date(mostRecent.time).toLocaleString()}`}>
                                  <span>{mostRecent.icon}</span>
                                  <span>{mostRecent.type}: {mostRecent.value}</span>
                                </div>
                              );
                            }

                            return <span className="text-gray-400">No updates</span>;
                          })()}
                        </div>
                      </td>

                      {/* Transport Arrival - Input OR Display Value */}
                      <td className="px-4 py-3">
                        {canUpdateTransport ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={
                                employeeUpdate.transportArrivalTime !== undefined
                                  ? employeeUpdate.transportArrivalTime
                                  : (todayStatus?.transportArrivalTime
                                    ? formatTimeForInput(todayStatus.transportArrivalTime)
                                    : '')
                              }
                              onChange={(e) => handleTransportArrivalChange(employee._id, e.target.value)}
                              disabled={isUpdating}
                              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              placeholder="Transport"
                            />
                            {todayStatus?.transportArrivalTime && !employeeUpdate.transportArrivalTime && (
                              <span className="text-[10px] text-blue-600">
                                Current: {formatTimeForDisplay(todayStatus.transportArrivalTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700">
                            {todayStatus?.transportArrivalTime ? (
                              <span className="text-blue-600 font-medium">
                                {formatTimeForDisplay(todayStatus.transportArrivalTime)}
                              </span>
                            ) : (
                              <span className="text-gray-400">--:-- --</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Department Arrival - Input OR Display Value */}
                      <td className="px-4 py-3">
                        {canUpdateDepartment ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="time"
                              value={
                                employeeUpdate.departmentArrivalTime !== undefined
                                  ? employeeUpdate.departmentArrivalTime
                                  : (todayStatus?.departmentArrivalTime
                                    ? formatTimeForInput(todayStatus.departmentArrivalTime)
                                    : '')
                              }
                              onChange={(e) => handleDepartmentArrivalChange(employee._id, e.target.value)}
                              disabled={isUpdating}
                              className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                              placeholder="Department"
                            />
                            {todayStatus?.departmentArrivalTime && !employeeUpdate.departmentArrivalTime && (
                              <span className="text-[10px] text-green-600">
                                Current: {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700">
                            {todayStatus?.departmentArrivalTime ? (
                              <span className="text-green-600 font-medium">
                                {formatTimeForDisplay(todayStatus.departmentArrivalTime)}
                              </span>
                            ) : (
                              <span className="text-gray-400">--:-- --</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {/* Transport Status Update - WITH EXISTING VALUE */}
                          {canUpdateTransport && (
                            <div className="flex flex-col gap-1 mb-2">
                              <select
                                value={
                                  employeeUpdate.transportStatus !== undefined
                                    ? employeeUpdate.transportStatus
                                    : (todayStatus?.transportStatus || '')
                                }
                                onChange={(e) => handleTransportStatusChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="">Transport Attendance</option>
                                {STATUS_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {todayStatus?.transportStatus && !employeeUpdate.transportStatus && (
                                <span className="text-[10px] text-blue-600">
                                  Current: {todayStatus.transportStatus}
                                </span>
                              )}
                              {employeeUpdate.transportStatus && employeeUpdate.transportStatus !== todayStatus?.transportStatus && (
                                <button
                                  onClick={() => handleTransportStatusUpdate(employee)}
                                  disabled={isUpdating}
                                  className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Update Transport Status
                                </button>
                              )}
                            </div>
                          )}

                          {/* Department Status Update - WITH EXISTING VALUE */}
                          {canUpdateDepartment && (
                            <div className="flex flex-col gap-1 mb-2">
                              <select
                                value={
                                  employeeUpdate.departmentStatus !== undefined
                                    ? employeeUpdate.departmentStatus
                                    : (todayStatus?.departmentStatus || '')
                                }
                                onChange={(e) => handleDepartmentStatusChange(employee._id, e.target.value)}
                                disabled={isUpdating}
                                className="w-32 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                              >
                                <option value="">Dept ATTENDANCE</option>
                                {STATUS_OPTIONS.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {todayStatus?.departmentStatus && !employeeUpdate.departmentStatus && (
                                <span className="text-[10px] text-green-600">
                                  Current: {todayStatus.departmentStatus}
                                </span>
                              )}
                              {employeeUpdate.departmentStatus && employeeUpdate.departmentStatus !== todayStatus?.departmentStatus && (
                                <button
                                  onClick={() => handleDepartmentStatusUpdate(employee)}
                                  disabled={isUpdating}
                                  className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Update Dept Status
                                </button>
                              )}
                            </div>
                          )}

                          {/* Transport Arrival Update */}
                          {canUpdateTransport && employeeUpdate.transportArrivalTime && employeeUpdate.transportArrivalTime !== formatTimeForInput(todayStatus?.transportArrivalTime) && (
                            <button
                              onClick={() => handleTransportArrivalUpdate(employee)}
                              disabled={isUpdating}
                              className="bg-blue-600 text-white px-2 py-1 text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1 mt-1"
                            >
                              <Truck className="w-3 h-3" />
                              Update Transport Arrival
                            </button>
                          )}

                          {/* Department Arrival Update */}
                          {canUpdateDepartment && employeeUpdate.departmentArrivalTime && employeeUpdate.departmentArrivalTime !== formatTimeForInput(todayStatus?.departmentArrivalTime) && (
                            <button
                              onClick={() => handleDepartmentArrivalUpdate(employee)}
                              disabled={isUpdating}
                              className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1 mt-1"
                            >
                              <Users className="w-3 h-3" />
                              Update Dept Arrival
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No employees found</h3>
            <p className="text-gray-500 mt-2">
              {selectedWeek ? "No employees available for the selected criteria" : "Please select a week to view employees"}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {STATUS_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></span>
                <span className="text-xs text-gray-600">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArrivalAttendanceUpdate;