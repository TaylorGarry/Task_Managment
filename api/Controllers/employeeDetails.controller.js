import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Modals/User.modal.js";
import { getRoleType } from "../utils/roleAccess.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Step 1: Verify employee credentials for the public details form.
 * Returns a short-lived, scoped JWT so the same user can submit the form.
 */
export const verifyEmployeeDetailsLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const loginId = String(username || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Match username, empId, pseudoName, or realName (same as main login)
    const escaped = loginId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactRegex = new RegExp(`^${escaped}$`, "i");

    const user = await User.findOne({
      $or: [
        { username: exactRegex },
        { empId: loginId },
        { pseudoName: exactRegex },
        { realName: exactRegex },
      ],
    })
      .select(
        "_id username password isActive realName pseudoName empId accountType department officeLocation currentAddress officeLocation transportOffice"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is inactive." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Short-lived token scoped only for this form
    const token = jwt.sign(
      { id: user._id, scope: "employee_details_form" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      message: "Verified. You can now submit your details.",
      token,
      user: {
        id: user._id,
        username: user.username,
        realName: user.realName || "",
        pseudoName: user.pseudoName || "",
        empId: user.empId || "",
        department: user.department || "",
        roleType: getRoleType(user),
        // Pre-fill values for the form (converted to UI labels)
        officeLocation: user.officeLocation || "",
        currentAddress: user.currentAddress || "",
        pickupLocation: user.pickupLocation || "",
        pickupLocation: user.pickupLocation || "",
        transportOffice:
          user.transportOffice === "Yes"
            ? "Require"
            : user.transportOffice === "No"
            ? "Not Require"
            : "",
      },
    });
  } catch (error) {
    console.error("Public employee details verify error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Step 2: Submit the 3 fields.
 * Requires the short-lived token from step 1.
 */
export const submitEmployeeDetailsForm = async (req, res) => {
  try {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload?.scope !== "employee_details_form" || !payload?.id) {
      return res.status(403).json({ message: "Token not valid for this form" });
    }

    const { officeLocation, currentAddress, transportOffice } = req.body || {};
    const updates = {};

    if (officeLocation !== undefined) {
      updates.officeLocation = String(officeLocation || "").trim();
    }
    if (currentAddress !== undefined) {
      updates.currentAddress = String(currentAddress || "").trim();
    }

    // ── transportOffice: UI sends "Require" / "Not Require", DB stores "Yes" / "No" ──
    if (transportOffice !== undefined) {
      const raw = String(transportOffice || "").trim().toLowerCase();

      if (raw === "require" || raw === "yes" || raw === "true") {
        updates.transportOffice = "Yes";
      } else if (
        raw === "not require" ||
        raw === "not_require" ||
        raw === "not-require" ||
        raw === "no" ||
        raw === "false"
      ) {
        updates.transportOffice = "No";
      } else {
        return res.status(400).json({
          message: "transportOffice must be 'Require' or 'Not Require'",
        });
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.id,
      { $set: updates },
      { new: true }
    )
      .select("_id username realName empId officeLocation currentAddress transportOffice")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Details submitted successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Public employee details submit error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};