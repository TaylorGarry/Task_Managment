// import path from "path";
// import SalaryRecord from "../../Modals/SalarySlip/SalaryRecord.modal.js";
// import SalaryBatch from "../../Modals/SalarySlip/SalaryBatch.modal.js";
// import { importSalaryExcel } from "../../services/salaryExcel.service.js";
// import { generateSalarySlipPdf } from "../../services/salaryPdf.service.js";
// import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../../utils/roleAccess.js";

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

//     return res.status(200).json({
//       success: true,
//       message: "Salary sheet uploaded successfully.",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Salary Upload Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

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

//     const pdfBuffer = await generateSalarySlipPdf(record);
//     const fileName = `salary-slip-${record.employeeCode}-${record.year}-${String(record.month).padStart(2, "0")}.pdf`;

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//     return res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Salary PDF Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

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

//     return res.json({ success: true, data: batches });
//   } catch (error) {
//     console.error("Salary Batch List Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };










import path from "path";
import SalaryRecord from "../../Modals/SalarySlip/SalaryRecord.modal.js";
import SalaryBatch from "../../Modals/SalarySlip/SalaryBatch.modal.js";
import { importSalaryExcel } from "../../services/salaryExcel.service.js";
import { generateSalarySlipPdf } from "../../services/salaryPdf.service.js";
import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../../utils/roleAccess.js";
import User from "../../Modals/User.modal.js";
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

//     return res.status(200).json({
//       success: true,
//       message: "Salary sheet uploaded successfully.",
//       data: {
//         ...result,
//         failedEmployees: failedEmployees,
//         totalFailed: failedEmployees.length
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


// In salarySlip.controller.js - update the uploadSalaryExcel function

export const uploadSalaryExcel = async (req, res) => {
  try {
    if (!canManageSalarySlips(req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload salary sheets.",
      });
    }

    const parsed = parseMonthYear(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file.",
      });
    }

    const extension = path.extname(req.file.originalname || "").toLowerCase();
    if (![".xlsx", ".xls"].includes(extension)) {
      return res.status(400).json({
        success: false,
        message: "Only Excel (.xlsx, .xls) files are allowed.",
      });
    }

    const result = await importSalaryExcel({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      month: parsed.monthNumber,
      year: parsed.yearNumber,
      uploadedBy: req.user._id,
    });

    // ===== FIX: Ensure failedRecords are properly stored =====
    const failedRecords = result.failedRecords || [];
    
    // Create failed employees list with proper data
    const failedEmployees = failedRecords.map(record => ({
      employeeName: record.employeeName || record.employee || 'Unknown',
      employeeCode: record.employeeCode || record.code || 'N/A',
      reason: record.reason || 'Unknown error',
      rowNumber: record.rowNumber || 0
    }));

    // Update the batch with failed records if not already stored
    if (result.batchId) {
      await SalaryBatch.findByIdAndUpdate(result.batchId, {
        failedRecords: failedRecords.map(record => ({
          employee: record.employee || record.employeeName || 'Unknown',
          employeeName: record.employeeName || record.employee || 'Unknown',
          employeeCode: record.employeeCode || record.code || 'N/A',
          reason: record.reason || 'Unknown error',
          rowNumber: record.rowNumber || 0
        }))
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salary sheet uploaded successfully.",
      data: {
        ...result,
        failedEmployees: failedEmployees,
        totalFailed: failedEmployees.length,
        failedRecords: failedRecords // Make sure this is included
      },
    });
  } catch (error) {
    console.error("Salary Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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

    const pdfBuffer = await generateSalarySlipPdf(record);
    const fileName = `salary-slip-${record.employeeCode}-${record.year}-${String(record.month).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Salary PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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

// ========== HR/Accounts Only Controllers ==========

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

    // Get ALL users (not just employees) since accounts team might have different roles
    const allUsers = await User.find({})
      .select('_id username email realName employeeCode department designation role');

    // Get salary records for the specified month/year
    const salaryRecords = await SalaryRecord.find({
      month: monthNumber,
      year: yearNumber
    }).select('employeeCode employeeId employeeName');

    // Create a map of employeeCode to salary record
    const salaryMap = new Map();
    salaryRecords.forEach(record => {
      if (record.employeeCode) {
        salaryMap.set(record.employeeCode, record);
      }
      if (record.employeeId) {
        salaryMap.set(record.employeeId.toString(), record);
      }
    });

    // Map user status
    const employeeStatus = allUsers.map(user => {
      // Check if user has salary record by employeeCode or userId
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

    // Filter to only show users who should have salary slips (employees, accounts, hr, etc.)
    // You can adjust this filter based on your needs
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

export const downloadEmployeeSalarySlip = async (req, res) => {
  try {
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

    const pdfBuffer = await generateSalarySlipPdf(record);
    const fileName = `salary-slip-${record.employeeCode}-${record.year}-${String(record.month).padStart(2, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Employee Salary PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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
//         user = await User.findOne({ realName: record.employeeName });
//       }
//       if (!user && record.employeeName) {
//         user = await User.findOne({ username: record.employeeName });
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

// Get employee by ID or employeeCode for downloading
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
// In salarySlip.controller.js

// Get failed employees from a specific batch
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

    // Get failed employees with details
    const failedRecords = batch.failedRecords || [];
    
    // Try to find if these employees exist in the system
    const enrichedFailed = await Promise.all(failedRecords.map(async (record) => {
      // Try to find user by employeeCode or realName
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
    
    // Create CSV
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