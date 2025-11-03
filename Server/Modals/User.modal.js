// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     accountType: {
//       type: String,
//       enum: ["employee", "admin"],
//       default: "employee",
//     },
//     department: {
//       type: String,
//       required: true,  
//       trim: true,
//     },
//   },
//   { timestamps: true }
// );

// const User = mongoose.model("User", userSchema);

// export default User;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    // NEW FIELDS 👇
    shift: {
      type: String,
      enum: ["Start", "Mid", "End"],
      required: true,
    },
    shiftStartHour: {
      type: Number, // in 24h format (e.g., 16 = 4 PM)
      required: true,
    },
    shiftEndHour: {
      type: Number, // e.g., 1 = 1 AM
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
