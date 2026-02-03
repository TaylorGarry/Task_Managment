import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getRosterForBulkEdit, bulkUpdateRosterWeeks, clearBulkEditState, clearBulkSaveState } from '../features/slices/rosterSlice.js';

const RosterBulkEditForm = ({ rosterId, onClose }) => {
    const dispatch = useDispatch();
    const { bulkEditRoster, bulkEditLoading, bulkEditError, bulkSaveLoading, bulkSaveSuccess, bulkSaveError } = useSelector((state) => state.roster);

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
        <div className="fixed inset-0 bg-white flex flex-col z-50">
            <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
                <div className="p-4 md:p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Bulk Edit Roster</h1>
                        <p className="text-gray-600 mt-8">
                            Edit all weeks at once | {weeks.length} week(s) | {weeks.reduce((sum, week) => sum + week.employees.length, 0)} total employees
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">SuperAdmin: Edit All Weeks</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">HR: Edit Current/Future Only</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={bulkSaveLoading}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium flex items-center"
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
                <div className="border-t">
                    <div className="flex overflow-x-auto">
                        {editedWeeks.map((week, index) => {
                            const weekEndDate = new Date(week.endDate);
                            const weekStartDate = new Date(week.startDate);
                            const hasWeekEnded = weekEndDate < currentDate;
                            const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;
                            const isUpcomingWeek = weekStartDate > currentDate;

                            let timelineStatus = 'upcoming';
                            if (hasWeekEnded) timelineStatus = 'past';
                            else if (isCurrentWeek) timelineStatus = 'current';

                            const isEditable = userPermissions?.accountType === 'superAdmin' ||
                                (userPermissions?.accountType === 'HR' && !hasWeekEnded);

                            return (
                                <button
                                    key={week.weekNumber}
                                    onClick={() => setActiveTab(index)}
                                    className={`px-4 py-3 border-b-2 font-medium whitespace-nowrap flex items-center ${activeTab === index
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                        } ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={!isEditable ? 'Week has ended. Only Super Admin can edit past weeks.' : ''}
                                >
                                    <span className="mr-2">
                                        {timelineStatus === 'past' && '📅'}
                                        {timelineStatus === 'current' && '📌'}
                                        {timelineStatus === 'upcoming' && '📋'}
                                    </span>
                                    Week {week.weekNumber}
                                    <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100">
                                        {week.employees.length} emp
                                    </span>
                                    {!isEditable && (
                                        <span className="ml-2 text-xs px-2 py-1 rounded bg-red-100 text-red-800">
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
                        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        Week {editedWeeks[activeTab].weekNumber}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {new Date(editedWeeks[activeTab].startDate).toLocaleDateString()} -
                                        {new Date(editedWeeks[activeTab].endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-600">
                                        {editedWeeks[activeTab].employees.length} employees
                                    </div>
                                    <button
                                        onClick={() => setShowAddEmployeeForm(true)}
                                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                                    >
                                        + Add Employee
                                    </button>
                                </div>
                            </div>
                        </div>
                        {showAddEmployeeForm && (
                            <div className="mb-6 bg-white rounded-lg border shadow-sm p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800">Add New Employee</h3>
                                    <button
                                        onClick={() => setShowAddEmployeeForm(false)}
                                        className="text-gray-500 hover:text-gray-700"
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
                       <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="bg-gray-50">
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Name</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Transport</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">CAB Route</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Team Leader</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Shift Hours</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Daily Status</th>
                    <th className="p-2 text-left font-semibold text-gray-800 border-b">Actions</th>
                </tr>
            </thead>
            <tbody>
                {editedWeeks[activeTab].employees.map((employee, empIndex) => {
                    const weekStartDate = new Date(editedWeeks[activeTab].startDate);
                    const weekEndDate = new Date(editedWeeks[activeTab].endDate);
                    const daysInWeek = Math.ceil((weekEndDate - weekStartDate) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                        <tr key={employee._id} className="border-b hover:bg-gray-50">
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
                                <div className="flex gap-0.5 justify-center min-w-max">
                                    {employee.dailyStatus.slice(0, daysInWeek).map((status, dayIndex) => {
                                        const dayDate = new Date(weekStartDate);
                                        dayDate.setDate(dayDate.getDate() + dayIndex);
                                        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

                                        return (
                                            <div key={dayIndex} className="flex flex-col items-center">
                                                <span className="text-xs text-gray-600 mb-0.5">{dayName.charAt(0)}</span>
                                                <select
                                                    value={status.status}
                                                    onChange={(e) => handleEmployeeFieldChange(activeTab, empIndex, `dailyStatus[${dayIndex}]`, e.target.value)}
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
                                <button
                                    onClick={() => handleRemoveEmployee(activeTab, employee._id)}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                                >
                                    Remove
                                </button>
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
            <div className="sticky bottom-0 bg-white border-t p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-gray-600">
                            Editing: Week {activeTab + 1} of {editedWeeks.length}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                            disabled={activeTab === 0}
                            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
                        >
                            Previous Week
                        </button>
                        <button
                            onClick={() => setActiveTab(prev => Math.min(editedWeeks.length - 1, prev + 1))}
                            disabled={activeTab === editedWeeks.length - 1}
                            className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
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
        </div>
    );
};

export default RosterBulkEditForm;