import mongoose from "mongoose";

const dailyStatusSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H","LWD", "", null], 
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

export default mongoose.model("Roster", rosterSchema);