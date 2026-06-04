import mongoose from "mongoose";
import { createHash } from "crypto";
import XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
import PayrollAttendance from "../Modals/PayrollAttendance.modal.js";
import PayrollAttendanceBatch from "../Modals/PayrollAttendanceBatch.modal.js";
import User from "../Modals/User.modal.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const VALID_STATUS_CODES = new Set(["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", "OT"]);

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const toIstDateKey = (value) => {
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

const parseDateKeyToUtcNoon = (dateKey) => {
  const raw = String(dateKey || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [yearText, monthText, dayText] = raw.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
};

const parseYmdRangeDate = (value) => {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [yearText, monthText, dayText] = raw.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
};

const parseExcelDateHeader = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);
    if (!parts || !Number.isFinite(parts.y) || !Number.isFinite(parts.m) || !Number.isFinite(parts.d)) return null;
    return toIstDateKey(new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12, 0, 0, 0)));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIstDateKey(parsed);
};

const parseStatusCode = (value) => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return null;
  if (raw === "WOP") return "WO";
  return VALID_STATUS_CODES.has(raw) ? raw : null;
};

const isPayrollExportAllowed = (userLike = {}) => {
  const roleType = String(getRoleType(userLike) || "").trim();
  if (roleType === "superAdmin") return true;
  const normalizedDepartment = normalizeDepartment(userLike?.department).toLowerCase();
  return normalizedDepartment === "account" || normalizedDepartment === "accounts";
};

const getIdLookup = (users, field) => {
  const map = new Map();
  users.forEach((user) => {
    const key = normalizeText(user?.[field]);
    if (!key || map.has(key)) return;
    map.set(key, user);
  });
  return map;
};

const resolveUserFromRow = (rowIdentity, lookups) => {
  const candidates = [
    ["empId", lookups.byEmpId],
    ["pseudoName", lookups.byPseudoName],
    ["username", lookups.byUsername],
    ["realName", lookups.byRealName],
  ];

  for (const [field, map] of candidates) {
    const key = normalizeText(rowIdentity?.[field]);
    if (!key) continue;
    const user = map.get(key);
    if (user) return user;
  }
  return null;
};

const createStableObjectIdFromText = (text) => {
  const hex = createHash("sha1").update(String(text || "")).digest("hex").slice(0, 24);
  return new mongoose.Types.ObjectId(hex);
};

const buildExcelPayload = async ({ buffer, startDate, endDate }) => {
  const start = parseYmdRangeDate(startDate);
  const end = parseYmdRangeDate(endDate);
  if (!start || !end) {
    throw new Error("startDate and endDate are required in YYYY-MM-DD format.");
  }
  if (start > end) {
    throw new Error("startDate cannot be after endDate.");
  }
  if (!buffer) {
    throw new Error("Excel file buffer is required.");
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    throw new Error("Excel has no worksheet.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  if (!Array.isArray(rows) || rows.length < 3) {
    throw new Error("Excel must include header rows and data rows.");
  }

  const normalizeHeaderRow = (row = []) => row.map((cell) => normalizeText(cell));
  const headerRowIndex = rows.findIndex((row) => {
    const normalized = normalizeHeaderRow(row);
    const hasIdentityColumn = normalized.some((cell) =>
      ["agent", "pseudo name", "pseudoname", "employee name", "employee", "real name", "username", "name", "employee id", "emp id", "empid"].includes(cell)
    );
    const hasDates = row.some((cell) => Boolean(parseExcelDateHeader(cell)));
    return hasIdentityColumn && hasDates;
  });

  if (headerRowIndex === -1) {
    throw new Error("Excel must include a header row with employee identifiers and date columns.");
  }

  const headerRow = rows[headerRowIndex] || [];
  const findColIndex = (names = []) => {
    const wanted = new Set(names.map((name) => normalizeText(name)));
    for (let i = 0; i < headerRow.length; i += 1) {
      if (wanted.has(normalizeText(headerRow[i]))) return i;
    }
    return -1;
  };

  const empIdColIndex = findColIndex(["Employee ID", "Emp ID", "EmpId", "EMPID"]);
  const pseudoNameColIndex = findColIndex(["AGENT", "Agent", "Pseudo Name", "PseudoName", "Employee Name", "EmployeeName", "Name"]);
  const usernameColIndex = findColIndex(["Username", "User Name", "UserName"]);
  const realNameColIndex = findColIndex(["Real Name", "RealName"]);

  if (empIdColIndex === -1 && pseudoNameColIndex === -1 && usernameColIndex === -1 && realNameColIndex === -1) {
    throw new Error("Excel must contain at least one recognizable employee identity column.");
  }

  const dateColumns = [];
  for (let col = 0; col < headerRow.length; col += 1) {
    const dateKey = parseExcelDateHeader(headerRow[col]);
    if (!dateKey) continue;
    if (dateKey < String(startDate) || dateKey > String(endDate)) continue;
    dateColumns.push({ col, dateKey });
  }

  if (dateColumns.length === 0) {
    throw new Error(`No date columns found within selected range ${startDate} to ${endDate}.`);
  }

  const weekdayNames = new Set(["mon", "monday", "tue", "tuesday", "wed", "wednesday", "thu", "thursday", "fri", "friday", "sat", "saturday", "sun", "sunday"]);
  let dataStartIndex = headerRowIndex + 1;
  const possibleWeekdayRow = rows[dataStartIndex] || [];
  const weekdayCellCount = dateColumns.reduce((count, { col }) => (
    weekdayNames.has(normalizeText(possibleWeekdayRow[col])) ? count + 1 : count
  ), 0);
  if (weekdayCellCount >= Math.max(1, Math.ceil(dateColumns.length / 2))) {
    dataStartIndex += 1;
  }

  const users = await User.find({})
    .select("_id empId username realName pseudoName")
    .lean();

  const lookups = {
    byEmpId: getIdLookup(users, "empId"),
    byPseudoName: getIdLookup(users, "pseudoName"),
    byUsername: getIdLookup(users, "username"),
    byRealName: getIdLookup(users, "realName"),
  };

  const recordsByKey = new Map();
  const unmatchedRows = [];
  let invalidStatusCells = 0;
  let parsedStatusCells = 0;

  rows.slice(dataStartIndex).forEach((row, rowIndex) => {
    const rowNo = rowIndex + dataStartIndex + 1;
    const rowIdentity = {
      empId: empIdColIndex >= 0 ? row[empIdColIndex] : "",
      pseudoName: pseudoNameColIndex >= 0 ? row[pseudoNameColIndex] : "",
      username: usernameColIndex >= 0 ? row[usernameColIndex] : "",
      realName: realNameColIndex >= 0 ? row[realNameColIndex] : "",
    };

    const matchedUser = resolveUserFromRow(rowIdentity, lookups);
    const identityValue =
      String(rowIdentity.empId || rowIdentity.pseudoName || rowIdentity.username || rowIdentity.realName || "").trim();

    if (!matchedUser && identityValue) {
      unmatchedRows.push({ rowNo, identity: identityValue });
    }

    const resolvedEmployee =
      matchedUser ||
      {
        _id: createStableObjectIdFromText(`payroll:${identityValue || `row-${rowNo}`}`),
        empId: String(rowIdentity.empId || "").trim(),
        realName: String(rowIdentity.realName || rowIdentity.pseudoName || rowIdentity.username || rowIdentity.empId || "").trim(),
        pseudoName: String(rowIdentity.pseudoName || rowIdentity.username || rowIdentity.realName || rowIdentity.empId || "").trim(),
        username: String(rowIdentity.username || "").trim(),
      };

    dateColumns.forEach(({ col, dateKey }) => {
      const status = parseStatusCode(row[col]);
      if (!status) {
        const hasRaw = String(row[col] ?? "").trim() !== "";
        if (hasRaw) invalidStatusCells += 1;
        return;
      }

      const attendanceDate = parseDateKeyToUtcNoon(dateKey);
      if (!attendanceDate) return;

      parsedStatusCells += 1;
      const recordKey = `${resolvedEmployee._id.toString()}|${dateKey}`;
      recordsByKey.set(recordKey, {
        batchId: "",
        userId: resolvedEmployee._id,
        empId: String(resolvedEmployee.empId || rowIdentity.empId || "").trim(),
        employeeName: String(resolvedEmployee.realName || rowIdentity.realName || rowIdentity.pseudoName || rowIdentity.username || "").trim(),
        pseudoName: String(resolvedEmployee.pseudoName || rowIdentity.pseudoName || rowIdentity.username || resolvedEmployee.username || "").trim(),
        attendanceDate,
        attendanceDateKey: dateKey,
        status,
        uploadedBy: null,
        uploadedAt: new Date(),
        uploadMonth: Number.parseInt(dateKey.split("-")[1], 10),
        uploadYear: Number.parseInt(dateKey.split("-")[0], 10),
        source: "accounts_excel",
        originalRowNumber: rowNo,
      });
    });
  });

  return {
    dateRange: { startDate: String(startDate), endDate: String(endDate) },
    records: Array.from(recordsByKey.values()),
    unmatchedRows,
    invalidStatusCells,
    parsedStatusCells,
  };
};

export const syncPayrollAttendanceFromExcel = async ({
  buffer,
  startDate,
  endDate,
  originalFileName = "",
  uploadedByUser,
}) => {
  const userId = uploadedByUser?._id || uploadedByUser?.id;
  if (!userId) {
    throw new Error("Uploader identity is required.");
  }

  const batchId = new mongoose.Types.ObjectId().toHexString();
  const parsed = await buildExcelPayload({ buffer, startDate, endDate });
  const totalEmployees = new Set(parsed.records.map((record) => String(record.userId))).size;
  const totalAttendanceRecords = parsed.records.length;

  const batchDoc = await PayrollAttendanceBatch.create({
    batchId,
    startDate: parseDateKeyToUtcNoon(String(startDate)),
    endDate: parseDateKeyToUtcNoon(String(endDate)),
    originalFileName,
    uploadedBy: userId,
    uploadedAt: new Date(),
    totalEmployees,
    totalAttendanceRecords,
    status: "pending",
  });

  try {
    if (parsed.records.length > 0) {
      const operations = parsed.records.map((record) => ({
        updateOne: {
          filter: {
            userId: record.userId,
            attendanceDate: record.attendanceDate,
          },
          update: {
            $set: {
              batchId,
              userId: record.userId,
              empId: record.empId,
              employeeName: record.employeeName,
              pseudoName: record.pseudoName,
              attendanceDate: record.attendanceDate,
              status: record.status,
              uploadedBy: userId,
              uploadedAt: new Date(),
              uploadMonth: record.uploadMonth,
              uploadYear: record.uploadYear,
              source: record.source,
              originalRowNumber: record.originalRowNumber,
            },
          },
          upsert: true,
        },
      }));

      await PayrollAttendance.bulkWrite(operations, { ordered: false });
    }

    await PayrollAttendanceBatch.updateOne(
      { _id: batchDoc._id },
      {
        $set: {
          status: "completed",
          totalEmployees,
          totalAttendanceRecords,
        },
      }
    );

    return {
      success: true,
      batchId,
      totalEmployees,
      totalAttendanceRecords,
      insertedOrUpdatedRecords: totalAttendanceRecords,
      unmatchedRows: parsed.unmatchedRows,
      invalidStatusCells: parsed.invalidStatusCells,
      parsedStatusCells: parsed.parsedStatusCells,
    };
  } catch (error) {
    await PayrollAttendanceBatch.updateOne(
      { _id: batchDoc._id },
      {
        $set: {
          status: "failed",
          failureMessage: String(error?.message || "Failed to store payroll attendance."),
          totalEmployees,
          totalAttendanceRecords,
        },
      }
    );

    const payrollError = new Error(error?.message || "Failed to store payroll attendance.");
    payrollError.code = "PAYROLL_STORAGE_FAILED";
    payrollError.details = {
      batchId,
      totalEmployees,
      totalAttendanceRecords,
      unmatchedRows: parsed.unmatchedRows.slice(0, 50),
      invalidStatusCells: parsed.invalidStatusCells,
      parsedStatusCells: parsed.parsedStatusCells,
    };
    throw payrollError;
  }
};

export const getPayrollAttendanceByMonth = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const requestedMonth = Number.parseInt(req.query?.month, 10);
    const requestedYear = Number.parseInt(req.query?.year, 10);
    const now = new Date();
    const month = Number.isFinite(requestedMonth) ? requestedMonth : now.getMonth() + 1;
    const year = Number.isFinite(requestedYear) ? requestedYear : now.getFullYear();

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await PayrollAttendance.find({
      userId,
      attendanceDate: { $gte: start, $lte: end },
    })
      .sort({ attendanceDate: 1, updatedAt: 1 })
      .lean();

    const mapped = records.map((record) => ({
      ...record,
      attendanceDateKey: toIstDateKey(record.attendanceDate),
    }));

    const summary = {
      totalDays: mapped.length,
      presentDays: mapped.filter((record) => record.status === "P").length,
      leaveDays: mapped.filter((record) => ["L", "LWP", "UL", "BL", "NCNS"].includes(record.status)).length,
      offDays: mapped.filter((record) => ["WO", "H", "HD", "LWD"].includes(record.status)).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        month,
        year,
        monthKey: `${year}-${String(month).padStart(2, "0")}`,
        summary,
        records: mapped,
      },
    });
  } catch (error) {
    console.error("Error fetching payroll attendance month:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch payroll attendance month.",
    });
  }
};

export const exportPayrollAttendanceToExcel = async (req, res) => {
  try {
    const user = req.user || {};
    if (!user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!isPayrollExportAllowed(user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Accounts users can export payroll attendance.",
      });
    }

    const startDate = parseYmdRangeDate(req.query?.startDate);
    const endDate = parseYmdRangeDate(req.query?.endDate);
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required in YYYY-MM-DD format.",
      });
    }
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate.",
      });
    }

    const records = await PayrollAttendance.find({
      attendanceDate: { $gte: startDate, $lte: endDate },
    })
      .sort({ attendanceDate: 1, updatedAt: 1 })
      .lean();

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: "No payroll attendance found for the selected range.",
      });
    }

    const startKey = toIstDateKey(startDate);
    const endKey = toIstDateKey(endDate);
    const dateKeys = [];
    const rangeCursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate(), 12, 0, 0, 0));
    const rangeEnd = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 12, 0, 0, 0));
    while (rangeCursor <= rangeEnd) {
      const key = toIstDateKey(rangeCursor);
      if (key) dateKeys.push(key);
      rangeCursor.setUTCDate(rangeCursor.getUTCDate() + 1);
    }

    const statusColors = {
      P: "FFC6F6D5",
      WO: "FFD6F4FF",
      L: "FFFDE68A",
      NCNS: "FFFECACA",
      UL: "FFF9A8D4",
      LWP: "FFFEF08A",
      BL: "FFCBD5E1",
      H: "FFE9D5FF",
      LWD: "FFA5F3FC",
      HD: "FFFED7AA",
      OT: "FFC7D2FE",
    };
    const statusLabels = {
      P: "Present",
      WO: "Week Off",
      L: "Leave",
      NCNS: "No Call No Show",
      UL: "Unplanned Leave",
      LWP: "Leave Without Pay",
      BL: "Bereavement Leave",
      H: "Holiday",
      LWD: "Late Working Day",
      HD: "Half Day",
      OT: "Overtime",
    };

    const employeeMap = new Map();
    records.forEach((record) => {
      const userId = String(record.userId || "").trim();
      if (!userId) return;
      const dateKey = toIstDateKey(record.attendanceDate);
      if (!dateKey) return;
      const existing = employeeMap.get(userId) || {
        userId,
        empId: String(record.empId || "").trim(),
        employeeName: String(record.employeeName || "").trim(),
        pseudoName: String(record.pseudoName || "").trim(),
        days: new Map(),
      };
      if (!existing.empId && record.empId) existing.empId = String(record.empId || "").trim();
      if (!existing.employeeName && record.employeeName) existing.employeeName = String(record.employeeName || "").trim();
      if (!existing.pseudoName && record.pseudoName) existing.pseudoName = String(record.pseudoName || "").trim();
      existing.days.set(dateKey, {
        status: String(record.status || "").trim().toUpperCase(),
        batchId: String(record.batchId || "").trim(),
        uploadedAt: record.uploadedAt ? new Date(record.uploadedAt) : null,
        originalRowNumber: record.originalRowNumber ?? null,
      });
      employeeMap.set(userId, existing);
    });

    const employees = Array.from(employeeMap.values()).sort((a, b) => {
      const aName = `${a.employeeName || a.pseudoName || a.empId || ""}`.toLowerCase();
      const bName = `${b.employeeName || b.pseudoName || b.empId || ""}`.toLowerCase();
      return aName.localeCompare(bName);
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Task Management";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;
    workbook.views = [{ x: 0, y: 0, width: 16000, height: 9000, firstSheet: 0, activeTab: 0, visibility: "visible" }];

    const sheet = workbook.addWorksheet("Payroll Attendance", {
      views: [{ state: "frozen", ySplit: 4, xSplit: 3 }],
      properties: { defaultRowHeight: 22 },
    });

    const totalRecords = records.length;
    const totalEmployees = employees.length;
    const totalDays = dateKeys.length;
    const uniqueStatusCount = new Set(records.map((record) => String(record.status || "").trim().toUpperCase()).filter(Boolean)).size;

    const totalColumns = 3 + dateKeys.length;
    sheet.mergeCells(1, 1, 1, totalColumns);
    sheet.getCell(1, 1).value = "Payroll Attendance Export";
    sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

    const metaRows = [
      ["Selected Range", `${startKey} to ${endKey}`, "Employees", totalEmployees, "Attendance Records", totalRecords],
      ["Days", totalDays, "Status Types", uniqueStatusCount, "", ""],
    ];

    metaRows.forEach((values, index) => {
      const rowNumber = index + 2;
      const row = sheet.getRow(rowNumber);
      row.height = 22;
      values.forEach((value, colOffset) => {
        const cell = row.getCell(colOffset + 1);
        cell.value = value;
        cell.alignment = { horizontal: colOffset % 2 === 0 ? "left" : "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "CBD5E1" } },
          left: { style: "thin", color: { argb: "CBD5E1" } },
          bottom: { style: "thin", color: { argb: "CBD5E1" } },
          right: { style: "thin", color: { argb: "CBD5E1" } },
        };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index === 0 ? "FFE2E8F0" : "FFF8FAFC" } };
        if (colOffset % 2 === 0) {
          cell.font = { bold: true, color: { argb: "FF0F172A" } };
        }
      });
      if (values.length < totalColumns) {
        row.eachCell((cell, colNumber) => {
          if (!cell.value) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index === 0 ? "FFE2E8F0" : "FFF8FAFC" } };
            cell.border = {
              top: { style: "thin", color: { argb: "CBD5E1" } },
              left: { style: "thin", color: { argb: "CBD5E1" } },
              bottom: { style: "thin", color: { argb: "CBD5E1" } },
              right: { style: "thin", color: { argb: "CBD5E1" } },
            };
            if (colNumber % 2 === 1) {
              cell.alignment = { horizontal: "left", vertical: "middle" };
            }
          }
        });
      }
    });

    const dateRowIndex = 4;
    const headerRow = sheet.getRow(dateRowIndex);
    headerRow.height = 24;
    headerRow.getCell(1).value = "Employee ID";
    headerRow.getCell(2).value = "Employee Name";
    headerRow.getCell(3).value = "Pseudo Name";
    dateKeys.forEach((dateKey, index) => {
      headerRow.getCell(4 + index).value = `${dateKey}\n${new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
      })}`;
    });

    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
      cell.border = {
        top: { style: "thin", color: { argb: "CBD5E1" } },
        left: { style: "thin", color: { argb: "CBD5E1" } },
        bottom: { style: "thin", color: { argb: "CBD5E1" } },
        right: { style: "thin", color: { argb: "CBD5E1" } },
      };
      if (colNumber <= 3) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
      }
    });

    employees.forEach((employee) => {
      const row = sheet.addRow([
        employee.empId || "",
        employee.employeeName || "",
        employee.pseudoName || "",
        ...dateKeys.map((dateKey) => employee.days.get(dateKey)?.status || ""),
      ]);
      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
        cell.alignment = { horizontal: colNumber <= 3 ? "left" : "center", vertical: "middle", wrapText: true };
        if (colNumber > 3) {
          const status = String(cell.value || "").trim().toUpperCase();
          const fillColor = statusColors[status] || "F8FAFC";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
          cell.font = { bold: true, color: { argb: status === "NCNS" ? "FF7F1D1D" : "FF0F172A" } };
        }
      });
    });

    sheet.columns = [
      { key: "empId", width: 16 },
      { key: "employeeName", width: 24 },
      { key: "pseudoName", width: 22 },
      ...dateKeys.map(() => ({ width: 14 })),
    ];
    sheet.autoFilter = {
      from: { row: dateRowIndex, column: 1 },
      to: { row: dateRowIndex, column: totalColumns },
    };

    const legendSheet = workbook.addWorksheet("Legend", {
      properties: { defaultRowHeight: 22 },
    });
    legendSheet.mergeCells(1, 1, 1, 4);
    legendSheet.getCell(1, 1).value = "Payroll Attendance Legend";
    legendSheet.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    legendSheet.getCell(1, 1).alignment = { horizontal: "center" };
    legendSheet.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

    legendSheet.addRow(["Selected Range", startKey, "To", endKey]);
    legendSheet.addRow(["Employees", totalEmployees, "Records", totalRecords]);
    legendSheet.addRow(["Status", "Label", "Color", "Meaning"]);
    legendSheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
      cell.alignment = { horizontal: "center" };
    });

    Object.entries(statusLabels).forEach(([status, label]) => {
      const row = legendSheet.addRow([status, label, statusColors[status] || "F8FAFC", `Used as cell fill for ${label}`]);
      row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusColors[status] || "FFF8FAFC" } };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
      });
    });
    legendSheet.columns = [
      { width: 14 },
      { width: 28 },
      { width: 14 },
      { width: 34 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="payroll_attendance_${startKey}_to_${endKey}.xlsx"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error exporting payroll attendance:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to export payroll attendance.",
    });
  }
};
