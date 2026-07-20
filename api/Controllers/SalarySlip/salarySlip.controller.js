import path from "path";
import SalaryRecord from "../../Modals/SalarySlip/SalaryRecord.modal.js";
import SalaryBatch from "../../Modals/SalarySlip/SalaryBatch.modal.js";
import { importSalaryExcel } from "../../services/salaryExcel.service.js";
import { generateSalarySlipPdf } from "../../services/salaryPdf.service.js";
import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../../utils/roleAccess.js";

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

    return res.status(200).json({
      success: true,
      message: "Salary sheet uploaded successfully.",
      data: result,
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

    return res.json({ success: true, data: batches });
  } catch (error) {
    console.error("Salary Batch List Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
