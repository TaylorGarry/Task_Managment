import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { getRosterForBulkEdit, bulkUpdateRosterWeeks, clearBulkEditState, clearBulkSaveState } from '../features/slices/rosterSlice.js';

const RosterBulkEditForm = ({ rosterId, onClose }) => {
    const dispatch = useDispatch();
    const { bulkEditRoster, bulkEditLoading, bulkEditError, bulkSaveLoading, bulkSaveSuccess, bulkSaveError } = useSelector((state) => state.roster);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [activeTab, setActiveTab] = useState(0);
    const [editedWeeks, setEditedWeeks] = useState([]);
    const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        transport: '',
        cabRoute: '',
        teamLeader: '',
        shiftStartHour: '',
        shiftEndHour: '',
        dailyStatus: Array(7).fill('P')
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (rosterId) {
            dispatch(getRosterForBulkEdit(rosterId));
        }
        return () => {
            dispatch(clearBulkEditState());
            dispatch(clearBulkSaveState());
        };
    }, [rosterId, dispatch]);

    useEffect(() => {
        console.log("BULK EDIT ROSTER FULL DATA:::::::<><><><><<><><><><><><>:::", bulkEditRoster);
        if (bulkEditRoster?.data?.weeks) {
            const weeksCopy = JSON.parse(JSON.stringify(bulkEditRoster.data.weeks));
            setEditedWeeks(weeksCopy);
        }
    }, [bulkEditRoster]);

    const handleEmployeeFieldChange = (weekIndex, employeeIndex, field, value) => {
        const updatedWeeks = [...editedWeeks];

        if (field.startsWith('dailyStatus[')) {
            const dayIndex = parseInt(field.match(/\[(\d+)\]/)[1]);
            updatedWeeks[weekIndex].employees[employeeIndex].dailyStatus[dayIndex].status = value;
        } else {
            updatedWeeks[weekIndex].employees[employeeIndex][field] = value;
        }

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

        setSelectedEmployee({
            name: employee.name,
            logs: employeeLogs
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
        if (!newEmployee.name.trim()) {
            validationErrors.name = 'Name is required';
        }
        if (!newEmployee.shiftStartHour || !newEmployee.shiftEndHour) {
            validationErrors.shiftHours = 'Shift hours are required';
        }
        if (parseInt(newEmployee.shiftStartHour) < 0 || parseInt(newEmployee.shiftStartHour) > 23) {
            validationErrors.shiftStartHour = 'Start hour must be between 0-23';
        }
        if (parseInt(newEmployee.shiftEndHour) < 0 || parseInt(newEmployee.shiftEndHour) > 23) {
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

        setEditedWeeks(updatedWeeks);
        setShowAddEmployeeForm(false);
        setNewEmployee({
            name: '',
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
        setEditedWeeks(updatedWeeks);
    };
    const handleSaveAll = () => {
        if (!rosterId) return;
        const weeksData = editedWeeks.map(week => ({
            weekNumber: week.weekNumber,
            employees: week.employees.map(emp => ({
                _id: emp._id,
                userId: emp.userId,
                name: emp.name,
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
            rosterId,
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

    const formatHistoryValue = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        if (value instanceof Date) return formatSimpleDate(value);
        if (isLikelyDateString(value)) {
            const formattedDate = formatSimpleDate(value);
            if (formattedDate) return formattedDate;
        }
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
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
                if (arrayIndexMatch) return `#${Number(arrayIndexMatch[1]) + 1}`;
                if (/^\d+$/.test(part)) return `#${Number(part) + 1}`;
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

    const extractChangeRows = (changes) => {
        const rows = [];
        const pushRow = (field, oldValue, newValue) => {
            rows.push({
                field: formatFieldLabel(field),
                oldValue: formatHistoryValue(oldValue),
                newValue: formatHistoryValue(newValue)
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
            const beforeMap = flattenObjectPaths(changes.before);
            const afterMap = flattenObjectPaths(changes.after);
            const allKeys = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);
            allKeys.forEach((key) => {
                if (beforeMap[key] !== afterMap[key]) {
                    pushRow(key, beforeMap[key], afterMap[key]);
                }
            });
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

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (bulkEditLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
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

    const { weeks, userPermissions } = bulkEditRoster.data;
    const currentDate = new Date();

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col z-50 [&_button]:cursor-pointer [&_select]:cursor-pointer">
            <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:justify-between mt-5 lg:items-start">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Roster Workspace</p>
                        {/* <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bulk Edit Roster</h1> */}
                        <p className="text-slate-600 mt-2">
                            Edit all weeks at once with clear day-wise attendance updates.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{weeks.length} week(s)</span>
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{weeks.reduce((sum, week) => sum + week.employees.length, 0)} employees</span>
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">SuperAdmin: Edit All Weeks</span>
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">HR: Edit Current/Future Only</span>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 bg-slate-50/80">
                    <div className="flex overflow-x-auto px-3 py-3 gap-2">
                        {editedWeeks.map((week, index) => {
                            const weekEndDate = new Date(week.endDate);
                            const weekStartDate = new Date(week.startDate);
                            const hasWeekEnded = weekEndDate < currentDate;
                            const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;

                            let timelineStatus = 'upcoming';
                            if (hasWeekEnded) timelineStatus = 'past';
                            else if (isCurrentWeek) timelineStatus = 'current';

                            const isEditable = userPermissions?.accountType === 'superAdmin' ||
                                (userPermissions?.accountType === 'HR' && !hasWeekEnded);

                            return (
                                <button
                                    key={week.weekNumber}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-4 py-2.5 rounded-xl border font-medium whitespace-nowrap flex items-center transition-colors ${activeTab === index
                                        ? 'border-blue-300 text-blue-800 bg-blue-100 shadow-sm'
                                        : hasWeekEnded
                                            ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
                                            : 'border-slate-200 text-slate-600 bg-white hover:text-slate-800 hover:bg-slate-50'
                                        } ${!isEditable ? 'cursor-not-allowed' : ''}`}
                                    title={!isEditable ? 'Week has ended. Only Super Admin can edit past weeks.' : ''}
                                >
                                    <span className="mr-2 text-sm">
                                        {timelineStatus === 'past' && '📅'}
                                        {timelineStatus === 'current' && '📌'}
                                        {timelineStatus === 'upcoming' && '📋'}
                                    </span>
                                    <div className="flex flex-col items-start">
                                        <span>Week {week.weekNumber}</span>
                                        <span className="text-[11px] text-slate-500">
                                            {new Date(week.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} - {new Date(week.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{week.employees.length} emp</span>
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
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {editedWeeks.length > 0 && (
                    <>
                        <div className="mb-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                                <div>
                                    <h3 className="font-semibold text-slate-900 text-lg">
                                        Week {editedWeeks[activeTab].weekNumber}
                                    </h3>
                                    <p className="text-slate-600 text-sm">
                                        {new Date(editedWeeks[activeTab].startDate).toLocaleDateString()} -
                                        {new Date(editedWeeks[activeTab].endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
                                    <div className="text-sm text-slate-600 font-medium">
                                        {editedWeeks[activeTab].employees.length} employees
                                    </div>
                                    <button
                                        onClick={() => setShowAddEmployeeForm(true)}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-sm"
                                    >
                                        + Add Employee
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={bulkSaveLoading}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed text-sm"
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
                                        className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
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
                                        className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded font-medium"
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
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <p className="text-sm font-semibold text-slate-800">Employee Roster Grid</p>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="px-2 py-1 rounded border border-green-200 bg-green-50 text-green-700">P Present</span>
                                    <span className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700">WO Week Off</span>
                                    <span className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700">L Leave</span>
                                    <span className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-600">Other codes available in dropdown</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-100/90">
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[180px]">Name</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[110px]">Transport</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">CAB Route</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Team Leader</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[150px]">Shift Hours</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[360px]">Daily Status</th>
                                            <th className="p-2 text-left font-semibold text-slate-800 border-b border-slate-200 min-w-[90px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editedWeeks[activeTab].employees.map((employee, empIndex) => {
                                            const weekStartDate = new Date(editedWeeks[activeTab].startDate);
                                            const weekEndDate = new Date(editedWeeks[activeTab].endDate);
                                            const daysInWeek = Math.ceil((weekEndDate - weekStartDate) / (1000 * 60 * 60 * 24)) + 1;

                                            return (
                                                <tr key={employee._id} className="border-b border-slate-100 hover:bg-slate-50/80">
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={employee.name}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'name', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            value={employee.transport || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'transport', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        >
                                                            <option value="">Select</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={employee.cabRoute || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'cabRoute', e.target.value)}
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={employee.teamLeader || ''}
                                                            onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'teamLeader', e.target.value)}
                                                            placeholder="Team Leader"
                                                            className="w-full border border-gray-300 p-1 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="number"
                                                                value={employee.shiftStartHour}
                                                                onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'shiftStartHour', e.target.value)}
                                                                min="0"
                                                                max="23"
                                                                className="w-full border border-gray-300 p-1 rounded text-center text-sm"
                                                            />
                                                            <span className="self-center text-xs">to</span>
                                                            <input
                                                                type="number"
                                                                value={employee.shiftEndHour}
                                                                onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, 'shiftEndHour', e.target.value)}
                                                                min="0"
                                                                max="23"
                                                                className="w-full border border-gray-300 p-1 rounded text-center text-sm"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-1 justify-center min-w-max">
                                    {employee.dailyStatus.slice(0, daysInWeek).map((status, dayIndex) => {
                                        const dayDate = new Date(weekStartDate);
                                        dayDate.setDate(dayDate.getDate() + dayIndex);
                                        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dayDateLabel = dayDate.toLocaleDateString('en-US', {
                                            day: '2-digit',
                                            month: 'short'
                                        });
                                        const fullDateLabel = dayDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        });

                                        return (
                                            <div key={dayIndex} className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1">
                                                <span className="text-[10px] font-medium text-gray-700 leading-tight">{dayName}</span>
                                                <span className="text-[10px] text-gray-500 mb-0.5 leading-tight">{dayDateLabel}</span>
                                                <select
                                                    value={status.status}
                                                    onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, `dailyStatus[${dayIndex}]`, e.target.value)}
                                                    title={`${fullDateLabel} - ${status.status}`}
                                                    className={`w-8 h-8 border rounded text-center text-xs ${status.status === 'P' ? 'border-green-300 bg-green-50' :
                                                        status.status === 'WO' ? 'border-blue-300 bg-blue-50' :
                                                                                    status.status === 'L' ? 'border-red-300 bg-red-50' :
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
                                                                            <option value="LWD">LWD</option>
                                                                        </select>
                                                                        <span className="text-xs mt-0.5">{getStatusIcon(status.status)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            {/* 👁 View History */}
                                                            <button
                                                                onClick={() => handleViewHistory(employee)}
                                                                className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                                title="View Edit History"
                                                                aria-label="View Edit History"
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                            </button>

                                                            {/* Remove Button */}
                                                            <button
                                                                onClick={() => handleRemoveEmployee(activeTab, employee._id)}
                                                                className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                                                                title="Remove Employee"
                                                                aria-label="Remove Employee"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {editedWeeks[activeTab].employees.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No employees in this week. Click "Add Employee" to add employees.
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
                                    className="h-9 w-9 rounded-full border border-white/30 text-white hover:bg-white/15 transition-colors text-lg"
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
                                                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
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
