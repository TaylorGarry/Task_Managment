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

const employeeDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    publicId: { type: String, trim: true, default: "" },
    fileName: { type: String, trim: true, default: "" },
    mimeType: { type: String, trim: true, default: "" },
    size: { type: Number, default: 0 },
    uploaded: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: null },
    uploadedIp: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const policySignaturePartySchema = new mongoose.Schema(
  {
    signed: { type: Boolean, default: false },
    signedAt: { type: Date, default: null },
    signedIp: { type: String, trim: true, default: "" },
    signatureUrl: { type: String, trim: true, default: "" },
    signaturePublicId: { type: String, trim: true, default: "" },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const policySignatureSchema = new mongoose.Schema(
  {
    documentUrl: { type: String, trim: true, required: true },
    employee: { type: policySignaturePartySchema, default: () => ({}) },
    hr: { type: policySignaturePartySchema, default: () => ({}) },
    signedPdfUrl: { type: String, trim: true, default: "" },
    signedPdfPublicId: { type: String, trim: true, default: "" },
    signedPdfGeneratedAt: { type: Date, default: null },
  },
  { _id: false }
);

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
      enum: ["employee", "admin", "superAdmin", "HR", "Operations", "AM"],
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

    isTeamLeader: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    realName: {
      type: String,
      trim: true,
      default: "",
    },

    pseudoName: {
      type: String,
      trim: true,
      default: "",
    },

    empId: {
      type: String,
      trim: true,
      sparse: true,
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    transportOffice: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "No",
    },

    docsStatus: {
      type: String,
      enum: ["Yes", "No", "Pending", ""],
      default: "No",
    },

    employmentType: {
      type: String,
      enum: ["fresher", "experienced", ""],
      default: "",
    },

    documents: {
      type: [employeeDocumentSchema],
      default: [],
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    officeLocation: {
      type: String,
      trim: true,
      default: "",
    },

    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    profilePhotoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    profilePhotoPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    ctc: {
      type: Number,
      default: null,
    },

    inHandSalary: {
      type: Number,
      default: null,
    },

    transportAllowance: {
      type: Number,
      default: null,
    },

    policyDocuments: {
      type: [String],
      default: [],
    },

    policySignatures: {
      type: [policySignatureSchema],
      default: [],
    },

    policyAgreement: {
      agreed: { type: Boolean, default: false },
      agreedAt: { type: Date, default: null },
      agreedIp: { type: String, default: "" },
      version: { type: String, default: "v1" },
    },

    hrDocumentOverrideUntil: {
      type: Date,
      default: null,
    },
    hrDocumentOverrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hrGlobalDocumentOverrideUntil: {
      type: Date,
      default: null,
    },
    hrGlobalDocumentOverrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ empId: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);
export default User;
