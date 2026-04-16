import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../Modals/User.modal.js";
import Roster from "../Modals/Roster.modal.js";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { notifySuperAdminsForHrAction } from "../utils/adminNotification.js";
import XLSX from "xlsx-js-style";
import {
  getRoleType,
  isHrDepartment,
  isPrivilegedUser,
  normalizeDepartment,
  toStorageDepartment,
  toStorageAccountType,
  withRoleType,
} from "../utils/roleAccess.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const JWT_SECRET = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export const signup = async (req, res) => {
//   try {
//     const { username, password, accountType, department, shiftLabel, isCoreTeam } = req.body;

//     if (req.user?.accountType !== "admin")
//       return res.status(403).json({ message: "Only admin can create users" });

//     if (!username || !password || !department || (!isCoreTeam && !shiftLabel))
//       return res.status(400).json({ message: "All fields are required" });

//     if (await User.exists({ username }))
//       return res.status(400).json({ message: "User already exists" });

//     const shiftMapping = {
//       "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
//       "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
//       "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
//       "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
//       "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
//       "11pm-8am": {shift: "Start", shiftStartHour: 23, shiftEndHour: 8},
//     };

//     const selectedShift = !isCoreTeam ? shiftMapping[shiftLabel] : null;
//     if (!isCoreTeam && !selectedShift)
//       return res.status(400).json({ message: "Invalid shift label" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       username,
//       password: hashedPassword,
//       accountType,
//       department,
//       isCoreTeam: accountType === "employee" && !!isCoreTeam,
//       shift: selectedShift?.shift || null,
//       shiftStartHour: selectedShift?.shiftStartHour || null,
//       shiftEndHour: selectedShift?.shiftEndHour || null,
//     });

//     res.status(201).json({
//       message: "User created successfully",
//       user: {
//         id: newUser._id,
//         username,
//         accountType,
//         department,
//         isCoreTeam: newUser.isCoreTeam,
//         shift: newUser.shift,
//         shiftStartHour: newUser.shiftStartHour,
//         shiftEndHour: newUser.shiftEndHour,
//       },
//     });
//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const shiftMapping = {
  "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
  "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
  "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
  "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
  "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
  "11pm-8am": { shift: "Start", shiftStartHour: 23, shiftEndHour: 8 },
};

const DEFAULT_POLICY_DOCUMENTS = [
  "/policies/Leave Policy.pdf",
  "/policies/IT Usage Policy.pdf",
  "/policies/Exit Policy 1.1.pdf",
  "/policies/Data Security Agreement.pdf",
  "/policies/Code of Conduct.pdf",
];
const REQUIRED_PREVIOUS_EMPLOYMENT_DOCS = new Set([
  "previous company - appointment letter",
  "previous company - last 3 months salary slip",
  "relieving/experience letter",
  "resignation acceptance",
]);

const LEGACY_POLICY_DOCS = new Set(["/policy-sample.txt", "policy-sample.txt"]);

const resolvePolicyDocuments = (policyDocuments = []) => {
  const normalized = normalizePolicyDocuments(policyDocuments);
  if (!normalized.length) return DEFAULT_POLICY_DOCUMENTS;
  const allLegacy = normalized.every((doc) => LEGACY_POLICY_DOCS.has(String(doc || "").trim()));
  return allLegacy ? DEFAULT_POLICY_DOCUMENTS : normalized;
};

const toBooleanYesNo = (value, fallback = "No") => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value).trim().toLowerCase();
  return normalized === "yes" || normalized === "true" ? "Yes" : "No";
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeDocumentList = (documents = []) => {
  if (!Array.isArray(documents)) return [];
  return documents
    .map((doc) => {
      if (typeof doc === "string") {
        const trimmed = doc.trim();
        return trimmed ? { name: trimmed } : null;
      }
      return doc;
    })
    .filter((doc) => doc && String(doc.name || "").trim())
    .map((doc) => ({
      name: String(doc.name || "").trim(),
      url: String(doc.url || "").trim(),
      publicId: String(doc.publicId || "").trim(),
      fileName: String(doc.fileName || "").trim(),
      mimeType: String(doc.mimeType || "").trim(),
      size: Number(doc.size || 0),
      uploaded: Boolean(doc.uploaded),
      uploadedAt: doc.uploaded ? new Date(doc.uploadedAt || Date.now()) : null,
      uploadedIp: String(doc.uploadedIp || "").trim(),
    }));
};

const normalizePolicyDocuments = (policyDocuments = []) => {
  if (!Array.isArray(policyDocuments)) return [];
  return [...new Set(policyDocuments.map((doc) => String(doc || "").trim()).filter(Boolean))];
};

const normalizePolicyKey = (value = "") => {
  const raw = String(value || "").trim().split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const normalizeIpAddress = (ip = "") => {
  const raw = String(ip || "").trim();
  if (!raw) return "";
  if (raw === "::1") return "127.0.0.1";
  if (raw.startsWith("::ffff:")) return raw.replace("::ffff:", "");
  return raw;
};

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
  const realIp = req.headers["x-real-ip"]?.toString().trim();
  const expressIp = req.ip;
  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
  return normalizeIpAddress(forwarded || realIp || expressIp || socketIp || "");
};

const uploadSignatureDataUrl = async (dataUrl, folder = "task_management/employee/policy_signatures") => {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    throw new Error("Invalid signature format");
  }
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const upsertPolicySignature = (existing = [], documentUrl, partyKey, patch = {}) => {
  const normalizedUrl = String(documentUrl || "").trim();
  const normalizedKey = normalizePolicyKey(normalizedUrl);
  if (!normalizedUrl) return existing || [];
  const next = Array.isArray(existing) ? [...existing] : [];
  const idx = next.findIndex((item) => normalizePolicyKey(item?.documentUrl || "") === normalizedKey);
  const currentRaw = idx >= 0 ? next[idx] : { documentUrl: normalizedUrl, employee: {}, hr: {} };
  const current =
    currentRaw && typeof currentRaw.toObject === "function"
      ? currentRaw.toObject()
      : { ...(currentRaw || {}) };
  current.documentUrl = normalizedUrl;
  current.employee = current.employee || {};
  current.hr = current.hr || {};
  current[partyKey] = {
    ...(current?.[partyKey] || {}),
    ...patch,
  };
  if (idx >= 0) {
    next[idx] = current;
  } else {
    next.push(current);
  }
  return next;
};

const normalizePolicySignatureItem = (signatureItem = {}, fallbackDocumentUrl = "") => {
  const raw =
    signatureItem && typeof signatureItem.toObject === "function"
      ? signatureItem.toObject()
      : { ...(signatureItem || {}) };
  const resolvedDocumentUrl = String(raw?.documentUrl || fallbackDocumentUrl || "").trim();
  if (!resolvedDocumentUrl) return null;
  return {
    documentUrl: resolvedDocumentUrl,
    employee: { ...(raw?.employee || {}) },
    hr: { ...(raw?.hr || {}) },
    signedPdfUrl: String(raw?.signedPdfUrl || "").trim(),
    signedPdfPublicId: String(raw?.signedPdfPublicId || "").trim(),
    signedPdfGeneratedAt: raw?.signedPdfGeneratedAt || null,
  };
};

const sanitizePolicySignatures = (policySignatures = [], fallbackDocumentUrl = "") => {
  const seen = new Set();
  const sanitized = [];
  for (const sig of Array.isArray(policySignatures) ? policySignatures : []) {
    const normalized = normalizePolicySignatureItem(sig, fallbackDocumentUrl);
    if (!normalized?.documentUrl) continue;
    const key = normalizePolicyKey(normalized.documentUrl);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    sanitized.push(normalized);
  }
  return sanitized;
};

const normalizeDocName = (value = "") => String(value || "").trim().toLowerCase();

const isPreviousEmploymentDoc = (name = "") => REQUIRED_PREVIOUS_EMPLOYMENT_DOCS.has(normalizeDocName(name));

const normalizeEmploymentType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "fresher") return "fresher";
  if (normalized === "experienced") return "experienced";
  return "";
};

const normalizeOptionalAmount = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const destroyCloudinaryAsset = async (publicId = "") => {
  const normalized = String(publicId || "").trim();
  if (!normalized) return;
  try {
    await cloudinary.uploader.destroy(normalized, { invalidate: true, resource_type: "image" });
  } catch (error) {
    console.warn("Failed to delete Cloudinary asset:", normalized, error?.message || error);
  }
};

const computeDocsStatus = ({ employmentType = "", documents = [], fallback = "No" } = {}) => {
  const normalizedEmployment = normalizeEmploymentType(employmentType);
  const docList = Array.isArray(documents) ? documents : [];
  const uploadedDocs = docList.filter((doc) => Boolean(doc?.uploaded));
  const anyUploaded = uploadedDocs.length > 0;

  if (normalizedEmployment === "fresher") {
    return anyUploaded ? "Yes" : "No";
  }
  if (normalizedEmployment !== "experienced") {
    return fallback;
  }

  const uploadedPreviousNames = new Set(uploadedDocs.map((doc) => normalizeDocName(doc?.name || "")));
  const hasAllPrevious = [...REQUIRED_PREVIOUS_EMPLOYMENT_DOCS].every((requiredDoc) =>
    uploadedPreviousNames.has(requiredDoc)
  );
  if (!hasAllPrevious) return "Pending";
  if (anyUploaded) return "Yes";
  return fallback === "Pending" ? "No" : fallback;
};

const isHrOverrideActive = (userLike = {}) => {
  const until = userLike?.hrDocumentOverrideUntil ? new Date(userLike.hrDocumentOverrideUntil) : null;
  return Boolean(until && !Number.isNaN(until.getTime()) && until.getTime() > Date.now());
};

const isHrGlobalOverrideActive = (userLike = {}) => {
  const until = userLike?.hrGlobalDocumentOverrideUntil ? new Date(userLike.hrGlobalDocumentOverrideUntil) : null;
  return Boolean(until && !Number.isNaN(until.getTime()) && until.getTime() > Date.now());
};

const evaluateLockedDocumentChanges = ({ existingDocuments = [], incomingDocuments = [] } = {}) => {
  const existingByName = new Map(
    (Array.isArray(existingDocuments) ? existingDocuments : [])
      .filter((doc) => normalizeDocName(doc?.name || ""))
      .map((doc) => [normalizeDocName(doc?.name || ""), doc])
  );
  const incomingByName = new Map(
    (Array.isArray(incomingDocuments) ? incomingDocuments : [])
      .filter((doc) => normalizeDocName(doc?.name || ""))
      .map((doc) => [normalizeDocName(doc?.name || ""), doc])
  );

  const locked = [];
  for (const [key, existing] of existingByName.entries()) {
    if (!(Boolean(existing?.uploaded) || String(existing?.url || "").trim())) continue;
    const incoming = incomingByName.get(key);
    if (!incoming) {
      locked.push(existing.name || "Unknown document");
      continue;
    }
    const currentUrl = String(existing?.url || "").trim();
    const nextUrl = String(incoming?.url || "").trim();
    if (currentUrl !== nextUrl) {
      locked.push(existing.name || incoming.name || "Unknown document");
    }
  }
  return locked;
};

const applyDocumentUploadAudit = ({ existingDocuments = [], incomingDocuments = [], uploadedIp = "" } = {}) => {
  const existingByName = new Map(
    (Array.isArray(existingDocuments) ? existingDocuments : [])
      .filter((doc) => normalizeDocName(doc?.name || ""))
      .map((doc) => [normalizeDocName(doc?.name || ""), doc])
  );

  return (Array.isArray(incomingDocuments) ? incomingDocuments : []).map((doc) => {
    const key = normalizeDocName(doc?.name || "");
    const existing = key ? existingByName.get(key) : null;
    const currentUrl = String(existing?.url || "").trim();
    const nextUrl = String(doc?.url || "").trim();
    const isNewOrReplaced = Boolean(nextUrl) && nextUrl !== currentUrl;

    if (isNewOrReplaced) {
      return {
        ...doc,
        uploaded: true,
        uploadedAt: new Date(),
        uploadedIp: String(uploadedIp || doc?.uploadedIp || existing?.uploadedIp || "").trim(),
      };
    }

    return {
      ...doc,
      uploaded: Boolean(doc?.uploaded ?? existing?.uploaded ?? false),
      uploadedAt: doc?.uploadedAt || existing?.uploadedAt || null,
      uploadedIp: String(doc?.uploadedIp || existing?.uploadedIp || ""),
    };
  });
};

const uploadPdfBuffer = async (buffer, publicIdPrefix = "signed_policy") => {
  const publicId = `task_management/employee/policy_signed_docs/${publicIdPrefix}_${Date.now()}`;
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: publicId,
        format: "pdf",
        overwrite: true,
        type: "upload",
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      }
    );
    stream.end(buffer);
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const getPolicyDocumentBaseUrls = () => {
  const envBases = [
    process.env.POLICY_DOC_BASE_URL,
    process.env.CLIENT_BASE_URL,
    process.env.FRONTEND_URL,
    process.env.APP_BASE_URL,
  ]
    .map((v) => String(v || "").trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaults = [
    "https://crm.fdbs.in",
    "https://crm.terranovasolutions.in",
    "http://localhost:5173",
  ];

  return [...new Set([...envBases, ...defaults])];
};

const loadDocumentBytes = async (documentUrl = "") => {
  const normalized = String(documentUrl || "").trim();
  if (!normalized) throw new Error("Missing document URL");

  if (/^https?:\/\//i.test(normalized)) {
    const response = await fetch(normalized);
    if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  const decodedPath = normalizePolicyKey(normalized);
  const relativePath = decodedPath.startsWith("/") ? decodedPath.slice(1) : decodedPath;
  const normalizedRelativePath = relativePath.replace(/^public[\\/]/i, "");
  const localCandidates = [
    path.resolve(__dirname, "../../Client/public", normalizedRelativePath),
    path.resolve(process.cwd(), "Client/public", normalizedRelativePath),
    path.resolve(process.cwd(), "public", normalizedRelativePath),
    path.resolve(__dirname, "../dist", normalizedRelativePath),
    path.resolve(process.cwd(), "dist", normalizedRelativePath),
    path.resolve(process.cwd(), "api/dist", normalizedRelativePath),
    path.resolve(process.cwd(), "Client/dist", normalizedRelativePath),
  ];

  for (const candidate of localCandidates) {
    try {
      return await fs.readFile(candidate);
    } catch (err) {
      if (err?.code !== "ENOENT") throw err;
    }
  }

  if (decodedPath.startsWith("/")) {
    const encodedPath = encodeURI(decodedPath);
    for (const base of getPolicyDocumentBaseUrls()) {
      try {
        const remoteUrl = `${base}${encodedPath}`;
        const response = await fetch(remoteUrl);
        if (!response.ok) continue;
        return Buffer.from(await response.arrayBuffer());
      } catch {
        // Try next base URL
      }
    }
  }

  throw new Error(`Policy file not found for path: ${decodedPath}`);
};

const loadImageBytes = async (imageUrl = "") => {
  const normalized = String(imageUrl || "").trim();
  if (!normalized) throw new Error("Missing image URL");
  const response = await fetch(normalized);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const looksLikePng = (bytes) =>
  bytes?.length >= 8 &&
  bytes[0] === 0x89 &&
  bytes[1] === 0x50 &&
  bytes[2] === 0x4e &&
  bytes[3] === 0x47;

const looksLikeJpeg = (bytes) =>
  bytes?.length >= 3 &&
  bytes[0] === 0xff &&
  bytes[1] === 0xd8 &&
  bytes[2] === 0xff;

const embedSignatureImage = async (pdfDoc, signatureBytes = [], signatureUrl = "") => {
  if (looksLikePng(signatureBytes)) {
    return pdfDoc.embedPng(signatureBytes);
  }
  if (looksLikeJpeg(signatureBytes)) {
    return pdfDoc.embedJpg(signatureBytes);
  }

  const lower = String(signatureUrl || "").toLowerCase();
  try {
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      return await pdfDoc.embedJpg(signatureBytes);
    }
    return await pdfDoc.embedPng(signatureBytes);
  } catch {
    try {
      return await pdfDoc.embedPng(signatureBytes);
    } catch {
      return await pdfDoc.embedJpg(signatureBytes);
    }
  }
};

const maybeGenerateSignedPolicyPdf = async ({ documentUrl = "", employeeSignatureUrl = "", hrSignatureUrl = "", publicIdKey = "" } = {}) => {
  if (!documentUrl) return null;
  const hasEmployeeSignature = Boolean(String(employeeSignatureUrl || "").trim());
  const hasHrSignature = Boolean(String(hrSignatureUrl || "").trim());
  if (!hasEmployeeSignature && !hasHrSignature) return null;

  const pdfBytes = await loadDocumentBytes(documentUrl);
  const employeeSigBytes = hasEmployeeSignature ? await loadImageBytes(employeeSignatureUrl) : null;
  const hrSigBytes = hasHrSignature ? await loadImageBytes(hrSignatureUrl) : null;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  if (!lastPage) throw new Error("Invalid policy document: no pages found");
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const empImage = employeeSigBytes
    ? await embedSignatureImage(pdfDoc, employeeSigBytes, employeeSignatureUrl)
    : null;
  const hrImage = hrSigBytes ? await embedSignatureImage(pdfDoc, hrSigBytes, hrSignatureUrl) : null;

  const { width: sourceWidth = 595, height: sourceHeight = 842 } = lastPage.getSize();
  const page = pdfDoc.addPage([sourceWidth, sourceHeight]);
  const { width, height } = page.getSize();
  const signWidth = 180;
  const signHeight = 62;
  const margin = 52;
  const panelY = Math.max(72, height - 230);

  page.drawText("Policy Signatures", {
    x: margin,
    y: panelY + 118,
    size: 16,
    font,
    color: rgb(0.12, 0.16, 0.24),
  });
  page.drawText("Generated after policy acknowledgment", {
    x: margin,
    y: panelY + 98,
    size: 10,
    font,
    color: rgb(0.42, 0.48, 0.58),
  });

  page.drawRectangle({
    x: margin - 12,
    y: panelY - 18,
    width: width - (margin - 12) * 2,
    height: 136,
    color: rgb(0.98, 0.99, 1),
    borderWidth: 1,
    borderColor: rgb(0.85, 0.9, 0.98),
  });
  page.drawText("Employee Signature", {
    x: margin,
    y: panelY + signHeight + 10,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("HR Signature", {
    x: width - margin - signWidth,
    y: panelY + signHeight + 10,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  if (empImage) {
    page.drawImage(empImage, { x: margin, y: panelY, width: signWidth, height: signHeight });
  } else {
    page.drawText("Pending", { x: margin + 56, y: panelY + 22, size: 11, font, color: rgb(0.55, 0.6, 0.67) });
  }
  if (hrImage) {
    page.drawImage(hrImage, { x: width - margin - signWidth, y: panelY, width: signWidth, height: signHeight });
  } else {
    page.drawText("Pending", {
      x: width - margin - signWidth + 56,
      y: panelY + 22,
      size: 11,
      font,
      color: rgb(0.55, 0.6, 0.67),
    });
  }

  const signedBytes = await pdfDoc.save();
  return uploadPdfBuffer(Buffer.from(signedBytes), publicIdKey || "policy_signed");
};

const refreshSignedPdfForSignature = async (signatureItem = {}, fallbackDocumentUrl = "") => {
  const item = normalizePolicySignatureItem(signatureItem, fallbackDocumentUrl);
  if (!item?.documentUrl) return null;
  const employeeSignatureUrl = String(item?.employee?.signatureUrl || "").trim();
  const hrSignatureUrl = String(item?.hr?.signatureUrl || "").trim();
  const hasAnySigned =
    Boolean(item?.employee?.signed && employeeSignatureUrl) ||
    Boolean(item?.hr?.signed && hrSignatureUrl);
  if (!hasAnySigned) {
    return {
      ...item,
      signedPdfUrl: "",
      signedPdfPublicId: "",
      signedPdfGeneratedAt: null,
    };
  }

  const generated = await maybeGenerateSignedPolicyPdf({
    documentUrl: item?.documentUrl || fallbackDocumentUrl,
    employeeSignatureUrl,
    hrSignatureUrl,
    publicIdKey: Buffer.from(normalizePolicyKey(item?.documentUrl || fallbackDocumentUrl || "policy")).toString("hex").slice(0, 24),
  });
  if (!generated) return item;

  return {
    ...item,
    signedPdfUrl: generated.url,
    signedPdfPublicId: generated.publicId,
    signedPdfGeneratedAt: new Date(),
  };
};

export const signup = async (req, res) => {
  try {
    const {
      username,
      password,
      accountType,
      department,
      shiftLabel,
      isCoreTeam,
      isTeamLeader,
      realName,
      pseudoName,
      empId,
      dateOfJoining,
      transportOffice,
      docsStatus,
      documents,
      designation,
      officeLocation,
      reportingManager,
      policyDocuments,
      employmentType,
      profilePhotoUrl,
      profilePhotoPublicId,
      ctc,
      inHandSalary,
      transportAllowance,
    } = req.body;
    const normalizedDepartment = normalizeDepartment(department);
    const storageDepartment = toStorageDepartment(normalizedDepartment);
    const storageRole = toStorageAccountType(accountType, isTeamLeader);
    const storageAccountType = storageRole.accountType;
    const storageIsTeamLeader = storageRole.isTeamLeader;
    const isEmployeeFlow = storageAccountType === "employee";

    // ⭐ NEW: check if any superAdmin exists
    const superAdminExists = await User.exists({
      accountType: "superAdmin",
    });

    // ⭐ NEW: allow first superAdmin creation without token
    const isFirstSuperAdmin = !superAdminExists && storageAccountType === "superAdmin";

    const isAdminOrSuperAdmin = isPrivilegedUser(req.user || {});

    // ⭐ MODIFIED: block only if NOT first superAdmin
    if (!isAdminOrSuperAdmin && !isFirstSuperAdmin) {
      return res.status(403).json({
        message: "Only admin, super admin and HR can create users",
      });
    }

    if (!username || !password || !normalizedDepartment || !accountType) {
      return res.status(400).json({
        message:
          "Username, password, department, and account type are required",
      });
    }

    if (isEmployeeFlow && !isCoreTeam && !shiftLabel) {
      return res.status(400).json({
        message: "Shift label is required for non-core team employees",
      });
    }

    if (isEmployeeFlow) {
      if (!realName || !pseudoName || !empId || !dateOfJoining || !designation) {
        return res.status(400).json({
          message:
            "Real name, pseudo name, employee ID, joining date, and designation are required for employees",
        });
      }
    }

    // 🔥 Parallel DB checks (kept your optimization)
    const [userExists, empIdExists] = await Promise.all([
      User.exists({ username }),
      isEmployeeFlow && empId ? User.exists({ empId: String(empId).trim() }) : Promise.resolve(false),
    ]);

    // 🔥 Only superAdmin can create another superAdmin (after first)
    if (
      storageAccountType === "superAdmin" &&
      superAdminExists &&
      req.user?.accountType !== "superAdmin"
    ) {
      return res.status(403).json({
        message: "Only super admin can create another super admin",
      });
    }

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (empIdExists) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const selectedShift = !isCoreTeam ? shiftMapping[shiftLabel] : null;

    if (isEmployeeFlow && !isCoreTeam && !selectedShift) {
      return res.status(400).json({ message: "Invalid shift label" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedDocuments = normalizeDocumentList(documents);
    const effectivePolicyDocuments = resolvePolicyDocuments(policyDocuments);
    const normalizedEmploymentType = normalizeEmploymentType(employmentType);
    const normalizedTransportOffice = toBooleanYesNo(transportOffice, "No");
    const normalizedDocsStatus = computeDocsStatus({
      employmentType: normalizedEmploymentType,
      documents: normalizedDocuments,
      fallback: toBooleanYesNo(docsStatus, "No"),
    });

    const newUserPayload = {
      username,
      password: hashedPassword,
      accountType: storageAccountType,
      department: storageDepartment,
      isCoreTeam: isEmployeeFlow && !!isCoreTeam,
      isTeamLeader: Boolean(storageIsTeamLeader),
      shift: selectedShift?.shift || null,
      shiftStartHour: selectedShift?.shiftStartHour || null,
      shiftEndHour: selectedShift?.shiftEndHour || null,
      realName: realName || "",
      pseudoName: pseudoName || "",
      empId: empId ? String(empId).trim() : "",
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
      transportOffice: normalizedTransportOffice,
      docsStatus: normalizedDocsStatus,
      employmentType: normalizedEmploymentType,
      documents: normalizedDocuments,
      designation: designation || "",
      officeLocation: String(officeLocation || "").trim(),
      reportingManager: reportingManager || null,
      profilePhotoUrl: String(profilePhotoUrl || "").trim(),
      profilePhotoPublicId: String(profilePhotoPublicId || "").trim(),
      ctc: normalizeOptionalAmount(ctc),
      inHandSalary: normalizeOptionalAmount(inHandSalary),
      transportAllowance: normalizeOptionalAmount(transportAllowance),
      policyDocuments: effectivePolicyDocuments,
      policySignatures: effectivePolicyDocuments.map((url) => ({
        documentUrl: url,
        employee: { signed: false },
        hr: { signed: false },
      })),
    };
    if (empId) {
      newUserPayload.empId = String(empId).trim();
    }

    const newUser = await User.create(newUserPayload);

    const populatedUser = await User.findById(newUser._id)
      .populate("reportingManager", "username realName")
      .select("-password")
      .lean();

    await notifySuperAdminsForHrAction({
      actor: req.user,
      action: "user_created",
      target: populatedUser,
      io: req.io,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: withRoleType(populatedUser),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// export const signup = async (req, res) => {
//   try {
//     const {
//       username,
//       password,
//       accountType,
//       department,
//       shiftLabel,
//       isCoreTeam,
//     } = req.body;

//     const isAdminOrSuperAdmin =
//       req.user?.accountType === "admin" ||
//       req.user?.accountType === "superAdmin" || 
//       req.user?.accountType === "HR";

//     if (!isAdminOrSuperAdmin) {
//       return res
//         .status(403)
//         .json({ message: "Only admin, super admin and HR can create users" });
//     }

//     const superAdminExists = await User.exists({
//       accountType: "superAdmin",
//     });

//     if (accountType === "superAdmin") {
//       if (superAdminExists && req.user.accountType !== "superAdmin") {
//         return res.status(403).json({
//           message: "Only super admin can create another super admin",
//         });
//       }
//     }

//     if (!username || !password || !department || !accountType) {
//       return res.status(400).json({
//         message:
//           "Username, password, department, and account type are required",
//       });
//     }

//     if (accountType === "employee" && !isCoreTeam && !shiftLabel) {
//       return res.status(400).json({
//         message: "Shift label is required for non-core team employees",
//       });
//     }

//     if (await User.exists({ username })) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const shiftMapping = {
//       "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
//       "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
//       "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
//       "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
//       "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
//       "11pm-8am": { shift: "Start", shiftStartHour: 23, shiftEndHour: 8 },
//     };

//     const selectedShift = !isCoreTeam ? shiftMapping[shiftLabel] : null;

//     if (accountType === "employee" && !isCoreTeam && !selectedShift) {
//       return res.status(400).json({ message: "Invalid shift label" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       username,
//       password: hashedPassword,
//       accountType,
//       department,
//       isCoreTeam: accountType === "employee" && !!isCoreTeam,
//       shift: selectedShift?.shift || null,
//       shiftStartHour: selectedShift?.shiftStartHour || null,
//       shiftEndHour: selectedShift?.shiftEndHour || null,
//     });

//     res.status(201).json({
//       message: "User created successfully",
//       user: {
//         id: newUser._id,
//         username,
//         accountType,
//         department,
//         isCoreTeam: newUser.isCoreTeam,
//         shift: newUser.shift,
//         shiftStartHour: newUser.shiftStartHour,
//         shiftEndHour: newUser.shiftEndHour,
//       },
//     });
//   } catch (error) {
//     console.error("Signup error:", error);
//     res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

export const createCoreTeamUser = async (req, res) => {
  try {
    const { username, password, accountType, department } = req.body;
    const normalizedDepartment = normalizeDepartment(department);
    const storageDepartment = toStorageDepartment(normalizedDepartment);
    const storageRole = toStorageAccountType(accountType || "agent", false);

    if (!isPrivilegedUser(req.user || {}))
      return res.status(403).json({ message: "Only privileged users can create users" });

    if (!username || !password || !normalizedDepartment)
      return res.status(400).json({ message: "Username, password, and department are required" });

    if (await User.exists({ username }))
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      accountType: storageRole.accountType,
      department: storageDepartment,
      isCoreTeam: true,
      isTeamLeader: Boolean(storageRole.isTeamLeader),
    });

    res.status(201).json({
      message: "Core team user created successfully",
      user: {
        id: newUser._id,
        username,
        accountType: newUser.accountType,
        roleType: getRoleType(newUser),
        department: normalizeDepartment(newUser.department),
        isCoreTeam: newUser.isCoreTeam,
      },
    });
  } catch (error) {
    console.error("Create Core Team User Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, identifier, password } = req.body;
    const loginIdentifier = String(identifier || username || "").trim();

    if (!loginIdentifier || !password)
      return res.status(400).json({ message: "Login ID and password are required" });

    const escaped = escapeRegex(loginIdentifier);
    const exactRegex = new RegExp(`^${escaped}$`, "i");
    const candidates = await User.find({
      $or: [
        { username: exactRegex },
        { empId: loginIdentifier },
        { pseudoName: exactRegex },
        { realName: exactRegex },
      ],
    }).lean();

    const pickUser = () => {
      if (!candidates.length) return null;
      const idLower = loginIdentifier.toLowerCase();
      return (
        candidates.find((u) => String(u.username || "").toLowerCase() === idLower) ||
        candidates.find((u) => String(u.empId || "") === loginIdentifier) ||
        candidates.find((u) => String(u.pseudoName || "").toLowerCase() === idLower) ||
        candidates.find((u) => String(u.realName || "").toLowerCase() === idLower) ||
        candidates[0]
      );
    };

    const user = pickUser();
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is inactive. You cannot login." });
    }

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, accountType: user.accountType },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        accountType: user.accountType,
        roleType: getRoleType(user),
        department: normalizeDepartment(user.department),
        isCoreTeam: user.isCoreTeam,
        isTeamLeader: user.isTeamLeader,
        isActive: user.isActive !== false,
        realName: user.realName || "",
        pseudoName: user.pseudoName || "",
        empId: user.empId || "",
        dateOfJoining: user.dateOfJoining || null,
        designation: user.designation || "",
        officeLocation: user.officeLocation || "",
        profilePhotoUrl: user.profilePhotoUrl || "",
        profilePhotoPublicId: user.profilePhotoPublicId || "",
        ctc: user.ctc ?? null,
        inHandSalary: user.inHandSalary ?? null,
        transportAllowance: user.transportAllowance ?? null,
        transportOffice: user.transportOffice || "No",
        docsStatus: user.docsStatus || "No",
        employmentType: user.employmentType || "",
        documents: user.documents || [],
        policyDocuments: user.policyDocuments || [],
        policySignatures: user.policySignatures || [],
        policyAgreement: user.policyAgreement || {},
        reportingManager: user.reportingManager || null,
        hrGlobalDocumentOverrideUntil: user.hrGlobalDocumentOverrideUntil || null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const getAllEmployees = async (req, res) => {
//   try {
//     const employees = await User.find(
//       { accountType: "employee" },
//       "_id username department isCoreTeam shiftStartHour shiftEndHour"
//     ).lean();

//     res.status(200).json(employees);
//   } catch (error) {
//     console.error("Get Employees Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const SUPER_ADMIN_VISIBLE_ROLES = [
  "employee",
  "admin",
  "superAdmin",
  "HR",
  "Operations",
  "AM",
  "agent",
  "supervisor",
];

const DEFAULT_EMPLOYEE_DOC_NAMES = [
  "Resume",
  "Photo",
  "Aadhaar Card",
  "PAN Card",
  "Current Address Proof",
  "Permanent Address Proof",
  "10th Marksheet",
  "12th Marksheet",
  "Graduation/Post Graduation Marksheet",
  "Additional Certificate",
  "Cancelled Cheque",
  "Bank Statement (Last 3 Months)",
  "Previous Company - Appointment Letter",
  "Previous Company - Last 3 Months Salary Slip",
  "Relieving/Experience Letter",
  "Resignation Acceptance",
  "Offer Letter",
  "Appointment Letter",
];

const getShiftLabelFromHours = (start, end) => {
  const startNum = Number(start);
  const endNum = Number(end);
  if (!Number.isFinite(startNum) || !Number.isFinite(endNum)) return "";
  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}${suffix}`;
  };
  return `${formatHour(startNum)}-${formatHour(endNum)}`;
};

const formatDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

export const getAllEmployees = async (req, res) => {
  try {
    const requester = req.user;
    const name = String(req.query?.name || "").trim();

    const isPrivilegedRole = isPrivilegedUser(requester || {});
    const query = isPrivilegedRole
      ? { accountType: { $in: SUPER_ADMIN_VISIBLE_ROLES } }
      : { accountType: "employee" };
    if (name) {
      const nameRegex = new RegExp(escapeRegex(name), "i");
      query.$or = [{ realName: nameRegex }, { username: nameRegex }];
    }

    const employees = await User.find(query)
      .select(
        "_id username department accountType isCoreTeam isTeamLeader isActive shiftStartHour shiftEndHour realName pseudoName empId dateOfJoining transportOffice docsStatus employmentType documents designation officeLocation reportingManager profilePhotoUrl profilePhotoPublicId ctc inHandSalary transportAllowance policyDocuments policySignatures policyAgreement hrDocumentOverrideUntil hrDocumentOverrideBy hrGlobalDocumentOverrideUntil hrGlobalDocumentOverrideBy createdAt"
      )
      .lean();

    const managerIds = [
      ...new Set(
        employees
          .map((e) => e?.reportingManager)
          .filter((id) => mongoose.Types.ObjectId.isValid(String(id || "")))
          .map((id) => String(id))
      ),
    ];
    const managerMap = new Map();
    if (managerIds.length) {
      const managers = await User.find({ _id: { $in: managerIds } })
        .select("_id username realName")
        .lean();
      for (const m of managers) {
        managerMap.set(String(m._id), m);
      }
    }
    const normalizedEmployees = employees.map((emp) => {
      const managerId = String(emp?.reportingManager || "");
      return withRoleType({
        ...emp,
        reportingManager: managerMap.get(managerId) || null,
      });
    });

    return res.status(200).json(normalizedEmployees);

  } catch (error) {
    console.error("Get Employees Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { username, password } = req.body;
    const updateFields = {};

    if (username) {
      const existingUser = await User.findOne({ username }).lean();
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateFields.username = username;
    }

    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: "-password" }
    ).lean();

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    if (!isPrivilegedUser(req.user || {})) {
      return res.status(403).json({ message: "Only privileged users can update users" });
    }

    const userId = req.params.id;
    const {
      username,
      accountType,
      department,
      shiftLabel,
      isCoreTeam,
      isTeamLeader,
      password,
      confirmPassword,
      empId,
      dateOfJoining,
      docsStatus,
      transportOffice,
      realName,
      pseudoName,
      designation,
      officeLocation,
      reportingManager,
      profilePhotoUrl,
      profilePhotoPublicId,
      ctc,
      inHandSalary,
      transportAllowance,
      policyDocuments,
      documents,
      employmentType,
      allowHrDocumentEdit,
      allowHrDocumentEditGlobal,
      hrDocumentOverrideMinutes,
      isActive,
    } = req.body;

    const updateData = {};

    if (username) {
      const existingUser = await User.findOne({ username }).lean();
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updateData.username = username;
    }

    if (accountType !== undefined) {
      const mapped = toStorageAccountType(accountType, isTeamLeader);
      updateData.accountType = mapped.accountType;
      if (isTeamLeader === undefined) {
        updateData.isTeamLeader = Boolean(mapped.isTeamLeader);
      }
    }
    if (department) updateData.department = toStorageDepartment(department);
    if (typeof isCoreTeam !== "undefined") updateData.isCoreTeam = isCoreTeam;
    if (typeof isTeamLeader !== "undefined") updateData.isTeamLeader = Boolean(isTeamLeader);
    if (dateOfJoining) updateData.dateOfJoining = new Date(dateOfJoining);
    if (empId !== undefined) {
      const normalizedEmpId = String(empId || "").trim();
      if (normalizedEmpId) {
        const existingEmpId = await User.findOne({ empId: normalizedEmpId }).lean();
        if (existingEmpId && existingEmpId._id.toString() !== userId) {
          return res.status(400).json({ message: "Employee ID already exists" });
        }
        updateData.empId = normalizedEmpId;
      } else {
        updateData.$unset = { ...(updateData.$unset || {}), empId: 1 };
      }
    }
    if (docsStatus !== undefined) updateData.docsStatus = toBooleanYesNo(docsStatus);
    if (transportOffice !== undefined) updateData.transportOffice = toBooleanYesNo(transportOffice);
    if (reportingManager !== undefined) {
      if (!reportingManager) {
        updateData.reportingManager = null;
      } else if (!mongoose.Types.ObjectId.isValid(String(reportingManager))) {
        return res.status(400).json({ message: "Invalid reporting manager id" });
      } else {
        updateData.reportingManager = reportingManager;
      }
    }
    if (realName !== undefined) updateData.realName = String(realName || "").trim();
    if (pseudoName !== undefined) updateData.pseudoName = String(pseudoName || "").trim();
    if (designation !== undefined) updateData.designation = String(designation || "").trim();
    if (officeLocation !== undefined) updateData.officeLocation = String(officeLocation || "").trim();
    if (profilePhotoUrl !== undefined) updateData.profilePhotoUrl = String(profilePhotoUrl || "").trim();
    if (profilePhotoPublicId !== undefined)
      updateData.profilePhotoPublicId = String(profilePhotoPublicId || "").trim();
    const payrollPayloadProvided =
      ctc !== undefined || inHandSalary !== undefined || transportAllowance !== undefined;
    if (payrollPayloadProvided && !(isHrDepartment(req.user || {}) || req.user.accountType === "superAdmin")) {
      return res
        .status(403)
        .json({ message: "Only HR and superAdmin can update payroll fields" });
    }
    if (ctc !== undefined) updateData.ctc = normalizeOptionalAmount(ctc);
    if (inHandSalary !== undefined) updateData.inHandSalary = normalizeOptionalAmount(inHandSalary);
    if (transportAllowance !== undefined)
      updateData.transportAllowance = normalizeOptionalAmount(transportAllowance);
    if (employmentType !== undefined) {
      updateData.employmentType = normalizeEmploymentType(employmentType);
    }

    const existingUserForUpdate = await User.findById(userId)
      .select(
        "accountType username realName empId documents employmentType profilePhotoPublicId profilePhotoUrl hrDocumentOverrideUntil hrGlobalDocumentOverrideUntil isActive"
      )
      .lean();
    if (!existingUserForUpdate) return res.status(404).json({ message: "User not found" });

    const wasActiveBeforeUpdate = existingUserForUpdate.isActive !== false;

    const isReactivationRequest =
      existingUserForUpdate.isActive === false &&
      isActive !== undefined &&
      Boolean(isActive) === true;

    if (isReactivationRequest && req.user?.accountType !== "superAdmin") {
      return res.status(403).json({
        message: "Only superAdmin can reactivate an inactive user.",
      });
    }

    if (existingUserForUpdate.isActive === false && !isReactivationRequest) {
      return res.status(403).json({
        message: "Inactive user cannot be edited from Manage Employee.",
      });
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (allowHrDocumentEdit !== undefined) {
      if (req.user.accountType !== "superAdmin") {
        return res.status(403).json({ message: "Only superAdmin can grant HR document override" });
      }
      const shouldAllow = Boolean(allowHrDocumentEdit);
      if (shouldAllow) {
        const minutes = Number(hrDocumentOverrideMinutes || 30);
        const validMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 240) : 30;
        updateData.hrDocumentOverrideUntil = new Date(Date.now() + validMinutes * 60 * 1000);
        updateData.hrDocumentOverrideBy = req.user._id;
      } else {
        updateData.hrDocumentOverrideUntil = null;
        updateData.hrDocumentOverrideBy = null;
      }
    }

    if (allowHrDocumentEditGlobal !== undefined) {
      if (req.user.accountType !== "superAdmin") {
        return res.status(403).json({ message: "Only superAdmin can grant global HR document override" });
      }
      if (!isHrDepartment(existingUserForUpdate || {})) {
        return res.status(400).json({ message: "Global HR document override can only be granted to HR accounts" });
      }
      const shouldAllowGlobal = Boolean(allowHrDocumentEditGlobal);
      if (shouldAllowGlobal) {
        const minutes = Number(hrDocumentOverrideMinutes || 30);
        const validMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 720) : 30;
        updateData.hrGlobalDocumentOverrideUntil = new Date(Date.now() + validMinutes * 60 * 1000);
        updateData.hrGlobalDocumentOverrideBy = req.user._id;
      } else {
        updateData.hrGlobalDocumentOverrideUntil = null;
        updateData.hrGlobalDocumentOverrideBy = null;
      }
    }
    if (policyDocuments !== undefined) {
      const normalizedPolicyDocs = resolvePolicyDocuments(policyDocuments);
      updateData.policyDocuments = normalizedPolicyDocs;
      const existingUser = await User.findById(userId).select("policySignatures").lean();
      const currentSignatures = Array.isArray(existingUser?.policySignatures) ? existingUser.policySignatures : [];
      updateData.policySignatures = normalizedPolicyDocs.map((docUrl) => {
        const found = currentSignatures.find((sig) => String(sig?.documentUrl || "").trim() === docUrl);
        return (
          found || {
            documentUrl: docUrl,
            employee: { signed: false },
            hr: { signed: false },
          }
        );
      });
    }
    if (documents !== undefined) {
      const normalizedIncomingDocs = normalizeDocumentList(documents);

      const hasEmployeeScopedOverride = isHrOverrideActive(existingUserForUpdate);
      const hasGlobalHrOverride = isHrGlobalOverrideActive(req.user);
      if (isHrDepartment(req.user || {}) && !(hasEmployeeScopedOverride || hasGlobalHrOverride)) {
        const lockedDocuments = evaluateLockedDocumentChanges({
          existingDocuments: existingUserForUpdate.documents || [],
          incomingDocuments: normalizedIncomingDocs,
        });
        if (lockedDocuments.length) {
          return res.status(403).json({
            message: `Document update blocked for: ${lockedDocuments.join(", ")}. Ask superAdmin for permission.`,
          });
        }
      }

      updateData.documents = applyDocumentUploadAudit({
        existingDocuments: existingUserForUpdate.documents || [],
        incomingDocuments: normalizedIncomingDocs,
        uploadedIp: getRequestIp(req),
      });
    }

    if (documents !== undefined || employmentType !== undefined || docsStatus !== undefined) {
      const docsForStatus = documents !== undefined ? updateData.documents || [] : existingUserForUpdate.documents || [];
      const employmentForStatus = updateData.employmentType ?? existingUserForUpdate.employmentType ?? "";
      updateData.docsStatus = computeDocsStatus({
        employmentType: employmentForStatus,
        documents: docsForStatus,
        fallback: updateData.docsStatus || "No",
      });
    }

    if (!isCoreTeam && shiftLabel) {
      const shiftMapping = {
        "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
        "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
        "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
        "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
        "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
        "11pm-8am": { shift: "Start", shiftStartHour: 23, shiftEndHour: 8 },
      };
      
      const selected = shiftMapping[shiftLabel];
      if (!selected) return res.status(400).json({ message: "Invalid shift label" });

      updateData.shift = selected.shift;
      updateData.shiftStartHour = selected.shiftStartHour;
      updateData.shiftEndHour = selected.shiftEndHour;
    } else if (isCoreTeam) {
      updateData.shift = null;
      updateData.shiftStartHour = null;
      updateData.shiftEndHour = null;
    }

    if (password) {
      if (!confirmPassword) {
        return res.status(400).json({ message: "Confirm password is required" });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
      
      updateData.passwordLastReset = new Date();
    }

    const nextProfilePhotoUrl = String(updateData.profilePhotoUrl || "").trim();
    const prevProfilePhotoUrl = String(existingUserForUpdate.profilePhotoUrl || "").trim();
    const nextProfilePhotoPublicId = String(updateData.profilePhotoPublicId || "").trim();
    const prevProfilePhotoPublicId = String(existingUserForUpdate.profilePhotoPublicId || "").trim();
    const profilePhotoChanged =
      (nextProfilePhotoUrl && nextProfilePhotoUrl !== prevProfilePhotoUrl) ||
      (nextProfilePhotoPublicId && nextProfilePhotoPublicId !== prevProfilePhotoPublicId);
    if (profilePhotoChanged && prevProfilePhotoPublicId) {
      await destroyCloudinaryAsset(prevProfilePhotoPublicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(Object.keys(updateData).some((k) => k !== "$unset") ? { $set: Object.fromEntries(Object.entries(updateData).filter(([k]) => k !== "$unset")) } : {}),
        ...(updateData.$unset ? { $unset: updateData.$unset } : {}),
      },
      { new: true }
    )
      .select("-password")
      .populate("reportingManager", "username realName")
      .lean();

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    const isNowInactive = updatedUser.isActive === false;
    if (wasActiveBeforeUpdate && isNowInactive) {
      await notifySuperAdminsForHrAction({
        actor: req.user,
        action: "user_inactivated",
        target: updatedUser,
        io: req.io,
      });
    }

    const responseData = {
      message: "User updated successfully",
      user: withRoleType(updatedUser),
      passwordReset: password ? true : false
    };
    if (password) {
      responseData.message = "User updated and password reset successfully";
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const exportEmployeeDetailsExcel = async (req, res) => {
  try {
    const requester = req.user;
    if (!isPrivilegedUser(requester || {})) {
      return res.status(403).json({ message: "Only superAdmin, admin and HR can export employees" });
    }

    const employees = await User.find({ accountType: { $in: SUPER_ADMIN_VISIBLE_ROLES } })
      .select(
        "_id username realName pseudoName empId accountType department designation officeLocation reportingManager dateOfJoining isActive isCoreTeam isTeamLeader shiftStartHour shiftEndHour transportOffice docsStatus employmentType ctc inHandSalary transportAllowance policyDocuments policyAgreement hrDocumentOverrideUntil hrGlobalDocumentOverrideUntil documents createdAt updatedAt"
      )
      .lean();

    const managerIds = [
      ...new Set(
        employees
          .map((e) => e?.reportingManager)
          .filter((id) => mongoose.Types.ObjectId.isValid(String(id || "")))
          .map((id) => String(id))
      ),
    ];

    const managerMap = new Map();
    if (managerIds.length) {
      const managers = await User.find({ _id: { $in: managerIds } })
        .select("_id username realName")
        .lean();
      for (const m of managers) {
        managerMap.set(String(m._id), m);
      }
    }

    const discoveredDocNames = new Set(DEFAULT_EMPLOYEE_DOC_NAMES.map((doc) => String(doc || "").trim()));
    for (const employee of employees) {
      for (const doc of Array.isArray(employee?.documents) ? employee.documents : []) {
        const name = String(doc?.name || "").trim();
        if (name) discoveredDocNames.add(name);
      }
    }
    const docColumns = [...discoveredDocNames];

    const rows = employees.map((emp, index) => {
      const manager = managerMap.get(String(emp?.reportingManager || ""));
      const docStatusByName = new Map();
      for (const doc of Array.isArray(emp?.documents) ? emp.documents : []) {
        const name = String(doc?.name || "").trim();
        if (!name) continue;
        const hasDoc = Boolean(doc?.uploaded || String(doc?.url || "").trim());
        docStatusByName.set(name, hasDoc ? "Yes" : "No");
      }

      const row = {
        "S No": index + 1,
        "Employee ID": emp?.empId || "",
        "Username": emp?.username || "",
        "Real Name": emp?.realName || "",
        "Pseudo Name": emp?.pseudoName || "",
        "Account Type": emp?.accountType || "",
        "Department": emp?.department || "",
        "Designation": emp?.designation || "",
        "Office Location": emp?.officeLocation || "",
        "Reporting Manager": manager?.realName || manager?.username || "",
        "Date Of Joining": formatDateOnly(emp?.dateOfJoining),
        "Account Status": emp?.isActive === false ? "Inactive" : "Active",
        "Core Team": emp?.isCoreTeam ? "Yes" : "No",
        "Team Leader": emp?.isTeamLeader ? "Yes" : "No",
        "Shift": getShiftLabelFromHours(emp?.shiftStartHour, emp?.shiftEndHour),
        "Shift Start Hour": Number.isFinite(Number(emp?.shiftStartHour)) ? Number(emp.shiftStartHour) : "",
        "Shift End Hour": Number.isFinite(Number(emp?.shiftEndHour)) ? Number(emp.shiftEndHour) : "",
        "Transport Office": emp?.transportOffice || "",
        "Docs Status": emp?.docsStatus || "",
        "Employment Type": emp?.employmentType || "",
        "CTC": emp?.ctc ?? "",
        "In Hand Salary": emp?.inHandSalary ?? "",
        "Transport Allowance": emp?.transportAllowance ?? "",
        "Policy Assigned": Array.isArray(emp?.policyDocuments) && emp.policyDocuments.length ? "Yes" : "No",
        "Policy Agreed": emp?.policyAgreement?.agreed ? "Yes" : "No",
        "Policy Agreed At": formatDateTime(emp?.policyAgreement?.agreedAt),
        "HR Override Active": emp?.hrDocumentOverrideUntil ? "Yes" : "No",
        "HR Override Until": formatDateTime(emp?.hrDocumentOverrideUntil),
        "HR Global Override Active": emp?.hrGlobalDocumentOverrideUntil ? "Yes" : "No",
        "HR Global Override Until": formatDateTime(emp?.hrGlobalDocumentOverrideUntil),
        "Created At": formatDateTime(emp?.createdAt),
        "Updated At": formatDateTime(emp?.updatedAt),
      };

      for (const docName of docColumns) {
        row[`Doc - ${docName}`] = docStatusByName.get(docName) || "No";
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    const fileName = `Employee_Details_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    return res.send(buffer);
  } catch (error) {
    console.error("Export employee details excel error:", error);
    return res.status(500).json({ message: "Failed to export employee details", error: error.message });
  }
};

export const getReportingManagers = async (req, res) => {
  try {
    const normalizedDepartment = normalizeDepartment(req.query?.department || "Operations");
    const storageDepartment = toStorageDepartment(normalizedDepartment);
    const departmentRegex = new RegExp(`^\\s*${String(storageDepartment).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

    let managers = await User.find({
      department: departmentRegex,
      isTeamLeader: true,
    })
      .select("_id username realName accountType department isTeamLeader")
      .sort({ username: 1 })
      .lean();

    if (!managers.length) {
      managers = await User.find({
        department: departmentRegex,
        $or: [{ isTeamLeader: true }, { accountType: "superAdmin" }],
      })
        .select("_id username realName accountType department isTeamLeader")
        .sort({ username: 1 })
        .lean();
    }

    if (!managers.length) {
      managers = await User.find({
        department: departmentRegex,
        accountType: "employee",
      })
        .select("_id username realName accountType department isTeamLeader")
        .sort({ username: 1 })
        .lean();
    }

    return res.status(200).json(managers);
  } catch (error) {
    console.error("Get reporting managers error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const startOfDay = (dateLike) => {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (dateLike) => {
  const d = new Date(dateLike);
  d.setHours(23, 59, 59, 999);
  return d;
};

const findWeekContainingDate = (rosters = [], date) => {
  const target = startOfDay(date).getTime();
  for (const roster of rosters) {
    for (const week of roster.weeks || []) {
      const weekStart = startOfDay(week.startDate).getTime();
      const weekEnd = endOfDay(week.endDate).getTime();
      if (target >= weekStart && target <= weekEnd) {
        return { roster, week };
      }
    }
  }
  return null;
};

const findEmployeeInWeek = (week, user) => {
  if (!week?.employees?.length) return null;
  return (
    week.employees.find((emp) => emp?.userId && String(emp.userId) === String(user._id)) ||
    week.employees.find((emp) => String(emp?.name || "").toLowerCase() === String(user.username || "").toLowerCase()) ||
    null
  );
};

export const getEmployeeDashboardSummary = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();
    const today = startOfDay(now);
    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);

    const rangeStart = startOfDay(today);
    const rangeEnd = endOfDay(nextWeekDate);

    const rosters = await Roster.find({
      rosterStartDate: { $lte: rangeEnd },
      rosterEndDate: { $gte: rangeStart },
    })
      .select("_id month year rosterStartDate rosterEndDate weeks")
      .sort({ rosterStartDate: 1, rosterEndDate: 1, year: 1, month: 1 })
      .lean();

    const currentWeekResult = findWeekContainingDate(rosters, today);
    const nextWeekResult = findWeekContainingDate(rosters, nextWeekDate);

    const currentWeekEmployee = findEmployeeInWeek(currentWeekResult?.week, user);
    const nextWeekEmployee = findEmployeeInWeek(nextWeekResult?.week, user);

    const mapWeekData = (result, employee) => {
      if (!result?.week || !employee) return null;
      return {
        rosterId: result.roster._id,
        weekNumber: result.week.weekNumber,
        startDate: result.week.startDate,
        endDate: result.week.endDate,
        shiftStartHour: employee.shiftStartHour,
        shiftEndHour: employee.shiftEndHour,
        transport: employee.transport || user.transportOffice || "No",
        cabRoute: employee.cabRoute || "",
        dailyStatus: (employee.dailyStatus || []).map((day) => ({
          date: day.date,
          status: day.status || "",
          departmentStatus: day.departmentStatus || "",
          transportStatus: day.transportStatus || "",
          punchIn: day.punchIn || null,
          punchOut: day.punchOut || null,
          totalHours: day.totalHours ?? null,
        })),
      };
    };

    const currentWeek = mapWeekData(currentWeekResult, currentWeekEmployee);
    const nextWeek = mapWeekData(nextWeekResult, nextWeekEmployee);

    const currentWeekAttendance = (currentWeek?.dailyStatus || []).map((day) => ({
      date: day.date,
      status: day.status || "",
      departmentStatus: day.departmentStatus || "",
      transportStatus: day.transportStatus || "",
      punchIn: day.punchIn || null,
      punchOut: day.punchOut || null,
      totalHours: day.totalHours ?? null,
    }));

    const effectivePolicyDocuments = resolvePolicyDocuments(user.policyDocuments);

    return res.status(200).json({
      profile: {
        id: user._id,
        username: user.username,
        realName: user.realName || "",
        pseudoName: user.pseudoName || "",
        empId: user.empId || "",
        dateOfJoining: user.dateOfJoining || null,
        department: user.department || "",
        designation: user.designation || "",
        officeLocation: user.officeLocation || "",
        profilePhotoUrl: user.profilePhotoUrl || "",
        profilePhotoPublicId: user.profilePhotoPublicId || "",
        ctc: user.ctc ?? null,
        inHandSalary: user.inHandSalary ?? null,
        transportAllowance: user.transportAllowance ?? null,
        transportOffice: user.transportOffice || "No",
        docsStatus: user.docsStatus || "No",
        documents: user.documents || [],
        policyDocuments: effectivePolicyDocuments,
        policySignatures: user.policySignatures || [],
        policyAgreement: user.policyAgreement || {},
        reportingManager: user.reportingManager || null,
        isTeamLeader: user.isTeamLeader || false,
      },
      roster: {
        currentWeek,
        nextWeek,
      },
      attendance: {
        currentWeek: currentWeekAttendance,
      },
    });
  } catch (error) {
    console.error("Get employee dashboard summary error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const acceptPolicyAgreement = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { version = "v1" } = req.body || {};

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "policyAgreement.agreed": true,
          "policyAgreement.agreedAt": new Date(),
          "policyAgreement.agreedIp": getRequestIp(req),
          "policyAgreement.version": version,
        },
      },
      { new: true }
    )
      .select("-password")
      .lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Policy accepted successfully",
      policyAgreement: updated.policyAgreement,
      user: updated,
    });
  } catch (error) {
    console.error("Policy acceptance error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const signPolicyDocumentByEmployee = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (getRoleType(req.user || {}) === "superAdmin") {
      return res.status(403).json({ message: "Only employee can sign this endpoint" });
    }

    const { documentUrl, signatureDataUrl, version = "v1" } = req.body || {};
    const normalizedUrl = String(documentUrl || "").trim();
    if (!normalizedUrl) return res.status(400).json({ message: "Policy document URL is required" });
    if (!signatureDataUrl) return res.status(400).json({ message: "Signature is required" });

    const user = await User.findById(userId).select("policyDocuments policySignatures policyAgreement");
    if (!user) return res.status(404).json({ message: "User not found" });

    const effectivePolicyDocuments = resolvePolicyDocuments(user.policyDocuments);

    const normalizedDocKey = normalizePolicyKey(normalizedUrl);
    const hasPolicy = effectivePolicyDocuments.some((doc) => normalizePolicyKey(doc || "") === normalizedDocKey);
    if (!hasPolicy) {
      return res.status(400).json({ message: "Selected policy is not assigned to employee" });
    }

    const uploadedSignature = await uploadSignatureDataUrl(signatureDataUrl);
    const now = new Date();
    user.policySignatures = upsertPolicySignature(user.policySignatures, normalizedUrl, "employee", {
      signed: true,
      signedAt: now,
      signedIp: getRequestIp(req),
      signatureUrl: uploadedSignature.url,
      signaturePublicId: uploadedSignature.publicId,
      signedBy: userId,
    });
    const signedIdx = user.policySignatures.findIndex(
      (sig) => normalizePolicyKey(sig?.documentUrl || "") === normalizedDocKey
    );
    if (signedIdx >= 0) {
      const refreshed = await refreshSignedPdfForSignature(
        user.policySignatures[signedIdx],
        normalizedUrl
      );
      if (refreshed) {
        user.policySignatures[signedIdx] = refreshed;
      }
    }
    user.policySignatures = sanitizePolicySignatures(user.policySignatures, normalizedUrl);

    const assignedDocs = normalizePolicyDocuments(effectivePolicyDocuments);
    const allEmployeeSigned =
      assignedDocs.length > 0 &&
      assignedDocs.every((docUrl) =>
        user.policySignatures.some(
          (sig) =>
            normalizePolicyKey(sig?.documentUrl || "") === normalizePolicyKey(docUrl) &&
            Boolean(sig?.employee?.signed)
        )
      );

    user.policyAgreement = {
      ...(user.policyAgreement || {}),
      agreed: allEmployeeSigned,
      agreedAt: allEmployeeSigned ? now : null,
      agreedIp: allEmployeeSigned ? getRequestIp(req) : "",
      version,
    };

    await user.save();

    return res.status(200).json({
      message: "Policy signed successfully",
      policySignatures: user.policySignatures,
      policyAgreement: user.policyAgreement,
    });
  } catch (error) {
    console.error("Employee policy signature error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const signPolicyDocumentByHR = async (req, res) => {
  try {
    const signer = req.user;
    if (!signer || !["HR", "superAdmin", "admin"].includes(signer.accountType)) {
      return res.status(403).json({ message: "Only HR, admin, or superAdmin can sign as HR" });
    }

    const targetUserId = req.params.id;
    const { documentUrl, signatureDataUrl, party = "hr" } = req.body || {};
    const partyKey = party === "employee" ? "employee" : "hr";
    const normalizedUrl = String(documentUrl || "").trim();
    if (!targetUserId) return res.status(400).json({ message: "Employee id is required" });
    if (!normalizedUrl) return res.status(400).json({ message: "Policy document URL is required" });
    if (!signatureDataUrl) return res.status(400).json({ message: "Signature is required" });

    const employee = await User.findById(targetUserId).select("accountType policyDocuments policySignatures");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    if (getRoleType(employee || {}) === "superAdmin") {
      return res.status(400).json({ message: "Target user is not an employee" });
    }

    const effectivePolicyDocuments = resolvePolicyDocuments(employee.policyDocuments);
    const normalizedDocKey = normalizePolicyKey(normalizedUrl);
    const hasPolicy = effectivePolicyDocuments.some((doc) => normalizePolicyKey(doc || "") === normalizedDocKey);
    if (!hasPolicy) {
      return res.status(400).json({ message: "Selected policy is not assigned to employee" });
    }

    const uploadedSignature = await uploadSignatureDataUrl(
      signatureDataUrl,
      "task_management/employee/policy_signatures/hr"
    );
    employee.policySignatures = upsertPolicySignature(employee.policySignatures, normalizedUrl, partyKey, {
      signed: true,
      signedAt: new Date(),
      signedIp: getRequestIp(req),
      signatureUrl: uploadedSignature.url,
      signaturePublicId: uploadedSignature.publicId,
      signedBy: signer._id,
    });
    const signedIdx = employee.policySignatures.findIndex(
      (sig) => normalizePolicyKey(sig?.documentUrl || "") === normalizedDocKey
    );
    if (signedIdx >= 0) {
      const refreshed = await refreshSignedPdfForSignature(
        employee.policySignatures[signedIdx],
        normalizedUrl
      );
      if (refreshed) {
        employee.policySignatures[signedIdx] = refreshed;
      }
    }
    employee.policySignatures = sanitizePolicySignatures(employee.policySignatures, normalizedUrl);

    const assignedDocs = normalizePolicyDocuments(effectivePolicyDocuments);
    const allEmployeeSigned =
      assignedDocs.length > 0 &&
      assignedDocs.every((docUrl) =>
        employee.policySignatures.some(
          (sig) =>
            normalizePolicyKey(sig?.documentUrl || "") === normalizePolicyKey(docUrl) &&
            Boolean(sig?.employee?.signed)
        )
      );
    if (allEmployeeSigned) {
      employee.policyAgreement = {
        ...(employee.policyAgreement || {}),
        agreed: true,
        agreedAt: new Date(),
        agreedIp: getRequestIp(req),
        version: employee.policyAgreement?.version || "v1",
      };
    } else {
      employee.policyAgreement = {
        ...(employee.policyAgreement || {}),
        agreed: false,
        agreedAt: null,
        agreedIp: "",
      };
    }

    await employee.save();

    return res.status(200).json({
      message:
        partyKey === "employee"
          ? "Employee signature recorded successfully by HR"
          : "HR signature recorded successfully",
      policySignatures: employee.policySignatures,
      policyAgreement: employee.policyAgreement,
      userId: employee._id,
    });
  } catch (error) {
    console.error("HR policy signature error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadEmployeeAsset = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isPrivilegedUser(user)) {
      return res.status(403).json({ message: "Only superAdmin and HR can upload assets" });
    }

    const file = req.file;
    const { assetType = "document" } = req.body || {};
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const folder =
      assetType === "policy"
        ? "task_management/employee/policies"
        : assetType === "profile-photo"
        ? "task_management/employee/profile_photos"
        : "task_management/employee/documents";

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(file.buffer);
    });

    return res.status(200).json({
      success: true,
      message: "Asset uploaded successfully",
      asset: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        originalName: file.originalname,
        mimeType: file.mimetype,
        assetType,
        uploadedIp: getRequestIp(req),
      },
    });
  } catch (error) {
    console.error("Upload employee asset error:", error);
    return res.status(500).json({ message: "Failed to upload asset", error: error.message });
  }
};

export const deleteEmployeeByAdmin = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || !isPrivilegedUser(requester)) {
      return res.status(403).json({ message: "Only admin, superAdmin and HR can delete employees" });
    }

    const targetUserId = String(req.params.id || "").trim();
    if (!targetUserId) {
      return res.status(400).json({ message: "User id is required" });
    }

    if (String(requester._id) === targetUserId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const target = await User.findById(targetUserId).select("_id accountType username realName empId").lean();
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.accountType === "superAdmin" && requester.accountType !== "superAdmin") {
      return res.status(403).json({ message: "Only superAdmin can delete a superAdmin account" });
    }

    await User.findByIdAndDelete(targetUserId);

    await notifySuperAdminsForHrAction({
      actor: requester,
      action: "user_deleted",
      target,
      io: req.io,
    });

    return res.status(200).json({
      message: "Employee deleted successfully",
      deletedUserId: targetUserId,
      deletedUsername: target.username || "",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export const updateUserByAdmin = async (req, res) => {
//   try {
//     if (!req.user?.accountType || req.user.accountType !== "admin") {
//       return res.status(403).json({ message: "Only admin can update users" });
//     }

//     const userId = req.params.id;
//     const { username, accountType, department, shiftLabel, isCoreTeam } = req.body;

//     const updateData = {};

//     if (username) {
//       const existingUser = await User.findOne({ username }).lean();
//       if (existingUser && existingUser._id.toString() !== userId) {
//         return res.status(400).json({ message: "Username already exists" });
//       }
//       updateData.username = username;
//     }

//     if (accountType) updateData.accountType = accountType;
//     if (department) updateData.department = department;
//     if (typeof isCoreTeam !== "undefined") updateData.isCoreTeam = isCoreTeam;

//     if (!isCoreTeam) {
//       const shiftMapping = {
//         "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
//         "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
//         "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
//         "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
//         "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
//         "11pm-8am": {shift: "Start", shiftStartHour: 23, shiftEndHour: 8},
//       };
//       const selected = shiftMapping[shiftLabel];
//       if (!selected) return res.status(400).json({ message: "Invalid shift label" });

//       updateData.shift = selected.shift;
//       updateData.shiftStartHour = selected.shiftStartHour;
//       updateData.shiftEndHour = selected.shiftEndHour;
//     } else {
//       updateData.shift = null;
//       updateData.shiftStartHour = null;
//       updateData.shiftEndHour = null;
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateData },
//       { new: true, select: "-password" }
//     ).lean();

//     if (!updatedUser) return res.status(404).json({ message: "User not found" });

//     res.status(200).json({
//       message: "User updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Update User Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
