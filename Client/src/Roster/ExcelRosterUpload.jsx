import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadRosterFromExcel, clearExcelUploadState } from '../features/slices/rosterSlice.js';
import { toast } from 'react-toastify';
import Navbar from '../pages/Navbar.jsx';
import ConditionalNavbar from './ConditionalNavbar.jsx';
const ExcelRosterUpload = () => {
  const dispatch = useDispatch();
  const { 
    excelUploadLoading, 
    excelUploadSuccess, 
    excelUploadError, 
    excelUploadData 
  } = useSelector((state) => state.roster);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadHistory, setUploadHistory] = useState([]);

  // User info from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isSuperAdmin = user.accountType === 'superAdmin';
  const isAdmin = ['admin', 'HR'].includes(user.accountType);
  const isOpsMeta = user.department === 'Ops - Meta' && user.accountType === 'employee';
  const canUpload = isSuperAdmin || isAdmin || isOpsMeta;

  // Calculate dates based on user role
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayFormatted = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

  // Determine min date based on user role
  const getMinDate = () => {
    if (isSuperAdmin) {
      return '2020-01-01'; // SuperAdmin can select any date (past, present, future)
    } else if (isAdmin) {
      return todayFormatted; // Admin/HR can select today and future
    } else if (isOpsMeta) {
      return tomorrowFormatted; // Ops-Meta can select tomorrow and future
    }
    return todayFormatted; // Default
  };

  const validateForm = () => {
    const errors = {};

    if (!startDate) {
      errors.startDate = 'Start date is required';
    } else {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Role-based date validation
      if (isSuperAdmin) {
        // SuperAdmin: No date restrictions - can select any date
        // No validation needed
        console.log('SuperAdmin uploading for date:', startDate);
      } else if (isAdmin) {
        // Admin/HR: Can select today and future dates
        if (start < today) {
          errors.startDate = 'Admin/HR can only select today or future dates. Cannot select past dates.';
        }
      } else if (isOpsMeta) {
        // Ops-Meta: Can select tomorrow and future dates
        if (start < tomorrow) {
          errors.startDate = 'Ops-Meta can only select dates starting from tomorrow. Cannot select today or past dates.';
        }
      }
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        errors.endDate = 'End date must be after start date';
      }
      
      // Check if it's exactly 7 days
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays !== 7) {
        errors.endDate = 'Date range must be exactly 7 days';
      }
    }

    if (!excelFile) {
      errors.excelFile = 'Excel file is required';
    } else {
      // Validate file type
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        errors.excelFile = 'Only Excel files (.xlsx, .xls) are allowed';
      }
      
      // Check file size (10MB limit)
      if (excelFile.size > 10 * 1024 * 1024) {
        errors.excelFile = 'File size must be less than 10MB';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
      setFileName(file.name);
      // Clear file error when file is selected
      if (validationErrors.excelFile) {
        setValidationErrors(prev => ({ ...prev, excelFile: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Dispatch the upload action
    const result = await dispatch(uploadRosterFromExcel({
      startDate: startDate,
      endDate: endDate,
      excelFile
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      // Add to upload history
      const newUpload = {
        id: Date.now(),
        date: new Date().toISOString(),
        startDate: startDate,
        endDate: endDate,
        fileName,
        status: 'success',
        summary: result.payload.data?.summary
      };
      setUploadHistory(prev => [newUpload, ...prev.slice(0, 4)]); // Keep only last 5
      
      // Clear form after successful upload
      setStartDate('');
      setEndDate('');
      setExcelFile(null);
      setFileName('');
      setValidationErrors({});
      
      // Auto-clear success state after 5 seconds
      setTimeout(() => {
        dispatch(clearExcelUploadState());
      }, 5000);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setExcelFile(null);
    setFileName('');
    setValidationErrors({});
    dispatch(clearExcelUploadState());
  };

  // Generate expected date columns for the selected range
  const generateExpectedColumns = () => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const columns = [];
    const current = new Date(start);
    
    while (current <= end) {
      const day = String(current.getDate()).padStart(2, '0');
      const month = String(current.getMonth() + 1).padStart(2, '0');
      columns.push(`${day}/${month}`);
      current.setDate(current.getDate() + 1);
    }
    
    return columns;
  };

  const expectedColumns = generateExpectedColumns();

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Format time for display
  const formatTimeForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Get permission message based on user role
  const getPermissionMessage = () => {
    if (isSuperAdmin) {
      return 'SuperAdmin: Can upload for any date range (past, present, future)';
    } else if (isAdmin) {
      return 'Admin/HR: Can upload for today and future dates only';
    } else if (isOpsMeta) {
      return 'Ops-Meta: Can upload for future dates (starting from tomorrow) only';
    }
    return 'You have limited permissions';
  };

  // Get min date message
  const getMinDateMessage = () => {
    if (isSuperAdmin) {
      return 'No date restrictions - you can select any date';
    } else if (isAdmin) {
      return 'You can select today or any future date';
    } else if (isOpsMeta) {
      return 'You can select tomorrow or any future date';
    }
    return '';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <ConditionalNavbar />
      
      {/* Header with Role Badge */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
            📊 Upload Roster via Excel
          </h1>
          <p className="text-gray-600">Upload employee roster for a 7-day period using Excel file</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                📅 Select Date Range & Upload File
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {getPermissionMessage()}
              </span>
            </div>
            <div className="border-b border-gray-200 mb-6"></div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (validationErrors.startDate) {
                        setValidationErrors(prev => ({ ...prev, startDate: '' }));
                      }
                    }}
                    min={getMinDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.startDate ? (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getMinDateMessage()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (validationErrors.endDate) {
                        setValidationErrors(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                    min={startDate || getMinDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.endDate ? (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">Must be exactly 7 days from start</p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel File <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  excelFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                }`}>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label htmlFor="excel-file-input" className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {fileName ? `Selected: ${fileName}` : 'Choose Excel File (.xlsx, .xls)'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">Max file size: 10MB</p>
                    </div>
                  </label>
                </div>
                {validationErrors.excelFile && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.excelFile}</p>
                )}
                {fileName && !validationErrors.excelFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    File selected successfully
                  </p>
                )}
              </div>

              {/* Status Messages */}
              {excelUploadError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{excelUploadError}</span>
                  </div>
                </div>
              )}
              
              {excelUploadSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{excelUploadData?.message || 'Roster uploaded successfully!'}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={excelUploadLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={excelUploadLoading || !canUpload}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {excelUploadLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Roster'
                  )}
                </button>
              </div>

              {!canUpload && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-700">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>You don't have permission to upload rosters. Contact your administrator.</span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Instructions Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Important Instructions
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">Select exactly 7 days date range</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">Excel file must have date columns in DD/MM format</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">
                  {isSuperAdmin && 'SuperAdmin: Can upload for any date (past, present, future)'}
                  {isAdmin && 'Admin/HR: Can upload for today and future dates only'}
                  {isOpsMeta && 'Ops-Meta: Can upload for future dates (starting from tomorrow) only'}
                  {!isSuperAdmin && !isAdmin && !isOpsMeta && 'Contact admin for permissions'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">Max file size: 10MB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Preview & History */}
        <div className="space-y-6">
          {/* Expected Columns Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Expected Excel Format</h3>
            <p className="text-gray-600 text-sm mb-3">Your Excel file should have these date columns:</p>
            
            <div className="mb-4">
              {expectedColumns.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {expectedColumns.map((col, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">Select date range to see expected columns</p>
              )}
            </div>

            <p className="text-gray-700 font-medium text-sm mb-2">Required employee columns:</p>
            <div className="flex flex-wrap gap-2">
              {['name', 'username', 'shiftStartHour', 'shiftEndHour', 'transport', 'teamLeader'].map((col) => (
                <span
                  key={col}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full border border-purple-200"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Upload Results */}
          {excelUploadData?.data?.summary && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-green-600 mb-4">Upload Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Date Range:</span>
                  <span className="text-gray-900">
                    {excelUploadData.data.selectedDateRange?.startDate} to{' '}
                    {excelUploadData.data.selectedDateRange?.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Total Employees:</span>
                  <span className="text-gray-900">{excelUploadData.data.summary?.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Week Number:</span>
                  <span className="text-gray-900">{excelUploadData.data.summary?.weekNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Uploaded By:</span>
                  <span className="text-gray-900">{excelUploadData.data.summary?.uploadedBy?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Permission:</span>
                  <span className="text-gray-900 text-xs">
                    {excelUploadData.data.summary?.uploadedBy?.permissions}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Upload History */}
          {uploadHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Uploads</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadHistory.map((upload) => (
                      <tr key={upload.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {formatDateForDisplay(upload.date)} {formatTimeForDisplay(upload.date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {upload.startDate} - {upload.endDate}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 max-w-[100px] truncate">
                          {upload.fileName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <div className="text-sm text-gray-600">
          Logged in as: <strong>{user.username}</strong> • 
          Role: <strong>{user.accountType}</strong> • 
          Department: <strong>{user.department || 'N/A'}</strong>
          {isSuperAdmin && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              SuperAdmin - Full Access
            </span>
          )}
          {isAdmin && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Admin/HR - Can upload from today
            </span>
          )}
          {isOpsMeta && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
              Ops-Meta - Can upload from tomorrow
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {getPermissionMessage()}
        </div>
      </div>
    </div>
  );
};

export default ExcelRosterUpload;