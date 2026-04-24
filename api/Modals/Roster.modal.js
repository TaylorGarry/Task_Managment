import mongoose from "mongoose";

const dailyStatusSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  
  // Roster Status (from weekly roster)
  status: {
    type: String,
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
    default: "P"
  },
  
  // NEW: Punch In/Out Times (entered by HR)
  punchIn: {
    type: Date,
    default: null
  },
  punchOut: {
    type: Date,
    default: null
  },
  
  // NEW: Auto-calculated total hours (in decimal, e.g., 8.5 for 8 hours 30 mins)
  totalHours: {
    type: Number,
    default: null
  },
  
  // NEW: Track who updated punches
  punchUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  punchUpdatedAt: {
    type: Date,
    default: null
  },
  
  // NEW: Flag to indicate if status was auto-calculated from punches
  isPunchCalculated: {
    type: Boolean,
    default: false
  },
  
  // Transport Status (updated by transport team)
  transportStatus: { 
    type: String, 
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
    default: ""
  },
  transportStatusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  transportStatusUpdatedAt: {
    type: Date,
    default: null
  },
  
  // Department Status (updated by HR/Team Leaders)
  departmentStatus: { 
    type: String, 
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
    default: ""
  },
  departmentStatusUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  departmentStatusUpdatedAt: {
    type: Date,
    default: null
  },
  
  // Transport Arrival Time (when employee reaches via transport)
  transportArrivalTime: {
    type: Date,
    default: null
  },
  transportUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  transportUpdatedAt: {
    type: Date,
    default: null
  },
  
  // Department Arrival Time (when employee reaches department)
  departmentArrivalTime: {
    type: Date,
    default: null
  },
  departmentUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  departmentUpdatedAt: {
    type: Date,
    default: null
  }

}, { _id: false });

const rosterEmployeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  
  name: { type: String, required: true },
  empId: { type: String, default: "" },
  department: {
    type: String,
    required: true,
    trim: true,
  },

  transport: { type: String, enum: ["Yes", "No", ""], default: "" },
  cabRoute: { type: String, default: "" },

  shiftStartHour: { type: Number, required: true },
  shiftEndHour: { type: Number, required: true },

  dailyStatus: [dailyStatusSchema],
  teamLeader: {
    type: String,
    default: ""
  }
});

const rosterWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  employees: [rosterEmployeeSchema],
});

const rosterEditHistorySchema = new mongoose.Schema({
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  editedByName: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
  },
  actionType: {
    type: String,  
  },
  weekNumber: Number,
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  employeeName: String,

  changes: [
    {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }
  ],

  editedAt: {
    type: Date,
    default: Date.now
  }
});

const rosterSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },  
    year: { type: Number, required: true },
    
    rosterStartDate: { type: Date, required: true },  
    rosterEndDate: { type: Date, required: true },    
    
    weeks: [rosterWeekSchema],
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    editHistory: [rosterEditHistorySchema]
  },
  { timestamps: true }
);

rosterSchema.index({ rosterStartDate: 1, rosterEndDate: 1 });
rosterSchema.index({ "weeks.startDate": 1, "weeks.endDate": 1 });

export default mongoose.model("Roster", rosterSchema);



// import mongoose from "mongoose";

// // const dailyStatusSchema = new mongoose.Schema({
// //   date: { type: Date, required: true },
// //   status: { 
// //     type: String, 
// //     enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H","LWD","HD", "", null], 
// //     default: "P" 
// //   }
// // });

// const dailyStatusSchema = new mongoose.Schema({
// 	  date: { type: Date, required: true },
// 	  status: {
// 	    type: String,
// 	    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
// 	    default: "P"
// 	  },
// 	  transportStatus: { 
// 	    type: String, 
//     enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
//     default: ""
//   },
//   transportStatusUpdatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null
//   },
//   transportStatusUpdatedAt: {
//     type: Date,
//     default: null
//   },
//   departmentStatus: { 
//     type: String, 
//     enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""],
//     default: ""
//   },
//   departmentStatusUpdatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null
//   },
//   departmentStatusUpdatedAt: {
//     type: Date,
//     default: null
//   },
//   transportArrivalTime: {
//     type: Date,
//     default: null
//   },
//   transportUpdatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null
//   },
//   transportUpdatedAt: {
//     type: Date,
//     default: null
//   },
//   departmentArrivalTime: {
//     type: Date,
//     default: null
//   },
//   departmentUpdatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     default: null
//   },
//   departmentUpdatedAt: {
//     type: Date,
//     default: null
//   }

// }, { _id: false });

// const rosterEmployeeSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//   name: { type: String, required: true },
//   department: {
//     type: String,
//     required: true,
//     trim: true,
//   },

//   transport: { type: String, enum: ["Yes", "No", ""], default: "" },
//   cabRoute: { type: String, default: "" },

//   shiftStartHour: { type: Number, required: true },
//   shiftEndHour: { type: Number, required: true },

//   dailyStatus: [dailyStatusSchema],
//   teamLeader: {
//     type: String,
//     default: ""
//   }
// });

// const rosterWeekSchema = new mongoose.Schema({
//   weekNumber: { type: Number, required: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   employees: [rosterEmployeeSchema],
// });

// const rosterEditHistorySchema = new mongoose.Schema({
//   editedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   editedByName: {
//     type: String,
//     required: true
//   },
//   accountType: {
//     type: String,
//   },
//   actionType: {
//     type: String,  
//   },
//   weekNumber: Number,
//   employeeId: {
//     type: mongoose.Schema.Types.ObjectId,
//   },
//   employeeName: String,

//   changes: [
//     {
//       field: String,
//       oldValue: mongoose.Schema.Types.Mixed,
//       newValue: mongoose.Schema.Types.Mixed
//     }
//   ],

//   editedAt: {
//     type: Date,
//     default: Date.now
//   }
// });


// const rosterSchema = new mongoose.Schema(
//   {
//     month: { type: Number, required: true },  
//     year: { type: Number, required: true },
    
//     rosterStartDate: { type: Date, required: true },  
//     rosterEndDate: { type: Date, required: true },    
    
//     weeks: [rosterWeekSchema],
    
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     editHistory: [rosterEditHistorySchema]
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Roster", rosterSchema);
