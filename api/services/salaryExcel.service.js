import XLSX from "xlsx";
import SalaryBatch from "../Modals/SalarySlip/SalaryBatch.modal.js";
import SalaryRecord from "../Modals/SalarySlip/SalaryRecord.modal.js";
import User from "../Modals/User.modal.js";

const normalizeHeaderKey = (key = "") =>
  String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "")
    .replace(/[^a-z0-9]/g, "");

const normalizeDisplayHeader = (key = "") => String(key ?? "").trim();

const normalizeEmployeeCode = (value = "") =>
  String(value ?? "")
    .trim()
    .replace(/\.0$/, "");

const normalizeName = (value = "") =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EMPLOYEE_CODE_KEYS = new Set([
  "empid",
  "employeeid",
  "employeecode",
  "empcode",
  "employee",
  "employeeeno",
  "employeeno",
  "employee_no",
  "empno",
  "emp_no",
  "staffid",
  "staffcode",
  "userid",
  "usercode",
  "code",
].map(normalizeHeaderKey));

const getEmployeeIdHeader = (headers = []) =>
  headers.find((header) => EMPLOYEE_CODE_KEYS.has(normalizeHeaderKey(header))) || "";

const findHeaderByAliases = (headers = [], aliases = []) => {
  const normalizedAliases = new Set(aliases.map(normalizeHeaderKey));
  return headers.find((header) => normalizedAliases.has(normalizeHeaderKey(header))) || "";
};

const getPseudoNameHeader = (headers = []) =>
  findHeaderByAliases(headers, [
    "Pseduo NAME",
    "Pseudo NAME",
    "Pseudo Name",
    "PseduoName",
    "PseudoName",
  ]);

const getEmployeeNameHeader = (headers = []) =>
  findHeaderByAliases(headers, [
    "Employee Name",
    "EmployeeName",
    "Emp Name",
    "EmpName",
    "Name",
  ]);

const isEmptyRow = (row = []) =>
  !row.some((cell) => String(cell ?? "").trim());

const buildRowObject = (headers = [], values = []) => {
  const row = {};
  headers.forEach((header, index) => {
    const displayHeader = normalizeDisplayHeader(header) || `Column ${index + 1}`;
    row[displayHeader] = values[index] ?? "";
  });
  return row;
};

const findHeaderRow = (matrix = []) => {
  for (let index = 0; index < matrix.length; index++) {
    const row = matrix[index] || [];
    const headers = row.map(normalizeDisplayHeader);
    const employeeIdHeader = getEmployeeIdHeader(headers);
    if (employeeIdHeader) {
      return {
        headerRowIndex: index,
        headers,
        employeeIdHeader,
        pseudoNameHeader: getPseudoNameHeader(headers),
        employeeNameHeader: getEmployeeNameHeader(headers),
      };
    }
  }

  return {
    headerRowIndex: -1,
    headers: [],
    employeeIdHeader: "",
    pseudoNameHeader: "",
    employeeNameHeader: "",
  };
};

const findEmployeeForSalaryRow = async ({
  row,
  employeeIdHeader,
  pseudoNameHeader,
  employeeNameHeader,
}) => {
  const employeeCode = normalizeEmployeeCode(row[employeeIdHeader]);
  if (employeeCode) {
    const employee = await User.findOne({
      empId: { $regex: `^${escapeRegex(employeeCode)}$`, $options: "i" },
    });
    if (employee) {
      return { employee, matchedBy: "Emp. ID", lookupValue: employeeCode };
    }
  }

  const pseudoName = normalizeName(row[pseudoNameHeader]);
  if (pseudoName) {
    const employee = await User.findOne({
      pseudoName: { $regex: `^${escapeRegex(pseudoName)}$`, $options: "i" },
    });
    if (employee) {
      return { employee, matchedBy: "Pseduo NAME", lookupValue: pseudoName };
    }
  }

  const employeeName = normalizeName(row[employeeNameHeader]);
  if (employeeName) {
    const employee = await User.findOne({
      realName: { $regex: `^${escapeRegex(employeeName)}$`, $options: "i" },
    });
    if (employee) {
      return { employee, matchedBy: "Employee Name", lookupValue: employeeName };
    }
  }

  return {
    employee: null,
    matchedBy: "",
    lookupValue: employeeCode || pseudoName || employeeName || "",
  };
};

export const parseSalaryExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  const {
    headerRowIndex,
    headers,
    employeeIdHeader,
    pseudoNameHeader,
    employeeNameHeader,
  } = findHeaderRow(matrix);

  if (headerRowIndex === -1) {
    return {
      rows: [],
      headers: [],
      employeeIdHeader: "",
      pseudoNameHeader: "",
      employeeNameHeader: "",
      headerRowIndex,
    };
  }

  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => !isEmptyRow(row))
    .map((row) => buildRowObject(headers, row));

  return {
    rows,
    headers,
    employeeIdHeader,
    pseudoNameHeader,
    employeeNameHeader,
    headerRowIndex,
  };
};


/**
 * Import salary excel
 */
export const importSalaryExcel = async ({
  fileBuffer,
  month,
  year,
  uploadedBy,
  fileName,
}) => {
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
    `[SalarySlip] Import started: ${fileName}, rows=${rows.length}, month=${month}, year=${year}, ` +
    `employeeIdHeader=${employeeIdHeader || "NOT_FOUND"}, ` +
    `pseudoNameHeader=${pseudoNameHeader || "NOT_FOUND"}, ` +
    `employeeNameHeader=${employeeNameHeader || "NOT_FOUND"}, headerRow=${headerRowIndex + 1}`
  );

  // Create batch
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

  if (!employeeIdHeader) {
    batch.failedRows = rows.length;
    batch.status = "Failed";
    batch.remarks = `Employee ID column not found. Headers detected: ${headers.join(", ") || "none"}`;
    await batch.save();

    return {
      success: false,
      batch,
      totalRows: rows.length,
      successRows,
      failedRows: rows.length,
      failedRecords: [
        {
          employee: "",
          reason: "Employee ID column not found in Excel header row",
        },
      ],
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
          reason: `Employee identifiers missing in "${employeeIdHeader}", "${pseudoNameHeader}", and "${employeeNameHeader}"`,
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
          reason: "Employee not found",
        });

        continue;
      }

      /**
       * Duplicate check
       */
      const alreadyExists = await SalaryRecord.findOne({
        employeeId: employee._id,
        month,
        year,
      });

      if (alreadyExists) {
        await SalaryRecord.deleteOne({
          _id: alreadyExists._id,
        });
      }

      await SalaryRecord.create({
        batchId: batch._id,

        employeeId: employee._id,

        month,

        year,

        employeeCode: employee.empId,

        employeeName: employee.realName || employee.username,

        pseudoName: employee.pseudoName || "",

        department: employee.department || "",

        designation: employee.designation || "",

        joiningDate: employee.dateOfJoining,

        salaryData: row,

        uploadedBy,
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
  batch.remarks = failedRecords.slice(0, 10).map((item) => `${item.employee || "Unknown"}: ${item.reason}`).join("; ");

  await batch.save();
  console.log(`[SalarySlip] Import finished: success=${successRows}, failed=${failedRows}`);

  return {
    success: true,

    batch,

    totalRows: rows.length,

    successRows,

    failedRows,

    failedRecords,
  };
};
