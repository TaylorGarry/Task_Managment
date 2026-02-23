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
//     shift: {
//       type: String,
//       enum: ["Start", "Mid", "End"],
//       required: function() { return !this.isCoreTeam; },
//     },
//     shiftStartHour: {
//       type: Number,
//       required: function() { return !this.isCoreTeam; },
//     },
//     shiftEndHour: {
//       type: Number,
//       required: function() { return !this.isCoreTeam; },
//     },
//     isCoreTeam: {
//       type: Boolean,
//       default: false,
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
<<<<<<< HEAD
      enum: ["employee", "admin", "superAdmin"],
=======
      enum: ["employee", "admin", "superAdmin", "HR", "Operations", "AM"],
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      default: "employee",
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    shift: {
      type: String,
      enum: ["Start", "Mid", "End"],
      required: function () {
        return this.accountType === "employee" && !this.isCoreTeam;
      },
    },

    shiftStartHour: {
      type: Number,
      required: function () {
        return this.accountType === "employee" && !this.isCoreTeam;
      },
    },

    shiftEndHour: {
      type: Number,
      required: function () {
        return this.accountType === "employee" && !this.isCoreTeam;
      },
    },

    isCoreTeam: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
