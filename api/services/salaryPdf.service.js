// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

// const normalizeKey = (key = "") =>
//   String(key ?? "")
//     .trim()
//     .toLowerCase()
//     .replace(/[\s_./-]+/g, "")
//     .replace(/[^a-z0-9]/g, "");

// const formatValue = (value) => {
//   if (value === null || value === undefined || value === "") return "";
//   if (value instanceof Date) return value.toISOString().slice(0, 10);
//   if (typeof value === "number") {
//     return Number.isInteger(value)
//       ? value.toLocaleString("en-IN")
//       : value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
//   }
//   return String(value);
// };

// const currency = (value) => {
//   if (value === null || value === undefined || value === "") return "";
//   const numberValue = Number(value);
//   if (Number.isNaN(numberValue)) return formatValue(value);
//   return numberValue.toLocaleString("en-IN", {
//     minimumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
//     maximumFractionDigits: 2,
//   });
// };

// const getRowValue = (row = {}, aliases = []) => {
//   const aliasSet = new Set(aliases.map(normalizeKey));
//   const entry = Object.entries(row).find(([key]) => aliasSet.has(normalizeKey(key)));
//   return entry ? entry[1] : "";
// };

// const drawText = (page, text, options) => {
//   const safeText = String(text ?? "").replace(/\s+/g, " ").slice(0, options.maxChars || 90);
//   page.drawText(safeText, options);
// };

// const drawCell = ({
//   page,
//   x,
//   y,
//   width,
//   height,
//   text = "",
//   font,
//   size = 8,
//   align = "left",
//   fill,
//   border = rgb(0.48, 0.48, 0.48),
//   color = rgb(0.05, 0.05, 0.05),
//   padding = 5,
//   maxChars = 55,
// }) => {
//   if (fill) {
//     page.drawRectangle({ x, y, width, height, color: fill });
//   }
//   page.drawRectangle({
//     x,
//     y,
//     width,
//     height,
//     borderColor: border,
//     borderWidth: 0.6,
//   });

//   const value = String(text ?? "").replace(/\s+/g, " ").slice(0, maxChars);
//   const textWidth = font.widthOfTextAtSize(value, size);
//   const textX =
//     align === "right"
//       ? x + width - padding - textWidth
//       : align === "center"
//         ? x + (width - textWidth) / 2
//         : x + padding;

//   page.drawText(value, {
//     x: Math.max(x + padding, textX),
//     y: y + (height - size) / 2,
//     size,
//     font,
//     color,
//   });
// };

// const drawLogo = (page, { x, y, boldFont, font }) => {
//   // Colors
//   const navyBlue = rgb(0.03, 0.28, 0.5);    // Dark blue background
//   const white = rgb(1, 1, 1);                // White text
//   const goldenYellow = rgb(1, 0.84, 0);      // Golden yellow for accent
  
//   // Background rectangle with navy blue
//   page.drawRectangle({
//     x,
//     y,
//     width: 180,
//     height: 50,
//     color: navyBlue,
//   });
  
//   // "FD" in white - large and bold
//   page.drawText("FD", {
//     x: x + 15,
//     y: y + 14,
//     size: 24,
//     font: boldFont,
//     color: white,
//   });
  
//   // "BUSINESS" in golden yellow
//   page.drawText("BUSINESS", {
//     x: x + 55,
//     y: y + 28,
//     size: 11,
//     font: boldFont,
//     color: goldenYellow,
//   });
  
//   // "Services Private Limited" in white - smaller
//   page.drawText("Services Private Limited", {
//     x: x + 55,
//     y: y + 13,
//     size: 8,
//     font: font,
//     color: white,
//   });
// };

// const getSalarySections = (salaryData = {}) => {
//   const earnings = [
//     ["Basic Salary", getRowValue(salaryData, ["BASIC SALARY", "Basic Salary PAYABLE"])],
//     ["HRA", getRowValue(salaryData, ["HRA", "HRA PAYABLE"])],
//     ["Media", getRowValue(salaryData, ["MEDIA", "MEDI/A PAYABLE"])],
//     ["Conveyance", getRowValue(salaryData, ["CONV", "CONV PAYABLE"])],
//     ["Salary Payable", getRowValue(salaryData, ["Salary Payable"])],
//     ["OT Incentive", getRowValue(salaryData, ["OT Incentive"])],
//     ["Extra Conveyance", getRowValue(salaryData, ["Extra Conveyance"])],
//     ["Arrears", getRowValue(salaryData, ["Arrears"])],
//     ["Total Earnings", getRowValue(salaryData, ["Total Earnigs", "Total Earnings"])],
//   ];

//   const deductions = [
//     ["Advance", getRowValue(salaryData, ["ADVANCE"])],
//     ["UL/NCNS Deduction", getRowValue(salaryData, ["UL/NCNS Deduction"])],
//     ["EPF Deduction", getRowValue(salaryData, ["EPF Deduction"])],
//     ["ESIC", getRowValue(salaryData, ["ESIC"])],
//     ["LWF Deduction", getRowValue(salaryData, ["LWF Deduction"])],
//     ["T.D.S.", getRowValue(salaryData, ["T.D.S.", "TDS"])],
//     ["Total Deduction", getRowValue(salaryData, ["TOTAL DEDUCTION"])],
//   ];

//   return {
//     earnings: earnings.filter(([, value]) => value !== ""),
//     deductions: deductions.filter(([, value]) => value !== ""),
//   };
// };

// export const generateSalarySlipPdf = async (record) => {
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([612, 792]);
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//   const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//   const { width, height } = page.getSize();

//   const salaryData = record.salaryData || {};
//   const monthName = MONTH_NAMES[record.month] || String(record.month);
//   const titleMonth = `${monthName}-${record.year}`;
//   const margin = 36;
//   const tableBorder = rgb(0.36, 0.36, 0.36);
//   const lightBlue = rgb(0.84, 0.91, 0.98);
//   const lightGrey = rgb(0.94, 0.94, 0.94);
//   const navy = rgb(0.03, 0.28, 0.5);

//   // Draw single centered logo
//   const logoWidth = 180;
//   const logoHeight = 50;
//   const logoX = (width - logoWidth) / 2;
//   const logoY = height - 85;
//   drawLogo(page, { x: logoX, y: logoY, boldFont, font });

//   // Company name - centered below logo
//   // const companyName = "FD Business Services Pvt. Ltd.";
//   // const companySize = 14;
//   // const companyWidth = boldFont.widthOfTextAtSize(companyName, companySize);
//   // const companyX = (width - companyWidth) / 2;
//   // page.drawText(companyName, {
//   //   x: companyX,
//   //   y: logoY - 32,
//   //   size: companySize,
//   //   font: boldFont,
//   //   color: navy,
//   // });

//   // // Salary slip title - centered
//   // const titleText = `Salary Slip for the month of ${titleMonth}`;
//   // const titleSize = 11;
//   // const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
//   // const titleX = (width - titleWidth) / 2;
//   // page.drawText(titleText, {
//   //   x: titleX,
//   //   y: logoY - 50,
//   //   size: titleSize,
//   //   font: boldFont,
//   //   color: rgb(0.05, 0.05, 0.05),
//   // });

//   const lineY = logoY - 60;
//   page.drawLine({
//     start: { x: margin, y: lineY },
//     end: { x: width - margin, y: lineY },
//     thickness: 1,
//     color: tableBorder,
//   });

//   // Employee Information Table with Gross Salary
//   const employeeInfo = [
//     ["Employee Name", record.employeeName || getRowValue(salaryData, ["Employee Name"])],
//     ["Pseudo Name", record.pseudoName || getRowValue(salaryData, ["Pseduo NAME", "Pseudo Name"])],
//     ["Employee ID", record.employeeCode || getRowValue(salaryData, ["Emp. ID", "Emp ID"])],
//     ["Gross Salary", getRowValue(salaryData, ["GROSS SALARY"])],
//     ["Process", getRowValue(salaryData, ["Process"])],
//     ["Department", record.department || getRowValue(salaryData, ["DEPARTMENT"])],
//     ["Designation", record.designation || getRowValue(salaryData, ["Designation"])],
//     ["UAN No.", getRowValue(salaryData, ["UAN NO.", "UAN NO"])],
//     ["Days Payable", getRowValue(salaryData, ["DAYS PAYABLE"])],
//   ];

//   let y = lineY - 10;
//   const labelW = 100;
//   const valueW = 176;
//   const rowH = 22;
  
//   for (let index = 0; index < employeeInfo.length; index += 2) {
//     const left = employeeInfo[index];
//     const right = employeeInfo[index + 1];
    
//     if (left) {
//       drawCell({ 
//         page, x: margin, y, width: labelW, height: rowH, 
//         text: left[0], font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//       });
//       drawCell({ 
//         page, x: margin + labelW, y, width: valueW, height: rowH, 
//         text: formatValue(left[1]), font, size: 8, border: tableBorder 
//       });
//     }
    
//     if (right) {
//       drawCell({ 
//         page, x: margin + labelW + valueW, y, width: labelW, height: rowH, 
//         text: right[0], font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//       });
//       drawCell({ 
//         page, x: margin + labelW * 2 + valueW, y, width: valueW, height: rowH, 
//         text: formatValue(right[1]), font, size: 8, border: tableBorder 
//       });
//     } else {
//       // If odd number of items, fill remaining space with empty cells
//       drawCell({ 
//         page, x: margin + labelW + valueW, y, width: labelW, height: rowH, 
//         text: "", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//       });
//       drawCell({ 
//         page, x: margin + labelW * 2 + valueW, y, width: valueW, height: rowH, 
//         text: "", font, size: 8, border: tableBorder 
//       });
//     }
//     y -= rowH;
//   }

//   y -= 18;
//   const { earnings, deductions } = getSalarySections(salaryData);
//   const sectionX = margin;
//   const sectionW = (width - margin * 2) / 2;
//   const amountW = 82;
//   const labelColW = sectionW - amountW;

//   drawCell({ 
//     page, x: sectionX, y, width: sectionW, height: rowH, 
//     text: "Earnings", font: boldFont, size: 9, align: "center", fill: lightBlue, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + sectionW, y, width: sectionW, height: rowH, 
//     text: "Deductions", font: boldFont, size: 9, align: "center", fill: lightBlue, border: tableBorder 
//   });
//   y -= rowH;
  
//   drawCell({ 
//     page, x: sectionX, y, width: labelColW, height: rowH, 
//     text: "Particulars", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
//     text: "Amount", font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
//     text: "Particulars", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
//     text: "Amount", font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
//   });
//   y -= rowH;

//   const maxRows = Math.max(earnings.length, deductions.length, 10);
//   for (let index = 0; index < maxRows; index++) {
//     const earning = earnings[index] || ["", ""];
//     const deduction = deductions[index] || ["", ""];
//     drawCell({ 
//       page, x: sectionX, y, width: labelColW, height: rowH, 
//       text: earning[0], font, size: 8, border: tableBorder 
//     });
//     drawCell({ 
//       page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
//       text: currency(earning[1]), font, size: 8, align: "right", border: tableBorder 
//     });
//     drawCell({ 
//       page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
//       text: deduction[0], font, size: 8, border: tableBorder 
//     });
//     drawCell({ 
//       page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
//       text: currency(deduction[1]), font, size: 8, align: "right", border: tableBorder 
//     });
//     y -= rowH;
//   }

//   const totalEarnings = getRowValue(salaryData, ["Total Earnigs", "Total Earnings"]);
//   const totalDeduction = getRowValue(salaryData, ["TOTAL DEDUCTION"]);
//   drawCell({ 
//     page, x: sectionX, y, width: labelColW, height: rowH, 
//     text: "Total Earnings", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
//     text: currency(totalEarnings), font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
//     text: "Total Deduction", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
//     text: currency(totalDeduction), font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
//   });
//   y -= rowH + 16;

//   const netPay = getRowValue(salaryData, ["NET PAY"]);
//   drawCell({ 
//     page, x: margin, y, width: width - margin * 2 - 140, height: 28, 
//     text: "Net Pay", font: boldFont, size: 11, fill: lightBlue, border: tableBorder 
//   });
//   drawCell({ 
//     page, x: width - margin - 140, y, width: 140, height: 28, 
//     text: currency(netPay), font: boldFont, size: 11, align: "right", fill: lightBlue, border: tableBorder 
//   });

//   y -= 44;
//   page.drawText("This is a system generated salary slip and does not require signature.", {
//     x: margin,
//     y: y,
//     size: 8,
//     font: font,
//     color: rgb(0.35, 0.35, 0.35),
//   });

//   return Buffer.from(await pdfDoc.save());
// };







import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const normalizeKey = (key = "") =>
  String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_./-]+/g, "")
    .replace(/[^a-z0-9]/g, "");

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    return Math.round(value).toLocaleString("en-IN");
  }
  return String(value);
};

const currency = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return formatValue(value);
  return Math.round(numberValue).toLocaleString("en-IN");
};

const getRowValue = (row = {}, aliases = []) => {
  const aliasSet = new Set(aliases.map(normalizeKey));
  const entry = Object.entries(row).find(([key]) => aliasSet.has(normalizeKey(key)));
  return entry ? entry[1] : "";
};

const cleanPdfText = (text = "") =>
  String(text ?? "")
    .normalize("NFKC")
    .replace(/[\u0335-\u0338]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cleanNameText = (text = "") =>
  cleanPdfText(text).replace(/^[\s_-]+|[\s_-]+$/g, "");

const valueOrNA = (value) => {
  const displayValue = cleanPdfText(value);
  return displayValue ? displayValue : "NA";
};

const truncateText = (text, font, size, maxWidth) => {
  if (!text) return "";
  let displayText = cleanPdfText(text);
  
  if (!displayText) return "";
  if (font.widthOfTextAtSize(displayText, size) <= maxWidth) return displayText;
  
  while (displayText.length > 3 && font.widthOfTextAtSize(`${displayText}...`, size) > maxWidth) {
    displayText = displayText.slice(0, -1);
  }
  return `${displayText}...`;
};

const drawCell = ({
  page,
  x,
  y,
  width,
  height,
  text = "",
  font,
  size = 8,
  align = "left",
  fill,
  border = rgb(0.48, 0.48, 0.48),
  color = rgb(0.05, 0.05, 0.05),
  padding = 4,
}) => {
  if (fill) {
    page.drawRectangle({ x, y, width, height, color: fill });
  }
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: border,
    borderWidth: 0.6,
  });

  const value = cleanPdfText(text);
  const maxWidth = Math.max(0, width - padding * 2);
  const displayText = truncateText(value, font, size, maxWidth);
  const textWidth = font.widthOfTextAtSize(displayText, size);
  
  let textX;
  if (align === "right") {
    textX = x + width - padding - textWidth;
  } else if (align === "center") {
    textX = x + (width - textWidth) / 2;
  } else {
    textX = x + padding;
  }
  
  // Ensure text stays within bounds
  if (textX + textWidth > x + width - padding) {
    textX = x + width - padding - textWidth;
  }
  if (textX < x + padding) {
    textX = x + padding;
  }

  if (displayText) {
    const textHeight = font.heightAtSize(size, { descender: false });
    const textY = y + (height - textHeight) / 2;
    page.drawText(displayText, {
      x: textX,
      y: textY,
      size,
      font,
      color,
    });
  }
};

const drawLogo = (page, { x, y, boldFont, font }) => {
  // Colors
  const yellowBg = rgb(0.98, 0.81, 0.04);    // #FACF0B
  const navyBlue = rgb(0.04, 0.25, 0.38);    // #0A4161
  const white = rgb(1, 1, 1);
  
  // Website-style logo lockup from fdbs.in.
  const fdX = x;
  const fdY = y;
  const fdWidth = 50;
  const fdHeight = 36;
  
  // Yellow background for FD only
  page.drawRectangle({
    x: fdX,
    y: fdY,
    width: fdWidth,
    height: fdHeight,
    color: yellowBg,
  });
  
  // "FD" text in white
  const fdTextSize = 22;
  const fdText = "FD";
  const fdTextWidth = boldFont.widthOfTextAtSize(fdText, fdTextSize);
  const fdTextHeight = boldFont.heightAtSize(fdTextSize, { descender: false });
  page.drawText(fdText, {
    x: fdX + (fdWidth - fdTextWidth) / 2,
    y: fdY + (fdHeight - fdTextHeight) / 2 + 1,
    size: fdTextSize,
    font: boldFont,
    color: white,
  });
  
  const companyX = x + fdWidth + 8;
  const businessText = "BUSINESS";
  const businessSize = 18;
  const businessHeight = boldFont.heightAtSize(businessSize, { descender: false });
  page.drawText(businessText, {
    x: companyX,
    y: y + fdHeight - businessHeight - 2,
    size: businessSize,
    font: boldFont,
    color: navyBlue,
  });

  const companyName = "Service Private Limited";
  const companyMaxWidth = 180;
  let companySize = 9.5;
  while (companySize > 7 && font.widthOfTextAtSize(companyName, companySize) > companyMaxWidth) {
    companySize -= 0.5;
  }
  page.drawText(companyName, {
    x: companyX,
    y: y + 4,
    size: companySize,
    font,
    color: yellowBg,
  });
};

const getSalarySections = (salaryData = {}) => {
  const earnings = [
    ["Basic Salary", getRowValue(salaryData, ["BASIC SALARY", "Basic Salary PAYABLE"])],
    ["HRA", getRowValue(salaryData, ["HRA", "HRA PAYABLE"])],
    ["Media", getRowValue(salaryData, ["MEDIA", "MEDI/A PAYABLE"])],
    ["Conveyance", getRowValue(salaryData, ["CONV", "CONV PAYABLE"])],
    ["Salary Payable", getRowValue(salaryData, ["Salary Payable"])],
    ["OT Incentive", getRowValue(salaryData, ["OT Incentive"])],
    ["Extra Conveyance", getRowValue(salaryData, ["Extra Conveyance"])],
    ["Arrears", getRowValue(salaryData, ["Arrears"])],
    ["Total Earnings", getRowValue(salaryData, ["Total Earnigs", "Total Earnings"])],
  ];

  const deductions = [
    ["Advance", getRowValue(salaryData, ["ADVANCE"])],
    ["UL/NCNS Deduction", getRowValue(salaryData, ["UL/NCNS Deduction"])],
    ["EPF Deduction", getRowValue(salaryData, ["EPF Deduction"])],
    ["ESIC", getRowValue(salaryData, ["ESIC"])],
    ["LWF Deduction", getRowValue(salaryData, ["LWF Deduction"])],
    ["T.D.S.", getRowValue(salaryData, ["T.D.S.", "TDS"])],
    ["Total Deduction", getRowValue(salaryData, ["TOTAL DEDUCTION"])],
  ];

  return {
    earnings: earnings.filter(([, value]) => value !== ""),
    deductions: deductions.filter(([, value]) => value !== ""),
  };
};

export const generateSalarySlipPdf = async (record) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const salaryData = record.salaryData || {};
  const monthName = MONTH_NAMES[record.month] || String(record.month);
  const titleMonth = `${monthName}-${record.year}`;
  const margin = 36;
  const tableBorder = rgb(0.36, 0.36, 0.36);
  const lightBlue = rgb(0.84, 0.91, 0.98);
  const lightGrey = rgb(0.94, 0.94, 0.94);

  // Draw single centered logo (no blue background)
  const logoWidth = 238;
  const logoX = (width - logoWidth) / 2;
  const logoY = height - 75;
  drawLogo(page, { x: logoX, y: logoY, boldFont, font });

  const address = "118 -119-120 Suncity Success Tower Gurgaon 122005.";
  const addressSize = 9.5;
  const addressWidth = boldFont.widthOfTextAtSize(address, addressSize);
  page.drawText(address, {
    x: (width - addressWidth) / 2,
    y: logoY - 14,
    size: addressSize,
    font: boldFont,
    color: rgb(0.25, 0.25, 0.25),
  });

  const tableTopY = logoY - 32;

  // Employee Information Table
  const employeeInfo = [
    ["Employee Name", cleanNameText(record.employeeName || getRowValue(salaryData, ["Employee Name"]))],
    ["Employee ID", record.employeeCode || getRowValue(salaryData, ["Emp. ID", "Emp ID"])],
    ["Department", record.department || getRowValue(salaryData, ["DEPARTMENT"])],
    ["Designation", record.designation || getRowValue(salaryData, ["Designation"])],
    ["UAN No.", getRowValue(salaryData, ["UAN NO.", "UAN NO"])],
    [
      "Bank Account No.",
      valueOrNA(getRowValue(salaryData, ["Account No", "Account No.", "A/C No", "A/C No.", "Bank Account No", "Bank Account Number", "ACCOUNT NO"])),
    ],
    [
      "PAN No.",
      valueOrNA(getRowValue(salaryData, ["PAN No", "PAN No.", "PAN", "PAN Number", "PAN Card", "PAN CARD"])),
    ],
    [
      "Aadhaar No.",
      valueOrNA(getRowValue(salaryData, ["Aadhaar No", "Aadhaar No.", "Aadhar No", "Aadhar No.", "Aadhar no", "Aadhaar", "Aadhar", "AADHAAR NO", "AADHAR NO"])),
    ],
    ["Days Payable", getRowValue(salaryData, ["DAYS PAYABLE"])],
    ["Gross Salary", currency(getRowValue(salaryData, ["GROSS SALARY"]))],
  ];

  const labelW = 105;
  const valueW = 165;
  const rowH = 22;
  let y = tableTopY - rowH;
  
  for (let index = 0; index < employeeInfo.length; index += 2) {
    const left = employeeInfo[index];
    const right = employeeInfo[index + 1];
    
    if (left) {
      drawCell({ 
        page, x: margin, y, width: labelW, height: rowH, 
        text: left[0], font: boldFont, size: 8, fill: lightGrey, border: tableBorder,
        padding: 6
      });
      drawCell({ 
        page, x: margin + labelW, y, width: valueW, height: rowH, 
        text: formatValue(left[1]), font, size: 8, border: tableBorder,
        padding: 6
      });
    }
    
    if (right) {
      drawCell({ 
        page, x: margin + labelW + valueW, y, width: labelW, height: rowH, 
        text: right[0], font: boldFont, size: 8, fill: lightGrey, border: tableBorder,
        padding: 6
      });
      drawCell({ 
        page, x: margin + labelW * 2 + valueW, y, width: valueW, height: rowH, 
        text: formatValue(right[1]), font, size: 8, border: tableBorder,
        padding: 6
      });
    } else {
      // If odd number of items, fill remaining space with empty cells
      drawCell({ 
        page, x: margin + labelW + valueW, y, width: labelW, height: rowH, 
        text: "", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
      });
      drawCell({ 
        page, x: margin + labelW * 2 + valueW, y, width: valueW, height: rowH, 
        text: "", font, size: 8, border: tableBorder 
      });
    }
    y -= rowH;
  }

  y -= 18;
  const { earnings, deductions } = getSalarySections(salaryData);
  const sectionX = margin;
  const sectionW = (width - margin * 2) / 2;
  const amountW = 90;
  const labelColW = sectionW - amountW;

  drawCell({ 
    page, x: sectionX, y, width: sectionW, height: rowH, 
    text: "Earnings", font: boldFont, size: 9, align: "center", fill: lightBlue, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + sectionW, y, width: sectionW, height: rowH, 
    text: "Deductions", font: boldFont, size: 9, align: "center", fill: lightBlue, border: tableBorder 
  });
  y -= rowH;
  
  drawCell({ 
    page, x: sectionX, y, width: labelColW, height: rowH, 
    text: "Particulars", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
    text: "Amount", font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
    text: "Particulars", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
    text: "Amount", font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
  });
  y -= rowH;

  const maxRows = Math.max(earnings.length, deductions.length, 10);
  for (let index = 0; index < maxRows; index++) {
    const earning = earnings[index] || ["", ""];
    const deduction = deductions[index] || ["", ""];
    drawCell({ 
      page, x: sectionX, y, width: labelColW, height: rowH, 
      text: earning[0], font, size: 8, border: tableBorder,
      padding: 4
    });
    drawCell({ 
      page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
      text: currency(earning[1]), font, size: 8, align: "right", border: tableBorder,
      padding: 4
    });
    drawCell({ 
      page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
      text: deduction[0], font, size: 8, border: tableBorder,
      padding: 4
    });
    drawCell({ 
      page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
      text: currency(deduction[1]), font, size: 8, align: "right", border: tableBorder,
      padding: 4
    });
    y -= rowH;
  }

  const totalEarnings = getRowValue(salaryData, ["Total Earnigs", "Total Earnings"]);
  const totalDeduction = getRowValue(salaryData, ["TOTAL DEDUCTION"]);
  drawCell({ 
    page, x: sectionX, y, width: labelColW, height: rowH, 
    text: "Total Earnings", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + labelColW, y, width: amountW, height: rowH, 
    text: currency(totalEarnings), font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + sectionW, y, width: labelColW, height: rowH, 
    text: "Total Deduction", font: boldFont, size: 8, fill: lightGrey, border: tableBorder 
  });
  drawCell({ 
    page, x: sectionX + sectionW + labelColW, y, width: amountW, height: rowH, 
    text: currency(totalDeduction), font: boldFont, size: 8, align: "right", fill: lightGrey, border: tableBorder 
  });
  y -= rowH + 16;

  const netPay = getRowValue(salaryData, ["NET PAY"]);
  drawCell({ 
    page, x: margin, y, width: width - margin * 2 - 150, height: 28, 
    text: "Net Pay", font: boldFont, size: 11, fill: lightBlue, border: tableBorder 
  });
  drawCell({ 
    page, x: width - margin - 150, y, width: 150, height: 28, 
    text: currency(netPay), font: boldFont, size: 11, align: "right", fill: lightBlue, border: tableBorder 
  });

  y -= 44;
  page.drawText("This is a system generated salary slip and does not require signature.", {
    x: margin,
    y: y,
    size: 8,
    font: font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return Buffer.from(await pdfDoc.save());
};
