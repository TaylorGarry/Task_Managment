import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import User from "../Modals/User.modal.js";
import {
  getOnboardingTokenRecord,
  markOnboardingTokenUsed,
} from "../utils/onboardingEmail.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const router = express.Router();

export const ONBOARDING_REQUIRED_DOCS_UPLOAD = [
  "Passport Size Photo",
  "Aadhaar Card",
  "PAN Card",
  "Cancelled Cheque",
];

const uploadDir = path.resolve("storage/onboarding");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (ok.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported file type"));
  },
});

const getIp = (req) =>
  (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
    .toString()
    .split(",")[0]
    .trim();

router.get("/employee/onboarding/v2/esign/verify", async (req, res) => {
  try {
    const token = String(req.query?.token || "").trim();
    if (!token) return res.status(400).json({ message: "Token is required" });
    const record = await getOnboardingTokenRecord(token, "esign");
    if (!record) return res.status(401).json({ message: "Invalid or expired link" });
    const user = await User.findById(record.userId).lean();
    if (!user) return res.status(404).json({ message: "Employee not found" });
    const policies = (user.policySignatures || []).map((p) => ({
      key: p.documentKey || "",
      title: p.documentTitle || "",
      documentUrl: p.documentUrl || "",
      signed: !!p.employee?.signed,
    }));
    return res.status(200).json({
      employee: { realName: user.realName || user.username || "", empId: user.empId || "" },
      policies,
      alreadyCompleted: policies.length > 0 && policies.every((p) => p.signed),
    });
  } catch (error) {
    console.error("esign verify error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/employee/onboarding/v2/esign/sign", async (req, res) => {
  try {
    const { token, policyKey, signatureDataUrl } = req.body || {};

    if (!token) return res.status(400).json({ message: "Token is required" });
    if (!policyKey)
      return res.status(400).json({ message: "policyKey is required" });
    if (
      !signatureDataUrl ||
      typeof signatureDataUrl !== "string" ||
      !signatureDataUrl.startsWith("data:image/")
    ) {
      return res
        .status(400)
        .json({ message: "signatureDataUrl (base64 PNG) is required" });
    }

    const record = await getOnboardingTokenRecord(token, "esign");
    if (!record)
      return res.status(401).json({ message: "Invalid or expired link" });

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const idx = user.policySignatures.findIndex(
      (p) => p.documentKey === policyKey
    );
    if (idx === -1) return res.status(404).json({ message: "Policy not found" });
    if (user.policySignatures[idx].employee?.signed)
      return res.status(400).json({ message: "Already signed" });

    // Upload the signature PNG to Cloudinary
    let uploaded;
    try {
      uploaded = await cloudinary.uploader.upload(signatureDataUrl, {
        folder: "task_management/employee/policy_signatures",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });
    } catch (uploadErr) {
      console.error("Signature upload failed:", uploadErr);
      return res
        .status(502)
        .json({ message: "Signature upload failed. Please try again." });
    }

    const now = new Date();
    const ip = getIp(req);

    // Persist each field individually + mark dirty
    user.policySignatures[idx].employee.signed = true;
    user.policySignatures[idx].employee.signedAt = now;
    user.policySignatures[idx].employee.signedIp = ip;
    user.policySignatures[idx].employee.signatureUrl = uploaded.secure_url;
    user.policySignatures[idx].employee.signaturePublicId = uploaded.public_id;
    user.policySignatures[idx].employee.signedBy = user._id;
    user.markModified("policySignatures");

    const allSigned = user.policySignatures.every((p) => p.employee?.signed);
    if (allSigned) {
      user.policyAgreement = {
        agreed: true,
        agreedAt: now,
        agreedIp: ip,
        version: "v1",
      };
      user.markModified("policyAgreement");
    }

    await user.save();

    console.log(
      `[esign] user=${user._id} policy=${policyKey} signed. allSigned=${allSigned} url=${uploaded.secure_url}`
    );

    if (allSigned) await markOnboardingTokenUsed(record._id);

    return res.status(200).json({
      ok: true,
      allSigned,
      remaining: user.policySignatures.filter((p) => !p.employee?.signed).length,
      policySignatures: user.policySignatures,
      policyAgreement: user.policyAgreement,
    });
  } catch (error) {
    console.error("esign sign error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/employee/onboarding/v2/verify", async (req, res) => {
  try {
    const token = String(req.query?.token || "").trim();
    if (!token) return res.status(400).json({ message: "Token is required" });
    const record = await getOnboardingTokenRecord(token, "upload");
    if (!record) return res.status(401).json({ message: "Invalid or expired link" });
    const user = await User.findById(record.userId).lean();
    if (!user) return res.status(404).json({ message: "Employee not found" });
    return res.status(200).json({
      employee: { realName: user.realName || user.username || "", empId: user.empId || "" },
      requiredDocs: ONBOARDING_REQUIRED_DOCS_UPLOAD,
    });
  } catch (error) {
    console.error("upload verify error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/employee/onboarding/v2/upload-asset", upload.single("file"), async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const documentName = String(req.body?.documentName || "").trim();
    if (!token) return res.status(400).json({ message: "Token is required" });
    if (!documentName) return res.status(400).json({ message: "Document name is required" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!ONBOARDING_REQUIRED_DOCS_UPLOAD.includes(documentName))
      return res.status(400).json({ message: "Invalid document name" });
    const record = await getOnboardingTokenRecord(token, "upload");
    if (!record) return res.status(401).json({ message: "Invalid or expired link" });
    const asset = {
      name: documentName,
      url: `/storage/onboarding/${req.file.filename}`,
      publicId: req.file.filename,
      fileName: req.file.originalname || "",
      mimeType: req.file.mimetype || "",
      size: req.file.size || 0,
      uploaded: true,
      uploadedAt: new Date(),
      uploadedIp: getIp(req),
    };
    await User.updateOne({ _id: record.userId }, { $pull: { documents: { name: documentName } } });
    await User.updateOne({ _id: record.userId }, { $push: { documents: asset } });
    return res.status(200).json({ ok: true, asset });
  } catch (error) {
    console.error("upload asset error:", error);
    return res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

router.post("/employee/onboarding/v2/submit", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ message: "Token is required" });
    const record = await getOnboardingTokenRecord(token, "upload");
    if (!record) return res.status(401).json({ message: "Invalid or expired link" });
    const user = await User.findById(record.userId).lean();
    if (!user) return res.status(404).json({ message: "Employee not found" });
    const uploadedNames = new Set(
      (user.documents || []).filter((d) => d.uploaded).map((d) => String(d.name || "").trim())
    );
    const missing = ONBOARDING_REQUIRED_DOCS_UPLOAD.filter((d) => !uploadedNames.has(d));
    if (missing.length) return res.status(400).json({ message: "Missing documents", missing });
    const photoDoc = (user.documents || []).find((d) => d.name === "Passport Size Photo");
    const update = { docsStatus: "Yes" };
    if (photoDoc?.url) {
      update.profilePhotoUrl = photoDoc.url;
      update.profilePhotoPublicId = photoDoc.publicId || "";
    }
    await User.updateOne({ _id: record.userId }, { $set: update });
    await markOnboardingTokenUsed(record._id);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("submit error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
