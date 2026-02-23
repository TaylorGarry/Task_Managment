import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
<<<<<<< HEAD
import { fetchDefaulters } from "../features/slices/taskSlice.js";
=======
import { fetchDefaulters,exportEmployeeDefaulterExcel } from "../features/slices/taskSlice.js";
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
import { fetchEmployees } from "../features/slices/authSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx";

const Defaulter = () => {
  const dispatch = useDispatch();
  const { defaulters, loading } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.auth);
<<<<<<< HEAD
  const today = new Date().toISOString().split("T")[0];
=======
  
  // ===========================================
  // OVERNIGHT SHIFT DATE HANDLING
  // ===========================================
  
  // Get IST time and apply overnight shift logic (before 10 AM = previous day)
  const getISTBusinessDate = () => {
    const now = new Date();
    // Convert to IST
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 60 * 60000);
    
    // Before 10 AM IST, it's still the previous business day
    if (ist.getHours() < 10) {
      ist.setDate(ist.getDate() - 1);
    }
    
    // Format to YYYY-MM-DD
    const year = ist.getFullYear();
    const month = String(ist.getMonth() + 1).padStart(2, '0');
    const day = String(ist.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  const today = getISTBusinessDate();

  // Format date for display (backend already handles overnight logic)
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  // Check if current time is in overnight period
  const isOvernightPeriod = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 60 * 60000);
    return ist.getHours() < 10;
  };

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    department: "",
    shift: "",
    employee: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeDefaults, setEmployeeDefaults] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
<<<<<<< HEAD
=======
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(0);
  const [modalTotalDefaults, setModalTotalDefaults] = useState(0);
  const modalItemsPerPage = 30;
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Chart data state
  const [chartType, setChartType] = useState('pie');
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  useEffect(() => {
    dispatch(fetchDefaulters(filters));
    dispatch(fetchEmployees());
  }, [dispatch, filters]);

<<<<<<< HEAD
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if ((name === "startDate" || name === "endDate") && value > today) return;
=======
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Use overnight-aware today date for validation
    if ((name === "startDate" || name === "endDate") && value > today) {
      alert(`Cannot select future date. Current business date is ${today}`);
      return;
    }
    
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };

<<<<<<< HEAD
  const handleViewAll = async (employeeId, employeeName) => {
    try {
      setModalLoading(true);
      setModalOpen(true);

      const token = localStorage.getItem("token");
      const res = await fetch(
        ` https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks/employee-defaulters/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const data = await res.json();
      if (data.success) {
        setSelectedEmployee(data.employeeName);
        setEmployeeDefaults(data.data || []);
      } else {
        setSelectedEmployee(employeeName);
        setEmployeeDefaults([]);
      }
    } catch (error) {
      setSelectedEmployee(employeeName);
      setEmployeeDefaults([]);
=======
  const handleExportEmployeeDefaults = async () => {
    if (!selectedEmployeeId) return;

    try {
      const resultAction = await dispatch(
        exportEmployeeDefaulterExcel({
          employeeId: selectedEmployeeId,
          startDate: filters.startDate,
          endDate: filters.endDate,
        })
      );

      if (exportEmployeeDefaulterExcel.fulfilled.match(resultAction)) {
        const { blob, filename } = resultAction.payload;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const fetchEmployeeDefaultPage = async (employeeId, employeeName, page = 1) => {
    try {
      setModalLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      const query = new URLSearchParams({
        page: String(page),
        limit: String(modalItemsPerPage),
        startDate: filters.startDate,
        endDate: filters.endDate
      }).toString();

      // const res = await fetch(
      //   `http://localhost:4000/api/v1/tasks/employee-defaulter/${employeeId}?${query}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      const res = await fetch(
        `https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks/employee-defaulter/${employeeId}?${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setSelectedEmployee(data.employeeName || employeeName);
        setEmployeeDefaults(data.data || []);
        setModalCurrentPage(data.currentPage || page);
        setModalTotalPages(data.totalPages || 0);
        setModalTotalDefaults(data.totalDefaults || 0);
      } else {
        setSelectedEmployee(employeeName);
        setEmployeeDefaults([]);
        setModalCurrentPage(page);
        setModalTotalPages(0);
        setModalTotalDefaults(0);
      }
    } catch (error) {
      console.error("Fetch employee defaults error:", error);
      setSelectedEmployee(employeeName);
      setEmployeeDefaults([]);
      setModalCurrentPage(page);
      setModalTotalPages(0);
      setModalTotalDefaults(0);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
    } finally {
      setModalLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const handleViewAll = async (employeeId, employeeName) => {
    setModalOpen(true);
    setSelectedEmployeeId(employeeId);
    setSelectedEmployee(employeeName);
    await fetchEmployeeDefaultPage(employeeId, employeeName, 1);
  };

  const handleModalPageChange = async (page) => {
    if (!selectedEmployeeId || page < 1 || page > modalTotalPages || page === modalCurrentPage) return;
    await fetchEmployeeDefaultPage(selectedEmployeeId, selectedEmployee, page);
  };
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

<<<<<<< HEAD
  const grandTotals = defaulters?.reduce(
    (acc, d) => ({
      notDoneToday: acc.notDoneToday + (d.notDoneTasksToday || 0),
      totalTillDate: acc.totalTillDate + (d.totalDefaultsTillDate || 0),
    }),
    { notDoneToday: 0, totalTillDate: 0 }
  );
=======
  // Calculate totals correctly
  const calculateTotals = () => {
    if (!defaulters || defaulters.length === 0) {
      return { totalDefaultDay: 0, totalCumulative: 0 };
    }

    // Sum of Default Day column
    const totalDefaultDay = defaulters.reduce((sum, d) => sum + (d.notDoneTasksToday || 0), 0);

    // For Total Defaults Till Today, each record has the cumulative total for that employee
    // Get unique employees and their cumulative totals
    const employeeTotals = new Map();
    defaulters.forEach(d => {
      if (d.employeeId && d.totalDefaultsTillDate !== undefined) {
        // All records for the same employee have the same totalDefaultsTillDate
        employeeTotals.set(d.employeeId, d.totalDefaultsTillDate);
      }
    });

    const totalCumulative = Array.from(employeeTotals.values()).reduce((sum, total) => sum + total, 0);

    return { totalDefaultDay, totalCumulative };
  };

  const { totalDefaultDay, totalCumulative } = calculateTotals();

  // Prepare data for charts
  const prepareChartData = () => {
    if (!defaulters || defaulters.length === 0) {
      return {
        labels: [],
        dailyData: [],
        cumulativeData: [],
        topEmployees: []
      };
    }
    
    // Aggregate data by employee for charts
    const employeeData = {};
    defaulters.forEach(d => {
      if (d.employeeId && d.employeeName) {
        if (!employeeData[d.employeeId]) {
          employeeData[d.employeeId] = {
            name: d.employeeName,
            dailyDefaults: 0,
            cumulativeDefaults: d.totalDefaultsTillDate || 0
          };
        }
        employeeData[d.employeeId].dailyDefaults += d.notDoneTasksToday || 0;
      }
    });
    
    const sortedEmployees = Object.values(employeeData)
      .sort((a, b) => b.cumulativeDefaults - a.cumulativeDefaults)
      .slice(0, 5); // Top 5 employees for charts
    
    return {
      labels: sortedEmployees.map(e => e.name),
      dailyData: sortedEmployees.map(e => e.dailyDefaults),
      cumulativeData: sortedEmployees.map(e => e.cumulativeDefaults),
      topEmployees: sortedEmployees
    };
  };

  const chartData = prepareChartData();

  // Chart colors
  const chartColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
  ];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = defaulters?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((defaulters?.length || 0) / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const modalFrom = employeeDefaults.length > 0 ? (modalCurrentPage - 1) * modalItemsPerPage + 1 : 0;
  const modalTo = employeeDefaults.length > 0 ? modalFrom + employeeDefaults.length - 1 : 0;

  // Function to render pie chart
  const renderPieChart = () => {
    if (chartData.dailyData.length === 0) return null;

    const total = chartData.dailyData.reduce((sum, val) => sum + val, 0);
    if (total <= 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
          No daily defaults to visualize
        </div>
      );
    }
    let cumulativePercent = 0;
    
    return (
      <div className="relative mx-auto h-64 w-64">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
          {chartData.dailyData.map((value, index) => {
            const percent = (value / total) * 100;
            const dashArray = `${percent} ${100 - percent}`;
            const dashOffset = cumulativePercent ? 100 - cumulativePercent : 0;
            
            cumulativePercent += percent;
            
            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={chartColors[index % chartColors.length]}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800">{totalDefaultDay}</div>
            <div className="text-sm text-slate-500">Total Daily</div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (chartData.dailyData.length === 0) return null;

    const maxValue = Math.max(...chartData.dailyData, 0);
    const divisor = maxValue > 0 ? maxValue : 1;

    return (
      <div className="w-full space-y-4 px-1">
        {chartData.dailyData.map((value, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-28 text-sm text-slate-700 truncate">
              {chartData.labels[index]}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <div 
                  className="h-6 min-w-[6px] rounded-md transition-all duration-500"
                  style={{
                    width: `${(value / divisor) * 100}%`,
                    backgroundColor: chartColors[index % chartColors.length]
                  }}
                ></div>
                <span className="ml-2 text-sm font-medium text-slate-900">
                  {value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to render line chart
  const renderLineChart = () => {
    if (chartData.dailyData.length === 0) return null;

    const maxValue = Math.max(...chartData.dailyData, 0);
    const divisor = maxValue > 0 ? maxValue : 1;
    const denominator = Math.max(chartData.dailyData.length - 1, 1);
    const pointCoordinates = chartData.dailyData.map((value, index) => {
      const x = (index / denominator) * 90 + 5;
      const y = 95 - (value / divisor) * 90;
      return { x, y };
    });
    const points = pointCoordinates.map((point) => `${point.x},${point.y}`).join(" ");

    return (
      <div className="w-full h-64">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="5" y1="95" x2="95" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />
          <line x1="5" y1="5" x2="5" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
          {pointCoordinates.map((point, index) => {
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="2.2"
                fill={chartColors[index % chartColors.length]}
                stroke="white"
                strokeWidth="0.8"
              />
            );
          })}
        </svg>
      </div>
    );
  };
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  return (
    <>
      <AdminNavbar />
<<<<<<< HEAD
      <div className="p-6 mt-16 relative min-h-[70vh] bg-gray-50">
=======
      <div className="relative mt-16 min-h-[70vh] bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 sm:p-6">
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
<<<<<<< HEAD

        <h2 className="text-2xl font-bold mb-6 text-gray-800">Defaulter Report</h2>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} max={today} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]" />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} max={today} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]" />
          <select name="department" value={filters.department} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select name="shift" value={filters.shift} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Shifts</option>
            <option value="Start">Start</option>
            <option value="Mid">Mid</option>
            <option value="End">End</option>
          </select>
          <select name="employee" value={filters.employee} onChange={handleFilterChange} className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]">
            <option value="">All Employees</option>
            {filteredEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.username}
              </option>
            ))}
          </select>
        </div>

        {!loading && (
          <>
            {defaulters?.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border p-3 text-left">Date</th>
                      <th className="border p-3 text-left">Employee Name</th>
                      <th className="border p-3 text-center">Default Day</th>
                      <th className="border p-3 text-center">Total Defaults Till Today</th>
                      <th className="border p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaulters.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="border p-3">{d.date ? new Date(d.date).toLocaleDateString("en-GB") : "—"}</td>
                        <td className="border p-3 font-semibold text-gray-800">{d.employeeName || "—"}</td>
                        <td className="border p-3 text-center text-red-600 font-medium">{d.notDoneTasksToday ?? "—"}</td>
                        <td className="border p-3 text-center">{d.totalDefaultsTillDate ?? "—"}</td>
                        <td className="border p-3 text-center">
                          <button
                            onClick={() => handleViewAll(d.employeeId, d.employeeName)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                          >
                            View All
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border p-3 text-center" colSpan={2}>Total</td>
                      <td className="border p-3 text-center text-red-600">{grandTotals.notDoneToday}</td>
                      <td className="border p-3 text-center">—</td>
                      <td className="border p-3 text-center">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <h1 className="text-center text-gray-500 mt-10 text-2xl font-semibold">No defaulters found</h1>
=======
        
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.55)] backdrop-blur sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Insights</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Defaulters Overview</h2>
            </div>
            <button
              onClick={() => {
                setFilters({
                  startDate: today,
                  endDate: today,
                  department: "",
                  shift: "",
                  employee: "",
                });
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange} 
                max={today} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange} 
                max={today} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <select 
                name="department" 
                value={filters.department} 
                onChange={handleFilterChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Shift</label>
              <select 
                name="shift" 
                value={filters.shift} 
                onChange={handleFilterChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="">All Shifts</option>
                <option value="Start">Start</option>
                <option value="Mid">Mid</option>
                <option value="End">End</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Employee</label>
              <select 
                name="employee" 
                value={filters.employee} 
                onChange={handleFilterChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="">All Employees</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.username}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-42px_rgba(15,23,42,0.55)]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-slate-500">Total Employees</h3>
                <p className="text-2xl font-semibold text-slate-900">
                  {new Set(defaulters?.map(d => d.employeeId)).size || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-42px_rgba(15,23,42,0.55)]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-slate-500">Daily Defaults</h3>
                <p className="text-2xl font-semibold text-slate-900">{totalDefaultDay}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-42px_rgba(15,23,42,0.55)]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-slate-500">Cumulative Defaults</h3>
                <p className="text-2xl font-semibold text-slate-900">{totalCumulative}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-42px_rgba(15,23,42,0.55)]">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-slate-500">Total Records</h3>
                <p className="text-2xl font-semibold text-slate-900">{defaulters?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {chartData.labels.length > 0 && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-50px_rgba(15,23,42,0.5)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Defaulters Analysis</h3>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setChartType('pie')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  Pie Chart
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  Line Chart
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Chart */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-4 text-sm font-medium text-slate-700">Daily Defaults Distribution</h4>
                <div className="h-64 flex items-center justify-center">
                  {chartType === 'pie' && renderPieChart()}
                  {chartType === 'bar' && renderBarChart()}
                  {chartType === 'line' && renderLineChart()}
                </div>
                
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex items-center rounded-xl border border-slate-200 bg-white p-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">
                          {label}
                        </div>
                        <div className="text-xs text-slate-500">
                          {chartData.dailyData[index]} defaults
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Chart - Cumulative Defaults */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-4 text-sm font-medium text-slate-700">Cumulative Defaults (Top Employees)</h4>
                <div className="space-y-4">
                  {chartData.cumulativeData.length > 0 ? (
                    chartData.cumulativeData.map((value, index) => {
                      const maxCumulative = Math.max(...chartData.cumulativeData, 0);
                      const cumulativeDivisor = maxCumulative > 0 ? maxCumulative : 1;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="max-w-[120px] truncate text-sm font-medium text-slate-700">
                              {chartData.labels[index]}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {value} defaults
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-slate-200">
                            <div 
                              className="h-2.5 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(value / cumulativeDivisor) * 100}%`,
                                backgroundColor: chartColors[index % chartColors.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sm text-slate-500">
                      No cumulative data available
                    </div>
                  )}
                </div>
                
                {/* Summary Stats */}
                {chartData.cumulativeData.length > 0 && (
                  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="mb-1 text-xs font-medium text-blue-800">Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Highest Defaulter:</div>
                      <div className="font-medium text-slate-900">
                        {chartData.labels[0]} ({chartData.cumulativeData[0]})
                      </div>
                      <div className="text-slate-600">Average per Employee:</div>
                      <div className="font-medium text-slate-900">
                        {Math.round(chartData.cumulativeData.reduce((a, b) => a + b, 0) / chartData.cumulativeData.length)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && (
          <>
            {currentItems.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_60px_-50px_rgba(15,23,42,0.5)]">
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">Defaulters List</h3>
                  <div className="flex items-center space-x-4">
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100/80">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Employee Name</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Default Day</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Total Defaults Till Date</th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {currentItems.map((d, i) => (
                        <tr key={i} className="transition-colors hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                            {formatDisplayDate(d.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {d.employeeName?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{d.employeeName || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${d.notDoneTasksToday > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {d.notDoneTasksToday ?? 0}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-slate-900">
                            <span className="font-semibold">{d.totalDefaultsTillDate ?? 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => handleViewAll(d.employeeId, d.employeeName)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-100/70">
                      <tr>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900" colSpan={2}>
                          Totals
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            {totalDefaultDay}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {totalCumulative}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(indexOfLastItem, defaulters?.length || 0)}</span> of{" "}
                        <span className="font-medium">{defaulters?.length || 0}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? "z-10 border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">...</span>;
                          }
                          return null;
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-[0_25px_60px_-50px_rgba(15,23,42,0.5)]">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-slate-900">No defaulters found</h3>
                <p className="mx-auto max-w-md text-slate-500">
                  No defaulters match your current filters for {today}. Try adjusting your search criteria.
                </p>
              </div>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
            )}
          </>
        )}

<<<<<<< HEAD

        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] sm:w-[70%] max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedEmployee} - All Defaults
                </h3>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (employeeDefaults.length === 0)
                        return alert("No data to export");

                      const XLSX = await import("xlsx-js-style");

                      const groupedByMonth = employeeDefaults.reduce((acc, item) => {
                        const date = new Date(item.date);
                        const monthYear = date.toLocaleString("default", {
                          month: "short",
                          year: "numeric",
                        });

                        if (!acc[monthYear]) acc[monthYear] = [];
                        acc[monthYear].push(item);
                        return acc;
                      }, {});

                      const wb = XLSX.utils.book_new();

                      Object.entries(groupedByMonth).forEach(([month, records]) => {
                        const formattedData = records.map((d, i) => ({
                          "S.No": i + 1,
                          "Date": new Date(d.date).toLocaleDateString("en-GB"),
                          "Task": d.title,
                          "Department": d.department,
                          "Shift": d.shift,
                          "Priority": d.priority,
                        }));

                        const ws = XLSX.utils.json_to_sheet(formattedData);

                        const headerStyle = {
                          font: { bold: true, color: { rgb: "FFFFFF" } },
                          fill: { fgColor: { rgb: "4F81BD" } },
                          alignment: { horizontal: "center", vertical: "center" },
                          border: {
                            top: { style: "thin", color: { rgb: "000000" } },
                            bottom: { style: "thin", color: { rgb: "000000" } },
                            left: { style: "thin", color: { rgb: "000000" } },
                            right: { style: "thin", color: { rgb: "000000" } },
                          },
                        };
                        const cellStyle = {
                          alignment: { horizontal: "left", vertical: "center" },
                          border: {
                            top: { style: "thin", color: { rgb: "DDDDDD" } },
                            bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                            left: { style: "thin", color: { rgb: "DDDDDD" } },
                            right: { style: "thin", color: { rgb: "DDDDDD" } },
                          },
                        };

                        const range = XLSX.utils.decode_range(ws["!ref"]);
                        for (let R = range.s.r; R <= range.e.r; R++) {
                          for (let C = range.s.c; C <= range.e.c; C++) {
                            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                            if (!ws[cellRef]) continue;
                            ws[cellRef].s = R === 0 ? headerStyle : cellStyle;
                          }
                        }

                        ws["!cols"] = [
                          { wch: 6 },
                          { wch: 12 },
                          { wch: 40 },
                          { wch: 20 },
                          { wch: 10 },
                          { wch: 12 },
                        ];

                        XLSX.utils.book_append_sheet(wb, ws, month);
                      });

                      XLSX.writeFile(wb, `${selectedEmployee}_Defaults_ByMonth.xlsx`);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-500 hover:text-gray-800 text-xl font-semibold"
=======
        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_40px_90px_-45px_rgba(15,23,42,0.75)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                    Defaulter Details
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    {selectedEmployee} - Defaults History
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {modalTotalDefaults > 0
                      ? `Showing ${modalFrom}-${modalTo} of ${modalTotalDefaults} default tasks`
                      : "No default tasks found"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportEmployeeDefaults}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </button>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setEmployeeDefaults([]);
                      setSelectedEmployeeId(null);
                      setSelectedEmployee(null);
                      setModalCurrentPage(1);
                      setModalTotalPages(0);
                      setModalTotalDefaults(0);
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-500/60 bg-slate-800/40 text-xl font-semibold text-slate-200 transition hover:bg-slate-700/60 hover:text-white"
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
                  >
                    ✕
                  </button>
                </div>
              </div>
<<<<<<< HEAD

              {modalLoading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : employeeDefaults.length > 0 ? (
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Date</th>
                      <th className="border p-2 text-left">Task</th>
                      <th className="border p-2 text-left">Department</th>
                      <th className="border p-2 text-left">Shift</th>
                      <th className="border p-2 text-left">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeDefaults.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border p-2">{new Date(d.date).toLocaleDateString("en-GB")}</td>
                        <td className="border p-2">{d.title}</td>
                        <td className="border p-2">{d.department}</td>
                        <td className="border p-2">{d.shift}</td>
                        <td className="border p-2">{d.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500">No defaults found!!</p>
              )}
=======
              
              <div className="max-h-[68vh] overflow-y-auto bg-slate-50/60 p-6">
                {modalLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center">
                      <div className="mx-1 h-4 w-4 rounded-full bg-blue-600 animate-bounce"></div>
                      <div className="mx-1 h-4 w-4 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="mx-1 h-4 w-4 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-600">Loading details...</p>
                  </div>
                ) : employeeDefaults.length > 0 ? (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Task</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Shift</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {employeeDefaults.map((d, i) => (
                            <tr key={i} className="transition-colors hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">
                                {formatDisplayDate(d.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-800">{d.title}</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                  {d.department}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{d.shift}</td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  d.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                                  d.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {d.priority}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {modalTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <button
                          onClick={() => handleModalPageChange(modalCurrentPage - 1)}
                          disabled={modalCurrentPage === 1 || modalLoading}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-2">
                          {Array.from({ length: modalTotalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === modalTotalPages ||
                              (page >= modalCurrentPage - 1 && page <= modalCurrentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => handleModalPageChange(page)}
                                  disabled={modalLoading}
                                  className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                                    page === modalCurrentPage
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            }
                            if (page === modalCurrentPage - 2 || page === modalCurrentPage + 2) {
                              return (
                                <span key={page} className="px-2 text-sm text-slate-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() => handleModalPageChange(modalCurrentPage + 1)}
                          disabled={modalCurrentPage === modalTotalPages || modalLoading}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">No defaults found for this employee.</p>
                  </div>
                )}
              </div>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
            </div>
          </div>
        )}
      </div>
    </>
  );
};

<<<<<<< HEAD
export default Defaulter;
=======
export default Defaulter;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
