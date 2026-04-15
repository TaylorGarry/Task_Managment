// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { FiEye, FiTrash2 } from 'react-icons/fi';
// import { getRosterForBulkEdit, bulkUpdateRosterWeeks, clearBulkEditState, clearBulkSaveState } from '../features/slices/rosterSlice.js';

// const RosterBulkEditForm = ({ rosterId, onClose }) => {
//     const dispatch = useDispatch();
//     const { bulkEditRoster, bulkEditLoading, bulkEditError, bulkSaveLoading, bulkSaveSuccess, bulkSaveError } = useSelector((state) => state.roster);
//     const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}/;
//     const pad2 = (value) => String(value).padStart(2, '0');
//     const getLocalDateKey = (date = new Date()) =>
//         `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
//     const getDateKey = (value) => {
//         if (!value) return '';
//         if (typeof value === 'string' && DATE_ONLY_REGEX.test(value)) return value.slice(0, 10);
//         const date = value instanceof Date ? value : new Date(value);
//         if (Number.isNaN(date.getTime())) return '';
//         return date.toISOString().slice(0, 10);
//     };
//     const dateFromKeyUTC = (dateKey) => {
//         const [year, month, day] = dateKey.split('-').map(Number);
//         return new Date(Date.UTC(year, month - 1, day));
//     };
//     const addDaysToDateKeyUTC = (dateKey, days) => {
//         const date = dateFromKeyUTC(dateKey);
//         date.setUTCDate(date.getUTCDate() + days);
//         return date.toISOString().slice(0, 10);
//     };
//     const getUTCISOStringFromDateKey = (dateKey) => `${dateKey}T00:00:00.000Z`;
//     const getDateRangeDurationDaysUTC = (startDateKey, endDateKey) =>
//         Math.ceil((dateFromKeyUTC(endDateKey) - dateFromKeyUTC(startDateKey)) / (1000 * 60 * 60 * 24)) + 1;
//     const formatDateFromKeyUTC = (dateKey, options = {}) =>
//         dateFromKeyUTC(dateKey).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });

//     const [showHistoryModal, setShowHistoryModal] = useState(false);
//     const [selectedEmployee, setSelectedEmployee] = useState(null);

//     const [activeTab, setActiveTab] = useState(0);
//     const [editedWeeks, setEditedWeeks] = useState([]);
//     const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
//     const [newEmployee, setNewEmployee] = useState({
//         name: '',
//         transport: '',
//         cabRoute: '',
//         teamLeader: '',
//         shiftStartHour: '',
//         shiftEndHour: '',
//         dailyStatus: Array(7).fill('P')
//     });
//     const [errors, setErrors] = useState({});
//     useEffect(() => {
//         if (rosterId) {
//             dispatch(getRosterForBulkEdit(rosterId));
//         }
//         return () => {
//             dispatch(clearBulkEditState());
//             dispatch(clearBulkSaveState());
//         };
//     }, [rosterId, dispatch]);

//     useEffect(() => {
//         console.log("BULK EDIT ROSTER FULL DATA:::::::<><><><><<><><><><><><>:::", bulkEditRoster);
//         if (bulkEditRoster?.data?.weeks) {
//             const weeksCopy = JSON.parse(JSON.stringify(bulkEditRoster.data.weeks));
//             setEditedWeeks(weeksCopy);
//         }
//     }, [bulkEditRoster]);

//     const handleEmployeeFieldChange = (weekIndex, employeeIndex, field, value) => {
//         const updatedWeeks = [...editedWeeks];

//         if (field.startsWith('dailyStatus[')) {
//             const dayIndex = parseInt(field.match(/\[(\d+)\]/)[1]);
//             updatedWeeks[weekIndex].employees[employeeIndex].dailyStatus[dayIndex].status = value;
//         } else {
//             updatedWeeks[weekIndex].employees[employeeIndex][field] = value;
//         }

//         setEditedWeeks(updatedWeeks);
//     };

//     const handleViewHistory = (employee) => {
//         const history = bulkEditRoster?.data?.editHistory || [];

//         if (history.length === 0) {
//             alert("No edit history available");
//             return;
//         }

//         const employeeLogs = history.filter(
//             (log) => log.employeeId?.toString() === employee._id?.toString()
//         );

//         setSelectedEmployee({
//             name: employee.name,
//             logs: employeeLogs
//         });

//         setShowHistoryModal(true);
//     };


//     const handleNewEmployeeChange = (field, value, dayIndex = null) => {
//         const updatedEmployee = { ...newEmployee };

//         if (dayIndex !== null) {
//             const updatedStatus = [...updatedEmployee.dailyStatus];
//             updatedStatus[dayIndex] = value;
//             updatedEmployee.dailyStatus = updatedStatus;
//         } else {
//             updatedEmployee[field] = value;
//         }

//         setNewEmployee(updatedEmployee);
//     };

//     const handleAddNewEmployee = () => {
//         const validationErrors = {};
//         if (!newEmployee.name.trim()) {
//             validationErrors.name = 'Name is required';
//         }
//         if (!newEmployee.shiftStartHour || !newEmployee.shiftEndHour) {
//             validationErrors.shiftHours = 'Shift hours are required';
//         }
//         if (parseInt(newEmployee.shiftStartHour) < 0 || parseInt(newEmployee.shiftStartHour) > 23) {
//             validationErrors.shiftStartHour = 'Start hour must be between 0-23';
//         }
//         if (parseInt(newEmployee.shiftEndHour) < 0 || parseInt(newEmployee.shiftEndHour) > 23) {
//             validationErrors.shiftEndHour = 'End hour must be between 0-23';
//         }

//         if (Object.keys(validationErrors).length > 0) {
//             setErrors(validationErrors);
//             return;
//         }

//         const updatedWeeks = [...editedWeeks];
//         const todayKey = getLocalDateKey();

//         updatedWeeks.forEach((week, weekIndex) => {
//             const weekStartDateKey = getDateKey(week.startDate);
//             const weekEndDateKey = getDateKey(week.endDate);

//             const isSuperAdmin = bulkEditRoster?.data?.userPermissions?.accountType === 'superAdmin';
//             const isCurrentOrFuture = weekStartDateKey >= todayKey ||
//                 (weekStartDateKey <= todayKey && weekEndDateKey >= todayKey);

//             if (isSuperAdmin || isCurrentOrFuture) {
//                 const employeeExists = week.employees.some(emp => emp.name === newEmployee.name);

//                 if (!employeeExists) {
//                     const dailyStatus = [];
//                     const startDateKey = getDateKey(week.startDate);
//                     const endDateKey = getDateKey(week.endDate);
//                     const daysInWeek = getDateRangeDurationDaysUTC(startDateKey, endDateKey);

//                     for (let dayIndex = 0; dayIndex < daysInWeek; dayIndex += 1) {
//                         const status = newEmployee.dailyStatus[dayIndex % 7] || 'P';
//                         const dayDateKey = addDaysToDateKeyUTC(startDateKey, dayIndex);

//                         dailyStatus.push({
//                             date: getUTCISOStringFromDateKey(dayDateKey),
//                             status: status
//                         });
//                     }

//                     updatedWeeks[weekIndex].employees.push({
//                         _id: `new-${Date.now()}-${weekIndex}`,
//                         userId: null,
//                         name: newEmployee.name,
//                         transport: newEmployee.transport || '',
//                         cabRoute: newEmployee.cabRoute || '',
//                         teamLeader: newEmployee.teamLeader || '',
//                         shiftStartHour: parseInt(newEmployee.shiftStartHour),
//                         shiftEndHour: parseInt(newEmployee.shiftEndHour),
//                         dailyStatus: dailyStatus
//                     });
//                 }
//             }
//         });

//         setEditedWeeks(updatedWeeks);
//         setShowAddEmployeeForm(false);
//         setNewEmployee({
//             name: '',
//             transport: '',
//             cabRoute: '',
//             teamLeader: '',
//             shiftStartHour: '',
//             shiftEndHour: '',
//             dailyStatus: Array(7).fill('P')
//         });
//         setErrors({});
//     };

//     const handleRemoveEmployee = (weekIndex, employeeId) => {
//         const updatedWeeks = [...editedWeeks];
//         updatedWeeks[weekIndex].employees = updatedWeeks[weekIndex].employees.filter(
//             emp => emp._id !== employeeId
//         );
//         setEditedWeeks(updatedWeeks);
//     };
//     const handleSaveAll = () => {
//         if (!rosterId) return;
//         const weeksData = editedWeeks.map(week => ({
//             weekNumber: week.weekNumber,
//             employees: week.employees.map(emp => ({
//                 _id: emp._id,
//                 userId: emp.userId,
//                 name: emp.name,
//                 transport: emp.transport,
//                 cabRoute: emp.cabRoute,
//                 teamLeader: emp.teamLeader || '',
//                 shiftStartHour: emp.shiftStartHour,
//                 shiftEndHour: emp.shiftEndHour,
//                 dailyStatus: emp.dailyStatus.map(status => ({
//                     date: status.date,
//                     status: status.status
//                 }))
//             }))
//         }));

//         dispatch(bulkUpdateRosterWeeks({
//             rosterId,
//             data: { weeks: weeksData }
//         }));
//     };
//     const getStatusIcon = (status) => {
//         switch (status) {
//             case 'P': return '✅';
//             case 'WO': return '🗓️';
//             case 'L': return '❌';
//             case 'NCNS': return '🚫';
//             case 'UL': return '💸';
//             case 'LWP': return '💰';
//             case 'BL': return '⚫';
//             case 'H': return '🎉';
//             case 'HD': return '🌓';
//             case 'LWD': return '📅';
//             default: return '📝';
//         }
//     };

//     const isLikelyDateString = (value) => {
//         if (typeof value !== 'string') return false;
//         const trimmed = value.trim();
//         if (!trimmed) return false;
//         return (
//             /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed) ||
//             /^\d{4}\/\d{2}\/\d{2}/.test(trimmed)
//         );
//     };

//     const formatSimpleDate = (value) => {
//         const date = value instanceof Date ? value : new Date(value);
//         if (Number.isNaN(date.getTime())) return null;
//         return date.toLocaleString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//             hour: 'numeric',
//             minute: '2-digit',
//             hour12: true
//         });
//     };

//     const formatHistoryValue = (value) => {
//         if (value === null || value === undefined || value === '') return '-';
//         if (value instanceof Date) return formatSimpleDate(value);
//         if (isLikelyDateString(value)) {
//             const formattedDate = formatSimpleDate(value);
//             if (formattedDate) return formattedDate;
//         }
//         if (typeof value === 'boolean') return value ? 'Yes' : 'No';
//         if (typeof value === 'object') return JSON.stringify(value);
//         return String(value);
//     };

//     const splitPathSafely = (path) => {
//         if (!path) return [];
//         const parts = [];
//         let current = '';
//         let parenDepth = 0;
//         let bracketDepth = 0;

//         for (let i = 0; i < path.length; i += 1) {
//             const ch = path[i];
//             if (ch === '(') parenDepth += 1;
//             if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
//             if (ch === '[') bracketDepth += 1;
//             if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

//             if (ch === '.' && parenDepth === 0 && bracketDepth === 0) {
//                 if (current) parts.push(current);
//                 current = '';
//                 continue;
//             }

//             current += ch;
//         }

//         if (current) parts.push(current);
//         return parts;
//     };

//     const formatFieldToken = (token) => {
//         if (!token) return '';
//         const trimmed = token.trim();
//         const dateMatch = trimmed.match(/\(([^)]+)\)/);
//         const rawDate = dateMatch?.[1]?.trim();
//         const formattedDate = rawDate ? formatSimpleDate(rawDate) : null;

//         const baseLabel = trimmed
//             .replace(/\([^)]+\)/g, '')
//             .replace(/\[(\d+)\]/g, ' $1')
//             .replace(/([a-z])([A-Z])/g, '$1 $2')
//             .replace(/_/g, ' ')
//             .replace(/\s+/g, ' ')
//             .trim()
//             .replace(/^./, (c) => c.toUpperCase());

//         if (formattedDate) {
//             return `${baseLabel} (${formattedDate})`;
//         }

//         return baseLabel || trimmed;
//     };

//     const formatFieldLabel = (fieldPath) => {
//         if (!fieldPath) return 'Field';
//         const normalized = splitPathSafely(fieldPath)
//             .filter(Boolean)
//             .map((part) => {
//                 const arrayIndexMatch = part.match(/^\[(\d+)\]$/);
//                 if (arrayIndexMatch) return `#${Number(arrayIndexMatch[1]) + 1}`;
//                 if (/^\d+$/.test(part)) return `#${Number(part) + 1}`;
//                 return formatFieldToken(part);
//             });
//         return normalized.join(' > ');
//     };

//     const flattenObjectPaths = (obj, prefix = '') => {
//         if (obj === null || obj === undefined) return {};
//         if (typeof obj !== 'object') return { [prefix]: obj };

//         const entries = {};
//         Object.entries(obj).forEach(([key, value]) => {
//             const path = prefix ? `${prefix}.${key}` : key;
//             if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
//                 Object.assign(entries, flattenObjectPaths(value, path));
//             } else {
//                 entries[path] = value;
//             }
//         });
//         return entries;
//     };

//     const extractChangeRows = (changes) => {
//         const rows = [];
//         const pushRow = (field, oldValue, newValue) => {
//             rows.push({
//                 field: formatFieldLabel(field),
//                 oldValue: formatHistoryValue(oldValue),
//                 newValue: formatHistoryValue(newValue)
//             });
//         };

//         if (!changes) return rows;

//         if (
//             typeof changes === 'object' &&
//             !Array.isArray(changes) &&
//             changes.before &&
//             changes.after &&
//             typeof changes.before === 'object' &&
//             typeof changes.after === 'object'
//         ) {
//             const beforeMap = flattenObjectPaths(changes.before);
//             const afterMap = flattenObjectPaths(changes.after);
//             const allKeys = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);
//             allKeys.forEach((key) => {
//                 if (beforeMap[key] !== afterMap[key]) {
//                     pushRow(key, beforeMap[key], afterMap[key]);
//                 }
//             });
//             return rows;
//         }

//         const parseEntry = (entry, parentKey = '') => {
//             if (entry === null || entry === undefined) return;

//             if (Array.isArray(entry)) {
//                 entry.forEach((item, index) => parseEntry(item, `${parentKey}[${index}]`));
//                 return;
//             }

//             if (typeof entry !== 'object') {
//                 if (parentKey) pushRow(parentKey, '-', entry);
//                 return;
//             }

//             const field = entry.field || entry.key || parentKey;
//             const oldValue = entry.oldValue ?? entry.old ?? entry.previous ?? entry.from;
//             const newValue = entry.newValue ?? entry.new ?? entry.current ?? entry.to;

//             if (field && (oldValue !== undefined || newValue !== undefined)) {
//                 pushRow(field, oldValue, newValue);
//                 return;
//             }

//             Object.entries(entry).forEach(([key, value]) => {
//                 const nestedKey = parentKey ? `${parentKey}.${key}` : key;
//                 parseEntry(value, nestedKey);
//             });
//         };

//         parseEntry(changes);
//         return rows;
//     };

//     const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

//     if (bulkEditLoading) {
//         return (
//             <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
//                     <p className="mt-4 text-gray-600">Loading roster data...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (bulkEditError) {
//         return (
//             <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
//                 <div className="text-center p-8">
//                     <div className="text-red-500 text-4xl mb-4">⚠️</div>
//                     <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
//                     <p className="text-gray-600 mb-4">{bulkEditError}</p>
//                     <button
//                         onClick={onClose}
//                         className="bg-emerald-600 text-white px-4 py-2 rounded"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     if (!bulkEditRoster?.data) {
//         return null;
//     }

//     const { weeks, userPermissions } = bulkEditRoster.data;
//     const todayKey = getLocalDateKey();

//     return (
//         <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-emerald-50 to-lime-50 flex flex-col z-50 [&_button]:cursor-pointer [&_select]:cursor-pointer">
//             <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
//                 <div className="p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:justify-between mt-5 lg:items-start">
//                     <div>
//                         <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Roster Workspace</p>
//                         {/* <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bulk Edit Roster</h1> */}
//                         <p className="text-slate-600 mt-2">
//                             Edit all weeks at once with clear day-wise attendance updates.
//                         </p>
//                         <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
//                             <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{weeks.length} week(s)</span>
//                             <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{weeks.reduce((sum, week) => sum + week.employees.length, 0)} employees</span>
//                             <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">SuperAdmin: Edit All Weeks</span>
//                             <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">HR: Edit Current/Future Only</span>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="border-t border-slate-200 bg-slate-50/80">
//                     <div className="flex overflow-x-auto px-3 py-3 gap-2">
//                         {editedWeeks.map((week, index) => {
//                             const weekStartDateKey = getDateKey(week.startDate);
//                             const weekEndDateKey = getDateKey(week.endDate);
//                             const hasWeekEnded = weekEndDateKey < todayKey;
//                             const isCurrentWeek = weekStartDateKey <= todayKey && weekEndDateKey >= todayKey;

//                             let timelineStatus = 'upcoming';
//                             if (hasWeekEnded) timelineStatus = 'past';
//                             else if (isCurrentWeek) timelineStatus = 'current';

//                             const isEditable = userPermissions?.accountType === 'superAdmin' ||
//                                 (userPermissions?.accountType === 'HR' && !hasWeekEnded);

//                             return (
//                                 <button
//                                     key={week.weekNumber}
//                                     onClick={() => setActiveTab(index)}
//                                     className={`px-4 py-2.5 rounded-xl border font-medium whitespace-nowrap flex items-center transition-colors ${activeTab === index
//                                         ? 'border-emerald-300 text-emerald-800 bg-emerald-100 shadow-sm'
//                                         : hasWeekEnded
//                                             ? 'border-amber-200 text-amber-800 bg-amber-50'
//                                             : 'border-slate-200 text-slate-600 bg-white hover:text-slate-800 '
//                                         } ${!isEditable ? 'cursor-not-allowed' : ''}`}
//                                     title={!isEditable ? 'Week has ended. Only Super Admin can edit past weeks.' : ''}
//                                 >
//                                     <span className="mr-2 text-sm">
//                                         {timelineStatus === 'past' && '📅'}
//                                         {timelineStatus === 'current' && '📌'}
//                                         {timelineStatus === 'upcoming' && '📋'}
//                                     </span>
//                                     <div className="flex flex-col items-start">
//                                         <span>Week {week.weekNumber}</span>
//                                         <span className="text-[11px] text-slate-500">
//                                             {formatDateFromKeyUTC(weekStartDateKey, { day: '2-digit', month: 'short' })} - {formatDateFromKeyUTC(weekEndDateKey, { day: '2-digit', month: 'short' })}
//                                         </span>
//                                     </div>
//                                     <span className="ml-2 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{week.employees.length} emp</span>
//                                     {hasWeekEnded && (
//                                         <span className="ml-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
//                                             Past Week
//                                         </span>
//                                     )}
//                                     {!isEditable && (
//                                         <span className="ml-2 text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
//                                             Read Only
//                                         </span>
//                                     )}
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 </div>
//             </div>
//             <div className="flex-1 overflow-y-auto p-4 md:p-6">
//                 {editedWeeks.length > 0 && (
//                     <>
//                         <div className="mb-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
//                             <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
//                                 <div>
//                                     <h3 className="font-semibold text-slate-900 text-lg">
//                                         Week {editedWeeks[activeTab].weekNumber}
//                                     </h3>
//                                     <p className="text-slate-600 text-sm">
//                                         {formatDateFromKeyUTC(getDateKey(editedWeeks[activeTab].startDate))} -
//                                         {formatDateFromKeyUTC(getDateKey(editedWeeks[activeTab].endDate))}
//                                     </p>
//                                 </div>
//                                 <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
//                                     <div className="text-sm text-slate-600 font-medium">
//                                         {editedWeeks[activeTab].employees.length} employees
//                                     </div>
//                                     <button
//                                         onClick={() => setShowAddEmployeeForm(true)}
//                                         className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm shadow-sm"
//                                     >
//                                         + Add Employee
//                                     </button>
//                                     <button
//                                         onClick={onClose}
//                                         className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700  text-sm"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         onClick={handleSaveAll}
//                                         disabled={bulkSaveLoading}
//                                         className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm"
//                                     >
//                                         {bulkSaveLoading ? (
//                                             <>
//                                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                                                 Saving...
//                                             </>
//                                         ) : (
//                                             'Save All Changes'
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                         {showAddEmployeeForm && (
//                             <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
//                                 <div className="flex justify-between items-center mb-4">
//                                     <h3 className="font-semibold text-slate-900 text-lg">Add New Employee</h3>
//                                     <button
//                                         onClick={() => setShowAddEmployeeForm(false)}
//                                         className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 "
//                                     >
//                                         ✕
//                                     </button>
//                                 </div>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
//                                     <div>
//                                         <input
//                                             type="text"
//                                             placeholder="Employee Name *"
//                                             value={newEmployee.name}
//                                             onChange={(e) => handleNewEmployeeChange('name', e.target.value)}
//                                             className={`w-full border p-3 rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
//                                         />
//                                         {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
//                                     </div>

//                                     <select
//                                         value={newEmployee.transport}
//                                         onChange={(e) => handleNewEmployeeChange('transport', e.target.value)}
//                                         className="w-full border border-gray-300 p-3 rounded"
//                                     >
//                                         <option value="">Transport?</option>
//                                         <option value="Yes">Yes</option>
//                                         <option value="No">No</option>
//                                     </select>

//                                     <input
//                                         type="text"
//                                         placeholder="CAB Route"
//                                         value={newEmployee.cabRoute}
//                                         onChange={(e) => handleNewEmployeeChange('cabRoute', e.target.value)}
//                                         className="w-full border border-gray-300 p-3 rounded"
//                                     />

//                                     <input
//                                         type="text"
//                                         placeholder="Team Leader (Optional)"
//                                         value={newEmployee.teamLeader}
//                                         onChange={(e) => handleNewEmployeeChange('teamLeader', e.target.value)}
//                                         className="w-full border border-gray-300 p-3 rounded"
//                                     />

//                                     <div>
//                                         <input
//                                             type="number"
//                                             placeholder="Shift Start Hour (0-23) *"
//                                             value={newEmployee.shiftStartHour}
//                                             onChange={(e) => handleNewEmployeeChange('shiftStartHour', e.target.value)}
//                                             min="0"
//                                             max="23"
//                                             className={`w-full border p-3 rounded ${errors.shiftStartHour ? 'border-red-500' : 'border-gray-300'}`}
//                                         />
//                                         {errors.shiftStartHour && <p className="text-red-500 text-sm mt-1">{errors.shiftStartHour}</p>}
//                                     </div>

//                                     <div>
//                                         <input
//                                             type="number"
//                                             placeholder="Shift End Hour (0-23) *"
//                                             value={newEmployee.shiftEndHour}
//                                             onChange={(e) => handleNewEmployeeChange('shiftEndHour', e.target.value)}
//                                             min="0"
//                                             max="23"
//                                             className={`w-full border p-3 rounded ${errors.shiftEndHour ? 'border-red-500' : 'border-gray-300'}`}
//                                         />
//                                         {errors.shiftEndHour && <p className="text-red-500 text-sm mt-1">{errors.shiftEndHour}</p>}
//                                     </div>

//                                     <button
//                                         onClick={handleAddNewEmployee}
//                                         className="w-full bg-green-600 text-white p-3 rounded font-medium"
//                                     >
//                                         Add to Current & Future Weeks
//                                     </button>
//                                 </div>
//                                 <div className="mt-4">
//                                     <h4 className="font-medium text-gray-700 mb-3">Default Weekly Status Pattern</h4>
//                                     <div className="grid grid-cols-7 gap-2">
//                                         {daysOfWeek.map((day, index) => (
//                                             <div key={index} className="flex flex-col items-center">
//                                                 <span className="text-sm font-medium text-gray-700 mb-1">{day}</span>
//                                                 <select
//                                                     value={newEmployee.dailyStatus[index]}
//                                                     onChange={(e) => handleNewEmployeeChange('dailyStatus', e.target.value, index)}
//                                                     className="w-full border border-gray-300 p-2 rounded text-center"
//                                                 >
//                                                     <option value="P">P</option>
//                                                     <option value="WO">WO</option>
//                                                     <option value="L">L</option>
//                                                     <option value="NCNS">NCNS</option>
//                                                     <option value="UL">UL</option>
//                                                     <option value="LWP">LWP</option>
//                                                     <option value="BL">BL</option>
//                                                     <option value="H">H</option>
//                                                     <option value="HD">HD</option>
//                                                     <option value="LWD">LWD</option>
//                                                 </select>
//                                                 <div className="mt-1 text-lg">
//                                                     {getStatusIcon(newEmployee.dailyStatus[index])}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//                             <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
//                                 <p className="text-sm font-semibold text-slate-800">Employee Roster Grid</p>
//                                 <div className="flex flex-wrap items-center gap-2 text-xs">
//                                     <span className="px-2 py-1 rounded border border-green-200 bg-green-50 text-green-700">P Present</span>
//                                     <span className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">WO Week Off</span>
//                                     <span className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700">L Leave</span>
//                                     <span className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700">HD Half Day</span>
//                                     <span className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600">Other codes available in dropdown</span>
//                                 </div>
//                             </div>
//                             <div className="overflow-x-auto">
//                                 <table className="w-full">
//                                     <thead>
//                                         <tr className="bg-slate-100/90">
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[180px]">Name</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[110px]">Transport</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">CAB Route</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Team Leader</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Shift Hours</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[360px]">Daily Status</th>
//                                             <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[90px]">Actions</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {editedWeeks[activeTab].employees.map((employee, empIndex) => {
//                                             const weekStartDateKey = getDateKey(editedWeeks[activeTab].startDate);
//                                             const weekEndDateKey = getDateKey(editedWeeks[activeTab].endDate);
//                                             const daysInWeek = getDateRangeDurationDaysUTC(weekStartDateKey, weekEndDateKey);

//                                             return (
//                                                 <tr key={employee._id} className="border-b border-slate-100 /80">
//                                                     <td className="p-2">
//                                                         <input
//                                                             type="text"
//                                                             value={employee.name}
//                                                             onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'name', e.target.value)}
//                                                             className="w-full border border-gray-300 p-1 rounded text-sm"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <select
//                                                             value={employee.transport || ''}
//                                                             onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'transport', e.target.value)}
//                                                             className="w-full border border-gray-300 p-1 rounded text-sm"
//                                                         >
//                                                             <option value="">Select</option>
//                                                             <option value="Yes">Yes</option>
//                                                             <option value="No">No</option>
//                                                         </select>
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <input
//                                                             type="text"
//                                                             value={employee.cabRoute || ''}
//                                                             onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'cabRoute', e.target.value)}
//                                                             className="w-full border border-gray-300 p-1 rounded text-sm"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <input
//                                                             type="text"
//                                                             value={employee.teamLeader || ''}
//                                                             onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'teamLeader', e.target.value)}
//                                                             placeholder="Team Leader"
//                                                             className="w-full border border-gray-300 p-1 rounded text-sm"
//                                                         />
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <div className="flex gap-1">
//                                                             <input
//                                                                 type="number"
//                                                                 value={employee.shiftStartHour}
//                                                                 onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'shiftStartHour', e.target.value)}
//                                                                 min="0"
//                                                                 max="23"
//                                                                 className="w-full border border-gray-300 p-1 rounded text-center text-sm"
//                                                             />
//                                                             <span className="self-center text-xs">to</span>
//                                                             <input
//                                                                 type="number"
//                                                                 value={employee.shiftEndHour}
//                                                                 onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'shiftEndHour', e.target.value)}
//                                                                 min="0"
//                                                                 max="23"
//                                                                 className="w-full border border-gray-300 p-1 rounded text-center text-sm"
//                                                             />
//                                                         </div>
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <div className="flex gap-1 justify-center min-w-max">
//                                     {employee.dailyStatus.slice(0, daysInWeek).map((status, dayIndex) => {
//                                         const dayDateKey = addDaysToDateKeyUTC(weekStartDateKey, dayIndex);
//                                         const dayName = formatDateFromKeyUTC(dayDateKey, { weekday: 'short' });
//                                         const dayDateLabel = formatDateFromKeyUTC(dayDateKey, {
//                                             day: '2-digit',
//                                             month: 'short'
//                                         });
//                                         const fullDateLabel = formatDateFromKeyUTC(dayDateKey, {
//                                             weekday: 'long',
//                                             day: 'numeric',
//                                             month: 'long',
//                                             year: 'numeric'
//                                         });

//                                         return (
//                                             <div key={dayIndex} className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1">
//                                                 <span className="text-[10px] font-medium text-gray-700 leading-tight">{dayName}</span>
//                                                 <span className="text-[10px] text-gray-500 mb-0.5 leading-tight">{dayDateLabel}</span>
//                                                 <select
//                                                     value={status.status}
//                                                     onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, `dailyStatus[${dayIndex}]`, e.target.value)}
//                                                     title={`${fullDateLabel} - ${status.status}`}
//                                                     className={`w-8 h-8 border rounded text-center text-xs ${status.status === 'P' ? 'border-green-300 bg-green-50' :
//                                                         status.status === 'WO' ? 'border-emerald-300 bg-emerald-50' :
//                                                                                     status.status === 'L' ? 'border-red-300 bg-red-50' :
//                                                                                         status.status === 'HD' ? 'border-amber-400 bg-amber-100' :
//                                                                                         status.status === 'LWD' ? 'border-yellow-400 bg-yellow-100' :
//                                                                                             'border-gray-300 bg-gray-50'
//                                                                                 }`}
//                                                                         >
//                                                                             <option value="P">P</option>
//                                                                             <option value="WO">WO</option>
//                                                                             <option value="L">L</option>
//                                                                             <option value="NCNS">NCNS</option>
//                                                                             <option value="UL">UL</option>
//                                                                             <option value="LWP">LWP</option>
//                                                                             <option value="BL">BL</option>
//                                                                             <option value="H">H</option>
//                                                                             <option value="HD">HD</option>
//                                                                             <option value="LWD">LWD</option>
//                                                                         </select>
//                                                                         <span className="text-xs mt-0.5">{getStatusIcon(status.status)}</span>
//                                                                     </div>
//                                                                 );
//                                                             })}
//                                                         </div>
//                                                     </td>
//                                                     <td className="p-2">
//                                                         <div className="flex gap-2">
//                                                             {/* 👁 View History */}
//                                                             <button
//                                                                 onClick={() => handleViewHistory(employee)}
//                                                                 className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-blue-50 rounded-md transition-colors"
//                                                                 title="View Edit History"
//                                                                 aria-label="View Edit History"
//                                                             >
//                                                                 <FiEye className="w-4 h-4" />
//                                                             </button>

//                                                             {/* Remove Button */}
//                                                             <button
//                                                                 onClick={() => handleRemoveEmployee(activeTab, employee._id)}
//                                                                 className="p-2 text-slate-600  rounded-md transition-colors"
//                                                                 title="Remove Employee"
//                                                                 aria-label="Remove Employee"
//                                                             >
//                                                                 <FiTrash2 className="w-4 h-4" />
//                                                             </button>
//                                                         </div>
//                                                     </td>

//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </div>

//                             {editedWeeks[activeTab].employees.length === 0 && (
//                                 <div className="p-8 text-center text-gray-500">
//                                     No employees in this week. Click "Add Employee" to add employees.
//                                 </div>
//                             )}
//                         </div>
//                     </>
//                 )}
//             </div>
//             <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4">
//                 <div className="flex justify-between items-center">
//                     <div>
//                         <span className="text-slate-600 font-medium">
//                             Editing: Week {activeTab + 1} of {editedWeeks.length}
//                         </span>
//                     </div>
//                     <div className="flex gap-2">
//                         <button
//                             onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
//                             disabled={activeTab === 0}
//                             className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             Previous Week
//                         </button>
//                         <button
//                             onClick={() => setActiveTab(prev => Math.min(editedWeeks.length - 1, prev + 1))}
//                             disabled={activeTab === editedWeeks.length - 1}
//                             className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             Next Week
//                         </button>
//                     </div>
//                 </div>
//             </div>
//             {bulkSaveSuccess && (
//                 <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-60">
//                     <div className="flex items-center">
//                         <span className="text-xl mr-2">✅</span>
//                         <div>
//                             <p className="font-medium">Changes saved successfully!</p>
//                             <p className="text-sm opacity-90">All weeks have been updated.</p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {bulkSaveError && (
//                 <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-60">
//                     <div className="flex items-center">
//                         <span className="text-xl mr-2">⚠️</span>
//                         <div>
//                             <p className="font-medium">Save failed!</p>
//                             <p className="text-sm opacity-90">{bulkSaveError}</p>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {showHistoryModal && selectedEmployee && (
//                 <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
//                     <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
//                         <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
//                             <div className="flex items-center justify-between">
//                                 <div>
//                                     <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
//                                         Employee Audit Trail
//                                     </p>
//                                     <h2 className="text-xl font-semibold text-white">
//                                         Edit History - {selectedEmployee.name}
//                                     </h2>
//                                 </div>
//                                 <button
//                                     onClick={() => setShowHistoryModal(false)}
//                                     className="h-9 w-9 rounded-full border border-white/30 text-white  transition-colors text-lg"
//                                 >
//                                     ✕
//                                 </button>
//                             </div>
//                         </div>

//                         <div className="overflow-y-auto max-h-[calc(85vh-88px)] p-6 bg-slate-50">
//                             {selectedEmployee.logs.length === 0 ? (
//                                 <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
//                                     <p className="text-lg font-medium text-slate-700">No edit entries found</p>
//                                     <p className="mt-1 text-sm text-slate-500">
//                                         This employee has no recorded changes yet.
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {selectedEmployee.logs.map((log, index) => {
//                                         const changeRows = extractChangeRows(log.changes);
//                                         return (
//                                             <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
//                                                 <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
//                                                     <div className="flex items-center gap-2 text-sm">
//                                                         <span className="px-2 py-1 rounded bg-blue-100 text-emerald-700 font-medium">
//                                                             Edited By
//                                                         </span>
//                                                         <span className="font-semibold text-slate-800">
//                                                             {log.editedByName || 'Unknown'}
//                                                         </span>
//                                                     </div>
//                                                     <span className="text-xs sm:text-sm text-slate-500">
//                                                         {formatSimpleDate(log.editedAt) || '-'}
//                                                     </span>
//                                                 </div>

//                                                 <div className="mb-3 flex items-center gap-2">
//                                                     <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
//                                                         {changeRows.length} field(s) changed
//                                                     </span>
//                                                 </div>

//                                                 {changeRows.length > 0 ? (
//                                                     <div className="overflow-x-auto rounded-lg border border-slate-200">
//                                                         <table className="w-full text-sm">
//                                                             <thead className="bg-slate-100 text-slate-700">
//                                                                 <tr>
//                                                                     <th className="p-2 text-left font-semibold">What Changed</th>
//                                                                     <th className="p-2 text-left font-semibold">Old Value</th>
//                                                                     <th className="p-2 text-left font-semibold">New Value</th>
//                                                                 </tr>
//                                                             </thead>
//                                                             <tbody>
//                                                                 {changeRows.map((row, rowIndex) => (
//                                                                     <tr key={rowIndex} className="border-t border-slate-100">
//                                                                         <td className="p-2 text-slate-700">{row.field}</td>
//                                                                         <td className="p-2 text-red-700">{row.oldValue}</td>
//                                                                         <td className="p-2 text-emerald-700">{row.newValue}</td>
//                                                                     </tr>
//                                                                 ))}
//                                                             </tbody>
//                                                         </table>
//                                                     </div>
//                                                 ) : (
//                                                     <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
//                                                         Change details are available, but not in a field-wise format.
//                                                     </div>
//                                                 )}

//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             )}

//         </div>
//     );
// };

// export default RosterBulkEditForm;



import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiTrash2, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import {
    getRosterForBulkEdit,
    bulkUpdateRosterWeeks,
    clearBulkEditState,
    clearBulkSaveState,
    searchBulkEditEmployees,
    fetchAllRosters
} from '../features/slices/rosterSlice.js';

const RosterBulkEditForm = ({ rosterId, onClose }) => {
    const dispatch = useDispatch();
    const {
        bulkEditRoster,
        bulkEditLoading,
        bulkEditError,
        bulkSaveLoading,
        bulkSaveSuccess,
        bulkSaveError,
        bulkEditSearch,
        bulkEditSearchLoading,
        bulkEditSearchError,
        allRosters
    } = useSelector((state) => state.roster);
    const [selectedRosterId, setSelectedRosterId] = useState(rosterId);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [currentRosterWeek, setCurrentRosterWeek] = useState(null);

    const [availableDepartments, setAvailableDepartments] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [isWorkspaceHeaderCollapsed, setIsWorkspaceHeaderCollapsed] = useState(false);
    const [showSnapshotExportModal, setShowSnapshotExportModal] = useState(false);
    const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
    const exportCaptureRef = useRef(null);
    const [columnVisibility, setColumnVisibility] = useState({
        name: true,
        department: true,
        transport: true,
        cabRoute: true,
        teamLeader: true,
        shiftHours: true,
        dailyStatus: true,
        actions: true,
    });
    const [snapshotColumnVisibility, setSnapshotColumnVisibility] = useState({
        name: true,
        department: true,
        transport: true,
        cabRoute: true,
        teamLeader: true,
        shiftHours: true,
        dailyStatus: true,
    });
    const snapshotColumnOptions = [
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'transport', label: 'Transport' },
        { key: 'cabRoute', label: 'CAB Route' },
        { key: 'teamLeader', label: 'Team Leader' },
        { key: 'shiftHours', label: 'Shift Hours' },
        { key: 'dailyStatus', label: 'Daily Status' },
    ];

    const [activeTab, setActiveTab] = useState(0);
    const [editedWeeks, setEditedWeeks] = useState([]);
    const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
    const [searchBy, setSearchBy] = useState('all'); // all | name | department | teamLeader
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
	    const [newEmployee, setNewEmployee] = useState({
	        name: '',
	        department: '',
	        transport: '',
        cabRoute: '',
        teamLeader: '',
        shiftStartHour: '',
        shiftEndHour: '',
        dailyStatus: Array(7).fill('P')
	    });
		    const [errors, setErrors] = useState({});
      const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}/;
      const pad2 = (value) => String(value).padStart(2, '0');
      const getDateKey = (value) => {
        if (!value) return null;
        if (typeof value === 'string' && DATE_ONLY_REGEX.test(value)) return value.slice(0, 10);
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
      };
      const dateFromKeyUTC = (dateKey) => {
        const [year, month, day] = String(dateKey).split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      };
      const addDaysToDateKeyUTC = (dateKey, days) => {
        const date = dateFromKeyUTC(dateKey);
        date.setUTCDate(date.getUTCDate() + days);
        return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
      };
      const getUTCISOStringFromDateKey = (dateKey) => `${dateKey}T00:00:00.000Z`;
      const getDateRangeDurationDaysUTC = (startDateKey, endDateKey) => {
        const start = dateFromKeyUTC(startDateKey);
        const end = dateFromKeyUTC(endDateKey);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      };
      const getIstDateKey = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(date);
        const year = parts.find((p) => p.type === "year")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;
        return year && month && day ? `${year}-${month}-${day}` : null;
      };
      const getCurrentAccountType = () =>
        String(bulkEditRoster?.data?.userPermissions?.accountType || "").toLowerCase();
      const isEmployeeRosterEditor = () => getCurrentAccountType() === "employee";
      const allRostersList = Array.isArray(allRosters) ? allRosters : (allRosters?.data || []);
      const visibleColumns = columnVisibility;
      const exportVisibleColumns = snapshotColumnVisibility;
      const exportCanvasWidth = (() => {
        let width = 80;
        if (exportVisibleColumns.name) width += 240;
        if (exportVisibleColumns.department) width += 180;
        if (exportVisibleColumns.transport) width += 150;
        if (exportVisibleColumns.cabRoute) width += 180;
        if (exportVisibleColumns.teamLeader) width += 190;
        if (exportVisibleColumns.shiftHours) width += 170;
        if (exportVisibleColumns.dailyStatus) width += 820;
        return Math.max(1200, Math.min(1900, width));
      })();
      const formatRosterMonthYear = (month, year) => {
        const monthNum = Number(month);
        const yearNum = Number(year);
        if (!Number.isFinite(monthNum) || !Number.isFinite(yearNum)) return "Unknown";
        return `${new Date(2000, Math.max(0, monthNum - 1), 1).toLocaleString("default", { month: "long" })} ${yearNum}`;
      };
      const getStatusInlineStyle = (status) => {
        const palette = {
            P: { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" },
            WO: { backgroundColor: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
            L: { backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" },
            NCNS: { backgroundColor: "#fee2e2", color: "#7f1d1d", borderColor: "#fca5a5" },
            UL: { backgroundColor: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" },
            LWP: { backgroundColor: "#ffedd5", color: "#c2410c", borderColor: "#fdba74" },
            BL: { backgroundColor: "#f3f4f6", color: "#111827", borderColor: "#d1d5db" },
            H: { backgroundColor: "#ede9fe", color: "#5b21b6", borderColor: "#c4b5fd" },
            HD: { backgroundColor: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" },
            LWD: { backgroundColor: "#fef9c3", color: "#a16207", borderColor: "#fde047" },
        };
        return palette[status] || { backgroundColor: "#f3f4f6", color: "#6b7280", borderColor: "#d1d5db" };
      };
      const getSnapshotDayMeta = (_statusItem, dayIndex) => {
        const dayDate = (() => {
            if (!activeWeek?.startDate) return null;
            const startKey = getDateKey(activeWeek.startDate);
            if (!startKey) return null;
            return new Date(getUTCISOStringFromDateKey(addDaysToDateKeyUTC(startKey, dayIndex)));
        })();
        if (!dayDate) return { dayName: '-', dayDateLabel: '-' };
        return {
            dayName: dayDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }),
            dayDateLabel: dayDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })
        };
      };

      const handleDownloadSnapshot = async () => {
        const selectedColumns = Object.values(exportVisibleColumns).filter(Boolean).length;
        if (!selectedColumns) {
            toast.error('Select at least one field for snapshot export.');
            return;
        }
        if (!exportCaptureRef.current || isGeneratingSnapshot) {
            toast.error('Snapshot area not ready. Please try again.');
            return;
        }
        try {
            setIsGeneratingSnapshot(true);
            const captureNode = exportCaptureRef.current;
            let canvas = null;
            let lastCaptureError = null;
            const preferredScale = Math.max(3, Math.min(4, (window.devicePixelRatio || 1) * 2.2));

            for (const scale of [preferredScale, 3, 2.5, 2]) {
                try {
                    canvas = await html2canvas(captureNode, {
                        scale,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        scrollX: 0,
                        scrollY: -window.scrollY,
                        windowWidth: Math.max(captureNode.scrollWidth, captureNode.clientWidth),
                        windowHeight: Math.max(captureNode.scrollHeight, captureNode.clientHeight),
                    });
                    if (canvas) break;
                } catch (captureErr) {
                    lastCaptureError = captureErr;
                }
            }

            if (!canvas) {
                throw lastCaptureError || new Error('Unable to render snapshot canvas.');
            }
            const titlePart = formatRosterMonthYear(
                bulkEditRoster?.data?.month,
                bulkEditRoster?.data?.year
            )
                .toLowerCase()
                .replace(/\s+/g, '-');
            const weekNumber = editedWeeks?.[activeTab]?.weekNumber ?? 'selected';
            const filename = `roster-snapshot-${titlePart || 'selected'}-week-${weekNumber}.png`;
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((value) => {
                    if (value) resolve(value);
                    else reject(new Error('Snapshot blob generation failed.'));
                }, 'image/png');
            });

            try {
                localStorage.setItem(
                    'roster_last_snapshot_meta',
                    JSON.stringify({
                        filename,
                        weekNumber,
                        rosterId: selectedRosterId,
                        month: bulkEditRoster?.data?.month,
                        year: bulkEditRoster?.data?.year,
                        capturedAt: new Date().toISOString(),
                    })
                );
            } catch (storageErr) {
                console.warn('Could not persist snapshot to localStorage:', storageErr);
            }

            const link = document.createElement('a');
            link.download = filename;
            const objectUrl = URL.createObjectURL(blob);
            link.href = objectUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
            setShowSnapshotExportModal(false);
            toast.success(`Snapshot downloaded: Week ${weekNumber}`);
        } catch (err) {
            console.error('Snapshot generation failed:', err);
            toast.error(`Failed to generate/download snapshot: ${err?.message || 'unknown error'}`);
        } finally {
            setIsGeneratingSnapshot(false);
        }
      };

    useEffect(() => {
        setSelectedRosterId(rosterId);
    }, [rosterId]);

    useEffect(() => {
        if (!allRostersList.length) {
            dispatch(fetchAllRosters({ page: 1, limit: 100 }));
        }
    }, [dispatch, allRostersList.length]);

    useEffect(() => {
        if (selectedRosterId) {
            dispatch(getRosterForBulkEdit(selectedRosterId));
        }
        return () => {
            dispatch(clearBulkEditState());
            dispatch(clearBulkSaveState());
        };
    }, [selectedRosterId, dispatch]);

    useEffect(() => {
        if (bulkEditRoster?.data?.weeks) {
	            // Deep clone the weeks data
	            const weeksCopy = JSON.parse(JSON.stringify(bulkEditRoster.data.weeks));

	            // Ensure department field exists and add employeesByDepartment if not present
	            weeksCopy.forEach(week => {
                const weekStartKey = getDateKey(week.startDate);
                const weekEndKey = getDateKey(week.endDate);
                const daysInWeek =
                    weekStartKey && weekEndKey ? getDateRangeDurationDaysUTC(weekStartKey, weekEndKey) : 0;

	                week.employees = week.employees.map(emp => {
                    const byUtcKey = new Map();
                    const byIstKey = new Map();
                    (emp.dailyStatus || []).forEach((d) => {
                        const utcKey = getDateKey(d?.date);
                        const istKey = getIstDateKey(d?.date);
                        if (utcKey && !byUtcKey.has(utcKey)) byUtcKey.set(utcKey, d);
                        if (istKey && !byIstKey.has(istKey)) byIstKey.set(istKey, d);
                    });

                    const normalizedDailyStatus =
                        daysInWeek > 0
                            ? Array.from({ length: daysInWeek }, (_, idx) => {
                                  const dateKey = addDaysToDateKeyUTC(weekStartKey, idx);
                                  // Prefer IST day-key first to avoid 1-day drift from UTC-midnight conversions.
                                  const matched = byIstKey.get(dateKey) || byUtcKey.get(dateKey) || emp.dailyStatus?.[idx];
                                  return {
                                      ...(matched || {}),
                                      date: getUTCISOStringFromDateKey(dateKey),
                                      status:
                                          matched?.status ||
                                          matched?.departmentStatus ||
                                          matched?.transportStatus ||
                                          'P'
                                  };
                              })
                            : (emp.dailyStatus || []).map((d) => ({
                                  ...d,
                                  status: d?.status || d?.departmentStatus || d?.transportStatus || 'P'
                              }));

                    return {
                        ...emp,
                        department: emp.department || 'General',
                        dailyStatus: normalizedDailyStatus
                    };
                });

	                // Create employeesByDepartment if not present from backend
	                if (!week.employeesByDepartment) {
                    week.employeesByDepartment = week.employees.reduce((acc, emp) => {
                        const dept = emp.department || 'General';
                        if (!acc[dept]) acc[dept] = [];
                        acc[dept].push(emp);
                        return acc;
                    }, {});
                }
            });

            setEditedWeeks(weeksCopy);

            // Set current roster week for date reference
            if (weeksCopy.length > 0) {
                setCurrentRosterWeek(weeksCopy[0]);
            }

            // Extract unique departments from employees
            const depts = new Set();
            weeksCopy.forEach(week => {
                week.employees.forEach(emp => {
                    if (emp.department) {
                        depts.add(emp.department);
                    }
                });
            });
            setAvailableDepartments(Array.from(depts).sort());
        }
    }, [bulkEditRoster]);

    useEffect(() => {
        setActiveTab(0);
        setCurrentPage(1);
        setSearchInput('');
        setAppliedSearch('');
    }, [selectedRosterId]);

    useEffect(() => {
        const t = setTimeout(() => {
            setAppliedSearch(String(searchInput || '').trim());
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, appliedSearch, searchBy]);

    useEffect(() => {
        if (!selectedRosterId) return;
        const q = String(appliedSearch || '').trim();
        if (!q) return;

        const currentData = bulkEditSearch?.data;
        const isSameRequest =
            currentData &&
            String(currentData.rosterId) === String(selectedRosterId) &&
            String(currentData.q || '') === String(q) &&
            String(currentData.searchBy || 'all') === String(searchBy || 'all');

        if (isSameRequest) return;

        dispatch(searchBulkEditEmployees({ rosterId: selectedRosterId, q, searchBy }));
    }, [dispatch, selectedRosterId, appliedSearch, searchBy, bulkEditSearch]);

    const localEmployeeMatches = (employee, queryLower, by) => {
        const name = String(employee?.name || '').toLowerCase();
        const department = String(employee?.department || '').toLowerCase();
        const teamLeader = String(employee?.teamLeader || '').toLowerCase();
        const mode = String(by || 'all').toLowerCase();

        if (!queryLower) return true;
        if (mode === 'name') return name.includes(queryLower);
        if (mode === 'department') return department.includes(queryLower);
        if (mode === 'teamleader') return teamLeader.includes(queryLower);
        return name.includes(queryLower) || department.includes(queryLower) || teamLeader.includes(queryLower);
    };

    const getFilteredEmployees = (weekNumber, employees) => {
        const q = String(appliedSearch || '').trim();
        if (!q) return employees;

        const queryLower = q.toLowerCase();
        const currentData = bulkEditSearch?.data;
        const isSearchResultCurrent =
            currentData &&
            String(currentData.rosterId) === String(selectedRosterId) &&
            String(currentData.q || '') === String(q) &&
            String(currentData.searchBy || 'all') === String(searchBy || 'all');

        const matchedIdsRaw = isSearchResultCurrent
            ? currentData?.matchingEmployeeIdsByWeek?.[String(weekNumber)]
            : null;
        const matchedIds = Array.isArray(matchedIdsRaw) ? new Set(matchedIdsRaw.map(String)) : null;

        return (employees || []).filter((emp) => {
            const id = emp?._id != null ? String(emp._id) : '';
            const isNew = id.startsWith('new-');
            const localMatch = localEmployeeMatches(emp, queryLower, searchBy);

            if (isNew) return localMatch;
            if (matchedIds) return matchedIds.has(id) || localMatch;
            return localMatch;
        });
    };

    // Get Current Page Employees with Pagination
    const getCurrentPageEmployees = (weekNumber, employees) => {
        const filtered = getFilteredEmployees(weekNumber, employees);
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filtered.slice(indexOfFirstItem, indexOfLastItem);
    };

    useEffect(() => {
        const week = editedWeeks?.[activeTab];
        const weekNumber = week?.weekNumber;
        const employees = week?.employees || [];
        const filteredCount = getFilteredEmployees(weekNumber, employees).length;
        const totalPages = Math.max(1, Math.ceil(filteredCount / itemsPerPage));
        setCurrentPage((prev) => (prev > totalPages ? totalPages : prev));
    }, [editedWeeks, activeTab, appliedSearch, searchBy, bulkEditSearch, itemsPerPage]);

	    const handleEmployeeFieldChange = (weekIndex, employeeIndex, field, value) => {
	        const updatedWeeks = [...editedWeeks];

	        if (field.startsWith('dailyStatus[')) {
	            const dayIndex = parseInt(field.match(/\[(\d+)\]/)[1]);
	          if (isEmployeeRosterEditor()) {
                const existingDayDate =
                    updatedWeeks?.[weekIndex]?.employees?.[employeeIndex]?.dailyStatus?.[dayIndex]?.date;
	            const weekStart = updatedWeeks?.[weekIndex]?.startDate;
	            const dayDate = existingDayDate ? new Date(existingDayDate) : new Date(weekStart);
                if (!existingDayDate) {
	                dayDate.setDate(dayDate.getDate() + dayIndex);
                }
	            const dayKey = getIstDateKey(dayDate);
	            const todayKey = getIstDateKey(new Date());
	            if (dayKey && todayKey && dayKey < todayKey) {
	                return;
	            }
              }
	            updatedWeeks[weekIndex].employees[employeeIndex].dailyStatus[dayIndex].status = value;
	        } else {
	            updatedWeeks[weekIndex].employees[employeeIndex][field] = value;
	        }

        // Update employeesByDepartment after change
        const week = updatedWeeks[weekIndex];
        week.employeesByDepartment = week.employees.reduce((acc, emp) => {
            const dept = emp.department || 'General';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(emp);
            return acc;
        }, {});

        setEditedWeeks(updatedWeeks);
    };

    const handleViewHistory = (employee) => {
        const history = bulkEditRoster?.data?.editHistory || [];

        if (history.length === 0) {
            alert("No edit history available");
            return;
        }

        const employeeLogs = history.filter(
            (log) => log.employeeId?.toString() === employee._id?.toString()
        );

        // Get the week start date from the current active tab
        const weekStartDate = editedWeeks[activeTab]?.startDate;

        setSelectedEmployee({
            name: employee.name,
            logs: employeeLogs,
            weekStartDate: weekStartDate // Pass the current week's start date
        });

        setShowHistoryModal(true);
    };

    const handleNewEmployeeChange = (field, value, dayIndex = null) => {
        const updatedEmployee = { ...newEmployee };

        if (dayIndex !== null) {
            const updatedStatus = [...updatedEmployee.dailyStatus];
            updatedStatus[dayIndex] = value;
            updatedEmployee.dailyStatus = updatedStatus;
        } else {
            updatedEmployee[field] = value;
        }

        setNewEmployee(updatedEmployee);
    };

    const handleAddNewEmployee = () => {
        const validationErrors = {};
        const isEmpty = (v) => v === null || v === undefined || v === '';
        if (!newEmployee.name.trim()) {
            validationErrors.name = 'Name is required';
        }
        if (!newEmployee.department) {
            validationErrors.department = 'Department is required';
        }
        if (isEmpty(newEmployee.shiftStartHour) || isEmpty(newEmployee.shiftEndHour)) {
            validationErrors.shiftHours = 'Shift hours are required';
        }
        if (!isEmpty(newEmployee.shiftStartHour) && (parseInt(newEmployee.shiftStartHour, 10) < 0 || parseInt(newEmployee.shiftStartHour, 10) > 23)) {
            validationErrors.shiftStartHour = 'Start hour must be between 0-23';
        }
        if (!isEmpty(newEmployee.shiftEndHour) && (parseInt(newEmployee.shiftEndHour, 10) < 0 || parseInt(newEmployee.shiftEndHour, 10) > 23)) {
            validationErrors.shiftEndHour = 'End hour must be between 0-23';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const updatedWeeks = [...editedWeeks];
        const currentDate = new Date();

        updatedWeeks.forEach((week, weekIndex) => {
            const weekStartDate = new Date(week.startDate);

            const isSuperAdmin = bulkEditRoster?.data?.userPermissions?.accountType === 'superAdmin';
            const isCurrentOrFuture = weekStartDate >= currentDate ||
                (weekStartDate <= currentDate && new Date(week.endDate) >= currentDate);

            if (isSuperAdmin || isCurrentOrFuture) {
                const employeeExists = week.employees.some(emp => emp.name === newEmployee.name);

                if (!employeeExists) {
                    const dailyStatus = [];
                    const startDate = new Date(week.startDate);
                    const endDate = new Date(week.endDate);
                    const currentDate = new Date(startDate);

                    while (currentDate <= endDate) {
                        const dayIndex = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
                        const status = newEmployee.dailyStatus[dayIndex % 7] || 'P';

                        dailyStatus.push({
                            date: new Date(currentDate),
                            status: status
                        });

                        currentDate.setDate(currentDate.getDate() + 1);
                    }

                    updatedWeeks[weekIndex].employees.push({
                        _id: `new-${Date.now()}-${weekIndex}`,
                        userId: null,
                        name: newEmployee.name,
                        department: newEmployee.department,
                        transport: newEmployee.transport || '',
                        cabRoute: newEmployee.cabRoute || '',
                        teamLeader: newEmployee.teamLeader || '',
                        shiftStartHour: parseInt(newEmployee.shiftStartHour),
                        shiftEndHour: parseInt(newEmployee.shiftEndHour),
                        dailyStatus: dailyStatus
                    });
                }
            }
        });

        // Update employeesByDepartment for all weeks
        updatedWeeks.forEach(week => {
            week.employeesByDepartment = week.employees.reduce((acc, emp) => {
                const dept = emp.department || 'General';
                if (!acc[dept]) acc[dept] = [];
                acc[dept].push(emp);
                return acc;
            }, {});
        });

        setEditedWeeks(updatedWeeks);
        setShowAddEmployeeForm(false);
        setNewEmployee({
            name: '',
            department: '',
            transport: '',
            cabRoute: '',
            teamLeader: '',
            shiftStartHour: '',
            shiftEndHour: '',
            dailyStatus: Array(7).fill('P')
        });
        setErrors({});
    };

    const handleRemoveEmployee = (weekIndex, employeeId) => {
        const updatedWeeks = [...editedWeeks];
        updatedWeeks[weekIndex].employees = updatedWeeks[weekIndex].employees.filter(
            emp => emp._id !== employeeId
        );

        // Update employeesByDepartment after removal
        const week = updatedWeeks[weekIndex];
        week.employeesByDepartment = week.employees.reduce((acc, emp) => {
            const dept = emp.department || 'General';
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(emp);
            return acc;
        }, {});

        setEditedWeeks(updatedWeeks);
    };

    const handleSaveAll = () => {
        if (!selectedRosterId) return;
        const weeksData = editedWeeks.map(week => ({
            weekNumber: week.weekNumber,
            employees: week.employees.map(emp => ({
                _id: emp._id,
                userId: emp.userId,
                name: emp.name,
                department: emp.department,
                transport: emp.transport,
                cabRoute: emp.cabRoute,
                teamLeader: emp.teamLeader || '',
                shiftStartHour: emp.shiftStartHour,
                shiftEndHour: emp.shiftEndHour,
                dailyStatus: emp.dailyStatus.map(status => ({
                    date: status.date,
                    status: status.status
                }))
            }))
        }));

        dispatch(bulkUpdateRosterWeeks({
            rosterId: selectedRosterId,
            data: { weeks: weeksData }
        }));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'P': return '✅';
            case 'WO': return '🗓️';
            case 'L': return '❌';
            case 'NCNS': return '🚫';
            case 'UL': return '💸';
            case 'LWP': return '💰';
            case 'BL': return '⚫';
            case 'H': return '🎉';
            case 'HD': return '🌓';
            case 'LWD': return '📅';
            default: return '📝';
        }
    };

    const isLikelyDateString = (value) => {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        if (!trimmed) return false;
        return (
            /^\d{4}-\d{2}-\d{2}([T\s]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed) ||
            /^\d{4}\/\d{2}\/\d{2}/.test(trimmed)
        );
    };

    const formatSimpleDate = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date for display in daily status - using roster start date correctly
    const formatDateFromRoster = (dateString, dayIndex) => {
        try {
            // If we have a roster week, calculate date from start date + dayIndex
            if (selectedEmployee?.weekStartDate) {
                const startDate = new Date(selectedEmployee.weekStartDate);
                // Create date by adding days to start date
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + dayIndex);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }

            // Fallback to the original date if no roster week
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // FIXED: Format history value with proper date connection to roster
    const formatHistoryValue = (value, weekStartDate) => {
        if (value === null || value === undefined || value === '') return '-';

        // Handle date objects and date strings
        if (value instanceof Date) return formatSimpleDate(value);

        // Handle array of daily status objects - use roster dates for display
        if (Array.isArray(value) && value.length > 0 && value[0]?.date && value[0]?.status) {
            return value.map((item, index) => {
                // Use the roster start date + index for display
                if (weekStartDate) {
                    const startDate = new Date(weekStartDate);
                    // Create date by adding days to start date
                    const displayDate = new Date(startDate);
                    displayDate.setDate(startDate.getDate() + index);

                    const formattedDate = displayDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    return `${formattedDate}: ${item.status}`;
                }

                // Fallback to original date
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                return `${formattedDate}: ${item.status}`;
            }).join(', ');
        }

        // Handle single date string
        if (typeof value === 'string' && isLikelyDateString(value)) {
            const formattedDate = formatSimpleDate(value);
            if (formattedDate) return formattedDate;
        }

        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') {
            // Check if it's a daily status object
            if (value.date && value.status) {
                // Try to use weekStartDate if available
                if (weekStartDate) {
                    // For single daily status object, just return the status
                    // The field name will indicate which day it is
                    return `${value.status}`;
                }

                const date = new Date(value.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                return `${formattedDate}: ${value.status}`;
            }
            return JSON.stringify(value);
        }
        return String(value);
    };

    // FIXED: Extract change rows with proper handling of daily status
    const extractChangeRows = (changes) => {
        const rows = [];
        const pushRow = (field, oldValue, newValue) => {
            rows.push({
                field: formatFieldLabel(field),
                oldValue: formatHistoryValue(oldValue, selectedEmployee?.weekStartDate),
                newValue: formatHistoryValue(newValue, selectedEmployee?.weekStartDate)
            });
        };

        if (!changes) return rows;

        if (
            typeof changes === 'object' &&
            !Array.isArray(changes) &&
            changes.before &&
            changes.after &&
            typeof changes.before === 'object' &&
            typeof changes.after === 'object'
        ) {
            // Handle daily status array specially to preserve day indices
            if (changes.before.dailyStatus && changes.after.dailyStatus) {
                const beforeStatuses = changes.before.dailyStatus;
                const afterStatuses = changes.after.dailyStatus;

                // Compare each day's status
                beforeStatuses.forEach((beforeItem, index) => {
                    const afterItem = afterStatuses[index];
                    if (beforeItem.status !== afterItem.status) {
                        pushRow(
                            `dailyStatus[${index}]`,
                            beforeItem,
                            afterItem
                        );
                    }
                });

                // Handle other fields
                Object.keys(changes.after).forEach(key => {
                    if (key !== 'dailyStatus' && changes.before[key] !== changes.after[key]) {
                        pushRow(key, changes.before[key], changes.after[key]);
                    }
                });
            } else {
                const beforeMap = flattenObjectPaths(changes.before);
                const afterMap = flattenObjectPaths(changes.after);
                const allKeys = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);
                allKeys.forEach((key) => {
                    if (beforeMap[key] !== afterMap[key]) {
                        pushRow(key, beforeMap[key], afterMap[key]);
                    }
                });
            }
            return rows;
        }

        const parseEntry = (entry, parentKey = '') => {
            if (entry === null || entry === undefined) return;

            if (Array.isArray(entry)) {
                entry.forEach((item, index) => parseEntry(item, `${parentKey}[${index}]`));
                return;
            }

            if (typeof entry !== 'object') {
                if (parentKey) pushRow(parentKey, '-', entry);
                return;
            }

            const field = entry.field || entry.key || parentKey;
            const oldValue = entry.oldValue ?? entry.old ?? entry.previous ?? entry.from;
            const newValue = entry.newValue ?? entry.new ?? entry.current ?? entry.to;

            if (field && (oldValue !== undefined || newValue !== undefined)) {
                pushRow(field, oldValue, newValue);
                return;
            }

            Object.entries(entry).forEach(([key, value]) => {
                const nestedKey = parentKey ? `${parentKey}.${key}` : key;
                parseEntry(value, nestedKey);
            });
        };

        parseEntry(changes);
        return rows;
    };

    const splitPathSafely = (path) => {
        if (!path) return [];
        const parts = [];
        let current = '';
        let parenDepth = 0;
        let bracketDepth = 0;

        for (let i = 0; i < path.length; i += 1) {
            const ch = path[i];
            if (ch === '(') parenDepth += 1;
            if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
            if (ch === '[') bracketDepth += 1;
            if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

            if (ch === '.' && parenDepth === 0 && bracketDepth === 0) {
                if (current) parts.push(current);
                current = '';
                continue;
            }

            current += ch;
        }

        if (current) parts.push(current);
        return parts;
    };

    const formatFieldToken = (token) => {
        if (!token) return '';
        const trimmed = token.trim();
        const dateMatch = trimmed.match(/\(([^)]+)\)/);
        const rawDate = dateMatch?.[1]?.trim();
        const formattedDate = rawDate ? formatSimpleDate(rawDate) : null;

        const baseLabel = trimmed
            .replace(/\([^)]+\)/g, '')
            .replace(/\[(\d+)\]/g, ' $1')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^./, (c) => c.toUpperCase());

        if (formattedDate) {
            return `${baseLabel} (${formattedDate})`;
        }

        return baseLabel || trimmed;
    };

    const formatFieldLabel = (fieldPath) => {
        if (!fieldPath) return 'Field';
        const normalized = splitPathSafely(fieldPath)
            .filter(Boolean)
            .map((part) => {
                const arrayIndexMatch = part.match(/^\[(\d+)\]$/);
                if (arrayIndexMatch) return `Day ${Number(arrayIndexMatch[1]) + 1}`;
                if (/^\d+$/.test(part)) return `Day ${Number(part) + 1}`;
                return formatFieldToken(part);
            });
        return normalized.join(' > ');
    };

    const flattenObjectPaths = (obj, prefix = '') => {
        if (obj === null || obj === undefined) return {};
        if (typeof obj !== 'object') return { [prefix]: obj };

        const entries = {};
        Object.entries(obj).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(entries, flattenObjectPaths(value, path));
            } else {
                entries[path] = value;
            }
        });
        return entries;
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (bulkEditLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading roster data...</p>
                </div>
            </div>
        );
    }

    if (bulkEditError) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center p-8">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
                    <p className="text-gray-600 mb-4">{bulkEditError}</p>
                    <button
                        onClick={onClose}
                        className="bg-emerald-600 text-white px-4 py-2 rounded"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    if (!bulkEditRoster?.data) {
        return null;
    }

    const { userPermissions } = bulkEditRoster.data;
    const currentDate = new Date();
    const activeWeek = editedWeeks?.[activeTab];
    const activeWeekNumber = activeWeek?.weekNumber;
    const activeEmployees = activeWeek?.employees || [];
    const activeFilteredEmployees = activeWeekNumber != null
        ? getFilteredEmployees(activeWeekNumber, activeEmployees)
        : activeEmployees;
    const activeTotalPages = Math.max(1, Math.ceil(activeFilteredEmployees.length / itemsPerPage));

    return (
        <div className="fixed inset-0 md:left-[280px] bg-gradient-to-br from-slate-50 via-emerald-50 to-lime-50 flex flex-col z-50 [&_button]:cursor-pointer [&_select]:cursor-pointer">
            <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="px-4 py-2 md:px-5 md:py-2 border-b border-slate-200 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Roster Workspace</p>
                    <button
                        type="button"
                        onClick={() => setIsWorkspaceHeaderCollapsed((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold"
                        title={isWorkspaceHeaderCollapsed ? "Expand filters and summary" : "Collapse filters and summary"}
                    >
                        {isWorkspaceHeaderCollapsed ? (
                            <>
                                <FiChevronDown className="w-3 h-3" />
                                Expand
                            </>
                        ) : (
                            <>
                                <FiChevronUp className="w-3 h-3" />
                                Collapse
                            </>
                        )}
                    </button>
                </div>
                {!isWorkspaceHeaderCollapsed && (
                <div className="px-4 py-3 md:px-5 md:py-3 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
                    <div>
                        <p className="text-slate-600 mt-1 text-sm">
                            Edit all weeks at once with clear day-wise attendance updates.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-semibold">{editedWeeks.length} week(s)</span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-semibold">{editedWeeks.reduce((sum, week) => sum + week.employees.length, 0)} employees</span>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 font-semibold">SuperAdmin: Edit All Weeks</span>
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 font-semibold">HR: Edit All Weeks</span>
                        </div>
                    </div>

                    <div className="w-full lg:w-[560px]">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <label className="text-xs uppercase tracking-[0.08em] text-slate-500 font-semibold whitespace-nowrap">
                                    Month
                                </label>
                                <select
                                    value={selectedRosterId || ''}
                                    onChange={(e) => setSelectedRosterId(e.target.value)}
                                    disabled={bulkEditLoading || allRostersList.length === 0}
                                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
                                    title="Select roster month"
                                >
                                    {allRostersList.length === 0 ? (
                                        <option value="">No rosters found</option>
                                    ) : (
                                        allRostersList.map((roster) => (
                                            <option key={roster._id} value={roster._id}>
                                                {formatRosterMonthYear(roster.month, roster.year)}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="flex gap-2">
                            <select
                                value={searchBy}
                                onChange={(e) => setSearchBy(e.target.value)}
                                className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                title="Search by"
                            >
                                <option value="all">All</option>
                                <option value="name">Name</option>
                                <option value="department">Department</option>
                                <option value="teamLeader">Team Leader</option>
                            </select>
                            <div className="flex-1 relative">
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Type to search..."
                                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                />
                                {searchInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchInput('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 font-semibold"
                                    >
                                        Clear
                                    </button>
                                ) : null}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                <div className="border-t border-slate-200 bg-slate-50/80">
                    <div className="flex overflow-x-auto px-3 py-2 gap-2">
                        {editedWeeks.map((week, index) => {
                            const weekEndDate = new Date(week.endDate);
                            const weekStartDate = new Date(week.startDate);
                            const hasWeekEnded = weekEndDate < currentDate;
                            const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;

                            let timelineStatus = 'upcoming';
                            if (hasWeekEnded) timelineStatus = 'past';
                            else if (isCurrentWeek) timelineStatus = 'current';

                            const isEditable = userPermissions?.accountType === 'superAdmin' ||
                                userPermissions?.accountType === 'HR';

                            return (
                                <button
                                    key={week.weekNumber}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-3 py-2 rounded-xl border font-medium whitespace-nowrap flex items-center transition-colors ${activeTab === index
                                        ? 'border-emerald-300 text-emerald-800 bg-emerald-100 shadow-sm'
                                        : hasWeekEnded
                                            ? 'border-amber-200 text-amber-800 bg-amber-50'
                                            : 'border-slate-200 text-slate-700 bg-white'
                                        } ${!isEditable ? 'cursor-not-allowed opacity-60' : ''}`}
                                    title={!isEditable ? 'You do not have edit access for this week.' : ''}
                                >
                                    <span className="mr-2 text-sm">
                                        {timelineStatus === 'past' && '📅'}
                                        {timelineStatus === 'current' && '📌'}
                                        {timelineStatus === 'upcoming' && '📋'}
                                    </span>

                                    <div className="flex flex-col items-start">
                                        <span>Week {week.weekNumber}</span>
                                        <span className="text-[11px] text-slate-500">
                                            {new Date(week.startDate).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>

                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                        {week.employeeCount} total
                                    </span>

                                    {hasWeekEnded && (
                                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                            Past Week
                                        </span>
                                    )}
                                    {!isEditable && (
                                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                                            Read Only
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4">
                {editedWeeks.length > 0 && (
                    <>
                        <div className="mb-4 bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                                        Week {editedWeeks[activeTab].weekNumber}
                                    </h3>
                                    <p className="text-slate-600 text-xs md:text-sm">
                                        {new Date(editedWeeks[activeTab].startDate).toLocaleDateString(undefined, { timeZone: 'Asia/Kolkata' })} -
                                        {new Date(editedWeeks[activeTab].endDate).toLocaleDateString(undefined, { timeZone: 'Asia/Kolkata' })}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
                                    <div className="text-xs md:text-sm text-slate-600 font-semibold">
                                        {activeFilteredEmployees.length} employees
                                        {appliedSearch ? ` (filtered from ${activeEmployees.length})` : ''}
                                    </div>
                                    <button
                                        onClick={() => setShowSnapshotExportModal(true)}
                                        disabled={isGeneratingSnapshot}
                                        className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                                        title="Select fields and download snapshot for selected week"
                                    >
                                        {isGeneratingSnapshot ? 'Generating...' : 'Share Snapshot'}
                                    </button>
                                    <button
                                        onClick={() => setShowAddEmployeeForm(true)}
                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm"
                                    >
                                        + Add Employee
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 text-sm font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={bulkSaveLoading}
                                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                    >
                                        {bulkSaveLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save All Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showAddEmployeeForm && (
                            <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-slate-900 text-lg">Add New Employee</h3>
                                    <button
                                        onClick={() => setShowAddEmployeeForm(false)}
                                        className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 "
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Employee Name *"
                                            value={newEmployee.name}
                                            onChange={(e) => handleNewEmployeeChange('name', e.target.value)}
                                            className={`w-full border p-3 rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <select
                                            value={newEmployee.department}
                                            onChange={(e) => handleNewEmployeeChange('department', e.target.value)}
                                            className={`w-full border p-3 rounded ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Department *</option>
                                            {availableDepartments.map((dept, index) => (
                                                <option key={index} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                        {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                                    </div>

                                    <select
                                        value={newEmployee.transport}
                                        onChange={(e) => handleNewEmployeeChange('transport', e.target.value)}
                                        className="w-full border border-gray-300 p-3 rounded"
                                    >
                                        <option value="">Transport?</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="CAB Route"
                                        value={newEmployee.cabRoute}
                                        onChange={(e) => handleNewEmployeeChange('cabRoute', e.target.value)}
                                        className="w-full border border-gray-300 p-3 rounded"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Team Leader (Optional)"
                                        value={newEmployee.teamLeader}
                                        onChange={(e) => handleNewEmployeeChange('teamLeader', e.target.value)}
                                        className="w-full border border-gray-300 p-3 rounded"
                                    />

                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Shift Start Hour (0-23) *"
                                            value={newEmployee.shiftStartHour}
                                            onChange={(e) => handleNewEmployeeChange('shiftStartHour', e.target.value)}
                                            min="0"
                                            max="23"
                                            className={`w-full border p-3 rounded ${errors.shiftStartHour ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.shiftStartHour && <p className="text-red-500 text-sm mt-1">{errors.shiftStartHour}</p>}
                                    </div>

                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Shift End Hour (0-23) *"
                                            value={newEmployee.shiftEndHour}
                                            onChange={(e) => handleNewEmployeeChange('shiftEndHour', e.target.value)}
                                            min="0"
                                            max="23"
                                            className={`w-full border p-3 rounded ${errors.shiftEndHour ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.shiftEndHour && <p className="text-red-500 text-sm mt-1">{errors.shiftEndHour}</p>}
                                    </div>

                                    <button
                                        onClick={handleAddNewEmployee}
                                        className="w-full bg-green-600 text-white p-3 rounded font-medium"
                                    >
                                        Add to Current & Future Weeks
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-700 mb-3">Default Weekly Status Pattern</h4>
                                    <div className="grid grid-cols-7 gap-2">
                                        {daysOfWeek.map((day, index) => (
                                            <div key={index} className="flex flex-col items-center">
                                                <span className="text-sm font-medium text-gray-700 mb-1">{day}</span>
                                                <select
                                                    value={newEmployee.dailyStatus[index]}
                                                    onChange={(e) => handleNewEmployeeChange('dailyStatus', e.target.value, index)}
                                                    className="w-full border border-gray-300 p-2 rounded text-center"
                                                >
                                                    <option value="P">P</option>
                                                    <option value="WO">WO</option>
                                                    <option value="L">L</option>
                                                    <option value="NCNS">NCNS</option>
                                                    <option value="UL">UL</option>
                                                    <option value="LWP">LWP</option>
                                                    <option value="BL">BL</option>
                                                    <option value="H">H</option>
                                                    <option value="HD">HD</option>
                                                    <option value="LWD">LWD</option>
                                                </select>
                                                <div className="mt-1 text-lg">
                                                    {getStatusIcon(newEmployee.dailyStatus[index])}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pro-table-shell overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm font-semibold text-slate-800">Employee Roster Grid</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowColumnMenu((v) => !v)}
                                        className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-700  text-xs"
                                    >
                                        Columns
                                    </button>
                                    {showColumnMenu && (
                                        <div className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
                                            {[
                                                { key: 'name', label: 'Name' },
                                                { key: 'department', label: 'Department' },
                                                { key: 'transport', label: 'Transport' },
                                                { key: 'cabRoute', label: 'CAB Route' },
                                                { key: 'teamLeader', label: 'Team Leader' },
                                                { key: 'shiftHours', label: 'Shift Hours' },
                                                { key: 'dailyStatus', label: 'Daily Status' },
                                                { key: 'actions', label: 'Actions' },
                                            ].map((col) => (
                                                <label key={col.key} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(columnVisibility[col.key])}
                                                        onChange={(e) =>
                                                            setColumnVisibility((prev) => ({
                                                                ...prev,
                                                                [col.key]: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    {col.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    <span className="px-2 py-1 rounded border border-green-200 bg-green-50 text-green-700">P Present</span>
                                    <span className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">WO Week Off</span>
                                    <span className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700">L Leave</span>
                                    <span className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700">HD Half Day</span>
                                    <span className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600">Other codes available in dropdown</span>
                                </div>
                            </div>

                            <div className="pro-scroll overflow-x-auto">
                                <table className="pro-table w-full">
                                    <thead>
                                        <tr>
                                            {visibleColumns.name && (
                                                <th
                                                    className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[180px] sticky left-0 z-30 bg-[#eef9f1]"
                                                    style={{ left: 0 }}
                                                >
                                                    Name
                                                </th>
                                            )}
                                            {visibleColumns.department && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[120px]">Department</th>}
                                            {visibleColumns.transport && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[110px]">Transport</th>}
                                            {visibleColumns.cabRoute && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">CAB Route</th>}
                                            {visibleColumns.teamLeader && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Team Leader</th>}
                                            {visibleColumns.shiftHours && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Shift Hours</th>}
                                            {visibleColumns.dailyStatus && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[360px]">Daily Status</th>}
                                            {visibleColumns.actions && <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[90px]">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {getCurrentPageEmployees(activeWeekNumber, activeEmployees).map((employee, empIndex) => {
                                            const weekStartDate = new Date(editedWeeks[activeTab].startDate);
                                            const weekEndDate = new Date(editedWeeks[activeTab].endDate);
                                            const daysInWeek = Math.ceil((weekEndDate - weekStartDate) / (1000 * 60 * 60 * 24)) + 1;
                                            const originalIndex = editedWeeks[activeTab].employees.findIndex(emp => emp._id === employee._id);

                                            return (
                                                <tr key={employee._id} className="pro-row border-b border-slate-100">
                                                    {visibleColumns.name && (
                                                        <td
                                                            className="p-2 sticky left-0 z-20 bg-white"
                                                            style={{ left: 0, minWidth: "180px" }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={employee.name}
                                                                onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'name', e.target.value)}
                                                                className="w-full border border-gray-300 p-1 rounded text-sm"
                                                            />
                                                        </td>
                                                    )}

                                                    {visibleColumns.department && <td className="p-2">
                                                        <select
                                                            value={employee.department || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'department', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        >
                                                            <option value="">Select</option>
                                                            {availableDepartments.map((dept, idx) => (
                                                                <option key={idx} value={dept}>{dept}</option>
                                                            ))}
                                                        </select>
                                                    </td>}

                                                    {visibleColumns.transport && <td className="p-2">
                                                        <select
                                                            value={employee.transport || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'transport', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </td>}

                                                    {visibleColumns.cabRoute && <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={employee.cabRoute || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'cabRoute', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        />
                                                    </td>}

                                                    {visibleColumns.teamLeader && <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={employee.teamLeader || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'teamLeader', e.target.value)}
                                                            placeholder="Team Leader"
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        />
                                                    </td>}

                                                    {visibleColumns.shiftHours && <td className="p-2">
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="number"
                                                                value={employee.shiftStartHour}
                                                                onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'shiftStartHour', e.target.value)}
                                                                min="0"
                                                                max="23"
                                                                className="w-full border border-gray-300 p-1 rounded text-center text-sm"
                                                            />
                                                            <span className="self-center text-xs">to</span>
                                                            <input
                                                                type="number"
                                                                value={employee.shiftEndHour}
                                                                onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, 'shiftEndHour', e.target.value)}
                                                                min="0"
                                                                max="23"
                                                                className="w-full border border-gray-300 p-1 rounded text-center text-sm"
                                                            />
                                                        </div>
                                                    </td>}

		                                                    {visibleColumns.dailyStatus && <td className="p-2">
		                                                        <div className="flex gap-1 justify-center min-w-max">
		                                                            {employee.dailyStatus.slice(0, daysInWeek).map((status, dayIndex) => {
                                                                const statusDate = status?.date ? new Date(status.date) : null;
	                                                                const dayDate = statusDate && !Number.isNaN(statusDate.getTime())
                                                                    ? statusDate
                                                                    : (() => {
                                                                        const fallback = new Date(weekStartDate);
                                                                        fallback.setDate(weekStartDate.getDate() + dayIndex);
                                                                        return fallback;
                                                                    })();
	                                                                const dayName = dayDate.toLocaleDateString('en-US', {
                                                                    timeZone: 'Asia/Kolkata',
                                                                    weekday: 'short'
                                                                });
	                                                                const dayDateLabel = dayDate.toLocaleDateString('en-US', {
                                                                    timeZone: 'Asia/Kolkata',
	                                                                    day: '2-digit',
	                                                                    month: 'short'
	                                                                });
	                                                                const fullDateLabel = dayDate.toLocaleDateString('en-US', {
                                                                    timeZone: 'Asia/Kolkata',
	                                                                    weekday: 'long',
	                                                                    day: 'numeric',
	                                                                    month: 'long',
	                                                                    year: 'numeric'
	                                                                });

	                                                                return (
	                                                                    <div key={dayIndex} className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1">
	                                                                        <span className="text-[10px] font-medium text-gray-700 leading-tight">{dayName}</span>
	                                                                        <span className="text-[10px] text-gray-500 mb-0.5 leading-tight">{dayDateLabel}</span>
                                                                        {(() => {
                                                                            const dayKey = getIstDateKey(dayDate);
                                                                            const todayKey = getIstDateKey(new Date());
                                                                            const isPastDayLocked = isEmployeeRosterEditor() && Boolean(dayKey && todayKey && dayKey < todayKey);
                                                                            return (
	                                                                        <select
	                                                                            value={status.status}
	                                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, originalIndex, `dailyStatus[${dayIndex}]`, e.target.value)}
	                                                                            title={`${fullDateLabel} - ${status.status}`}
                                                                                disabled={isPastDayLocked}
	                                                                            className={`w-8 h-8 border rounded text-center text-xs ${isPastDayLocked ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-300' : ''} ${status.status === 'P' ? 'border-green-300 bg-green-50' :
	                                                                                status.status === 'WO' ? 'border-emerald-300 bg-emerald-50' :
	                                                                                    status.status === 'L' ? 'border-red-300 bg-red-50' :
	                                                                                        status.status === 'HD' ? 'border-amber-400 bg-amber-100' :
	                                                                                            status.status === 'LWD' ? 'border-yellow-400 bg-yellow-100' :
	                                                                                                'border-gray-300 bg-gray-50'
	                                                                                }`}
	                                                                        >
                                                                            <option value="P">P</option>
                                                                            <option value="WO">WO</option>
                                                                            <option value="L">L</option>
                                                                            <option value="NCNS">NCNS</option>
                                                                            <option value="UL">UL</option>
                                                                            <option value="LWP">LWP</option>
                                                                            <option value="BL">BL</option>
                                                                            <option value="H">H</option>
	                                                                            <option value="HD">HD</option>
	                                                                            <option value="LWD">LWD</option>
	                                                                        </select>
                                                                            );
                                                                        })()}
	                                                                        <span className="text-xs mt-0.5">{getStatusIcon(status.status)}</span>
	                                                                    </div>
		                                                                );
	                                                            })}
	                                                        </div>
	                                                    </td>}

                                                    {visibleColumns.actions && <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleViewHistory(employee)}
                                                                className="p-2 text-slate-700 rounded-md"
                                                                title="View Edit History"
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleRemoveEmployee(activeTab, employee._id)}
                                                                className="p-2 text-slate-600  rounded-md transition-colors"
                                                                title="Remove Employee"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {activeFilteredEmployees.length > itemsPerPage && (
                                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activeFilteredEmployees.length)} of {activeFilteredEmployees.length} employees
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiChevronLeft />
                                        </button>
                                        <span className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                            Page {currentPage} of {activeTotalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(activeTotalPages, prev + 1))}
                                            disabled={currentPage === activeTotalPages}
                                            className="p-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiChevronRight />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeFilteredEmployees.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    {appliedSearch ? (
                                        <>No employees match <span className="font-semibold">{appliedSearch}</span>.</>
                                    ) : (
                                        'No employees in this week. Click "Add Employee" to add employees.'
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-slate-600 font-medium">
                            Editing: Week {activeTab + 1} of {editedWeeks.length}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                            disabled={activeTab === 0}
                            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous Week
                        </button>
                        <button
                            onClick={() => setActiveTab(prev => Math.min(editedWeeks.length - 1, prev + 1))}
                            disabled={activeTab === editedWeeks.length - 1}
                            className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Week
                        </button>
                    </div>
                </div>
            </div>

            {showSnapshotExportModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="px-5 py-4 border-b border-slate-200">
                            <h4 className="text-base font-semibold text-slate-900">Select Fields For Snapshot</h4>
                            <p className="text-xs text-slate-600 mt-1">
                                Week {activeWeek?.weekNumber ?? '-'} | Only selected fields will be exported.
                            </p>
                        </div>
                        <div className="px-5 py-4 space-y-2">
                            {snapshotColumnOptions.map((col) => (
                                <label key={col.key} className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(snapshotColumnVisibility[col.key])}
                                        onChange={(e) =>
                                            setSnapshotColumnVisibility((prev) => ({
                                                ...prev,
                                                [col.key]: e.target.checked,
                                            }))
                                        }
                                    />
                                    {col.label}
                                </label>
                            ))}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowSnapshotExportModal(false)}
                                disabled={isGeneratingSnapshot}
                                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700  text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadSnapshot}
                                disabled={isGeneratingSnapshot}
                                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isGeneratingSnapshot ? 'Generating...' : 'Export Image'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                ref={exportCaptureRef}
                style={{
                    position: "fixed",
                    left: "-10000px",
                    top: 0,
                    width: `${exportCanvasWidth}px`,
                    background: "#ffffff",
                    padding: "20px",
                    color: "#0f172a",
                    zIndex: -1,
                }}
            >
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "#ffffff" }}>
                    <div style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", color: "#ffffff", padding: "14px 16px" }}>
                        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
                            Roster Snapshot - Week {activeWeek?.weekNumber ?? "-"}
                        </h2>
                        <p style={{ margin: "8px 0 0", fontSize: "16px", opacity: 0.95 }}>
                            {activeWeek?.startDate ? new Date(activeWeek.startDate).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }) : "-"} - {activeWeek?.endDate ? new Date(activeWeek.endDate).toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" }) : "-"}
                        </p>
                    </div>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "14px", color: "#334155" }}>
                        Employees: {activeFilteredEmployees.length}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                            <thead>
                                <tr>
                                    {exportVisibleColumns.name && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Name</th>}
                                    {exportVisibleColumns.department && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Department</th>}
                                    {exportVisibleColumns.transport && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Transport</th>}
                                    {exportVisibleColumns.cabRoute && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>CAB Route</th>}
                                    {exportVisibleColumns.teamLeader && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Team Leader</th>}
                                    {exportVisibleColumns.shiftHours && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Shift</th>}
                                    {exportVisibleColumns.dailyStatus && <th style={{ textAlign: "left", padding: "12px", fontSize: "15px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>Daily Status</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {activeFilteredEmployees.map((employee, empIndex) => (
                                    <tr key={employee?._id || `export-${empIndex}`} style={{ background: empIndex % 2 === 0 ? "#ffffff" : "#fcfcff" }}>
                                        {exportVisibleColumns.name && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px", fontWeight: 600 }}>{employee?.name || "-"}</td>}
                                        {exportVisibleColumns.department && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px" }}>{employee?.department || "-"}</td>}
                                        {exportVisibleColumns.transport && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px" }}>{employee?.transport || "-"}</td>}
                                        {exportVisibleColumns.cabRoute && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px" }}>{employee?.cabRoute || "-"}</td>}
                                        {exportVisibleColumns.teamLeader && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px" }}>{employee?.teamLeader || "-"}</td>}
                                        {exportVisibleColumns.shiftHours && <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "15px" }}>{`${employee?.shiftStartHour ?? "-"} to ${employee?.shiftEndHour ?? "-"}`}</td>}
                                        {exportVisibleColumns.dailyStatus && (
                                            <td style={{ padding: "12px", borderBottom: "1px solid #f1f5f9", fontSize: "14px" }}>
                                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                    {(employee?.dailyStatus || []).slice(0, 7).map((statusItem, idx) => {
                                                        const statusCode = statusItem?.status || "P";
                                                        const style = getStatusInlineStyle(statusCode);
                                                        const dayMeta = getSnapshotDayMeta(statusItem, idx);
                                                        return (
                                                            <div
                                                                key={`${employee?._id || empIndex}-${idx}`}
                                                                style={{
                                                                    minWidth: "90px",
                                                                    border: "1px solid #e2e8f0",
                                                                    borderRadius: "8px",
                                                                    background: "#f8fafc",
                                                                    padding: "6px 8px",
                                                                    display: "flex",
                                                                    flexDirection: "column",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                }}
                                                            >
                                                                <div style={{ textAlign: "center", lineHeight: 1.1 }}>
                                                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#334155" }}>{dayMeta.dayName}</div>
                                                                    <div style={{ fontSize: "13px", color: "#64748b" }}>{dayMeta.dayDateLabel}</div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        
                                                                        border: `1px solid ${style.borderColor}`,
                                                                        borderRadius: "999px",
                                                                        backgroundColor: style.backgroundColor,
                                                                        color: style.color,
                                                                        fontSize: "13px",
                                                                        fontWeight: 700,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        marginTop: "6px",
                                                                        padding: "4px 10px",
                                                                    }}
                                                                >
                                                                    <span>{statusCode}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {bulkSaveSuccess && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-60">
                    <div className="flex items-center">
                        <span className="text-xl mr-2">✅</span>
                        <div>
                            <p className="font-medium">Changes saved successfully!</p>
                            <p className="text-sm opacity-90">All weeks have been updated.</p>
                        </div>
                    </div>
                </div>
            )}

            {bulkSaveError && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-60">
                    <div className="flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        <div>
                            <p className="font-medium">Save failed!</p>
                            <p className="text-sm opacity-90">{bulkSaveError}</p>
                        </div>
                    </div>
                </div>
            )}

            {showHistoryModal && selectedEmployee && (
                <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                                        Employee Audit Trail
                                    </p>
                                    <h2 className="text-xl font-semibold text-white">
                                        Edit History - {selectedEmployee.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="h-9 w-9 rounded-full border border-white/30 text-white  transition-colors text-lg"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(85vh-88px)] p-6 bg-slate-50">
                            {selectedEmployee.logs.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                    <p className="text-lg font-medium text-slate-700">No edit entries found</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        This employee has no recorded changes yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedEmployee.logs.map((log, index) => {
                                        const changeRows = extractChangeRows(log.changes);
                                        return (
                                            <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-semibold">
                                                            Edited By
                                                        </span>
                                                        <span className="font-semibold text-slate-800">
                                                            {log.editedByName || 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm text-slate-500">
                                                        {formatSimpleDate(log.editedAt) || '-'}
                                                    </span>
                                                </div>

                                                <div className="mb-3 flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                                                        {changeRows.length} field(s) changed
                                                    </span>
                                                </div>

                                                {changeRows.length > 0 ? (
                                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-100 text-slate-700">
                                                                <tr>
                                                                    <th className="p-2 text-left font-semibold">What Changed</th>
                                                                    <th className="p-2 text-left font-semibold">Old Value</th>
                                                                    <th className="p-2 text-left font-semibold">New Value</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {changeRows.map((row, rowIndex) => (
                                                                    <tr key={rowIndex} className="border-t border-slate-100">
                                                                        <td className="p-2 text-slate-700">{row.field}</td>
                                                                        <td className="p-2 text-red-700">{row.oldValue}</td>
                                                                        <td className="p-2 text-emerald-700">{row.newValue}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                        Change details are available, but not in a field-wise format.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RosterBulkEditForm;



//Keshav	Developer	Yes	1	Gaurav	18	3	P	P	P	P	P	WO	WO									

