import XLSX from "xlsx-js-style";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";
import Delegation from "../Modals/Delegation/delegation.modal.js";
import {
  getDelegationContextForDate,
  canDelegatedAssigneeManageEmployee,
} from "../utils/delegationAccess.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const toIstDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
};

const parseYmdToUtcDate = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const getRosterMonthMetaFromRange = (startDate, endDate) => {
  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      12,
      0,
      0,
      0
    )
  );
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      12,
      0,
      0,
      0
    )
  );

  const monthCounts = new Map();
  const firstDateByMonth = new Map();
  const endMonthKey = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}`;

  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
    if (!firstDateByMonth.has(key)) {
      firstDateByMonth.set(key, new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const sortedByPreference = Array.from(monthCounts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    if (a[0] === endMonthKey) return -1;
    if (b[0] === endMonthKey) return 1;
    return a[0].localeCompare(b[0]);
  });

  const [selectedKey] = sortedByPreference[0] || [];
  const [yearStr, monthStr] = String(selectedKey || "").split("-");
  const month = Number.parseInt(monthStr, 10);
  const year = Number.parseInt(yearStr, 10);
  const anchorDate =
    firstDateByMonth.get(selectedKey) ||
    new Date(Date.UTC(year, Math.max(0, month - 1), 1, 12, 0, 0, 0));

  return {
    month,
    year,
    anchorDateForWeekNumber: anchorDate,
  };
};

const getDelegatedTeamLeaderNames = async ({ assigneeId, actionDate }) => {
  const baseDate = new Date(actionDate);
  if (Number.isNaN(baseDate.getTime())) return new Set();
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  const activeDelegations = await Delegation.find({
    assignee: assigneeId,
    status: "active",
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  })
    .populate("delegator", "username")
    .select("delegator")
    .lean();

  return new Set(
    activeDelegations
      .map((delegation) => String(delegation?.delegator?.username || "").trim().toLowerCase())
      .filter(Boolean)
  );
};

// export const addRosterWeek = async (req, res) => {
//   try {
//     const { 
//       month, 
//       year, 
//       weekNumber, 
//       startDate, 
//       endDate, 
//       employees, 
//       action = "create",
//       rosterStartDate, 
//       rosterEndDate     
//     } = req.body;
    
//     const createdBy = req.user._id;  

//     if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Missing required fields: month, year, weekNumber, startDate, endDate, employees" 
//       });
//     }

//     if (!rosterStartDate || !rosterEndDate) {
//       return res.status(400).json({ 
//         success: false,
//         message: "rosterStartDate and rosterEndDate are required" 
//       });
//     }

//     const processedEmployees = await Promise.all(
//       employees.map(async (emp) => {
//         let user = null;
//         if (emp.name) {
//           user = await User.findOne({ username: emp.name });
//         }

//         const dailyStatus = emp.dailyStatus.map((ds, index) => {
//           const date = new Date(startDate);
//           date.setDate(date.getDate() + index);
//           return {
//             date: date.toISOString(),
//             status: ds.status || "P"
//           };
//         });

//         const woCount = dailyStatus.filter(d => d.status === "WO").length;
//         if (woCount > 2) {
//           throw new Error(`Employee ${emp.name} cannot have more than 2 week-offs in a week`);
//         }
//         if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
//           throw new Error(`Employee ${emp.name} must have both shift start and end hours`);
//         }

//         const shiftStartHour = parseInt(emp.shiftStartHour) || 0;
//         const shiftEndHour = parseInt(emp.shiftEndHour) || 0;
//         if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
//           throw new Error(`Employee ${emp.name} has invalid shift hours`);
//         }

//         if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
//           throw new Error(`Employee ${emp.name}: Shift hours must be between 0 and 23`);
//         }

//         const employeeData = {
//           userId: user?._id || null,
//           name: emp.name,
//           transport: emp.transport || "",
//           cabRoute: emp.cabRoute || "",
//           shiftStartHour,
//           shiftEndHour,
//           dailyStatus,
//           teamLeader: emp.teamLeader || ""
//         };
//         return employeeData;
//       })
//     );

//     let roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       roster = new Roster({
//         month,
//         year,
//         rosterStartDate: new Date(rosterStartDate),
//         rosterEndDate: new Date(rosterEndDate),
//         weeks: [],
//         createdBy,
//       });
//     } else {
//       roster.rosterStartDate = new Date(rosterStartDate);
//       roster.rosterEndDate = new Date(rosterEndDate);
//       roster.updatedBy = createdBy;  
//     }
//     const existingWeekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
//     if (existingWeekIndex !== -1) {
//       if (action === "add") {
//         const existingEmployees = roster.weeks[existingWeekIndex].employees;
//         const existingEmployeeNames = existingEmployees.map(emp => emp.name);
//         const newEmployees = processedEmployees.filter(newEmp => 
//           !existingEmployeeNames.includes(newEmp.name)
//         );
//         if (newEmployees.length === 0) {
//           return res.status(400).json({ 
//             success: false,
//             message: "All employees already exist in this roster week" 
//           });
//         }
//         roster.weeks[existingWeekIndex].employees = [
//           ...existingEmployees,
//           ...newEmployees
//         ];
//         console.log(`Added ${newEmployees.length} new employees to existing week`);
//       } else {
//         roster.weeks[existingWeekIndex] = {
//           weekNumber,
//           startDate: new Date(startDate),
//           endDate: new Date(endDate),
//           employees: processedEmployees,
//         };
//         console.log("Replaced existing week with new data");
//       }
//     } else {
//       roster.weeks.push({
//         weekNumber,
//         startDate: new Date(startDate),
//         endDate: new Date(endDate),
//         employees: processedEmployees,
//       });
//       console.log("Created new week");
//     }
//     if (!roster.updatedBy) {
//       roster.updatedBy = createdBy;
//     }
//     await roster.save();
//     console.log("Roster saved successfully");
//     return res.status(201).json({ 
//       success: true,
//       message: action === "add" ? "Employees added to roster successfully" : "Roster week saved successfully", 
//       roster 
//     });
//   } catch (error) {
//     console.error("Error adding roster week:", error);
//     return res.status(400).json({ 
//       success: false,
//       message: error.message || "Failed to add roster week" 
//     });
//   }
// };

export const deleteEmployeeFromRoster = async (req, res) => {
  try {
    const { rosterId, weekNumber, employeeId } = req.body;
    const user = req.user;

    if (!rosterId || !weekNumber || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "rosterId, weekNumber, and employeeId are required",
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }

    if (!(user.accountType === "HR" || user.accountType === "superAdmin")) {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can delete employees from roster",
      });
    }

    // Find the specific week
    const week = roster.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return res.status(404).json({
        success: false,
        message: `Week ${weekNumber} not found in roster`
      });
    }

    // Find the employee index
    const employeeIndex = week.employees.findIndex(emp => 
      emp._id.toString() === employeeId
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found in week ${weekNumber}`
      });
    }

    // Get employee info before deletion
    const deletedEmployee = week.employees[employeeIndex];

    // Remove the employee from the array
    week.employees.splice(employeeIndex, 1);

    // Update roster metadata
    roster.updatedBy = user._id;
    roster.updatedAt = new Date();

    // Save the roster
    await roster.save();

    return res.status(200).json({
      success: true,
      message: `Employee "${deletedEmployee.name}" deleted successfully`,
      deletedEmployee: {
        name: deletedEmployee.name,
        employeeId: deletedEmployee._id,
        userId: deletedEmployee.userId,
        weekNumber: week.weekNumber
      },
      rosterInfo: {
        rosterId: roster._id,
        month: roster.month,
        year: roster.year,
        remainingEmployees: week.employees.length
      },
      updatedBy: user.username,
      timestamp: roster.updatedAt
    });

  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
export const deleteEmployeeByUserId = async (req, res) => {
  try {
    const { rosterId, weekNumber, userId } = req.body;
    const user = req.user;

    if (!rosterId || !weekNumber || !userId) {
      return res.status(400).json({
        success: false,
        message: "rosterId, weekNumber, and userId are required",
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }

    // Permission check
    if (!(user.accountType === "HR" || user.accountType === "superAdmin")) {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can delete employees from roster",
      });
    }

    const week = roster.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return res.status(404).json({
        success: false,
        message: `Week ${weekNumber} not found in roster`
      });
    }

    // Find employee by userId (CRM user)
    const employeeIndex = week.employees.findIndex(emp =>
      emp.userId && emp.userId.toString() === userId
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Employee with userId ${userId} not found in week ${weekNumber}`
      });
    }

    const deletedEmployee = week.employees[employeeIndex];
    week.employees.splice(employeeIndex, 1);

    roster.updatedBy = user._id;
    roster.updatedAt = new Date();
    await roster.save();

    return res.status(200).json({
      success: true,
      message: `CRM User "${deletedEmployee.name}" deleted successfully`,
      deletedEmployee: {
        name: deletedEmployee.name,
        userId: deletedEmployee.userId,
        employeeId: deletedEmployee._id,
        weekNumber: week.weekNumber
      },
      rosterInfo: {
        rosterId: roster._id,
        month: roster.month,
        year: roster.year,
        remainingEmployees: week.employees.length
      }
    });

  } catch (error) {
    console.error("Delete employee by userId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
export const deleteEmployeeByName = async (req, res) => {
  try {
    const { rosterId, weekNumber, employeeName } = req.body;
    const user = req.user;

    if (!rosterId || !weekNumber || !employeeName) {
      return res.status(400).json({
        success: false,
        message: "rosterId, weekNumber, and employeeName are required",
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }

    // Permission check
    if (!(user.accountType === "HR" || user.accountType === "superAdmin")) {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can delete employees from roster",
      });
    }

    const week = roster.weeks.find(w => w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return res.status(404).json({
        success: false,
        message: `Week ${weekNumber} not found in roster`
      });
    }

    // Find employee by name (case-insensitive)
    const employeeIndex = week.employees.findIndex(emp =>
      emp.name && emp.name.toLowerCase() === employeeName.toLowerCase()
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Employee "${employeeName}" not found in week ${weekNumber}`
      });
    }

    const deletedEmployee = week.employees[employeeIndex];
    week.employees.splice(employeeIndex, 1);

    roster.updatedBy = user._id;
    roster.updatedAt = new Date();
    await roster.save();

    return res.status(200).json({
      success: true,
      message: `Employee "${deletedEmployee.name}" deleted successfully`,
      deletedEmployee: {
        name: deletedEmployee.name,
        userId: deletedEmployee.userId,
        employeeId: deletedEmployee._id,
        weekNumber: week.weekNumber
      },
      rosterInfo: {
        rosterId: roster._id,
        month: roster.month,
        year: roster.year,
        remainingEmployees: week.employees.length
      }
    });

  } catch (error) {
    console.error("Delete employee by name error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
// export const addRosterWeek = async (req, res) => {
//   try {
//     const { month, year, weekNumber, startDate, endDate, employees, action = "create" } = req.body;
//     const createdBy = req.user._id;  

//     if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Missing required fields: month, year, weekNumber, startDate, endDate, employees" 
//       });
//     }

//     const processedEmployees = await Promise.all(
//       employees.map(async (emp) => {
//         let user = null;
//         if (emp.name) {
//           user = await User.findOne({ username: emp.name });
//         }

//         const dailyStatus = emp.dailyStatus.map((ds, index) => {
//           const date = new Date(startDate);
//           date.setDate(date.getDate() + index);
//           return {
//             date: date.toISOString(),
//             status: ds.status || "P"
//           };
//         });

//         const woCount = dailyStatus.filter(d => d.status === "WO").length;
//         if (woCount > 2) {
//           throw new Error(`Employee ${emp.name} cannot have more than 2 week-offs in a week`);
//         }
//         if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
//           throw new Error(`Employee ${emp.name} must have both shift start and end hours`);
//         }

//         const shiftStartHour = parseInt(emp.shiftStartHour) || 0;
//         const shiftEndHour = parseInt(emp.shiftEndHour) || 0;
//         if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
//           throw new Error(`Employee ${emp.name} has invalid shift hours`);
//         }

//         if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
//           throw new Error(`Employee ${emp.name}: Shift hours must be between 0 and 23`);
//         }

//         const employeeData = {
//           userId: user?._id || null,
//           name: emp.name,
//           transport: emp.transport || "",
//           cabRoute: emp.cabRoute || "",
//           shiftStartHour,
//           shiftEndHour,
//           dailyStatus,
//         };

//         return employeeData;
//       })
//     );

//     let roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       roster = new Roster({
//         month,
//         year,
//         weeks: [],
//         createdBy,
//       });
//     }

//     const existingWeekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
    
//     if (existingWeekIndex !== -1) {
//       if (action === "add") {
//         const existingEmployees = roster.weeks[existingWeekIndex].employees;
        
//         const existingEmployeeNames = existingEmployees.map(emp => emp.name);
        
//         const newEmployees = processedEmployees.filter(newEmp => 
//           !existingEmployeeNames.includes(newEmp.name)
//         );
        
//         if (newEmployees.length === 0) {
//           return res.status(400).json({ 
//             success: false,
//             message: "All employees already exist in this roster week" 
//           });
//         }
        
//         roster.weeks[existingWeekIndex].employees = [
//           ...existingEmployees,
//           ...newEmployees
//         ];
        
//         console.log(`Added ${newEmployees.length} new employees to existing week`);
//       } else {
//         roster.weeks[existingWeekIndex] = {
//           weekNumber,
//           startDate: new Date(startDate),
//           endDate: new Date(endDate),
//           employees: processedEmployees,
//         };
//         console.log("Replaced existing week with new data");
//       }
//     } else {
//       roster.weeks.push({
//         weekNumber,
//         startDate: new Date(startDate),
//         endDate: new Date(endDate),
//         employees: processedEmployees,
//       });
//       console.log("Created new week");
//     }

//     roster.updatedBy = createdBy;
//     await roster.save();
    
//     console.log("Roster saved successfully");
//     return res.status(201).json({ 
//       success: true,
//       message: action === "add" ? "Employees added to roster successfully" : "Roster week saved successfully", 
//       roster 
//     });
//   } catch (error) {
//     console.error("Error adding roster week:", error);
//     return res.status(400).json({ 
//       success: false,
//       message: error.message || "Failed to add roster week" 
//     });
//   }
// };
export const getRosterForCRMUsers = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const parsedMonth = Number.parseInt(month, 10);
    const parsedYear = Number.parseInt(year, 10);
    if (!Number.isFinite(parsedMonth) || !Number.isFinite(parsedYear)) {
      return res.status(400).json({ message: "Month and year must be valid numbers" });
    }
    const monthStart = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

    const rosters = await Roster.find({
      rosterStartDate: { $lte: monthEnd },
      rosterEndDate: { $gte: monthStart },
    })
      .sort({ rosterStartDate: 1, rosterEndDate: 1, year: 1, month: 1 })
      .lean();

    if (!rosters.length) {
      return res.status(404).json({ message: "Roster not found for this month/year" });
    }

    const crmUsers = await User.find({}, { username: 1 }).lean();
    const crmUsernames = crmUsers.map((u) => u.username);

    const filteredWeeks = rosters
      .flatMap((roster) => roster.weeks || [])
      .filter((week) => {
        if (!week?.startDate || !week?.endDate) return false;
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(week.endDate);
        return weekStart <= monthEnd && weekEnd >= monthStart;
      })
      .map((week) => {
        const filteredEmployees = (week.employees || []).filter((emp) => crmUsernames.includes(emp.name));
        return {
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          employees: filteredEmployees,
        };
      });

    return res.status(200).json({ month: parsedMonth, year: parsedYear, weeks: filteredWeeks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
//by farhan
export const updateRoster = async (req, res) => {
  try {
    const { month, year, weekNumber, employeeId, updates, skipHistory } = req.body;
    const user = req.user;

    console.log("========== UPDATE ROSTER REQUEST ==========");
    console.log("Request body:", req.body);
    console.log("skipHistory:", skipHistory);

    if (!month || !year || !weekNumber || !employeeId || !updates) {
      return res.status(400).json({
        success: false,
        message: "month, year, weekNumber, employeeId and updates are required",
      });
    }
    
    const roster = await Roster.findOne({ month, year });
    if (!roster) {
      return res.status(404).json({ 
        success: false,
        message: "Roster not found" 
      });
    }
    
    // Find the employee
    const weeksWithSameNumber = roster.weeks.filter(w => w.weekNumber === weekNumber);
    
    if (weeksWithSameNumber.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: `No weeks found with week number ${weekNumber}` 
      });
    }
    
    let foundWeek = null;
    let foundEmployee = null;
    let foundWeekIndex = -1;
    let foundEmployeeIndex = -1;
    
    for (let i = 0; i < weeksWithSameNumber.length; i++) {
      const week = weeksWithSameNumber[i];
      const employeeIndex = week.employees.findIndex(emp => 
        emp._id.toString() === employeeId.toString()
      );
      
      if (employeeIndex !== -1) {
        foundWeek = week;
        foundEmployee = week.employees[employeeIndex];
        foundWeekIndex = roster.weeks.findIndex(w => w._id.toString() === week._id.toString());
        foundEmployeeIndex = employeeIndex;
        break;
      }
    }
    
    if (!foundEmployee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found in this week"
      });
    }
    
    // Date validation checks 
    const currentDate = new Date();
	    const weekStartDate = new Date(foundWeek.startDate);
	    const weekEndDate = new Date(foundWeek.endDate);
	    weekStartDate.setHours(0, 0, 0, 0);
	    weekEndDate.setHours(23, 59, 59, 999);
      const toIstDateKey = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(date);
        const year = parts.find((p) => p.type === "year")?.value;
        const month = parts.find((p) => p.type === "month")?.value;
        const day = parts.find((p) => p.type === "day")?.value;
        return year && month && day ? `${year}-${month}-${day}` : null;
      };

	    const accountType = String(user?.accountType || "").toLowerCase();
	      const canEditAnyWeek = accountType === "superadmin" || accountType === "hr";
	    
	    // Past week edits: only HR + SuperAdmin
	    if (currentDate > weekEndDate && !canEditAnyWeek) {
	      return res.status(403).json({
	        success: false,
	        message: "Cannot update previous week rosters. Previous weeks are locked for all users."
	      });
	    }

	    // Future week edits: only HR + SuperAdmin
	    if (currentDate < weekStartDate && !canEditAnyWeek) {
	      return res.status(403).json({
	        success: false,
	        message: "Cannot update future week rosters. Only HR and Super Admin can edit future weeks."
	      });
	    }
    
	    const isCurrentWeek = currentDate >= weekStartDate && currentDate <= weekEndDate;
	      const isLimitedCurrentWeekEditor = isCurrentWeek && accountType === "employee";
      if (isLimitedCurrentWeekEditor) {
        const updateFields = Object.keys(updates || {});
        const nonDailyFields = updateFields.filter((field) => field !== "dailyStatus");
        if (nonDailyFields.length > 0) {
          return res.status(403).json({
            success: false,
            message: "For current week, you can update only daily status from today onward."
          });
        }

        if (!Array.isArray(updates.dailyStatus)) {
          return res.status(400).json({
            success: false,
            message: "dailyStatus array is required for current week updates."
          });
        }

        const todayKey = toIstDateKey(new Date());
        const existingStatusByDate = new Map(
          (foundEmployee.dailyStatus || [])
            .map((d) => {
              const dateKey = toIstDateKey(d?.date);
              if (!dateKey) return null;
              const status = d?.status || d?.departmentStatus || d?.transportStatus || "P";
              return [dateKey, status];
            })
            .filter(Boolean)
        );

        for (const day of updates.dailyStatus) {
          const dateKey = toIstDateKey(day?.date);
          if (!dateKey || !todayKey) continue;
          if (dateKey < todayKey) {
            const existingStatus = existingStatusByDate.get(dateKey) || "P";
            const incomingStatus = day?.status || day?.departmentStatus || day?.transportStatus || "P";
            if (incomingStatus !== existingStatus) {
              return res.status(403).json({
                success: false,
                message: "Past dates in the current week cannot be edited."
              });
            }
          }
        }
      }
    
    const allowedFields = [
      "name",
      "userId",
      "transport",
      "cabRoute",
      "shiftStartHour",
      "shiftEndHour",
      "dailyStatus",
      "teamLeader",
      "department"
    ];

    if (updates.shiftStartHour !== undefined || updates.shiftEndHour !== undefined) {
      if (updates.shiftStartHour === undefined || updates.shiftEndHour === undefined) {
        return res.status(400).json({
          success: false,
          message: "Both shiftStartHour and shiftEndHour are required when updating shift hours"
        });
      }
    }
    
    let shiftStartHour = foundEmployee.shiftStartHour;
    let shiftEndHour = foundEmployee.shiftEndHour;

    if (updates.shiftStartHour !== undefined) {
      shiftStartHour = parseInt(updates.shiftStartHour);
      if (isNaN(shiftStartHour) || shiftStartHour < 0 || shiftStartHour > 23) {
        return res.status(400).json({
          success: false,
          message: "shiftStartHour must be a valid number between 0 and 23"
        });
      }
    }
    
    if (updates.shiftEndHour !== undefined) {
      shiftEndHour = parseInt(updates.shiftEndHour);
      if (isNaN(shiftEndHour) || shiftEndHour < 0 || shiftEndHour > 23) {
        return res.status(400).json({
          success: false,
          message: "shiftEndHour must be a valid number between 0 and 23"
        });
      }
    }
    
    if (updates.dailyStatus && Array.isArray(updates.dailyStatus)) {
      const woCount = updates.dailyStatus.filter(d => d && d.status === "WO").length;
      if (woCount > 2) {
        return res.status(400).json({
          success: false,
          message: "Cannot have more than 2 week-offs (WO) in a week"
        });
      }
    }
    
    // Store old values for history
    const oldEmployeeData = {
      name: foundEmployee.name,
      transport: foundEmployee.transport,
      cabRoute: foundEmployee.cabRoute,
      teamLeader: foundEmployee.teamLeader,
      shiftStartHour: foundEmployee.shiftStartHour,
      shiftEndHour: foundEmployee.shiftEndHour,
      department: foundEmployee.department,
      dailyStatus: foundEmployee.dailyStatus ? [...foundEmployee.dailyStatus] : []
    };
    
    // Apply updates
    Object.keys(updates).forEach((field) => {
      if (allowedFields.includes(field)) {
        if (field !== "shiftStartHour" && field !== "shiftEndHour") {
          foundEmployee[field] = updates[field];
        }
      }
    });
    
	    foundEmployee.shiftStartHour = shiftStartHour;
	    foundEmployee.shiftEndHour = shiftEndHour;

      // Guard against legacy bad rows so single-employee updates don't fail full-document validation.
      const normalizeHour = (value, fallback = 0) => {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) return fallback;
        return parsed;
      };
      const employeeDefaultStart = normalizeHour(foundEmployee.shiftStartHour, 0);
      const employeeDefaultEnd = normalizeHour(foundEmployee.shiftEndHour, 0);
      (roster.weeks || []).forEach((week) => {
        (week.employees || []).forEach((emp) => {
          const rawStart = emp?.shiftStartHour;
          const rawEnd = emp?.shiftEndHour;
          const missingStart = rawStart === undefined || rawStart === null || rawStart === "" || Number.isNaN(Number.parseInt(rawStart, 10));
          const missingEnd = rawEnd === undefined || rawEnd === null || rawEnd === "" || Number.isNaN(Number.parseInt(rawEnd, 10));
          if (missingStart) emp.shiftStartHour = employeeDefaultStart;
          if (missingEnd) emp.shiftEndHour = employeeDefaultEnd;
        });
      });
    
    if (foundEmployee.shiftStartHour === undefined || foundEmployee.shiftEndHour === undefined) {
      return res.status(400).json({
        success: false,
        message: "Both shiftStartHour and shiftEndHour are required for all employees"
      });
    }
    
    roster.updatedBy = user._id;
    
    //  HISTORY LOGIC: S
    if (!skipHistory) {
      console.log("Saving history for bulk edit update");
      
      // Calculate changes
      const changes = [];
      
      if (oldEmployeeData.name !== foundEmployee.name) {
        changes.push({ field: 'name', oldValue: oldEmployeeData.name, newValue: foundEmployee.name });
      }
      if (oldEmployeeData.transport !== foundEmployee.transport) {
        changes.push({ field: 'transport', oldValue: oldEmployeeData.transport, newValue: foundEmployee.transport });
      }
      if (oldEmployeeData.cabRoute !== foundEmployee.cabRoute) {
        changes.push({ field: 'cabRoute', oldValue: oldEmployeeData.cabRoute, newValue: foundEmployee.cabRoute });
      }
      if (oldEmployeeData.teamLeader !== foundEmployee.teamLeader) {
        changes.push({ field: 'teamLeader', oldValue: oldEmployeeData.teamLeader, newValue: foundEmployee.teamLeader });
      }
      if (oldEmployeeData.shiftStartHour !== foundEmployee.shiftStartHour) {
        changes.push({ field: 'shiftStartHour', oldValue: oldEmployeeData.shiftStartHour, newValue: foundEmployee.shiftStartHour });
      }
      if (oldEmployeeData.shiftEndHour !== foundEmployee.shiftEndHour) {
        changes.push({ field: 'shiftEndHour', oldValue: oldEmployeeData.shiftEndHour, newValue: foundEmployee.shiftEndHour });
      }
      if (oldEmployeeData.department !== foundEmployee.department) {
        changes.push({ field: 'department', oldValue: oldEmployeeData.department, newValue: foundEmployee.department });
      }
      
	      // Check dailyStatus changes
	      if (updates.dailyStatus && Array.isArray(updates.dailyStatus)) {
	        const toDateKey = (value) => {
	          const date = value instanceof Date ? value : new Date(value);
	          if (Number.isNaN(date.getTime())) return null;
	          return date.toISOString().slice(0, 10);
	        };
	
	        const oldStatusByDate = new Map(
	          (oldEmployeeData.dailyStatus || [])
	            .map((d) => {
	              const dateKey = toDateKey(d?.date);
	              if (!dateKey) return null;
	              const status = d?.status || d?.departmentStatus || d?.transportStatus || "P";
	              return [dateKey, status];
	            })
	            .filter(Boolean)
	        );
	
	        updates.dailyStatus.forEach((newDay) => {
	          const dateKey = toDateKey(newDay?.date);
	          if (!dateKey) return;
	
	          const oldStatus = oldStatusByDate.get(dateKey) ?? "P";
	          const newStatus =
	            newDay?.status || newDay?.departmentStatus || newDay?.transportStatus || "P";
	
	          if (oldStatus !== newStatus) {
	            changes.push({
	              field: `dailyStatus (${dateKey})`,
	              oldValue: oldStatus,
	              newValue: newStatus,
	            });
	          }
	        });
	      }
      
      if (changes.length > 0) {
        if (!roster.editHistory) roster.editHistory = [];
        
        roster.editHistory.push({
          editedBy: user._id,
          editedByName: user.username,
          accountType: user.accountType,
          actionType: "update",
          weekNumber,
          employeeId: foundEmployee._id,
          employeeName: foundEmployee.name,
          changes
          //  No source field needed -
        });
        console.log(`History saved for employee ${foundEmployee.name}`);
      }
    } else {
      console.log(`Skipping history for View Saved Roster edit of employee ${foundEmployee.name}`);
      // ✅ View Saved Roster  edit
    }
    
    await roster.save();
    
    return res.status(200).json({
      success: true,
      message: `Employee ${foundEmployee.name} (${foundEmployee.department}) updated successfully`,
      employee: foundEmployee,
      roster,
      updatedBy: user.username,
      accountType: user.accountType,
      weekType: isCurrentWeek ? "current" : "future",
      historySaved: !skipHistory // Debug flag
    });
  } catch (error) {
    console.error("Update roster error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Server error"
    });
  }
};

// export const updateRoster = async (req, res) => {
//   try {
//     const { month, year, weekNumber, employeeId, updates } = req.body;
//     const user = req.user;

//     const roster = await Roster.findOne({ month, year });
//     if (!roster) return res.status(404).json({ success: false, message: "Roster not found" });

//     const week = roster.weeks.find(w => w.weekNumber === weekNumber);
//     if (!week) return res.status(404).json({ success: false, message: "Week not found" });

//     const employee = week.employees.id(employeeId);
//     if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

//     const changes = [];

//     Object.keys(updates).forEach(field => {

//       if (field === "dailyStatus") {
//         updates.dailyStatus.forEach((newDay, index) => {
//           const oldDay = employee.dailyStatus[index];
//           if (oldDay && oldDay.status !== newDay.status) {
//             changes.push({
//               field: `dailyStatus (${newDay.date})`,
//               oldValue: oldDay.status,
//               newValue: newDay.status
//             });
//             employee.dailyStatus[index].status = newDay.status;
//           }
//         });

//       } else {
//         if (employee[field] !== updates[field]) {
//           changes.push({
//             field,
//             oldValue: employee[field],
//             newValue: updates[field]
//           });
//           employee[field] = updates[field];
//         }
//       }

//     });

//     if (changes.length > 0) {
//       roster.editHistory.push({
//         editedBy: user._id,
//         editedByName: user.username,
//         accountType: user.accountType,
//         actionType: "update",
//         weekNumber,
//         employeeId,
//         employeeName: employee.name,
//         changes
//       });
//     }

//     roster.updatedBy = user._id;
//     roster.markModified("weeks");
//     roster.markModified("editHistory");

//     await roster.save();

//     return res.status(200).json({
//       success: true,
//       message: "Employee updated successfully"
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
// export const updateRoster = async (req, res) => {
//   try {
//     const { month, year, weekNumber, employeeId, updates } = req.body;
//     const user = req.user;

//     if (!month || !year || !weekNumber || !employeeId || !updates) {
//       return res.status(400).json({
//         success: false,
//         message: "month, year, weekNumber, employeeId and updates are required",
//       });
//     }
//     const roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       return res.status(403).json({ 
//         success: false,
//         message: "Roster not found" 
//       });
//     }
//     const week = roster.weeks.find((w) => w.weekNumber === weekNumber);
//     if (!week) {
//       return res.status(403).json({ 
//         success: false,
//         message: "Week not found in roster" 
//       });
//     }
//     const currentDate = new Date();
//     const weekStartDate = new Date(week.startDate);
//     const weekEndDate = new Date(week.endDate);
//     weekStartDate.setHours(0, 0, 0, 0);
//     weekEndDate.setHours(23, 59, 59, 999);
//     if (currentDate > weekEndDate) {
//       return res.status(403).json({
//         success: false,
//         message: "Cannot update previous week rosters. Previous weeks are locked for all users."
//       });
//     }
//     const isCurrentWeek = currentDate >= weekStartDate && currentDate <= weekEndDate;
//     if (isCurrentWeek) {
//       if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
//         return res.status(403).json({
//           success: false,
//           message: "Only HR and Super Admin can edit current week roster"
//         });
//       }
//     }
//     const employee = week.employees.id(employeeId);
//     if (!employee) {
//       return res.status(403).json({ 
//         success: false,
//         message: "Employee not found in this week" 
//       });
//     }
//     const allowedFields = [
//       "name",
//       "userId",
//       "transport",
//       "cabRoute",
//       "shiftStartHour",
//       "shiftEndHour",
//       "dailyStatus",
//     ];

//     if (updates.shiftStartHour !== undefined || updates.shiftEndHour !== undefined) {
//       if (updates.shiftStartHour === undefined || updates.shiftEndHour === undefined) {
//         return res.status(400).json({
//           success: false,
//           message: "Both shiftStartHour and shiftEndHour are required when updating shift hours"
//         });
//       }
//     }
//     let shiftStartHour = employee.shiftStartHour;
//     let shiftEndHour = employee.shiftEndHour;

//     if (updates.shiftStartHour !== undefined) {
//       shiftStartHour = parseInt(updates.shiftStartHour);
//       if (isNaN(shiftStartHour) || shiftStartHour < 0 || shiftStartHour > 23) {
//         return res.status(400).json({
//           success: false,
//           message: "shiftStartHour must be a valid number between 0 and 23"
//         });
//       }
//     }
//     if (updates.shiftEndHour !== undefined) {
//       shiftEndHour = parseInt(updates.shiftEndHour);
//       if (isNaN(shiftEndHour) || shiftEndHour < 0 || shiftEndHour > 23) {
//         return res.status(400).json({
//           success: false,
//           message: "shiftEndHour must be a valid number between 0 and 23"
//         });
//       }
//     }
//     if (updates.dailyStatus && Array.isArray(updates.dailyStatus)) {
//       const woCount = updates.dailyStatus.filter(d => d && d.status === "WO").length;
//       if (woCount > 2) {
//         return res.status(400).json({
//           success: false,
//           message: "Cannot have more than 2 week-offs (WO) in a week"
//         });
//       }
//     }
//     Object.keys(updates).forEach((field) => {
//       if (allowedFields.includes(field)) {
//         if (field !== "shiftStartHour" && field !== "shiftEndHour") {
//           employee[field] = updates[field];
//         }
//       }
//     });
//     employee.shiftStartHour = shiftStartHour;
//     employee.shiftEndHour = shiftEndHour;
//     if (employee.shiftStartHour === undefined || employee.shiftEndHour === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: "Both shiftStartHour and shiftEndHour are required for all employees"
//       });
//     }
//     roster.updatedBy = user._id;
//     await roster.save();
//     return res.status(200).json({
//       success: true,
//       message: "Employee updated successfully",
//       employee,
//       roster,
//       updatedBy: user.username,
//       accountType: user.accountType,
//       weekType: isCurrentWeek ? "current" : "future"
//     });
//   } catch (error) {
//     console.error("Update roster error:", error);
//     return res.status(500).json({ 
//       success: false,
//       message: error.message || "Server error"
//     });
//   }
// };
// export const exportRosterToExcel = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ message: "Month and year are required" });
//     }

//     const roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       return res.status(404).json({ message: "Roster not found. Save roster first before exporting." });
//     }

//     const workbook = XLSX.utils.book_new();
//     workbook.Props = {
//       Title: `Roster_${month}_${year}`,
//       Author: "Task Management CRM",
//       CreatedDate: new Date()
//     };

 
//     const formatDateWithDay = (date) => {
//       const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//       const day = dayNames[date.getDay()];
//       const formattedDate = date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: '2-digit' 
//       });
//       return `${formattedDate} ${day}`;
//     };

//     roster.weeks.forEach((week) => {
//       const data = [];
      
//       const header = ["Name", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
//       if (week.employees[0]?.dailyStatus) {
//         week.employees[0].dailyStatus.forEach((ds, dayIndex) => {
//           const date = new Date(week.startDate);
//           date.setDate(date.getDate() + dayIndex);
//           header.push(formatDateWithDay(date));
//         });
//       }
//       header.push("Total WO");
//       header.push("Total L");
//       header.push("Total P");
//       header.push("Total H");
      
//       data.push(header);

//       week.employees.forEach((emp) => {
//         const row = [
//           emp.name, 
//           emp.transport || "", 
//           emp.cabRoute || "", 
//           emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
//           emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
//         ];
        
//         let totalWO = 0;
//         let totalL = 0;
//         let totalP = 0;
//         let totalH = 0;
        
//         if (emp.dailyStatus) {
//           emp.dailyStatus.forEach((ds) => {
//             const status = ds.status || "";
//             row.push(status);
            
//             if (status === "P") totalP++;
//             else if (status === "WO") totalWO++;
//             else if (status === "L") totalL++;
//             else if (status === "H") totalH++;
//           });
//         }
        
//         row.push(totalWO);
//         row.push(totalL);
//         row.push(totalP);
//         row.push(totalH);
        
//         data.push(row);
//       });

//       if (week.employees.length > 0 && week.employees[0]?.dailyStatus) {
//         const summaryRow = ["", "", "", "", "Summary"];
//         const dayCount = week.employees[0].dailyStatus.length;
        
//         for (let i = 0; i < dayCount; i++) {
//           summaryRow.push("");
//         }
        
//         const totalWO = week.employees.reduce((sum, emp) => {
//           let empWO = 0;
//           if (emp.dailyStatus) {
//             emp.dailyStatus.forEach(ds => {
//               if (ds.status === "WO") empWO++;
//             });
//           }
//           return sum + empWO;
//         }, 0);
        
//         const totalL = week.employees.reduce((sum, emp) => {
//           let empL = 0;
//           if (emp.dailyStatus) {
//             emp.dailyStatus.forEach(ds => {
//               if (ds.status === "L") empL++;
//             });
//           }
//           return sum + empL;
//         }, 0);
        
//         const totalP = week.employees.reduce((sum, emp) => {
//           let empP = 0;
//           if (emp.dailyStatus) {
//             emp.dailyStatus.forEach(ds => {
//               if (ds.status === "P") empP++;
//             });
//           }
//           return sum + empP;
//         }, 0);
        
//         const totalH = week.employees.reduce((sum, emp) => {
//           let empH = 0;
//           if (emp.dailyStatus) {
//             emp.dailyStatus.forEach(ds => {
//               if (ds.status === "H") empH++;
//             });
//           }
//           return sum + empH;
//         }, 0);
        
//         summaryRow.push(`WO: ${totalWO}`);
//         summaryRow.push(`L: ${totalL}`);
//         summaryRow.push(`P: ${totalP}`);
//         summaryRow.push(`H: ${totalH}`);
        
//         data.push(summaryRow);
//       }

//       const worksheet = XLSX.utils.aoa_to_sheet(data);
      
//       const range = XLSX.utils.decode_range(worksheet['!ref']);
      
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
//         if (!worksheet[cellAddress]) continue;
        
//         let bgColor = "4472C4";  
//         if (C >= range.e.c - 3) {  
//           bgColor = "FF9900";  
//         }
        
//         worksheet[cellAddress].s = {
//           font: { bold: true, color: { rgb: "FFFFFF" } },
//           fill: { fgColor: { rgb: bgColor } },
//           alignment: { horizontal: "center", vertical: "center" },
//           border: {
//             top: { style: "thin", color: { rgb: "000000" } },
//             bottom: { style: "thin", color: { rgb: "000000" } },
//             left: { style: "thin", color: { rgb: "000000" } },
//             right: { style: "thin", color: { rgb: "000000" } }
//           }
//         };
//       }

//       for (let R = 1; R <= range.e.r; ++R) {
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//           if (!worksheet[cellAddress]) continue;
          
//           const cellStyle = {
//             alignment: { horizontal: "center", vertical: "center" },
//             border: {
//               top: { style: "thin", color: { rgb: "D9D9D9" } },
//               bottom: { style: "thin", color: { rgb: "D9D9D9" } },
//               left: { style: "thin", color: { rgb: "D9D9D9" } },
//               right: { style: "thin", color: { rgb: "D9D9D9" } }
//             }
//           };
          
//           const isSummaryRow = (R === range.e.r);
//           const isEmployeeRow = !isSummaryRow;
          
//           if (isEmployeeRow) {
//             if (C >= 5 && C < range.e.c - 3) { 
//               const status = worksheet[cellAddress].v;
//               if (status === "P" || status === "Present") {
//                 cellStyle.fill = { fgColor: { rgb: "C6EFCE" } };  
//               } else if (status === "WO" || status === "Week Off") {
//                 cellStyle.fill = { fgColor: { rgb: "FFC7CE" } };  
//               } else if (status === "L" || status === "Leave") {
//                 cellStyle.fill = { fgColor: { rgb: "FFEB9C" } }; 
//               } else if (status === "H" || status === "Holiday") {
//                 cellStyle.fill = { fgColor: { rgb: "B4C6E7" } }; 
//               }
//             } else if (C >= range.e.c - 3) {  
//               cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  
//               cellStyle.font = { bold: true };
//             }
//           } else if (isSummaryRow) {
//             cellStyle.font = { bold: true };
//             cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray
            
//             if (C >= range.e.c - 3) {
//               cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue
//             }
//           }
          
//           worksheet[cellAddress].s = cellStyle;
//         }
//       }

//       const dateCols = week.employees[0]?.dailyStatus?.length || 0;
//       worksheet['!cols'] = [
//         { wch: 20 },  
//         { wch: 15 },  
//         { wch: 15 },  
//         { wch: 15 },  
//         { wch: 15 },  
//         ...Array(dateCols).fill({ wch: 15 }),  
//         { wch: 10 }, 
//         { wch: 10 },  
//         { wch: 10 },  
//         { wch: 10 }   
//       ];

//       XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${week.weekNumber}`);
//     });

//     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=roster_${month}_${year}.xlsx`);
    
//     res.send(buffer);
//   } catch (error) {
//     console.error("Error exporting roster to Excel:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };

export const exportRosterToExcel = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        success: false,
        message: "Month and year are required" 
      });
    }

    const roster = await Roster.findOne({ month, year });
    if (!roster) {
      return res.status(404).json({ 
        success: false,
        message: "Roster not found. Save roster first before exporting." 
      });
    }

    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: `Roster_${month}_${year}`,
      Author: "Task Management CRM",
      CreatedDate: new Date()
    };

    const parseDateUtc = (value) => {
      const raw = String(value || "");
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Date(
        Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
      );
    };

    const formatDateWithDay = (date) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const day = dayNames[date.getUTCDay()];
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      });
      return `${formattedDate} ${day}`;
    };

    const usedSheetNames = new Set();
    const getUniqueSheetName = (baseName) => {
      const maxLen = 31;
      const trimmedBase = String(baseName || "Sheet").slice(0, maxLen);
      if (!usedSheetNames.has(trimmedBase)) {
        usedSheetNames.add(trimmedBase);
        return trimmedBase;
      }
      let idx = 2;
      while (idx < 1000) {
        const suffix = ` (${idx})`;
        const candidate = `${trimmedBase.slice(0, maxLen - suffix.length)}${suffix}`;
        if (!usedSheetNames.has(candidate)) {
          usedSheetNames.add(candidate);
          return candidate;
        }
        idx += 1;
      }
      const fallback = `${trimmedBase.slice(0, maxLen - 4)}_dup`;
      usedSheetNames.add(fallback);
      return fallback;
    };

    roster.weeks.forEach((week) => {
      const data = [];
      
      // ✅ DEPARTMENT COLUMN ADD 
      const header = ["Name", "Department", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
      
      if (week.employees[0]?.dailyStatus) {
        week.employees[0].dailyStatus.forEach((ds, dayIndex) => {
          const startUtc = parseDateUtc(week.startDate);
          if (!startUtc) {
            header.push("");
            return;
          }
          const date = new Date(startUtc);
          date.setUTCDate(startUtc.getUTCDate() + dayIndex);
          header.push(formatDateWithDay(date));
        });
      }
      
      const summaryHeaders = [
        "Total WO", "Total L", "Total P", "Total NCNS", "Total UL", 
        "Total LWP", "Total BL", "Total HD", "Total Empty"
      ];
      
      summaryHeaders.forEach(h => header.push(h));
      
      data.push(header);

      week.employees.forEach((emp) => {
        // ✅ DEPARTMENT VALUE ADD 
        const row = [
          emp.name || "", 
          emp.department || "General", //ADD
          emp.transport || "", 
          emp.cabRoute || "", 
          emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
          emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
        ];
        
        let totalWO = 0, totalL = 0, totalP = 0, totalNCNS = 0, totalUL = 0;
        let totalLWP = 0, totalBL = 0, totalHD = 0, totalEmpty = 0;
        
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds.status || "";
            
            if (status === "" || status === null) {
              row.push("");
              totalEmpty++;
            } else {
              row.push(status);
              
              switch(status.toUpperCase()) {
                case "P": totalP++; break;
                case "WO": totalWO++; break;
                case "L": totalL++; break;
                case "NCNS": totalNCNS++; break;
                case "UL": totalUL++; break;
                case "LWP": totalLWP++; break;
                case "BL": totalBL++; break;
                case "HD": totalHD++; break;
                default: totalEmpty++;
              }
            }
          });
        } else {
          const dayCount = week.employees[0]?.dailyStatus?.length || 0;
          for (let i = 0; i < dayCount; i++) {
            row.push("");
            totalEmpty++;
          }
        }
        
        row.push(totalWO, totalL, totalP, totalNCNS, totalUL, totalLWP, totalBL, totalHD, totalEmpty);
        data.push(row);
      });

      if (week.employees.length > 0) {
        const summaryRow = ["", "", "", "", "", "Summary"];
        const dayCount = week.employees[0]?.dailyStatus?.length || 0;
        
        for (let i = 0; i < dayCount; i++) summaryRow.push("");
        
        const totals = { WO:0, L:0, P:0, NCNS:0, UL:0, LWP:0, BL:0, HD:0, Empty:0 };
        
        week.employees.forEach(emp => {
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              const status = ds.status || "";
              if (status === "" || status === null) totals.Empty++;
              else {
                switch(status.toUpperCase()) {
                  case "P": totals.P++; break;
                  case "WO": totals.WO++; break;
                  case "L": totals.L++; break;
                  case "NCNS": totals.NCNS++; break;
                  case "UL": totals.UL++; break;
                  case "LWP": totals.LWP++; break;
                  case "BL": totals.BL++; break;
                  case "HD": totals.HD++; break;
                  default: totals.Empty++;
                }
              }
            });
          }
        });
        
        summaryRow.push(`WO: ${totals.WO}`, `L: ${totals.L}`, `P: ${totals.P}`, 
                        `NCNS: ${totals.NCNS}`, `UL: ${totals.UL}`, `LWP: ${totals.LWP}`, 
                        `BL: ${totals.BL}`, `HD: ${totals.HD}`, `Empty: ${totals.Empty}`);
        
        data.push(summaryRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      const dateCols = week.employees[0]?.dailyStatus?.length || 0;
      const colWidths = [
        { wch: 20 },  // Name
        { wch: 15 },  // ✅ Department
        { wch: 15 },  // Transport
        { wch: 15 },  // CAB Route
        { wch: 15 },  // Shift Start
        { wch: 15 },  // Shift End
        ...Array(dateCols).fill({ wch: 12 }),
        ...Array(9).fill({ wch: 12 })
      ];
      
      worksheet['!cols'] = colWidths;

      const sheetName = getUniqueSheetName(`Week ${week.weekNumber}`);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=roster_${month}_${year}.xlsx`);
    
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting roster to Excel:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

export const exportAttendanceSnapshotToExcel = async (req, res) => {
  try {
    const user = req.user;
    const isHrOrSuperAdmin = ["superAdmin", "HR"].includes(user?.accountType);
    const isEmployee = user?.accountType === "employee";
    if (!isHrOrSuperAdmin && !isEmployee) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HR, Super Admin, or delegated employee can export attendance snapshots."
      });
    }

    const { startDate, endDate, department, teamLeader, delegatedFrom } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required"
      });
    }

    const IST_TIME_ZONE = "Asia/Kolkata";

    const parseYmd = (value) => {
      const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
      return { year, month, day };
    };

    // Treat incoming YYYY-MM-DD as an IST calendar date, regardless of server timezone.
    // Build UTC Date boundaries that represent IST day start/end.
    const startYmd = parseYmd(startDate);
    const endYmd = parseYmd(endDate);
    if (!startYmd || !endYmd) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate (expected YYYY-MM-DD)"
      });
    }

    const start = new Date(`${startDate}T00:00:00.000+05:30`);
    const end = new Date(`${endDate}T23:59:59.999+05:30`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate"
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate must be before or equal to endDate"
      });
    }

    let delegatedAccessEmployeeIds = new Set();
    let delegatedTeamLeaderNames = new Set();
    if (isEmployee) {
      const delegatedFromId = String(delegatedFrom || "").trim();
      if (!delegatedFromId) {
        return res.status(403).json({
          success: false,
          message: "Delegated team leader is required for employee snapshot export.",
        });
      }
      if (!/^[a-f\d]{24}$/i.test(delegatedFromId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid delegated team leader identifier.",
        });
      }

      const activeDelegation = await Delegation.findOne({
        assignee: user._id,
        delegator: delegatedFromId,
        status: "active",
        startDate: { $lte: end },
        endDate: { $gte: start },
      })
        .populate("delegator", "username")
        .lean();

      if (!activeDelegation) {
        return res.status(403).json({
          success: false,
          message: "No active delegation found for selected team leader and date range.",
        });
      }

      delegatedAccessEmployeeIds = new Set(
        (activeDelegation?.affectedEmployees || []).map((id) => String(id)).filter(Boolean)
      );
      const delegatedLeaderName = String(activeDelegation?.delegator?.username || "")
        .trim()
        .toLowerCase();
      delegatedTeamLeaderNames = delegatedLeaderName
        ? new Set([delegatedLeaderName])
        : new Set();
    }

	    // NOTE: Some rosters store `rosterStartDate/rosterEndDate` as the specific uploaded week range
	    // (not the full month). Query by overlapping weeks first to ensure exports work for any week.
	    const rosterQuery = {
	      $or: [
	        {
	          weeks: {
	            $elemMatch: {
	              startDate: { $lte: end },
	              endDate: { $gte: start },
	            },
	          },
	        },
	        {
	          rosterStartDate: { $lte: end },
	          rosterEndDate: { $gte: start },
	        },
	      ],
	    };

    const rosters = await Roster.find(rosterQuery).lean();
    if (!rosters || rosters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No saved roster data found for the selected date range"
      });
    }

	    const normalizeDepartment = (value) => String(value || "").trim().toLowerCase();
	    const normalizeTeamLeader = (value) => String(value || "").trim().toLowerCase();
	    const toArrayParam = (value) => {
	      if (Array.isArray(value)) return value;
	      if (typeof value === "string" && value.includes(",")) {
	        return value.split(",").map((v) => v.trim()).filter(Boolean);
	      }
	      return value ? [value] : [];
	    };
	    const deptFilters = new Set(
	      toArrayParam(department).map((v) => normalizeDepartment(v)).filter(Boolean)
	    );
	    const teamLeaderFilters = new Set(
	      toArrayParam(teamLeader).map((v) => normalizeTeamLeader(v)).filter(Boolean)
	    );

	    const toIstDateKey = (value) => {
	      if (!value) return "";
	      if (typeof value === "string") {
	        const trimmed = value.trim();
	        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
	      }
	      const d = value instanceof Date ? value : new Date(value);
	      if (Number.isNaN(d.getTime())) return "";
	      const parts = new Intl.DateTimeFormat("en-GB", {
	        timeZone: IST_TIME_ZONE,
	        year: "numeric",
	        month: "2-digit",
	        day: "2-digit",
	      }).formatToParts(d);
	      const year = parts.find((p) => p.type === "year")?.value;
	      const month = parts.find((p) => p.type === "month")?.value;
	      const day = parts.find((p) => p.type === "day")?.value;
	      if (!year || !month || !day) return "";
	      return `${year}-${month}-${day}`;
	    };

	    const pad2 = (num) => String(num).padStart(2, "0");

	    const eachDateKeyInRange = (fromYmd, toYmd) => {
	      const startUtcNoon = new Date(Date.UTC(fromYmd.year, fromYmd.month - 1, fromYmd.day, 12, 0, 0, 0));
	      const endUtcNoon = new Date(Date.UTC(toYmd.year, toYmd.month - 1, toYmd.day, 12, 0, 0, 0));
	      const keys = [];
	      const cursor = new Date(startUtcNoon);
	      while (cursor <= endUtcNoon) {
	        const parts = new Intl.DateTimeFormat("en-GB", {
	          timeZone: IST_TIME_ZONE,
	          year: "numeric",
	          month: "2-digit",
	          day: "2-digit",
	        }).formatToParts(cursor);
	        const year = parts.find((p) => p.type === "year")?.value;
	        const month = parts.find((p) => p.type === "month")?.value;
	        const day = parts.find((p) => p.type === "day")?.value;
	        if (year && month && day) keys.push(`${year}-${month}-${day}`);
	        cursor.setUTCDate(cursor.getUTCDate() + 1);
	      }
	      return keys;
	    };

	    const dayLabelFromKey = (dateKey) => {
	      const dt = new Date(`${dateKey}T12:00:00.000+05:30`);
	      if (Number.isNaN(dt.getTime())) return dateKey;
	      const parts = new Intl.DateTimeFormat("en-GB", {
	        timeZone: IST_TIME_ZONE,
	        day: "2-digit",
	        month: "2-digit",
	        weekday: "short",
	      }).formatToParts(dt);
	      const day = parts.find((p) => p.type === "day")?.value;
	      const month = parts.find((p) => p.type === "month")?.value;
	      const weekday = parts.find((p) => p.type === "weekday")?.value;
	      if (!day || !month || !weekday) return dateKey;
	      return `${day}/${month} ${weekday}`;
	    };

	    const shiftHourToString = (value) => {
	      if (value === null || value === undefined || value === "") return "";
	      const n = Number(value);
	      if (Number.isNaN(n)) return String(value);
	      return `${n}:00`;
	    };

	    const workbook = XLSX.utils.book_new();
	    workbook.Props = {
	      Title: "Attendance_Snapshot",
	      Author: "Task Management CRM",
	      CreatedDate: new Date()
	    };

	    const dateKeys = eachDateKeyInRange(startYmd, endYmd);
	    const dateLabels = dateKeys.map((k) => dayLabelFromKey(k));

	    const employeeMap = new Map();
	    const normalizeKeyPart = (value) => String(value || "").trim().toLowerCase();
	    const ensureEmployee = (emp) => {
	      const employeeUserId = String(emp?.userId?._id || emp?.userId || "").trim();
	      const key = employeeUserId
	        ? `uid:${employeeUserId}`
	        : `name:${normalizeKeyPart(emp?.name)}|dept:${normalizeKeyPart(emp?.department)}|tl:${normalizeKeyPart(
	            emp?.teamLeader
	          )}`;
	      if (!employeeMap.has(key)) {
	        employeeMap.set(key, {
	          name: emp?.name || "",
	          department: emp?.department || "General",
	          transport: emp?.transport || "",
	          cabRoute: emp?.cabRoute || "",
	          teamLeader: emp?.teamLeader || "",
	          shiftStartHour: emp?.shiftStartHour ?? "",
	          shiftEndHour: emp?.shiftEndHour ?? "",
	          dailyByDateKey: new Map(),
	        });
	      }
	      return employeeMap.get(key);
	    };

	    rosters.forEach((roster) => {
	      (roster.weeks || [])
	        .filter(Boolean)
	        .forEach((week) => {
	          const weekStart = new Date(week.startDate);
	          const weekEnd = new Date(week.endDate);
	          if (Number.isNaN(weekStart.getTime()) || Number.isNaN(weekEnd.getTime())) return;
	          if (weekStart > end || weekEnd < start) return;

	          (week.employees || [])
	            .filter(Boolean)
	            .forEach((emp) => {
	              if (isEmployee) {
	                const employeeUserId = String(emp?.userId || "").trim();
	                const employeeTeamLeader = String(emp?.teamLeader || "").trim().toLowerCase();
	                const inDelegatedEmployees = employeeUserId && delegatedAccessEmployeeIds.has(employeeUserId);
	                const inDelegatedTeam = employeeTeamLeader && delegatedTeamLeaderNames.has(employeeTeamLeader);
	                if (!inDelegatedEmployees && !inDelegatedTeam) return;
	              }

              if (deptFilters.size > 0) {
                const empDept = normalizeDepartment(emp.department);
                if (!deptFilters.has(empDept)) return;
              }

              if (teamLeaderFilters.size > 0) {
                const employeeTeamLeader = normalizeTeamLeader(emp?.teamLeader);
                const matchesNone = !employeeTeamLeader && teamLeaderFilters.has("__none__");
                const matchesNamedLeader = employeeTeamLeader && teamLeaderFilters.has(employeeTeamLeader);
                if (!matchesNone && !matchesNamedLeader) return;
              }

	              const rowRef = ensureEmployee(emp);

		              (emp.dailyStatus || []).forEach((ds) => {
		                const dsDate = new Date(ds.date);
		                if (Number.isNaN(dsDate.getTime())) return;
		                if (dsDate < start || dsDate > end) return;

		              const dateKey = toIstDateKey(dsDate);
		              if (!dateKey) return;

	              rowRef.dailyByDateKey.set(dateKey, {
	                status: ds.status || "",
	                transportStatus: ds.transportStatus || "",
	                departmentStatus: ds.departmentStatus || "",
	                transportArrivalTime: ds.transportArrivalTime || null,
	                departmentArrivalTime: ds.departmentArrivalTime || null,
	              });
	            });
	          });
	        });
	    });

	    const statusTotals = (statusList) => {
	      const totals = {
	        P: 0,
	        WO: 0,
	        L: 0,
	        NCNS: 0,
	        UL: 0,
	        LWP: 0,
	        BL: 0,
	        H: 0,
	        LWD: 0,
	      };

	      statusList.forEach((raw) => {
	        const status = String(raw || "").trim().toUpperCase();
	        if (!status) return;
	        if (totals[status] !== undefined) totals[status] += 1;
	      });

	      return totals;
	    };

	    const employees = Array.from(employeeMap.values()).sort((a, b) =>
	      String(a.name).localeCompare(String(b.name))
	    );

	    if (employees.length === 0) {
	      return res.status(404).json({
	        success: false,
	        message: "No attendance records found for the selected date range"
	      });
	    }

	    const commonCols = [
	      { wch: 22 }, // Name
	      { wch: 18 }, // Department
	      { wch: 12 }, // Transport
	      { wch: 16 }, // Cab route
	      { wch: 16 }, // Team leader
	      { wch: 14 }, // Shift start
	      { wch: 14 }, // Shift end
	    ];

	    const totalsCols = Array(9).fill({ wch: 18 });

	    const formatTime = (value) => {
	      if (!value) return "";
	      if (typeof value === "string") {
	        const trimmed = value.trim();
	        const timeOnly = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
	        if (timeOnly) return `${pad2(timeOnly[1])}:${pad2(timeOnly[2])}`;
	      }
	      const d = value instanceof Date ? value : new Date(value);
	      if (Number.isNaN(d.getTime())) return "";
	      const parts = new Intl.DateTimeFormat("en-GB", {
	        timeZone: IST_TIME_ZONE,
	        hour: "2-digit",
	        minute: "2-digit",
	        hour12: false,
	      }).formatToParts(d);
	      const hour = parts.find((p) => p.type === "hour")?.value;
	      const minute = parts.find((p) => p.type === "minute")?.value;
	      if (!hour || !minute) return "";
	      return `${hour}:${minute}`;
	    };

	    const buildSnapshotSheet = () => {
	      const header = [
	        "Name",
	        "Department",
	        "Transport",
	        "CAB Route",
	        "Team Leader",
	        "Shift Start Hour",
	        "Shift End Hour",
	      ];

	      // Keep "1 employee = 1 row" format; add per-day grouped columns so
	      // the export mirrors the roster sheet style while still showing what
	      // Transport and Department updated.
	      dateLabels.forEach((label) => {
	        header.push(
	          `${label} Status`,
	          `${label} Transport Status`,
	          `${label} Department Status`,
	          `${label} Transport Arrival`,
	          `${label} Department Arrival`
	        );
	      });

	      header.push(
	        "Total Present",
	        "Total Week Off",
	        "Total Leave",
	        "Total No Call No Show",
	        "Total Unpaid Leave",
	        "Total Leave Without Pay",
	        "Total Bereavement Leave",
	        "Total Holiday",
	        "Total Last Working Day"
	      );

	      const rows = [header];
	      employees.forEach((emp) => {
	        const effectiveStatuses = [];
	        const dayCells = [];

	        dateKeys.forEach((k) => {
	          const daily = emp.dailyByDateKey.get(k);
	          const status = daily?.status || daily?.departmentStatus || daily?.transportStatus || "";
	          effectiveStatuses.push(status);

	          dayCells.push(
	            status,
	            daily?.transportStatus || "",
	            daily?.departmentStatus || "",
	            formatTime(daily?.transportArrivalTime || null),
	            formatTime(daily?.departmentArrivalTime || null)
	          );
	        });

	        const totals = statusTotals(effectiveStatuses);

	        rows.push([
	          emp.name,
	          emp.department,
	          emp.transport,
	          emp.cabRoute,
	          emp.teamLeader,
	          shiftHourToString(emp.shiftStartHour),
	          shiftHourToString(emp.shiftEndHour),
	          ...dayCells,
	          totals.P,
	          totals.WO,
	          totals.L,
	          totals.NCNS,
	          totals.UL,
	          totals.LWP,
	          totals.BL,
	          totals.H,
	          totals.LWD,
	        ]);
	      });

	      const perDayCols = dateKeys.length * 5;
	      const ws = XLSX.utils.aoa_to_sheet(rows);
	      ws["!cols"] = [
	        ...commonCols,
	        ...Array(perDayCols).fill({ wch: 14 }),
	        ...totalsCols,
	      ];
	      XLSX.utils.book_append_sheet(workbook, ws, "Attendance Snapshot");
	    };

	    buildSnapshotSheet();

	    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
	    const startKey = startDate;
	    const endKey = endDate;
	    const selectedDepartmentValues = toArrayParam(department)
	      .map((value) => String(value || "").trim())
	      .filter(Boolean);
	    const deptSuffix = selectedDepartmentValues.length
	      ? `_dept_${selectedDepartmentValues
	          .join("-")
	          .replace(/\s+/g, "-")
	          .replace(/[^a-zA-Z0-9_-]/g, "")}`
	      : "";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_snapshot_${startKey}_to_${endKey}${deptSuffix}.xlsx`
    );

    return res.send(buffer);
  } catch (error) {
    console.error("Error exporting attendance snapshot:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
//upper is by farhan 
// export const exportRosterToExcel = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Month and year are required" 
//       });
//     }

//     const roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Roster not found. Save roster first before exporting." 
//       });
//     }

//     const workbook = XLSX.utils.book_new();
//     workbook.Props = {
//       Title: `Roster_${month}_${year}`,
//       Author: "Task Management CRM",
//       CreatedDate: new Date()
//     };

//     const formatDateWithDay = (date) => {
//       const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//       const day = dayNames[date.getDay()];
//       const formattedDate = date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: '2-digit' 
//       });
//       return `${formattedDate} ${day}`;
//     };

//     roster.weeks.forEach((week) => {
//       const data = [];
      
//       const header = ["Name", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
      
//       if (week.employees[0]?.dailyStatus) {
//         week.employees[0].dailyStatus.forEach((ds, dayIndex) => {
//           const date = new Date(week.startDate);
//           date.setDate(date.getDate() + dayIndex);
//           header.push(formatDateWithDay(date));
//         });
//       }
      
      
//       const summaryHeaders = [
//         "Total WO",
//         "Total L", 
//         "Total P",
//         "Total NCNS",
//         "Total UL",
//         "Total LWP", 
//         "Total BL",
//         "Total HD",
//         "Total Empty"
//       ];
      
//       summaryHeaders.forEach(h => header.push(h));
      
//       data.push(header);

//       week.employees.forEach((emp) => {
//         const row = [
//           emp.name || "", 
//           emp.transport || "", 
//           emp.cabRoute || "", 
//           emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
//           emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
//         ];
        
        
//         let totalWO = 0;
//         let totalL = 0;
//         let totalP = 0;
//         let totalNCNS = 0;
//         let totalUL = 0;
//         let totalLWP = 0;
//         let totalBL = 0;
//         let totalHD = 0;
//         let totalEmpty = 0;
        
//         if (emp.dailyStatus && emp.dailyStatus.length > 0) {
//           emp.dailyStatus.forEach((ds) => {
//             const status = ds.status || "";
            
            
//             if (status === "" || status === null) {
//               row.push("");
//               totalEmpty++;
//             } else {
//               row.push(status);
              
//               switch(status.toUpperCase()) {
//                 case "P": 
//                   totalP++; 
//                   break;
//                 case "WO": 
//                   totalWO++; 
//                   break;
//                 case "L": 
//                   totalL++; 
//                   break;
//                 case "NCNS": 
//                   totalNCNS++; 
//                   break;
//                 case "UL": 
//                   totalUL++; 
//                   break;
//                 case "LWP": 
//                   totalLWP++; 
//                   break;
//                 case "BL": 
//                   totalBL++; 
//                   break;
//                 case "HD":
//                   totalHD++;
//                   break;
//                 default:
//                   totalEmpty++;
//               }
//             }
//           });
//         } else {
          
//           const dayCount = week.employees[0]?.dailyStatus?.length || 0;
//           for (let i = 0; i < dayCount; i++) {
//             row.push("");
//             totalEmpty++;
//           }
//         }
        
       
//         row.push(totalWO);
//         row.push(totalL);
//         row.push(totalP);
//         row.push(totalNCNS);
//         row.push(totalUL);
//         row.push(totalLWP);
//         row.push(totalBL);
//         row.push(totalHD);
//         row.push(totalEmpty);
        
//         data.push(row);
//       });

     
//       if (week.employees.length > 0) {
//         const summaryRow = ["", "", "", "", "Summary"];
        
       
//         const dayCount = week.employees[0]?.dailyStatus?.length || 0;
        
        
//         for (let i = 0; i < dayCount; i++) {
//           summaryRow.push("");
//         }
        
        
//         const totals = {
//           WO: 0, L: 0, P: 0, NCNS: 0, UL: 0, LWP: 0, BL: 0, HD:0, Empty: 0
//         };
        
//         week.employees.forEach(emp => {
//           if (emp.dailyStatus) {
//             emp.dailyStatus.forEach(ds => {
//               const status = ds.status || "";
//               if (status === "" || status === null) {
//                 totals.Empty++;
//               } else {
//                 switch(status.toUpperCase()) {
//                   case "P": totals.P++; break;
//                   case "WO": totals.WO++; break;
//                   case "L": totals.L++; break;
//                   case "NCNS": totals.NCNS++; break;
//                   case "UL": totals.UL++; break;
//                   case "LWP": totals.LWP++; break;
//                   case "BL": totals.BL++; break;
//                   case "HD": totals.HD++; break;
//                   default:
//                     totals.Empty++;
//                 }
//               }
//             });
//           }
//         });
        
       
//         summaryRow.push(`WO: ${totals.WO}`);
//         summaryRow.push(`L: ${totals.L}`);
//         summaryRow.push(`P: ${totals.P}`);
//         summaryRow.push(`NCNS: ${totals.NCNS}`);
//         summaryRow.push(`UL: ${totals.UL}`);
//         summaryRow.push(`LWP: ${totals.LWP}`);
//         summaryRow.push(`BL: ${totals.BL}`);
//         summaryRow.push(`HD: ${totals.HD}`);
//         summaryRow.push(`Empty: ${totals.Empty}`);
        
//         data.push(summaryRow);
//       }

//       const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      
//       const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        
      
//         if (!worksheet[cellAddress]) {
//           worksheet[cellAddress] = { v: header[C] || "" };
//         }
        
//         let bgColor = "4472C4";  
       
//         const summaryStartCol = range.e.c - 7;  
//         if (C >= summaryStartCol && C <= range.e.c) {  
//           bgColor = "FF9900";  
//         }
        
//         worksheet[cellAddress].s = {
//           font: { bold: true, color: { rgb: "FFFFFF" } },
//           fill: { fgColor: { rgb: bgColor } },
//           alignment: { horizontal: "center", vertical: "center" },
//           border: {
//             top: { style: "thin", color: { rgb: "000000" } },
//             bottom: { style: "thin", color: { rgb: "000000" } },
//             left: { style: "thin", color: { rgb: "000000" } },
//             right: { style: "thin", color: { rgb: "000000" } }
//           }
//         };
//       }

      
//       for (let R = 1; R <= range.e.r; ++R) {
//         const isSummaryRow = (R === range.e.r);
        
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          
          
//           if (!worksheet[cellAddress]) {
//             worksheet[cellAddress] = { v: "" };
//           }
          
//           const cellStyle = {
//             alignment: { horizontal: "center", vertical: "center" },
//             border: {
//               top: { style: "thin", color: { rgb: "D9D9D9" } },
//               bottom: { style: "thin", color: { rgb: "D9D9D9" } },
//               left: { style: "thin", color: { rgb: "D9D9D9" } },
//               right: { style: "thin", color: { rgb: "D9D9D9" } }
//             }
//           };
          
//           const dayCount = week.employees[0]?.dailyStatus?.length || 0;
//           const summaryStartCol = 5 + dayCount; 
          
//           if (!isSummaryRow) {
            
//             if (C >= 5 && C < summaryStartCol) { 
             
//               const status = worksheet[cellAddress].v;
//               if (status === "P") {
//                 cellStyle.fill = { fgColor: { rgb: "C6EFCE" } }; 
//               } else if (status === "WO") {
//                 cellStyle.fill = { fgColor: { rgb: "FFC7CE" } }; 
//               } else if (status === "L") {
//                 cellStyle.fill = { fgColor: { rgb: "FFEB9C" } }; 
//               } else if (status === "NCNS") {
//                 cellStyle.fill = { fgColor: { rgb: "E7E6E6" } }; 
//               } else if (status === "UL") {
//                 cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  
//               } else if (status === "LWP") {
//                 cellStyle.fill = { fgColor: { rgb: "F8CBAD" } };  
//               } else if (status === "BL") {
//                 cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };  
//               } else if (status === "HD") {
//                 cellStyle.fill = {  fgColor: {rgb: "#FFD966"} };
//               }
//                else if (status === "" || status === null) {
//                 cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  
//               } else {
//                 cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  
//               }
//             } 
            
//             else if (C >= summaryStartCol) {  
//               cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  
//               cellStyle.font = { bold: true };
              
              
//               if (worksheet[cellAddress].v === undefined || worksheet[cellAddress].v === "") {
//                 worksheet[cellAddress].v = 0;
//               }
//             }
//           } 
         
//           else if (isSummaryRow) {
//             cellStyle.font = { bold: true };
//             cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; 
            
            
//             if (C >= summaryStartCol) {
//               cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; 
//             }
//           }
          
//           worksheet[cellAddress].s = cellStyle;
//         }
//       }

//       const dateCols = week.employees[0]?.dailyStatus?.length || 0;
//       const colWidths = [
//         { wch: 20 },  
//         { wch: 15 },  
//         { wch: 15 },  
//         { wch: 15 }, 
//         { wch: 15 },  
//         ...Array(dateCols).fill({ wch: 12 }),  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 },  
//         { wch: 12 }    
//       ];
      
//       worksheet['!cols'] = colWidths;

//       XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${week.weekNumber}`);
//     });

//     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=roster_${month}_${year}.xlsx`);
    
//     res.send(buffer);
//   } catch (error) {
//     console.error("Error exporting roster to Excel:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };
export const getAllRosters = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    
    console.log("📡 getAllRosters called with:", { month, year, page, limit });
    
    const filter = {};
    const parsedMonth = Number.parseInt(month, 10);
    const parsedYear = Number.parseInt(year, 10);

    if (Number.isFinite(parsedMonth) && Number.isFinite(parsedYear)) {
      const monthStart = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
      filter.rosterStartDate = { $lte: monthEnd };
      filter.rosterEndDate = { $gte: monthStart };
    } else {
      if (month) filter.month = parsedMonth;
      if (year) filter.year = parsedYear;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Roster.countDocuments(filter);
    
    // 🔥 FIX: Add population to get user details
    const rosters = await Roster.find(filter)
      .sort({ rosterStartDate: -1, rosterEndDate: -1, year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .populate('weeks.employees.userId', 'username email department') // Add this line!
      .lean();
    
    console.log("📦 Raw rosters count:", rosters.length);
    
    // Format rosters similar to getRosterForBulkEdit but for viewing
    const formattedRosters = rosters.map(roster => {
      // Group weeks by weekNumber and merge employees
      const weeksMap = new Map();
      
      (roster.weeks || []).forEach(week => {
        if (!week) return;
        
        const weekKey = week.weekNumber.toString();
        
        if (!weeksMap.has(weekKey)) {
          weeksMap.set(weekKey, {
            weekNumber: week.weekNumber,
            startDate: week.startDate,
            endDate: week.endDate,
            _id: week._id,
            employees: []
          });
        }
        
        const existingWeek = weeksMap.get(weekKey);
        
        // Filter out null employees
        const validEmployees = (week.employees || []).filter(emp => emp !== null);
        
        validEmployees.forEach(emp => {
          // Check for duplicates
          const employeeExists = existingWeek.employees.some(
            e => e?.name === emp?.name || 
            (e?.userId && emp?.userId && e.userId.toString() === emp.userId.toString())
          );
          
          if (!employeeExists) {
            existingWeek.employees.push(emp);
          }
        });
      });
      
      const groupedWeeks = Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
      
      // Process weeks with employee data
      const processedWeeks = groupedWeeks.map(week => {
        const processedEmployees = (week.employees || []).map(emp => {
          // Get department from userId if available
          let department = emp?.department;
          if (!department && emp?.userId && emp.userId?.department) {
            department = emp.userId.department;
          }
          
          return {
            _id: emp._id,
            userId: emp.userId?._id || emp.userId,
            name: emp.name || 'Unknown',
            department: department || 'General',
            transport: emp.transport || '',
            cabRoute: emp.cabRoute || '',
            teamLeader: emp.teamLeader || '',
            shiftStartHour: emp.shiftStartHour || 0,
            shiftEndHour: emp.shiftEndHour || 0,
            dailyStatus: (emp.dailyStatus || []).map(ds => ({
              date: ds.date,
              status: ds.status,
              transportArrivalTime: ds.transportArrivalTime,
              transportUpdatedBy: ds.transportUpdatedBy,
              transportUpdatedAt: ds.transportUpdatedAt,
              departmentArrivalTime: ds.departmentArrivalTime,
              departmentUpdatedBy: ds.departmentUpdatedBy,
              departmentUpdatedAt: ds.departmentUpdatedAt
            }))
          };
        });
        
        // Calculate totals
        const totals = {
          totalWO: 0,
          totalL: 0,
          totalP: 0,
          totalH: 0
        };
        
        processedEmployees.forEach(emp => {
          (emp.dailyStatus || []).forEach(ds => {
            if (ds.status === 'WO') totals.totalWO++;
            else if (ds.status === 'L') totals.totalL++;
            else if (ds.status === 'P') totals.totalP++;
            else if (ds.status === 'H') totals.totalH++;
          });
        });
        
        return {
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          _id: week._id,
          employees: processedEmployees,
          employeeCount: processedEmployees.length,
          totals
        };
      });
      
      // Calculate total employees and unique employees
      let totalEmployees = 0;
      const uniqueEmployees = new Set();
      
      processedWeeks.forEach(week => {
        totalEmployees += week.employees.length;
        week.employees.forEach(emp => {
          if (emp?.name) uniqueEmployees.add(emp.name);
        });
      });
      
      return {
        _id: roster._id,
        month: roster.month,
        year: roster.year,
        rosterStartDate: roster.rosterStartDate,
        rosterEndDate: roster.rosterEndDate,
        weeks: processedWeeks,
        totalWeeks: processedWeeks.length,
        totalEmployees,
        uniqueEmployees: uniqueEmployees.size,
        createdBy: roster.createdBy,
        updatedBy: roster.updatedBy,
        createdAt: roster.createdAt,
        updatedAt: roster.updatedAt,
        __v: roster.__v
      };
    });
    
    console.log("✅ Sending response with", formattedRosters.length, "formatted rosters");
    
    return res.status(200).json({
      success: true,
      message: "Rosters retrieved successfully",
      data: formattedRosters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching rosters:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
//by farhan 
export const exportSavedRoster = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        success: false,
        message: "Month and year are required" 
      });
    }

    const roster = await Roster.findOne({ month, year });
    if (!roster) {
      return res.status(404).json({ 
        success: false,
        message: "Roster not found for the specified month and year" 
      });
    }

    if (!roster.weeks || roster.weeks.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No weeks found in the roster" 
      });
    }

    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: `Roster_${month}_${year}`,
      Author: "Task Management CRM",
      CreatedDate: new Date()
    };

    const parseDateUtc = (value) => {
      const raw = String(value || "");
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return new Date(
        Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
      );
    };

    const formatDateWithDay = (date) => {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const day = dayNames[date.getUTCDay()];
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      });
      return `${formattedDate} ${day}`;
    };

    const usedSheetNames = new Set();
    const getUniqueSheetName = (baseName) => {
      const maxLen = 31;
      const trimmedBase = String(baseName || "Sheet").slice(0, maxLen);
      if (!usedSheetNames.has(trimmedBase)) {
        usedSheetNames.add(trimmedBase);
        return trimmedBase;
      }
      let idx = 2;
      while (idx < 1000) {
        const suffix = ` (${idx})`;
        const candidate = `${trimmedBase.slice(0, maxLen - suffix.length)}${suffix}`;
        if (!usedSheetNames.has(candidate)) {
          usedSheetNames.add(candidate);
          return candidate;
        }
        idx += 1;
      }
      const fallback = `${trimmedBase.slice(0, maxLen - 4)}_dup`;
      usedSheetNames.add(fallback);
      return fallback;
    };

    const STATUS_TYPES = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD"];
    const STATUS_NAMES = {
      "P": "Present",
      "WO": "Week Off", 
      "L": "Leave",
      "NCNS": "No Call No Show",
      "UL": "Unpaid Leave",
      "LWP": "Leave Without Pay",
      "BL": "Bereavement Leave",
      "H": "Holiday",
      "LWD": "Last Working Day"
    };

    roster.weeks.forEach((week) => {
      const safeEmployees = (Array.isArray(week?.employees) ? week.employees : []).filter(
        (emp) => emp && typeof emp === "object"
      );
      const sortedEmployees = [...safeEmployees].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""))
      );

      const data = [];
      
      // ✅ DEPARTMENT COLUMN ADD 
      const header = ["Name", "Department", "Transport", "CAB Route", "Team Leader", "Shift Start Hour", "Shift End Hour"];
      
      const dayCount = sortedEmployees[0]?.dailyStatus?.length || 0;
      for (let i = 0; i < dayCount; i++) {
        const startUtc = parseDateUtc(week.startDate);
        if (!startUtc) {
          header.push("");
          continue;
        }
        const date = new Date(startUtc);
        date.setUTCDate(startUtc.getUTCDate() + i);
        header.push(formatDateWithDay(date));
      }
      
      STATUS_TYPES.forEach(status => {
        header.push(`Total ${STATUS_NAMES[status] || status}`);
      });
      
      data.push(header);

      sortedEmployees.forEach((emp) => {
        // ✅ DEPARTMENT VALUE ADD 
        const row = [
          emp.name || "", 
          emp.department || "General", // ADD 
          emp.transport || "", 
          emp.cabRoute || "", 
          emp.teamLeader || "",
          emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
          emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
        ];
        
        const statusCounts = {};
        STATUS_TYPES.forEach(status => statusCounts[status] = 0);
        
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds?.status || "";
            row.push(status);
            
            if (status && STATUS_TYPES.includes(status)) {
              statusCounts[status]++;
            }
          });
        } else {
          for (let i = 0; i < dayCount; i++) row.push("");
        }
        
        STATUS_TYPES.forEach(status => row.push(statusCounts[status]));
        data.push(row);
      });

      if (sortedEmployees.length > 0) {
        const summaryRow = ["", "", "", "", "", "", "Week Summary"];
        for (let i = 0; i < dayCount; i++) summaryRow.push("");
        
        STATUS_TYPES.forEach(status => {
          const totalStatus = sortedEmployees.reduce((sum, emp) => {
            let empCount = 0;
            if (emp.dailyStatus) {
              emp.dailyStatus.forEach(ds => {
                if (ds?.status === status) empCount++;
              });
            }
            return sum + empCount;
          }, 0);
          summaryRow.push(`${STATUS_NAMES[status] || status}: ${totalStatus}`);
        });
        
        data.push(summaryRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      worksheet['!cols'] = [
        { wch: 20 },  // Name
        { wch: 15 },  // ✅ Department
        { wch: 15 },  // Transport
        { wch: 15 },  // CAB Route
        { wch: 15 },  // Team Leader
        { wch: 15 },  // Shift Start
        { wch: 15 },  // Shift End
        ...Array(dayCount).fill({ wch: 12 }),
        ...Array(STATUS_TYPES.length).fill({ wch: 15 })
      ];

      const sheetName = getUniqueSheetName(`Week ${week.weekNumber}`);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=roster_${month}_${year}_export.xlsx`);
    
    res.send(buffer);

  } catch (error) {
    console.error("Error exporting saved roster to Excel:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
// export const exportSavedRoster = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     if (!month || !year) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Month and year are required" 
//       });
//     }

//     const roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       return res.status(404).json({ 
//         success: false,
//         message: "Roster not found for the specified month and year" 
//       });
//     }

//     if (!roster.weeks || roster.weeks.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: "No weeks found in the roster" 
//       });
//     }

//     const workbook = XLSX.utils.book_new();
//     workbook.Props = {
//       Title: `Roster_${month}_${year}`,
//       Author: "Task Management CRM",
//       CreatedDate: new Date()
//     };

//     const formatDateWithDay = (date) => {
//       const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//       const day = dayNames[date.getDay()];
//       const formattedDate = date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: '2-digit' 
//       });
//       return `${formattedDate} ${day}`;
//     };

//     // Define all status types - ADDED LWD
//     const STATUS_TYPES = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD"];
//     const STATUS_NAMES = {
//       "P": "Present",
//       "WO": "Week Off", 
//       "L": "Leave",
//       "NCNS": "No Call No Show",
//       "UL": "Unpaid Leave",
//       "LWP": "Leave Without Pay",
//       "BL": "Bereavement Leave",
//       "H": "Holiday",
//       "LWD": "Last Working Day" // ADDED LWD
//     };

//     roster.weeks.forEach((week) => {
//       const sortedEmployees = [...week.employees].sort((a, b) => 
//         (a.name || '').localeCompare(b.name || '')
//       );

//       const data = [];
      
//       // Header row - ADDED "Team Leader" after "CAB Route"
//       const header = ["Name", "Transport", "CAB Route", "Team Leader", "Shift Start Hour", "Shift End Hour"];
      
//       const dayCount = sortedEmployees[0]?.dailyStatus?.length || 0;
//       for (let i = 0; i < dayCount; i++) {
//         const date = new Date(week.startDate);
//         date.setDate(date.getDate() + i);
//         header.push(formatDateWithDay(date));
//       }
      
//       // Add total columns for each status type
//       STATUS_TYPES.forEach(status => {
//         header.push(`Total ${STATUS_NAMES[status] || status}`);
//       });
      
//       data.push(header);

//       // Process each employee
//       sortedEmployees.forEach((emp) => {
//         const row = [
//           emp.name || "", 
//           emp.transport || "", 
//           emp.cabRoute || "", 
//           emp.teamLeader || "", // ADDED: Team Leader field
//           emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
//           emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
//         ];
        
//         // Initialize counters for all status types
//         const statusCounts = {};
//         STATUS_TYPES.forEach(status => {
//           statusCounts[status] = 0;
//         });
        
//         // Process daily statuses
//         if (emp.dailyStatus && emp.dailyStatus.length > 0) {
//           emp.dailyStatus.forEach((ds) => {
//             const status = ds?.status || "";
//             row.push(status);
            
//             // Count each status type
//             if (status && STATUS_TYPES.includes(status)) {
//               statusCounts[status]++;
//             }
//           });
//         } else {
//           // Add empty cells for days if no daily status
//           for (let i = 0; i < dayCount; i++) {
//             row.push("");
//           }
//         }
        
//         // Add totals for each status type
//         STATUS_TYPES.forEach(status => {
//           row.push(statusCounts[status]);
//         });
        
//         data.push(row);
//       });

//       // Add summary row if there are employees
//       if (sortedEmployees.length > 0) {
//         const summaryRow = ["", "", "", "", "", "Week Summary"];
        
//         // Empty cells for days
//         for (let i = 0; i < dayCount; i++) {
//           summaryRow.push("");
//         }
        
//         // Calculate totals for each status type across all employees
//         STATUS_TYPES.forEach(status => {
//           const totalStatus = sortedEmployees.reduce((sum, emp) => {
//             let empCount = 0;
//             if (emp.dailyStatus) {
//               emp.dailyStatus.forEach(ds => {
//                 if (ds?.status === status) empCount++;
//               });
//             }
//             return sum + empCount;
//           }, 0);
          
//           summaryRow.push(`${STATUS_NAMES[status] || status}: ${totalStatus}`);
//         });
        
//         data.push(summaryRow);
//       }

//       const worksheet = XLSX.utils.aoa_to_sheet(data);
      
//       const range = XLSX.utils.decode_range(worksheet['!ref']);
      
//       // Style header row
//       for (let C = range.s.c; C <= range.e.c; ++C) {
//         const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
//         if (!worksheet[cellAddress]) continue;
        
//         let bgColor = "4472C4";  // Blue for main headers
//         if (C >= range.e.c - STATUS_TYPES.length) {  // Orange for total columns
//           bgColor = "FF9900";  
//         }
        
//         worksheet[cellAddress].s = {
//           font: { bold: true, color: { rgb: "FFFFFF" } },
//           fill: { fgColor: { rgb: bgColor } },
//           alignment: { horizontal: "center", vertical: "center" },
//           border: {
//             top: { style: "thin", color: { rgb: "000000" } },
//             bottom: { style: "thin", color: { rgb: "000000" } },
//             left: { style: "thin", color: { rgb: "000000" } },
//             right: { style: "thin", color: { rgb: "000000" } }
//           }
//         };
//       }

//       // Style data rows
//       for (let R = 1; R <= range.e.r; ++R) {
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//           if (!worksheet[cellAddress]) continue;
          
//           const cellStyle = {
//             alignment: { horizontal: "center", vertical: "center" },
//             border: {
//               top: { style: "thin", color: { rgb: "D9D9D9" } },
//               bottom: { style: "thin", color: { rgb: "D9D9D9" } },
//               left: { style: "thin", color: { rgb: "D9D9D9" } },
//               right: { style: "thin", color: { rgb: "D9D9D9" } }
//             }
//           };
          
//           const isSummaryRow = (R === range.e.r);
//           const isEmployeeRow = !isSummaryRow;
          
//           if (isEmployeeRow) {
//             // UPDATED: Changed from 5 to 6 because we added Team Leader column
//             if (C >= 6 && C < range.e.c - STATUS_TYPES.length) {  // Daily status cells
//               const status = worksheet[cellAddress].v;
//               // Apply color coding based on status
//               switch(status) {
//                 case "P":
//                   cellStyle.fill = { fgColor: { rgb: "C6EFCE" } };  // Green
//                   break;
//                 case "WO":
//                   cellStyle.fill = { fgColor: { rgb: "FFC7CE" } };  // Red
//                   break;
//                 case "L":
//                   cellStyle.fill = { fgColor: { rgb: "FFEB9C" } };  // Yellow
//                   break;
//                 case "NCNS":
//                   cellStyle.fill = { fgColor: { rgb: "FF9999" } };  // Dark red
//                   break;
//                 case "UL":
//                   cellStyle.fill = { fgColor: { rgb: "FFCC99" } };  // Orange
//                   break;
//                 case "LWP":
//                   cellStyle.fill = { fgColor: { rgb: "FFFF99" } };  // Light yellow
//                   break;
//                 case "BL":
//                   cellStyle.fill = { fgColor: { rgb: "CCCCFF" } };  // Lavender
//                   break;
//                 case "H":
//                   cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  // Light blue
//                   break;
//                 case "LWD": // ADDED LWD color coding
//                   cellStyle.fill = { fgColor: { rgb: "E6B8B7" } };  // Light red/pink
//                   break;
//                 default:
//                   cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  // White
//               }
//             } else if (C >= range.e.c - STATUS_TYPES.length) {  // Total columns
//               cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  // Light orange
//               cellStyle.font = { bold: true };
//             }
//           } else if (isSummaryRow) {
//             cellStyle.font = { bold: true };
//             cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray for summary
            
//             if (C >= range.e.c - STATUS_TYPES.length) {
//               cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue for status totals
//             }
//           }
          
//           worksheet[cellAddress].s = cellStyle;
//         }
//       }

//       // Set column widths - UPDATED: Added Team Leader column
//       worksheet['!cols'] = [
//         { wch: 20 },  // Name
//         { wch: 15 },  // Transport
//         { wch: 15 },  // CAB Route
//         { wch: 15 },  // Team Leader
//         { wch: 15 },  // Shift Start Hour
//         { wch: 15 },  // Shift End Hour
//         ...Array(dayCount).fill({ wch: 12 }),  // Daily status columns
//         ...Array(STATUS_TYPES.length).fill({ wch: 15 })  // Total columns
//       ];

//       XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${week.weekNumber}`);
//     });

//     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename=roster_${month}_${year}_export.xlsx`);
    
//     res.send(buffer);

//   } catch (error) {
//     console.error("Error exporting saved roster to Excel:", error);
//     res.status(500).json({ 
//       success: false,
//       message: "Server error", 
//       error: error.message 
//     });
//   }
// };
export const createRosterForDateRange = async (req, res) => {
  try {
    const {
      month,
      year,
      startDate,
      endDate,
      sourceWeekNumber,  
      newEmployees = [],  
      modifyExisting = [],  
      preserveDailyStatus = false,  
      rosterStartDate,  
      rosterEndDate  
    } = req.body;

    const createdBy = req.user._id;
    if (!month || !year || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: month, year, startDate, endDate"
      });
    }
    const finalRosterStartDate = rosterStartDate || startDate;
    const finalRosterEndDate = rosterEndDate || endDate;
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    const rangeStartDate = new Date(rangeStart);
    const rangeEndDate = new Date(rangeEnd);
    if (rangeStartDate >= rangeEndDate) {
      return res.status(400).json({
        success: false,
        message: "startDate must be before endDate"
      });
    }
    const maxDays = 90;  
    const daysDifference = Math.ceil((rangeEndDate - rangeStartDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > maxDays) {
      return res.status(400).json({
        success: false,
        message: `Date range cannot exceed ${maxDays} days. Please create multiple rosters.`
      });
    }
    let roster = await Roster.findOne({ month, year });
    let sourceEmployees = [];
    let actualSourceWeekNumber = sourceWeekNumber;

    if (roster && roster.weeks.length > 0) {
      if (sourceWeekNumber) {
        const sourceWeek = roster.weeks.find(w => w.weekNumber === sourceWeekNumber);
        if (sourceWeek) {
          sourceEmployees = sourceWeek.employees;
          console.log(`Using employees from specified week ${sourceWeekNumber}`);
        } else {
          return res.status(404).json({
            success: false,
            message: `Source week ${sourceWeekNumber} not found in roster`
          });
        }
      } else {
        const latestWeek = roster.weeks.reduce((latest, current) =>
          current.weekNumber > latest.weekNumber ? current : latest
        );
        sourceEmployees = latestWeek.employees;
        actualSourceWeekNumber = latestWeek.weekNumber;
        console.log(`Using employees from latest week ${latestWeek.weekNumber}`);
      }
    }
    if (sourceEmployees.length === 0 && newEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No source employees found and no new employees provided. Cannot create empty roster."
      });
    }
    const weeksToCreate = calculateWeeksInRange(rangeStartDate, rangeEndDate);
    let nextWeekNumber = 1;
    if (roster && roster.weeks.length > 0) {
      nextWeekNumber = Math.max(...roster.weeks.map(w => w.weekNumber)) + 1;
    }
    const weeksData = [];
    for (let i = 0; i < weeksToCreate.length; i++) {
      const week = weeksToCreate[i];
      const weekNumber = nextWeekNumber + i;
      let weekEmployees = sourceEmployees.map(emp => ({
        userId: emp.userId,
        name: emp.name,
        transport: emp.transport || "",
        cabRoute: emp.cabRoute || "",
        shiftStartHour: emp.shiftStartHour,
        shiftEndHour: emp.shiftEndHour,
        dailyStatus: preserveDailyStatus 
          ? cloneDailyStatus(emp.dailyStatus, week.startDate, week.endDate)
          : generateDefaultDailyStatus(week.startDate, week.endDate)
      }));
      if (newEmployees.length > 0) {
        const additionalEmployees = await processNewEmployeesForWeek(
          newEmployees,
          week.startDate,
          week.endDate,
          preserveDailyStatus
        );
        weekEmployees = [...weekEmployees, ...additionalEmployees];
      }
      if (modifyExisting.length > 0) {
        weekEmployees = applyEmployeeModificationsForWeek(weekEmployees, modifyExisting);
      }
      weekEmployees.forEach(emp => {
        const woCount = emp.dailyStatus.filter(d => d.status === "WO").length;
        if (woCount > 2) {
          throw new Error(`Employee ${emp.name} cannot have more than 2 week-offs in a week`);
        }
      });
      weeksData.push({
        weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        employees: weekEmployees
      });
    }
    if (!roster) {
      roster = new Roster({
        month,
        year,
        rosterStartDate: new Date(finalRosterStartDate),
        rosterEndDate: new Date(finalRosterEndDate),
        weeks: weeksData,
        createdBy,
      });
    } else {
      const overlappingWeeks = roster.weeks.filter(existingWeek => 
        isDateRangeOverlapping(
          existingWeek.startDate, 
          existingWeek.endDate, 
          rangeStartDate, 
          rangeEndDate
        )
      );
      if (overlappingWeeks.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Date range overlaps with existing weeks. Please choose a non-overlapping range.",
          overlappingWeeks: overlappingWeeks.map(w => ({
            weekNumber: w.weekNumber,
            startDate: w.startDate,
            endDate: w.endDate
          }))
        });
      }
      roster.weeks.push(...weeksData);
      roster.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
      const currentStart = new Date(roster.rosterStartDate);
      const currentEnd = new Date(roster.rosterEndDate);
      if (rangeStartDate < currentStart) {
        roster.rosterStartDate = rangeStartDate;
      }
      if (rangeEndDate > currentEnd) {
        roster.rosterEndDate = rangeEndDate;
      }
      roster.updatedBy = createdBy;
    }
    await roster.save();
    const responseData = {
      success: true,
      message: `Created ${weeksData.length} week(s) successfully`,
      data: {
        weeksCreated: weeksData.length,
        totalWeeks: roster.weeks.length,
        sourceWeek: actualSourceWeekNumber || 'N/A',
        employeeCount: sourceEmployees.length,
        newEmployeesAdded: newEmployees.length,
        dateRange: {
          start: rangeStartDate,
          end: rangeEndDate
        },
        rosterInfo: {
          month,
          year,
          rosterId: roster._id,
          rosterStartDate: roster.rosterStartDate,
          rosterEndDate: roster.rosterEndDate
        }
      }
    };
    console.log(`Created ${weeksData.length} week(s) for ${month}/${year}`);
    return res.status(201).json(responseData);
  } catch (error) {
    console.error("Error creating roster for date range:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create roster for date range"
    });
  }
};
export const copyEmployeesToWeek = async (req, res) => {
  try {
    const {
      rosterId,
      sourceWeekNumber,
      targetWeekNumbers,  
      excludeEmployees = [],  
      resetStatus = false  
    } = req.body;

    const userId = req.user._id;

    if (!rosterId || !sourceWeekNumber || !targetWeekNumbers) {
      return res.status(400).json({
        success: false,
        message: "rosterId, sourceWeekNumber, and targetWeekNumbers are required"
      });
    }
    const targetWeeks = Array.isArray(targetWeekNumbers) 
      ? targetWeekNumbers 
      : [targetWeekNumbers];

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }
    const sourceWeek = roster.weeks.find(w => w.weekNumber === sourceWeekNumber);
    if (!sourceWeek) {
      return res.status(404).json({
        success: false,
        message: `Source week ${sourceWeekNumber} not found`
      });
    }
    let employeesToCopy = sourceWeek.employees;
    if (excludeEmployees.length > 0) {
      employeesToCopy = employeesToCopy.filter(emp => 
        !excludeEmployees.includes(emp.name) && 
        !excludeEmployees.includes(emp.userId?.toString())
      );
    }
    const results = [];
    for (const targetWeekNumber of targetWeeks) {
      const targetWeekIndex = roster.weeks.findIndex(w => w.weekNumber === targetWeekNumber);
      if (targetWeekIndex === -1) {
        results.push({
          weekNumber: targetWeekNumber,
          success: false,
          message: `Week ${targetWeekNumber} not found`
        });
        continue;
      }

      const targetWeek = roster.weeks[targetWeekIndex];
      const clonedEmployees = employeesToCopy.map(sourceEmp => {
        const existingEmployee = targetWeek.employees.find(emp => 
          emp.name === sourceEmp.name || 
          (emp.userId && sourceEmp.userId && emp.userId.toString() === sourceEmp.userId.toString())
        );
        if (existingEmployee) {
          return {
            ...existingEmployee.toObject(),
            transport: sourceEmp.transport,
            cabRoute: sourceEmp.cabRoute,
            shiftStartHour: sourceEmp.shiftStartHour,
            shiftEndHour: sourceEmp.shiftEndHour,
            dailyStatus: resetStatus 
              ? generateDefaultDailyStatus(targetWeek.startDate, targetWeek.endDate)
              : cloneDailyStatus(sourceEmp.dailyStatus, targetWeek.startDate, targetWeek.endDate)
          };
        } else {
          return {
            userId: sourceEmp.userId,
            name: sourceEmp.name,
            transport: sourceEmp.transport || "",
            cabRoute: sourceEmp.cabRoute || "",
            shiftStartHour: sourceEmp.shiftStartHour,
            shiftEndHour: sourceEmp.shiftEndHour,
            dailyStatus: resetStatus
              ? generateDefaultDailyStatus(targetWeek.startDate, targetWeek.endDate)
              : cloneDailyStatus(sourceEmp.dailyStatus, targetWeek.startDate, targetWeek.endDate)
          };
        }
      });
      roster.weeks[targetWeekIndex].employees = clonedEmployees;
      results.push({
        weekNumber: targetWeekNumber,
        success: true,
        employeesCopied: clonedEmployees.length,
        message: `Copied ${clonedEmployees.length} employees from week ${sourceWeekNumber}`
      });
    }
    roster.updatedBy = userId;
    await roster.save();
    return res.status(200).json({
      success: true,
      message: "Employees copied successfully",
      results,
      rosterInfo: {
        rosterId: roster._id,
        month: roster.month,
        year: roster.year,
        updatedBy: req.user.username
      }
    });
  } catch (error) {
    console.error("Error copying employees:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to copy employees"
    });
  }
};
export const bulkUpdateWeeks = async (req, res) => {
  try {
    const {
      rosterId,
      weekNumbers,
      updateType,
      employees = [],
      employeeNames = [],
    } = req.body;

    const user = req.user;

    if (!rosterId || !weekNumbers || !updateType) {
      return res.status(400).json({
        success: false,
        message: "rosterId, weekNumbers, and updateType are required",
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found",
      });
    }

    // -------------------- DATE PERMISSION CHECK --------------------
    const rosterStartDate = new Date(roster.rosterStartDate);
    const rosterEndDate = new Date(roster.rosterEndDate);

    rosterStartDate.setHours(0, 0, 0, 0);
    rosterEndDate.setHours(23, 59, 59, 999);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    let rosterStatus = "";
    let canEdit = false;

    if (currentDate < rosterStartDate) {
      rosterStatus = "future";
      canEdit = true;
    } else if (
      currentDate >= rosterStartDate &&
      currentDate <= rosterEndDate
    ) {
      rosterStatus = "active";
      canEdit =
        user.accountType === "HR" ||
        user.accountType === "superAdmin";
    } else {
      rosterStatus = "past";
      canEdit =
        user.accountType === "HR" ||
        user.accountType === "superAdmin";
    }

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message:
          rosterStatus === "active"
            ? "Only HR and Super Admin can edit active rosters"
            : "Only HR and Super Admin can edit past rosters",
        rosterStatus,
      });
    }

    // -------------------- BULK UPDATE --------------------
    const results = [];

    for (const weekNumber of weekNumbers) {
      const week = roster.weeks.find(
        (w) => w.weekNumber === weekNumber
      );

      if (!week) {
        results.push({
          weekNumber,
          success: false,
          message: `Week ${weekNumber} not found`,
        });
        continue;
      }

      switch (updateType) {

        // ================== ADD ==================
        case "add":
          const addedEmployees = await addEmployeesToWeek(
            employees,
            week.startDate,
            week.endDate
          );

          addedEmployees.forEach((emp) => {
            const exists = week.employees.some(
              (e) => e.userId?.toString() === emp.userId?.toString()
            );
            if (!exists) {
              week.employees.push(emp);

              roster.editHistory.push({
                editedBy: user._id,
                editedByName: user.username,
                accountType: user.accountType,
                actionType: "add",
                weekNumber,
                employeeId: emp._id,
                employeeName: emp.name,
                changes: [{ field: "employee", oldValue: null, newValue: "Added" }]
              });
            }
          });

          results.push({
            weekNumber,
            success: true,
            employeesAdded: addedEmployees.length,
          });
          break;

        // ================== REMOVE ==================
        case "remove":
          week.employees = week.employees.filter(emp => {
            if (employeeNames.includes(emp.name)) {

              roster.editHistory.push({
                editedBy: user._id,
                editedByName: user.username,
                accountType: user.accountType,
                actionType: "delete",
                weekNumber,
                employeeId: emp._id,
                employeeName: emp.name,
                changes: [{ field: "employee", oldValue: "Present", newValue: "Removed" }]
              });

              return false;
            }
            return true;
          });

          results.push({
            weekNumber,
            success: true,
            employeesRemoved: employeeNames.length,
          });
          break;

        // ================== UPDATE (🔥 EDIT HISTORY FIXED) ==================
        case "update":

          employees.forEach(empUpdate => {

            const employee = week.employees.id(empUpdate._id);
            if (!employee) return;

            const changes = [];

            Object.keys(empUpdate).forEach(field => {

              // Deep compare for objects/arrays like dailyStatus
              const oldValue = employee[field];
              const newValue = empUpdate[field];

              const isDifferent =
                JSON.stringify(oldValue) !== JSON.stringify(newValue);

              if (isDifferent) {
                changes.push({
                  field,
                  oldValue,
                  newValue
                });

                employee[field] = newValue;
              }
            });

            if (changes.length > 0) {
              roster.editHistory.push({
                editedBy: user._id,
                editedByName: user.username,
                accountType: user.accountType,
                actionType: "bulk-update",
                weekNumber,
                employeeId: employee._id,
                employeeName: employee.name,
                changes
              });
            }

          });

          results.push({
            weekNumber,
            success: true,
            employeesUpdated: employees.length,
          });

          break;

        // ================== RESET ==================
        case "reset":
          week.employees.forEach(emp => {
            emp.dailyStatus.forEach(day => {
              day.status = "Working";
            });

            roster.editHistory.push({
              editedBy: user._id,
              editedByName: user.username,
              accountType: user.accountType,
              actionType: "reset",
              weekNumber,
              employeeId: emp._id,
              employeeName: emp.name,
              changes: [{ field: "dailyStatus", oldValue: "Custom", newValue: "Reset to Working" }]
            });
          });

          results.push({
            weekNumber,
            success: true,
            employeesReset: week.employees.length,
          });
          break;

        default:
          results.push({
            weekNumber,
            success: false,
            message: `Unknown update type: ${updateType}`,
          });
      }
    }

    roster.updatedBy = user._id;
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Bulk update completed",
      rosterStatus,
      results,
      summary: {
        totalWeeksUpdated: results.filter((r) => r.success).length,
        totalWeeksFailed: results.filter((r) => !r.success).length,
      },
    });

  } catch (error) {
    console.error("Error in bulk update:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to perform bulk update",
    });
  }
};
const calculateWeeksInRange = (startDate, endDate) => {
  const weeks = [];
  let currentStart = new Date(startDate);
  
  while (currentStart <= endDate) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);  
    
    if (currentEnd > endDate) {
      currentEnd = new Date(endDate);
    }
    
    weeks.push({
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd)
    });
    
    currentStart.setDate(currentStart.getDate() + 7);
  }
  
  return weeks;
};
const generateDefaultDailyStatus = (startDate, endDate) => {
  const dailyStatus = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dailyStatus.push({
      date: new Date(current),
      status: "P" 
    });
    current.setDate(current.getDate() + 1);
  }
  
  return dailyStatus;
};
const cloneDailyStatus = (sourceStatuses, newStartDate, newEndDate) => {
  if (!sourceStatuses || sourceStatuses.length === 0) {
    return generateDefaultDailyStatus(newStartDate, newEndDate);
  }

  const daysInWeek = Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24)) + 1;
  const clonedStatuses = [];

  for (let i = 0; i < daysInWeek; i++) {
    const date = new Date(newStartDate);
    date.setDate(date.getDate() + i);
    const sourceStatus = sourceStatuses[i % sourceStatuses.length];
    clonedStatuses.push({
      date,
      status: sourceStatus ? sourceStatus.status : "P"
    });
  }

  return clonedStatuses;
};
const processNewEmployeesForWeek = async (employees, startDate, endDate, preserveStatus = false) => {
  const processed = await Promise.all(
    employees.map(async (emp) => {
      let user = null;
      if (emp.name) {
        user = await User.findOne({ username: emp.name });
      }
      if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
        throw new Error(`Employee ${emp.name} must have both shift start and end hours`);
      }

      const shiftStartHour = parseInt(emp.shiftStartHour) || 0;
      const shiftEndHour = parseInt(emp.shiftEndHour) || 0;

      if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
        throw new Error(`Employee ${emp.name}: Shift hours must be between 0 and 23`);
      }

      return {
        userId: user?._id || null,
        name: emp.name,
        transport: emp.transport || "",
        cabRoute: emp.cabRoute || "",
        shiftStartHour,
        shiftEndHour,
        dailyStatus: preserveStatus && emp.dailyStatus
          ? cloneDailyStatus(emp.dailyStatus, startDate, endDate)
          : generateDefaultDailyStatus(startDate, endDate)
      };
    })
  );

  return processed;
};
const applyEmployeeModificationsForWeek = (employees, modifications) => {
  return employees.map(emp => {
    const modification = modifications.find(m => 
      m.name === emp.name || 
      (m.userId && emp.userId && m.userId === emp.userId.toString())
    );
    
    if (modification) {
      return {
        ...emp,
        ...modification,
        dailyStatus: modification.dailyStatus || emp.dailyStatus
      };
    }
    return emp;
  });
};
const isDateRangeOverlapping = (start1, end1, start2, end2) => {
  const startDate1 = new Date(start1);
  const endDate1 = new Date(end1);
  const startDate2 = new Date(start2);
  const endDate2 = new Date(end2);
  
  return startDate1 <= endDate2 && endDate1 >= startDate2;
};
const addEmployeesToWeek = async (employees, startDate, endDate) => {
  return processNewEmployeesForWeek(employees, startDate, endDate, false);
};
const removeEmployeesFromWeek = (week, employeeNames) => {
  const initialCount = week.employees.length;
  week.employees = week.employees.filter(emp => 
    !employeeNames.includes(emp.name)
  );
  return initialCount - week.employees.length;
};
const updateEmployeesInWeek = (week, employeeUpdates) => {
  let updateCount = 0;
  
  employeeUpdates.forEach(update => {
    const employee = week.employees.find(emp => 
      emp.name === update.name || 
      emp._id.toString() === update.employeeId
    );
    
    if (employee) {
      Object.keys(update).forEach(key => {
        if (key !== 'name' && key !== 'employeeId') {
          employee[key] = update[key];
        }
      });
      updateCount++;
    }
  });
  
  return updateCount;
};
const resetWeekStatuses = (week) => {
  week.employees.forEach(emp => {
    emp.dailyStatus = generateDefaultDailyStatus(week.startDate, week.endDate);
  });
  return week.employees.length;
};
//by farhan
export const getRosterForBulkEdit = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const user = req.user;  
    const userAccountType = user.accountType;  
    const currentDate = new Date();
    
    if (!rosterId) {
      return res.status(400).json({
        success: false,
        message: "rosterId is required"
      });
    }
    if (!['superAdmin', 'HR'].includes(userAccountType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin and HR can edit rosters",
        userAccountType: userAccountType
      });
    }
    
    const roster = await Roster.findById(rosterId)
      .populate('createdBy', 'username email accountType department')
      .populate('updatedBy', 'username email accountType department')
      .populate('weeks.employees.userId', 'username email department');
      
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }
    
    // Group weeks by weekNumber and merge employees
    const weeksMap = new Map();
    
    roster.weeks.forEach(week => {
      const weekKey = week.weekNumber.toString();
      
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, {
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          employees: []
        });
      }
      
      const existingWeek = weeksMap.get(weekKey);
      
      // FIX 1: Filter out null employees before processing
      const validEmployees = week.employees.filter(emp => emp !== null);
      
      validEmployees.forEach(emp => {
        const empUserId = String(emp?.userId?._id || emp?.userId || "").trim();
        const empId = String(emp?._id || "").trim();

        const employeeExists = existingWeek.employees.some((e) => {
          const existingUserId = String(e?.userId?._id || e?.userId || "").trim();
          const existingEmpId = String(e?._id || "").trim();

          if (empUserId && existingUserId) return existingUserId === empUserId;
          if (empId && existingEmpId) return existingEmpId === empId;
          return false;
        });

        if (!employeeExists) {
          existingWeek.employees.push(emp);
        }
      });
    });
    
    const groupedWeeks = Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
    
    const departmentsSet = new Set();
    
    const weeksWithEditability = groupedWeeks.map(week => {
      const weekEndDate = new Date(week.endDate);
      const weekStartDate = new Date(week.startDate);
      let isEditable = false;
      let canAddEmployees = false;
      let editRestrictionReason = '';
      let requiresSuperAdmin = false;
      const hasWeekEnded = weekEndDate < currentDate;
      const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;
      const isUpcomingWeek = weekStartDate > currentDate;
      
	      if (userAccountType === 'superAdmin' || userAccountType === 'HR') {
	        isEditable = true;
	        canAddEmployees = true;  
	        requiresSuperAdmin = false;
	      }
      
      // FIX 2: Filter out null employees again and safely process
      const validWeekEmployees = (week.employees || []).filter(emp => emp !== null);
      
	      const processedEmployees = validWeekEmployees.map(emp => {
        // FIX 3: Safe navigation with optional chaining
        let department = emp?.department;
        
        if (!department && emp?.userId && emp.userId?.department) {
          department = emp.userId.department;
        }
        
        if (!department) {
          department = 'General';
        }
        
        departmentsSet.add(department);
        
	        return {
	          _id: emp?._id,
	          userId: emp?.userId?._id || emp?.userId,
	          name: emp?.name || 'Unknown',
	          department: department,
	          transport: emp?.transport || '',
	          cabRoute: emp?.cabRoute || '',
	          teamLeader: emp?.teamLeader || "",
	          shiftStartHour: emp?.shiftStartHour || 0,
	          shiftEndHour: emp?.shiftEndHour || 0,
	          // FIX 4: Safely map dailyStatus
	          dailyStatus: (emp?.dailyStatus || []).map(ds => {
	            const derivedStatus =
	              ds?.status ||
	              ds?.departmentStatus ||
	              ds?.transportStatus ||
	              "P";
	
	            return {
	              date: ds?.date,
	              // Backward-compatible field for existing UI (Bulk Edit uses `status`)
	              status: derivedStatus,
	              // Explicit fields in the current schema
	              departmentStatus: ds?.departmentStatus || "",
	              transportStatus: ds?.transportStatus || "",
	            };
	          })
	        };
	      });
      
      const employeesByDepartment = processedEmployees.reduce((acc, emp) => {
        const dept = emp.department || 'General';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(emp);
        return acc;
      }, {});
      
      return {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        isEditable: isEditable,
        canAddEmployees: canAddEmployees,
        requiresSuperAdmin: requiresSuperAdmin,
        editRestrictionReason: editRestrictionReason,
        timelineStatus: hasWeekEnded ? 'past' : (isCurrentWeek ? 'current' : 'upcoming'),
        employeeCount: processedEmployees.length,
        employees: processedEmployees,
        employeesByDepartment: employeesByDepartment
      };
    });

    // Format response for bulk editing
    const formattedResponse = {
      success: true,
      data: {
        _id: roster._id,
        month: roster.month,
        year: roster.year,
        rosterStartDate: roster.rosterStartDate,
        rosterEndDate: roster.rosterEndDate,
        createdBy: roster.createdBy,
        updatedBy: roster.updatedBy,
        weeks: weeksWithEditability,
        editHistory: roster.editHistory || [], 
        summary: {
          totalWeeks: weeksWithEditability.length,
          totalEmployees: weeksWithEditability.reduce((sum, week) => sum + week.employees.length, 0),
          departments: Array.from(departmentsSet).sort(),
          dateRange: {
            start: roster.rosterStartDate,
            end: roster.rosterEndDate
          }
        },
        userPermissions: {
          accountType: userAccountType,
	          canEditAllWeeks: userAccountType === 'superAdmin' || userAccountType === 'HR',
	          canAddEmployeesToPastWeeks: userAccountType === 'superAdmin' || userAccountType === 'HR',
          restrictedWeeks: weeksWithEditability.filter(w => !w.isEditable).length
        }
      }
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    console.error("Error fetching roster for bulk edit:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roster for bulk editing"
    });
  }
};
// export const getRosterForBulkEdit = async (req, res) => {
//   try {
//     const { rosterId } = req.params;
//     const user = req.user;  
//     const userAccountType = user.accountType;  
//     const currentDate = new Date();
    
//     if (!rosterId) {
//       return res.status(400).json({
//         success: false,
//         message: "rosterId is required"
//       });
//     }
//     if (!['superAdmin', 'HR'].includes(userAccountType)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Only Super Admin and HR can edit rosters",
//         userAccountType: userAccountType
//       });
//     }
//     const roster = await Roster.findById(rosterId);
//     if (!roster) {
//       return res.status(404).json({
//         success: false,
//         message: "Roster not found"
//       });
//     }
//     roster.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
//     const weeksWithEditability = roster.weeks.map(week => {
//       const weekEndDate = new Date(week.endDate);
//       const weekStartDate = new Date(week.startDate);
//       let isEditable = false;
//       let canAddEmployees = false;
//       let editRestrictionReason = '';
//       let requiresSuperAdmin = false;
//       const hasWeekEnded = weekEndDate < currentDate;
//       const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;
//       const isUpcomingWeek = weekStartDate > currentDate;
      
//       if (userAccountType === 'superAdmin') {
//         isEditable = true;
//         canAddEmployees = true;  
//         requiresSuperAdmin = hasWeekEnded;
//       } else if (userAccountType === 'HR') {
//         if (hasWeekEnded) {
//           isEditable = false;
//           canAddEmployees = false;
//           requiresSuperAdmin = true;
//           editRestrictionReason = 'Week has ended. Only Super Admin can edit past weeks.';
//         } else if (isCurrentWeek || isUpcomingWeek) {
//           isEditable = true;
//           canAddEmployees = true;  
//           requiresSuperAdmin = false;
//         }
//       }
      
//       return {
//         weekNumber: week.weekNumber,
//         startDate: week.startDate,
//         endDate: week.endDate,
//         isEditable: isEditable,
//         canAddEmployees: canAddEmployees,
//         requiresSuperAdmin: requiresSuperAdmin,
//         editRestrictionReason: editRestrictionReason,
//         timelineStatus: hasWeekEnded ? 'past' : (isCurrentWeek ? 'current' : 'upcoming'),
//         employeeCount: week.employees.length,
//         employees: week.employees.map(emp => ({
//           _id: emp._id,
//           userId: emp.userId,
//           name: emp.name,
//           transport: emp.transport,
//           cabRoute: emp.cabRoute,
//           teamLeader: emp.teamLeader || "",
//           shiftStartHour: emp.shiftStartHour,
//           shiftEndHour: emp.shiftEndHour,
//           dailyStatus: emp.dailyStatus.map(status => ({
//             date: status.date,
//             status: status.status
//           }))
//         }))
//       };
//     });

//     // Format response for bulk editing
//     const formattedResponse = {
//       success: true,
//       data: {
//         _id: roster._id,
//         month: roster.month,
//         year: roster.year,
//         rosterStartDate: roster.rosterStartDate,
//         rosterEndDate: roster.rosterEndDate,
//         createdBy: roster.createdBy,
//         updatedBy: roster.updatedBy,
//         weeks: weeksWithEditability,
//         editHistory: roster.editHistory || [],
//         summary: {
//           totalWeeks: roster.weeks.length,
//           totalEmployees: roster.weeks.reduce((sum, week) => sum + week.employees.length, 0),
//           dateRange: {
//             start: roster.rosterStartDate,
//             end: roster.rosterEndDate
//           }
//         },
//         userPermissions: {
//           accountType: userAccountType,
//           canEditAllWeeks: userAccountType === 'superAdmin',
//           canAddEmployeesToPastWeeks: userAccountType === 'superAdmin',
//           restrictedWeeks: weeksWithEditability.filter(w => !w.isEditable).length
//         }
//       }
//     };

//     return res.status(200).json(formattedResponse);

//   } catch (error) {
//     console.error("Error fetching roster for bulk edit:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch roster for bulk editing"
//     });
//   }
// };


export const bulkUpdateRosterWeeks = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const { weeks } = req.body;
    const user = req.user;

    if (!["superAdmin", "HR"].includes(user?.accountType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HR and Super Admin can bulk edit rosters."
      });
    }

    if (!rosterId) {
      return res.status(400).json({ success: false, message: "rosterId required" });
    }
    if (!Array.isArray(weeks)) {
      return res.status(400).json({ success: false, message: "weeks must be an array" });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const toDateKey = (value) => {
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    const dateKeysInRange = (startDate, endDate) => {
      const keys = [];
      const current = new Date(startDate);
      const end = new Date(endDate);

      if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return keys;

      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        keys.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }

      return keys;
    };

    for (const updatedWeek of weeks) {
      if (!updatedWeek || updatedWeek.weekNumber === undefined) continue;

      // IMPORTANT: The DB can contain multiple week subdocs with the same weekNumber.
      // Bulk edit UI groups them by weekNumber, so we must locate the correct week by employeeId.
      const candidateWeeks = (roster.weeks || []).filter(
        (w) => w && w.weekNumber === updatedWeek.weekNumber
      );
      if (candidateWeeks.length === 0) continue;

      const updatedEmployees = Array.isArray(updatedWeek.employees)
        ? updatedWeek.employees
        : [];

      for (const empUpdate of updatedEmployees) {
        const employeeId = empUpdate?._id || empUpdate?.employeeId;
        if (!employeeId) continue;

        let matchedWeek = null;
        let employee = null;

        for (const week of candidateWeeks) {
          const found = week.employees?.id(employeeId);
          if (found) {
            matchedWeek = week;
            employee = found;
            break;
          }
        }
        if (!employee) continue;

        const changes = [];

        // Compare normal fields
        [
          "name",
          "department",
          "transport",
          "cabRoute",
          "teamLeader",
          "shiftStartHour",
          "shiftEndHour",
          "userId",
        ].forEach((field) => {
          if (empUpdate[field] !== undefined && employee[field] !== empUpdate[field]) {
            changes.push({
              field,
              oldValue: employee[field],
              newValue: empUpdate[field],
            });
            employee[field] = empUpdate[field];
          }
        });

        // Compare dailyStatus (persist to current schema fields)
        if (Array.isArray(empUpdate.dailyStatus)) {
          // Business rule: max 2 WOs per week per employee
          const incomingByDateKey = new Map();
          empUpdate.dailyStatus.forEach((d) => {
            const dateKey = toDateKey(d?.date);
            if (!dateKey) return;
            const incomingStatus = d?.departmentStatus || d?.transportStatus || d?.status;
            if (incomingStatus === undefined) return;
            incomingByDateKey.set(dateKey, incomingStatus);
          });

          const weekDateKeys = dateKeysInRange(matchedWeek.startDate, matchedWeek.endDate);
          const woCount = weekDateKeys.reduce((count, dateKey) => {
            const incomingStatus = incomingByDateKey.get(dateKey);
            if (incomingStatus !== undefined) return count + (incomingStatus === "WO" ? 1 : 0);

            const existingDaily = (employee.dailyStatus || []).find((d) => toDateKey(d?.date) === dateKey);
            const existingStatus =
              existingDaily?.status ||
              existingDaily?.departmentStatus ||
              existingDaily?.transportStatus ||
              "P";
            return count + (existingStatus === "WO" ? 1 : 0);
          }, 0);

          if (woCount > 2) {
            return res.status(400).json({
              success: false,
              message: `Employee ${employee.name} cannot have more than 2 week-offs (WO) in week ${matchedWeek.weekNumber}`,
            });
          }

          empUpdate.dailyStatus.forEach((newDay) => {
            const dateKey = toDateKey(newDay?.date);
            if (!dateKey) return;

            let daily = (employee.dailyStatus || []).find((d) => toDateKey(d?.date) === dateKey);
            if (!daily) {
              employee.dailyStatus = employee.dailyStatus || [];
              employee.dailyStatus.push({ date: new Date(newDay.date) });
              daily = employee.dailyStatus[employee.dailyStatus.length - 1];
            }

            // Bulk roster edit should only affect roster daily `status`.
            // It must not overwrite attendance statuses (`departmentStatus`/`transportStatus`)
            // unless those fields are explicitly part of an attendance API.
            const incomingStatus = newDay?.status;
            if (incomingStatus === undefined) return;

            const previousStatus = daily?.status || "";

            if (previousStatus !== incomingStatus) {
              changes.push({
                field: `dailyStatus (${dateKey})`,
                oldValue: previousStatus || null,
                newValue: incomingStatus,
              });

              daily.status = incomingStatus;
            }
          });

          employee.markModified("dailyStatus");
        }

        // Push history if changes exist
        if (changes.length > 0) {
          roster.editHistory.push({
            editedBy: user._id,
            editedByName: user.username,
            accountType: user.accountType,
            actionType: "bulk-update",
            weekNumber: matchedWeek.weekNumber,
            employeeId: employee._id,
            employeeName: employee.name,
            changes,
          });
        }
      }
    }

    roster.updatedBy = user._id;
    roster.markModified("weeks");
    roster.markModified("editHistory");

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Bulk update successful",
      roster
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getOpsMetaCurrentWeekRoster = async (req, res) => {
  try {
    const user = req.user;
    const roleType = getRoleType(user || {});
    const normalizedDepartment = normalizeDepartment(user?.department);
    const allowedTeamLeaderDepartments = ["Operations", "Marketing", "Customer Service", "Developer", "Ticketing", "SEO"];
    const canAccessCurrentWeekRoster =
      (roleType === "agent" || roleType === "supervisor") &&
      allowedTeamLeaderDepartments.includes(normalizedDepartment);

    if (!canAccessCurrentWeekRoster) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Operations, Marketing, Customer Service, Developer, Ticketing, or SEO employees can access this."
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const candidateRosters = await Roster.find({
      rosterStartDate: { $lte: dayEnd },
      rosterEndDate: { $gte: currentDate },
    }).sort({ rosterStartDate: -1, rosterEndDate: -1 });

    if (!candidateRosters.length) {
      return res.status(404).json({
        success: false,
        message: "No roster found for current date",
      });
    }

    let selectedRoster = null;
    let selectedWeek = null;
    for (const roster of candidateRosters) {
      const matchedWeek = (roster.weeks || []).find((week) => {
        if (!week) return false;
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(week.endDate);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);
        return currentDate >= weekStart && currentDate <= weekEnd;
      });
      if (matchedWeek) {
        selectedRoster = roster;
        selectedWeek = matchedWeek;
        break;
      }
    }

    if (!selectedRoster || !selectedWeek) {
      return res.status(404).json({
        success: false,
        message: "No roster week found for current date",
      });
    }

    const currentWeekGroup = (selectedRoster.weeks || []).filter((week) => {
      if (!week) return false;
      if (Number.parseInt(week.weekNumber, 10) !== Number.parseInt(selectedWeek.weekNumber, 10)) {
        return false;
      }
      const weekStart = new Date(week.startDate);
      const weekEnd = new Date(week.endDate);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      return currentDate >= weekStart && currentDate <= weekEnd;
    });

    // Check edit permission
    const weekStartDate = new Date(
      Math.min(...currentWeekGroup.map((w) => new Date(w.startDate).getTime()))
    );
    const weekEndDate = new Date(
      Math.max(...currentWeekGroup.map((w) => new Date(w.endDate).getTime()))
    );
    
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    
    let canEdit = false;
    let editMessage = "";
    
    if (currentDate < weekStartDate) {
      canEdit = false;
      editMessage = "Cannot edit roster before the week starts";
    } else if (currentDate > weekEndDate) {
      canEdit = false;
      editMessage = "Cannot edit roster after the week has ended";
    } else {
      canEdit = true;
      editMessage = "Can edit roster for your team during current week";
    }

    // ========== FIXED: Filter employees with proper null checks ==========
    const currentUserUsername = user.username; // e.g., "Sam"
    
    // Filter employees where teamLeader matches current user's username
    // AND employee is not null
    const currentWeekEmployees = currentWeekGroup.flatMap((w) => (w.employees || []).filter(Boolean));
    const uniqueEmployees = [];
    const seenEmployeeIds = new Set();
    for (const emp of currentWeekEmployees) {
      const key = String(emp?._id || "");
      if (!key || seenEmployeeIds.has(key)) continue;
      seenEmployeeIds.add(key);
      uniqueEmployees.push(emp);
    }

    const teamEmployees = uniqueEmployees.filter(emp => {
        // FIX 1: Check if employee exists
        if (!emp) return false;
        
        // FIX 2: Check if teamLeader exists and is a string
        if (!emp.teamLeader || typeof emp.teamLeader !== 'string') return false;
        
        // FIX 3: Compare exactly (case-sensitive as per your data)
        // Your data shows "Sam" not "sam"
        return emp.teamLeader === currentUserUsername;
      });

    console.log(`Team Leader ${currentUserUsername}: Found ${teamEmployees.length} employees`);

    // If no employees found for this team leader
    if (teamEmployees.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No employees assigned to you (${currentUserUsername}) as Team Leader`,
        data: {
          weekNumber: selectedWeek.weekNumber,
          startDate: weekStartDate,
          endDate: weekEndDate,
          currentDate: currentDate,
          canEdit: canEdit,
          editMessage: editMessage,
          rosterEntries: [],
          summary: {
            totalEmployees: 0,
            teamLeader: currentUserUsername,
            currentUser: user.username,
            userDepartment: user.department,
            teamSize: 0,
            message: "You have no team members assigned"
          }
        }
      });
    }

    // Get user details for filtered employees only
    const teamUserIds = teamEmployees
      .filter(emp => emp.userId) // Filter out null userIds
      .map(emp => emp.userId);
    
    const teamUsers = teamUserIds.length > 0 
      ? await User.find({ _id: { $in: teamUserIds } })
          .select('_id username name department accountType')
      : [];

    // Format roster entries with user details (with null checks)
    const formattedRoster = teamEmployees.map(emp => {
      const userDetails = teamUsers.find(u => 
        u && u._id && emp.userId && u._id.toString() === emp.userId.toString()
      );
      
      return {
        _id: emp._id,
        userId: emp.userId,
        name: emp.name || 'Unknown',
        username: userDetails?.username || '',
        department: userDetails?.department || emp.department || 'Unknown',
        accountType: userDetails?.accountType || 'employee',
        transport: emp.transport || "",
        cabRoute: emp.cabRoute || "",
        teamLeader: emp.teamLeader || "",
        shiftStartHour: emp.shiftStartHour || 0,
        shiftEndHour: emp.shiftEndHour || 0,
        dailyStatus: (emp.dailyStatus || []).map(status => ({
          date: status.date,
          status: status.status || "P"
        }))
      };
    });

    // Get unique departments in the team
    const teamDepartments = [...new Set(formattedRoster.map(e => e.department).filter(Boolean))];

    return res.status(200).json({
      success: true,
      message: `Current week roster for your team (Team Leader: ${currentUserUsername})`,
      data: {
        weekNumber: selectedWeek.weekNumber,
        startDate: weekStartDate,
        endDate: weekEndDate,
        currentDate: currentDate,
        canEdit: canEdit,
        editMessage: editMessage,
        rosterEntries: formattedRoster,
        summary: {
          totalEmployees: formattedRoster.length,
          teamLeader: currentUserUsername,
          departments: teamDepartments,
          currentUser: user.username,
          userDepartment: user.department,
          teamSize: formattedRoster.length,
          hasTeam: formattedRoster.length > 0
        }
      }
    });

  } catch (error) {
    console.error("Error fetching roster:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack
    });
  }
};

export const updateOpsMetaRoster = async (req, res) => {
  try {
    const { employeeId, updates } = req.body;
    const user = req.user;
    const accountType = String(user?.accountType || "").toLowerCase();
    const canBypassDateRestriction = accountType === "superadmin" || accountType === "hr";
    const toIstDateKey = (value) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      return year && month && day ? `${year}-${month}-${day}` : null;
    };

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const candidateRosters = await Roster.find({
      rosterStartDate: { $lte: dayEnd },
      rosterEndDate: { $gte: currentDate },
    }).sort({ rosterStartDate: -1, rosterEndDate: -1 });

    if (!candidateRosters.length) {
      return res.status(404).json({ success: false, message: "Roster not found for current date" });
    }

    let roster = null;
    let week = null;
    let employee = null;

    for (const candidate of candidateRosters) {
      const matchingWeeks = (candidate.weeks || []).filter((w) => {
        if (!w) return false;
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return currentDate >= start && currentDate <= end;
      });

      for (const w of matchingWeeks) {
        const foundEmployee = w.employees?.id(employeeId);
        if (foundEmployee) {
          roster = candidate;
          week = w;
          employee = foundEmployee;
          break;
        }
      }
      if (employee) break;
    }

    if (!week) {
      return res.status(404).json({ success: false, message: "Current week not found" });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    if (accountType === "employee") {
      if (String(employee.department || "") !== String(user.department || "")) {
        return res.status(403).json({
          success: false,
          message: "Employees can update only their own department roster."
        });
      }

      if (!canBypassDateRestriction && Array.isArray(updates?.dailyStatus)) {
        const todayKey = toIstDateKey(new Date());
        const existingStatusByDate = new Map(
          (employee.dailyStatus || [])
            .map((d) => {
              const dateKey = toIstDateKey(d?.date);
              if (!dateKey) return null;
              const status = d?.status || "P";
              return [dateKey, status];
            })
            .filter(Boolean)
        );

        for (const day of updates.dailyStatus) {
          const dateKey = toIstDateKey(day?.date);
          if (!dateKey || !todayKey) continue;
          if (dateKey < todayKey) {
            const existingStatus = existingStatusByDate.get(dateKey) || "P";
            const incomingStatus = day?.status || "P";
            if (incomingStatus !== existingStatus) {
              return res.status(403).json({
                success: false,
                message: "Past dates in the current week cannot be edited."
              });
            }
          }
        }
      }
    }

    const changes = [];

    Object.keys(updates).forEach(field => {

      if (field === "dailyStatus") {
        updates.dailyStatus.forEach((newDay, index) => {
          const oldDay = employee.dailyStatus[index];
          if (oldDay && oldDay.status !== newDay.status) {
            changes.push({
              field: `dailyStatus (${newDay.date})`,
              oldValue: oldDay.status,
              newValue: newDay.status
            });
            employee.dailyStatus[index].status = newDay.status;
          }
        });

      } else {
        if (employee[field] !== updates[field]) {
          changes.push({
            field,
            oldValue: employee[field],
            newValue: updates[field]
          });
          employee[field] = updates[field];
        }
      }

    });

    if (changes.length > 0) {
      roster.editHistory.push({
        editedBy: user._id,
        editedByName: user.username,
        accountType: user.accountType,
        actionType: "update",
        weekNumber: week.weekNumber,
        employeeId: employee._id,
        employeeName: employee.name,
        changes
      });
    }

    roster.updatedBy = user._id;
    roster.markModified("weeks");
    roster.markModified("editHistory");

    // Guard against legacy rows with missing shift hours to avoid full-document save failure.
    const normalizeHour = (value, fallback = 0) => {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) return fallback;
      return parsed;
    };
    const employeeDefaultStart = normalizeHour(employee.shiftStartHour, 0);
    const employeeDefaultEnd = normalizeHour(employee.shiftEndHour, 0);
    (roster.weeks || []).forEach((rosterWeek) => {
      (rosterWeek.employees || []).forEach((emp) => {
        const rawStart = emp?.shiftStartHour;
        const rawEnd = emp?.shiftEndHour;
        const missingStart = rawStart === undefined || rawStart === null || rawStart === "" || Number.isNaN(Number.parseInt(rawStart, 10));
        const missingEnd = rawEnd === undefined || rawEnd === null || rawEnd === "" || Number.isNaN(Number.parseInt(rawEnd, 10));
        if (missingStart) emp.shiftStartHour = employeeDefaultStart;
        if (missingEnd) emp.shiftEndHour = employeeDefaultEnd;
      });
    });

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Roster updated successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//by farhan
export const rosterUploadFromExcel = async (req, res) => {
  try {
	    const user = req.user;
	    const accountType = String(user?.accountType || "").trim().toLowerCase();
	    const roleType = getRoleType(user || {});
	    const normalizedDepartment = normalizeDepartment(user?.department);
	    const isSuperAdmin = roleType === "superAdmin";
	    const isHR = accountType === "hr";
	    const isAdmin = accountType === "admin";
	    const allowedEmployeeDepartments = ["Operations", "Marketing", "Customer Service", "Developer", "Ticketing", "SEO"];
	    const isAllowedDepartmentEmployee =
	      (roleType === "agent" || roleType === "supervisor") &&
	      allowedEmployeeDepartments.includes(normalizedDepartment);
	    const isHrOrSuperAdmin = isSuperAdmin || isHR;
	    
	    if (!isSuperAdmin && !isHR && !isAdmin && !isAllowedDepartmentEmployee) {
	      return res.status(403).json({
	        success: false,
	        message: "Access denied. Only superAdmin, admin, HR, or Operations/Marketing/Customer Service/Developer/Ticketing/SEO employees can upload roster."
	      });
	    }
    
	    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Date range is required. Please select start date and end date."
      });
    }
    
      const parseDateOnlyToUtcNoon = (value) => {
        const raw = String(value || "").trim();
        const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return new Date(NaN);
        const y = Number.parseInt(m[1], 10);
        const mo = Number.parseInt(m[2], 10);
        const d = Number.parseInt(m[3], 10);
        if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return new Date(NaN);
        return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
      };

	    const selectedStartDate = parseDateOnlyToUtcNoon(startDate);
	    const selectedEndDate = parseDateOnlyToUtcNoon(endDate);
	    selectedStartDate.setUTCHours(0, 0, 0, 0);
	    selectedEndDate.setUTCHours(0, 0, 0, 0);
    
    if (isNaN(selectedStartDate.getTime()) || isNaN(selectedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }
    
	    if (selectedStartDate > selectedEndDate) {
	      return res.status(400).json({
	        success: false,
	        message: "Start date cannot be after end date."
	      });
	    }

      const toDateKey = (value) => {
        const d = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      const normalizeText = (value) => String(value || "").trim().toLowerCase();
      const buildEmployeeKey = (emp) => {
        const rawUserId = String(emp?.userId || "").trim();
        if (rawUserId && rawUserId !== "null" && rawUserId !== "undefined") {
          return `uid:${rawUserId}`;
        }
        return `name:${normalizeText(emp?.name)}|dept:${normalizeText(emp?.department)}`;
      };
      const upsertEmployees = (existingEmployees = [], incomingEmployees = []) => {
        const merged = [];
        const keyIndexMap = new Map();
        let unknownCounter = 0;

        const addOrUpdate = (employee, preferExistingId = false) => {
          if (!employee) return;
          const key = buildEmployeeKey(employee) || `__unknown__${unknownCounter++}`;
          const existingIndex = keyIndexMap.get(key);

          if (existingIndex === undefined) {
            keyIndexMap.set(key, merged.length);
            merged.push(employee);
            return;
          }

          const existingRow = merged[existingIndex];
          const nextRow = {
            ...(existingRow?.toObject ? existingRow.toObject() : existingRow),
            ...(employee?.toObject ? employee.toObject() : employee),
          };

          if (preferExistingId && existingRow?._id && !employee?._id) {
            nextRow._id = existingRow._id;
          }
          if ((!employee?.userId || String(employee.userId).trim() === "") && existingRow?.userId) {
            nextRow.userId = existingRow.userId;
          }

          merged[existingIndex] = nextRow;
        };

        (existingEmployees || []).forEach((emp) => addOrUpdate(emp, false));
        (incomingEmployees || []).forEach((emp) => addOrUpdate(emp, true));
        return merged.filter(Boolean);
      };
    
    const totalDays = Math.round((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (!isSuperAdmin && totalDays !== 7) {
      return res.status(400).json({
        success: false,
        message: "Date range must be exactly 7 days for roster upload."
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
	    // DATE VALIDATION BASED ON USER ROLE
	    if (isAllowedDepartmentEmployee) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
	      if (selectedStartDate < tomorrow) {
	        return res.status(400).json({
	          success: false,
		          message: "Operations, Marketing, Customer Service, Developer, Ticketing, and SEO employees can only upload roster for future weeks starting from tomorrow. Cannot upload for today or past dates."
	        });
	      }
	    } 
	    else if (isAdmin) {
	      if (selectedStartDate < today) {
	        return res.status(400).json({
	          success: false,
	          message: "Admin can only upload roster for today or future dates. Cannot upload for past dates."
	        });
	      }
	    }
	    else if (isHrOrSuperAdmin) {
	      console.log(`Admin ${user.username} uploading roster for date range: ${startDate} to ${endDate}`);
	    }
    
	    const {
	      month: rosterMonth,
	      year: rosterYear,
	      anchorDateForWeekNumber,
	    } = getRosterMonthMetaFromRange(selectedStartDate, selectedEndDate);
    
    // ✅ Excel file check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required"
      });
    }
    
    // ✅ Excel parsing
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Check if first row is info text, then use second row as headers
    let headerRowIndex = 0;
    let dataStartRowIndex = 1;
    
    if (excelData[0] && excelData[0][0] && excelData[0][0].toString().includes('IMPORTANT')) {
      headerRowIndex = 1;
      dataStartRowIndex = 2;
    }
    
    const headers = excelData[headerRowIndex];
    const dataRows = excelData.slice(dataStartRowIndex);
    
    // Clean headers
    const cleanHeaders = headers.map(header => {
      if (!header) return '';
      return header.toString().replace(/^\uFEFF/, '').trim();
    });
    
	    // Convert to array of objects
	    const formattedData = dataRows.map(row => {
	      const obj = {};
	      cleanHeaders.forEach((header, index) => {
	        if (header) {
	          // Preserve valid falsy values like 0 (important for shiftStartHour = 0).
	          obj[header] = row[index] ?? '';
	        }
	      });
	      return obj;
	    }).filter(row => row.Name && row.Name.toString().trim() !== '');
    
    if (!formattedData || formattedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or has no data"
      });
    }
    
    // Column mapping
    const columnMap = {};
    const availableColumns = Object.keys(formattedData[0]);
    
    availableColumns.forEach(col => {
      const colLower = col.toLowerCase().trim();
      if (colLower === 'name') columnMap['Name'] = col;
      else if (colLower === 'department') columnMap['Department'] = col;
      else if (colLower === 'transport') columnMap['Transport'] = col;
      else if (colLower === 'team leader') columnMap['Team Leader'] = col;
      else if (colLower === 'shift start hour') columnMap['Shift Start Hour'] = col;
      else if (colLower === 'shift end hour') columnMap['Shift End Hour'] = col;
      else if (colLower === 'cab route') columnMap['CAB Route'] = col;
    });
    
    // Check required columns
    const requiredColumns = ['Name', 'Department', 'Transport', 'Team Leader', 'Shift Start Hour', 'Shift End Hour'];
    const missingColumns = requiredColumns.filter(col => !columnMap[col]);
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }
    
    // Identify date columns
    const excelDateColumns = [];
    const datePattern = /^\d{1,2}\/\d{1,2}/;
    
    for (const col of availableColumns) {
      if (datePattern.test(col)) {
        excelDateColumns.push(col);
      }
    }
    
    const expectedDateColumns = isSuperAdmin ? totalDays : 7;
    if (excelDateColumns.length !== expectedDateColumns) {
      return res.status(400).json({
        success: false,
        message: isSuperAdmin
          ? `Excel date columns must match selected date range (${totalDays} days). Found: ${excelDateColumns.length}`
          : `Excel must have exactly 7 date columns. Found: ${excelDateColumns.length}`
      });
    }
    
    // Process employees data
    const employeesData = [];
    const processedEmployees = new Set();
    const errors = [];
    
    for (const [index, row] of formattedData.entries()) {
      try {
        const name = (row[columnMap['Name']] || "").toString().trim();
        if (!name) continue;
        
        const department = (row[columnMap['Department']] || "").toString().trim();
        if (!department) {
          errors.push(`Row ${index + dataStartRowIndex + 1}: Department is required`);
          continue;
        }
        
        const username = name.toLowerCase().replace(/\s+/g, '.');
        const employeeKey = `${username}-${startDate}-${endDate}`;
        
        if (processedEmployees.has(employeeKey)) continue;
        processedEmployees.add(employeeKey);
        
        // Transport validation
        const transportValue = (row[columnMap['Transport']] || "").toString().trim();
        const transportUpper = transportValue.toUpperCase();
        const normalizedTransport = transportUpper === "YES" ? "Yes" : transportUpper === "NO" ? "No" : "";
        
        const cabRouteValue = row[columnMap['CAB Route']] || "";
        const teamLeader = (row[columnMap['Team Leader']] || "").toString().trim();
        
        // Daily status
	        const dailyStatus = [];
          const statusSeed = parseDateOnlyToUtcNoon(startDate);
	        
	        for (let i = 0; i < excelDateColumns.length; i++) {
          const rawStatus = (row[excelDateColumns[i]] || "P").toString().trim();
          const status = rawStatus.toUpperCase();
          
          const validStatus = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""];
          if (!validStatus.includes(status)) {
            errors.push(`Row ${index + dataStartRowIndex + 1}: Invalid status "${rawStatus}"`);
            continue;
          }
          
            const statusDate = new Date(statusSeed);
            statusDate.setUTCDate(statusDate.getUTCDate() + i);

	          dailyStatus.push({
	            date: statusDate,
	            status: status || "P"
	          });
	        }
        
        if (errors.length > 0) continue;
        
        // Week-off count:
        // - Non-superadmin: keep strict 7-day rule (max 2 WO)
        // - Superadmin: validate max 2 WO per 7-day block for long ranges
        if (!isSuperAdmin) {
          const woCount = dailyStatus.filter(d => d.status === "WO").length;
          if (woCount > 2) {
            errors.push(`Row ${index + dataStartRowIndex + 1}: Cannot have more than 2 week-offs`);
            continue;
          }
        } else {
          for (let startIdx = 0; startIdx < dailyStatus.length; startIdx += 7) {
            const chunk = dailyStatus.slice(startIdx, startIdx + 7);
            const chunkWoCount = chunk.filter(d => d.status === "WO").length;
            if (chunkWoCount > 2) {
              errors.push(`Row ${index + dataStartRowIndex + 1}: Cannot have more than 2 week-offs in any 7-day block`);
              break;
            }
          }
          if (errors.length > 0) continue;
        }
        
	        // Shift hours
	        const parseShiftHour = (raw) => {
	          if (raw === null || raw === undefined) return NaN;
	          if (typeof raw === "string") {
	            const trimmed = raw.trim();
	            if (!trimmed) return NaN;
	            const hm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/);
	            if (hm) return Number(hm[1]);

	            // Try numeric strings like "0.5" (Excel time serial fraction of a day)
	            const num = Number(trimmed);
	            if (Number.isFinite(num)) raw = num;
	            else return NaN;
	          }

	          if (typeof raw === "number") {
	            if (!Number.isFinite(raw)) return NaN;

	            // Excel may encode time-of-day as fraction of a day (0..1)
	            if (raw >= 0 && raw < 1) {
	              const hours = Math.floor(raw * 24 + 1e-9);
	              return hours;
	            }

	            // Otherwise treat as hour number
	            return Math.trunc(raw);
	          }

	          if (raw instanceof Date) {
	            // Interpret Date as local clock hour (timezone not meaningful for shift hours)
	            return raw.getHours();
	          }

	          return NaN;
	        };

	        const shiftStartHour = parseShiftHour(row[columnMap['Shift Start Hour']]);
	        const shiftEndHour = parseShiftHour(row[columnMap['Shift End Hour']]);
	        
	        if (!Number.isFinite(shiftStartHour) || !Number.isFinite(shiftEndHour)) {
	          errors.push(`Row ${index + dataStartRowIndex + 1}: Invalid shift hours`);
	          continue;
	        }

	        if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
	          errors.push(`Row ${index + dataStartRowIndex + 1}: Shift hours must be between 0 and 23`);
	          continue;
	        }
        
        employeesData.push({
          userId: null,
          name: name,
          department: department,
          username: username,
          transport: normalizedTransport,
          cabRoute: cabRouteValue,
          shiftStartHour: shiftStartHour,
          shiftEndHour: shiftEndHour,
          dailyStatus: dailyStatus,
          teamLeader: teamLeader
        });
      } catch (rowError) {
        errors.push(`Row ${index + dataStartRowIndex + 1}: ${rowError.message}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors found",
        errors: errors.slice(0, 10)
      });
    }
    
    if (employeesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid employee data found"
      });
    }
    
    //  Get unique departments from Excel
    const departments = [...new Set(employeesData.map(emp => emp.department))];
    
    //  Department-wise overlap check
    const overlappingWeeksByDept = [];
    
    for (const dept of departments) {
      const existingRosterWithOverlap = await Roster.findOne({
        month: rosterMonth,
        year: rosterYear,
        'weeks.employees': {
          $elemMatch: { department: dept }
        },
        'weeks': {
          $elemMatch: {
            $or: [
              { 
                startDate: { $lte: selectedEndDate },
                endDate: { $gte: selectedStartDate }
              }
            ]
          }
        }
      });

      if (existingRosterWithOverlap) {
        const overlappingWeeks = existingRosterWithOverlap.weeks.filter(w => {
          if (!w) return false;
          const wStart = new Date(w.startDate);
          const wEnd = new Date(w.endDate);
          const hasDepartment = (w.employees || []).some(emp => emp && emp.department === dept);
          
          return hasDepartment && (wStart <= selectedEndDate && wEnd >= selectedStartDate);
        });

        if (overlappingWeeks.length > 0) {
          overlappingWeeksByDept.push({
            department: dept,
            weeks: overlappingWeeks
          });
        }
      }
    }

		    if (overlappingWeeksByDept.length > 0) {
		      // HR/SuperAdmin can re-upload an existing week for the exact same date range.
		      if (isHrOrSuperAdmin) {
		        const startKey = toDateKey(selectedStartDate);
		        const endKey = toDateKey(selectedEndDate);

		        const existingRoster = await Roster.findOne({ month: rosterMonth, year: rosterYear });
		        if (existingRoster) {
		          const matchedWeekIndexes = (existingRoster.weeks || [])
                .map((w, idx) => ({ w, idx }))
                .filter(({ w }) => {
		            if (!w) return false;
		            return toDateKey(w.startDate) === startKey && toDateKey(w.endDate) === endKey;
		          })
                .map(({ idx }) => idx);

		          if (matchedWeekIndexes.length > 0) {
                const primaryIndex = matchedWeekIndexes[0];
                const existingEmployees = matchedWeekIndexes.flatMap((weekIdx) =>
                  ((existingRoster.weeks?.[weekIdx]?.employees || []).filter((emp) => emp !== null))
                );

		            // Employee-wise upsert: same employee gets latest uploaded row, never duplicated.
		            existingRoster.weeks[primaryIndex].employees = upsertEmployees(existingEmployees, employeesData);
                for (let i = matchedWeekIndexes.length - 1; i >= 1; i -= 1) {
                  existingRoster.weeks.splice(matchedWeekIndexes[i], 1);
                }
		            existingRoster.updatedBy = user._id;
		            existingRoster.markModified("weeks");
		            await existingRoster.save();

		            return res.status(200).json({
		              success: true,
		              message: `Roster updated successfully for ${startDate} to ${endDate}`,
		              data: {
		                summary: {
		                  totalEmployees: existingRoster.weeks[primaryIndex].employees.length,
		                  weekNumber: existingRoster.weeks[primaryIndex].weekNumber,
		                  month: rosterMonth,
		                  year: rosterYear,
		                  departments: departments,
	                  uploadedBy: {
	                    username: user.username,
	                    accountType: user.accountType,
	                    department: user.department
	                  }
	                }
	              }
	            });
	          }
	        }
	      }

	      const allOverlappingEndDates = overlappingWeeksByDept.flatMap(d => 
	        d.weeks.map(w => new Date(w.endDate))
	      );
      const latestEndDate = new Date(Math.max(...allOverlappingEndDates));
      
      const nextWeekStartDate = new Date(latestEndDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 1);
      const nextWeekEndDate = new Date(nextWeekStartDate);
      nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);

      return res.status(400).json({
        success: false,
        message: `❌ Date range must be the same as your previous roster`,
        suggestion: `✅ Next available week: ${nextWeekStartDate.toISOString().split('T')[0]} to ${nextWeekEndDate.toISOString().split('T')[0]}`,
        overlappingDepartments: overlappingWeeksByDept
      });
    }
    
    //  Save to database
    let roster = await Roster.findOne({ 
      month: rosterMonth, 
      year: rosterYear 
    });
    
    if (!roster) {
      roster = new Roster({
        month: rosterMonth,
        year: rosterYear,
        rosterStartDate: selectedStartDate,
        rosterEndDate: selectedEndDate,
        weeks: [],
        createdBy: user._id,
      });
    } else {
      roster.updatedBy = user._id;
    }
    
		    const firstDayOfTargetMonth = new Date(
		      Date.UTC(rosterYear, rosterMonth - 1, 1, 12, 0, 0, 0)
		    );
		    const anchorDayOfMonth = anchorDateForWeekNumber.getUTCDate();
		    const weekNumber = Math.max(
		      1,
		      Math.ceil((firstDayOfTargetMonth.getUTCDay() + anchorDayOfMonth) / 7)
		    );

      const startKey = toDateKey(selectedStartDate);
      const endKey = toDateKey(selectedEndDate);
      const matchedWeekIndexes = (roster.weeks || [])
        .map((w, idx) => ({ w, idx }))
        .filter(({ w }) => {
          if (!w) return false;
          return toDateKey(w.startDate) === startKey && toDateKey(w.endDate) === endKey;
        })
        .map(({ idx }) => idx);

      if (matchedWeekIndexes.length > 0) {
        const primaryIndex = matchedWeekIndexes[0];
        const existingEmployees = matchedWeekIndexes.flatMap((weekIdx) =>
          ((roster.weeks?.[weekIdx]?.employees || []).filter((emp) => emp !== null))
        );
        roster.weeks[primaryIndex].employees = upsertEmployees(existingEmployees, employeesData);
        roster.weeks[primaryIndex].weekNumber = Number.parseInt(roster.weeks[primaryIndex].weekNumber, 10) || weekNumber;
        roster.weeks[primaryIndex].startDate = selectedStartDate;
        roster.weeks[primaryIndex].endDate = selectedEndDate;
        for (let i = matchedWeekIndexes.length - 1; i >= 1; i -= 1) {
          roster.weeks.splice(matchedWeekIndexes[i], 1);
        }
      } else {
        roster.weeks.push({
          weekNumber: weekNumber,
          startDate: selectedStartDate,
          endDate: selectedEndDate,
          employees: employeesData
        });
      }
	    
	    await roster.save();
    
    return res.status(200).json({
      success: true,
      message: `Roster uploaded successfully for ${startDate} to ${endDate}`,
      data: {
        summary: {
          totalEmployees: employeesData.length,
          weekNumber: weekNumber,
          month: rosterMonth,
          year: rosterYear,
          departments: departments,
          uploadedBy: {
            username: user.username,
            accountType: user.accountType,
            department: user.department
          }
        }
      }
    });
    
  } catch (error) {
    console.error("Error uploading roster from Excel:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload roster from Excel"
    });
  }
};

// export const rosterUploadFromExcel = async (req, res) => {
//   try {
//     const user = req.user;
//     const isSuperAdmin = user.accountType === "superAdmin";
//     const isAdmin = ["admin", "HR"].includes(user.accountType);
//     const allowedEmployeeDepartments = ["Ops - Meta", "Marketing", "CS"];
//     const isAllowedDepartmentEmployee = user.accountType === "employee" && allowedEmployeeDepartments.includes(user.department);
    
//     if (!isSuperAdmin && !isAdmin && !isAllowedDepartmentEmployee) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Only superAdmin, admin, HR, or Ops-Meta/Marketing/CS department employees can upload roster."
//       });
//     }
    
//     const { startDate, endDate } = req.body;
    
//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Date range is required. Please select start date and end date."
//       });
//     }
    
//     const selectedStartDate = new Date(startDate);
//     const selectedEndDate = new Date(endDate);
//     selectedStartDate.setHours(0, 0, 0, 0);
//     selectedEndDate.setHours(0, 0, 0, 0);
    
//     if (isNaN(selectedStartDate.getTime()) || isNaN(selectedEndDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format. Please use YYYY-MM-DD format."
//       });
//     }
    
//     if (selectedStartDate > selectedEndDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Start date cannot be after end date."
//       });
//     }
    
//     const totalDays = Math.round((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
    
//     if (totalDays !== 7) {
//       return res.status(400).json({
//         success: false,
//         message: "Date range must be exactly 7 days for roster upload."
//       });
//     }
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     // DATE VALIDATION BASED ON USER ROLE
//     if (isAllowedDepartmentEmployee) {
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);
      
//       if (selectedStartDate < tomorrow) {
//         return res.status(400).json({
//           success: false,
//           message: "Ops-Meta, Marketing, and CS employees can only upload roster for future weeks starting from tomorrow. Cannot upload for today or past dates."
//         });
//       }
//     } 
//     else if (isAdmin) {
//       if (selectedStartDate < today) {
//         return res.status(400).json({
//           success: false,
//           message: "Admin/HR can only upload roster for today or future dates. Cannot upload for past dates."
//         });
//       }
//     }
//     else if (isSuperAdmin) {
//       console.log(`SuperAdmin ${user.username} uploading roster for date range: ${startDate} to ${endDate}`);
//     }
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Excel file is required"
//       });
//     }
    
//     const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
//     // DEBUGGING: Log raw headers
//     console.log("Raw Excel Headers (first row):", excelData[0]);
    
//     // Check if first row is info text, then use second row as headers
//     let headerRowIndex = 0;
//     let dataStartRowIndex = 1;
    
//     // If first row contains instruction text, headers are in second row
//     if (excelData[0] && excelData[0][0] && excelData[0][0].toString().includes('IMPORTANT')) {
//       headerRowIndex = 1;
//       dataStartRowIndex = 2;
//     }
    
//     const headers = excelData[headerRowIndex];
//     const dataRows = excelData.slice(dataStartRowIndex);
    
//     // Clean headers - remove BOM, trim spaces, normalize
//     const cleanHeaders = headers.map(header => {
//       if (!header) return '';
//       // Remove BOM character if present, trim spaces
//       return header.toString().replace(/^\uFEFF/, '').trim();
//     });
    
//     console.log("Cleaned Headers:", cleanHeaders);
    
//     // Convert to array of objects with cleaned headers
//     const formattedData = dataRows.map(row => {
//       const obj = {};
//       cleanHeaders.forEach((header, index) => {
//         if (header) {
//           obj[header] = row[index] || '';
//         }
//       });
//       return obj;
//     }).filter(row => row.Name && row.Name.toString().trim() !== ''); // Filter out empty rows
    
//     console.log("First formatted row:", formattedData[0]);
    
//     if (!formattedData || formattedData.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Excel file is empty or has no data"
//       });
//     }
    
//     // Define required columns (including date columns which will be validated separately)
//     const baseRequiredColumns = [
//       'Name',
//       'Transport',
//       'Team Leader',
//       'Shift Start Hour',
//       'Shift End Hour'
//     ];

//     // Optional columns that we don't want to block upload if missing
//     const optionalColumns = [
//       'CAB Route',
//       'Total Present',
//       'Total Week Off',
//       'Total Leave',
//       'Total No Call No Show',
//       'Total Unpaid Leave',
//       'Total Leave Without Pay',
//       'Total Bereavement Leave',
//       'Total Holiday',
//       'Total Last Working Day'
//     ];

//     const firstRow = formattedData[0];
//     const availableColumns = Object.keys(firstRow);
//     console.log("Available columns after formatting:", availableColumns);

//     // Case-insensitive column matching for required columns
//     const columnMap = {};
//     const requiredColumnMap = {};
    
//     availableColumns.forEach(col => {
//       const colLower = col.toLowerCase().trim();
      
//       // Map base required columns
//       if (colLower === 'name') {
//         columnMap['Name'] = col;
//         requiredColumnMap['Name'] = col;
//       }
//       else if (colLower === 'transport') {
//         columnMap['Transport'] = col;
//         requiredColumnMap['Transport'] = col;
//       }
//       else if (colLower === 'team leader') {
//         columnMap['Team Leader'] = col;
//         requiredColumnMap['Team Leader'] = col;
//       }
//       else if (colLower === 'shift start hour') {
//         columnMap['Shift Start Hour'] = col;
//         requiredColumnMap['Shift Start Hour'] = col;
//       }
//       else if (colLower === 'shift end hour') {
//         columnMap['Shift End Hour'] = col;
//         requiredColumnMap['Shift End Hour'] = col;
//       }
//       // Map optional columns (but don't add to requiredColumnMap)
//       else if (colLower === 'cab route') {
//         columnMap['CAB Route'] = col;
//       }
//     });

//     // Check for base required columns
//     const missingBaseColumns = baseRequiredColumns.filter(col => !requiredColumnMap[col]);
    
//     if (missingBaseColumns.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Missing required columns in Excel: ${missingBaseColumns.join(', ')}. Found columns: ${availableColumns.join(', ')}. Your Excel should have at least: Name, Transport, Team Leader, Shift Start Hour, Shift End Hour, and 7 date columns (DD/MM)`
//       });
//     }
    
//     // Now identify and validate date columns (these are also required)
//     let excelDateColumns = [];
//     const datePattern = /^\d{1,2}\/\d{1,2}/; // Pattern for DD/MM format
    
//     for (const col of availableColumns) {
//       if (datePattern.test(col)) {
//         excelDateColumns.push(col);
//       }
//     }
    
//     // Date columns are required - must have exactly 7
//     if (excelDateColumns.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: `No date columns found in Excel. Date columns are required. Looking for columns like: 02/03, 02/03 Mon, etc. Found columns: ${availableColumns.join(', ')}`
//       });
//     }
    
//     if (excelDateColumns.length !== 7) {
//       return res.status(400).json({
//         success: false,
//         message: `Excel must have exactly 7 date columns (one for each day of the week). Found: ${excelDateColumns.length} columns: ${excelDateColumns.join(', ')}`
//       });
//     }
    
//     const expectedDateColumns = [];
//     const currentDate = new Date(selectedStartDate);
//     for (let i = 0; i < 7; i++) {
//       const day = String(currentDate.getDate()).padStart(2, '0');
//       const month = String(currentDate.getMonth() + 1).padStart(2, '0');
//       const dateColumn = `${day}/${month}`;
//       expectedDateColumns.push(dateColumn);
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
    
//     const employeesData = [];
//     const processedEmployees = new Set();
//     const errors = [];
    
//     for (const [index, row] of formattedData.entries()) {
//       try {
//         const name = (row[columnMap['Name']] || "").toString().trim();
//         if (!name) {
//           continue;
//         }
        
//         const username = name.toLowerCase().replace(/\s+/g, '.');
//         const employeeKey = `${username}-${startDate}-${endDate}`;
        
//         if (processedEmployees.has(employeeKey)) {
//           console.warn(`Duplicate entry for employee ${name}, skipping`);
//           continue;
//         }
//         processedEmployees.add(employeeKey);
        
//         const rowTeamLeader = (row[columnMap['Team Leader']] || "").toString().trim();
        
//         if (isAllowedDepartmentEmployee && rowTeamLeader && rowTeamLeader.toLowerCase() !== user.username.toLowerCase()) {
//           console.log(`Department employee ${user.username} uploading for team leader: ${rowTeamLeader}`);
//         }
        
//         let userRecord = await User.findOne({ username: username });
//         if (!userRecord) {
//           userRecord = await User.findOne({ 
//             $or: [
//               { name: name },
//               { username: { $regex: new RegExp(`^${name.split(' ')[0].toLowerCase()}`, 'i') } }
//             ]
//           });
//         }
        
//         // TRANSPORT: Case-insensitive validation
//         const transportValue = (row[columnMap['Transport']] || "").toString().trim();
//         const transportUpper = transportValue.toUpperCase();
//         const validTransport = ["YES", "NO", ""];
        
//         if (!validTransport.includes(transportUpper)) {
//           errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid transport value "${transportValue}". Must be "Yes", "No", or empty (case-insensitive).`);
//           continue;
//         }
        
//         // Store the original case value but normalize for display
//         const normalizedTransport = transportUpper === "YES" ? "Yes" : transportUpper === "NO" ? "No" : "";
        
//         // CAB ROUTE: Accept any value (string or number)
//         const cabRouteValue = columnMap['CAB Route'] 
//           ? (row[columnMap['CAB Route']] || "").toString().trim() 
//           : "";
        
//         const dailyStatus = [];
//         const statusDate = new Date(selectedStartDate);
        
//         for (let i = 0; i < excelDateColumns.length; i++) {
//           const excelDateColumn = excelDateColumns[i];
//           const rawStatusValue = (row[excelDateColumn] || "P").toString().trim();
//           const statusValue = rawStatusValue.toUpperCase(); // Convert to uppercase for validation
          
//           // Valid status values (uppercase for comparison)
//           const validStatus = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""];
          
//           if (!validStatus.includes(statusValue)) {
//             errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid status "${rawStatusValue}" on column ${excelDateColumn}. Valid values: P, WO, L, NCNS, UL, LWP, BL, H, LWD, HD (case-insensitive).`);
//             continue;
//           }
          
//           const date = new Date(statusDate);
//           date.setHours(0, 0, 0, 0);
          
//           dailyStatus.push({
//             date: date,
//             status: statusValue || "P", // Store uppercase
//             originalExcelColumn: excelDateColumn
//           });
          
//           statusDate.setDate(statusDate.getDate() + 1);
//         }
        
//         // Check if there were any errors in status processing
//         if (errors.length > 0) {
//           continue;
//         }
        
//         const woCount = dailyStatus.filter(d => d.status === "WO").length;
//         if (woCount > 2) {
//           errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Cannot have more than 2 week-offs (WO) in a week. Found: ${woCount}`);
//           continue;
//         }
        
//         const shiftStartHour = parseInt(row[columnMap['Shift Start Hour']]);
//         const shiftEndHour = parseInt(row[columnMap['Shift End Hour']]);
        
//         if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
//           errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid shift hours. Must be numbers between 0-23.`);
//           continue;
//         }
        
//         if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
//           errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Shift hours must be between 0 and 23.`);
//           continue;
//         }
        
//         employeesData.push({
//           userId: userRecord?._id || null,
//           name: name,
//           username: username,
//           transport: normalizedTransport, // Store normalized value
//           cabRoute: cabRouteValue, // Any value accepted
//           shiftStartHour: shiftStartHour,
//           shiftEndHour: shiftEndHour,
//           dailyStatus: dailyStatus,
//           teamLeader: rowTeamLeader,
//           excelDateMapping: excelDateColumns
//         });
//       } catch (rowError) {
//         console.error(`Error processing row ${index + dataStartRowIndex + 1}:`, rowError);
//         errors.push(`Row ${index + dataStartRowIndex + 1}: ${rowError.message}`);
//       }
//     }
    
//     // If there are any errors, return them all at once
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation errors found in Excel file",
//         errors: errors.slice(0, 10), // Return first 10 errors to avoid huge response
//         totalErrors: errors.length
//       });
//     }
    
//     if (employeesData.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid roster data found in the Excel file."
//       });
//     }
    
//     const rosterMonth = selectedStartDate.getMonth() + 1;
//     const rosterYear = selectedStartDate.getFullYear();
    
//     let roster = await Roster.findOne({ 
//       month: rosterMonth, 
//       year: rosterYear 
//     });
    
//     if (!roster) {
//       roster = new Roster({
//         month: rosterMonth,
//         year: rosterYear,
//         rosterStartDate: selectedStartDate,
//         rosterEndDate: selectedEndDate,
//         weeks: [],
//         createdBy: user._id,
//       });
//     } else {
//       roster.updatedBy = user._id;
//       roster.rosterStartDate = selectedStartDate;
//       roster.rosterEndDate = selectedEndDate;
//     }
    
//     const weekNumber = Math.ceil(selectedStartDate.getDate() / 7);
//     const existingWeekIndex = roster.weeks.findIndex(w => 
//       w.startDate.getTime() === selectedStartDate.getTime() &&
//       w.endDate.getTime() === selectedEndDate.getTime()
//     );
    
//     if (existingWeekIndex !== -1) {
//       roster.weeks[existingWeekIndex] = {
//         weekNumber: weekNumber,
//         startDate: selectedStartDate,
//         endDate: selectedEndDate,
//         employees: employeesData
//       };
//     } else {
//       roster.weeks.push({
//         weekNumber: weekNumber,
//         startDate: selectedStartDate,
//         endDate: selectedEndDate,
//         employees: employeesData
//       });
//     }
    
//     await roster.save();
    
//     let permissionsNote = "";
//     if (isAllowedDepartmentEmployee) {
//       permissionsNote = "Ops-Meta, Marketing, and CS employees: Can upload for any team (future dates from tomorrow only)";
//     } else if (isAdmin) {
//       permissionsNote = "Admin/HR: Can upload for any team (today and future dates only)";
//     } else if (isSuperAdmin) {
//       permissionsNote = "SuperAdmin: Can upload for any team (any date - past, present, future)";
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: `Roster uploaded successfully for ${startDate} to ${endDate}`,
//       data: {
//         selectedDateRange: {
//           startDate: startDate,
//           endDate: endDate,
//           totalDays: totalDays,
//           expectedDates: expectedDateColumns
//         },
//         excelDateMapping: {
//           foundDateColumns: excelDateColumns,
//           mappingNote: `Excel date columns mapped to selected date range: ${startDate} to ${endDate}`,
//           mappingOrder: excelDateColumns.map((col, i) => 
//             `${col} → ${expectedDateColumns[i]} (Day ${i+1})`
//           )
//         },
//         summary: {
//           totalEmployees: employeesData.length,
//           weekNumber: weekNumber,
//           month: rosterMonth,
//           year: rosterYear,
//           uploadedBy: {
//             username: user.username,
//             accountType: user.accountType,
//             department: user.department,
//             permissions: permissionsNote
//           }
//         },
//         excelFormat: {
//           requiredColumns: [...baseRequiredColumns, ...excelDateColumns],
//           optionalColumns: optionalColumns,
//           note: "Username is auto-generated from Name. Date columns (7 days) are required. Total count columns are optional. All text fields are case-insensitive.",
//           transportValues: ['Yes', 'No', ''],
//           statusValues: ['P', 'WO', 'L', 'NCNS', 'UL', 'LWP', 'BL', 'H', 'LWD', "HD", ''],
//           permissionsNote: permissionsNote
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error uploading roster from Excel:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to upload roster from Excel"
//     });
//   }
// };

//by farhan

export const exportRosterTemplate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const parseLocalDate = (value, endOfDay = false) => {
      const raw = String(value || "").trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        return endOfDay
          ? new Date(year, month - 1, day, 23, 59, 59, 999)
          : new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      const parsed = new Date(raw);
      if (endOfDay) parsed.setHours(23, 59, 59, 999);
      else parsed.setHours(0, 0, 0, 0);
      return parsed;
    };

    const fromDate = parseLocalDate(startDate, false);
    const toDate = parseLocalDate(endDate, true);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate"
      });
    }
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before or equal to end date"
      });
    }

    const dateHeaders = [];
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      const day = currentDate.getDate().toString().padStart(2, '0');
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      dateHeaders.push(`${day}/${month} ${weekday}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // ✅ Add Department to required columns
    const baseRequiredColumns = [
      'Name',
      'Department',      //  Department column added
      'Transport',
      'CAB Route',
      'Team Leader',
      'Shift Start Hour',
      'Shift End Hour'
    ];

    const dateColumns = [...dateHeaders];
    const optionalSummaryColumns = [
      'Total Present',
      'Total Week Off',
      'Total Leave',
      'Total No Call No Show',
      'Total Unpaid Leave',
      'Total Leave Without Pay',
      'Total Bereavement Leave',
      'Total Holiday',
      'Total Last Working Day'
    ];

    const headers = [
      ...baseRequiredColumns,
      ...dateColumns,
      ...optionalSummaryColumns
    ];

    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: `Roster_Template_${fromDate.getFullYear()}-${(fromDate.getMonth()+1)}-${fromDate.getDate()}`,
      Author: "Task Management CRM",
      CreatedDate: new Date()
    };

    const data = [headers];

    // Prefill employee details from latest previous roster rows for current TL.
    // Daily status values are mapped into the selected export date columns by order.
    const normalize = (v) => String(v || "").trim().toLowerCase();
    const canPrefillAllEmployees = ["superAdmin", "HR", "admin"].includes(req.user?.accountType);
    const currentTl = String(req.user?.username || "").trim();
    const shouldPrefillByTl = canPrefillAllEmployees || Boolean(currentTl);
    if (shouldPrefillByTl) {
      const previousRosters = await Roster.find({
        rosterEndDate: { $lt: fromDate }
      })
        .sort({ rosterEndDate: -1, rosterStartDate: -1, updatedAt: -1, createdAt: -1 })
        .lean();

      const employeeMap = new Map();
      const normalizeStatus = (entry) =>
        typeof entry === "string"
          ? String(entry || "").trim()
          : String(entry?.status || "").trim();
      const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
      for (const roster of previousRosters) {
        const weeks = Array.isArray(roster?.weeks) ? [...roster.weeks] : [];
        weeks.sort((a, b) => new Date(b?.endDate || 0).getTime() - new Date(a?.endDate || 0).getTime());

        for (const week of weeks) {
          const weekEnd = new Date(week?.endDate);
          if (Number.isNaN(weekEnd.getTime()) || weekEnd >= fromDate) continue;

          const employees = Array.isArray(week?.employees) ? week.employees : [];
          for (const emp of employees) {
            if (!canPrefillAllEmployees && normalize(emp?.teamLeader) !== normalize(currentTl)) continue;

            const key =
              String(emp?.userId || "").trim() ||
              `${normalize(emp?.name)}__${normalize(emp?.department)}__${normalize(emp?.teamLeader)}`;
            if (!key || employeeMap.has(key)) continue;

            const sourceDailyStatus = Array.isArray(emp?.dailyStatus) ? [...emp.dailyStatus] : [];
            sourceDailyStatus.sort((a, b) => {
              const aDate = new Date(a?.date || 0);
              const bDate = new Date(b?.date || 0);
              const aTime = isValidDate(aDate) ? aDate.getTime() : Number.MAX_SAFE_INTEGER;
              const bTime = isValidDate(bDate) ? bDate.getTime() : Number.MAX_SAFE_INTEGER;
              return aTime - bTime;
            });

            const mappedStatuses = Array.from({ length: dateColumns.length }, (_, idx) =>
              normalizeStatus(sourceDailyStatus[idx] || "")
            );

            employeeMap.set(key, [
              emp?.name || "",
              emp?.department || "",
              emp?.transport || "",
              emp?.cabRoute || "",
              emp?.teamLeader || currentTl,
              emp?.shiftStartHour ?? "",
              emp?.shiftEndHour ?? "",
              ...mappedStatuses,
              ...Array(optionalSummaryColumns.length).fill("")
            ]);
          }
        }
      }

      if (employeeMap.size > 0) {
        data.push(...Array.from(employeeMap.values()));
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const columnName = headers[C] || "";
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: columnName };
      }
      
      worksheet[cellAddress].s = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" },
          name: "Arial",
          sz: 11 
        },
        fill: { 
          fgColor: { rgb: "4472C4" }  
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: false
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    //  Update column widths for Department
    const colWidths = [
      { wch: 25 },   // Name
      { wch: 15 },   // Department  
      { wch: 15 },   // Transport
      { wch: 15 },   // CAB Route
      { wch: 15 },   // Team Leader
      { wch: 15 },   // Shift Start Hour
      { wch: 15 },   // Shift End Hour
      ...Array(dateColumns.length).fill({ wch: 12 }),  // Date columns
      ...Array(optionalSummaryColumns.length).fill({ wch: 12 })  // Summary columns
    ];
    
    worksheet['!cols'] = colWidths;

    // Set row height for header
    worksheet['!rows'] = [{ hpt: 25 }, ...Array(Math.max(data.length - 1, 0)).fill({ hpt: 20 })];

    // Append the roster sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster Template');

    const fileName = `Roster_Template_${fromDate.getFullYear()}-${(fromDate.getMonth()+1).toString().padStart(2,'0')}-${fromDate.getDate().toString().padStart(2,'0')}_to_${toDate.getFullYear()}-${(toDate.getMonth()+1).toString().padStart(2,'0')}-${toDate.getDate().toString().padStart(2,'0')}.xlsx`;
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.send(buffer);

  } catch (error) {
    console.error('Export Roster Template Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting roster template',
      error: error.message
    });
  }
};

// export const exportRosterTemplate = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;
    
//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Start date and end date are required"
//       });
//     }

//     const fromDate = new Date(startDate);
//     fromDate.setHours(0, 0, 0, 0);
    
//     const toDate = new Date(endDate);
//     toDate.setHours(23, 59, 59, 999);

//     const dateHeaders = [];
//     const currentDate = new Date(fromDate);
    
//     while (currentDate <= toDate) {
//       const day = currentDate.getDate().toString().padStart(2, '0');
//       const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
//       const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
//       dateHeaders.push(`${day}/${month} ${weekday}`);
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     const baseRequiredColumns = [
//       'Name',
//       'Transport',
//       'CAB Route',
//       'Team Leader',
//       'Shift Start Hour',
//       'Shift End Hour'
//     ];

//     const dateColumns = [...dateHeaders];

//     const optionalSummaryColumns = [
//       'Total Present',
//       'Total Week Off',
//       'Total Leave',
//       'Total No Call No Show',
//       'Total Unpaid Leave',
//       'Total Leave Without Pay',
//       'Total Bereavement Leave',
//       'Total Holiday',
//       'Total Last Working Day'
//     ];

//     const headers = [
//       ...baseRequiredColumns,
//       ...dateColumns,
//       ...optionalSummaryColumns
//     ];

//     const workbook = XLSX.utils.book_new();
//     workbook.Props = {
//       Title: `Roster_Template_${fromDate.getFullYear()}-${(fromDate.getMonth()+1)}-${fromDate.getDate()}`,
//       Author: "Task Management CRM",
//       CreatedDate: new Date()
//     };

//     const data = [];

//     data.push(headers);

//     const worksheet = XLSX.utils.aoa_to_sheet(data);
    
//     const range = XLSX.utils.decode_range(worksheet['!ref']);

//     for (let C = range.s.c; C <= range.e.c; C++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
//       const columnName = headers[C] || "";
      
//       if (!worksheet[cellAddress]) {
//         worksheet[cellAddress] = { v: columnName };
//       }
      
//       worksheet[cellAddress].s = {
//         font: { 
//           bold: true, 
//           color: { rgb: "FFFFFF" },
//           name: "Arial",
//           sz: 11 
//         },
//         fill: { 
//           fgColor: { rgb: "4472C4" }  
//         },
//         alignment: { 
//           horizontal: "center", 
//           vertical: "center",
//           wrapText: false
//         },
//         border: {
//           top: { style: "thin", color: { rgb: "000000" } },
//           bottom: { style: "thin", color: { rgb: "000000" } },
//           left: { style: "thin", color: { rgb: "000000" } },
//           right: { style: "thin", color: { rgb: "000000" } }
//         }
//       };
//     }

//     const colWidths = [
//       { wch: 25 },   
//       { wch: 15 },   
//       { wch: 15 },   
//       { wch: 15 },   
//       { wch: 15 },   
//       { wch: 15 },   
//       ...Array(dateColumns.length).fill({ wch: 12 }),  
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 },   
//       { wch: 12 }    
//     ];
    
//     worksheet['!cols'] = colWidths;
//     worksheet['!rows'] = [
//       { hpt: 25 }   
//     ];

//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Roster Template');

//     const fileName = `Roster_Template_${fromDate.getFullYear()}-${(fromDate.getMonth()+1).toString().padStart(2,'0')}-${fromDate.getDate().toString().padStart(2,'0')}_to_${toDate.getFullYear()}-${(toDate.getMonth()+1).toString().padStart(2,'0')}-${toDate.getDate().toString().padStart(2,'0')}.xlsx`;
    
//     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
//     res.send(buffer);

//   } catch (error) {
//     console.error('Export Roster Template Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error exporting roster template',
//       error: error.message
//     });
//   }
// };

//Added by farhan from 155 to 350 line no.
export const addRosterWeek = async (req, res) => {
  try {
    const { 
      month, 
      year, 
      weekNumber, 
      startDate, 
      endDate, 
      employees, 
      action = "create",
      rosterStartDate, 
      rosterEndDate     
    } = req.body;
    
    const createdBy = req.user._id;  

    if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: month, year, weekNumber, startDate, endDate, employees" 
      });
    }

    if (!rosterStartDate || !rosterEndDate) {
      return res.status(400).json({ 
        success: false,
        message: "rosterStartDate and rosterEndDate are required" 
      });
    }

    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    newStartDate.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);

    // ✅ Get unique departments from employees
    const departments = [...new Set(employees.map(emp => emp.department || emp.department || "General"))];
    
    // ✅ Department-wise overlap check
    const overlappingWeeksByDept = [];
    
    for (const dept of departments) {
      const existingRosterWithOverlap = await Roster.findOne({
        month,
        year,
        'weeks.employees': {
          $elemMatch: { department: dept }
        },
        'weeks': {
          $elemMatch: {
            $or: [
              { 
                startDate: { $lte: newEndDate },
                endDate: { $gte: newStartDate }
              }
            ]
          }
        }
      });

      if (existingRosterWithOverlap) {
        // Find overlapping weeks for this department
        const overlappingWeeks = existingRosterWithOverlap.weeks.filter(w => {
          const wStart = new Date(w.startDate);
          const wEnd = new Date(w.endDate);
          const hasDepartment = w.employees.some(emp => emp.department === dept);
          
          return hasDepartment && (wStart <= newEndDate && wEnd >= newStartDate);
        });

        if (overlappingWeeks.length > 0) {
          overlappingWeeksByDept.push({
            department: dept,
            weeks: overlappingWeeks
          });
        }
      }
    }

    if (overlappingWeeksByDept.length > 0) {
      // Calculate next available week
      const allOverlappingEndDates = overlappingWeeksByDept.flatMap(d => 
        d.weeks.map(w => new Date(w.endDate))
      );
      const latestEndDate = new Date(Math.max(...allOverlappingEndDates));
      
      const nextWeekStartDate = new Date(latestEndDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 1);
      const nextWeekEndDate = new Date(nextWeekStartDate);
      nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);

      const nextWeekFormattedStart = nextWeekStartDate.toISOString().split('T')[0];
      const nextWeekFormattedEnd = nextWeekEndDate.toISOString().split('T')[0];

      // Detailed error message
      const deptMessages = overlappingWeeksByDept.map(d => {
        const weekDetails = d.weeks.map(w => 
          `${new Date(w.startDate).toLocaleDateString()} to ${new Date(w.endDate).toLocaleDateString()}`
        ).join(', ');
        return `${d.department}: ${weekDetails}`;
      }).join('; ');

      return res.status(400).json({
        success: false,
        message: `❌ Roster already exists for these departments in this week period.`,
        details: deptMessages,
        suggestion: `✅ Please create roster for next available week: ${nextWeekFormattedStart} to ${nextWeekFormattedEnd}`,
        overlappingDepartments: overlappingWeeksByDept
      });
    }

    
    const processedEmployees = await Promise.all(
      employees.map(async (emp) => {
      })
    );

    let roster = await Roster.findOne({ month, year });
    if (!roster) {
      roster = new Roster({
        month,
        year,
        rosterStartDate: new Date(rosterStartDate),
        rosterEndDate: new Date(rosterEndDate),
        weeks: [],
        createdBy,
      });
    } else {
      roster.rosterStartDate = new Date(rosterStartDate);
      roster.rosterEndDate = new Date(rosterEndDate);
      roster.updatedBy = createdBy;  
    }

    //  Department-wise double-check within this roster
    const conflictingDepts = [];
    for (const dept of departments) {
      const overlappingWeekIndex = roster.weeks.findIndex(w => {
        const wStart = new Date(w.startDate);
        const wEnd = new Date(w.endDate);
        const hasDepartment = w.employees.some(emp => emp.department === dept);
        
        return hasDepartment && (wStart <= newEndDate && wEnd >= newStartDate);
      });

      if (overlappingWeekIndex !== -1) {
        conflictingDepts.push({
          department: dept,
          week: roster.weeks[overlappingWeekIndex]
        });
      }
    }

    if (conflictingDepts.length > 0) {
      const nextWeekStartDate = new Date(newEndDate);
      nextWeekStartDate.setDate(nextWeekStartDate.getDate() + 1);
      const nextWeekEndDate = new Date(nextWeekStartDate);
      nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);

      const deptNames = conflictingDepts.map(d => d.department).join(', ');

      return res.status(400).json({
        success: false,
        message: `❌ These departments already have roster in this week: ${deptNames}`,
        suggestion: `✅ Please create roster for next week: ${nextWeekStartDate.toISOString().split('T')[0]} to ${nextWeekEndDate.toISOString().split('T')[0]}`,
        conflictingDepartments: conflictingDepts
      });
    }

    // Add new week
    roster.weeks.push({
      weekNumber,
      startDate: newStartDate,
      endDate: newEndDate,
      employees: processedEmployees,
    });

    if (!roster.updatedBy) {
      roster.updatedBy = createdBy;
    }

    await roster.save();
    
    return res.status(201).json({ 
      success: true,
      message: action === "add" ? "Employees added to roster successfully" : "Roster week saved successfully", 
      roster,
      departments: departments 
    });
  } catch (error) {
    console.error("Error adding roster week:", error);
    return res.status(400).json({ 
      success: false,
      message: error.message || "Failed to add roster week" 
    });
  }
};

export const getRostersByDepartment = async (req, res) => {
  try {
    const { department, month, year, page = 1, limit = 10 } = req.query;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department is required for filtering"
      });
    }

    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build the base filter. When month+year are supplied, match rosters by date overlap
    // so cross-month weeks (e.g. Mar 30-Apr 5) are visible in both months.
    const baseFilter = {};
    const parsedMonth = Number.parseInt(month, 10);
    const parsedYear = Number.parseInt(year, 10);
    if (Number.isFinite(parsedMonth) && Number.isFinite(parsedYear)) {
      const monthStart = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
      baseFilter.rosterStartDate = { $lte: monthEnd };
      baseFilter.rosterEndDate = { $gte: monthStart };
    } else {
      if (Number.isFinite(parsedMonth)) baseFilter.month = parsedMonth;
      if (Number.isFinite(parsedYear)) baseFilter.year = parsedYear;
    }

    // First, get total count of rosters that match month/year
    const totalRosters = await Roster.countDocuments(baseFilter);

    // Fetch rosters with pagination
    const rosters = await Roster.find(baseFilter)
      .sort({ rosterStartDate: -1, rosterEndDate: -1, year: -1, month: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .populate('editHistory.editedBy', 'username email')
      .lean();

    // Process each roster to filter employees by department
    const processedRosters = rosters
      .map(roster => {
        // Process weeks and filter employees by department (case-insensitive)
        const weeksWithDepartment = roster.weeks
          .map(week => {
            // Filter employees for this week by department
            const departmentEmployees = week.employees.filter(emp => 
              emp.department && 
              emp.department.trim().toLowerCase() === department.trim().toLowerCase()
            );

            // Only return week if it has employees from this department
            if (departmentEmployees.length > 0) {
              return {
                weekNumber: week.weekNumber,
                startDate: week.startDate,
                endDate: week.endDate,
                employees: departmentEmployees,
                employeeCount: departmentEmployees.length
              };
            }
            return null;
          })
          .filter(week => week !== null);

        // Only return roster if it has at least one week with employees
        if (weeksWithDepartment.length > 0) {
          // Calculate total employees across all weeks
          const totalFilteredEmployees = weeksWithDepartment.reduce(
            (sum, week) => sum + week.employeeCount, 0
          );

          return {
            _id: roster._id,
            month: roster.month,
            year: roster.year,
            rosterStartDate: roster.rosterStartDate,
            rosterEndDate: roster.rosterEndDate,
            weeks: weeksWithDepartment,
            totalWeeks: weeksWithDepartment.length,
            totalEmployees: totalFilteredEmployees,
            createdBy: roster.createdBy,
            updatedBy: roster.updatedBy,
            createdAt: roster.createdAt,
            updatedAt: roster.updatedAt,
            editHistory: roster.editHistory || [],
            summary: {
              totalWeeks: weeksWithDepartment.length,
              totalEmployees: totalFilteredEmployees,
              department: department,
              dateRange: {
                start: roster.rosterStartDate,
                end: roster.rosterEndDate
              }
            }
          };
        }
        return null;
      })
      .filter(roster => roster !== null);

    return res.status(200).json({
      success: true,
      message: `Rosters filtered by department: ${department}`,
      data: processedRosters,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalRosters / limitNum),
        totalItems: totalRosters,
        itemsPerPage: limitNum,
        filteredCount: processedRosters.length,
        department: department
      },
      filters: {
        month: month || null,
        year: year || null,
        department: department
      }
    });
    
  } catch (error) {
    console.error("Error fetching rosters by department:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error while fetching rosters", 
      error: error.message 
    });
  }
};
export const updateArrivalTime = async (req, res) => {
  try {
    const { rosterId, weekNumber, employeeId, date, arrivalTime } = req.body;
    const user = req.user;

    // Validation
    if (!rosterId || !weekNumber || !employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, employeeId, date are required"
      });
    }

    if (!arrivalTime) {
      return res.status(400).json({
        success: false,
        message: "Arrival time is required"
      });
    }

    // Find roster
    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const weekCandidates = (roster.weeks || []).filter(
      (w) => w && Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
    );
    if (!weekCandidates.length) {
      return res.status(404).json({ success: false, message: "Week not found" });
    }

    const week = weekCandidates.find((w) => w.employees?.id(employeeId));
    if (!week) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Week edit rules
    const now = new Date();
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(week.endDate);
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    const isCurrentWeek = now >= weekStartDate && now <= weekEndDate;
    const canEditAnyWeek = user.accountType === "superAdmin" || user.accountType === "HR";

    if (!isCurrentWeek && !canEditAnyWeek) {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can update past/future weeks. Department and Transport can update current week only."
      });
    }

    const employee = week.employees.id(employeeId);
    const isEmployeeUpdatingSelf =
      (String(employee?.userId || "") === String(user._id) ||
        String(employee?.name || "").trim().toLowerCase() === String(user?.username || "").trim().toLowerCase());
    if (isEmployeeUpdatingSelf) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit your own attendance.",
      });
    }
    const delegationContext = await getDelegationContextForDate({
      userId: user._id,
      actionDate: date,
    });

    if (delegationContext.asDelegator) {
      return res.status(403).json({
        success: false,
        message: "You cannot update attendance during your active delegation period.",
        isDelegated: true,
      });
    }

    const hasDelegatedDepartmentAccess = canDelegatedAssigneeManageEmployee(
      delegationContext.asAssignee,
      employee.userId
    );

    // Team leader validation
    if (
      user.accountType !== "superAdmin" &&
      user.accountType !== "HR" &&
      user.department !== "Transport" &&
      !hasDelegatedDepartmentAccess
    ) {
      if (employee.teamLeader !== user.username) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own team members"
        });
      }
    }

    // Parse date parts from the input date string (YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    
    // Validate arrival time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(arrivalTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid arrival time format. Please use HH:MM format (e.g., 09:30)"
      });
    }

    // Parse IST time (e.g., "20:12" = 8:12 PM IST)
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    
    // 🔥 FIX: Convert IST to UTC correctly for storage
    // IST is UTC+5:30, so subtract 5 hours 30 minutes
    let utcHours = hours - 5;
    let utcMinutes = minutes - 30;
    
    // Handle minute underflow
    if (utcMinutes < 0) {
      utcMinutes += 60;
      utcHours -= 1;
    }
    
    // Handle hour underflow (if time goes to previous day UTC)
    if (utcHours < 0) {
      utcHours += 24;
    }
    
    // Create UTC date using Date.UTC() - this ensures the date is stored in UTC
    const newArrival = new Date(Date.UTC(year, month-1, day, utcHours, utcMinutes, 0));

    if (isNaN(newArrival.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid arrival time"
      });
    }

    // Find or create daily status for this date
    let daily = employee.dailyStatus.find(d => {
      const dDate = new Date(d.date);
      return dDate.toISOString().split('T')[0] === date;
    });

    const isNewDay = !daily;
    const oldValues = {};

    if (isNewDay) {
      // Create UTC date for the selected date
      const selectedDate = new Date(Date.UTC(year, month-1, day, 0, 0, 0));
      daily = {
        date: selectedDate,
        status: "P"
      };
      employee.dailyStatus.push(daily);
      daily = employee.dailyStatus[employee.dailyStatus.length - 1];
    } else {
      if (user.department === "Transport") {
        oldValues.transportArrivalTime = daily.transportArrivalTime;
      } else if (
        user.department === employee.department ||
        user.accountType === "superAdmin" ||
        user.accountType === "HR" ||
        hasDelegatedDepartmentAccess
      ) {
        oldValues.departmentArrivalTime = daily.departmentArrivalTime;
      }
    }

    const changes = [];

    // 🚌 TRANSPORT UPDATE
    if (user.department === "Transport") {
      daily.transportArrivalTime = newArrival;
      daily.transportUpdatedBy = user._id;
      daily.transportUpdatedAt = new Date();
      
      changes.push({
        field: `transportArrivalTime (${date})`,
        oldValue: oldValues.transportArrivalTime || null,
        newValue: newArrival
      });
    }
    
    // 👑 SUPERADMIN/HR UPDATE
    else if (user.accountType === "superAdmin" || user.accountType === "HR") {
      daily.transportArrivalTime = newArrival;
      daily.transportUpdatedBy = user._id;
      daily.transportUpdatedAt = new Date();
      
      daily.departmentArrivalTime = newArrival;
      daily.departmentUpdatedBy = user._id;
      daily.departmentUpdatedAt = new Date();
      
      changes.push({
        field: `arrivalTime (${date})`,
        oldValue: oldValues.departmentArrivalTime || null,
        newValue: newArrival
      });
    }
    
    // 👥 DEPARTMENT UPDATE
    else if (user.department === employee.department || hasDelegatedDepartmentAccess) {
      daily.departmentArrivalTime = newArrival;
      daily.departmentUpdatedBy = user._id;
      daily.departmentUpdatedAt = new Date();
      
      changes.push({
        field: `departmentArrivalTime (${date})`,
        oldValue: oldValues.departmentArrivalTime || null,
        newValue: newArrival
      });
    }
    
    // ❌ UNAUTHORIZED
    else {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this employee's arrival time"
      });
    }

    // Add edit history
    roster.editHistory.push({
      editedBy: user._id,
      editedByName: user.username,
      accountType: user.accountType,
      actionType: "update",
      weekNumber: parsedWeekNumber,
      employeeId: employee._id,
      employeeName: employee.name,
      changes
    });

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Arrival time updated successfully",
      data: daily
    });

  } catch (error) {
    console.error("Arrival Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// export const updateArrivalTime = async (req, res) => {
//   try {
//     const { rosterId, weekNumber, employeeId, date, arrivalTime } = req.body;
//     const user = req.user; // logged in user from auth middleware

//     // Validation
//     if (!rosterId || !weekNumber || !employeeId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: rosterId, weekNumber, employeeId, date are required"
//       });
//     }

//     // 🔥 FIX: Validate arrivalTime
//     if (!arrivalTime) {
//       return res.status(400).json({
//         success: false,
//         message: "Arrival time is required"
//       });
//     }

//     // Find roster
//     const roster = await Roster.findById(rosterId);
//     if (!roster) {
//       return res.status(404).json({ success: false, message: "Roster not found" });
//     }

//     // Find week
// 	    const week = roster.weeks.find(w => w.weekNumber === weekNumber);
// 	    if (!week) {
// 	      return res.status(404).json({ success: false, message: "Week not found" });
// 	    }

// 	    // Week edit rules:
// 	    // - HR/superAdmin: can update past/future/current
// 	    // - Transport/Department: current week only
// 	    const now = new Date();
// 	    const weekStartDate = new Date(week.startDate);
// 	    const weekEndDate = new Date(week.endDate);
// 	    weekStartDate.setHours(0, 0, 0, 0);
// 	    weekEndDate.setHours(23, 59, 59, 999);
// 	    const isCurrentWeek = now >= weekStartDate && now <= weekEndDate;
// 	    const canEditAnyWeek = user.accountType === "superAdmin" || user.accountType === "HR";

// 	    if (!isCurrentWeek && !canEditAnyWeek) {
// 	      return res.status(403).json({
// 	        success: false,
// 	        message: "Only HR and Super Admin can update past/future weeks. Department and Transport can update current week only."
// 	      });
// 	    }

// 	    // Find employee
// 	    const employee = week.employees.id(employeeId);
// 	    if (!employee) {
//       return res.status(404).json({ success: false, message: "Employee not found" });
//     }

//     // 🔐 TEAM LEADER VALIDATION
// 	    if (user.accountType !== "superAdmin" && user.accountType !== "HR" && user.department !== "Transport") {
// 	      if (employee.teamLeader !== user.username) {
// 	        return res.status(403).json({
// 	          success: false,
// 	          message: "You can only update your own team members"
//         });
//       }
//     }

//     // Process date
//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format"
//       });
// 	    }
// 	    selectedDate.setHours(0, 0, 0, 0);

// 	    // Ensure requested date belongs to the requested week
// 	    const selectedDayEnd = new Date(selectedDate);
// 	    selectedDayEnd.setHours(23, 59, 59, 999);
// 	    if (selectedDayEnd < weekStartDate || selectedDate > weekEndDate) {
// 	      return res.status(400).json({
// 	        success: false,
// 	        message: "Selected date does not fall within the requested week"
// 	      });
// 	    }

//     // 🔥 FIX: Validate arrivalTime is a valid time string
//     // Expected format: "HH:MM" like "09:30" or "14:45"
//     const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//     if (!timeRegex.test(arrivalTime)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid arrival time format. Please use HH:MM format (e.g., 09:30)"
//       });
//     }

//     // Create a proper date object by combining the selected date with the arrival time
//     const [hours, minutes] = arrivalTime.split(':').map(Number);
//     const newArrival = new Date(selectedDate);
//     newArrival.setHours(hours, minutes, 0, 0);

//     // Verify it's a valid date
//     if (isNaN(newArrival.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid arrival time"
//       });
//     }

//     // Find or create daily status for this date
//     let daily = employee.dailyStatus.find(d => {
//       const dDate = new Date(d.date);
//       dDate.setHours(0, 0, 0, 0);
//       return dDate.getTime() === selectedDate.getTime();
//     });

//     const isNewDay = !daily;
//     const oldValues = {};

//     if (isNewDay) {
//       daily = {
//         date: selectedDate,
//         status: "P" // Default status
//       };
//       employee.dailyStatus.push(daily);
//       daily = employee.dailyStatus[employee.dailyStatus.length - 1];
//     } else {
//       // Store old values for edit history
//       if (user.department === "Transport") {
//         oldValues.transportArrivalTime = daily.transportArrivalTime;
// 	      } else if (user.department === employee.department || user.accountType === "superAdmin" || user.accountType === "HR") {
// 	        oldValues.departmentArrivalTime = daily.departmentArrivalTime;
// 	      }
// 	    }

//     const changes = [];

//     // 🚌 TRANSPORT UPDATE
//     if (user.department === "Transport") {
//       daily.transportArrivalTime = newArrival;
//       daily.transportUpdatedBy = user._id;
//       daily.transportUpdatedAt = new Date();
      
//       changes.push({
//         field: `transportArrivalTime (${date})`,
//         oldValue: oldValues.transportArrivalTime || null,
//         newValue: newArrival
//       });
//     }
    
//     // 👑 SUPERADMIN UPDATE - can update both
// 	    else if (user.accountType === "superAdmin" || user.accountType === "HR") {
// 	      // Update both transport and department fields
// 	      daily.transportArrivalTime = newArrival;
// 	      daily.transportUpdatedBy = user._id;
// 	      daily.transportUpdatedAt = new Date();
      
//       daily.departmentArrivalTime = newArrival;
//       daily.departmentUpdatedBy = user._id;
//       daily.departmentUpdatedAt = new Date();
      
//       changes.push({
//         field: `arrivalTime (${date})`,
//         oldValue: oldValues.departmentArrivalTime || null,
//         newValue: newArrival
//       });
//     }
    
//     // 👥 DEPARTMENT UPDATE (Team Leader)
//     else if (user.department === employee.department) {
//       daily.departmentArrivalTime = newArrival;
//       daily.departmentUpdatedBy = user._id;
//       daily.departmentUpdatedAt = new Date();
      
//       changes.push({
//         field: `departmentArrivalTime (${date})`,
//         oldValue: oldValues.departmentArrivalTime || null,
//         newValue: newArrival
//       });
//     }
    
//     // ❌ UNAUTHORIZED
//     else {
//       return res.status(403).json({
//         success: false,
//         message: "You are not allowed to update this employee's arrival time"
//       });
//     }

//     // 📝 Add edit history
//     roster.editHistory.push({
//       editedBy: user._id,
//       editedByName: user.username,
//       accountType: user.accountType,
//       actionType: "update",
//       weekNumber,
//       employeeId: employee._id,
//       employeeName: employee.name,
//       changes
//     });

//     // Save roster
//     await roster.save();

//     return res.status(200).json({
//       success: true,
//       message: "Arrival time updated successfully",
//       data: daily
//     });

//   } catch (error) {
//     console.error("Arrival Update Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
//This is updated by keshav
export const updateAttendance = async (req, res) => {
  try {
    const { 
      rosterId, 
      weekNumber, 
      employeeId, 
      date, 
      transportStatus, 
      departmentStatus, 
      arrivalTime,
      delegatedFrom,
    } = req.body;
    
    const user = req.user; 
    if (!rosterId || !weekNumber || !employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, employeeId, date"
      });
    }
    if (!transportStatus && !departmentStatus && !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: "At least one field (transportStatus, departmentStatus, or arrivalTime) is required"
      });
    }
    const validStatuses = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD"];
    
    if (transportStatus && !validStatuses.includes(transportStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transport status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    if (departmentStatus && !validStatuses.includes(departmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const weekCandidates = (roster.weeks || []).filter(
      (w) => w && Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
    );
    if (!weekCandidates.length) {
      return res.status(404).json({ success: false, message: "Week not found" });
    }

    const week = weekCandidates.find((w) => w.employees?.id(employeeId));
    if (!week) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

	    // Week edit rules:
	    // - HR/superAdmin: can update past/future/current
	    // - Transport/Department: current week only
	    const now = new Date();
	    const weekStartDate = new Date(week.startDate);
	    const weekEndDate = new Date(week.endDate);
	    weekStartDate.setHours(0, 0, 0, 0);
	    weekEndDate.setHours(23, 59, 59, 999);
	    const isCurrentWeek = now >= weekStartDate && now <= weekEndDate;
	    const canEditAnyWeek = user.accountType === "superAdmin" || user.accountType === "HR";

	    if (!isCurrentWeek && !canEditAnyWeek) {
	      return res.status(403).json({
	        success: false,
	        message: "Only HR and Super Admin can update past/future weeks. Department and Transport can update current week only."
	      });
	    }

    const employee = week.employees.id(employeeId);
    const isEmployeeUpdatingSelf =
      (String(employee?.userId || "") === String(user._id) ||
        String(employee?.name || "").trim().toLowerCase() === String(user?.username || "").trim().toLowerCase());
    if (isEmployeeUpdatingSelf) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit your own attendance.",
      });
    }
    const delegationContext = await getDelegationContextForDate({
      userId: user._id,
      actionDate: date,
    });

    if (delegationContext.asDelegator) {
      return res.status(403).json({
        success: false,
        message: "You cannot update attendance during your active delegation period.",
        isDelegated: true,
      });
    }

    let delegatedTeamLeaderName = "";
    const delegatedTeamLeaderNames = await getDelegatedTeamLeaderNames({
      assigneeId: user._id,
      actionDate: date,
    });
    let specificDelegation = null;
    if (delegatedFrom) {
      const actionDate = new Date(date);
      actionDate.setHours(0, 0, 0, 0);
      const actionDayEnd = new Date(actionDate);
      actionDayEnd.setHours(23, 59, 59, 999);

      specificDelegation = await Delegation.findOne({
        assignee: user._id,
        delegator: delegatedFrom,
        status: "active",
        startDate: { $lte: actionDayEnd },
        endDate: { $gte: actionDate },
      })
        .populate("delegator", "username")
        .lean();

      if (!specificDelegation) {
        return res.status(403).json({
          success: false,
          message: "No active delegation found for selected team leader and date.",
        });
      }

      delegatedTeamLeaderName = String(specificDelegation?.delegator?.username || "")
        .trim()
        .toLowerCase();
    }

    const baseDelegationForEmployee = specificDelegation || delegationContext.asAssignee;
    const hasDelegatedDepartmentAccessById = canDelegatedAssigneeManageEmployee(
      baseDelegationForEmployee,
      employee.userId
    );
    const hasDelegatedDepartmentAccessByTeamLeader =
      (delegatedTeamLeaderName &&
        String(employee.teamLeader || "").trim().toLowerCase() === delegatedTeamLeaderName) ||
      delegatedTeamLeaderNames.has(String(employee.teamLeader || "").trim().toLowerCase());
    const hasDelegatedDepartmentAccess =
      hasDelegatedDepartmentAccessById || hasDelegatedDepartmentAccessByTeamLeader;
	    if (user.accountType === "superAdmin" || user.accountType === "HR") {
	      console.log("Admin access granted");
	    } 
	    else if (user.department === "Transport") {
	      console.log("Transport department access granted");
	    }
    // Department users (including team leaders)
    else {
      // Check if this user is allowed to update this employee
      const normalizedEmployeeTeamLeader = String(employee.teamLeader || "").trim().toLowerCase();
      const normalizedUsername = String(user.username || "").trim().toLowerCase();
      const normalizedEmployeeDepartment = String(employee.department || "").trim().toLowerCase();
      const normalizedUserDepartment = String(user.department || "").trim().toLowerCase();
      const isTeamLeader = normalizedEmployeeTeamLeader === normalizedUsername;
      const isSameDepartment = normalizedEmployeeDepartment === normalizedUserDepartment;
	      
	      // Allow if they are the team leader OR in the same department
	      if (!isTeamLeader && !isSameDepartment && !hasDelegatedDepartmentAccess) {
	        return res.status(403).json({
	          success: false,
	          message: "You can only update employees in your department or your own team members"
	        });
	      }
      
      console.log(`Department user access granted. Team Leader: ${isTeamLeader}, Same Dept: ${isSameDepartment}`);
    }

	    const selectedDate = parseYmdToUtcDate(date);
	    if (!selectedDate) {
	      return res.status(400).json({
	        success: false,
	        message: "Invalid date format"
	      });
	    }
	    const selectedDateKey = toIstDateKey(selectedDate);
	    const weekStartKey = toIstDateKey(week.startDate);
	    const weekEndKey = toIstDateKey(week.endDate);
	    if (!selectedDateKey || !weekStartKey || !weekEndKey) {
	      return res.status(400).json({
	        success: false,
	        message: "Invalid week/date payload"
	      });
	    }
	    if (selectedDateKey < weekStartKey || selectedDateKey > weekEndKey) {
	      return res.status(400).json({
	        success: false,
	        message: "Selected date does not fall within the requested week"
	      });
	    }

	    let daily = employee.dailyStatus.find((d) => toIstDateKey(d?.date) === selectedDateKey);

    const isNewDay = !daily;
    const changes = [];

    if (isNewDay) {
      // Create new daily entry with ALL fields from schema
      daily = { 
        date: selectedDate,
        // Status fields
        transportStatus: "",
        departmentStatus: "",
        // Status tracking fields
        transportStatusUpdatedBy: null,
        transportStatusUpdatedAt: null,
        departmentStatusUpdatedBy: null,
        departmentStatusUpdatedAt: null,
        // Arrival time fields
        transportArrivalTime: null,
        departmentArrivalTime: null,
        // Arrival tracking fields
        transportUpdatedBy: null,
        transportUpdatedAt: null,
        departmentUpdatedBy: null,
        departmentUpdatedAt: null
      };
      employee.dailyStatus.push(daily);
      daily = employee.dailyStatus[employee.dailyStatus.length - 1];
    } else {
      // Ensure existing entries have all fields (for legacy data)
      let needsMarkModified = false;
      
      if (daily.transportStatus === undefined) {
        daily.transportStatus = "";
        needsMarkModified = true;
      }
      if (daily.departmentStatus === undefined) {
        daily.departmentStatus = "";
        needsMarkModified = true;
      }
      if (daily.transportStatusUpdatedBy === undefined) {
        daily.transportStatusUpdatedBy = null;
        needsMarkModified = true;
      }
      if (daily.transportStatusUpdatedAt === undefined) {
        daily.transportStatusUpdatedAt = null;
        needsMarkModified = true;
      }
      if (daily.departmentStatusUpdatedBy === undefined) {
        daily.departmentStatusUpdatedBy = null;
        needsMarkModified = true;
      }
      if (daily.departmentStatusUpdatedAt === undefined) {
        daily.departmentStatusUpdatedAt = null;
        needsMarkModified = true;
      }
      if (daily.transportArrivalTime === undefined) {
        daily.transportArrivalTime = null;
        needsMarkModified = true;
      }
      if (daily.departmentArrivalTime === undefined) {
        daily.departmentArrivalTime = null;
        needsMarkModified = true;
      }
      if (daily.transportUpdatedBy === undefined) {
        daily.transportUpdatedBy = null;
        needsMarkModified = true;
      }
      if (daily.transportUpdatedAt === undefined) {
        daily.transportUpdatedAt = null;
        needsMarkModified = true;
      }
      if (daily.departmentUpdatedBy === undefined) {
        daily.departmentUpdatedBy = null;
        needsMarkModified = true;
      }
      if (daily.departmentUpdatedAt === undefined) {
        daily.departmentUpdatedAt = null;
        needsMarkModified = true;
      }
      
      if (needsMarkModified) {
        employee.markModified('dailyStatus');
      }
    }

    // 🔥 UPDATE TRANSPORT STATUS
	    // Transport can update transportStatus, HR/SuperAdmin can update both
	    if (transportStatus) {
      const canUpdateTransportStatus =
        user.department === "Transport" || user.accountType === "superAdmin" || user.accountType === "HR";
      if (!canUpdateTransportStatus) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update transport status for this employee"
        });
      }

	      if (daily.transportStatus !== transportStatus) {
	        changes.push({
	          field: `transportStatus (${date})`,
	          oldValue: daily.transportStatus || null,
          newValue: transportStatus
        });
        
        daily.transportStatus = transportStatus;
        daily.transportStatusUpdatedBy = user._id;
        daily.transportStatusUpdatedAt = new Date();
      }
    }
    
    // 🔥 UPDATE DEPARTMENT STATUS
	    // Department users can update departmentStatus, HR/SuperAdmin can update both
	    if (departmentStatus) {
	      // Allow if: user is in same department OR is team leader OR is superAdmin
	      const canUpdateDepartment = 
	        user.accountType === "superAdmin" || 
	        user.accountType === "HR" ||
	        user.department === employee.department ||
	        employee.teamLeader === user.username ||
          hasDelegatedDepartmentAccess;
      
      if (canUpdateDepartment) {
        if (daily.departmentStatus !== departmentStatus) {
          changes.push({
            field: `departmentStatus (${date})`,
            oldValue: daily.departmentStatus || null,
            newValue: departmentStatus
          });
          
          daily.departmentStatus = departmentStatus;
          daily.departmentStatusUpdatedBy = user._id;
          daily.departmentStatusUpdatedAt = new Date();
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to update department status for this employee"
        });
      }
    }

    // Handle arrival time
    if (arrivalTime) {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(arrivalTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid arrival time format. Please use HH:MM format (e.g., 09:30)"
        });
      }

	      const [hours, minutes] = arrivalTime.split(':').map(Number);
	      let utcHours = hours - 5;
	      let utcMinutes = minutes - 30;
	      let dayOffset = 0;
	      if (utcMinutes < 0) {
	        utcMinutes += 60;
	        utcHours -= 1;
	      }
	      if (utcHours < 0) {
	        utcHours += 24;
	        dayOffset -= 1;
	      }
	      if (utcHours >= 24) {
	        utcHours -= 24;
	        dayOffset += 1;
	      }
	      const newArrival = new Date(
	        Date.UTC(
	          selectedDate.getUTCFullYear(),
	          selectedDate.getUTCMonth(),
	          selectedDate.getUTCDate() + dayOffset,
	          utcHours,
	          utcMinutes,
	          0,
	          0
	        )
	      );

      if (isNaN(newArrival.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid arrival time"
        });
      }

	      // Transport updates transportArrivalTime
	      if (user.department === "Transport" || user.accountType === "superAdmin" || user.accountType === "HR") {
	        if (!daily.transportArrivalTime || daily.transportArrivalTime.getTime() !== newArrival.getTime()) {
	          changes.push({
	            field: `transportArrivalTime (${date})`,
	            oldValue: daily.transportArrivalTime || null,
            newValue: newArrival
          });
          
          daily.transportArrivalTime = newArrival;
          daily.transportUpdatedBy = user._id;
          daily.transportUpdatedAt = new Date();
        }
      }
      
      // Department updates departmentArrivalTime
	      const canUpdateDepartmentArrival = 
	        user.accountType === "superAdmin" || 
	        user.accountType === "HR" ||
	        user.department === employee.department ||
	        employee.teamLeader === user.username ||
          hasDelegatedDepartmentAccess;
      
      if (canUpdateDepartmentArrival) {
        if (!daily.departmentArrivalTime || daily.departmentArrivalTime.getTime() !== newArrival.getTime()) {
          changes.push({
            field: `departmentArrivalTime (${date})`,
            oldValue: daily.departmentArrivalTime || null,
            newValue: newArrival
          });
          
          daily.departmentArrivalTime = newArrival;
          daily.departmentUpdatedBy = user._id;
          daily.departmentUpdatedAt = new Date();
        }
      }
    }

    // Add edit history if there are changes
    if (changes.length > 0) {
      roster.editHistory.push({
        editedBy: user._id,
        editedByName: user.username,
        accountType: user.accountType,
	        actionType: "update",
	        weekNumber: parsedWeekNumber,
        employeeId: employee._id,
        employeeName: employee.name,
        changes
      });
    }

    // Mark the employee as modified to ensure changes are saved
    employee.markModified('dailyStatus');
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: daily
    });

  } catch (error) {
    console.error("Attendance Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const searchBulkEditEmployees = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const user = req.user;
    const userAccountType = user?.accountType;

    const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
    const searchByRaw = typeof req.query?.searchBy === "string" ? req.query.searchBy.trim() : "";
    const searchBy = searchByRaw || "all"; // all | name | department | teamLeader
    const department = typeof req.query?.department === "string" ? req.query.department.trim() : "";

    if (!rosterId) {
      return res.status(400).json({
        success: false,
        message: "rosterId is required",
      });
    }

    if (!["superAdmin", "HR"].includes(userAccountType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin and HR can search bulk edit rosters",
        userAccountType,
      });
    }

    // Populate only what we need for search (department can come from userId).
    const roster = await Roster.findById(rosterId).populate("weeks.employees.userId", "department username");
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found",
      });
    }

    const needle = q ? q.toLowerCase() : "";
    const by = String(searchBy || "all").toLowerCase();
    const deptNeedle = department ? department.toLowerCase() : "";
    const contains = (value) => String(value || "").toLowerCase().includes(needle);
    const sameDept = (value) => String(value || "").toLowerCase() === deptNeedle;

    const hasAnyFilter = Boolean(needle || deptNeedle);

    const matchingEmployeeIdsByWeek = {};
    const allMatching = new Set();

    (roster.weeks || []).forEach((week) => {
      if (!week) return;
      const weekNumber = String(week.weekNumber ?? "");
      if (!weekNumber) return;

      const ids = [];
      const employees = (week.employees || []).filter((emp) => emp !== null);

      employees.forEach((emp) => {
        if (!emp) return;

        const empName = emp.name || "";
        const empTeamLeader = emp.teamLeader || "";
        const empDepartment = emp.department || emp.userId?.department || "General";

        let matches = true;

        if (deptNeedle) {
          matches = matches && sameDept(empDepartment);
        }

        if (needle) {
          if (by === "department") matches = matches && contains(empDepartment);
          else if (by === "name") matches = matches && contains(empName);
          else if (by === "teamleader") matches = matches && contains(empTeamLeader);
          else matches = matches && (contains(empName) || contains(empDepartment) || contains(empTeamLeader));
        }

        if (!matches) return;

        const idStr = emp._id ? String(emp._id) : null;
        if (!idStr) return;
        ids.push(idStr);
        allMatching.add(idStr);
      });

      matchingEmployeeIdsByWeek[weekNumber] = ids;
    });

    return res.status(200).json({
      success: true,
      data: {
        rosterId: String(roster._id),
        q,
        searchBy,
        department,
        hasAnyFilter,
        totalMatches: allMatching.size,
        matchingEmployeeIds: Array.from(allMatching),
        matchingEmployeeIdsByWeek,
      },
    });
  } catch (error) {
    console.error("Error searching roster for bulk edit:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search roster for bulk editing",
    });
  }
};

export const updateAttendanceBulk = async (req, res) => {
  try {
    const {
      rosterId,
      weekNumber,
      employeeIds,
      date,
      transportStatus,
      departmentStatus,
      arrivalTime,
      delegatedFrom,
    } = req.body;

    const user = req.user;

    if (!rosterId || !weekNumber || !Array.isArray(employeeIds) || employeeIds.length === 0 || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, employeeIds, date"
      });
    }

    if (!transportStatus && !departmentStatus && !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: "At least one field (transportStatus, departmentStatus, or arrivalTime) is required"
      });
    }

    const validStatuses = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD"];

    if (transportStatus && !validStatuses.includes(transportStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transport status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    if (departmentStatus && !validStatuses.includes(departmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Department users must provide arrival time when marking department status as Present.
    const isDepartmentUser = user?.accountType === "employee" && user?.department !== "Transport";
    if (isDepartmentUser && departmentStatus === "P" && !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: "Arrival time is required when Department Status is P."
      });
    }

    // Validate time format (HH:MM) if provided
    if (arrivalTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(arrivalTime)) {
        return res.status(400).json({
          success: false,
          message: "Invalid arrival time format. Please use HH:MM format (e.g., 09:30)"
        });
      }
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const parsedWeekNumber = parseInt(weekNumber);
    const weekCandidates = (roster.weeks || []).filter(
      (w) => w && Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
    );
    if (!weekCandidates.length) {
      return res.status(404).json({ success: false, message: "Week not found" });
    }

    // Week edit rules (same as single update):
    // - HR/superAdmin: can update past/future/current
    // - Transport/Department: current week only
    const now = new Date();
    const weekStartDate = new Date(
      Math.min(...weekCandidates.map((w) => new Date(w.startDate).getTime()))
    );
    const weekEndDate = new Date(
      Math.max(...weekCandidates.map((w) => new Date(w.endDate).getTime()))
    );
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    const isCurrentWeek = now >= weekStartDate && now <= weekEndDate;
    const canEditAnyWeek = user.accountType === "superAdmin" || user.accountType === "HR";

    if (!isCurrentWeek && !canEditAnyWeek) {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can update past/future weeks. Department and Transport can update current week only."
      });
    }

	    const selectedDate = parseYmdToUtcDate(date);
	    if (!selectedDate) {
	      return res.status(400).json({
	        success: false,
	        message: "Invalid date format"
	      });
	    }
	    const selectedDayEnd = new Date(selectedDate);
	    selectedDayEnd.setUTCHours(23, 59, 59, 999);
	    const selectedDateKey = toIstDateKey(selectedDate);
	    const weekStartKey = toIstDateKey(weekStartDate);
	    const weekEndKey = toIstDateKey(weekEndDate);

	    if (!selectedDateKey || !weekStartKey || !weekEndKey) {
	      return res.status(400).json({
	        success: false,
	        message: "Invalid week/date payload"
	      });
	    }
	    if (selectedDateKey < weekStartKey || selectedDateKey > weekEndKey) {
	      return res.status(400).json({
	        success: false,
	        message: "Selected date does not fall within the requested week"
	      });
	    }

    // 🔥 FIX: Convert arrivalTime from IST to UTC for storage
	    let newArrival = null;
	    if (arrivalTime) {
      const [hours, minutes] = arrivalTime.split(":").map(Number);
      
      // Convert IST to UTC (subtract 5 hours 30 minutes)
      let utcHours = hours - 5;
      let utcMinutes = minutes - 30;
      
      // Handle minute underflow
      if (utcMinutes < 0) {
        utcMinutes += 60;
        utcHours -= 1;
      }
      
      // Handle hour underflow
      if (utcHours < 0) {
        utcHours += 24;
      }
      
      // Create UTC date
	      newArrival = new Date(
	        Date.UTC(
	          selectedDate.getUTCFullYear(),
	          selectedDate.getUTCMonth(),
	          selectedDate.getUTCDate(),
	          utcHours,
	          utcMinutes,
	          0,
	          0
	        )
	      );
      
      if (Number.isNaN(newArrival.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid arrival time"
        });
      }
	    }

    const delegationContext = await getDelegationContextForDate({
      userId: user._id,
      actionDate: date,
    });

    if (delegationContext.asDelegator) {
      return res.status(403).json({
        success: false,
        message: "You cannot update attendance during your active delegation period.",
        isDelegated: true,
      });
    }

    let specificDelegation = null;
    let delegatedTeamLeaderName = "";
    const delegatedTeamLeaderNames = await getDelegatedTeamLeaderNames({
      assigneeId: user._id,
      actionDate: date,
    });
    let specificDelegatedEmployeeIds = null;
    if (delegatedFrom) {
      specificDelegation = await Delegation.findOne({
        assignee: user._id,
        delegator: delegatedFrom,
        status: "active",
        startDate: { $lte: selectedDayEnd },
        endDate: { $gte: selectedDate },
      })
        .populate("delegator", "username")
        .lean();

      if (!specificDelegation) {
        return res.status(403).json({
          success: false,
          message: "No active delegation found for selected team leader and date.",
        });
      }

      delegatedTeamLeaderName = String(specificDelegation?.delegator?.username || "")
        .trim()
        .toLowerCase();
      specificDelegatedEmployeeIds = new Set(
        (specificDelegation?.affectedEmployees || []).map((id) => String(id))
      );
    }

	    const results = [];
	    const failed = [];

	    for (const employeeId of employeeIds) {
	      try {
	        const matchedWeek = weekCandidates.find((w) => w.employees?.id(employeeId));
		        const employee = matchedWeek?.employees?.id(employeeId);
		        if (!employee) {
		          failed.push({ employeeId, message: "Employee not found" });
		          continue;
		        }

          const isEmployeeUpdatingSelf =
            (String(employee?.userId || "") === String(user._id) ||
              String(employee?.name || "").trim().toLowerCase() === String(user?.username || "").trim().toLowerCase());
          if (isEmployeeUpdatingSelf) {
            failed.push({
              employeeId,
              message: "You cannot edit your own attendance.",
            });
            continue;
          }

          const baseDelegationForEmployee = specificDelegation || delegationContext.asAssignee;
          const hasDelegatedDepartmentAccessById = specificDelegatedEmployeeIds
            ? employee.userId && specificDelegatedEmployeeIds.has(String(employee.userId))
            : canDelegatedAssigneeManageEmployee(baseDelegationForEmployee, employee.userId);
          const hasDelegatedDepartmentAccessByTeamLeader =
            (delegatedTeamLeaderName &&
              String(employee.teamLeader || "").trim().toLowerCase() === delegatedTeamLeaderName) ||
            delegatedTeamLeaderNames.has(String(employee.teamLeader || "").trim().toLowerCase());
          const hasDelegatedDepartmentAccess =
            hasDelegatedDepartmentAccessById || hasDelegatedDepartmentAccessByTeamLeader;

	        // Base access check (same as single update)
	        if (user.accountType === "superAdmin" || user.accountType === "HR") {
	          // ok
	        } else if (user.department === "Transport") {
	          // ok (transport updates only; field-specific permission checks below)
	        } else {
          const normalizedEmployeeTeamLeader = String(employee.teamLeader || "").trim().toLowerCase();
          const normalizedUsername = String(user.username || "").trim().toLowerCase();
          const normalizedEmployeeDepartment = String(employee.department || "").trim().toLowerCase();
          const normalizedUserDepartment = String(user.department || "").trim().toLowerCase();
          const isTeamLeader = normalizedEmployeeTeamLeader === normalizedUsername;
          const isSameDepartment = normalizedEmployeeDepartment === normalizedUserDepartment;
	          if (!isTeamLeader && !isSameDepartment && !hasDelegatedDepartmentAccess) {
	            failed.push({
	              employeeId,
	              message: "You can only update employees in your department or your own team members"
	            });
	            continue;
          }
        }

        // 🔥 FIX: Find daily status using date string comparison
	        let daily = employee.dailyStatus.find((d) => toIstDateKey(d?.date) === selectedDateKey);

        if (!daily) {
          daily = {
            date: selectedDate,
            transportStatus: "",
            departmentStatus: "",
            transportStatusUpdatedBy: null,
            transportStatusUpdatedAt: null,
            departmentStatusUpdatedBy: null,
            departmentStatusUpdatedAt: null,
            transportArrivalTime: null,
            departmentArrivalTime: null,
            transportUpdatedBy: null,
            transportUpdatedAt: null,
            departmentUpdatedBy: null,
            departmentUpdatedAt: null
          };
          employee.dailyStatus.push(daily);
          daily = employee.dailyStatus[employee.dailyStatus.length - 1];
        } else {
          // Backfill legacy fields if needed
          let needsMarkModified = false;
          const ensure = (key, fallback) => {
            if (daily[key] === undefined) {
              daily[key] = fallback;
              needsMarkModified = true;
            }
          };

          ensure("transportStatus", "");
          ensure("departmentStatus", "");
          ensure("transportStatusUpdatedBy", null);
          ensure("transportStatusUpdatedAt", null);
          ensure("departmentStatusUpdatedBy", null);
          ensure("departmentStatusUpdatedAt", null);
          ensure("transportArrivalTime", null);
          ensure("departmentArrivalTime", null);
          ensure("transportUpdatedBy", null);
          ensure("transportUpdatedAt", null);
          ensure("departmentUpdatedBy", null);
          ensure("departmentUpdatedAt", null);

          if (needsMarkModified) {
            employee.markModified("dailyStatus");
          }
        }

        const changes = [];

        if (transportStatus) {
          const canUpdateTransportStatus =
            user.department === "Transport" || user.accountType === "superAdmin" || user.accountType === "HR";

          if (!canUpdateTransportStatus) {
            failed.push({ employeeId, message: "You don't have permission to update transport status for this employee" });
            continue;
          }

          if (daily.transportStatus !== transportStatus) {
            changes.push({
              field: `transportStatus (${date})`,
              oldValue: daily.transportStatus || null,
              newValue: transportStatus
            });
            daily.transportStatus = transportStatus;
            daily.transportStatusUpdatedBy = user._id;
            daily.transportStatusUpdatedAt = new Date();
          }
        }

	        if (departmentStatus) {
	          const canUpdateDepartmentStatus =
	            user.accountType === "superAdmin" ||
	            user.accountType === "HR" ||
	            user.department === employee.department ||
	            employee.teamLeader === user.username ||
              hasDelegatedDepartmentAccess;

          if (!canUpdateDepartmentStatus) {
            failed.push({ employeeId, message: "You don't have permission to update department status for this employee" });
            continue;
          }

          if (daily.departmentStatus !== departmentStatus) {
            changes.push({
              field: `departmentStatus (${date})`,
              oldValue: daily.departmentStatus || null,
              newValue: departmentStatus
            });
            daily.departmentStatus = departmentStatus;
            daily.departmentStatusUpdatedBy = user._id;
            daily.departmentStatusUpdatedAt = new Date();
          }
        }

        if (newArrival) {
          const canUpdateTransportArrival =
            user.department === "Transport" || user.accountType === "superAdmin" || user.accountType === "HR";

	          const canUpdateDepartmentArrival =
	            user.accountType === "superAdmin" ||
	            user.accountType === "HR" ||
	            user.department === employee.department ||
	            employee.teamLeader === user.username ||
              hasDelegatedDepartmentAccess;

          if (!canUpdateTransportArrival && !canUpdateDepartmentArrival) {
            failed.push({ employeeId, message: "You don't have permission to update arrival time for this employee" });
            continue;
          }

          if (canUpdateTransportArrival) {
            const old = daily.transportArrivalTime || null;
            if (!daily.transportArrivalTime || daily.transportArrivalTime.getTime() !== newArrival.getTime()) {
              changes.push({
                field: `transportArrivalTime (${date})`,
                oldValue: old,
                newValue: newArrival
              });
              daily.transportArrivalTime = newArrival;
              daily.transportUpdatedBy = user._id;
              daily.transportUpdatedAt = new Date();
            }
          }

          if (canUpdateDepartmentArrival) {
            const old = daily.departmentArrivalTime || null;
            if (!daily.departmentArrivalTime || daily.departmentArrivalTime.getTime() !== newArrival.getTime()) {
              changes.push({
                field: `departmentArrivalTime (${date})`,
                oldValue: old,
                newValue: newArrival
              });
              daily.departmentArrivalTime = newArrival;
              daily.departmentUpdatedBy = user._id;
              daily.departmentUpdatedAt = new Date();
            }
          }
        }

        if (changes.length > 0) {
          roster.editHistory.push({
            editedBy: user._id,
            editedByName: user.username,
            accountType: user.accountType,
            actionType: "bulk-update",
            weekNumber: parsedWeekNumber,
            employeeId: employee._id,
            employeeName: employee.name,
            changes
          });
        }

        employee.markModified("dailyStatus");
        results.push({ employeeId: employee._id, data: daily });
      } catch (err) {
        failed.push({ employeeId, message: err.message || "Failed to update employee" });
      }
    }

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Bulk attendance updated successfully",
      updatedCount: results.length,
      failedCount: failed.length,
      results,
      failed
    });
  } catch (error) {
    console.error("Bulk Attendance Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// export const updateAttendance = async (req, res) => {
//   try {
//     const { 
//       rosterId, 
//       weekNumber, 
//       employeeId, 
//       date, 
//       transportStatus, 
//       departmentStatus, 
//       arrivalTime 
//     } = req.body;
    
//     const user = req.user; 
//     if (!rosterId || !weekNumber || !employeeId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: rosterId, weekNumber, employeeId, date"
//       });
//     }
//     if (!transportStatus && !departmentStatus && !arrivalTime) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one field (transportStatus, departmentStatus, or arrivalTime) is required"
//       });
//     }
//     const validStatuses = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD"];
    
//     if (transportStatus && !validStatuses.includes(transportStatus)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid transport status. Must be one of: ${validStatuses.join(', ')}`
//       });
//     }
    
//     if (departmentStatus && !validStatuses.includes(departmentStatus)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid department status. Must be one of: ${validStatuses.join(', ')}`
//       });
//     }

//     const roster = await Roster.findById(rosterId);
//     if (!roster) {
//       return res.status(404).json({ success: false, message: "Roster not found" });
//     }

//     const week = roster.weeks.find(w => w.weekNumber === weekNumber);
//     if (!week) {
//       return res.status(404).json({ success: false, message: "Week not found" });
//     }

//     const employee = week.employees.id(employeeId);
//     if (!employee) {
//       return res.status(404).json({ success: false, message: "Employee not found" });
//     }

//     // 🔐 TEAM LEADER VALIDATION - Only for department employees
//     if (user.accountType !== "superAdmin" && user.department !== "Transport") {
//       if (employee.teamLeader !== user.username) {
//         return res.status(403).json({
//           success: false,
//           message: "You can only update your own team members"
//         });
//       }
//     }

//     const selectedDate = new Date(date);
//     selectedDate.setHours(0, 0, 0, 0);

//     let daily = employee.dailyStatus.find(d => {
//       const dDate = new Date(d.date);
//       dDate.setHours(0, 0, 0, 0);
//       return dDate.getTime() === selectedDate.getTime();
//     });

//     const isNewDay = !daily;
//     const changes = [];

//     if (isNewDay) {
//       daily = { 
//         date: selectedDate,
//         transportStatus: "",
//         departmentStatus: ""
//       };
//       employee.dailyStatus.push(daily);
//       daily = employee.dailyStatus[employee.dailyStatus.length - 1];
//     }

//     // 🔥 UPDATE TRANSPORT STATUS
//     if (transportStatus && (user.department === "Transport" || user.accountType === "superAdmin")) {
//       if (daily.transportStatus !== transportStatus) {
//         changes.push({
//           field: `transportStatus (${date})`,
//           oldValue: daily.transportStatus || null,
//           newValue: transportStatus
//         });
        
//         daily.transportStatus = transportStatus;
//         daily.transportStatusUpdatedBy = user._id;
//         daily.transportStatusUpdatedAt = new Date();
//       }
//     }
    
//     // 🔥 UPDATE DEPARTMENT STATUS
//     if (departmentStatus && (user.department === employee.department || user.accountType === "superAdmin")) {
//       if (daily.departmentStatus !== departmentStatus) {
//         changes.push({
//           field: `departmentStatus (${date})`,
//           oldValue: daily.departmentStatus || null,
//           newValue: departmentStatus
//         });
        
//         daily.departmentStatus = departmentStatus;
//         daily.departmentStatusUpdatedBy = user._id;
//         daily.departmentStatusUpdatedAt = new Date();
//       }
//     }

//     // Handle arrival time
//     if (arrivalTime) {
//       // Validate time format (HH:MM)
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//       if (!timeRegex.test(arrivalTime)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid arrival time format. Please use HH:MM format (e.g., 09:30)"
//         });
//       }

//       const [hours, minutes] = arrivalTime.split(':').map(Number);
//       const newArrival = new Date(selectedDate);
//       newArrival.setHours(hours, minutes, 0, 0);

//       if (isNaN(newArrival.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid arrival time"
//         });
//       }

//       // Transport updates transportArrivalTime
//       if (user.department === "Transport" || user.accountType === "superAdmin") {
//         if (daily.transportArrivalTime?.getTime() !== newArrival.getTime()) {
//           changes.push({
//             field: `transportArrivalTime (${date})`,
//             oldValue: daily.transportArrivalTime || null,
//             newValue: newArrival
//           });
          
//           daily.transportArrivalTime = newArrival;
//           daily.transportUpdatedBy = user._id;
//           daily.transportUpdatedAt = new Date();
//         }
//       }
      
//       // Department updates departmentArrivalTime
//       if (user.department === employee.department || user.accountType === "superAdmin") {
//         if (daily.departmentArrivalTime?.getTime() !== newArrival.getTime()) {
//           changes.push({
//             field: `departmentArrivalTime (${date})`,
//             oldValue: daily.departmentArrivalTime || null,
//             newValue: newArrival
//           });
          
//           daily.departmentArrivalTime = newArrival;
//           daily.departmentUpdatedBy = user._id;
//           daily.departmentUpdatedAt = new Date();
//         }
//       }
//     }

//     // Add edit history if there are changes
//     if (changes.length > 0) {
//       roster.editHistory.push({
//         editedBy: user._id,
//         editedByName: user.username,
//         accountType: user.accountType,
//         actionType: "update",
//         weekNumber,
//         employeeId: employee._id,
//         employeeName: employee.name,
//         changes
//       });
//     }

//     await roster.save();

//     return res.status(200).json({
//       success: true,
//       message: "Attendance updated successfully",
//       data: daily
//     });

//   } catch (error) {
//     console.error("Attendance Update Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
export const getFilteredRosterForUpdates = async (req, res) => {
  try {
    const { rosterId, weekNumber, date } = req.params;
    const delegatedFrom = typeof req.query?.delegatedFrom === "string" ? req.query.delegatedFrom.trim() : "";
    const user = req.user;
    const rawPage = req.query?.page;
    const rawLimit = req.query?.limit;
    const q = typeof req.query?.q === "string" ? req.query.q.trim() : "";
    const searchByRaw = typeof req.query?.searchBy === "string" ? req.query.searchBy.trim() : "";
    const searchBy = searchByRaw || "all";
    const parsedMonth = Number.parseInt(req.query?.month, 10);
    const parsedYear = Number.parseInt(req.query?.year, 10);
    const hasMonthContext = Number.isFinite(parsedMonth) && Number.isFinite(parsedYear);

    console.log("📡 Fetching updates for:", { 
      rosterId, 
      weekNumber: parseInt(weekNumber), 
      date,
      user: user.username,
      userDepartment: user.department,
      accountType: user.accountType
    });

    if (!rosterId || !weekNumber || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, date"
      });
    }

    const roster = await Roster.findById(rosterId);

    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const requestedDate = parseYmdToUtcDate(date);
    const requestedDateKey = requestedDate ? toIstDateKey(requestedDate) : null;
    if (!requestedDate || !requestedDateKey) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    let contextualRosters = [roster];
    if (hasMonthContext) {
      const monthStart = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
      const monthEnd = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));
      const overlappingRosters = await Roster.find({
        $or: [
          {
            rosterStartDate: { $lte: monthEnd },
            rosterEndDate: { $gte: monthStart },
          },
          {
            weeks: {
              $elemMatch: {
                startDate: { $lte: monthEnd },
                endDate: { $gte: monthStart },
              },
            },
          },
        ],
      });
      const seen = new Set();
      contextualRosters = [roster, ...(overlappingRosters || [])].filter((r) => {
        const id = String(r?._id || "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    const resolveWeekGroupInRoster = (targetRoster) => {
      if (!targetRoster) return null;
      const weeks = (targetRoster.weeks || []).filter(Boolean);
      const byWeekNumber = weeks.filter(
        (w) => Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
      );
      if (byWeekNumber.length) {
        return { weekGroup: byWeekNumber, resolvedByDate: false };
      }
      const matchedWeek = weeks.find((w) => {
        const startKey = toIstDateKey(w.startDate);
        const endKey = toIstDateKey(w.endDate);
        if (!startKey || !endKey) return false;
        return requestedDateKey >= startKey && requestedDateKey <= endKey;
      });
      if (!matchedWeek) return null;
      const matchedGroup = weeks.filter(
        (w) => Number.parseInt(w.weekNumber, 10) === Number.parseInt(matchedWeek.weekNumber, 10)
      );
      if (!matchedGroup.length) return null;
      return { weekGroup: matchedGroup, resolvedByDate: true };
    };

    let activeRoster = roster;
    let selectedWeekGroup = [];
    let resolvedByDate = false;
    const primaryResolution = resolveWeekGroupInRoster(roster);
    if (primaryResolution) {
      selectedWeekGroup = primaryResolution.weekGroup;
      resolvedByDate = primaryResolution.resolvedByDate;
    } else {
      for (const candidateRoster of contextualRosters) {
        const resolution = resolveWeekGroupInRoster(candidateRoster);
        if (!resolution) continue;
        activeRoster = candidateRoster;
        selectedWeekGroup = resolution.weekGroup;
        resolvedByDate = resolution.resolvedByDate;
        break;
      }
    }

    if (!selectedWeekGroup.length) {
      const allWeeks = contextualRosters.flatMap((r) => (r.weeks || []).filter(Boolean));
      return res.status(404).json({
        success: false,
        message: `Week ${weekNumber} not found in roster. Available weeks: ${[...new Set(allWeeks.map((w) => w.weekNumber))].join(", ")}`
      });
    }


    const selectedWeekEmployees = selectedWeekGroup.flatMap((w) => (w.employees || []).filter((e) => e !== null));
    const selectedWeekEmployeesUnique = [];
    const selectedWeekEmployeeIds = new Set();
    selectedWeekEmployees.forEach((emp) => {
      const key = String(emp?._id || "");
      if (!key || selectedWeekEmployeeIds.has(key)) return;
      selectedWeekEmployeeIds.add(key);
      selectedWeekEmployeesUnique.push(emp);
    });

    console.log(`Found week ${weekNumber} with ${selectedWeekEmployeesUnique.length} employees`);

    const delegationContext = await getDelegationContextForDate({
      userId: user._id,
      actionDate: date,
    });

    if (delegationContext.asDelegator) {
      return res.status(403).json({
        success: false,
        message: "You cannot update attendance during your active delegation period.",
        isDelegated: true,
      });
    }

    const delegatedEmployeeUserIds = new Set(
      (delegationContext.asAssignee?.affectedEmployees || []).map((id) => String(id))
    );

    let filteredEmployees = [];
    let selectedTeamLeaderLabel = user.username;
    let managedTeamCount = 0;
    let teamFilterDebug = null;

    // 👑 SUPERADMIN - sees all employees (filter out nulls)
    if (user.accountType === "superAdmin" || user.accountType === "HR") {
      filteredEmployees = selectedWeekEmployeesUnique;
      console.log(`👑 SuperAdmin: Found ${filteredEmployees.length} employees`);
    }
    
    // 🚌 TRANSPORT - sees all employees (filter out nulls)
    else if (user.department === "Transport") {
      filteredEmployees = selectedWeekEmployeesUnique;
      console.log(`🚌 Transport: Found ${filteredEmployees.length} employees`);
    }
    
    // 👥 TEAM LEADERS - see only their team (or delegated team in delegated mode)
    else if (user.accountType === "employee" || Boolean(user.isTeamLeader)) {
      console.log(`👥 Team Leader check: ${user.username}`);
      const normalizedUsername = String(user.username || "").trim().toLowerCase();
      const normalizeLabel = (value = "") =>
        String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[()\-_/.,]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const userRecord =
        (user?.realName || user?.pseudoName)
          ? user
          : await User.findById(user._id).select("username realName pseudoName department").lean();
      const teamLeaderAliases = new Set(
        [
          userRecord?.username,
          userRecord?.realName,
          userRecord?.pseudoName,
          `${userRecord?.username || ""} ${userRecord?.department || ""}`,
          `${userRecord?.realName || ""} ${userRecord?.department || ""}`,
        ]
          .map(normalizeLabel)
          .filter(Boolean)
      );
      const matchesTeamLeaderAlias = (value) => {
        const empTl = normalizeLabel(value || "");
        if (!empTl || !teamLeaderAliases.size) return false;
        for (const alias of teamLeaderAliases) {
          if (empTl === alias || empTl.includes(alias) || alias.includes(empTl)) {
            return true;
          }
        }
        return false;
      };
      const isSelfEmployee = (emp) => {
        if (!emp) return false;
        const sameUserId = emp.userId && String(emp.userId) === String(user._id);
        const sameNameAsUsername =
          String(emp.name || "").trim().toLowerCase() === normalizedUsername;
        return sameUserId || sameNameAsUsername;
      };

      const managedEmployeesByLabel = selectedWeekEmployeesUnique.filter((emp) => {
        if (!emp) return false;
        return matchesTeamLeaderAlias(emp.teamLeader);
      });
      const employeeUserIdsInWeek = selectedWeekEmployeesUnique
        .map((emp) => String(emp?.userId || "").trim())
        .filter(Boolean);
      let managedUserIdsByReporting = new Set();
      if (employeeUserIdsInWeek.length) {
        const managedUsers = await User.find({
          _id: { $in: employeeUserIdsInWeek },
          reportingManager: user._id,
        })
          .select("_id")
          .lean();
        managedUserIdsByReporting = new Set(managedUsers.map((u) => String(u._id)));
      }
      const managedEmployees = selectedWeekEmployeesUnique.filter((emp) => {
        if (!emp) return false;
        const byLabel = matchesTeamLeaderAlias(emp.teamLeader);
        const byReporting = emp.userId && managedUserIdsByReporting.has(String(emp.userId));
        return byLabel || byReporting;
      });
      managedTeamCount = managedEmployees.filter((emp) => !isSelfEmployee(emp)).length;
      teamFilterDebug = {
        aliases: Array.from(teamLeaderAliases),
        reportingManagedCount: managedUserIdsByReporting.size,
      };

      if (delegatedFrom) {
        const actionDate = new Date(date);
        actionDate.setHours(0, 0, 0, 0);
        const actionDayEnd = new Date(actionDate);
        actionDayEnd.setHours(23, 59, 59, 999);

        const specificDelegation = await Delegation.findOne({
          assignee: user._id,
          delegator: delegatedFrom,
          status: "active",
          startDate: { $lte: actionDayEnd },
          endDate: { $gte: actionDate },
        })
          .populate("delegator", "username")
          .lean();

        if (!specificDelegation) {
          return res.status(403).json({
            success: false,
            message: "No active delegation found for selected team leader and date.",
          });
        }

        const delegatedTeamLeaderName = String(specificDelegation?.delegator?.username || "")
          .trim()
          .toLowerCase();
        selectedTeamLeaderLabel = specificDelegation?.delegator?.username || user.username;
        const specificDelegatedEmployeeIds = new Set(
          (specificDelegation?.affectedEmployees || []).map((id) => String(id))
        );

        filteredEmployees = selectedWeekEmployeesUnique.filter((emp) => {
          if (!emp) return false;
          const isDelegatedEmployee = emp.userId && specificDelegatedEmployeeIds.has(String(emp.userId));
          const matchesDelegatedTeamLeader =
            delegatedTeamLeaderName &&
            String(emp.teamLeader || "").trim().toLowerCase() === delegatedTeamLeaderName;
          return isDelegatedEmployee || matchesDelegatedTeamLeader;
        });
      } else if (managedTeamCount > 0 || delegatedEmployeeUserIds.size > 0) {
        filteredEmployees = selectedWeekEmployeesUnique.filter((emp) => {
          if (!emp) return false;
          const isOwnTeamLeader = matchesTeamLeaderAlias(emp.teamLeader);
          const isReportingTeamMember =
            emp.userId && managedUserIdsByReporting.has(String(emp.userId));
          const isDelegatedEmployee =
            emp.userId && delegatedEmployeeUserIds.has(String(emp.userId));
          return isOwnTeamLeader || isReportingTeamMember || isDelegatedEmployee || isSelfEmployee(emp);
        });
      } else {
        filteredEmployees = selectedWeekEmployeesUnique.filter((emp) => {
          return isSelfEmployee(emp);
        });
      }

      console.log(`👥 Team Leader ${user.username}: Found ${filteredEmployees.length} employees`);
    }
    
    // ❌ UNAUTHORIZED
    else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this roster"
      });
    }

    // 🔥 FIXED: Format employees with ALL status and arrival time data
    // Optional server-side search (department/name/teamLeader)
    if (q) {
      const needle = q.toLowerCase();
      const contains = (value) => String(value || "").toLowerCase().includes(needle);
      const by = String(searchBy || "all").toLowerCase();
      filteredEmployees = filteredEmployees.filter((emp) => {
        if (!emp) return false;
        if (by === "department") return contains(emp.department);
        if (by === "name") return contains(emp.name);
        if (by === "teamleader") return contains(emp.teamLeader);
        return contains(emp.name) || contains(emp.department) || contains(emp.teamLeader);
      });
    }

    const totalEmployees = filteredEmployees.length;
    if (totalEmployees === 0 && teamFilterDebug) {
      const distinctTeamLeadersInWeek = Array.from(
        new Set(
          selectedWeekEmployeesUnique
            .map((emp) => String(emp?.teamLeader || "").trim())
            .filter(Boolean)
        )
      ).slice(0, 30);
      console.log("Team filter debug (no employees matched):", {
        user: user.username,
        userId: String(user._id),
        aliases: teamFilterDebug.aliases,
        reportingManagedCount: teamFilterDebug.reportingManagedCount,
        distinctTeamLeadersInWeek,
      });
    }

    // Pagination (optional; backward compatible when not provided)
    let page = Number.parseInt(rawPage, 10);
    let limit = Number.parseInt(rawLimit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 0) limit = 0;

    const MAX_LIMIT = 200;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const totalPages = limit > 0 ? Math.max(1, Math.ceil(totalEmployees / limit)) : 1;
    if (page > totalPages) page = totalPages;

    const startIndex = limit > 0 ? (page - 1) * limit : 0;
    const endIndexExclusive = limit > 0 ? startIndex + limit : totalEmployees;
    const pagedEmployees = limit > 0 ? filteredEmployees.slice(startIndex, endIndexExclusive) : filteredEmployees;

    const formattedRosterEntries = pagedEmployees.map(emp => ({
      _id: emp._id,
      userId: emp.userId,
      name: emp.name || 'Unknown',
      username: "", 
      department: emp.department || 'N/A',
      accountType: "employee",
      transport: emp.transport || 'No',
      cabRoute: emp.cabRoute || '',
      teamLeader: emp.teamLeader || '',
      shiftStartHour: emp.shiftStartHour || 0,
      shiftEndHour: emp.shiftEndHour || 0,
      dailyStatus: (emp.dailyStatus || []).map(ds => ({
        date: ds.date,
        status: ds.status || '',
         // 🔥 NEW PUNCH FIELDS
    punchIn: ds.punchIn || null,
    punchOut: ds.punchOut || null,
    totalHours: ds.totalHours || null,
    punchUpdatedBy: ds.punchUpdatedBy || null,
    punchUpdatedAt: ds.punchUpdatedAt || null,
    isPunchCalculated: ds.isPunchCalculated || false,
        // 🔥 STATUS FIELDS - NEW
        transportStatus: ds.transportStatus || '',
        departmentStatus: ds.departmentStatus || '',
        // 🔥 STATUS UPDATE TRACKING - NEW
        transportStatusUpdatedBy: ds.transportStatusUpdatedBy || null,
        transportStatusUpdatedAt: ds.transportStatusUpdatedAt || null,
        departmentStatusUpdatedBy: ds.departmentStatusUpdatedBy || null,
        departmentStatusUpdatedAt: ds.departmentStatusUpdatedAt || null,
        // 🔥 ARRIVAL FIELDS - EXISTING
        transportArrivalTime: ds.transportArrivalTime || null,
        departmentArrivalTime: ds.departmentArrivalTime || null,
        // 🔥 ARRIVAL UPDATE TRACKING - EXISTING
        transportUpdatedBy: ds.transportUpdatedBy || null,
        transportUpdatedAt: ds.transportUpdatedAt || null,
        departmentUpdatedBy: ds.departmentUpdatedBy || null,
        departmentUpdatedAt: ds.departmentUpdatedAt || null
      }))
    }));

    // Also return all weeks for the dropdown (merged by weekNumber)
    const weeksMap = new Map();
    const monthStartKey = hasMonthContext ? `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-01` : null;
    const monthEndDay = hasMonthContext ? new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate() : null;
    const monthEndKey = hasMonthContext
      ? `${parsedYear}-${String(parsedMonth).padStart(2, "0")}-${String(monthEndDay).padStart(2, "0")}`
      : null;
    contextualRosters
      .flatMap((r) => (r?.weeks || []).filter((w) => w !== null))
      .forEach((w) => {
        if (hasMonthContext) {
          const startKey = toIstDateKey(w.startDate);
          const endKey = toIstDateKey(w.endDate);
          if (!startKey || !endKey) return;
          if (!(startKey <= monthEndKey && endKey >= monthStartKey)) return;
        }
        const key = String(w.weekNumber);
        if (!weeksMap.has(key)) {
          weeksMap.set(key, {
            weekNumber: w.weekNumber,
            startDate: w.startDate,
            endDate: w.endDate,
            employeeIds: new Set(),
          });
        }
        const grouped = weeksMap.get(key);
        const currentStart = new Date(w.startDate);
        const currentEnd = new Date(w.endDate);
        if (currentStart < new Date(grouped.startDate)) grouped.startDate = w.startDate;
        if (currentEnd > new Date(grouped.endDate)) grouped.endDate = w.endDate;
        (w.employees || []).filter((e) => e !== null).forEach((emp) => {
          grouped.employeeIds.add(String(emp._id));
        });
      });

    const weeksForDropdown = Array.from(weeksMap.values())
      .map((w) => ({
        weekNumber: w.weekNumber,
        startDate: w.startDate,
        endDate: w.endDate,
        employeeCount: w.employeeIds.size,
      }))
      .sort((a, b) => Number(a.weekNumber) - Number(b.weekNumber));

	    const currentDateKey = toIstDateKey(new Date());
    const weekStartKey = (selectedWeekGroup || [])
      .map((w) => toIstDateKey(w?.startDate))
      .filter(Boolean)
      .sort()[0];
    const weekEndKeyCandidates = (selectedWeekGroup || [])
      .map((w) => toIstDateKey(w?.endDate))
      .filter(Boolean)
      .sort();
    const weekEndKey = weekEndKeyCandidates[weekEndKeyCandidates.length - 1];

    if (!weekStartKey || !weekEndKey || !currentDateKey) {
      return res.status(500).json({
        success: false,
        message: "Failed to resolve week date range"
      });
    }
    
    let canEdit = false;
    let editMessage = "";

    const isAdmin = user.accountType === "superAdmin" || user.accountType === "HR";
    if (isAdmin) {
      canEdit = true;
      editMessage = "HR/Super Admin can edit any week";
    } else if (currentDateKey < weekStartKey) {
      canEdit = false;
      editMessage = "Cannot edit before the week starts";
    } else if (currentDateKey > weekEndKey) {
      canEdit = false;
      editMessage = "Cannot edit after the week has ended";
    } else {
      canEdit = true;
      editMessage = "Can edit during current week";
    }

    // Get unique departments
	    const departments = [...new Set(filteredEmployees.map(e => e?.department).filter(Boolean))];

	    const response = {
	      success: true,
	      message: resolvedByDate
	        ? `Employees for updates (resolved week by date: ${date})`
	        : `Employees for updates (Team Leader: ${selectedTeamLeaderLabel})`,
			      data: {
				        rosterId: activeRoster._id,
			        requestedDate: date,
			        q,
			        searchBy,
				        weekNumber: Number.parseInt(selectedWeekGroup[0].weekNumber, 10),
				        startDate: weekStartKey,
				        endDate: weekEndKey,
			        currentDate: currentDateKey,
			        canEdit: canEdit,
		        editMessage: editMessage,
	        rosterEntries: formattedRosterEntries,
	        pagination: {
	          page,
	          limit: limit > 0 ? limit : totalEmployees,
	          totalEmployees,
	          totalPages,
	          hasPrevPage: page > 1,
	          hasNextPage: page < totalPages,
	          returnedEmployees: formattedRosterEntries.length
	        },
	        weeks: weeksForDropdown,
		        summary: {
		          totalEmployees: totalEmployees,
		          teamLeader: selectedTeamLeaderLabel,
		          departments: departments,
		          currentUser: user.username,
		          userDepartment: user.department,
		          teamSize: totalEmployees,
		          hasTeam: totalEmployees > 0,
              managedTeamCount,
              hasManagedTeam: managedTeamCount > 0
		        }
	      }
	    };
    console.log("📤 Sending response with", formattedRosterEntries.length, "employees");
    if (formattedRosterEntries.length > 0) {
      console.log("📤 Sample employee dailyStatus:", formattedRosterEntries[0].dailyStatus[0]);
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Get Filtered Roster Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack
    });
  }
};
export const getTransportDetailForSuperAdmin = async (req, res) => {
  try {
    const { rosterId, weekNumber, date } = req.params;
    const user = req.user;
    if (user.accountType !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only."
      });
    }

    console.log("👑 SuperAdmin fetching transport details:", { 
      rosterId, 
      weekNumber: parseInt(weekNumber), 
      date,
      user: user.username 
    });

    if (!rosterId || !weekNumber || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, date"
      });
    }

    const roster = await Roster.findById(rosterId)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .populate('weeks.employees.userId', 'username email department')
      .populate('weeks.employees.transportUpdatedBy', 'username department')
      .populate('weeks.employees.departmentUpdatedBy', 'username department')
      .populate('weeks.employees.transportStatusUpdatedBy', 'username department')
      .populate('weeks.employees.departmentStatusUpdatedBy', 'username department');

    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const week = roster.weeks.find(w => w && w.weekNumber === parseInt(weekNumber));
    if (!week) {
      return res.status(404).json({ 
        success: false, 
        message: `Week ${weekNumber} not found in roster.`
      });
    }
    const allEmployees = (week.employees || []).filter(emp => emp !== null);
    const formattedEmployees = allEmployees.map(emp => {
      const dailyStatus = (emp.dailyStatus || []).find(
        d => new Date(d.date).toDateString() === new Date(date).toDateString()
      );
      return {
        name: emp.name || 'Unknown',
        department: emp.department || 'N/A',
        transport: emp.transport || 'No',
        cabRoute: emp.cabRoute || '',
        teamLeader: emp.teamLeader || '',
        shiftStartHour: emp.shiftStartHour || 0,
        shiftEndHour: emp.shiftEndHour || 0,
        
        transportStatus: dailyStatus?.transportStatus || null,
        transportStatusUpdatedBy: dailyStatus?.transportStatusUpdatedBy ? {
          username: dailyStatus.transportStatusUpdatedBy.username,
          department: dailyStatus.transportStatusUpdatedBy.department
        } : null,
        transportStatusUpdatedAt: dailyStatus?.transportStatusUpdatedAt || null,

        departmentStatus: dailyStatus?.departmentStatus || null,
        departmentStatusUpdatedBy: dailyStatus?.departmentStatusUpdatedBy ? {
          username: dailyStatus.departmentStatusUpdatedBy.username,
          department: dailyStatus.departmentStatusUpdatedBy.department
        } : null,
        departmentStatusUpdatedAt: dailyStatus?.departmentStatusUpdatedAt || null,

        transportArrivalTime: dailyStatus?.transportArrivalTime || null,
        transportUpdatedBy: dailyStatus?.transportUpdatedBy ? {
          username: dailyStatus.transportUpdatedBy.username,
          department: dailyStatus.transportUpdatedBy.department
        } : null,
        transportUpdatedAt: dailyStatus?.transportUpdatedAt || null,

        departmentArrivalTime: dailyStatus?.departmentArrivalTime || null,
        departmentUpdatedBy: dailyStatus?.departmentUpdatedBy ? {
          username: dailyStatus.departmentUpdatedBy.username,
          department: dailyStatus.departmentUpdatedBy.department
        } : null,
        departmentUpdatedAt: dailyStatus?.departmentUpdatedAt || null
      };
    });

    const summary = {
      totalEmployees: allEmployees.length,
      employeesWithTransportStatus: formattedEmployees.filter(e => e.transportStatus).length,
      employeesWithDepartmentStatus: formattedEmployees.filter(e => e.departmentStatus).length,
      employeesWithTransportArrival: formattedEmployees.filter(e => e.transportArrivalTime).length,
      employeesWithDepartmentArrival: formattedEmployees.filter(e => e.departmentArrivalTime).length,
      
      transportStatusBreakdown: {},
      departmentStatusBreakdown: {}
    };

    formattedEmployees.forEach(emp => {
      if (emp.transportStatus) {
        summary.transportStatusBreakdown[emp.transportStatus] = 
          (summary.transportStatusBreakdown[emp.transportStatus] || 0) + 1;
      }
      if (emp.departmentStatus) {
        summary.departmentStatusBreakdown[emp.departmentStatus] = 
          (summary.departmentStatusBreakdown[emp.departmentStatus] || 0) + 1;
      }
    });

    const weeksForDropdown = roster.weeks
      .filter(w => w !== null)
      .map(w => ({
        weekNumber: w.weekNumber,
        startDate: w.startDate,
        endDate: w.endDate,
        employeeCount: w.employees?.filter(e => e !== null).length || 0
      }));

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(week.endDate);
    
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    
    let canEdit = false;
    let editMessage = "";
    
    if (currentDate < weekStartDate) {
      canEdit = false;
      editMessage = "Week hasn't started yet";
    } else if (currentDate > weekEndDate) {
      canEdit = false;
      editMessage = "Week has ended";
    } else {
      canEdit = true;
      editMessage = "Current week - edits allowed";
    }

    const response = {
      success: true,
      message: "Transport details fetched successfully for Super Admin",
      data: {
        rosterId: roster._id, 
        month: roster.month,
        year: roster.year,
        rosterStartDate: roster.rosterStartDate,
        rosterEndDate: roster.rosterEndDate,
        weekNumber: parseInt(weekNumber),
        weekStartDate: week.startDate,
        weekEndDate: week.endDate,
        selectedDate: date,
        canEdit,
        editMessage,
        employees: formattedEmployees,
        weeks: weeksForDropdown,
        summary,
        userInfo: {
          accountType: user.accountType,
          username: user.username,
          department: user.department
        }
      }
    };

    console.log(`👑 SuperAdmin: Returning ${formattedEmployees.length} employees with full details`);
    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ SuperAdmin Transport Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack
    });
  }
};
export const getDepartmentWiseAttendance = async (req, res) => {
  try {
    const { rosterId, weekNumber, date } = req.params;
    const user = req.user;

    console.log("📊 Fetching department-wise attendance:", {
      rosterId, 
      weekNumber: parseInt(weekNumber), 
      date,
      user: user.username,
      userDepartment: user.department,
      accountType: user.accountType
    });

    if (!rosterId || !weekNumber || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, date"
      });
    }

    const roster = await Roster.findById(rosterId);

    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    // Find the specific week
    const week = roster.weeks.find(w => w && w.weekNumber === parseInt(weekNumber));
    
    if (!week) {
      return res.status(404).json({ 
        success: false, 
        message: `Week ${weekNumber} not found in roster.`
      });
    }

    console.log(`📅 Found week ${weekNumber} with ${week.employees?.filter(e => e).length || 0} employees`);

    let filteredEmployees = [];

    // 👑 SUPERADMIN - sees all employees
    if (user.accountType === "superAdmin") {
      filteredEmployees = (week.employees || []).filter(emp => emp !== null);
      console.log(`👑 SuperAdmin: Access to all departments`);
    }
    
    // 🚌 TRANSPORT - sees all employees
    else if (user.department === "Transport") {
      filteredEmployees = (week.employees || []).filter(emp => emp !== null);
      console.log(`🚌 Transport: Access to all departments`);
    }
    
    // 👥 DEPARTMENT USERS - see only their department
    else {
      const normalizedUsername = String(user.username || "").trim().toLowerCase();
      const normalizedUserId = String(user._id || user.id || "").trim();

      // Pehle sirf apne department ke employees filter karo
      filteredEmployees = (week.employees || []).filter(emp => {
        if (!emp) return false;
        return emp.department === user.department;
      });

      const isSelfEmployee = (emp) => {
        if (!emp) return false;
        const empUserId = String(emp.userId || emp.userID || "").trim();
        const empUsername = String(emp.username || "").trim().toLowerCase();
        const empName = String(emp.name || "").trim().toLowerCase();
        return Boolean(
          (normalizedUserId && empUserId && empUserId === normalizedUserId) ||
          (normalizedUsername && empUsername && empUsername === normalizedUsername) ||
          (normalizedUsername && empName && empName === normalizedUsername)
        );
      };

      // Check if user is team leader - then filter by team
      const isTeamLeader = filteredEmployees.some(
        (emp) => String(emp.teamLeader || "").trim().toLowerCase() === normalizedUsername
      );
      if (isTeamLeader) {
        filteredEmployees = filteredEmployees.filter(
          (emp) =>
            String(emp.teamLeader || "").trim().toLowerCase() === normalizedUsername ||
            isSelfEmployee(emp)
        );
        console.log(`Team Leader ${user.username}: Showing only team members`);
      } else {
        console.log(`Department User ${user.department}: Showing all department employees`);
      }
    }

    // Format employees with all required fields
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Pehle saare employees ko format karo
    const formattedEmployees = filteredEmployees.map(emp => {
      // Find daily status for selected date
      const dailyStatus = (emp.dailyStatus || []).find(d => {
        const dDate = new Date(d.date);
        dDate.setHours(0, 0, 0, 0);
        return dDate.getTime() === selectedDate.getTime();
      });

      return {
        _id: emp._id,
        userId: emp.userId,
        name: emp.name || 'Unknown',
        username: emp.username || '',
        department: emp.department || 'N/A',
        transport: emp.transport || 'No',
        cabRoute: emp.cabRoute || '',
        teamLeader: emp.teamLeader || '',
        shiftStartHour: emp.shiftStartHour || 0,
        shiftEndHour: emp.shiftEndHour || 0,
        
        // Attendance data for selected date
        transportStatus: dailyStatus?.transportStatus || '',
        departmentStatus: dailyStatus?.departmentStatus || '',
        transportArrivalTime: dailyStatus?.transportArrivalTime || null,
        departmentArrivalTime: dailyStatus?.departmentArrivalTime || null,
        
        // Optional: tracking info agar chahiye to
        transportStatusUpdatedBy: dailyStatus?.transportStatusUpdatedBy || null,
        transportStatusUpdatedAt: dailyStatus?.transportStatusUpdatedAt || null,
        departmentStatusUpdatedBy: dailyStatus?.departmentStatusUpdatedBy || null,
        departmentStatusUpdatedAt: dailyStatus?.departmentStatusUpdatedAt || null,
        transportUpdatedBy: dailyStatus?.transportUpdatedBy || null,
        transportUpdatedAt: dailyStatus?.transportUpdatedAt || null,
        departmentUpdatedBy: dailyStatus?.departmentUpdatedBy || null,
        departmentUpdatedAt: dailyStatus?.departmentUpdatedAt || null
      };
    });

    // 🔥 IMPORTANT: Department-wise grouping
    const departmentWiseData = {};
    
    formattedEmployees.forEach(emp => {
      const dept = emp.department;
      if (!departmentWiseData[dept]) {
        departmentWiseData[dept] = {
          department: dept,
          totalEmployees: 0,
          employees: [],
          summary: {
            transportPresent: 0,
            departmentPresent: 0,
            transportStatusCounts: {},
            departmentStatusCounts: {},
            arrivalsRecorded: {
              transport: 0,
              department: 0
            }
          }
        };
      }
      
      // Add employee to department
      departmentWiseData[dept].employees.push(emp);
      departmentWiseData[dept].totalEmployees++;
      
      // Update summary counts
      if (emp.transportStatus === 'P') departmentWiseData[dept].summary.transportPresent++;
      if (emp.departmentStatus === 'P') departmentWiseData[dept].summary.departmentPresent++;
      
      // Count statuses
      if (emp.transportStatus) {
        departmentWiseData[dept].summary.transportStatusCounts[emp.transportStatus] = 
          (departmentWiseData[dept].summary.transportStatusCounts[emp.transportStatus] || 0) + 1;
      }
      
      if (emp.departmentStatus) {
        departmentWiseData[dept].summary.departmentStatusCounts[emp.departmentStatus] = 
          (departmentWiseData[dept].summary.departmentStatusCounts[emp.departmentStatus] || 0) + 1;
      }
      
      if (emp.transportArrivalTime) departmentWiseData[dept].summary.arrivalsRecorded.transport++;
      if (emp.departmentArrivalTime) departmentWiseData[dept].summary.arrivalsRecorded.department++;
    });

    // Convert to array for easy frontend iteration
    const departmentWiseArray = Object.values(departmentWiseData);

    // Get all weeks for dropdown
    const weeksForDropdown = roster.weeks
      .filter(w => w !== null)
      .map(w => ({
        weekNumber: w.weekNumber,
        startDate: w.startDate,
        endDate: w.endDate,
        employeeCount: w.employees?.filter(e => e !== null).length || 0
      }));

    // Get all unique departments in this week (for super admin filter)
    const allDepartments = [...new Set(
      (week.employees || [])
        .filter(emp => emp && emp.department)
        .map(emp => emp.department)
    )];

    // Edit permissions
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(week.endDate);
    
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    
    let canEdit = false;
    let editMessage = "";
    
    if (currentDate < weekStartDate) {
      canEdit = false;
      editMessage = "Cannot edit before the week starts";
    } else if (currentDate > weekEndDate) {
      canEdit = false;
      editMessage = "Cannot edit after the week has ended";
    } else {
      canEdit = true;
      editMessage = "Can edit during current week";
    }

    // Overall summary
    const overallSummary = {
      totalEmployees: formattedEmployees.length,
      totalDepartments: departmentWiseArray.length,
      departments: allDepartments,
      transportPresent: formattedEmployees.filter(e => e.transportStatus === 'P').length,
      departmentPresent: formattedEmployees.filter(e => e.departmentStatus === 'P').length,
      transportArrivals: formattedEmployees.filter(e => e.transportArrivalTime).length,
      departmentArrivals: formattedEmployees.filter(e => e.departmentArrivalTime).length
    };

    const response = {
      success: true,
      message: user.accountType === "superAdmin" ? 
        "Department-wise attendance for all departments" : 
        `Department-wise attendance for ${user.department}`,
      data: {
        // Basic info
        rosterInfo: {
          rosterId: roster._id,
          month: roster.month,
          year: roster.year
        },
        weekInfo: {
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          selectedDate: date
        },
        
        // Permissions
        permissions: {
          canEdit,
          editMessage,
          userRole: user.accountType,
          userDepartment: user.department,
          isSuperAdmin: user.accountType === "superAdmin",
          isTransport: user.department === "Transport",
          viewAllDepartments: user.accountType === "superAdmin" || user.department === "Transport"
        },
        
        // 🔥 MAIN DATA: Department-wise attendance
        departmentWise: departmentWiseArray,
        
        // Also keep flat list if needed
        allEmployees: formattedEmployees,
        
        // Summary
        summary: overallSummary,
        
        // Filters for UI
        filters: {
          availableDepartments: allDepartments,
          weeks: weeksForDropdown,
          currentDate: currentDate
        }
      }
    };

    console.log(`📤 Sending response: ${departmentWiseArray.length} departments, ${formattedEmployees.length} total employees`);
    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ Department-wise Attendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
      error: error.stack
    });
  }
};
// export const updatePunchTimes = async (req, res) => {
//   try {
//     const { 
//       rosterId, 
//       weekNumber, 
//       employeeId, 
//       date, 
//       punchIn, 
//       punchOut 
//     } = req.body;
    
//     const user = req.user;

//     // Validation
//     if (!rosterId || !weekNumber || !employeeId || !date) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: rosterId, weekNumber, employeeId, date"
//       });
//     }

//     // Only HR and Super Admin can update punch times
//     if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only HR and Super Admin can update punch in/out times"
//       });
//     }

//     // Find roster
//     const roster = await Roster.findById(rosterId);
//     if (!roster) {
//       return res.status(404).json({ success: false, message: "Roster not found" });
//     }

//     // Find week
//     const week = roster.weeks.find(w => w.weekNumber === weekNumber);
//     if (!week) {
//       return res.status(404).json({ success: false, message: "Week not found" });
//     }

//     // Find employee
//     const employee = week.employees.id(employeeId);
//     if (!employee) {
//       return res.status(404).json({ success: false, message: "Employee not found" });
//     }

//     // Process date
//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format"
//       });
//     }
//     selectedDate.setHours(0, 0, 0, 0);

//     // Find or create daily status
//     let daily = employee.dailyStatus.find(d => {
//       const dDate = new Date(d.date);
//       dDate.setHours(0, 0, 0, 0);
//       return dDate.getTime() === selectedDate.getTime();
//     });

//     const changes = [];
//     const isNewDay = !daily;

//     if (isNewDay) {
//       daily = { 
//         date: selectedDate,
//         status: employee.dailyStatus?.[0]?.status || "P",
//         punchIn: null,
//         punchOut: null,
//         totalHours: null,
//         punchUpdatedBy: null,
//         punchUpdatedAt: null,
//         isPunchCalculated: false,
//         transportStatus: "",
//         departmentStatus: "",
//         transportStatusUpdatedBy: null,
//         transportStatusUpdatedAt: null,
//         departmentStatusUpdatedBy: null,
//         departmentStatusUpdatedAt: null,
//         transportArrivalTime: null,
//         departmentArrivalTime: null,
//         transportUpdatedBy: null,
//         transportUpdatedAt: null,
//         departmentUpdatedBy: null,
//         departmentUpdatedAt: null
//       };
//       employee.dailyStatus.push(daily);
//       daily = employee.dailyStatus[employee.dailyStatus.length - 1];
//     }

//     // Track old values for edit history
//     const oldPunchIn = daily.punchIn;
//     const oldPunchOut = daily.punchOut;
//     const oldTotalHours = daily.totalHours;

//     // Update punch times
//     if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//       if (!timeRegex.test(punchIn)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch in time format. Please use HH:MM format (e.g., 09:30)"
//         });
//       }

//       const [hours, minutes] = punchIn.split(':').map(Number);
//       const newPunchIn = new Date(selectedDate);
//       newPunchIn.setHours(hours, minutes, 0, 0);
      
//       if (isNaN(newPunchIn.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch in time"
//         });
//       }
      
//       daily.punchIn = newPunchIn;
//     }

//     if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//       if (!timeRegex.test(punchOut)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch out time format. Please use HH:MM format (e.g., 18:30)"
//         });
//       }

//       const [hours, minutes] = punchOut.split(':').map(Number);
//       const newPunchOut = new Date(selectedDate);
//       newPunchOut.setHours(hours, minutes, 0, 0);
      
//       // FIXED: Only add a day if it's an overnight shift AND the time is actually less
//       // For early morning shifts (1 AM to 9 AM), both times are on the same day
//       if (daily.punchIn) {
//         // Check if it's an overnight shift (punch out time is less than punch in time)
//         // This means it crosses midnight (e.g., 10 PM to 6 AM)
//         if (newPunchOut < daily.punchIn) {
//           newPunchOut.setDate(newPunchOut.getDate() + 1);
//         }
//       }
      
//       if (isNaN(newPunchOut.getTime())) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch out time"
//         });
//       }
      
//       daily.punchOut = newPunchOut;
//     }

//     // Calculate total hours if both punch in and out are present
//     if (daily.punchIn && daily.punchOut) {
//       const punchInTime = daily.punchIn.getTime();
//       const punchOutTime = daily.punchOut.getTime();
      
//       const hoursWorked = (punchOutTime - punchInTime) / (1000 * 60 * 60);
//       daily.totalHours = Math.round(hoursWorked * 10) / 10;
      
//       // Validate that hours are within reasonable range (max 24 hours)
//       if (daily.totalHours > 24) {
//         return res.status(400).json({
//           success: false,
//           message: "Punch times cannot span more than 24 hours"
//         });
//       }
      
//       // Set isPunchCalculated to true to indicate punches exist
//       daily.isPunchCalculated = true;
//     } else {
//       daily.totalHours = null;
//       daily.isPunchCalculated = false;
//     }

//     // Track changes for edit history
//     if (oldPunchIn?.getTime() !== daily.punchIn?.getTime()) {
//       changes.push({
//         field: `punchIn (${date})`,
//         oldValue: oldPunchIn || null,
//         newValue: daily.punchIn || null
//       });
//     }

//     if (oldPunchOut?.getTime() !== daily.punchOut?.getTime()) {
//       changes.push({
//         field: `punchOut (${date})`,
//         oldValue: oldPunchOut || null,
//         newValue: daily.punchOut || null
//       });
//     }

//     if (oldTotalHours !== daily.totalHours) {
//       changes.push({
//         field: `totalHours (${date})`,
//         oldValue: oldTotalHours || null,
//         newValue: daily.totalHours || null
//       });
//     }

//     // Update tracking info
//     daily.punchUpdatedBy = user._id;
//     daily.punchUpdatedAt = new Date();

//     // Add edit history if there are changes
//     if (changes.length > 0) {
//       roster.editHistory.push({
//         editedBy: user._id,
//         editedByName: user.username,
//         accountType: user.accountType,
//         actionType: "punch-update",
//         weekNumber,
//         employeeId: employee._id,
//         employeeName: employee.name,
//         changes
//       });
//     }

//     // Mark as modified and save
//     employee.markModified('dailyStatus');
//     await roster.save();

//     return res.status(200).json({
//       success: true,
//       message: "Punch times updated successfully",
//       data: {
//         punchIn: daily.punchIn,
//         punchOut: daily.punchOut,
//         totalHours: daily.totalHours,
//         departmentStatus: daily.departmentStatus,
//         isPunchCalculated: daily.isPunchCalculated
//       }
//     });

//   } catch (error) {
//     console.error("Punch Update Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
export const updatePunchTimes = async (req, res) => {
  try {
    const { 
      rosterId, 
      weekNumber, 
      employeeId, 
      date, 
      punchIn, 
      punchOut 
    } = req.body;
    
    const user = req.user;

    // Validation
    if (!rosterId || !weekNumber || !employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, employeeId, date"
      });
    }

    // Only HR and Super Admin can update punch times
    if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can update punch in/out times"
      });
    }

    // Find roster
    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const weekCandidates = (roster.weeks || []).filter(
      (w) => w && Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
    );
    if (!weekCandidates.length) {
      return res.status(404).json({ success: false, message: "Week not found" });
    }

    const week = weekCandidates.find((w) => w.employees?.id(employeeId));
    const employee = week?.employees?.id(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Parse date parts
    const [year, month, day] = date.split('-').map(Number);
    
    // Create base date in UTC
    const selectedDate = new Date(Date.UTC(year, month-1, day, 0, 0, 0));
    
    // Find or create daily status
    let daily = employee.dailyStatus.find(d => {
      const dDate = new Date(d.date);
      return dDate.toISOString().split('T')[0] === date;
    });

    const changes = [];
    const isNewDay = !daily;

    if (isNewDay) {
      daily = { 
        date: selectedDate,
        status: employee.dailyStatus?.[0]?.status || "P",
        punchIn: null,
        punchOut: null,
        totalHours: null,
        punchUpdatedBy: null,
        punchUpdatedAt: null,
        isPunchCalculated: false,
        transportStatus: "",
        departmentStatus: "",
        transportStatusUpdatedBy: null,
        transportStatusUpdatedAt: null,
        departmentStatusUpdatedBy: null,
        departmentStatusUpdatedAt: null,
        transportArrivalTime: null,
        departmentArrivalTime: null,
        transportUpdatedBy: null,
        transportUpdatedAt: null,
        departmentUpdatedBy: null,
        departmentUpdatedAt: null
      };
      employee.dailyStatus.push(daily);
      daily = employee.dailyStatus[employee.dailyStatus.length - 1];
    }

    // Track old values
    const oldPunchIn = daily.punchIn;
    const oldPunchOut = daily.punchOut;
    const oldTotalHours = daily.totalHours;

    // Get existing IST times from current daily status (if they exist)
    let istPunchInHours = null;
    let istPunchInMinutes = null;
    let istPunchOutHours = null;
    let istPunchOutMinutes = null;
    let isNextDay = false;

    // If there's an existing punch in, convert it to IST for calculation
    if (daily.punchIn) {
      const punchInDate = new Date(daily.punchIn);
      // Convert UTC to IST (add 5:30)
      let utcHours = punchInDate.getUTCHours();
      let utcMinutes = punchInDate.getUTCMinutes();
      
      let istHours = utcHours + 5;
      let istMinutes = utcMinutes + 30;
      
      if (istMinutes >= 60) {
        istMinutes -= 60;
        istHours += 1;
      }
      
      if (istHours >= 24) {
        istHours -= 24;
      }
      
      istPunchInHours = istHours;
      istPunchInMinutes = istMinutes;
    }

    // If there's an existing punch out, convert it to IST for calculation
    if (daily.punchOut) {
      const punchOutDate = new Date(daily.punchOut);
      let utcHours = punchOutDate.getUTCHours();
      let utcMinutes = punchOutDate.getUTCMinutes();
      const punchOutDay = punchOutDate.getUTCDate();
      
      let istHours = utcHours + 5;
      let istMinutes = utcMinutes + 30;
      
      if (istMinutes >= 60) {
        istMinutes -= 60;
        istHours += 1;
      }
      
      if (istHours >= 24) {
        istHours -= 24;
      }
      
      istPunchOutHours = istHours;
      istPunchOutMinutes = istMinutes;
      
      // Check if punch out is on next day
      if (punchOutDay > day) {
        isNextDay = true;
      }
    }

    // Update punch in
    if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(punchIn)) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch in time format. Please use HH:MM format (e.g., 09:30)"
        });
      }

      [istPunchInHours, istPunchInMinutes] = punchIn.split(':').map(Number);
      
      // Convert IST to UTC for storage
      let utcHours = istPunchInHours - 5;
      let utcMinutes = istPunchInMinutes - 30;
      
      if (utcMinutes < 0) {
        utcMinutes += 60;
        utcHours -= 1;
      }
      
      if (utcHours < 0) {
        utcHours += 24;
      }
      
      const newPunchIn = new Date(Date.UTC(year, month-1, day, utcHours, utcMinutes, 0));
      
      if (isNaN(newPunchIn.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch in time"
        });
      }
      
      daily.punchIn = newPunchIn;
    }

    // Update punch out
    if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(punchOut)) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch out time format. Please use HH:MM format (e.g., 18:30)"
        });
      }

      [istPunchOutHours, istPunchOutMinutes] = punchOut.split(':').map(Number);
      
      // Check if this is next day (overnight shift)
      if (istPunchInHours !== null && istPunchOutHours < istPunchInHours) {
        isNextDay = true;
      } else {
        isNextDay = false;
      }
      
      // Convert IST to UTC for storage
      let utcHours = istPunchOutHours - 5;
      let utcMinutes = istPunchOutMinutes - 30;
      
      if (utcMinutes < 0) {
        utcMinutes += 60;
        utcHours -= 1;
      }
      
      if (utcHours < 0) {
        utcHours += 24;
      }
      
      const targetDay = isNextDay ? day + 1 : day;
      const newPunchOut = new Date(Date.UTC(year, month-1, targetDay, utcHours, utcMinutes, 0));
      
      if (isNaN(newPunchOut.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch out time"
        });
      }
      
      daily.punchOut = newPunchOut;
    }

    // Calculate total hours using IST times (either from existing or new)
    if (istPunchInHours !== null && istPunchOutHours !== null) {
      // Convert both times to minutes since midnight in IST
      const punchInTotalMinutes = istPunchInHours * 60 + istPunchInMinutes;
      let punchOutTotalMinutes = istPunchOutHours * 60 + istPunchOutMinutes;
      
      // If it's next day, add 24 hours (1440 minutes)
      if (isNextDay) {
        punchOutTotalMinutes += 24 * 60;
      }
      
      const diffMinutes = punchOutTotalMinutes - punchInTotalMinutes;
      const hoursWorked = diffMinutes / 60;
      daily.totalHours = Math.round(hoursWorked * 10) / 10;
      
      // Validate hours
      if (daily.totalHours > 24) {
        return res.status(400).json({
          success: false,
          message: "Punch times cannot span more than 24 hours"
        });
      }
      
      daily.isPunchCalculated = true;
    } else {
      daily.totalHours = null;
      daily.isPunchCalculated = false;
    }

    // Track changes for edit history
    if (oldPunchIn?.getTime() !== daily.punchIn?.getTime()) {
      changes.push({
        field: `punchIn (${date})`,
        oldValue: oldPunchIn || null,
        newValue: daily.punchIn || null
      });
    }

    if (oldPunchOut?.getTime() !== daily.punchOut?.getTime()) {
      changes.push({
        field: `punchOut (${date})`,
        oldValue: oldPunchOut || null,
        newValue: daily.punchOut || null
      });
    }

    if (oldTotalHours !== daily.totalHours) {
      changes.push({
        field: `totalHours (${date})`,
        oldValue: oldTotalHours || null,
        newValue: daily.totalHours || null
      });
    }

    // Update tracking info
    daily.punchUpdatedBy = user._id;
    daily.punchUpdatedAt = new Date();

    // Add edit history if there are changes
    if (changes.length > 0) {
      roster.editHistory.push({
        editedBy: user._id,
        editedByName: user.username,
        accountType: user.accountType,
        actionType: "punch-update",
        weekNumber: parsedWeekNumber,
        employeeId: employee._id,
        employeeName: employee.name,
        changes
      });
    }

    // Mark as modified and save
    employee.markModified('dailyStatus');
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Punch times updated successfully",
      data: {
        punchIn: daily.punchIn,
        punchOut: daily.punchOut,
        totalHours: daily.totalHours,
        departmentStatus: daily.departmentStatus,
        isPunchCalculated: daily.isPunchCalculated
      }
    });

  } catch (error) {
    console.error("Punch Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// export const bulkUpdatePunchTimes = async (req, res) => {
//   try {
//     const { 
//       rosterId, 
//       weekNumber, 
//       employeeIds, 
//       date, 
//       punchIn, 
//       punchOut 
//     } = req.body;
    
//     const user = req.user;

//     // Validation
//     if (!rosterId || !weekNumber || !employeeIds || !date || !Array.isArray(employeeIds) || employeeIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: rosterId, weekNumber, employeeIds (non-empty array), date"
//       });
//     }

//     // Only HR and Super Admin can update punch times
//     if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only HR and Super Admin can update punch in/out times"
//       });
//     }

//     // Find roster
//     const roster = await Roster.findById(rosterId);
//     if (!roster) {
//       return res.status(404).json({ success: false, message: "Roster not found" });
//     }

//     // Find week
//     const week = roster.weeks.find(w => w.weekNumber === weekNumber);
//     if (!week) {
//       return res.status(404).json({ success: false, message: "Week not found" });
//     }

//     // Process date
//     const selectedDate = new Date(date);
//     if (isNaN(selectedDate.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid date format"
//       });
//     }
//     selectedDate.setHours(0, 0, 0, 0);

//     // Validate time formats if provided
//     if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//       if (!timeRegex.test(punchIn)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch in time format. Please use HH:MM format (e.g., 09:30)"
//         });
//       }
//     }

//     if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
//       const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
//       if (!timeRegex.test(punchOut)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid punch out time format. Please use HH:MM format (e.g., 18:30)"
//         });
//       }
//     }

//     // Results tracking
//     const results = [];
//     const errors = [];

//     // Process each employee
//     for (const employeeId of employeeIds) {
//       try {
//         // Find employee
//         const employee = week.employees.id(employeeId);
//         if (!employee) {
//           errors.push({ employeeId, error: "Employee not found" });
//           continue;
//         }

//         // Find or create daily status
//         let daily = employee.dailyStatus.find(d => {
//           const dDate = new Date(d.date);
//           dDate.setHours(0, 0, 0, 0);
//           return dDate.getTime() === selectedDate.getTime();
//         });

//         const changes = [];
//         const isNewDay = !daily;

//         if (isNewDay) {
//           daily = { 
//             date: selectedDate,
//             status: employee.dailyStatus?.[0]?.status || "P",
//             punchIn: null,
//             punchOut: null,
//             totalHours: null,
//             punchUpdatedBy: null,
//             punchUpdatedAt: null,
//             isPunchCalculated: false,
//             transportStatus: "",
//             departmentStatus: "",
//             transportStatusUpdatedBy: null,
//             transportStatusUpdatedAt: null,
//             departmentStatusUpdatedBy: null,
//             departmentStatusUpdatedAt: null,
//             transportArrivalTime: null,
//             departmentArrivalTime: null,
//             transportUpdatedBy: null,
//             transportUpdatedAt: null,
//             departmentUpdatedBy: null,
//             departmentUpdatedAt: null
//           };
//           employee.dailyStatus.push(daily);
//           daily = employee.dailyStatus[employee.dailyStatus.length - 1];
//         }

//         // Track old values
//         const oldPunchIn = daily.punchIn;
//         const oldPunchOut = daily.punchOut;
//         const oldTotalHours = daily.totalHours;

//         // Update punch times if provided
//         if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
//           const [hours, minutes] = punchIn.split(':').map(Number);
//           const newPunchIn = new Date(selectedDate);
//           newPunchIn.setHours(hours, minutes, 0, 0);
//           daily.punchIn = newPunchIn;
//         }

//         // FIXED: Update punch out with proper overnight shift detection
//         if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
//           const [hours, minutes] = punchOut.split(':').map(Number);
//           const newPunchOut = new Date(selectedDate);
//           newPunchOut.setHours(hours, minutes, 0, 0);
          
//           // FIXED: Only add a day if it's an overnight shift AND the time is actually less
//           // For early morning shifts (1 AM to 9 AM), both times are on the same day
//           if (daily.punchIn) {
//             // Check if it's an overnight shift (punch out time is less than punch in time)
//             // This means it crosses midnight (e.g., 10 PM to 6 AM)
//             if (newPunchOut < daily.punchIn) {
//               newPunchOut.setDate(newPunchOut.getDate() + 1);
//             }
//           }
          
//           daily.punchOut = newPunchOut;
//         }

//         // Calculate total hours if both punches present
//         if (daily.punchIn && daily.punchOut) {
//           const punchInTime = daily.punchIn.getTime();
//           const punchOutTime = daily.punchOut.getTime();
          
//           const hoursWorked = (punchOutTime - punchInTime) / (1000 * 60 * 60);
//           daily.totalHours = Math.round(hoursWorked * 10) / 10;
          
//           // Validate that hours are within reasonable range (max 24 hours)
//           if (daily.totalHours > 24) {
//             errors.push({ employeeId, error: "Punch times cannot span more than 24 hours" });
//             continue;
//           }
          
//           // Set isPunchCalculated to true to indicate punches exist
//           daily.isPunchCalculated = true;
          
//         } else {
//           daily.totalHours = null;
//           daily.isPunchCalculated = false;
//         }

//         // Track changes for edit history
//         if (oldPunchIn?.getTime() !== daily.punchIn?.getTime()) {
//           changes.push({
//             field: `punchIn (${date})`,
//             oldValue: oldPunchIn || null,
//             newValue: daily.punchIn || null
//           });
//         }

//         if (oldPunchOut?.getTime() !== daily.punchOut?.getTime()) {
//           changes.push({
//             field: `punchOut (${date})`,
//             oldValue: oldPunchOut || null,
//             newValue: daily.punchOut || null
//           });
//         }

//         if (oldTotalHours !== daily.totalHours) {
//           changes.push({
//             field: `totalHours (${date})`,
//             oldValue: oldTotalHours || null,
//             newValue: daily.totalHours || null
//           });
//         }

//         // Update tracking info
//         daily.punchUpdatedBy = user._id;
//         daily.punchUpdatedAt = new Date();

//         // Add edit history if there are changes
//         if (changes.length > 0) {
//           roster.editHistory.push({
//             editedBy: user._id,
//             editedByName: user.username,
//             accountType: user.accountType,
//             actionType: "bulk-punch-update",
//             weekNumber,
//             employeeId: employee._id,
//             employeeName: employee.name,
//             changes
//           });
//         }

//         // Mark as modified
//         employee.markModified('dailyStatus');
        
//         results.push({
//           employeeId,
//           success: true,
//           data: {
//             punchIn: daily.punchIn,
//             punchOut: daily.punchOut,
//             totalHours: daily.totalHours,
//             departmentStatus: daily.departmentStatus,
//             isPunchCalculated: daily.isPunchCalculated
//           }
//         });

//       } catch (err) {
//         console.error(`Error updating employee ${employeeId}:`, err);
//         errors.push({ employeeId, error: err.message });
//       }
//     }

//     // Save the roster with all updates
//     await roster.save();

//     return res.status(200).json({
//       success: true,
//       message: `Bulk punch update completed. Updated: ${results.length}, Failed: ${errors.length}`,
//       data: {
//         results,
//         errors,
//         updatedCount: results.length,
//         failedCount: errors.length
//       }
//     });

//   } catch (error) {
//     console.error("Bulk Punch Update Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

export const bulkUpdatePunchTimes = async (req, res) => {
  try {
    const { 
      rosterId, 
      weekNumber, 
      employeeIds, 
      date, 
      punchIn, 
      punchOut 
    } = req.body;
    
    const user = req.user;

    // Validation
    if (!rosterId || !weekNumber || !employeeIds || !date || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: rosterId, weekNumber, employeeIds (non-empty array), date"
      });
    }

    // Only HR and Super Admin can update punch times
    if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only HR and Super Admin can update punch in/out times"
      });
    }

    // Find roster
    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const weekCandidates = (roster.weeks || []).filter(
      (w) => w && Number.parseInt(w.weekNumber, 10) === parsedWeekNumber
    );
    if (!weekCandidates.length) {
      return res.status(404).json({ success: false, message: "Week not found" });
    }
    const [year, month, day] = date.split('-').map(Number);
    if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(punchIn)) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch in time format. Please use HH:MM format (e.g., 09:30)"
        });
      }
    }

    if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(punchOut)) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch out time format. Please use HH:MM format (e.g., 18:30)"
        });
      }
    }
    let istPunchInHours = null;
    let istPunchInMinutes = null;
    let istPunchOutHours = null;
    let istPunchOutMinutes = null;
    
    if (punchIn) {
      [istPunchInHours, istPunchInMinutes] = punchIn.split(':').map(Number);
    }
    
    if (punchOut) {
      [istPunchOutHours, istPunchOutMinutes] = punchOut.split(':').map(Number);
    }
    
    const isNextDay = istPunchInHours !== null && istPunchOutHours !== null && 
                      istPunchOutHours < istPunchInHours;

    const results = [];
    const errors = [];

    for (const employeeId of employeeIds) {
      try {
        const matchedWeek = weekCandidates.find((w) => w.employees?.id(employeeId));
        const employee = matchedWeek?.employees?.id(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: "Employee not found" });
          continue;
        }

        let daily = employee.dailyStatus.find(d => {
          return d.date.toISOString().split('T')[0] === date;
        });

        const changes = [];
        const isNewDay = !daily;

        if (isNewDay) {
          const selectedDate = new Date(Date.UTC(year, month-1, day, 0, 0, 0));
          daily = { 
            date: selectedDate,
            status: employee.dailyStatus?.[0]?.status || "P",
            punchIn: null,
            punchOut: null,
            totalHours: null,
            punchUpdatedBy: null,
            punchUpdatedAt: null,
            isPunchCalculated: false,
            transportStatus: "",
            departmentStatus: "",
            transportStatusUpdatedBy: null,
            transportStatusUpdatedAt: null,
            departmentStatusUpdatedBy: null,
            departmentStatusUpdatedAt: null,
            transportArrivalTime: null,
            departmentArrivalTime: null,
            transportUpdatedBy: null,
            transportUpdatedAt: null,
            departmentUpdatedBy: null,
            departmentUpdatedAt: null
          };
          employee.dailyStatus.push(daily);
          daily = employee.dailyStatus[employee.dailyStatus.length - 1];
        }

        const oldPunchIn = daily.punchIn;
        const oldPunchOut = daily.punchOut;
        const oldTotalHours = daily.totalHours;

        if (punchIn !== undefined && punchIn !== null && punchIn !== "") {
          let utcHours = istPunchInHours - 5;
          let utcMinutes = istPunchInMinutes - 30;
          
          if (utcMinutes < 0) {
            utcMinutes += 60;
            utcHours -= 1;
          }
          
          if (utcHours < 0) {
            utcHours += 24;
          }
          
          const newPunchIn = new Date(Date.UTC(year, month-1, day, utcHours, utcMinutes, 0));
          daily.punchIn = newPunchIn;
        }

        if (punchOut !== undefined && punchOut !== null && punchOut !== "") {
          let utcHours = istPunchOutHours - 5;
          let utcMinutes = istPunchOutMinutes - 30;
          
          if (utcMinutes < 0) {
            utcMinutes += 60;
            utcHours -= 1;
          }
          
          if (utcHours < 0) {
            utcHours += 24;
          }
          
          const targetDay = isNextDay ? day + 1 : day;
          const newPunchOut = new Date(Date.UTC(year, month-1, targetDay, utcHours, utcMinutes, 0));
          daily.punchOut = newPunchOut;
        }

        if (istPunchInHours !== null && istPunchOutHours !== null) {
          const punchInTotalMinutes = istPunchInHours * 60 + istPunchInMinutes;
          let punchOutTotalMinutes = istPunchOutHours * 60 + istPunchOutMinutes;
          
          if (isNextDay) {
            punchOutTotalMinutes += 24 * 60;
          }
          
          const diffMinutes = punchOutTotalMinutes - punchInTotalMinutes;
          const hoursWorked = diffMinutes / 60;
          daily.totalHours = Math.round(hoursWorked * 10) / 10;
          
          if (daily.totalHours > 24) {
            errors.push({ employeeId, error: "Punch times cannot span more than 24 hours" });
            continue;
          }
          
          daily.isPunchCalculated = true;
        } else {
          daily.totalHours = null;
          daily.isPunchCalculated = false;
        }

        if (oldPunchIn?.getTime() !== daily.punchIn?.getTime()) {
          changes.push({
            field: `punchIn (${date})`,
            oldValue: oldPunchIn || null,
            newValue: daily.punchIn || null
          });
        }

        if (oldPunchOut?.getTime() !== daily.punchOut?.getTime()) {
          changes.push({
            field: `punchOut (${date})`,
            oldValue: oldPunchOut || null,
            newValue: daily.punchOut || null
          });
        }

        if (oldTotalHours !== daily.totalHours) {
          changes.push({
            field: `totalHours (${date})`,
            oldValue: oldTotalHours || null,
            newValue: daily.totalHours || null
          });
        }

        daily.punchUpdatedBy = user._id;
        daily.punchUpdatedAt = new Date();

        if (changes.length > 0) {
          roster.editHistory.push({
            editedBy: user._id,
            editedByName: user.username,
            accountType: user.accountType,
            actionType: "bulk-punch-update",
            weekNumber: parsedWeekNumber,
            employeeId: employee._id,
            employeeName: employee.name,
            changes
          });
        }

        employee.markModified('dailyStatus');
        
        results.push({
          employeeId,
          success: true,
          data: {
            punchIn: daily.punchIn,
            punchOut: daily.punchOut,
            totalHours: daily.totalHours,
            departmentStatus: daily.departmentStatus,
            isPunchCalculated: daily.isPunchCalculated
          }
        });

      } catch (err) {
        console.error(`Error updating employee ${employeeId}:`, err);
        errors.push({ employeeId, error: err.message });
      }
    }

    await roster.save();

    return res.status(200).json({
      success: true,
      message: `Bulk punch update completed. Updated: ${results.length}, Failed: ${errors.length}`,
      data: {
        results,
        errors,
        updatedCount: results.length,
        failedCount: errors.length
      }
    });

  } catch (error) {
    console.error("Bulk Punch Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
