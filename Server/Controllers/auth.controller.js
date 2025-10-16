// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import User from "../Modals/User.modal.js";

// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// export const signup = async (req, res) => {
//   try {
//     const { username, password, accountType } = req.body;

//     if (!username || !password) {
//       return res
//         .status(400)
//         .json({ message: "Username and password are required" });
//     }

//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       username,
//       password: hashedPassword,
//       accountType: accountType || "user",
//     });

//     await newUser.save();

//     return res
//       .status(201)
//       .json({ message: "User registered successfully", user: newUser });
//   } catch (error) {
//     console.error("Signup Error:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res
//         .status(400)
//         .json({ message: "Username and password are required" });
//     }

//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { id: user._id, accountType: user.accountType },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         accountType: user.accountType,
//       },
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

// export const logout = async (req, res) => {
//   try {
//     return res.status(200).json({ message: "Logged out successfully" });
//   } catch (error) {
//     console.error("Logout Error:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };


// export const getAllEmployees = async (req, res) => {
//   try {
//     const employees = await User.find({ accountType: "employee" }).select("_id username");
//     res.status(200).json(employees);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };



import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Modals/User.modal.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// =====================
// Signup
// =====================
export const signup = async (req, res) => {
  try {
    const { username, password, accountType, department } = req.body;

    if (!username || !password || !department) {
      return res.status(400).json({ message: "Username, password, and department are required" });
    }

    if (!["employee", "admin"].includes(accountType)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      accountType,
      department, // always store
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        accountType: newUser.accountType,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// =====================
// Login
// =====================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =====================
// Logout
// =====================
export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =====================
// Get All Employees
// =====================
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ accountType: "employee" }).select("_id username department");
    res.status(200).json(employees);
  } catch (error) {
    console.error("Get Employees Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
