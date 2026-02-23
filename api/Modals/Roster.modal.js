<<<<<<< HEAD
// import mongoose from "mongoose";

// const dailyStatusSchema = new mongoose.Schema({
//   date: { type: Date, required: true },
//   status: { 
//     type: String, 
//     enum: ["P", "WO", "L", "NCNS", "UL","LWP","BL","", null], 
//     default: "P" 
//   }
// });

// const rosterEmployeeSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
//   name: { type: String, required: true },

//   transport: { type: String, enum: ["Yes", "No", ""], default: "" },
//   cabRoute: { type: String, default: "" },

//   // shift: {
//   //   type: String,
//   //   enum: ["Start", "Mid", "End"],
//   //   required: function() { return !this.isCoreTeam; },
//   // },
//   shiftStartHour: { type: Number, required: function() { return !this.isCoreTeam; } },
//   shiftEndHour: { type: Number, required: function() { return !this.isCoreTeam; } },
//   // isCoreTeam: { type: Boolean, default: false },

//   dailyStatus: [dailyStatusSchema],
// });

// const rosterWeekSchema = new mongoose.Schema({
//   weekNumber: { type: Number, required: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   employees: [rosterEmployeeSchema],
// });

// const rosterSchema = new mongoose.Schema(
//   {
//     month: { type: Number, required: true },  
//     year: { type: Number, required: true },

//     weeks: [rosterWeekSchema],

//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Roster", rosterSchema);


=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
import mongoose from "mongoose";

const dailyStatusSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { 
    type: String, 
<<<<<<< HEAD
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "", null], 
=======
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H","LWD","HD", "", null], 
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
    default: "P" 
  }
});

const rosterEmployeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true },

  transport: { type: String, enum: ["Yes", "No", ""], default: "" },
  cabRoute: { type: String, default: "" },

<<<<<<< HEAD
  // Shift timings are now required for all users
=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
  shiftStartHour: { type: Number, required: true },
  shiftEndHour: { type: Number, required: true },

  dailyStatus: [dailyStatusSchema],
<<<<<<< HEAD
=======
  teamLeader: {
    type: String,
    default: ""
  }
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
});

const rosterWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  employees: [rosterEmployeeSchema],
});

<<<<<<< HEAD
=======
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
    type: String, // update / bulk-update / delete / add
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


>>>>>>> a4bba92 (Initial commit on Farhan_dev)
const rosterSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },  
    year: { type: Number, required: true },
<<<<<<< HEAD

    weeks: [rosterWeekSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
=======
    
    rosterStartDate: { type: Date, required: true },  
    rosterEndDate: { type: Date, required: true },    
    
    weeks: [rosterWeekSchema],
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    editHistory: [rosterEditHistorySchema]
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
  },
  { timestamps: true }
);

export default mongoose.model("Roster", rosterSchema);