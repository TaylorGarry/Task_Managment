import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getTransportDetailForSuperAdmin,
  fetchAllRosters,
} from "../features/slices/rosterSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx"
import { 
  Clock, 
  AlertCircle, 
  Truck, 
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { toast } from "react-toastify";

const SuperAdminTransportView = () => {
  const dispatch = useDispatch();
  const { superAdminTransportData, loading, allRosters } = useSelector((state) => state.roster);
  
  const [selectedRosterId, setSelectedRosterId] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    dispatch(fetchAllRosters({ page: 1, limit: 50 }));
  }, [dispatch]);

  const rosters = allRosters?.data || [];

  useEffect(() => {
    if (selectedRosterId && selectedWeek && selectedDate) {
      fetchSuperAdminData();
    }
  }, [selectedRosterId, selectedWeek, selectedDate]);

  useEffect(() => {
    let interval;
    if (autoRefresh && selectedRosterId && selectedWeek && selectedDate) {
      interval = setInterval(() => {
        fetchSuperAdminData(true);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedRosterId, selectedWeek, selectedDate]);

  const fetchSuperAdminData = async (silent = false) => {
    try {
      await dispatch(
        getTransportDetailForSuperAdmin({
          rosterId: selectedRosterId,
          weekNumber: parseInt(selectedWeek),
          date: selectedDate,
        })
      ).unwrap();
      
      if (!silent) {
        toast.success("Data refreshed successfully");
      }
    } catch (error) {
      if (!silent) {
        toast.error("Failed to fetch data");
      }
    }
  };
  useEffect(() => {
    if (selectedRosterId) {
      const selectedRoster = rosters.find(r => r._id === selectedRosterId);
      if (selectedRoster?.weeks) {
        setAvailableWeeks(selectedRoster.weeks);
        if (selectedRoster.weeks.length > 0 && !selectedWeek) {
          setSelectedWeek(selectedRoster.weeks[0].weekNumber.toString());
        }
      }
    }
  }, [selectedRosterId, rosters]);

  const data = superAdminTransportData?.data;
  const employees = data?.employees || [];
  const summary = data?.summary || {};
  const filteredEmployees = employees.filter(emp => {
    if (departmentFilter && emp.department !== departmentFilter) return false;
    if (attendanceFilter === "transport" && !emp.transportStatus) return false;
    if (attendanceFilter === "department" && !emp.departmentStatus) return false;
    if (attendanceFilter === "both" && (!emp.transportStatus || !emp.departmentStatus)) return false;
    return true;
  });
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString();
  };
  const exportToCSV = () => {
    const headers = [
      'Employee', 'Department', 'Transport', 'Team Leader', 'Shift',
      'Transport ATTENDANCE', 'Transport Updated By', 'Transport Updated At',
      'Department ATTENDANCE', 'Department Updated By', 'Department Updated At',
      'Transport Arrival', 'Transport Arrival By', 'Transport Arrival At',
      'Department Arrival', 'Department Arrival By', 'Department Arrival At'
    ];

    const csvData = filteredEmployees.map(emp => [
      emp.name,
      emp.department,
      emp.transport,
      emp.teamLeader,
      `${emp.shiftStartHour}:00-${emp.shiftEndHour}:00`,
      emp.transportStatus || '—',
      emp.transportStatusUpdatedBy?.username || '—',
      emp.transportStatusUpdatedAt ? new Date(emp.transportStatusUpdatedAt).toLocaleString() : '—',
      emp.departmentStatus || '—',
      emp.departmentStatusUpdatedBy?.username || '—',
      emp.departmentStatusUpdatedAt ? new Date(emp.departmentStatusUpdatedAt).toLocaleString() : '—',
      emp.transportArrivalTime ? formatTime(emp.transportArrivalTime) : '—',
      emp.transportUpdatedBy?.username || '—',
      emp.transportUpdatedAt ? new Date(emp.transportUpdatedAt).toLocaleString() : '—',
      emp.departmentArrivalTime ? formatTime(emp.departmentArrivalTime) : '—',
      emp.departmentUpdatedBy?.username || '—',
      emp.departmentUpdatedAt ? new Date(emp.departmentUpdatedAt).toLocaleString() : '—'
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superadmin-transport-${data?.weekNumber}-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Super Admin Transport Overview
              </h1>
              <p className="text-gray-600 mt-1">
                Complete visibility of all transport and department attendance
              </p>
            </div>
            
            {/* Role Badge */}
            <div className="bg-purple-100 px-4 py-2 rounded-lg">
              <span className="font-semibold text-purple-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                👑 Super Admin
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Roster
              </label>
              <select
                value={selectedRosterId}
                onChange={(e) => setSelectedRosterId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Choose a roster</option>
	                {rosters.map((roster) => (
	                  <option key={roster._id} value={roster._id}>
	                    {new Date(roster.rosterStartDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(roster.rosterEndDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} ({roster.month}/{roster.year})
	                  </option>
	                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                disabled={!selectedRosterId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100"
              >
                <option value="">Choose a week</option>
	                {availableWeeks.map((week) => (
	                  <option key={week.weekNumber} value={week.weekNumber}>
	                    Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} - {new Date(week.endDate).toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })})
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div> 
            <div className="flex items-end gap-2">
              <button
                onClick={() => fetchSuperAdminData()}
                disabled={!selectedRosterId || !selectedWeek || loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg border ${
                  autoRefresh 
                    ? 'bg-green-100 border-green-500 text-green-700' 
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
                title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div> 
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {filteredEmployees.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div> 
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Filter
                </label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Employees</option>
                  <option value="transport">Has Transport Attendance</option>
                  <option value="department">Has Department Attendance</option>
                  <option value="both">Has Both Attendances</option>
                </select>
              </div>
              <div className="flex items-end">
                {(departmentFilter || attendanceFilter) && (
                  <button
                    onClick={() => {
                      setDepartmentFilter("");
                      setAttendanceFilter("");
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )} 
          {data && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-blue-600">Total Employees</div>
                <div className="text-xl font-bold text-blue-800">{summary.totalEmployees || 0}</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-xs text-indigo-600">Transport Attendance</div>
                <div className="text-xl font-bold text-indigo-800">{summary.employeesWithTransportStatus || 0}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-green-600">Department Attendance</div>
                <div className="text-xl font-bold text-green-800">{summary.employeesWithDepartmentStatus || 0}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-purple-600">Transport Arrival</div>
                <div className="text-xl font-bold text-purple-800">{summary.employeesWithTransportArrival || 0}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-xs text-orange-600">Department Arrival</div>
                <div className="text-xl font-bold text-orange-800">{summary.employeesWithDepartmentArrival || 0}</div>
              </div>
            </div>
          )}
        </div> 
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transport details...</p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50" colSpan="2">Employee</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50" colSpan="3">Transport ATTENDANCE</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50" colSpan="3">Department ATTENDANCE</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50" colSpan="3">Transport Arrival</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50" colSpan="3">Department Arrival</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Dept</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Attendance</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated At</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Attendance</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated At</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated At</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Updated At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((emp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-3 py-3">
                      {emp.transportStatus ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          emp.transportStatus === 'P' ? 'bg-green-100 text-green-800' :
                          emp.transportStatus === 'WO' ? 'bg-blue-100 text-blue-800' :
                          emp.transportStatus === 'L' ? 'bg-yellow-100 text-yellow-800' :
                          emp.transportStatus === 'BL' ? 'bg-indigo-100 text-indigo-800' :
                          emp.transportStatus === 'H' ? 'bg-pink-100 text-pink-800' :
                          emp.transportStatus === 'HD' ? 'bg-cyan-100 text-cyan-800' :
                          emp.transportStatus === 'NCNS' ? 'bg-red-200 text-red-800' :
                          emp.transportStatus === 'UL' ? 'bg-orange-100 text-orange-800' :
                          emp.transportStatus === 'LWP' ? 'bg-purple-100 text-purple-800' :
                          emp.transportStatus === 'LWD' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.transportStatus}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.transportStatusUpdatedBy?.username || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.transportStatusUpdatedAt ? formatDateTime(emp.transportStatusUpdatedAt) : '—'}</td>
                    <td className="px-3 py-3">
                      {emp.departmentStatus ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          emp.departmentStatus === 'P' ? 'bg-green-100 text-green-800' :
                          emp.departmentStatus === 'WO' ? 'bg-blue-100 text-blue-800' :
                          emp.departmentStatus === 'L' ? 'bg-yellow-100 text-yellow-800' :
                          emp.departmentStatus === 'BL' ? 'bg-indigo-100 text-indigo-800' :
                          emp.departmentStatus === 'H' ? 'bg-pink-100 text-pink-800' :
                          emp.departmentStatus === 'HD' ? 'bg-cyan-100 text-cyan-800' :
                          emp.departmentStatus === 'NCNS' ? 'bg-red-200 text-red-800' :
                          emp.departmentStatus === 'UL' ? 'bg-orange-100 text-orange-800' :
                          emp.departmentStatus === 'LWP' ? 'bg-purple-100 text-purple-800' :
                          emp.departmentStatus === 'LWD' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {emp.departmentStatus}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.departmentStatusUpdatedBy?.username || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.departmentStatusUpdatedAt ? formatDateTime(emp.departmentStatusUpdatedAt) : '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.transportArrivalTime ? formatTime(emp.transportArrivalTime) : '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.transportUpdatedBy?.username || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.transportUpdatedAt ? formatDateTime(emp.transportUpdatedAt) : '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.departmentArrivalTime ? formatTime(emp.departmentArrivalTime) : '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.departmentUpdatedBy?.username || '—'}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{emp.departmentUpdatedAt ? formatDateTime(emp.departmentUpdatedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedRosterId && selectedWeek ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Data Found</h3>
            <p className="text-gray-500 mt-2">
              No transport or department attendance found for the selected criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Select Filters</h3>
            <p className="text-gray-500 mt-2">
              Please select a roster, week, and date to view transport details.
            </p>
          </div>
        )} 
        {data && Object.keys(summary.transportStatusBreakdown || {}).length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Transport Attendance Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(summary.transportStatusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Department Attendance Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(summary.departmentStatusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{status}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminTransportView;
