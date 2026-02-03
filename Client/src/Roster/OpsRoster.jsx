import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getOpsMetaCurrentWeekRoster, 
  updateOpsMetaRoster,
  clearOpsMetaState,
  updateOpsMetaRosterLocally 
} from '../features/slices/rosterSlice.js';
import { toast } from 'react-toastify';
import Navbar from '../pages/Navbar.jsx';

const OpsRoster = () => {
  const dispatch = useDispatch();
  const {
    opsMetaRoster,
    opsMetaLoading,
    opsMetaError,
    opsMetaCanEdit,
    opsMetaEditMessage
  } = useSelector((state) => state.roster);

  // State for UI performance
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [openDetails, setOpenDetails] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Load roster data on component mount
  useEffect(() => {
    dispatch(getOpsMetaCurrentWeekRoster());
    
    return () => {
      dispatch(clearOpsMetaState());
    };
  }, [dispatch]);

  // Status icons mapping
  const getStatusIcon = useCallback((status) => {
    const icons = {
      'P': '✅',
      'WO': '🗓️',
      'L': '❌',
      'NCNS': '🚫',
      'UL': '💸',
      'LWP': '💰',
      'BL': '⚫',
      'H': '🎉',
      'LWD': '📅'
    };
    return icons[status] || '📝';
  }, []);

  const getStatusLabel = useCallback((status) => {
    const labels = {
      'P': 'Present',
      'WO': 'Week Off',
      'L': 'Leave',
      'NCNS': 'No Call No Show',
      'UL': 'Unpaid Leave',
      'LWP': 'Leave With Pay',
      'BL': 'Business Leave',
      'H': 'Holiday',
      'LWD': 'Leave Without Pay'
    };
    return labels[status] || status;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'P': 'bg-green-100 text-green-800 border-green-200',
      'WO': 'bg-amber-100 text-amber-800 border-amber-200',
      'L': 'bg-blue-100 text-blue-800 border-blue-200',
      'NCNS': 'bg-red-100 text-red-800 border-red-200',
      'UL': 'bg-gray-100 text-gray-800 border-gray-200',
      'LWP': 'bg-purple-100 text-purple-800 border-purple-200',
      'BL': 'bg-gray-200 text-gray-800 border-gray-300',
      'H': 'bg-green-100 text-green-800 border-green-200',
      'LWD': 'bg-amber-100 text-amber-800 border-amber-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  // Handle refresh with debounce
  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    
    setRefreshing(true);
    dispatch(getOpsMetaCurrentWeekRoster())
      .unwrap()
      .finally(() => {
        setTimeout(() => setRefreshing(false), 300);
      });
  }, [dispatch, refreshing]);

  // Handle edit
  const handleEditClick = useCallback((employee) => {
    if (!opsMetaCanEdit) {
      toast.error(opsMetaEditMessage || "Editing is not allowed at this time");
      return;
    }

    setSelectedEmployee(employee);
    setEditForm({
      transport: employee.transport || '',
      cabRoute: employee.cabRoute || '',
      teamLeader: employee.teamLeader || '',
      shiftStartHour: employee.shiftStartHour || '',
      shiftEndHour: employee.shiftEndHour || '',
      dailyStatus: employee.dailyStatus?.map(day => ({
        date: day.date,
        status: day.status || 'P'
      })) || []
    });
    setOpenEditModal(true);
  }, [opsMetaCanEdit, opsMetaEditMessage]);

  // Handle save with optimistic update
  const handleSave = useCallback(async () => {
    if (!selectedEmployee) return;

    try {
      const originalEmployee = opsMetaRoster?.data?.rosterEntries?.find(e => e._id === selectedEmployee._id);
      dispatch(updateOpsMetaRosterLocally({ 
        employeeId: selectedEmployee._id, 
        updates: editForm 
      }));
      setOpenEditModal(false);
      setSelectedEmployee(null);
      toast.success('Updating roster...');
      dispatch(updateOpsMetaRoster({
        employeeId: selectedEmployee._id,
        updates: editForm
      }))
        .unwrap()
        .then(() => toast.success('Roster updated successfully'))
        .catch(() => {
          toast.error('Update failed, rolling back changes');
          if (originalEmployee) {
            dispatch(updateOpsMetaRosterLocally({ 
              employeeId: selectedEmployee._id, 
              updates: originalEmployee 
            }));
          }
        });
    } catch (error) {
      toast.error('Failed to update roster');
    }
  }, [dispatch, editForm, selectedEmployee, opsMetaRoster]);
  const handleViewDetails = useCallback((employee) => {
    setSelectedEmployee(employee);
    setOpenDetails(true);
  }, []);
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }, []);

  const formatShiftHours = useCallback((startHour, endHour) => {
    if (!startHour && !endHour) return 'Not Set';
    return `${startHour || '??'}:00 - ${endHour || '??'}:00`;
  }, []);
  const filteredEntries = useMemo(() => {
    if (!opsMetaRoster?.data?.rosterEntries) return [];
    
    let filtered = [...opsMetaRoster.data.rosterEntries];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(employee => 
        employee.name?.toLowerCase().includes(query) ||
        employee.username?.toLowerCase().includes(query) ||
        employee.department?.toLowerCase().includes(query)
      );
    }
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(employee => 
        employee.department === departmentFilter
      );
    }
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [opsMetaRoster, searchQuery, departmentFilter, sortField, sortDirection]);
  const departments = useMemo(() => {
    if (!opsMetaRoster?.data?.rosterEntries) return [];
    return [...new Set(opsMetaRoster.data.rosterEntries.map(e => e.department))].sort();
  }, [opsMetaRoster]);
  const paginatedEntries = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, page, rowsPerPage]);
  const handleChangePage = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);  
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (opsMetaLoading && !opsMetaRoster) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg font-medium text-gray-700">Loading Ops-Meta Roster...</div>
        </div>
      </div>
    );
  }

  if (opsMetaError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex justify-between items-center">
              <div>{opsMetaError}</div>
              <button 
                onClick={handleRefresh}
                className="text-red-700 hover:text-red-800 font-medium text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!opsMetaRoster?.data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-600 text-lg mb-4">No roster data available</div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Load Roster'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { 
    weekNumber, 
    startDate, 
    endDate, 
    currentDate,
    summary 
  } = opsMetaRoster.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Current Week Roster - Week {weekNumber}</h1>
                <p className="text-sm text-gray-600">
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Current Date: {new Date(currentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm text-gray-700">
                  Total Employees: <span className="font-semibold">{summary?.totalEmployees || 0}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700">
                  Edit Status: 
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${opsMetaCanEdit ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {opsMetaCanEdit ? 'Edit Allowed' : 'Edit Restricted'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, username, or department"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-1/2 pl-10 pr-3 py-2 text-gray-500 text-lg font-bold border border-[#EAEAEA] rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredEntries.length}</div>
            <div className="text-sm text-shadow-gray-600">Employees </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${opsMetaCanEdit ? 'text-green-600' : 'text-amber-600'}`}>
              {opsMetaCanEdit ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Can Edit</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{departments.length}</div>
            <div className="text-sm text-gray-600">Departments</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-amber-600">Week {weekNumber}</div>
            <div className="text-sm text-gray-600">Current Week</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Employee
                      {sortField === 'name' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shift Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cab Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Leader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEntries.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatShiftHours(employee.shiftStartHour, employee.shiftEndHour)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.transport || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.cabRoute || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.teamLeader || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {employee.dailyStatus?.slice(0, 3).map((day, index) => (
                          <div 
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(day.status)}`}
                            title={`${formatDate(day.date)}: ${getStatusLabel(day.status)}`}
                          >
                            {getStatusIcon(day.status)} {day.status}
                          </div>
                        ))}
                        {employee.dailyStatus?.length > 3 && (
                          <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            +{employee.dailyStatus.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(employee)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {opsMetaCanEdit && (
                          <button
                            onClick={() => handleEditClick(employee)}
                            className="text-green-600 hover:text-green-900 cursor-pointer"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || departmentFilter !== 'all' 
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'No roster data available for the current week.'}
              </p>
            </div>
          )}

          {filteredEntries.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={page >= Math.ceil(filteredEntries.length / rowsPerPage) - 1}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{page * rowsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min((page + 1) * rowsPerPage, filteredEntries.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredEntries.length}</span> results
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={handleChangeRowsPerPage}
                      className="block w-20 pl-3 pr-8 py-1 text-base cursor-pointer border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handleChangePage(page - 1)}
                      disabled={page === 0}
                      className="relative inline-flex items-center cursor-pointer px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(filteredEntries.length / rowsPerPage)) }, (_, i) => {
                      const pageNumber = page < 3 ? i : page > Math.ceil(filteredEntries.length / rowsPerPage) - 3 ? Math.ceil(filteredEntries.length / rowsPerPage) - 5 + i : page - 2 + i;
                      if (pageNumber < 0 || pageNumber >= Math.ceil(filteredEntries.length / rowsPerPage)) return null;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handleChangePage(pageNumber)}
                          className={`relative inline-flex items-center cursor-pointer px-4 py-2 border text-sm font-medium ${page === pageNumber ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {pageNumber + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleChangePage(page + 1)}
                      disabled={page >= Math.ceil(filteredEntries.length / rowsPerPage) - 1}
                      className="relative inline-flex items-center px-2 py-2 cursor-pointer rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {openDetails && selectedEmployee && (
  <div className="fixed inset-0 z-[9999] overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={() => setOpenDetails(false)}
        style={{ zIndex: 9998 }}
      ></div>
      
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      
      <div 
        className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative"
        style={{ zIndex: 9999 }}
      >
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
          <div className="flex justify-between items-start">
            <div className="w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedEmployee.name} - Employee Details
              </h3>
              
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</div>
                    <div className="text-sm text-gray-900 font-medium">{selectedEmployee.accountType}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Hours</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formatShiftHours(selectedEmployee.shiftStartHour, selectedEmployee.shiftEndHour)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {selectedEmployee.transport || <span className="text-gray-400">Not specified</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cab Route</div>
                    <div className="text-sm text-gray-900 font-medium">
                      {selectedEmployee.cabRoute || <span className="text-gray-400">Not specified</span>}
                    </div>
                     <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team Leader</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {selectedEmployee.teamLeader || <span className="text-gray-400">Not assigned</span>}
                  </div>
                  </div>
                  
                </div>
                
                {/* Team Leader */}
                <div className="space-y-1 pt-2 border-t border-gray-100">
                 
                </div>
              </div>
              
              {/* Weekly Status Breakdown */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  Weekly Status Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {selectedEmployee.dailyStatus?.map((day, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        {formatDate(day.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label={getStatusLabel(day.status)}>
                          {getStatusIcon(day.status)}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">
                            {day.status}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {getStatusLabel(day.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setOpenDetails(false)}
              className="ml-4 flex-shrink-0 cursor-pointer rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
          <button
            type="button"
            onClick={() => setOpenDetails(false)}
            className="w-full inline-flex justify-center cursor-pointer items-center rounded-md border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
          
          {opsMetaCanEdit && (
            <button
              type="button"
              onClick={() => {
                setOpenDetails(false);
                setTimeout(() => handleEditClick(selectedEmployee), 100);
              }}
              className="mt-3 w-full inline-flex justify-center cursor-pointer items-center rounded-md border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit This Employee
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

    {openEditModal && selectedEmployee && (
  <div className="fixed inset-0 z-[9999] overflow-y-auto">
    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div 
        className="fixed inset-0 transition-opacity" 
        onClick={() => setOpenEditModal(false)}
        style={{ zIndex: 9998 }}
      >
        <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
      </div>
      
      <div 
        className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
        style={{ zIndex: 9999, position: 'relative' }}
      >
        {/* Modal Header */}
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Edit Roster for {selectedEmployee.name}
            </h3>
            <button
              type="button"
              onClick={() => setOpenEditModal(false)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
              <input
                type="text"
                value={editForm.transport || ''}
                onChange={(e) => setEditForm({...editForm, transport: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cab Route</label>
              <input
                type="text"
                value={editForm.cabRoute || ''}
                onChange={(e) => setEditForm({...editForm, cabRoute: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader</label>
              <input
                type="text"
                value={editForm.teamLeader || ''}
                onChange={(e) => setEditForm({...editForm, teamLeader: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={editForm.shiftStartHour || ''}
                onChange={(e) => setEditForm({...editForm, shiftStartHour: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift End Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={editForm.shiftEndHour || ''}
                onChange={(e) => setEditForm({...editForm, shiftEndHour: parseInt(e.target.value)})}
                className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {editForm.dailyStatus?.map((day, index) => (
                <div key={index}>
                  <div className="text-xs text-gray-500 mb-1 font-medium">{formatDate(day.date)}</div>
                  <select
                    value={day.status}
                    onChange={(e) => {
                      const newStatus = [...editForm.dailyStatus];
                      newStatus[index].status = e.target.value;
                      setEditForm({
                        ...editForm,
                        dailyStatus: newStatus
                      });
                    }}
                    className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="P">Present</option>
                    <option value="WO">Week Off</option>
                    <option value="L">Leave</option>
                    <option value="NCNS">No Call No Show</option>
                    <option value="UL">Unpaid Leave</option>
                    <option value="LWP">Leave With Pay</option>
                    <option value="BL">Business Leave</option>
                    <option value="H">Holiday</option>
                    <option value="LWD">Leave Without Pay</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            className="w-full inline-flex justify-center cursor-pointer rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => setOpenEditModal(false)}
            className="mt-3 w-full inline-flex justify-center cursor-pointer rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default OpsRoster;