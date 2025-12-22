import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Modals/User.modal.js";

const JWT_SECRET = process.env.JWT_SECRET;

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

export const signup = async (req, res) => {
  try {
    const {
      username,
      password,
      accountType,
      department,
      shiftLabel,
      isCoreTeam,
    } = req.body;

    // 🔐 Admin OR Super Admin can create users
    const isAdminOrSuperAdmin =
      req.user?.accountType === "admin" ||
      req.user?.accountType === "superAdmin";

    if (!isAdminOrSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only admin or super admin can create users" });
    }

    // 🔍 Check if a super admin already exists
    const superAdminExists = await User.exists({
      accountType: "superAdmin",
    });

    // 🔐 Super Admin creation rules
    if (accountType === "superAdmin") {
      // ❌ Block if super admin exists AND requester is not super admin
      if (superAdminExists && req.user.accountType !== "superAdmin") {
        return res.status(403).json({
          message: "Only super admin can create another super admin",
        });
      }
      // ✅ Allow admin ONLY if no super admin exists
    }

    // Basic validation
    if (!username || !password || !department || !accountType) {
      return res.status(400).json({
        message:
          "Username, password, department, and account type are required",
      });
    }

    // Shift validation
    if (accountType === "employee" && !isCoreTeam && !shiftLabel) {
      return res.status(400).json({
        message: "Shift label is required for non-core team employees",
      });
    }

    // Prevent duplicate user
    if (await User.exists({ username })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Shift mapping
    const shiftMapping = {
      "1am-10am": { shift: "Start", shiftStartHour: 1, shiftEndHour: 10 },
      "4pm-1am": { shift: "Mid", shiftStartHour: 16, shiftEndHour: 1 },
      "5pm-2am": { shift: "Mid", shiftStartHour: 17, shiftEndHour: 2 },
      "6pm-3am": { shift: "End", shiftStartHour: 18, shiftEndHour: 3 },
      "8pm-5am": { shift: "End", shiftStartHour: 20, shiftEndHour: 5 },
      "11pm-8am": { shift: "Start", shiftStartHour: 23, shiftEndHour: 8 },
    };

    const selectedShift = !isCoreTeam ? shiftMapping[shiftLabel] : null;

    if (accountType === "employee" && !isCoreTeam && !selectedShift) {
      return res.status(400).json({ message: "Invalid shift label" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      accountType,
      department,
      isCoreTeam: accountType === "employee" && !!isCoreTeam,
      shift: selectedShift?.shift || null,
      shiftStartHour: selectedShift?.shiftStartHour || null,
      shiftEndHour: selectedShift?.shiftEndHour || null,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        username,
        accountType,
        department,
        isCoreTeam: newUser.isCoreTeam,
        shift: newUser.shift,
        shiftStartHour: newUser.shiftStartHour,
        shiftEndHour: newUser.shiftEndHour,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



export const createCoreTeamUser = async (req, res) => {
  try {
    const { username, password, accountType, department } = req.body;

    if (req.user?.accountType !== "admin")
      return res.status(403).json({ message: "Only admin can create users" });

    if (!username || !password || !department)
      return res.status(400).json({ message: "Username, password, and department are required" });

    if (await User.exists({ username }))
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      accountType: accountType || "employee",
      department,
      isCoreTeam: true,
    });

    res.status(201).json({
      message: "Core team user created successfully",
      user: {
        id: newUser._id,
        username,
        accountType: newUser.accountType,
        department,
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
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password are required" });

    const user = await User.findOne({ username }).lean();
    if (!user)
      return res.status(404).json({ message: "User not found" });

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
        department: user.department,
        isCoreTeam: user.isCoreTeam,
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


export const getAllEmployees = async (req, res) => {
  try {
    const requester = req.user; // assuming you have auth middleware that sets req.user
    let query = {};

    if (requester.accountType === "superAdmin") {
      // super admin can see everyone except passwords
      query = { accountType: { $in: ["employee", "admin", "superAdmin"] } };
    } else {
      // normal admin only sees employees
      query = { accountType: "employee" };
    }

    const employees = await User.find(
      query,
      "_id username department accountType isCoreTeam shiftStartHour shiftEndHour"
    ).lean();

    res.status(200).json(employees);
  } catch (error) {
    console.error("Get Employees Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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
    if (!req.user?.accountType || req.user.accountType !== "admin") {
      return res.status(403).json({ message: "Only admin can update users" });
    }

    const userId = req.params.id;
    const { username, accountType, department, shiftLabel, isCoreTeam, password, confirmPassword } = req.body;

    const updateData = {};

    if (username) {
      const existingUser = await User.findOne({ username }).lean();
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updateData.username = username;
    }

    if (accountType) updateData.accountType = accountType;
    if (department) updateData.department = department;
    if (typeof isCoreTeam !== "undefined") updateData.isCoreTeam = isCoreTeam;

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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, select: "-password" }
    ).lean();

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    const responseData = {
      message: "User updated successfully",
      user: updatedUser,
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