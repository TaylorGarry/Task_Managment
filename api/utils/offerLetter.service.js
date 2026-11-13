import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.resolve("templates/offerLetter.html");

const render = (tpl, vars) =>
  tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => vars[k] ?? "");

const inr = (n) =>
  n == null || n === "" ? "" : `Rs. ${Number(n).toLocaleString("en-IN")}/-`;

export const generateOfferLetterPDF = async (user) => {
  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");

  const html = render(template, {
    realName: user.realName || "",
    username: user.username || "",
    designation: user.designation || "Travel Sales Consultant",
    department: user.department || "",
    ctc: inr(user.ctc),
    inHandSalary: inr(user.inHandSalary),
    transportAllowance: inr(user.transportAllowance),
    dateOfJoining: user.dateOfJoining
      ? new Date(user.dateOfJoining).toLocaleDateString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
        })
      : "",
    officeLocation: user.officeLocation || "Plot 621, Phase 5, Sector 19, Gurugram",
    letterDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    }),
    empId: user.empId || "",
    offerRef: `FDBS/HR/${new Date().getFullYear()}/${String(user._id).slice(-6)}`,
  });

  const outDir = path.join(process.cwd(), "storage", "offerLetters");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `offer-${user._id}-${Date.now()}.pdf`);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });
  } finally {
    await browser.close();
  }

  return outPath;
};