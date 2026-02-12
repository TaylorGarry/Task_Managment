import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  createRosterForDateRange,
  clearCreateRangeState,
} from '../features/slices/rosterSlice.js';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RosterCopyPopup = ({ isOpen, onClose, currentRosterData }) => {
  const dispatch = useDispatch();

  const {
    createRangeLoading,
    createRangeSuccess,
    createRangeError,
    rosterDetailLoading,
  } = useSelector((state) => state.roster || {});

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

  useEffect(() => {
    if (currentRosterData?.month && currentRosterData?.year) {
      setCreateRangeForm((prev) => ({
        ...prev,
        month: currentRosterData.month,
        year: currentRosterData.year,
      }));
    }
  }, [currentRosterData]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(clearCreateRangeState());
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

  const handleCreateRangeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateRangeForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      month: parseInt(createRangeForm.month, 10),
      year: parseInt(createRangeForm.year, 10),
      startDate: createRangeForm.startDate,
      endDate: createRangeForm.endDate,
      sourceWeekNumber: createRangeForm.sourceWeekNumber
        ? parseInt(createRangeForm.sourceWeekNumber, 10)
        : undefined,
      preserveDailyStatus: createRangeForm.preserveDailyStatus,
      rosterStartDate: createRangeForm.rosterStartDate || createRangeForm.startDate,
      rosterEndDate: createRangeForm.rosterEndDate || createRangeForm.endDate,
    };

    if (createRangeForm.newEmployees && createRangeForm.newEmployees.length > 0) {
      const invalidEmployees = createRangeForm.newEmployees.filter(
        (emp) => !emp.name || emp.name.trim() === ''
      );
      if (invalidEmployees.length > 0) {
        toast.error('Please enter names for all employees');
        return;
      }

      data.newEmployees = createRangeForm.newEmployees.map((emp) => ({
        name: emp.name.trim(),
        shiftStartHour: emp.shiftStartHour || 9,
        shiftEndHour: emp.shiftEndHour || 18,
        transport: emp.transport || 'Yes',
        cabRoute: emp.cabRoute || '',
        dailyStatus: emp.dailyStatus || {},
      }));
    }

    await dispatch(createRosterForDateRange({ data }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden [&_button]:cursor-pointer [&_select]:cursor-pointer">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Roster Utilities</p>
              <h2 className="text-2xl font-bold text-white">Auto-Propagation Roster Tools</h2>
              <p className="text-slate-300 mt-1">Create multiple weeks automatically from a date range</p>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-white/30 text-white hover:bg-white/15 transition-colors text-lg"
            >
              ?
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[72vh] bg-slate-50">
          {rosterDetailLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600">Loading roster data...</span>
            </div>
          )}

          {!rosterDetailLoading && (
            <form onSubmit={handleCreateRangeSubmit} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Month *</label>
                  <select
                    name="month"
                    value={createRangeForm.month}
                    onChange={handleCreateRangeChange}
                    className="w-full border border-slate-300 p-3 rounded-lg text-slate-800 bg-white"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={createRangeForm.year}
                    onChange={handleCreateRangeChange}
                    min="2000"
                    max="2100"
                    className="w-full border border-slate-300 p-3 rounded-lg text-slate-800 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={createRangeForm.startDate}
                    onChange={handleCreateRangeChange}
                    className="w-full border border-slate-300 p-3 rounded-lg text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={createRangeForm.endDate}
                    onChange={handleCreateRangeChange}
                    className="w-full border border-slate-300 p-3 rounded-lg text-slate-800 bg-white"
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
                <label htmlFor="preserveDailyStatus" className="text-sm text-slate-700">
                  Preserve daily statuses when copying
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Additional Employees (Optional)</label>
                <button
                  type="button"
                  onClick={() => {
                    const newEmp = {
                      name: '',
                      shiftStartHour: 9,
                      shiftEndHour: 18,
                      transport: 'Yes',
                      cabRoute: '',
                      dailyStatus: {},
                    };
                    setCreateRangeForm((prev) => ({
                      ...prev,
                      newEmployees: [...(prev.newEmployees || []), newEmp],
                    }));
                  }}
                  className="mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Employee
                </button>

                {(createRangeForm.newEmployees || []).map((emp, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl p-4 mb-3 bg-slate-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-slate-700">Employee #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(createRangeForm.newEmployees || [])];
                          updated.splice(index, 1);
                          setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                        }}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                        <input
                          type="text"
                          value={emp.name}
                          onChange={(e) => {
                            const updated = [...(createRangeForm.newEmployees || [])];
                            updated[index].name = e.target.value;
                            setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                          }}
                          className="w-full border border-slate-300 p-2 rounded text-sm bg-white"
                          placeholder="Enter employee name"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Start Hour</label>
                          <select
                            value={emp.shiftStartHour}
                            onChange={(e) => {
                              const updated = [...(createRangeForm.newEmployees || [])];
                              updated[index].shiftStartHour = parseInt(e.target.value, 10);
                              setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                            }}
                            className="w-full border border-slate-300 p-2 rounded text-sm bg-white"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i}:00</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">End Hour</label>
                          <select
                            value={emp.shiftEndHour}
                            onChange={(e) => {
                              const updated = [...(createRangeForm.newEmployees || [])];
                              updated[index].shiftEndHour = parseInt(e.target.value, 10);
                              setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                            }}
                            className="w-full border border-slate-300 p-2 rounded text-sm bg-white"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{i}:00</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Transport</label>
                        <select
                          value={emp.transport}
                          onChange={(e) => {
                            const updated = [...(createRangeForm.newEmployees || [])];
                            updated[index].transport = e.target.value;
                            setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                          }}
                          className="w-full border border-slate-300 p-2 rounded text-sm bg-white"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="">Not Specified</option>
                        </select>
                      </div>

                      {emp.transport === 'Yes' && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Cab Route</label>
                          <input
                            type="text"
                            value={emp.cabRoute || ''}
                            onChange={(e) => {
                              const updated = [...(createRangeForm.newEmployees || [])];
                              updated[index].cabRoute = e.target.value;
                              setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                            }}
                            className="w-full border border-slate-300 p-2 rounded text-sm bg-white"
                            placeholder="Enter cab route"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(createRangeForm.newEmployees || [])];
                          updated[index].showStatus = !emp.showStatus;
                          setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                        }}
                        className="text-sm text-blue-700 hover:text-blue-800 flex items-center"
                      >
                        {emp.showStatus ? 'Hide' : 'Show'} Daily Status
                        <svg className={`w-4 h-4 ml-1 transition-transform ${emp.showStatus ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {emp.showStatus && (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <h5 className="text-sm font-medium text-slate-700 mb-2">Daily Status (Defaults)</h5>
                          <div className="grid grid-cols-7 gap-1">
                            {dayNames.map((day) => (
                              <div key={day} className="text-center">
                                <div className="text-xs font-medium text-slate-600 mb-1">{day.substring(0, 3)}</div>
                                <select
                                  value={emp.dailyStatus?.[day]?.status || 'P'}
                                  onChange={(e) => {
                                    const updated = [...(createRangeForm.newEmployees || [])];
                                    if (!updated[index].dailyStatus) updated[index].dailyStatus = {};
                                    if (!updated[index].dailyStatus[day]) updated[index].dailyStatus[day] = {};
                                    updated[index].dailyStatus[day].status = e.target.value;

                                    if (e.target.value === 'WO') {
                                      updated[index].dailyStatus[day].checkIn = '';
                                      updated[index].dailyStatus[day].checkOut = '';
                                      updated[index].dailyStatus[day].hoursWorked = 0;
                                    } else {
                                      updated[index].dailyStatus[day].checkIn = '09:00';
                                      updated[index].dailyStatus[day].checkOut = '18:00';
                                      updated[index].dailyStatus[day].hoursWorked = 9;
                                    }

                                    setCreateRangeForm((prev) => ({ ...prev, newEmployees: updated }));
                                  }}
                                  className="w-full border border-slate-300 p-1 rounded text-xs bg-white"
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

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>- Creates multiple weeks automatically for the date range</li>
                  <li>- Can add new employees to all created weeks (optional)</li>
                  <li>- Maintains employee details and validations</li>
                  <li>- Automatically calculates week numbers</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
                  disabled={createRangeLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRangeLoading}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    createRangeLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white flex items-center`}
                >
                  {createRangeLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
        </div>
      </div>
    </div>
  );
};

export default RosterCopyPopup;
