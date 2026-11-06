// import XLSX from "xlsx-js-style";
// import Roster from "../Modals/Roster.modal.js";
// import User from "../Modals/User.modal.js";

// // ============================================
// // 1. HELPERS (Self-contained)
// // ============================================

// const toIstDateKey = (value) => {
//     const date = value instanceof Date ? value : new Date(value);
//     if (Number.isNaN(date.getTime())) return null;
//     const parts = new Intl.DateTimeFormat("en-CA", {
//         timeZone: "Asia/Kolkata",
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit",
//     }).formatToParts(date);
//     const y = parts.find((p) => p.type === "year")?.value;
//     const m = parts.find((p) => p.type === "month")?.value;
//     const d = parts.find((p) => p.type === "day")?.value;
//     return y && m && d ? `${y}-${m}-${d}` : null;
// };

// const parseYmdToUtcDate = (value) => {
//     const raw = String(value || "").trim();
//     const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//     if (!match) return null;
//     const year = parseInt(match[1], 10);
//     const month = parseInt(match[2], 10);
//     const day = parseInt(match[3], 10);
//     if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
//     return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
// };

// const normalizeEmpCode = (value) => {
//     if (value === null || value === undefined) return "";
//     let raw = String(value).trim();
//     if (raw.endsWith(".0")) raw = raw.slice(0, -2);
//     return raw;
// };

// const isDateKeyWithinWeek = (dateKey, week) => {
//     if (!dateKey || !week?.startDate || !week?.endDate) return false;
//     const startKey = toIstDateKey(week.startDate);
//     const endKey = toIstDateKey(week.endDate);
//     if (!startKey || !endKey) return false;
//     return dateKey >= startKey && dateKey <= endKey;
// };

// // Parse "H:MM" or Excel serial to decimal hours
// const parseWorkingHours = (raw) => {
//     if (raw === null || raw === undefined || raw === "") return null;
//     if (typeof raw === "number") {
//         if (raw >= 0 && raw < 1) return Math.round(raw * 24 * 60) / 60; // Excel time fraction
//         return Math.round(Number(raw) * 60) / 60;
//     }
//     const str = String(raw).trim();
//     if (!str) return null;
//     const hms = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
//     if (hms) {
//         const h = parseInt(hms[1], 10);
//         const m = parseInt(hms[2], 10);
//         const s = hms[3] ? parseInt(hms[3], 10) : 0;
//         return Math.round(((h * 60 + m + s / 60) / 60) * 60) / 60;
//     }
//     return null;
// };

// // Parse InTime/OutTime to "HH:MM"
// const parsePunchTime = (raw) => {
//     if (raw === null || raw === undefined || raw === "") return null;
//     if (raw instanceof Date) {
//         return `${String(raw.getHours()).padStart(2, "0")}:${String(raw.getMinutes()).padStart(2, "0")}`;
//     }
//     if (typeof raw === "number" && raw >= 0 && raw < 1) {
//         const totalMin = Math.round(raw * 24 * 60);
//         return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
//     }
//     const str = String(raw).trim();
//     const m1 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
//     if (m1) {
//         const h = parseInt(m1[1], 10);
//         const min = parseInt(m1[2], 10);
//         if (h < 24 && min < 60) {
//             return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
//         }
//     }
//     return null;
// };

// // Convert IST "HH:MM" on YYYY-MM-DD to UTC Date
// const istTimeOnDateToUtc = (dateKey, hhmm) => {
//     const d = parseYmdToUtcDate(dateKey);
//     if (!d) return null;
//     const t = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
//     if (!t) return null;
//     let utcH = parseInt(t[1], 10) - 5;
//     let utcM = parseInt(t[2], 10) - 30;
//     let dayOffset = 0;
//     if (utcM < 0) { utcM += 60; utcH -= 1; }
//     if (utcH < 0) { utcH += 24; dayOffset -= 1; }
//     return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + dayOffset, utcH, utcM, 0, 0));
// };

// // ============================================
// // 2. CLASSIFICATION RULES
// // ============================================
// const CAB_RULE = { present: 7 + 40 / 60, halfDay: 4 };
// const STANDARD_RULE = { present: 7 + 40 / 60, halfDay: 4 };

// const classifyFromHours = (hours, rule) => {
//     if (!Number.isFinite(hours)) return null;
//     if (hours > 24) return "invalid"; // Flag corrupt rows
//     if (hours >= rule.present) return "P";
//     if (hours >= rule.halfDay) return "HD";
//     return "LWP";
// };

// // ============================================
// // 3. EXCEL PARSER
// // ============================================
// const parsePunchExcel = (worksheet) => {
//     const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
//     if (!Array.isArray(rows) || rows.length < 5) throw new Error("Excel has too few rows");

//     let daysRowIndex = -1;
//     let dateColumns = [];

//     // Find Days row
//     for (let i = 0; i < rows.length; i++) {
//         const r = rows[i] || [];
//         if (String(r[0] || "").trim().toLowerCase() === "days") {
//             daysRowIndex = i;
//             for (let j = 1; j < r.length; j++) {
//                 const cell = String(r[j] || "").trim();
//                 const m = cell.match(/^(\d{1,2})\s+([SMTWF])$/i);
//                 if (m) dateColumns.push({ colIndex: j, day: parseInt(m[1], 10) });
//             }
//             break;
//         }
//     }

//     if (daysRowIndex === -1 || dateColumns.length === 0) throw new Error("Missing Days row");

//     // Detect Month/Year
//     let reportMonth = -1;
//     let reportYear = -1;
//     for (let i = 0; i < Math.min(10, rows.length); i++) {
//         const cell = String((rows[i] || [])[1] || "").trim();
//         const m = cell.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\s+To\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
//         if (m) {
//             const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
//             reportMonth = months.indexOf(m[1].toLowerCase());
//             reportYear = parseInt(m[3], 10);
//             break;
//         }
//     }
//     if (reportMonth < 0) {
//         const now = new Date();
//         reportMonth = now.getMonth();
//         reportYear = now.getFullYear();
//     }

//     const dateColumnsWithKey = dateColumns.map((c) => ({
//         colIndex: c.colIndex,
//         dateKey: toIstDateKey(new Date(reportYear, reportMonth, c.day)),
//     }));

//     // Parse blocks
//     const employees = [];
//     let currentDepartment = "";

//     for (let i = daysRowIndex + 1; i < rows.length; i++) {
//         const row = rows[i] || [];
//         const firstCell = String(row[0] || "").trim().toLowerCase();

//         if (firstCell.startsWith("department:")) {
//             currentDepartment = String(row[3] || row[2] || row[1] || "").trim() || "General";
//             continue;
//         }

//         if (firstCell.startsWith("emp. code:") || firstCell.startsWith("emp code:")) {
//             const empCode = normalizeEmpCode(row[3] ?? row[2] ?? row[1] ?? "");
//             if (!empCode) continue;

//             let empName = "";
//             for (let k = 0; k < row.length; k++) {
//                 if (String(row[k] || "").trim().toLowerCase() === "emp. name:") {
//                     empName = String(row[k + 1] || row[k + 2] || "").trim();
//                     break;
//                 }
//             }

//             const statusRow = rows[i + 1] || [];
//             const inTimeRow = rows[i + 2] || [];
//             const outTimeRow = rows[i + 3] || [];
//             const totalRow = rows[i + 4] || [];

//             if (String(statusRow[0] || "").trim().toLowerCase() !== "status") continue;

//             const days = {};
//             for (const col of dateColumnsWithKey) {
//                 if (!col.dateKey) continue;
//                 const status = String(statusRow[col.colIndex] || "").trim();
//                 const inTime = inTimeRow[col.colIndex];
//                 const outTime = outTimeRow[col.colIndex];
//                 const total = totalRow[col.colIndex];

//                 if (status || inTime || outTime || total) {
//                     days[col.dateKey] = {
//                         status,
//                         inTime: parsePunchTime(inTime),
//                         outTime: parsePunchTime(outTime),
//                         totalHours: parseWorkingHours(total),
//                     };
//                 }
//             }

//             employees.push({ empCode, empName, department: currentDepartment, days });
//             i += 4;
//         }
//     }
//     return { dateColumns: dateColumnsWithKey, employees };
// };

// // ============================================
// // 4. CORE LOGIC (Preview & Confirm)
// // ============================================
// const buildAttendancePreview = async ({ worksheet, requesterUser }) => {
//     const { dateColumns, employees } = parsePunchExcel(worksheet);
//     if (!employees.length) throw new Error("No employees found in Excel");

//     const dateKeys = dateColumns.map((c) => c.dateKey).filter(Boolean);
//     const minDate = parseYmdToUtcDate(dateKeys.sort()[0]);
//     const maxDate = parseYmdToUtcDate(dateKeys.sort().slice(-1)[0]);

//     // Load rosters overlapping the window
//     const rosters = await Roster.find({
//         $or: [
//             { rosterStartDate: { $lte: maxDate }, rosterEndDate: { $gte: minDate } },
//             { weeks: { $elemMatch: { startDate: { $lte: maxDate }, endDate: { $gte: minDate } } } },
//         ],
//     });

//     // Load users
//     const empCodes = Array.from(new Set(employees.map((e) => e.empCode)));
//     const users = await User.find({ empId: { $in: empCodes } }).select("_id empId username name").lean();
//     const userByEmpId = new Map(users.map((u) => [normalizeEmpCode(u.empId), u]));

//     const accountType = String(requesterUser?.accountType || "").trim().toLowerCase();
//     const isSuperAdmin = accountType === "superadmin";
//     const isHr = accountType === "hr";
//     const requesterUsername = String(requesterUser?.username || "").trim().toLowerCase();

//     const previewRows = [];
//     const matched = [];
//     const unmatchedEmpCodes = [];
//     const duplicateKeys = new Set();
//     const seenKeys = new Set();

//     for (const block of employees) {
//         const userRecord = userByEmpId.get(block.empCode);

//         for (const [dateKey, day] of Object.entries(block.days)) {
//             const rowKey = `${block.empCode}|${dateKey}`;
//             if (seenKeys.has(rowKey)) { duplicateKeys.add(rowKey); continue; }
//             seenKeys.add(rowKey);

//             const row = {
//                 rowKey, empCode: block.empCode, empName: block.empName,
//                 date: dateKey, inTime: day.inTime, outTime: day.outTime, excelHours: day.totalHours,
//                 transport: "", hasCabArrival: false, ruleApplied: "STANDARD", computedStatus: null,
//                 validation: "ok", validationMessage: "",
//                 _dbUserId: null, _rosterId: null, _weekIndex: null, _employeeIndex: null,
//             };

//             if (day.totalHours === null || day.totalHours === 0) {
//                 row.validation = "missing_hours"; row.validationMessage = "Missing or zero hours";
//                 previewRows.push(row); continue;
//             }
//             if (!userRecord) {
//                 row.validation = "not_found"; row.validationMessage = "Employee Code not found in DB";
//                 if (!unmatchedEmpCodes.find((x) => x.empCode === block.empCode)) unmatchedEmpCodes.push({ empCode: block.empCode, name: block.empName });
//                 previewRows.push(row); continue;
//             }

//             // Find in Roster
//             let matchedRoster = null, weekIndex = -1, employeeIndex = -1;
//             for (const roster of rosters) {
//                 const wIdx = (roster.weeks || []).findIndex((w) => w && isDateKeyWithinWeek(dateKey, w));
//                 if (wIdx < 0) continue;
//                 const eIdx = (roster.weeks[wIdx].employees || []).findIndex(
//                     (e) => e && (String(e.userId || "") === String(userRecord._id || "") || normalizeEmpCode(e.empId) === block.empCode)
//                 );
//                 if (eIdx >= 0) { matchedRoster = roster; weekIndex = wIdx; employeeIndex = eIdx; break; }
//             }

//             if (!matchedRoster) {
//                 row.validation = "not_in_roster"; row.validationMessage = "Employee not in roster for this date";
//                 previewRows.push(row); continue;
//             }

//             const employee = matchedRoster.weeks[weekIndex].employees[employeeIndex];
//             row.transport = employee.transport || "";
//             row._dbUserId = employee.userId;
//             row._rosterId = matchedRoster._id;
//             row._weekIndex = weekIndex;
//             row._employeeIndex = employeeIndex;

//             const dayEntry = (employee.dailyStatus || []).find((d) => toIstDateKey(d?.date) === dateKey);
//             row.hasCabArrival = Boolean(dayEntry?.transportArrivalTime);

//             const cabApplies = row.transport === "Yes" && row.hasCabArrival;
//             row.ruleApplied = cabApplies ? "CAB" : "STANDARD";
//             row.computedStatus = classifyFromHours(day.totalHours, cabApplies ? CAB_RULE : STANDARD_RULE);

//             if (row.computedStatus === "invalid") {
//                 row.validation = "invalid_hours"; row.validationMessage = "Total hours > 24h";
//                 previewRows.push(row); continue;
//             }

//             // Team Leader check
//             if (!isSuperAdmin && !isHr) {
//                 const empTL = String(employee.teamLeader || "").trim().toLowerCase();
//                 if (empTL !== requesterUsername) {
//                     row.validation = "forbidden"; row.validationMessage = "Not a member of your team";
//                     previewRows.push(row); continue;
//                 }
//             }

//             previewRows.push(row);
//             matched.push(row);
//         }
//     }

//     for (const row of previewRows) {
//         if (duplicateKeys.has(row.rowKey)) { row.validation = "duplicate"; row.validationMessage = "Duplicate in Excel"; }
//     }

//     return {
//         dateRange: { minDate: dateKeys.sort()[0], maxDate: dateKeys.sort().slice(-1)[0] },
//         rows: previewRows,
//         summary: {
//             total: previewRows.length,
//             valid: previewRows.filter(r => r.validation === "ok").length,
//             unmatchedEmpCodes,
//             duplicateRows: Array.from(duplicateKeys),
//         },
//     };
// };

// // ============================================
// // 5. EXPORTED CONTROLLERS
// // ============================================
// export const previewAttendanceExcelUpload = async (req, res) => {
//     try {
//         const user = req.user || {};
//         const role = String(user.accountType || "").toLowerCase();
//         if (!["superadmin", "hr", "employee", "supervisor"].includes(role)) {
//             return res.status(403).json({ success: false, message: "Access denied." });
//         }
//         if (!req.file?.buffer) return res.status(400).json({ success: false, message: "Excel required." });

//         const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//         const worksheet = workbook.Sheets[workbook.SheetNames[0]];

//         const preview = await buildAttendancePreview({ worksheet, requesterUser: user });
//         return res.status(200).json({ success: true, data: preview });
//     } catch (err) {
//         return res.status(400).json({ success: false, message: err.message });
//     }
// };

// export const confirmAttendanceExcelUpload = async (req, res) => {
//     try {
//         const user = req.user || {};
//         if (!req.file?.buffer) return res.status(400).json({ success: false, message: "Excel required." });

//         const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
//         const worksheet = workbook.Sheets[workbook.SheetNames[0]];

//         // Re-validate on server
//         const preview = await buildAttendancePreview({ worksheet, requesterUser: user });
//         const validRows = preview.rows.filter(r => r.validation === "ok");

//         if (!validRows.length) {
//             return res.status(400).json({ success: false, message: "No valid rows to save.", data: { summary: preview.summary } });
//         }

//         const byRoster = new Map();
//         for (const row of validRows) {
//             if (!byRoster.has(String(row._rosterId))) byRoster.set(String(row._rosterId), []);
//             byRoster.get(String(row._rosterId)).push(row);
//         }

//         let totalSaved = 0;
//         const now = new Date();
//         const isPrivileged = ["superadmin", "hr"].includes(String(user.accountType || "").toLowerCase());

//         for (const [rosterId, rows] of byRoster.entries()) {
//             const roster = await Roster.findById(rosterId);
//             if (!roster) continue;

//             for (const row of rows) {
//                 const week = roster.weeks[row._weekIndex];
//                 const employee = week.employees[row._employeeIndex];

//                 if (!isPrivileged) {
//                     const empTL = String(employee.teamLeader || "").trim().toLowerCase();
//                     if (empTL !== String(user.username || "").trim().toLowerCase()) continue; // Skip forbidden
//                 }

//                 employee.dailyStatus = employee.dailyStatus || [];
//                 let dayEntry = employee.dailyStatus.find((d) => toIstDateKey(d?.date) === row.date);

//                 if (!dayEntry) {
//                     employee.dailyStatus.push({
//                         date: parseYmdToUtcDate(row.date), status: "P", departmentStatus: "",
//                         transportStatus: "", overrideStatus: "", transportArrivalTime: null,
//                         departmentArrivalTime: null, punchIn: null, punchOut: null,
//                         totalHours: null, isPunchCalculated: false,
//                     });
//                     dayEntry = employee.dailyStatus[employee.dailyStatus.length - 1];
//                 }

//                 // Update specific fields
//                 dayEntry.departmentStatus = row.computedStatus;
//                 dayEntry.departmentStatusUpdatedBy = user._id || null;
//                 dayEntry.departmentStatusUpdatedAt = now;
//                 dayEntry.totalHours = Number(row.excelHours);

//                 if (row.inTime) {
//                     const utc = istTimeOnDateToUtc(row.date, row.inTime);
//                     if (utc) dayEntry.punchIn = utc;
//                 }
//                 if (row.outTime) {
//                     let outDateKey = row.date;
//                     if (row.inTime && row.outTime < row.inTime) {
//                         const next = new Date(parseYmdToUtcDate(row.date));
//                         next.setUTCDate(next.getUTCDate() + 1);
//                         outDateKey = toIstDateKey(next);
//                     }
//                     const utc = istTimeOnDateToUtc(outDateKey, row.outTime);
//                     if (utc) dayEntry.punchOut = utc;
//                 }

//                 totalSaved++;
//             }

//             roster.updatedBy = user._id;
//             roster.editHistory = roster.editHistory || [];
//             roster.editHistory.push({
//                 editedBy: user._id, editedByName: user.username, accountType: user.accountType,
//                 actionType: "excel-hr-attendance-upload", employeeId: null, employeeName: "",
//                 changes: [{ field: "departmentStatus", oldValue: "—", newValue: `Excel upload (${rows.length} days)` }],
//             });

//             roster.markModified("weeks");
//             roster.markModified("editHistory");
//             await roster.save();
//         }

//         return res.status(200).json({ success: true, message: `Saved ${totalSaved} records.`, data: { totalSaved } });
//     } catch (err) {
//         return res.status(500).json({ success: false, message: err.message });
//     }
// };












import XLSX from "xlsx-js-style";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

// ============================================
// 1. HELPERS (Self-contained)
// ============================================

const toIstDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return y && m && d ? `${y}-${m}-${d}` : null;
};

const parseYmdToUtcDate = (value) => {
    const raw = String(value || "").trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const normalizeEmpCode = (value) => {
    if (value === null || value === undefined) return "";
    let raw = String(value).trim();
    if (raw.endsWith(".0")) raw = raw.slice(0, -2);
    return raw;
};

const isDateKeyWithinWeek = (dateKey, week) => {
    if (!dateKey || !week?.startDate || !week?.endDate) return false;
    const startKey = toIstDateKey(week.startDate);
    const endKey = toIstDateKey(week.endDate);
    if (!startKey || !endKey) return false;
    return dateKey >= startKey && dateKey <= endKey;
};

const parseWorkingHours = (raw) => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw === "number") {
        if (raw >= 0 && raw < 1) return Math.round(raw * 24 * 60) / 60;
        return Math.round(Number(raw) * 60) / 60;
    }
    const str = String(raw).trim();
    if (!str) return null;
    const hms = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hms) {
        const h = parseInt(hms[1], 10);
        const m = parseInt(hms[2], 10);
        const s = hms[3] ? parseInt(hms[3], 10) : 0;
        return Math.round(((h * 60 + m + s / 60) / 60) * 60) / 60;
    }
    return null;
};

const parsePunchTime = (raw) => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (raw instanceof Date) {
        return `${String(raw.getHours()).padStart(2, "0")}:${String(raw.getMinutes()).padStart(2, "0")}`;
    }
    if (typeof raw === "number" && raw >= 0 && raw < 1) {
        const totalMin = Math.round(raw * 24 * 60);
        return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
    }
    const str = String(raw).trim();
    const m1 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m1) {
        const h = parseInt(m1[1], 10);
        const min = parseInt(m1[2], 10);
        if (h < 24 && min < 60) {
            return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
        }
    }
    return null;
};

const istTimeOnDateToUtc = (dateKey, hhmm) => {
    const d = parseYmdToUtcDate(dateKey);
    if (!d) return null;
    const t = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
    if (!t) return null;
    let utcH = parseInt(t[1], 10) - 5;
    let utcM = parseInt(t[2], 10) - 30;
    let dayOffset = 0;
    if (utcM < 0) { utcM += 60; utcH -= 1; }
    if (utcH < 0) { utcH += 24; dayOffset -= 1; }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + dayOffset, utcH, utcM, 0, 0));
};

// ============================================
// 2. CLASSIFICATION & ADJUSTED HOURS
// ============================================
const CAB_RULE = { present: 7 + 40 / 60, halfDay: 4 };
const STANDARD_RULE = { present: 7 + 40 / 60, halfDay: 4 };

const classifyFromHours = (hours, rule) => {
    if (!Number.isFinite(hours)) return null;
    if (hours > 24) return "invalid"; // Flag corrupt rows
    if (hours >= rule.present) return "P";
    if (hours >= rule.halfDay) return "HD";
    return "LWP";
};

// NEW: Centralized calculation for adjusted hours
const computeAdjustedHours = ({ excelHours, employee, dayEntry, dateKey }) => {
    const UNIVERSAL_BUFFER_MINUTES = 15;

    if (!Number.isFinite(excelHours) || excelHours <= 0) {
        return {
            adjustedHours: null,
            bufferMinutes: UNIVERSAL_BUFFER_MINUTES,
            cabDelayMinutes: 0,
        };
    }

    let cabDelayMinutes = 0;
    const isCabEmployee = String(employee?.transport || "").trim() === "Yes";
    const actualArrival = dayEntry?.transportArrivalTime || null;

    // Scheduled cab arrival = Shift start time on the attendance date
    const shiftStartHour = Number(employee?.shiftStartHour);
    const hasValidShiftStart = Number.isFinite(shiftStartHour) && shiftStartHour >= 0 && shiftStartHour <= 23;

    if (isCabEmployee && actualArrival && hasValidShiftStart) {
        const actualMs = new Date(actualArrival).getTime();

        // Build scheduled arrival Date (IST) using the attendance date + shift start hour
        const baseDate = parseYmdToUtcDate(dateKey);
        if (baseDate && Number.isFinite(actualMs)) {
            // Create UTC date for that day at the shift start hour
            // Note: shiftStartHour is in IST. Convert to UTC.
            let utcH = shiftStartHour - 5;
            let utcM = -30;
            let dayOffset = 0;
            if (utcM < 0) { utcM += 60; utcH -= 1; }
            if (utcH < 0) { utcH += 24; dayOffset -= 1; }

            const scheduledMs = Date.UTC(
                baseDate.getUTCFullYear(),
                baseDate.getUTCMonth(),
                baseDate.getUTCDate() + dayOffset,
                utcH, utcM, 0, 0
            );

            const diffMs = actualMs - scheduledMs;
            if (diffMs > 0) {
                cabDelayMinutes = Math.round(diffMs / 60000); // Full positive delay, no cap
            }
        }
    }

    const totalAddMinutes = UNIVERSAL_BUFFER_MINUTES + cabDelayMinutes;
    const adjustedHours = excelHours + totalAddMinutes / 60;

    return {
        adjustedHours,
        bufferMinutes: UNIVERSAL_BUFFER_MINUTES,
        cabDelayMinutes,
    };
};

// ============================================
// 3. EXCEL PARSER
// ============================================
const parsePunchExcel = (worksheet) => {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (!Array.isArray(rows) || rows.length < 5) throw new Error("Excel has too few rows");

    let daysRowIndex = -1;
    let dateColumns = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i] || [];
        if (String(r[0] || "").trim().toLowerCase() === "days") {
            daysRowIndex = i;
            for (let j = 1; j < r.length; j++) {
                const cell = String(r[j] || "").trim();
                const m = cell.match(/^(\d{1,2})\s+([SMTWF])$/i);
                if (m) dateColumns.push({ colIndex: j, day: parseInt(m[1], 10) });
            }
            break;
        }
    }

    if (daysRowIndex === -1 || dateColumns.length === 0) throw new Error("Missing Days row");

    let reportMonth = -1;
    let reportYear = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
        const cell = String((rows[i] || [])[1] || "").trim();
        const m = cell.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})\s+To\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
        if (m) {
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            reportMonth = months.indexOf(m[1].toLowerCase());
            reportYear = parseInt(m[3], 10);
            break;
        }
    }
    if (reportMonth < 0) {
        const now = new Date();
        reportMonth = now.getMonth();
        reportYear = now.getFullYear();
    }

    const dateColumnsWithKey = dateColumns.map((c) => ({
        colIndex: c.colIndex,
        dateKey: toIstDateKey(new Date(reportYear, reportMonth, c.day)),
    }));

    const employees = [];
    let currentDepartment = "";

    for (let i = daysRowIndex + 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const firstCell = String(row[0] || "").trim().toLowerCase();

        if (firstCell.startsWith("department:")) {
            currentDepartment = String(row[3] || row[2] || row[1] || "").trim() || "General";
            continue;
        }

        if (firstCell.startsWith("emp. code:") || firstCell.startsWith("emp code:")) {
            const empCode = normalizeEmpCode(row[3] ?? row[2] ?? row[1] ?? "");
            if (!empCode) continue;

            let empName = "";
            for (let k = 0; k < row.length; k++) {
                if (String(row[k] || "").trim().toLowerCase() === "emp. name:") {
                    empName = String(row[k + 1] || row[k + 2] || "").trim();
                    break;
                }
            }

            const statusRow = rows[i + 1] || [];
            const inTimeRow = rows[i + 2] || [];
            const outTimeRow = rows[i + 3] || [];
            const totalRow = rows[i + 4] || [];

            if (String(statusRow[0] || "").trim().toLowerCase() !== "status") continue;

            const days = {};
            for (const col of dateColumnsWithKey) {
                if (!col.dateKey) continue;
                const status = String(statusRow[col.colIndex] || "").trim();
                const inTime = inTimeRow[col.colIndex];
                const outTime = outTimeRow[col.colIndex];
                const total = totalRow[col.colIndex];

                if (status || inTime || outTime || total) {
                    days[col.dateKey] = {
                        status,
                        inTime: parsePunchTime(inTime),
                        outTime: parsePunchTime(outTime),
                        totalHours: parseWorkingHours(total),
                    };
                }
            }

            employees.push({ empCode, empName, department: currentDepartment, days });
            i += 4;
        }
    }
    return { dateColumns: dateColumnsWithKey, employees };
};

// ============================================
// 4. CORE LOGIC (Preview & Confirm)
// ============================================
const buildAttendancePreview = async ({ worksheet, requesterUser }) => {
    const { dateColumns, employees } = parsePunchExcel(worksheet);
    if (!employees.length) throw new Error("No employees found in Excel");

    const dateKeys = dateColumns.map((c) => c.dateKey).filter(Boolean);
    const minDate = parseYmdToUtcDate(dateKeys.sort()[0]);
    const maxDate = parseYmdToUtcDate(dateKeys.sort().slice(-1)[0]);

    const rosters = await Roster.find({
        $or: [
            { rosterStartDate: { $lte: maxDate }, rosterEndDate: { $gte: minDate } },
            { weeks: { $elemMatch: { startDate: { $lte: maxDate }, endDate: { $gte: minDate } } } },
        ],
    });

    const empCodes = Array.from(new Set(employees.map((e) => e.empCode)));
    const users = await User.find({ empId: { $in: empCodes } }).select("_id empId username name").lean();
    const userByEmpId = new Map(users.map((u) => [normalizeEmpCode(u.empId), u]));

    const accountType = String(requesterUser?.accountType || "").trim().toLowerCase();
    const isSuperAdmin = accountType === "superadmin";
    const isHr = accountType === "hr";
    const requesterUsername = String(requesterUser?.username || "").trim().toLowerCase();

    const previewRows = [];
    const matched = [];
    const unmatchedEmpCodes = [];
    const duplicateKeys = new Set();
    const seenKeys = new Set();

    for (const block of employees) {
        const userRecord = userByEmpId.get(block.empCode);

        for (const [dateKey, day] of Object.entries(block.days)) {
            const rowKey = `${block.empCode}|${dateKey}`;
            if (seenKeys.has(rowKey)) { duplicateKeys.add(rowKey); continue; }
            seenKeys.add(rowKey);

            const row = {
                rowKey, empCode: block.empCode, empName: block.empName,
                date: dateKey, inTime: day.inTime, outTime: day.outTime, excelHours: day.totalHours,
                transport: "", hasCabArrival: false, ruleApplied: "STANDARD", computedStatus: null,
                validation: "ok", validationMessage: "",
                _dbUserId: null, _rosterId: null, _weekIndex: null, _employeeIndex: null,
            };

            if (day.totalHours === null || day.totalHours === 0) {
                row.validation = "missing_hours"; row.validationMessage = "Missing or zero hours";
                previewRows.push(row); continue;
            }
            if (!userRecord) {
                row.validation = "not_found"; row.validationMessage = "Employee Code not found in DB";
                if (!unmatchedEmpCodes.find((x) => x.empCode === block.empCode)) unmatchedEmpCodes.push({ empCode: block.empCode, name: block.empName });
                previewRows.push(row); continue;
            }

            let matchedRoster = null, weekIndex = -1, employeeIndex = -1;
            for (const roster of rosters) {
                const wIdx = (roster.weeks || []).findIndex((w) => w && isDateKeyWithinWeek(dateKey, w));
                if (wIdx < 0) continue;
                const eIdx = (roster.weeks[wIdx].employees || []).findIndex(
                    (e) => e && (String(e.userId || "") === String(userRecord._id || "") || normalizeEmpCode(e.empId) === block.empCode)
                );
                if (eIdx >= 0) { matchedRoster = roster; weekIndex = wIdx; employeeIndex = eIdx; break; }
            }

            if (!matchedRoster) {
                row.validation = "not_in_roster"; row.validationMessage = "Employee not in roster for this date";
                previewRows.push(row); continue;
            }

            const employee = matchedRoster.weeks[weekIndex].employees[employeeIndex];
            row.transport = employee.transport || "";
            row._dbUserId = employee.userId;
            row._rosterId = matchedRoster._id;
            row._weekIndex = weekIndex;
            row._employeeIndex = employeeIndex;

            const dayEntry = (employee.dailyStatus || []).find((d) => toIstDateKey(d?.date) === dateKey);
            row.hasCabArrival = Boolean(dayEntry?.transportArrivalTime);

            // NEW: Calculate adjusted hours
            const { adjustedHours, bufferMinutes, cabDelayMinutes } = computeAdjustedHours({
                excelHours: day.totalHours,
                employee,
                dayEntry,
                dateKey
            });

            row.excelHours = day.totalHours;
            row.bufferMinutes = bufferMinutes;
            row.cabDelayMinutes = cabDelayMinutes;
            row.adjustedHours = adjustedHours;

            if (!Number.isFinite(adjustedHours) || adjustedHours > 24) {
                row.validation = "invalid_hours";
                row.validationMessage = "Adjusted hours invalid or > 24h";
                previewRows.push(row); continue;
            }

            // Classification uses adjusted hours
            row.ruleApplied = row.transport === "Yes" ? "CAB" : "STANDARD";
            row.computedStatus = classifyFromHours(adjustedHours, row.transport === "Yes" ? CAB_RULE : STANDARD_RULE);

            // Team Leader check
            if (!isSuperAdmin && !isHr) {
                const empTL = String(employee.teamLeader || "").trim().toLowerCase();
                if (empTL !== requesterUsername) {
                    row.validation = "forbidden"; row.validationMessage = "Not a member of your team";
                    previewRows.push(row); continue;
                }
            }

            previewRows.push(row);
            matched.push(row);
        }
    }

    for (const row of previewRows) {
        if (duplicateKeys.has(row.rowKey)) { row.validation = "duplicate"; row.validationMessage = "Duplicate in Excel"; }
    }

    return {
        dateRange: { minDate: dateKeys.sort()[0], maxDate: dateKeys.sort().slice(-1)[0] },
        rows: previewRows,
        summary: {
            total: previewRows.length,
            valid: previewRows.filter(r => r.validation === "ok").length,
            unmatchedEmpCodes,
            duplicateRows: Array.from(duplicateKeys),
        },
    };
};

// ============================================
// 5. EXPORTED CONTROLLERS
// ============================================
export const previewAttendanceExcelUpload = async (req, res) => {
    try {
        const user = req.user || {};
        const role = String(user.accountType || "").toLowerCase();
        if (!["superadmin", "hr", "employee", "supervisor"].includes(role)) {
            return res.status(403).json({ success: false, message: "Access denied." });
        }
        if (!req.file?.buffer) return res.status(400).json({ success: false, message: "Excel required." });

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const preview = await buildAttendancePreview({ worksheet, requesterUser: user });
        return res.status(200).json({ success: true, data: preview });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

export const confirmAttendanceExcelUpload = async (req, res) => {
    try {
        const user = req.user || {};
        if (!req.file?.buffer) return res.status(400).json({ success: false, message: "Excel required." });

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Re-validate on server
        const preview = await buildAttendancePreview({ worksheet, requesterUser: user });
        const validRows = preview.rows.filter(r => r.validation === "ok");

        if (!validRows.length) {
            return res.status(400).json({ success: false, message: "No valid rows to save.", data: { summary: preview.summary } });
        }

        const byRoster = new Map();
        for (const row of validRows) {
            if (!byRoster.has(String(row._rosterId))) byRoster.set(String(row._rosterId), []);
            byRoster.get(String(row._rosterId)).push(row);
        }

        let totalSaved = 0;
        const now = new Date();
        const isPrivileged = ["superadmin", "hr"].includes(String(user.accountType || "").toLowerCase());

        for (const [rosterId, rows] of byRoster.entries()) {
            const roster = await Roster.findById(rosterId);
            if (!roster) continue;

            for (const row of rows) {
                const week = roster.weeks[row._weekIndex];
                const employee = week.employees[row._employeeIndex];

                if (!isPrivileged) {
                    const empTL = String(employee.teamLeader || "").trim().toLowerCase();
                    if (empTL !== String(user.username || "").trim().toLowerCase()) continue; // Skip forbidden
                }

                employee.dailyStatus = employee.dailyStatus || [];
                let dayEntry = employee.dailyStatus.find((d) => toIstDateKey(d?.date) === row.date);

                if (!dayEntry) {
                    employee.dailyStatus.push({
                        date: parseYmdToUtcDate(row.date), status: "P", departmentStatus: "",
                        transportStatus: "", overrideStatus: "", transportArrivalTime: null,
                        departmentArrivalTime: null, punchIn: null, punchOut: null,
                        totalHours: null, isPunchCalculated: false,
                    });
                    dayEntry = employee.dailyStatus[employee.dailyStatus.length - 1];
                }

                // RECALCULATE ADJUSTED HOURS FOR CONFIRMATION (Ensures consistency)
                const calcResult = computeAdjustedHours({
                    excelHours: row.excelHours,
                    employee,
                    dayEntry: dayEntry,
                    dateKey: row.date
                });

                const finalStatus = classifyFromHours(calcResult.adjustedHours, employee.transport === "Yes" ? CAB_RULE : STANDARD_RULE);

                // Update specific fields
                dayEntry.departmentStatus = finalStatus; // Use recalculated status
                dayEntry.departmentStatusUpdatedBy = user._id || null;
                dayEntry.departmentStatusUpdatedAt = now;
                dayEntry.totalHours = Number(row.excelHours); // Original Excel hours preserved

                if (row.inTime) {
                    const utc = istTimeOnDateToUtc(row.date, row.inTime);
                    if (utc) dayEntry.punchIn = utc;
                }
                if (row.outTime) {
                    let outDateKey = row.date;
                    if (row.inTime && row.outTime < row.inTime) {
                        const next = new Date(parseYmdToUtcDate(row.date));
                        next.setUTCDate(next.getUTCDate() + 1);
                        outDateKey = toIstDateKey(next);
                    }
                    const utc = istTimeOnDateToUtc(outDateKey, row.outTime);
                    if (utc) dayEntry.punchOut = utc;
                }

                totalSaved++;
            }

            roster.updatedBy = user._id;
            roster.editHistory = roster.editHistory || [];
            roster.editHistory.push({
                editedBy: user._id, editedByName: user.username, accountType: user.accountType,
                actionType: "excel-hr-attendance-upload", employeeId: null, employeeName: "",
                changes: [{
                    field: "departmentStatus",
                    oldValue: "—",
                    newValue: `Excel upload (${rows.length} days)`,
                    metadata: { bufferMinutes: 15 } // Basic audit trail
                }],
            });

            roster.markModified("weeks");
            roster.markModified("editHistory");
            await roster.save();
        }

        return res.status(200).json({ success: true, message: `Saved ${totalSaved} records.`, data: { totalSaved } });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};