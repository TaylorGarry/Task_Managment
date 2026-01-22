import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    createRosterForDateRange,
    copyEmployeesToWeek,
    bulkUpdateWeeks,
    clearCreateRangeState,
    clearCopyEmployeesState,
    clearBulkUpdateState,
    fetchAllRosters,
    fetchRoster
} from '../features/slices/rosterSlice.js';

const RosterCopyPopup = ({ isOpen, onClose, currentRosterData }) => {
    const dispatch = useDispatch();

    const {
        createRangeLoading,
        createRangeSuccess,
        createRangeError,
        copyEmployeesLoading,
        copyEmployeesSuccess,
        copyEmployeesError,
        bulkUpdateLoading,
        bulkUpdateSuccess,
        bulkUpdateError,
        allRosters,
        rosterDetailLoading
    } = useSelector((state) => state.roster || {});

    const [activeTab, setActiveTab] = useState('create-range');

    const [createRangeForm, setCreateRangeForm] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        sourceWeekNumber: '',
        preserveDailyStatus: false,
        newEmployees: [],  
        rosterStartDate: '',
        rosterEndDate: '',
    });

    const [copyForm, setCopyForm] = useState({
        rosterId: '',
        sourceWeekNumber: '',
        targetWeekNumbers: '',
        excludeEmployees: '',
        resetStatus: true
    });

    const [bulkUpdateForm, setBulkUpdateForm] = useState({
        rosterId: '',
        weekNumbers: '',
        updateType: 'add',
        employees: '',
        employeeNames: '',
        resetToDefault: false
    });

    const [availableRosters, setAvailableRosters] = useState([]);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllRosters({}));
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (allRosters?.data && Array.isArray(allRosters.data)) {
            setAvailableRosters(allRosters.data);

            if (currentRosterData?._id && !copyForm.rosterId) {
                setCopyForm(prev => ({ ...prev, rosterId: currentRosterData._id }));
                setBulkUpdateForm(prev => ({ ...prev, rosterId: currentRosterData._id }));
            }

            if (currentRosterData?.month && currentRosterData?.year) {
                setCreateRangeForm(prev => ({
                    ...prev,
                    month: currentRosterData.month,
                    year: currentRosterData.year
                }));
            }
        }
    }, [allRosters, currentRosterData]);

    useEffect(() => {
        if (!isOpen) {
            dispatch(clearCreateRangeState());
            dispatch(clearCopyEmployeesState());
            dispatch(clearBulkUpdateState());
        }
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (createRangeSuccess) {
            toast.success('Multiple weeks created successfully!');
            onClose();
        }
        if (createRangeError) {
            toast.error(createRangeError);
        }
    }, [createRangeSuccess, createRangeError, onClose]);

    useEffect(() => {
        if (copyEmployeesSuccess) {
            toast.success('Employees copied successfully!');
            onClose();
        }
        if (copyEmployeesError) {
            toast.error(copyEmployeesError);
        }
    }, [copyEmployeesSuccess, copyEmployeesError, onClose]);

    useEffect(() => {
        if (bulkUpdateSuccess) {
            toast.success('Bulk update completed successfully!');
            onClose();
        }
        if (bulkUpdateError) {
            toast.error(bulkUpdateError);
        }
    }, [bulkUpdateSuccess, bulkUpdateError, onClose]);
    const handleCreateRangeChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCreateRangeForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCopyFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCopyForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleBulkUpdateChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBulkUpdateForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateRangeSubmit = async (e) => {
        e.preventDefault();

        if (!createRangeForm.startDate || !createRangeForm.endDate) {
            toast.error('Please select start and end dates');
            return;
        }

        const start = new Date(createRangeForm.startDate);
        const end = new Date(createRangeForm.endDate);

        if (start >= end) {
            toast.error('Start date must be before end date');
            return;
        }
        const data = {
            month: parseInt(createRangeForm.month),
            year: parseInt(createRangeForm.year),
            startDate: createRangeForm.startDate,
            endDate: createRangeForm.endDate,
            sourceWeekNumber: createRangeForm.sourceWeekNumber ? parseInt(createRangeForm.sourceWeekNumber) : undefined,
            preserveDailyStatus: createRangeForm.preserveDailyStatus,
            rosterStartDate: createRangeForm.rosterStartDate || createRangeForm.startDate,
            rosterEndDate: createRangeForm.rosterEndDate || createRangeForm.endDate
        };
        if (createRangeForm.newEmployees && createRangeForm.newEmployees.length > 0) {
            const invalidEmployees = createRangeForm.newEmployees.filter(emp => !emp.name || emp.name.trim() === '');
            if (invalidEmployees.length > 0) {
                toast.error('Please enter names for all employees');
                return;
            }
            data.newEmployees = createRangeForm.newEmployees.map(emp => {
                const formattedEmp = {
                    name: emp.name.trim(),
                    shiftStartHour: emp.shiftStartHour || 9,
                    shiftEndHour: emp.shiftEndHour || 18,
                    transport: emp.transport || 'yes',
                    cabRoute: emp.cabRoute || '',
                    dailyStatus: emp.dailyStatus || {}
                };
                return formattedEmp;
            });
        }
        else if (typeof createRangeForm.newEmployees === 'string' && createRangeForm.newEmployees.trim()) {
            try {
                data.newEmployees = JSON.parse(createRangeForm.newEmployees);
            } catch (err) {
                toast.error('Invalid JSON format for new employees');
                return;
            }
        }

        await dispatch(createRosterForDateRange({ data }));
    };

    const handleCopySubmit = async (e) => {
        e.preventDefault();

        if (!copyForm.rosterId || !copyForm.sourceWeekNumber || !copyForm.targetWeekNumbers) {
            toast.error('Please fill all required fields');
            return;
        }
        let targetWeekNumbers;
        try {
            targetWeekNumbers = copyForm.targetWeekNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
            if (targetWeekNumbers.length === 0) throw new Error();
        } catch (err) {
            toast.error('Invalid format for target week numbers. Use comma-separated numbers (e.g., 2,3,4)');
            return;
        }
        let excludeEmployees = [];
        if (copyForm.excludeEmployees) {
            excludeEmployees = copyForm.excludeEmployees.split(',').map(name => name.trim()).filter(name => name.length > 0);
        }

        const data = {
            rosterId: copyForm.rosterId,
            sourceWeekNumber: parseInt(copyForm.sourceWeekNumber),
            targetWeekNumbers,
            excludeEmployees,
            resetStatus: copyForm.resetStatus
        };

        await dispatch(copyEmployeesToWeek({ data }));
    };
    const handleBulkUpdateSubmit = async (e) => {
        e.preventDefault();

        if (!bulkUpdateForm.rosterId || !bulkUpdateForm.weekNumbers || !bulkUpdateForm.updateType) {
            toast.error('Please fill all required fields');
            return;
        }
        let weekNumbers;
        try {
            weekNumbers = bulkUpdateForm.weekNumbers.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
            if (weekNumbers.length === 0) throw new Error();
        } catch (err) {
            toast.error('Invalid format for week numbers. Use comma-separated numbers (e.g., 2,3,4)');
            return;
        }
        const data = {
            rosterId: bulkUpdateForm.rosterId,
            weekNumbers,
            updateType: bulkUpdateForm.updateType,
            resetToDefault: bulkUpdateForm.resetToDefault
        };
        if (bulkUpdateForm.updateType === 'add' && bulkUpdateForm.employees) {
            try {
                data.employees = JSON.parse(bulkUpdateForm.employees);
            } catch (err) {
                toast.error('Invalid JSON format for employees');
                return;
            }
        } else if (bulkUpdateForm.updateType === 'remove' && bulkUpdateForm.employeeNames) {
            data.employeeNames = bulkUpdateForm.employeeNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
        } else if (bulkUpdateForm.updateType === 'update' && bulkUpdateForm.employees) {
            try {
                data.employees = JSON.parse(bulkUpdateForm.employees);
            } catch (err) {
                toast.error('Invalid JSON format for employee updates');
                return;
            }
        }

        await dispatch(bulkUpdateWeeks({ data }));
    };
    const getWeeksForRoster = (rosterId) => {
        const roster = availableRosters.find(r => r._id === rosterId);
        return roster?.weeks || [];
    };
    const formatRosterName = (roster) => {
        return `Roster ${roster.month}/${roster.year} (${roster.totalWeeks || 0} weeks, ${roster.totalEmployees || 0} employees)`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Auto-Propagation Roster Tools</h2>
                            <p className="text-blue-100 mt-1">Create, copy, and update multiple weeks automatically</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex mt-4 space-x-1">
                        {[
                            { id: 'create-range', label: 'Create Weeks' },
                            { id: 'copy-employees', label: 'Copy Employees' },
                            { id: 'bulk-update', label: 'Bulk Update' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-white text-blue-600'
                                        : 'text-blue-100 hover:text-white'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {rosterDetailLoading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600">Loading roster data...</span>
                        </div>
                    )}
                    {activeTab === 'create-range' && !rosterDetailLoading && (
                        <form onSubmit={handleCreateRangeSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Month *
                                    </label>
                                    <select
                                        name="month"
                                        value={createRangeForm.month}
                                        onChange={handleCreateRangeChange}
                                        className="w-full border p-3 rounded text-gray-800"
                                        required
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Year *
                                    </label>
                                    <input
                                        type="number"
                                        name="year"
                                        value={createRangeForm.year}
                                        onChange={handleCreateRangeChange}
                                        min="2000"
                                        max="2100"
                                        className="w-full border p-3 rounded text-gray-800"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={createRangeForm.startDate}
                                        onChange={handleCreateRangeChange}
                                        className="w-full border p-3 rounded text-gray-800"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={createRangeForm.endDate}
                                        onChange={handleCreateRangeChange}
                                        className="w-full border p-3 rounded text-gray-800"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="preserveDailyStatus"
                                    name="preserveDailyStatus"
                                    checked={createRangeForm.preserveDailyStatus}
                                    onChange={handleCreateRangeChange}
                                    className="mr-2"
                                />
                                <label htmlFor="preserveDailyStatus" className="text-sm text-gray-700">
                                    Preserve daily statuses when copying
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Employees (Optional)
                                </label> 
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newEmp = {
                                            name: '',
                                            shiftStartHour: 9,
                                            shiftEndHour: 18,
                                            transport: 'Yes',  
                                            cabRoute: '',
                                            dailyStatus: []  
                                        };
                                        setCreateRangeForm(prev => ({
                                            ...prev,
                                            newEmployees: [...(prev.newEmployees || []), newEmp]
                                        }));
                                    }}
                                    className="mb-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add New Employee
                                </button>
                                {(createRangeForm.newEmployees || []).map((emp, index) => (
                                    <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium text-gray-700">Employee #{index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...(createRangeForm.newEmployees || [])];
                                                    updated.splice(index, 1);
                                                    setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                                                <input
                                                    type="text"
                                                    value={emp.name}
                                                    onChange={(e) => {
                                                        const updated = [...(createRangeForm.newEmployees || [])];
                                                        updated[index].name = e.target.value;
                                                        setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                    }}
                                                    className="w-full border p-2 rounded text-sm"
                                                    placeholder="Enter employee name"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Hour</label>
                                                    <select
                                                        value={emp.shiftStartHour}
                                                        onChange={(e) => {
                                                            const updated = [...(createRangeForm.newEmployees || [])];
                                                            updated[index].shiftStartHour = parseInt(e.target.value);
                                                            setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                        }}
                                                        className="w-full border p-2 rounded text-sm"
                                                    >
                                                        {Array.from({ length: 24 }, (_, i) => (
                                                            <option key={i} value={i}>{i}:00</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">End Hour</label>
                                                    <select
                                                        value={emp.shiftEndHour}
                                                        onChange={(e) => {
                                                            const updated = [...(createRangeForm.newEmployees || [])];
                                                            updated[index].shiftEndHour = parseInt(e.target.value);
                                                            setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                        }}
                                                        className="w-full border p-2 rounded text-sm"
                                                    >
                                                        {Array.from({ length: 24 }, (_, i) => (
                                                            <option key={i} value={i}>{i}:00</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Transport</label>
                                                <select
                                                    value={emp.transport}
                                                    onChange={(e) => {
                                                        const updated = [...(createRangeForm.newEmployees || [])];
                                                        updated[index].transport = e.target.value;
                                                        setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                    }}
                                                    className="w-full border p-2 rounded text-sm"
                                                >
                                                    <option value="Yes">Yes</option> {/* Exactly "Yes" */}
                                                    <option value="No">No</option>   {/* Exactly "No" */}
                                                    <option value="">Not Specified</option> {/* Empty string */}
                                                </select>
                                            </div>

                                            {/* Cab Route */}
                                            {emp.transport === 'yes' && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Cab Route</label>
                                                    <input
                                                        type="text"
                                                        value={emp.cabRoute || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(createRangeForm.newEmployees || [])];
                                                            updated[index].cabRoute = e.target.value;
                                                            setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                        }}
                                                        className="w-full border p-2 rounded text-sm"
                                                        placeholder="Enter cab route"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Daily Status Toggle */}
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...(createRangeForm.newEmployees || [])];
                                                    updated[index].showStatus = !emp.showStatus;
                                                    setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                {emp.showStatus ? 'Hide' : 'Show'} Daily Status
                                                <svg className={`w-4 h-4 ml-1 transition-transform ${emp.showStatus ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Daily Status Grid */}
                                            {emp.showStatus && (
                                                <div className="mt-3 border-t pt-3">
                                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Status (Defaults)</h5>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                                            <div key={day} className="text-center">
                                                                <div className="text-xs font-medium text-gray-600 mb-1">{day.substring(0, 3)}</div>
                                                                <select
                                                                    value={emp.dailyStatus?.[day]?.status || 'P'}
                                                                    onChange={(e) => {
                                                                        const updated = [...(createRangeForm.newEmployees || [])];
                                                                        if (!updated[index].dailyStatus) updated[index].dailyStatus = {};
                                                                        if (!updated[index].dailyStatus[day]) updated[index].dailyStatus[day] = {};
                                                                        updated[index].dailyStatus[day].status = e.target.value;

                                                                        // Reset times for WO (Week Off)
                                                                        if (e.target.value === 'WO') {
                                                                            updated[index].dailyStatus[day].checkIn = '';
                                                                            updated[index].dailyStatus[day].checkOut = '';
                                                                            updated[index].dailyStatus[day].hoursWorked = 0;
                                                                        } else {
                                                                            updated[index].dailyStatus[day].checkIn = '09:00';
                                                                            updated[index].dailyStatus[day].checkOut = '18:00';
                                                                            updated[index].dailyStatus[day].hoursWorked = 9;
                                                                        }

                                                                        setCreateRangeForm(prev => ({ ...prev, newEmployees: updated }));
                                                                    }}
                                                                    className="w-full border p-1 rounded text-xs"
                                                                >
                                                                    <option value="P">P</option>
                                                                    <option value="WO">WO</option>
                                                                    <option value="L">L</option>
                                                                    <option value="NCNS">NCNS</option>
                                                                    <option value="UL">UL</option>
                                                                    <option value="LWP">LWP</option>
                                                                    <option value="BL">BL</option>
                                                                    <option value="H">H</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Creates multiple weeks automatically for the date range</li>
                                    <li>• Can copy employees from an existing week (optional)</li>
                                    <li>• Can add new employees to all created weeks (optional)</li>
                                    <li>• Maintains all employee details and validations</li>
                                    <li>• Automatically calculates week numbers</li>
                                </ul>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                    disabled={createRangeLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createRangeLoading}
                                    className={`px-6 py-2 rounded font-medium ${createRangeLoading
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                        } text-white flex items-center`}
                                >
                                    {createRangeLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Multiple Weeks'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'copy-employees' && !rosterDetailLoading && (
                        <form onSubmit={handleCopySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Roster *
                                </label>
                                <select
                                    name="rosterId"
                                    value={copyForm.rosterId}
                                    onChange={handleCopyFormChange}
                                    className="w-full border p-3 rounded text-gray-800"
                                    required
                                >
                                    <option value="">Select a roster...</option>
                                    {availableRosters.map(roster => (
                                        <option key={roster._id} value={roster._id}>
                                            {formatRosterName(roster)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {copyForm.rosterId && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Source Week Number *
                                            </label>
                                            <select
                                                name="sourceWeekNumber"
                                                value={copyForm.sourceWeekNumber}
                                                onChange={handleCopyFormChange}
                                                className="w-full border p-3 rounded text-gray-800"
                                                required
                                            >
                                                <option value="">Select source week...</option>
                                                {getWeeksForRoster(copyForm.rosterId).map(week => (
                                                    <option key={week.weekNumber} value={week.weekNumber}>
                                                        Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Target Week Numbers *
                                            </label>
                                            <input
                                                type="text"
                                                name="targetWeekNumbers"
                                                value={copyForm.targetWeekNumbers}
                                                onChange={handleCopyFormChange}
                                                placeholder="e.g., 2,3,4"
                                                className="w-full border p-3 rounded text-gray-800"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Comma-separated week numbers
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Exclude Employees (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="excludeEmployees"
                                            value={copyForm.excludeEmployees}
                                            onChange={handleCopyFormChange}
                                            placeholder="e.g., John Doe, Jane Smith"
                                            className="w-full border p-3 rounded text-gray-800"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Comma-separated employee names to exclude from copying
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="resetStatus"
                                            name="resetStatus"
                                            checked={copyForm.resetStatus}
                                            onChange={handleCopyFormChange}
                                            className="mr-2"
                                        />
                                        <label htmlFor="resetStatus" className="text-sm text-gray-700">
                                            Reset daily statuses to "P" (Present) in target weeks
                                        </label>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800 mb-2">What will happen:</h4>
                                        <ul className="text-sm text-green-700 space-y-1">
                                            <li>• All employees from source week will be copied to target weeks</li>
                                            <li>• Excluded employees (if any) will not be copied</li>
                                            <li>• Daily statuses will be reset to "P" if checked</li>
                                            <li>• Existing employees in target weeks will be updated</li>
                                            <li>• New employees will be added to target weeks</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                    disabled={copyEmployeesLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={copyEmployeesLoading || !copyForm.rosterId}
                                    className={`px-6 py-2 rounded font-medium ${copyEmployeesLoading || !copyForm.rosterId
                                            ? 'bg-green-400 cursor-not-allowed'
                                            : 'bg-green-500 hover:bg-green-600'
                                        } text-white flex items-center`}
                                >
                                    {copyEmployeesLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Copying...
                                        </>
                                    ) : (
                                        'Copy Employees'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'bulk-update' && !rosterDetailLoading && (
                        <form onSubmit={handleBulkUpdateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Roster *
                                </label>
                                <select
                                    name="rosterId"
                                    value={bulkUpdateForm.rosterId}
                                    onChange={handleBulkUpdateChange}
                                    className="w-full border p-3 rounded text-gray-800"
                                    required
                                >
                                    <option value="">Select a roster...</option>
                                    {availableRosters.map(roster => (
                                        <option key={roster._id} value={roster._id}>
                                            {formatRosterName(roster)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {bulkUpdateForm.rosterId && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Week Numbers *
                                            </label>
                                            <input
                                                type="text"
                                                name="weekNumbers"
                                                value={bulkUpdateForm.weekNumbers}
                                                onChange={handleBulkUpdateChange}
                                                placeholder="e.g., 2,3,4"
                                                className="w-full border p-3 rounded text-gray-800"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Comma-separated week numbers to update
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Update Type *
                                            </label>
                                            <select
                                                name="updateType"
                                                value={bulkUpdateForm.updateType}
                                                onChange={handleBulkUpdateChange}
                                                className="w-full border p-3 rounded text-gray-800"
                                                required
                                            >
                                                <option value="add">Add Employees</option>
                                                <option value="remove">Remove Employees</option>
                                                <option value="update">Update Employees</option>
                                                <option value="reset">Reset Statuses</option>
                                            </select>
                                        </div>
                                    </div>
                                    {bulkUpdateForm.updateType === 'add' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Employees to Add (JSON format) *
                                            </label>
                                            <textarea
                                                name="employees"
                                                value={bulkUpdateForm.employees}
                                                onChange={handleBulkUpdateChange}
                                                placeholder='[{"name": "New Employee", "shiftStartHour": 9, "shiftEndHour": 18}]'
                                                className="w-full border p-3 rounded text-gray-800 font-mono text-sm"
                                                rows="3"
                                                required
                                            />
                                        </div>
                                    )}
                                    {bulkUpdateForm.updateType === 'remove' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Employee Names to Remove *
                                            </label>
                                            <input
                                                type="text"
                                                name="employeeNames"
                                                value={bulkUpdateForm.employeeNames}
                                                onChange={handleBulkUpdateChange}
                                                placeholder="e.g., John Doe, Jane Smith"
                                                className="w-full border p-3 rounded text-gray-800"
                                                required
                                            />
                                        </div>
                                    )}
                                    {bulkUpdateForm.updateType === 'update' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Employee Updates (JSON format) *
                                            </label>
                                            <textarea
                                                name="employees"
                                                value={bulkUpdateForm.employees}
                                                onChange={handleBulkUpdateChange}
                                                placeholder='[{"name": "John Doe", "shiftStartHour": 10, "shiftEndHour": 19}]'
                                                className="w-full border p-3 rounded text-gray-800 font-mono text-sm"
                                                rows="3"
                                                required
                                            />
                                        </div>
                                    )}
                                    {bulkUpdateForm.updateType === 'reset' && (
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="resetToDefault"
                                                name="resetToDefault"
                                                checked={bulkUpdateForm.resetToDefault}
                                                onChange={handleBulkUpdateChange}
                                                className="mr-2"
                                            />
                                            <label htmlFor="resetToDefault" className="text-sm text-gray-700">
                                                Reset all daily statuses to "P" (Present)
                                            </label>
                                        </div>
                                    )}
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <h4 className="font-medium text-purple-800 mb-2">Operation Details:</h4>
                                        {bulkUpdateForm.updateType === 'add' && (
                                            <p className="text-sm text-purple-700">
                                                Will add the specified employees to all selected weeks
                                            </p>
                                        )}
                                        {bulkUpdateForm.updateType === 'remove' && (
                                            <p className="text-sm text-purple-700">
                                                Will remove the specified employees from all selected weeks
                                            </p>
                                        )}
                                        {bulkUpdateForm.updateType === 'update' && (
                                            <p className="text-sm text-purple-700">
                                                Will update the specified employees in all selected weeks
                                            </p>
                                        )}
                                        {bulkUpdateForm.updateType === 'reset' && (
                                            <p className="text-sm text-purple-700">
                                                Will reset all employee statuses to "P" in selected weeks
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded border hover:bg-gray-50"
                                    disabled={bulkUpdateLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkUpdateLoading || !bulkUpdateForm.rosterId}
                                    className={`px-6 py-2 rounded font-medium ${bulkUpdateLoading || !bulkUpdateForm.rosterId
                                            ? 'bg-purple-400 cursor-not-allowed'
                                            : 'bg-purple-500 hover:bg-purple-600'
                                        } text-white flex items-center`}
                                >
                                    {bulkUpdateLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        'Execute Bulk Update'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RosterCopyPopup;