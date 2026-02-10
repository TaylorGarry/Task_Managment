import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDefaulters } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import AdminNavbar from "../components/AdminNavbar.jsx";

const Defaulter = () => {
  const dispatch = useDispatch();
  const { defaulters, loading } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.auth);
  const today = new Date().toISOString().split("T")[0];
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Chart data state
  const [chartType, setChartType] = useState('pie');

  useEffect(() => {
    dispatch(fetchDefaulters(filters));
    dispatch(fetchEmployees());
  }, [dispatch, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if ((name === "startDate" || name === "endDate") && value > today) return;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };

  const handleViewAll = async (employeeId, employeeName) => {
    try {
      setModalLoading(true);
      setModalOpen(true);
      const token = localStorage.getItem("token");
      // const res = await fetch(
      //   `http://localhost:4000/api/v1/tasks/employee-defaulters/${employeeId}`,
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      const res = await fetch(
        `https://fdbs-server-a9gqg.ondigitalocean.app/api/v1/tasks/employee-defaulters/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    } finally {
      setModalLoading(false);
    }
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

  // Calculate totals correctly
  const calculateTotals = () => {
    if (!defaulters || defaulters.length === 0) {
      return { totalDefaultDay: 0, totalCumulative: 0 };
    }

    // Sum of Default Day column
    const totalDefaultDay = defaulters.reduce((sum, d) => sum + (d.notDoneTasksToday || 0), 0);

    // For Total Defaults Till Today, get the latest value for each employee
    const employeeMap = new Map();
    defaulters.forEach(d => {
      if (d.employeeId) {
        const currentTotal = employeeMap.get(d.employeeId) || 0;
        if ((d.totalDefaultsTillDate || 0) > currentTotal) {
          employeeMap.set(d.employeeId, d.totalDefaultsTillDate || 0);
        }
      }
    });

    const totalCumulative = Array.from(employeeMap.values()).reduce((sum, total) => sum + total, 0);

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

  // Function to render pie chart
  const renderPieChart = () => {
    if (chartData.dailyData.length === 0) return null;
    
    const total = chartData.dailyData.reduce((sum, val) => sum + val, 0);
    let cumulativePercent = 0;
    
    return (
      <div className="relative w-64 h-64 mx-auto">
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
          <div className="text-center transform ">
            <div className="text-xl font-bold text-gray-800">{totalDefaultDay}</div>
            <div className="text-sm text-gray-600">Total Daily</div>
          </div>
        </div>
      </div>
    );
  };
  const renderBarChart = () => {
    if (chartData.dailyData.length === 0) return null;
    
    const maxValue = Math.max(...chartData.dailyData);
    
    return (
      <div className="space-y-4">
        {chartData.dailyData.map((value, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-700 truncate">
              {chartData.labels[index]}
            </div>
            <div className="flex-1 ml-3">
              <div className="flex items-center">
                <div 
                  className="h-6 bg-blue-500 rounded transition-all duration-500"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                ></div>
                <span className="ml-2 text-sm font-medium text-gray-900">
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
    
    const maxValue = Math.max(...chartData.dailyData);
    const points = chartData.dailyData.map((value, index) => {
      const x = (index / (chartData.dailyData.length - 1)) * 90 + 5;
      const y = 95 - (value / maxValue) * 90;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="w-full h-64">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <polyline
            fill="none"
            stroke="#36A2EB"
            strokeWidth="2"
            points={points}
          />
          {chartData.dailyData.map((value, index) => {
            const x = (index / (chartData.dailyData.length - 1)) * 90 + 5;
            const y = 95 - (value / maxValue) * 90;
            return (
              <circle key={index} cx={x} cy={y} r="2" fill="#36A2EB" />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <>
      <AdminNavbar />
      <div className="p-6 mt-16 relative min-h-[70vh] bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce"></div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Defaulter Report</h2>
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, defaulters?.length || 0)} of {defaulters?.length || 0} records
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={filters.startDate} 
                onChange={handleFilterChange} 
                max={today} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={filters.endDate} 
                onChange={handleFilterChange} 
                max={today} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select 
                name="department" 
                value={filters.department} 
                onChange={handleFilterChange} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select 
                name="shift" 
                value={filters.shift} 
                onChange={handleFilterChange} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Shifts</option>
                <option value="Start">Start</option>
                <option value="Mid">Mid</option>
                <option value="End">End</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select 
                name="employee" 
                value={filters.employee} 
                onChange={handleFilterChange} 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Employees</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.username}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(defaulters?.map(d => d.employeeId)).size || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Daily Defaults</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalDefaultDay}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Cumulative Defaults</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalCumulative}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Records</h3>
                <p className="text-2xl font-semibold text-gray-900">{defaulters?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {chartData.labels.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Defaulters Analysis</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1 text-sm rounded ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Pie Chart
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-sm rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 text-sm rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Line Chart
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Daily Defaults Distribution</h4>
                <div className="h-64 flex items-center justify-center">
                  {chartType === 'pie' && renderPieChart()}
                  {chartType === 'bar' && renderBarChart()}
                  {chartType === 'line' && renderLineChart()}
                </div>
                
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex items-center p-2 bg-white rounded border">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {label}
                        </div>
                        <div className="text-xs text-gray-600">
                          {chartData.dailyData[index]} defaults
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Chart - Cumulative Defaults */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Cumulative Defaults (Top Employees)</h4>
                <div className="space-y-4">
                  {chartData.cumulativeData.map((value, index) => {
                    const maxCumulative = Math.max(...chartData.cumulativeData);
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                            {chartData.labels[index]}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {value} defaults
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(value / maxCumulative) * 100}%`,
                              backgroundColor: chartColors[index % chartColors.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-100">
                  <div className="text-xs text-blue-800 font-medium mb-1">Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Highest Defaulter:</div>
                    <div className="font-medium text-gray-900">
                      {chartData.labels[0]} ({chartData.cumulativeData[0]})
                    </div>
                    <div className="text-gray-600">Average per Employee:</div>
                    <div className="font-medium text-gray-900">
                      {Math.round(chartData.cumulativeData.reduce((a, b) => a + b, 0) / chartData.cumulativeData.length)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && (
          <>
            {currentItems.length > 0 ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Defaulters List</h3>
                  <div className="flex items-center space-x-4">
                    <select
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                      className="border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Default Day</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Defaults Till Date</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {d.date ? new Date(d.date).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {d.employeeName?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{d.employeeName || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${d.notDoneTasksToday > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {d.notDoneTasksToday ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
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
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-center" colSpan={2}>
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
                        <td className="px-6 py-4 text-center">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
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
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                          }
                          return null;
                        })}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No defaulters found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No defaulters match your current filters. Try adjusting your search criteria.
                </p>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedEmployee} - Defaults History
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {employeeDefaults.length} default tasks
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (employeeDefaults.length === 0) return alert("No data to export");
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
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-500 hover:text-gray-800 text-xl font-semibold"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {modalLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce mx-1"></div>
                      <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce mx-1" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="mt-4 text-gray-600">Loading details...</p>
                  </div>
                ) : employeeDefaults.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeDefaults.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {new Date(d.date).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{d.title}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {d.department}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{d.shift}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              d.priority === 'High' ? 'bg-red-100 text-red-800' :
                              d.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {d.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600">No defaults found for this employee!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Defaulter;