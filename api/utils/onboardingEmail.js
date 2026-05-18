import crypto from "crypto";
import EmployeeOnboardingToken from "../Modals/EmployeeOnboardingToken.modal.js";

const ONBOARDING_TOKEN_TTL_HOURS = Number(process.env.ONBOARDING_TOKEN_TTL_HOURS || 24 * 7);

const buildTokenHash = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

export const createEmployeeOnboardingToken = async (userId) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = buildTokenHash(rawToken);
  const expiresAt = new Date(Date.now() + ONBOARDING_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await EmployeeOnboardingToken.updateMany(
    { userId, status: "active" },
    { $set: { status: "revoked" } }
  );

  await EmployeeOnboardingToken.create({
    userId,
    tokenHash,
    expiresAt,
    status: "active",
  });

  return { rawToken, expiresAt };
};

export const getOnboardingTokenRecord = async (rawToken) => {
  const tokenHash = buildTokenHash(rawToken);
  const record = await EmployeeOnboardingToken.findOne({ tokenHash }).lean();
  if (!record) return null;
  if (record.status !== "active") return null;
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
    await EmployeeOnboardingToken.updateOne({ _id: record._id }, { $set: { status: "expired" } });
    return null;
  }
  return record;
};

export const markOnboardingTokenUsed = async (recordId) =>
  EmployeeOnboardingToken.updateOne(
    { _id: recordId },
    { $set: { status: "used", usedAt: new Date() } }
  );

const getTransporter = async () => {
  const { default: nodemailer } = await import("nodemailer");
  const host = process.env.HR_SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.HR_SMTP_PORT || process.env.SMTP_PORT || 587);
  const user = process.env.HR_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.HR_SMTP_PASS || process.env.SMTP_PASS;
  const secure = String(process.env.HR_SMTP_SECURE || "false").toLowerCase() === "true";
  if (!host || !user || !pass) {
    throw new Error("SMTP config missing: set HR_SMTP_HOST/HR_SMTP_USER/HR_SMTP_PASS");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: true,
    debug: true,
  });
};

let didVerifyTransporter = false;

export const sendOnboardingEmail = async ({ to, realName, joiningDateText, uploadLink }) => {
  const transporter = await getTransporter();
  const from = process.env.HR_FROM_EMAIL || "hr@fdbs.in";
  const safeName = String(realName || "Candidate").trim() || "Candidate";
  const safeDateText = String(joiningDateText || "").trim();
  const sendStart = Date.now();

  // Verify SMTP connectivity once per process for better diagnostics.
  if (!didVerifyTransporter) {
    await transporter.verify();
    didVerifyTransporter = true;
    console.log("SMTP verify successful");
  }

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
    <p>Dear ${safeName},</p>
    <p>Greetings from FD Business Service!</p>
    <p>We thank you for your time and participation in the On-Site interview conducted as part of the selection process.</p>
    <p>We are pleased to inform you that you have been shortlisted to proceed to the next stage of our selection process.</p>
    <p>We are pleased to offer you the position of Travel Sales Consultant with FD Business Service. After careful consideration of your skills and experience, we believe you will make a significant contribution to our organization${safeDateText ? ` your date of joining will be ${safeDateText}.` : "."}</p>
    <hr />
    <p><strong>Important Next Steps</strong></p>
    <p>To move forward, you are required to upload the mandatory documents using the link below:</p>
    <p><a href="${uploadLink}" target="_blank" rel="noreferrer">Document Upload</a></p>
    <p>Regards,<br/>HR Team<br/>FD Business Service</p>
  </div>`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "FD Business Service - Document Upload Link",
      html,
    });

    console.log("SMTP accepted:", info.response, info.messageId);
    console.log("SMTP delivery details:", {
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - sendStart,
    });
  } catch (error) {
    console.error("SMTP send failed:", {
      message: error?.message || String(error),
      code: error?.code || null,
      command: error?.command || null,
      response: error?.response || null,
      responseCode: error?.responseCode || null,
      stack: error?.stack || null,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - sendStart,
      to,
    });
    throw error;
  }

};
