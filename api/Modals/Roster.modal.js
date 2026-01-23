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


import mongoose from "mongoose";

const dailyStatusSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H","", null], 
    default: "P" 
  }
});

const rosterEmployeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true },

  transport: { type: String, enum: ["Yes", "No", ""], default: "" },
  cabRoute: { type: String, default: "" },

  shiftStartHour: { type: Number, required: true },
  shiftEndHour: { type: Number, required: true },

  dailyStatus: [dailyStatusSchema],
});

const rosterWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  employees: [rosterEmployeeSchema],
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
  },
  { timestamps: true }
);

export default mongoose.model("Roster", rosterSchema);