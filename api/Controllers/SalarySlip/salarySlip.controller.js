// import path from "path";
// import SalaryRecord from "../../Modals/SalarySlip/SalaryRecord.modal.js";
// import SalaryBatch from "../../Modals/SalarySlip/SalaryBatch.modal.js";
// import { importSalaryExcel } from "../../services/salaryExcel.service.js";
// import { generateSalarySlipPdf } from "../../services/salaryPdf.service.js";
// import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../../utils/roleAccess.js";
// import User from "../../Modals/User.modal.js";
// import { sendSalarySlipEmail, sendBulkSalarySlipsEmail } from "../../services/email.service.js";

// const MONTH_NAMES = [
//   "",
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December",
// ];

// const isAccountsDepartment = (user = {}) => {
//   const department = normalizeDepartment(user.department).toLowerCase();
//   return department === "account" || department === "accounts";
// };

// const canManageSalarySlips = (user = {}) =>
//   isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);

// const parseMonthYear = ({ month, year }) => {
//   const monthNumber = Number(month);
//   const yearNumber = Number(year);

//   if (Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
//     return { error: "Invalid month." };
//   }

//   if (Number.isNaN(yearNumber) || yearNumber < 2020 || yearNumber > 2100) {
//     return { error: "Invalid year." };
//   }

//   return { monthNumber, yearNumber };
// };

// // Upload salary Excel (unchanged)
// export const uploadSalaryExcel = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to upload salary sheets.",
//       });
//     }

//     const parsed = parseMonthYear(req.body);
//     if (parsed.error) {
//       return res.status(400).json({ success: false, message: parsed.error });
//     }

//     if (!req.file?.buffer) {
//       return res.status(400).json({
//         success: false,
//         message: "Please upload an Excel file.",
//       });
//     }

//     const extension = path.extname(req.file.originalname || "").toLowerCase();
//     if (![".xlsx", ".xls"].includes(extension)) {
//       return res.status(400).json({
//         success: false,
//         message: "Only Excel (.xlsx, .xls) files are allowed.",
//       });
//     }

//     const result = await importSalaryExcel({
//       fileBuffer: req.file.buffer,
//       fileName: req.file.originalname,
//       month: parsed.monthNumber,
//       year: parsed.yearNumber,
//       uploadedBy: req.user._id,
//     });

//     const failedRecords = result.failedRecords || [];
//     const failedEmployees = failedRecords.map(record => ({
//       employeeName: record.employeeName || record.employee || 'Unknown',
//       employeeCode: record.employeeCode || record.code || 'N/A',
//       reason: record.reason || 'Unknown error',
//       rowNumber: record.rowNumber || 0
//     }));

//     if (result.batchId) {
//       await SalaryBatch.findByIdAndUpdate(result.batchId, {
//         failedRecords: failedRecords.map(record => ({
//           employee: record.employee || record.employeeName || 'Unknown',
//           employeeName: record.employeeName || record.employee || 'Unknown',
//           employeeCode: record.employeeCode || record.code || 'N/A',
//           reason: record.reason || 'Unknown error',
//           rowNumber: record.rowNumber || 0
//         }))
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Salary sheet uploaded successfully.",
//       data: {
//         ...result,
//         failedEmployees: failedEmployees,
//         totalFailed: failedEmployees.length,
//         failedRecords: failedRecords
//       },
//     });
//   } catch (error) {
//     console.error("Salary Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get my salary slips (unchanged)
// export const getMySalarySlips = async (req, res) => {
//   try {
//     const records = await SalaryRecord.find({ employeeId: req.user._id })
//       .sort({ year: -1, month: -1 })
//       .select("month year employeeCode employeeName department designation createdAt updatedAt");

//     return res.json({
//       success: true,
//       data: records.map((record) => ({
//         _id: record._id,
//         month: record.month,
//         year: record.year,
//         monthName: MONTH_NAMES[record.month] || String(record.month),
//         employeeCode: record.employeeCode,
//         employeeName: record.employeeName,
//         department: record.department,
//         designation: record.designation,
//         uploadedAt: record.createdAt,
//         updatedAt: record.updatedAt,
//       })),
//     });
//   } catch (error) {
//     console.error("Salary List Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // MODIFIED: Send salary slip to email instead of download
// export const downloadMySalarySlip = async (req, res) => {
//   try {
//     const record = await SalaryRecord.findOne({
//       _id: req.params.id,
//       employeeId: req.user._id,
//     });

//     if (!record) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary slip not found.",
//       });
//     }

//     // Get user details for email
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found.",
//       });
//     }

//     // ===== FIX: Check multiple email fields =====
//     let userEmail = user.email || user.personalEmail || user.personalEmailId || user.workEmail;
    
//     // If still no email, try to get from profile or additional fields
//     if (!userEmail && user.profile) {
//       userEmail = user.profile.email || user.profile.personalEmail;
//     }
    
//     // If still no email, check if there's an emergency contact email
//     if (!userEmail && user.emergencyContact) {
//       userEmail = user.emergencyContact.email;
//     }

//     if (!userEmail) {
//       return res.status(404).json({
//         success: false,
//         message: "User does not have an email address registered. Please update your profile with a valid email.",
//       });
//     }

//     // Create a temporary user object with the found email
//     const userWithEmail = {
//       ...user.toObject(),
//       email: userEmail
//     };

//     // Generate PDF
//     const pdfBuffer = await generateSalarySlipPdf(record);

//     // Send email with PDF attachment
//     await sendSalarySlipEmail(record, userWithEmail, pdfBuffer);

//     return res.status(200).json({
//       success: true,
//       message: `Salary slip sent successfully to ${userEmail}`,
//       data: {
//         employeeName: record.employeeName,
//         employeeCode: record.employeeCode,
//         month: MONTH_NAMES[record.month],
//         year: record.year,
//         sentTo: userEmail,
//         emailSource: user.email ? 'primary' : 'personalEmail'
//       }
//     });
//   } catch (error) {
//     console.error("Salary Email Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get salary batches (unchanged)
// export const getSalaryBatches = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to view salary upload batches.",
//       });
//     }

//     const batches = await SalaryBatch.find({})
//       .sort({ createdAt: -1 })
//       .limit(20)
//       .populate("uploadedBy", "username realName empId department");

//     const batchesWithFailed = batches.map(batch => {
//       const batchObj = batch.toObject();
//       if (batch.failedRecords && Array.isArray(batch.failedRecords)) {
//         batchObj.failedEmployees = batch.failedRecords.map(record => ({
//           employeeName: record.employeeName || record.employee || 'Unknown',
//           employeeCode: record.employeeCode || record.code || 'N/A',
//           reason: record.reason || 'Unknown error'
//         }));
//         batchObj.failedCount = batch.failedRecords.length;
//       }
//       return batchObj;
//     });

//     return res.json({ success: true, data: batchesWithFailed });
//   } catch (error) {
//     console.error("Salary Batch List Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get employee salary slips (unchanged)
// export const getEmployeeSalarySlips = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to view other employees' salary slips.",
//       });
//     }

//     const { employeeId, month, year } = req.query;
//     const employeeIdParam = req.params.employeeId;

//     const filter = {};
    
//     if (employeeIdParam) {
//       filter.employeeId = employeeIdParam;
//     } else if (employeeId) {
//       filter.employeeId = employeeId;
//     }

//     if (month) filter.month = Number(month);
//     if (year) filter.year = Number(year);

//     const records = await SalaryRecord.find(filter)
//       .sort({ year: -1, month: -1 })
//       .populate('employeeId', 'username email realName employeeCode department')
//       .select("month year employeeCode employeeName department designation createdAt updatedAt");

//     return res.json({
//       success: true,
//       data: records.map((record) => ({
//         _id: record._id,
//         month: record.month,
//         year: record.year,
//         monthName: MONTH_NAMES[record.month] || String(record.month),
//         employeeCode: record.employeeCode,
//         employeeName: record.employeeName,
//         department: record.department,
//         designation: record.designation,
//         employee: record.employeeId,
//         uploadedAt: record.createdAt,
//         updatedAt: record.updatedAt,
//       })),
//     });
//   } catch (error) {
//     console.error("Employee Salary List Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get employee salary status (unchanged)
// export const getEmployeeSalaryStatus = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to view this information.",
//       });
//     }

//     const { month, year } = req.query;
//     const monthNumber = Number(month);
//     const yearNumber = Number(year);

//     if (!monthNumber || !yearNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Month and year are required.",
//       });
//     }

//     const allUsers = await User.find({})
//       .select('_id username email realName employeeCode department designation role');

//     const salaryRecords = await SalaryRecord.find({
//       month: monthNumber,
//       year: yearNumber
//     }).select('employeeCode employeeId employeeName');

//     const salaryMap = new Map();
//     salaryRecords.forEach(record => {
//       if (record.employeeCode) {
//         salaryMap.set(record.employeeCode, record);
//       }
//       if (record.employeeId) {
//         salaryMap.set(record.employeeId.toString(), record);
//       }
//     });

//     const employeeStatus = allUsers.map(user => {
//       const hasSalary = salaryMap.has(user.employeeCode) || 
//                         salaryMap.has(user._id.toString());
      
//       const salaryRecord = hasSalary ? 
//         (salaryMap.get(user.employeeCode) || salaryMap.get(user._id.toString())) : null;

//       return {
//         employeeId: user._id,
//         employeeCode: user.employeeCode || 'N/A',
//         employeeName: user.realName || user.username || 'Unknown',
//         department: user.department || 'N/A',
//         designation: user.designation || 'N/A',
//         role: user.role || 'N/A',
//         hasSalarySlip: hasSalary,
//         hasUserAccount: true,
//         status: hasSalary ? 'Uploaded' : 'Pending',
//         reason: !hasSalary ? 'Salary not uploaded for this month' : null,
//         userId: user._id,
//         email: user.email,
//         username: user.username,
//         salaryRecordId: salaryRecord?._id || null
//       };
//     });

//     const filteredStatus = employeeStatus.filter(user => 
//       user.role === 'employee' || 
//       user.role === 'accounts' || 
//       user.role === 'hr' ||
//       user.role === 'admin'
//     );

//     const uploaded = filteredStatus.filter(e => e.hasSalarySlip);
//     const pending = filteredStatus.filter(e => !e.hasSalarySlip);

//     return res.json({
//       success: true,
//       data: {
//         month: monthNumber,
//         year: yearNumber,
//         monthName: MONTH_NAMES[monthNumber] || String(monthNumber),
//         total: filteredStatus.length,
//         uploaded: uploaded.length,
//         pending: pending.length,
//         noAccount: 0,
//         employees: filteredStatus,
//         uploadedEmployees: uploaded,
//         pendingEmployees: pending,
//         noAccountEmployees: []
//       }
//     });
//   } catch (error) {
//     console.error("Employee Salary Status Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // MODIFIED: Send employee salary slip to email instead of download
// export const downloadEmployeeSalarySlip = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to send this salary slip.",
//       });
//     }

//     const { id } = req.params;
//     const record = await SalaryRecord.findById(id);

//     if (!record) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary slip not found.",
//       });
//     }

//     // Get the employee user
//     const user = await User.findById(record.employeeId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee user not found. Cannot send email.",
//       });
//     }

//     // ===== FIX: Check multiple email fields =====
//     let userEmail = user.email || user.personalEmail || user.personalEmailId || user.workEmail;
    
//     // If still no email, try to get from profile or additional fields
//     if (!userEmail && user.profile) {
//       userEmail = user.profile.email || user.profile.personalEmail;
//     }
    
//     // If still no email, check if there's an emergency contact email
//     if (!userEmail && user.emergencyContact) {
//       userEmail = user.emergencyContact.email;
//     }

//     if (!userEmail) {
//       return res.status(404).json({
//         success: false,
//         message: `Employee ${user.realName || user.username} does not have an email address registered. Please update their profile.`,
//       });
//     }

//     // Create a temporary user object with the found email
//     const userWithEmail = {
//       ...user.toObject(),
//       email: userEmail
//     };

//     // Generate PDF
//     const pdfBuffer = await generateSalarySlipPdf(record);

//     // Send email with PDF attachment
//     await sendSalarySlipEmail(record, userWithEmail, pdfBuffer);

//     return res.status(200).json({
//       success: true,
//       message: `Salary slip sent successfully to ${userEmail}`,
//       data: {
//         employeeName: record.employeeName,
//         employeeCode: record.employeeCode,
//         month: MONTH_NAMES[record.month],
//         year: record.year,
//         sentTo: userEmail,
//         sentBy: req.user.realName || req.user.username,
//         emailSource: user.email ? 'primary' : 'personalEmail'
//       }
//     });
//   } catch (error) {
//     console.error("Employee Salary Email Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // NEW: Send bulk salary slips to all employees for a specific month/year
// export const sendBulkSalarySlips = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to send bulk salary slips.",
//       });
//     }

//     const { month, year } = req.body;
//     const monthNumber = Number(month);
//     const yearNumber = Number(year);

//     if (!monthNumber || !yearNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Month and year are required.",
//       });
//     }

//     // Get all salary records for the specified month/year
//     const records = await SalaryRecord.find({
//       month: monthNumber,
//       year: yearNumber
//     });

//     if (records.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No salary records found for ${MONTH_NAMES[monthNumber]} ${yearNumber}`,
//       });
//     }

//     // Get all users for these records
//     const userIds = records.map(r => r.employeeId);
//     const users = await User.find({ _id: { $in: userIds } });
//     const usersMap = new Map();
//     users.forEach(user => {
//       usersMap.set(user._id.toString(), user);
//       if (user.employeeCode) {
//         usersMap.set(user.employeeCode, user);
//       }
//     });

//     // Send emails
//     const results = await sendBulkSalarySlipsEmail(records, usersMap);

//     return res.status(200).json({
//       success: true,
//       message: `Bulk salary slips sent. Success: ${results.success.length}, Failed: ${results.failed.length}`,
//       data: {
//         month: monthNumber,
//         year: yearNumber,
//         monthName: MONTH_NAMES[monthNumber],
//         totalRecords: records.length,
//         successCount: results.success.length,
//         failedCount: results.failed.length,
//         successList: results.success,
//         failedList: results.failed
//       }
//     });
//   } catch (error) {
//     console.error("Bulk Salary Email Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// export const sendSalarySlipToEmail = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to send salary slips.",
//       });
//     }

//     const { id } = req.params;
//     const record = await SalaryRecord.findById(id);

//     if (!record) {
//       return res.status(404).json({
//         success: false,
//         message: "Salary slip not found.",
//       });
//     }

//     // Get the employee user
//     const user = await User.findById(record.employeeId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "Employee user not found. Cannot send email.",
//       });
//     }

//     // ===== FIX: Check multiple email fields =====
//     let userEmail = user.email || user.personalEmail || user.personalEmailId || user.workEmail;
    
//     if (!userEmail && user.profile) {
//       userEmail = user.profile.email || user.profile.personalEmail;
//     }
    
//     if (!userEmail && user.emergencyContact) {
//       userEmail = user.emergencyContact.email;
//     }

//     if (!userEmail) {
//       return res.status(404).json({
//         success: false,
//         message: `Employee ${user.realName || user.username} does not have an email address registered. Please update their profile.`,
//       });
//     }

//     // Create a temporary user object with the found email
//     const userWithEmail = {
//       ...user.toObject(),
//       email: userEmail
//     };

//     // Generate PDF
//     const pdfBuffer = await generateSalarySlipPdf(record);

//     // Send email with PDF attachment
//     await sendSalarySlipEmail(record, userWithEmail, pdfBuffer);

//     return res.status(200).json({
//       success: true,
//       message: `Salary slip sent successfully to ${userEmail}`,
//       data: {
//         employeeName: record.employeeName,
//         employeeCode: record.employeeCode,
//         month: MONTH_NAMES[record.month],
//         year: record.year,
//         sentTo: userEmail,
//         sentBy: req.user.realName || req.user.username,
//         emailSource: user.email ? 'primary' : 'personalEmail'
//       }
//     });
//   } catch (error) {
//     console.error("Send Salary Email Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get employee salary details (unchanged)
// export const getEmployeeSalaryDetails = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to view this information.",
//       });
//     }

//     const { employeeId } = req.params;
//     const { month, year } = req.query;

//     const filter = { employeeId: employeeId };
//     if (month) filter.month = Number(month);
//     if (year) filter.year = Number(year);

//     const records = await SalaryRecord.find(filter)
//       .sort({ year: -1, month: -1 })
//       .populate('employeeId', 'username email realName employeeCode department designation');

//     return res.json({
//       success: true,
//       data: records.map((record) => ({
//         _id: record._id,
//         month: record.month,
//         year: record.year,
//         monthName: MONTH_NAMES[record.month] || String(record.month),
//         employeeCode: record.employeeCode,
//         employeeName: record.employeeName,
//         department: record.department,
//         designation: record.designation,
//         employee: record.employeeId,
//         uploadedAt: record.createdAt,
//       })),
//     });
//   } catch (error) {
//     console.error("Employee Salary Details Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Get batch failed employees (unchanged)
// export const getBatchFailedEmployees = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to view this information.",
//       });
//     }

//     const { batchId } = req.params;
//     const batch = await SalaryBatch.findById(batchId);

//     if (!batch) {
//       return res.status(404).json({
//         success: false,
//         message: "Batch not found.",
//       });
//     }

//     const failedRecords = batch.failedRecords || [];
    
//     const enrichedFailed = await Promise.all(failedRecords.map(async (record) => {
//       let user = null;
//       if (record.employeeCode) {
//         user = await User.findOne({ employeeCode: record.employeeCode });
//       }
//       if (!user && record.employeeName) {
//         user = await User.findOne({ 
//           $or: [
//             { realName: { $regex: new RegExp('^' + record.employeeName + '$', 'i') } },
//             { username: { $regex: new RegExp('^' + record.employeeName + '$', 'i') } }
//           ]
//         });
//       }

//       return {
//         employeeName: record.employeeName || record.employee || 'Unknown',
//         employeeCode: record.employeeCode || record.code || 'N/A',
//         reason: record.reason || 'Unknown error',
//         rowNumber: record.rowNumber || 0,
//         existsInSystem: !!user,
//         userId: user?._id || null,
//         hasUserAccount: !!user,
//         userEmail: user?.email || null,
//         userUsername: user?.username || null,
//         department: user?.department || null,
//         realName: user?.realName || null,
//         role: user?.role || null
//       };
//     }));

//     return res.json({
//       success: true,
//       data: {
//         batchId: batch._id,
//         month: batch.month,
//         year: batch.year,
//         fileName: batch.fileName,
//         uploadedBy: batch.uploadedBy,
//         uploadedAt: batch.createdAt,
//         totalFailed: enrichedFailed.length,
//         failedEmployees: enrichedFailed,
//         summary: {
//           totalInSystem: enrichedFailed.filter(e => e.existsInSystem).length,
//           hasAccounts: enrichedFailed.filter(e => e.hasUserAccount).length,
//           missingAccounts: enrichedFailed.filter(e => !e.hasUserAccount && e.existsInSystem).length,
//           notInSystem: enrichedFailed.filter(e => !e.existsInSystem).length
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Batch Failed Employees Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// // Download failed employees as CSV (unchanged)
// export const downloadFailedEmployees = async (req, res) => {
//   try {
//     if (!canManageSalarySlips(req.user)) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to download this information.",
//       });
//     }

//     const { batchId } = req.params;
//     const batch = await SalaryBatch.findById(batchId);

//     if (!batch) {
//       return res.status(404).json({
//         success: false,
//         message: "Batch not found.",
//       });
//     }

//     const failedRecords = batch.failedRecords || [];
    
//     let csv = 'Sl. No.,Employee Name,Employee Code,Reason,Status in System\n';
//     failedRecords.forEach((record, index) => {
//       csv += `${index + 1},${record.employeeName || 'Unknown'},${record.employeeCode || 'N/A'},${record.reason || 'Unknown error'},Not Found\n`;
//     });

//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition', `attachment; filename="failed-employees-${batch.month}-${batch.year}.csv"`);
//     return res.send(csv);
//   } catch (error) {
//     console.error("Download Failed Employees Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };



import path from "path";
import XLSX from "xlsx";
import SalaryRecord from "../../Modals/SalarySlip/SalaryRecord.modal.js";
import SalaryBatch from "../../Modals/SalarySlip/SalaryBatch.modal.js";
import { generateSalarySlipPdf } from "../../services/salaryPdf.service.js";
import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../../utils/roleAccess.js";
import User from "../../Modals/User.modal.js";
import { sendSalarySlipEmail, sendBulkSalarySlipsEmail } from "../../services/email.service.js";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const isAccountsDepartment = (user = {}) => {
  const department = normalizeDepartment(user.department).toLowerCase();
  return department === "account" || department === "accounts";
};

const canManageSalarySlips = (user = {}) =>
  isSuperAdmin(user) || isHrDepartment(user) || isAccountsDepartment(user);

const parseMonthYear = ({ month, year }) => {
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (Number.isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return { error: "Invalid month." };
  }

  if (Number.isNaN(yearNumber) || yearNumber < 2020 || yearNumber > 2100) {
    return { error: "Invalid year." };
  }

  return { monthNumber, yearNumber };
};

// ==================== HELPER FUNCTIONS ====================

// Get column index by header name
const getColumnIndex = (headers, headerName) => {
  const index = headers.findIndex(h => 
    h && h.toString().trim().toLowerCase() === headerName.trim().toLowerCase()
  );
  return index;
};

// Safely get value from row
const getValue = (row, index) => {
  if (index === -1 || index >= row.length) return '';
  const value = row[index];
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

// Parse number from various formats
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Parse integer
const parseIntValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Normalize employee code
const normalizeEmployeeCode = (value) => {
  if (!value) return '';
  return String(value).trim().toUpperCase();
};

// Normalize name
const normalizeName = (value) => {
  if (!value) return '';
  return String(value).trim().replace(/\s+/g, ' ');
};

// Parse salary Excel file
const parseSalaryExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellDates: false,
    cellFormula: false,
    raw: true
  });

  const sheetName = Object.keys(workbook.Sheets).find(
    name => name.includes('Salary') || name.includes('Apr')
  );

  if (!sheetName) {
    throw new Error('Could not find salary sheet. Expected sheet name containing "Salary" or "Apr"');
  }

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  let headerRowIndex = -1;
  let headers = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('sl. no.') && rowStr.includes('pseudo name')) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }

  if (headerRowIndex === -1) {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      const rowStr = row.join(' ').toLowerCase();
      if (rowStr.includes('sl. no.') && rowStr.includes('gross salary')) {
        headerRowIndex = i;
        headers = row;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row in the Excel file.');
  }

  const employeeIdHeader = getColumnIndex(headers, 'Emp. ID');
  const pseudoNameHeader = getColumnIndex(headers, 'Pseduo NAME');
  const employeeNameHeader = getColumnIndex(headers, 'Employee Name');

  const rows = [];
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
      continue;
    }
    
    // ✅ FIX: Convert firstCol to string before using includes
    const firstCol = row[0];
    const firstColStr = firstCol !== null && firstCol !== undefined ? String(firstCol) : '';
    
    if (firstColStr && (firstColStr.includes('SUM') || firstColStr.includes('=') || firstColStr.includes('subtotal'))) {
      continue;
    }
    rows.push(row);
  }

  return {
    rows,
    employeeIdHeader,
    pseudoNameHeader,
    employeeNameHeader,
    headerRowIndex,
    headers
  };
};

// Find employee for salary row
const findEmployeeForSalaryRow = async ({
  row,
  employeeIdHeader,
  pseudoNameHeader,
  employeeNameHeader
}) => {
  const employeeCode = normalizeEmployeeCode(row[employeeIdHeader]);
  const pseudoName = normalizeName(row[pseudoNameHeader]);
  const employeeName = normalizeName(row[employeeNameHeader]);

  let lookupValue = employeeCode || pseudoName || employeeName || '';
  let employee = null;

  if (employeeCode) {
    employee = await User.findOne({
      $or: [
        { empId: employeeCode },
        { employeeCode: employeeCode },
        { 'profile.employeeCode': employeeCode }
      ]
    });
  }

  if (!employee && pseudoName) {
    employee = await User.findOne({
      $or: [
        { pseudoName: { $regex: new RegExp('^' + pseudoName + '$', 'i') } },
        { username: { $regex: new RegExp('^' + pseudoName + '$', 'i') } },
        { realName: { $regex: new RegExp('^' + pseudoName + '$', 'i') } }
      ]
    });
  }

  if (!employee && employeeName) {
    employee = await User.findOne({
      $or: [
        { realName: { $regex: new RegExp('^' + employeeName + '$', 'i') } },
        { username: { $regex: new RegExp('^' + employeeName + '$', 'i') } }
      ]
    });
  }

  return { employee, lookupValue };
};



const extractSalaryData = (row, headers) => {
  const columnMap = {
    grossSalary: getColumnIndex(headers, 'GROSS SALARY'),
    basicSalary: getColumnIndex(headers, 'BASIC SALARY'),
    hra: getColumnIndex(headers, 'HRA'),
    media: getColumnIndex(headers, 'MEDIA'),
    conv: getColumnIndex(headers, 'CONV'),
    totalSalary: getColumnIndex(headers, 'Total SALARY'),
    daysPayable: getColumnIndex(headers, 'DAYS PAYABLE'),
    basicPayable: getColumnIndex(headers, 'Basic Salary PAYABLE'),
    hraPayable: getColumnIndex(headers, 'HRA PAYABLE'),
    mediaPayable: getColumnIndex(headers, 'MEDI/A PAYABLE'),
    convPayable: getColumnIndex(headers, 'CONV PAYABLE'),
    salaryPayable: getColumnIndex(headers, 'Salary Payable'),
    otIncentive: getColumnIndex(headers, 'OT Incentive'),
    extraConveyance: getColumnIndex(headers, 'Extra Conveyance'),
    arrears: getColumnIndex(headers, 'Arrears'),
    epfPayable: getColumnIndex(headers, 'EPF Payable'),
    totalEarnings: getColumnIndex(headers, 'Total Earnigs'),
    advance: getColumnIndex(headers, 'ADVANCE'),
    ulNcnsDeduction: getColumnIndex(headers, 'UL/NCNS Deduction'),
    epfDeduction: getColumnIndex(headers, 'EPF Deduction'),
    esic: getColumnIndex(headers, 'ESIC'),
    lwf: getColumnIndex(headers, 'LWF Deduction'),
    tds: getColumnIndex(headers, 'T.D.S.'),
    totalDeduction: getColumnIndex(headers, 'TOTAL DEDUCTION'),
    netPay: getColumnIndex(headers, 'NET PAY'),
    perDaySalary: getColumnIndex(headers, 'Per Day Salary'),
    ul: getColumnIndex(headers, 'UL'),
    totalUl: getColumnIndex(headers, 'Total UL'),
    ncns: getColumnIndex(headers, 'NCNS'),
    totalNcns: getColumnIndex(headers, 'Total NCNS'),
    gTotal: getColumnIndex(headers, 'G Total'),
    
    // ===== NEW: Bank & Personal Details Column Mappings =====
    bankAccountNo: getColumnIndex(headers, 'Bank A/c No.'),
    panNo: getColumnIndex(headers, 'PAN NO.'),
    uanNo: getColumnIndex(headers, 'UAN NO.'),
    aadhaarNo: getColumnIndex(headers, 'Aadhaar No.'),
  };

  return {
    // Salary details
    grossSalary: parseNumber(row[columnMap.grossSalary]),
    basicSalary: parseNumber(row[columnMap.basicSalary]),
    hra: parseNumber(row[columnMap.hra]),
    media: parseNumber(row[columnMap.media]),
    conv: parseNumber(row[columnMap.conv]),
    totalSalary: parseNumber(row[columnMap.totalSalary]),
    daysPayable: parseIntValue(row[columnMap.daysPayable]),
    basicPayable: parseNumber(row[columnMap.basicPayable]),
    hraPayable: parseNumber(row[columnMap.hraPayable]),
    mediaPayable: parseNumber(row[columnMap.mediaPayable]),
    convPayable: parseNumber(row[columnMap.convPayable]),
    salaryPayable: parseNumber(row[columnMap.salaryPayable]),
    otIncentive: parseNumber(row[columnMap.otIncentive]),
    extraConveyance: parseNumber(row[columnMap.extraConveyance]),
    arrears: parseNumber(row[columnMap.arrears]),
    epfPayable: parseNumber(row[columnMap.epfPayable]),
    totalEarnings: parseNumber(row[columnMap.totalEarnings]),
    advance: parseNumber(row[columnMap.advance]),
    ulNcnsDeduction: parseNumber(row[columnMap.ulNcnsDeduction]),
    epfDeduction: parseNumber(row[columnMap.epfDeduction]),
    esic: parseNumber(row[columnMap.esic]),
    lwf: parseNumber(row[columnMap.lwf]),
    tds: parseNumber(row[columnMap.tds]),
    totalDeduction: parseNumber(row[columnMap.totalDeduction]),
    netPay: parseNumber(row[columnMap.netPay]),
    perDaySalary: parseNumber(row[columnMap.perDaySalary]),
    ul: parseIntValue(row[columnMap.ul]),
    totalUl: parseIntValue(row[columnMap.totalUl]),
    ncns: parseIntValue(row[columnMap.ncns]),
    totalNcns: parseIntValue(row[columnMap.totalNcns]),
    gTotal: parseNumber(row[columnMap.gTotal]),
    
    // ===== NEW: Bank & Personal Details Values =====
    bankAccountNo: getValue(row, columnMap.bankAccountNo) || 'N/A',
    panNo: getValue(row, columnMap.panNo) || 'N/A',
    uanNo: getValue(row, columnMap.uanNo) || 'N/A',
    aadhaarNo: getValue(row, columnMap.aadhaarNo) || 'N/A',
  };
};
// Extract salary data from row
// const extractSalaryData = (row, headers) => {
//   const columnMap = {
//     grossSalary: getColumnIndex(headers, 'GROSS SALARY'),
//     basicSalary: getColumnIndex(headers, 'BASIC SALARY'),
//     hra: getColumnIndex(headers, 'HRA'),
//     media: getColumnIndex(headers, 'MEDIA'),
//     conv: getColumnIndex(headers, 'CONV'),
//     totalSalary: getColumnIndex(headers, 'Total SALARY'),
//     daysPayable: getColumnIndex(headers, 'DAYS PAYABLE'),
//     basicPayable: getColumnIndex(headers, 'Basic Salary PAYABLE'),
//     hraPayable: getColumnIndex(headers, 'HRA PAYABLE'),
//     mediaPayable: getColumnIndex(headers, 'MEDI/A PAYABLE'),
//     convPayable: getColumnIndex(headers, 'CONV PAYABLE'),
//     salaryPayable: getColumnIndex(headers, 'Salary Payable'),
//     otIncentive: getColumnIndex(headers, 'OT Incentive'),
//     extraConveyance: getColumnIndex(headers, 'Extra Conveyance'),
//     arrears: getColumnIndex(headers, 'Arrears'),
//     epfPayable: getColumnIndex(headers, 'EPF Payable'),
//     totalEarnings: getColumnIndex(headers, 'Total Earnigs'),
//     advance: getColumnIndex(headers, 'ADVANCE'),
//     ulNcnsDeduction: getColumnIndex(headers, 'UL/NCNS Deduction'),
//     epfDeduction: getColumnIndex(headers, 'EPF Deduction'),
//     esic: getColumnIndex(headers, 'ESIC'),
//     lwf: getColumnIndex(headers, 'LWF Deduction'),
//     tds: getColumnIndex(headers, 'T.D.S.'),
//     totalDeduction: getColumnIndex(headers, 'TOTAL DEDUCTION'),
//     netPay: getColumnIndex(headers, 'NET PAY'),
//     perDaySalary: getColumnIndex(headers, 'Per Day Salary'),
//     ul: getColumnIndex(headers, 'UL'),
//     totalUl: getColumnIndex(headers, 'Total UL'),
//     ncns: getColumnIndex(headers, 'NCNS'),
//     totalNcns: getColumnIndex(headers, 'Total NCNS'),
//     gTotal: getColumnIndex(headers, 'G Total'),
//    bankAccountNo: getColumnIndex(headers, 'Bank A/c No.'),
//     panNo: getColumnIndex(headers, 'PAN NO.'),
//     uanNo: getColumnIndex(headers, 'UAN NO.'),
//     aadhaarNo: getColumnIndex(headers, 'Aadhaar No.'),
//   };

//   return {
//     grossSalary: parseNumber(row[columnMap.grossSalary]),
//     basicSalary: parseNumber(row[columnMap.basicSalary]),
//     hra: parseNumber(row[columnMap.hra]),
//     media: parseNumber(row[columnMap.media]),
//     conv: parseNumber(row[columnMap.conv]),
//     totalSalary: parseNumber(row[columnMap.totalSalary]),
//     daysPayable: parseIntValue(row[columnMap.daysPayable]),
//     basicPayable: parseNumber(row[columnMap.basicPayable]),
//     hraPayable: parseNumber(row[columnMap.hraPayable]),
//     mediaPayable: parseNumber(row[columnMap.mediaPayable]),
//     convPayable: parseNumber(row[columnMap.convPayable]),
//     salaryPayable: parseNumber(row[columnMap.salaryPayable]),
//     otIncentive: parseNumber(row[columnMap.otIncentive]),
//     extraConveyance: parseNumber(row[columnMap.extraConveyance]),
//     arrears: parseNumber(row[columnMap.arrears]),
//     epfPayable: parseNumber(row[columnMap.epfPayable]),
//     totalEarnings: parseNumber(row[columnMap.totalEarnings]),
//     advance: parseNumber(row[columnMap.advance]),
//     ulNcnsDeduction: parseNumber(row[columnMap.ulNcnsDeduction]),
//     epfDeduction: parseNumber(row[columnMap.epfDeduction]),
//     esic: parseNumber(row[columnMap.esic]),
//     lwf: parseNumber(row[columnMap.lwf]),
//     tds: parseNumber(row[columnMap.tds]),
//     totalDeduction: parseNumber(row[columnMap.totalDeduction]),
//     netPay: parseNumber(row[columnMap.netPay]),
//     perDaySalary: parseNumber(row[columnMap.perDaySalary]),
//     ul: parseIntValue(row[columnMap.ul]),
//     totalUl: parseIntValue(row[columnMap.totalUl]),
//     ncns: parseIntValue(row[columnMap.ncns]),
//     totalNcns: parseIntValue(row[columnMap.totalNcns]),
//     gTotal: parseNumber(row[columnMap.gTotal]),
//     bankAccountNo: getValue(row, columnMap.bankAccountNo) || 'N/A',
//     panNo: getValue(row, columnMap.panNo) || 'N/A',
//     uanNo: getValue(row, columnMap.uanNo) || 'N/A',
//     aadhaarNo: getValue(row, columnMap.aadhaarNo) || 'N/A',
//   };
// };

// ==================== IMPORT SALARY EXCEL FUNCTION ====================

export const importSalaryExcel = async ({
  fileBuffer,
  month,
  year,
  uploadedBy,
  fileName,
}) => {
  try {
    const parsedExcel = parseSalaryExcel(fileBuffer);
    const {
      rows,
      employeeIdHeader,
      pseudoNameHeader,
      employeeNameHeader,
      headerRowIndex,
      headers,
    } = parsedExcel;

    console.log(
      `[SalarySlip] Import started: ${fileName}, rows=${rows.length}, month=${month}, year=${year}`
    );

    const batch = await SalaryBatch.create({
      month,
      year,
      fileName,
      uploadedBy,
      totalRows: rows.length,
      status: "Processing",
    });

    let successRows = 0;
    let failedRows = 0;
    const failedRecords = [];

    if (employeeIdHeader === -1) {
      batch.failedRows = rows.length;
      batch.status = "Failed";
      batch.remarks = `Employee ID column not found. Headers detected: ${headers.join(", ") || "none"}`;
      await batch.save();

      return {
        success: false,
        batch,
        batchId: batch._id,
        totalRows: rows.length,
        successRows: 0,
        failedRows: rows.length,
        failedRecords: [{
          employee: "",
          reason: "Employee ID column not found in Excel header row",
        }],
      };
    }

    for (const row of rows) {
      try {
        const employeeCode = normalizeEmployeeCode(row[employeeIdHeader]);
        const pseudoName = normalizeName(row[pseudoNameHeader]);
        const employeeName = normalizeName(row[employeeNameHeader]);

        if (!employeeCode && !pseudoName && !employeeName) {
          failedRows++;
          failedRecords.push({
            employee: "",
            reason: "Employee identifiers missing",
          });
          continue;
        }

        const { employee, lookupValue } = await findEmployeeForSalaryRow({
          row,
          employeeIdHeader,
          pseudoNameHeader,
          employeeNameHeader,
        });

        if (!employee) {
          failedRows++;
          failedRecords.push({
            employee: lookupValue,
            reason: "Employee not found in system",
          });
          continue;
        }

        // Delete existing record if any
        await SalaryRecord.deleteOne({
          employeeId: employee._id,
          month,
          year,
        });

        const salaryData = extractSalaryData(row, headers);

        await SalaryRecord.create({
          batchId: batch._id,
          employeeId: employee._id,
          month,
          year,
          employeeCode: employee.empId || employee.employeeCode || employeeCode,
          employeeName: employee.realName || employee.username || employeeName,
          pseudoName: employee.pseudoName || pseudoName || "",
          department: employee.department || "",
          designation: employee.designation || "",
          joiningDate: employee.dateOfJoining,
          salaryData: salaryData,
          uploadedBy,
          ...salaryData,
        });

        successRows++;
      } catch (err) {
        failedRows++;
        failedRecords.push({
          employee: normalizeEmployeeCode(row[employeeIdHeader]),
          reason: err.message,
        });
      }
    }

    batch.successRows = successRows;
    batch.failedRows = failedRows;
    batch.status = successRows > 0 ? "Completed" : "Failed";
    batch.remarks = failedRecords.slice(0, 10).map((item) => 
      `${item.employee || "Unknown"}: ${item.reason}`
    ).join("; ");
    batch.failedRecords = failedRecords;

    await batch.save();

    console.log(`[SalarySlip] Import finished: success=${successRows}, failed=${failedRows}`);

    return {
      success: true,
      batch,
      batchId: batch._id,
      totalRows: rows.length,
      successRows,
      failedRows,
      failedRecords,
    };

  } catch (error) {
    console.error('Import Error:', error);
    throw new Error(`Failed to import salary data: ${error.message}`);
  }
};

// ==================== UPLOAD SALARY EXCEL CONTROLLER ====================

export const uploadSalaryExcel = async (req, res) => {
  try {
    // Check authorization
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload salary sheets.",
      });
    }

    // Parse month/year
    const parsed = parseMonthYear(req.body);
    if (parsed.error) {
      return res.status(400).json({ 
        success: false, 
        message: parsed.error 
      });
    }

    // Check if file exists - using the field name from your middleware 'excelFile'
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file. Field name should be 'excelFile'.",
      });
    }

    // Log file info for debugging
    console.log(`📁 File received: ${req.file.originalname}, Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);

    // Validate file extension
    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (![".xlsx", ".xls"].includes(extension)) {
      return res.status(400).json({
        success: false,
        message: "Only Excel (.xlsx, .xls) files are allowed.",
      });
    }

    // Import the salary data
    const result = await importSalaryExcel({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      month: parsed.monthNumber,
      year: parsed.yearNumber,
      uploadedBy: req.user._id,
    });

    // Prepare failed records for response
    const failedRecords = result.failedRecords || [];
    const failedEmployees = failedRecords.map(record => ({
      employeeName: record.employeeName || record.employee || 'Unknown',
      employeeCode: record.employeeCode || record.code || 'N/A',
      reason: record.reason || 'Unknown error',
      rowNumber: record.rowNumber || 0
    }));

    // If batch was created, update failed records
    if (result.batchId) {
      try {
        await SalaryBatch.findByIdAndUpdate(result.batchId, {
          failedRecords: failedRecords.map(record => ({
            employee: record.employee || record.employeeName || 'Unknown',
            employeeName: record.employeeName || record.employee || 'Unknown',
            employeeCode: record.employeeCode || record.code || 'N/A',
            reason: record.reason || 'Unknown error',
            rowNumber: record.rowNumber || 0
          }))
        });
      } catch (batchError) {
        console.warn('Could not update batch with failed records:', batchError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: (result.failedRows || 0) === 0 
        ? "Salary sheet uploaded successfully." 
        : `Salary sheet uploaded with ${result.failedRows || 0} failed records.`,
      data: {
        batchId: result.batchId,
        totalRecords: result.successRows || 0,
        totalFailed: result.failedRows || 0,
        failedEmployees: failedEmployees,
        failedRecords: failedRecords,
        summary: {
          totalProcessed: (result.successRows || 0) + (result.failedRows || 0),
          validRecords: result.successRows || 0,
          invalidRecords: result.failedRows || 0
        }
      },
    });

  } catch (error) {
    console.error("Salary Upload Error:", error);
    
    let statusCode = 500;
    let errorMessage = error.message || "Internal Server Error";
    
    if (errorMessage.includes('Could not find salary sheet') || 
        errorMessage.includes('No valid salary records') ||
        errorMessage.includes('file format') ||
        errorMessage.includes('header row')) {
      statusCode = 400;
    }
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==================== REST OF YOUR CONTROLLERS ====================

export const getMySalarySlips = async (req, res) => {
  try {
    const records = await SalaryRecord.find({ employeeId: req.user._id })
      .sort({ year: -1, month: -1 })
      .select("month year employeeCode employeeName department designation createdAt updatedAt");

    return res.json({
      success: true,
      data: records.map((record) => ({
        _id: record._id,
        month: record.month,
        year: record.year,
        monthName: MONTH_NAMES[record.month] || String(record.month),
        employeeCode: record.employeeCode,
        employeeName: record.employeeName,
        department: record.department,
        designation: record.designation,
        uploadedAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Salary List Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Send my salary slip to email
export const downloadMySalarySlip = async (req, res) => {
  try {
    const record = await SalaryRecord.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let userEmail = user.email || user.personalEmail || user.personalEmailId || user.workEmail;
    
    if (!userEmail && user.profile) {
      userEmail = user.profile.email || user.profile.personalEmail;
    }
    
    if (!userEmail && user.emergencyContact) {
      userEmail = user.emergencyContact.email;
    }

    if (!userEmail) {
      return res.status(404).json({
        success: false,
        message: "User does not have an email address registered.",
      });
    }

    const userWithEmail = {
      ...user.toObject(),
      email: userEmail
    };

    const pdfBuffer = await generateSalarySlipPdf(record);
    await sendSalarySlipEmail(record, userWithEmail, pdfBuffer);

    return res.status(200).json({
      success: true,
      message: `Salary slip sent successfully to ${userEmail}`,
      data: {
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        month: MONTH_NAMES[record.month],
        year: record.year,
        sentTo: userEmail,
      }
    });
  } catch (error) {
    console.error("Salary Email Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get salary batches
export const getSalaryBatches = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view salary upload batches.",
      });
    }

    const batches = await SalaryBatch.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("uploadedBy", "username realName empId department");

    const batchesWithFailed = batches.map(batch => {
      const batchObj = batch.toObject();
      if (batch.failedRecords && Array.isArray(batch.failedRecords)) {
        batchObj.failedEmployees = batch.failedRecords.map(record => ({
          employeeName: record.employeeName || record.employee || 'Unknown',
          employeeCode: record.employeeCode || record.code || 'N/A',
          reason: record.reason || 'Unknown error'
        }));
        batchObj.failedCount = batch.failedRecords.length;
      }
      return batchObj;
    });

    return res.json({ success: true, data: batchesWithFailed });
  } catch (error) {
    console.error("Salary Batch List Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


// Get employee salary slips
export const getEmployeeSalarySlips = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view other employees' salary slips.",
      });
    }

    const { employeeId, month, year } = req.query;
    const employeeIdParam = req.params.employeeId;

    const filter = {};
    
    if (employeeIdParam) {
      filter.employeeId = employeeIdParam;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const records = await SalaryRecord.find(filter)
      .sort({ year: -1, month: -1 })
      .populate('employeeId', 'username email realName employeeCode department')
      .select("month year employeeCode employeeName department designation createdAt updatedAt");

    return res.json({
      success: true,
      data: records.map((record) => ({
        _id: record._id,
        month: record.month,
        year: record.year,
        monthName: MONTH_NAMES[record.month] || String(record.month),
        employeeCode: record.employeeCode,
        employeeName: record.employeeName,
        department: record.department,
        designation: record.designation,
        employee: record.employeeId,
        uploadedAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Employee Salary List Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get employee salary status
export const getEmployeeSalaryStatus = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this information.",
      });
    }

    const { month, year } = req.query;
    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (!monthNumber || !yearNumber) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required.",
      });
    }

    const allUsers = await User.find({})
      .select('_id username email realName employeeCode department designation role');

    const salaryRecords = await SalaryRecord.find({
      month: monthNumber,
      year: yearNumber
    }).select('employeeCode employeeId employeeName');

    const salaryMap = new Map();
    salaryRecords.forEach(record => {
      if (record.employeeCode) {
        salaryMap.set(record.employeeCode, record);
      }
      if (record.employeeId) {
        salaryMap.set(record.employeeId.toString(), record);
      }
    });

    const employeeStatus = allUsers.map(user => {
      const hasSalary = salaryMap.has(user.employeeCode) || 
                        salaryMap.has(user._id.toString());
      
      const salaryRecord = hasSalary ? 
        (salaryMap.get(user.employeeCode) || salaryMap.get(user._id.toString())) : null;

      return {
        employeeId: user._id,
        employeeCode: user.employeeCode || 'N/A',
        employeeName: user.realName || user.username || 'Unknown',
        department: user.department || 'N/A',
        designation: user.designation || 'N/A',
        role: user.role || 'N/A',
        hasSalarySlip: hasSalary,
        hasUserAccount: true,
        status: hasSalary ? 'Uploaded' : 'Pending',
        reason: !hasSalary ? 'Salary not uploaded for this month' : null,
        userId: user._id,
        email: user.email,
        username: user.username,
        salaryRecordId: salaryRecord?._id || null
      };
    });

    const filteredStatus = employeeStatus.filter(user => 
      user.role === 'employee' || 
      user.role === 'accounts' || 
      user.role === 'hr' ||
      user.role === 'admin'
    );

    const uploaded = filteredStatus.filter(e => e.hasSalarySlip);
    const pending = filteredStatus.filter(e => !e.hasSalarySlip);

    return res.json({
      success: true,
      data: {
        month: monthNumber,
        year: yearNumber,
        monthName: MONTH_NAMES[monthNumber] || String(monthNumber),
        total: filteredStatus.length,
        uploaded: uploaded.length,
        pending: pending.length,
        noAccount: 0,
        employees: filteredStatus,
        uploadedEmployees: uploaded,
        pendingEmployees: pending,
        noAccountEmployees: []
      }
    });
  } catch (error) {
    console.error("Employee Salary Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Send employee salary slip to email
// ==================== DOWNLOAD EMPLOYEE SALARY SLIP PDF ====================
export const downloadEmployeeSalarySlip = async (req, res) => {
  try {
    // Check authorization - only HR, Accounts, SuperAdmin can download
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this salary slip.",
      });
    }

    const { id } = req.params;
    const record = await SalaryRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found.",
      });
    }

    // Generate PDF
    const pdfBuffer = await generateSalarySlipPdf(record);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    // Create filename
    const sanitizedName = (record.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
    const monthName = MONTH_NAMES[record.month] || record.month;
    const fileName = `Salary_Slip_${sanitizedName}_${monthName}_${record.year}.pdf`;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    return res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Download Employee Salary PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// ==================== DOWNLOAD MY SALARY SLIP PDF ====================
export const downloadMySalarySlipPdf = async (req, res) => {
  try {
    const record = await SalaryRecord.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found.",
      });
    }

    // Generate PDF
    const pdfBuffer = await generateSalarySlipPdf(record);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    // Create filename
    const sanitizedName = (record.employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
    const monthName = MONTH_NAMES[record.month] || record.month;
    const fileName = `Salary_Slip_${sanitizedName}_${monthName}_${record.year}.pdf`;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    return res.send(pdfBuffer);
    
  } catch (error) {
    console.error("Download My Salary PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Send bulk salary slips
export const sendBulkSalarySlips = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send bulk salary slips.",
      });
    }

    const { month, year } = req.body;
    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (!monthNumber || !yearNumber) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required.",
      });
    }

    const records = await SalaryRecord.find({
      month: monthNumber,
      year: yearNumber
    });

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No salary records found for ${MONTH_NAMES[monthNumber]} ${yearNumber}`,
      });
    }

    const userIds = records.map(r => r.employeeId);
    const users = await User.find({ _id: { $in: userIds } });
    const usersMap = new Map();
    users.forEach(user => {
      usersMap.set(user._id.toString(), user);
      if (user.employeeCode) {
        usersMap.set(user.employeeCode, user);
      }
    });

    const results = await sendBulkSalarySlipsEmail(records, usersMap);

    return res.status(200).json({
      success: true,
      message: `Bulk salary slips sent. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: {
        month: monthNumber,
        year: yearNumber,
        monthName: MONTH_NAMES[monthNumber],
        totalRecords: records.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        successList: results.success,
        failedList: results.failed
      }
    });
  } catch (error) {
    console.error("Bulk Salary Email Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Send single salary slip to email
export const sendSalarySlipToEmail = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to send salary slips.",
      });
    }

    const { id } = req.params;
    const record = await SalaryRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Salary slip not found.",
      });
    }

    const user = await User.findById(record.employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee user not found.",
      });
    }

    let userEmail = user.email || user.personalEmail || user.personalEmailId || user.workEmail;
    
    if (!userEmail && user.profile) {
      userEmail = user.profile.email || user.profile.personalEmail;
    }
    
    if (!userEmail && user.emergencyContact) {
      userEmail = user.emergencyContact.email;
    }

    if (!userEmail) {
      return res.status(404).json({
        success: false,
        message: `Employee ${user.realName || user.username} does not have an email address registered.`,
      });
    }

    const userWithEmail = {
      ...user.toObject(),
      email: userEmail
    };

    const pdfBuffer = await generateSalarySlipPdf(record);
    await sendSalarySlipEmail(record, userWithEmail, pdfBuffer);

    return res.status(200).json({
      success: true,
      message: `Salary slip sent successfully to ${userEmail}`,
      data: {
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        month: MONTH_NAMES[record.month],
        year: record.year,
        sentTo: userEmail,
        sentBy: req.user.realName || req.user.username,
      }
    });
  } catch (error) {
    console.error("Send Salary Email Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get employee salary details
export const getEmployeeSalaryDetails = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this information.",
      });
    }

    const { employeeId } = req.params;
    const { month, year } = req.query;

    const filter = { employeeId: employeeId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const records = await SalaryRecord.find(filter)
      .sort({ year: -1, month: -1 })
      .populate('employeeId', 'username email realName employeeCode department designation');

    return res.json({
      success: true,
      data: records.map((record) => ({
        _id: record._id,
        month: record.month,
        year: record.year,
        monthName: MONTH_NAMES[record.month] || String(record.month),
        employeeCode: record.employeeCode,
        employeeName: record.employeeName,
        department: record.department,
        designation: record.designation,
        employee: record.employeeId,
        uploadedAt: record.createdAt,
      })),
    });
  } catch (error) {
    console.error("Employee Salary Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Get batch failed employees
export const getBatchFailedEmployees = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this information.",
      });
    }

    const { batchId } = req.params;
    const batch = await SalaryBatch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    const failedRecords = batch.failedRecords || [];
    
    const enrichedFailed = await Promise.all(failedRecords.map(async (record) => {
      let user = null;
      if (record.employeeCode) {
        user = await User.findOne({ employeeCode: record.employeeCode });
      }
      if (!user && record.employeeName) {
        user = await User.findOne({ 
          $or: [
            { realName: { $regex: new RegExp('^' + record.employeeName + '$', 'i') } },
            { username: { $regex: new RegExp('^' + record.employeeName + '$', 'i') } }
          ]
        });
      }

      return {
        employeeName: record.employeeName || record.employee || 'Unknown',
        employeeCode: record.employeeCode || record.code || 'N/A',
        reason: record.reason || 'Unknown error',
        rowNumber: record.rowNumber || 0,
        existsInSystem: !!user,
        userId: user?._id || null,
        hasUserAccount: !!user,
        userEmail: user?.email || null,
        userUsername: user?.username || null,
        department: user?.department || null,
        realName: user?.realName || null,
        role: user?.role || null
      };
    }));

    return res.json({
      success: true,
      data: {
        batchId: batch._id,
        month: batch.month,
        year: batch.year,
        fileName: batch.fileName,
        uploadedBy: batch.uploadedBy,
        uploadedAt: batch.createdAt,
        totalFailed: enrichedFailed.length,
        failedEmployees: enrichedFailed,
        summary: {
          totalInSystem: enrichedFailed.filter(e => e.existsInSystem).length,
          hasAccounts: enrichedFailed.filter(e => e.hasUserAccount).length,
          missingAccounts: enrichedFailed.filter(e => !e.hasUserAccount && e.existsInSystem).length,
          notInSystem: enrichedFailed.filter(e => !e.existsInSystem).length
        }
      }
    });
  } catch (error) {
    console.error("Batch Failed Employees Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Download failed employees as CSV
export const downloadFailedEmployees = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download this information.",
      });
    }

    const { batchId } = req.params;
    const batch = await SalaryBatch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    const failedRecords = batch.failedRecords || [];
    
    let csv = 'Sl. No.,Employee Name,Employee Code,Reason,Status in System\n';
    failedRecords.forEach((record, index) => {
      csv += `${index + 1},${record.employeeName || 'Unknown'},${record.employeeCode || 'N/A'},${record.reason || 'Unknown error'},Not Found\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="failed-employees-${batch.month}-${batch.year}.csv"`);
    return res.send(csv);
  } catch (error) {
    console.error("Download Failed Employees Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};