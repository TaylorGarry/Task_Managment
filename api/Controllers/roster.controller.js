import XLSX from "xlsx-js-style";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

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

    const processedEmployees = await Promise.all(
      employees.map(async (emp) => {
        let user = null;
        if (emp.name) {
          user = await User.findOne({ username: emp.name });
        }

        const dailyStatus = emp.dailyStatus.map((ds, index) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + index);
          return {
            date: date.toISOString(),
            status: ds.status || "P"
          };
        });

        const woCount = dailyStatus.filter(d => d.status === "WO").length;
        if (woCount > 2) {
          throw new Error(`Employee ${emp.name} cannot have more than 2 week-offs in a week`);
        }
        if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
          throw new Error(`Employee ${emp.name} must have both shift start and end hours`);
        }

        const shiftStartHour = parseInt(emp.shiftStartHour) || 0;
        const shiftEndHour = parseInt(emp.shiftEndHour) || 0;
        if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
          throw new Error(`Employee ${emp.name} has invalid shift hours`);
        }

        if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
          throw new Error(`Employee ${emp.name}: Shift hours must be between 0 and 23`);
        }

        const employeeData = {
          userId: user?._id || null,
          name: emp.name,
          transport: emp.transport || "",
          cabRoute: emp.cabRoute || "",
          shiftStartHour,
          shiftEndHour,
          dailyStatus,
          teamLeader: emp.teamLeader || ""
        };
        return employeeData;
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
    const existingWeekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
    if (existingWeekIndex !== -1) {
      if (action === "add") {
        const existingEmployees = roster.weeks[existingWeekIndex].employees;
        const existingEmployeeNames = existingEmployees.map(emp => emp.name);
        const newEmployees = processedEmployees.filter(newEmp => 
          !existingEmployeeNames.includes(newEmp.name)
        );
        if (newEmployees.length === 0) {
          return res.status(400).json({ 
            success: false,
            message: "All employees already exist in this roster week" 
          });
        }
        roster.weeks[existingWeekIndex].employees = [
          ...existingEmployees,
          ...newEmployees
        ];
        console.log(`Added ${newEmployees.length} new employees to existing week`);
      } else {
        roster.weeks[existingWeekIndex] = {
          weekNumber,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          employees: processedEmployees,
        };
        console.log("Replaced existing week with new data");
      }
    } else {
      roster.weeks.push({
        weekNumber,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        employees: processedEmployees,
      });
      console.log("Created new week");
    }
    if (!roster.updatedBy) {
      roster.updatedBy = createdBy;
    }
    await roster.save();
    console.log("Roster saved successfully");
    return res.status(201).json({ 
      success: true,
      message: action === "add" ? "Employees added to roster successfully" : "Roster week saved successfully", 
      roster 
    });
  } catch (error) {
    console.error("Error adding roster week:", error);
    return res.status(400).json({ 
      success: false,
      message: error.message || "Failed to add roster week" 
    });
  }
};
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

    const roster = await Roster.findOne({ month, year }).lean();
    if (!roster) {
      return res.status(404).json({ message: "Roster not found for this month/year" });
    }

    const crmUsers = await User.find({}, { username: 1 }).lean();
    const crmUsernames = crmUsers.map((u) => u.username);

    const filteredWeeks = roster.weeks.map((week) => {
      const filteredEmployees = week.employees.filter((emp) => crmUsernames.includes(emp.name));
      return {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        employees: filteredEmployees,
      };
    });

    return res.status(200).json({ month: roster.month, year: roster.year, weeks: filteredWeeks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const updateRoster = async (req, res) => {
  try {
    const { month, year, weekNumber, employeeId, updates } = req.body;
    const user = req.user;

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

    // Get overall roster dates
    const rosterStartDate = new Date(roster.rosterStartDate);
    const rosterEndDate = new Date(roster.rosterEndDate);
    
    // Set time to start and end of day for accurate comparison
    rosterStartDate.setHours(0, 0, 0, 0);
    rosterEndDate.setHours(23, 59, 59, 999);
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Determine roster status
    let rosterStatus = "";
    let canEdit = true;
    
    if (currentDate < rosterStartDate) {
      // Future roster: current date is before roster start date
      rosterStatus = "future";
      canEdit = true; // All authorized users can edit future rosters
    } else if (currentDate >= rosterStartDate && currentDate <= rosterEndDate) {
      // Active roster: current date is within roster dates
      rosterStatus = "active";
      // Only HR and SuperAdmin can edit active rosters
      canEdit = (user.accountType === "HR" || user.accountType === "superAdmin");
    } else if (currentDate > rosterEndDate) {
      // Past roster: current date is after roster end date
      rosterStatus = "past";
      // Only HR and SuperAdmin can edit past rosters
      canEdit = (user.accountType === "HR" || user.accountType === "superAdmin");
    }

    // Check if user has permission to edit
    if (!canEdit) {
      let errorMessage = "";
      
      if (rosterStatus === "active") {
        errorMessage = "Only HR and Super Admin can edit active rosters (rosters that are currently running)";
      } else if (rosterStatus === "past") {
        errorMessage = "Only HR and Super Admin can edit past rosters (rosters whose end date has passed)";
      }
      
      return res.status(403).json({
        success: false,
        message: errorMessage,
        rosterStatus: rosterStatus
      });
    }
    
    const week = roster.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) {
      return res.status(404).json({ 
        success: false,
        message: "Week not found in roster" 
      });
    }
    
    const employee = week.employees.id(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "Employee not found in this week" 
      });
    }

    // Update allowed fields to include teamLeader
    const allowedFields = [
      "name",
      "userId",
      "transport",
      "cabRoute",
      "shiftStartHour",
      "shiftEndHour",
      "dailyStatus",
      "teamLeader" // ADDED: Allow teamLeader field to be updated
    ];

    if (updates.shiftStartHour !== undefined || updates.shiftEndHour !== undefined) {
      if (updates.shiftStartHour === undefined || updates.shiftEndHour === undefined) {
        return res.status(400).json({
          success: false,
          message: "Both shiftStartHour and shiftEndHour are required when updating shift hours"
        });
      }
    }
    
    let shiftStartHour = employee.shiftStartHour;
    let shiftEndHour = employee.shiftEndHour;

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
    
    // Apply updates to allowed fields
    Object.keys(updates).forEach((field) => {
      if (allowedFields.includes(field)) {
        if (field !== "shiftStartHour" && field !== "shiftEndHour") {
          // Handle teamLeader field specifically (allow empty string)
          if (field === "teamLeader") {
            employee[field] = updates[field] || "";
          } else {
            employee[field] = updates[field];
          }
        }
      }
    });
    
    // Update shift hours
    employee.shiftStartHour = shiftStartHour;
    employee.shiftEndHour = shiftEndHour;
    
    if (employee.shiftStartHour === undefined || employee.shiftEndHour === undefined) {
      return res.status(400).json({
        success: false,
        message: "Both shiftStartHour and shiftEndHour are required for all employees"
      });
    }
    
    // Mark roster as updated
    roster.updatedBy = user._id;
    await roster.save();
    
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
      roster,
      updatedBy: user.username,
      accountType: user.accountType,
      rosterStatus: rosterStatus,
      canEdit: canEdit
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

    const formatDateWithDay = (date) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = dayNames[date.getDay()];
      const formattedDate = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      return `${formattedDate} ${day}`;
    };

    roster.weeks.forEach((week) => {
      const data = [];
      
      const header = ["Name", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
      
      if (week.employees[0]?.dailyStatus) {
        week.employees[0].dailyStatus.forEach((ds, dayIndex) => {
          const date = new Date(week.startDate);
          date.setDate(date.getDate() + dayIndex);
          header.push(formatDateWithDay(date));
        });
      }
      
      
      const summaryHeaders = [
        "Total WO",
        "Total L", 
        "Total P",
        "Total NCNS",
        "Total UL",
        "Total LWP", 
        "Total BL",
        "Total Empty"
      ];
      
      summaryHeaders.forEach(h => header.push(h));
      
      data.push(header);

      week.employees.forEach((emp) => {
        const row = [
          emp.name || "", 
          emp.transport || "", 
          emp.cabRoute || "", 
          emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
          emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
        ];
        
        
        let totalWO = 0;
        let totalL = 0;
        let totalP = 0;
        let totalNCNS = 0;
        let totalUL = 0;
        let totalLWP = 0;
        let totalBL = 0;
        let totalEmpty = 0;
        
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds.status || "";
            
            
            if (status === "" || status === null) {
              row.push("");
              totalEmpty++;
            } else {
              row.push(status);
              
              switch(status.toUpperCase()) {
                case "P": 
                  totalP++; 
                  break;
                case "WO": 
                  totalWO++; 
                  break;
                case "L": 
                  totalL++; 
                  break;
                case "NCNS": 
                  totalNCNS++; 
                  break;
                case "UL": 
                  totalUL++; 
                  break;
                case "LWP": 
                  totalLWP++; 
                  break;
                case "BL": 
                  totalBL++; 
                  break;
                default:
                  totalEmpty++;
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
        
       
        row.push(totalWO);
        row.push(totalL);
        row.push(totalP);
        row.push(totalNCNS);
        row.push(totalUL);
        row.push(totalLWP);
        row.push(totalBL);
        row.push(totalEmpty);
        
        data.push(row);
      });

     
      if (week.employees.length > 0) {
        const summaryRow = ["", "", "", "", "Summary"];
        
       
        const dayCount = week.employees[0]?.dailyStatus?.length || 0;
        
        
        for (let i = 0; i < dayCount; i++) {
          summaryRow.push("");
        }
        
        
        const totals = {
          WO: 0, L: 0, P: 0, NCNS: 0, UL: 0, LWP: 0, BL: 0, Empty: 0
        };
        
        week.employees.forEach(emp => {
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              const status = ds.status || "";
              if (status === "" || status === null) {
                totals.Empty++;
              } else {
                switch(status.toUpperCase()) {
                  case "P": totals.P++; break;
                  case "WO": totals.WO++; break;
                  case "L": totals.L++; break;
                  case "NCNS": totals.NCNS++; break;
                  case "UL": totals.UL++; break;
                  case "LWP": totals.LWP++; break;
                  case "BL": totals.BL++; break;
                  default:
                    totals.Empty++;
                }
              }
            });
          }
        });
        
       
        summaryRow.push(`WO: ${totals.WO}`);
        summaryRow.push(`L: ${totals.L}`);
        summaryRow.push(`P: ${totals.P}`);
        summaryRow.push(`NCNS: ${totals.NCNS}`);
        summaryRow.push(`UL: ${totals.UL}`);
        summaryRow.push(`LWP: ${totals.LWP}`);
        summaryRow.push(`BL: ${totals.BL}`);
        summaryRow.push(`Empty: ${totals.Empty}`);
        
        data.push(summaryRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        
      
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { v: header[C] || "" };
        }
        
        let bgColor = "4472C4";  
       
        const summaryStartCol = range.e.c - 7;  
        if (C >= summaryStartCol && C <= range.e.c) {  
          bgColor = "FF9900";  
        }
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      
      for (let R = 1; R <= range.e.r; ++R) {
        const isSummaryRow = (R === range.e.r);
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          
          
          if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { v: "" };
          }
          
          const cellStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "D9D9D9" } },
              bottom: { style: "thin", color: { rgb: "D9D9D9" } },
              left: { style: "thin", color: { rgb: "D9D9D9" } },
              right: { style: "thin", color: { rgb: "D9D9D9" } }
            }
          };
          
          const dayCount = week.employees[0]?.dailyStatus?.length || 0;
          const summaryStartCol = 5 + dayCount; 
          
          if (!isSummaryRow) {
            
            if (C >= 5 && C < summaryStartCol) { 
             
              const status = worksheet[cellAddress].v;
              if (status === "P") {
                cellStyle.fill = { fgColor: { rgb: "C6EFCE" } }; 
              } else if (status === "WO") {
                cellStyle.fill = { fgColor: { rgb: "FFC7CE" } }; 
              } else if (status === "L") {
                cellStyle.fill = { fgColor: { rgb: "FFEB9C" } }; 
              } else if (status === "NCNS") {
                cellStyle.fill = { fgColor: { rgb: "E7E6E6" } }; 
              } else if (status === "UL") {
                cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  
              } else if (status === "LWP") {
                cellStyle.fill = { fgColor: { rgb: "F8CBAD" } };  
              } else if (status === "BL") {
                cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };  
              } else if (status === "" || status === null) {
                cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  
              } else {
                cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  
              }
            } 
            
            else if (C >= summaryStartCol) {  
              cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  
              cellStyle.font = { bold: true };
              
              
              if (worksheet[cellAddress].v === undefined || worksheet[cellAddress].v === "") {
                worksheet[cellAddress].v = 0;
              }
            }
          } 
         
          else if (isSummaryRow) {
            cellStyle.font = { bold: true };
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; 
            
            
            if (C >= summaryStartCol) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; 
            }
          }
          
          worksheet[cellAddress].s = cellStyle;
        }
      }

      const dateCols = week.employees[0]?.dailyStatus?.length || 0;
      const colWidths = [
        { wch: 20 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 }, 
        { wch: 15 },  
        ...Array(dateCols).fill({ wch: 12 }),  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 },  
        { wch: 12 }    
      ];
      
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${week.weekNumber}`);
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
export const getAllRosters = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Roster.countDocuments(filter);
    
    const rosters = await Roster.find(filter)
      .sort({ year: -1, month: -1, 'weeks.weekNumber': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .lean();
    
    const formattedRosters = rosters.map(roster => {
      const processedWeeks = roster.weeks.map(week => {
        const processedEmployees = week.employees.map(employee => {
          const { userId, ...employeeWithoutUserId } = employee;
          return employeeWithoutUserId;
        });
        
        return {
          ...week,
          employees: processedEmployees,
          employeeCount: processedEmployees.length,
          totals: {
            totalWO: processedEmployees.reduce((sum, emp) => {
              return sum + (emp.dailyStatus?.filter(ds => ds?.status === 'WO').length || 0);
            }, 0),
            totalL: processedEmployees.reduce((sum, emp) => {
              return sum + (emp.dailyStatus?.filter(ds => ds?.status === 'L').length || 0);
            }, 0),
            totalP: processedEmployees.reduce((sum, emp) => {
              return sum + (emp.dailyStatus?.filter(ds => ds?.status === 'P').length || 0);
            }, 0),
            totalH: processedEmployees.reduce((sum, emp) => {
              return sum + (emp.dailyStatus?.filter(ds => ds?.status === 'H').length || 0);
            }, 0),
          }
        };
      });
      
      let totalEmployees = 0;
      const uniqueEmployees = new Set();
      
      processedWeeks.forEach(week => {
        totalEmployees += week.employees.length;
        week.employees.forEach(emp => {
          if (emp.name) uniqueEmployees.add(emp.name);
        });
      });
      
      return {
        _id: roster._id,
        month: roster.month,
        year: roster.year,
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
    console.error("Error fetching rosters:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};
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

    const formatDateWithDay = (date) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = dayNames[date.getDay()];
      const formattedDate = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      return `${formattedDate} ${day}`;
    };

    // Define all status types - ADDED LWD
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
      "LWD": "Last Working Day" // ADDED LWD
    };

    roster.weeks.forEach((week) => {
      const sortedEmployees = [...week.employees].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      const data = [];
      
      // Header row - ADDED "Team Leader" after "CAB Route"
      const header = ["Name", "Transport", "CAB Route", "Team Leader", "Shift Start Hour", "Shift End Hour"];
      
      const dayCount = sortedEmployees[0]?.dailyStatus?.length || 0;
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(week.startDate);
        date.setDate(date.getDate() + i);
        header.push(formatDateWithDay(date));
      }
      
      // Add total columns for each status type
      STATUS_TYPES.forEach(status => {
        header.push(`Total ${STATUS_NAMES[status] || status}`);
      });
      
      data.push(header);

      // Process each employee
      sortedEmployees.forEach((emp) => {
        const row = [
          emp.name || "", 
          emp.transport || "", 
          emp.cabRoute || "", 
          emp.teamLeader || "", // ADDED: Team Leader field
          emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
          emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
        ];
        
        // Initialize counters for all status types
        const statusCounts = {};
        STATUS_TYPES.forEach(status => {
          statusCounts[status] = 0;
        });
        
        // Process daily statuses
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds?.status || "";
            row.push(status);
            
            // Count each status type
            if (status && STATUS_TYPES.includes(status)) {
              statusCounts[status]++;
            }
          });
        } else {
          // Add empty cells for days if no daily status
          for (let i = 0; i < dayCount; i++) {
            row.push("");
          }
        }
        
        // Add totals for each status type
        STATUS_TYPES.forEach(status => {
          row.push(statusCounts[status]);
        });
        
        data.push(row);
      });

      // Add summary row if there are employees
      if (sortedEmployees.length > 0) {
        const summaryRow = ["", "", "", "", "", "Week Summary"];
        
        // Empty cells for days
        for (let i = 0; i < dayCount; i++) {
          summaryRow.push("");
        }
        
        // Calculate totals for each status type across all employees
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
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style header row
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        
        let bgColor = "4472C4";  // Blue for main headers
        if (C >= range.e.c - STATUS_TYPES.length) {  // Orange for total columns
          bgColor = "FF9900";  
        }
        
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Style data rows
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          
          const cellStyle = {
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "D9D9D9" } },
              bottom: { style: "thin", color: { rgb: "D9D9D9" } },
              left: { style: "thin", color: { rgb: "D9D9D9" } },
              right: { style: "thin", color: { rgb: "D9D9D9" } }
            }
          };
          
          const isSummaryRow = (R === range.e.r);
          const isEmployeeRow = !isSummaryRow;
          
          if (isEmployeeRow) {
            // UPDATED: Changed from 5 to 6 because we added Team Leader column
            if (C >= 6 && C < range.e.c - STATUS_TYPES.length) {  // Daily status cells
              const status = worksheet[cellAddress].v;
              // Apply color coding based on status
              switch(status) {
                case "P":
                  cellStyle.fill = { fgColor: { rgb: "C6EFCE" } };  // Green
                  break;
                case "WO":
                  cellStyle.fill = { fgColor: { rgb: "FFC7CE" } };  // Red
                  break;
                case "L":
                  cellStyle.fill = { fgColor: { rgb: "FFEB9C" } };  // Yellow
                  break;
                case "NCNS":
                  cellStyle.fill = { fgColor: { rgb: "FF9999" } };  // Dark red
                  break;
                case "UL":
                  cellStyle.fill = { fgColor: { rgb: "FFCC99" } };  // Orange
                  break;
                case "LWP":
                  cellStyle.fill = { fgColor: { rgb: "FFFF99" } };  // Light yellow
                  break;
                case "BL":
                  cellStyle.fill = { fgColor: { rgb: "CCCCFF" } };  // Lavender
                  break;
                case "H":
                  cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  // Light blue
                  break;
                case "LWD": // ADDED LWD color coding
                  cellStyle.fill = { fgColor: { rgb: "E6B8B7" } };  // Light red/pink
                  break;
                default:
                  cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  // White
              }
            } else if (C >= range.e.c - STATUS_TYPES.length) {  // Total columns
              cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  // Light orange
              cellStyle.font = { bold: true };
            }
          } else if (isSummaryRow) {
            cellStyle.font = { bold: true };
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray for summary
            
            if (C >= range.e.c - STATUS_TYPES.length) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue for status totals
            }
          }
          
          worksheet[cellAddress].s = cellStyle;
        }
      }

      // Set column widths - UPDATED: Added Team Leader column
      worksheet['!cols'] = [
        { wch: 20 },  // Name
        { wch: 15 },  // Transport
        { wch: 15 },  // CAB Route
        { wch: 15 },  // Team Leader
        { wch: 15 },  // Shift Start Hour
        { wch: 15 },  // Shift End Hour
        ...Array(dayCount).fill({ wch: 12 }),  // Daily status columns
        ...Array(STATUS_TYPES.length).fill({ wch: 15 })  // Total columns
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, `Week ${week.weekNumber}`);
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
      resetToDefault = false  
    } = req.body;

    const userId = req.user._id;

    if (!rosterId || !weekNumbers || !updateType) {
      return res.status(400).json({
        success: false,
        message: "rosterId, weekNumbers, and updateType are required"
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }

    const results = [];

    for (const weekNumber of weekNumbers) {
      const weekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
      
      if (weekIndex === -1) {
        results.push({
          weekNumber,
          success: false,
          message: `Week ${weekNumber} not found`
        });
        continue;
      }

      const week = roster.weeks[weekIndex];

      switch (updateType) {
        case 'add':
          const addedEmployees = await addEmployeesToWeek(
            employees,
            week.startDate,
            week.endDate
          );
          week.employees.push(...addedEmployees);
          results.push({
            weekNumber,
            success: true,
            employeesAdded: addedEmployees.length,
            message: `Added ${addedEmployees.length} employees`
          });
          break;

        case 'remove':
          const removeCount = removeEmployeesFromWeek(week, employeeNames);
          results.push({
            weekNumber,
            success: true,
            employeesRemoved: removeCount,
            message: `Removed ${removeCount} employees`
          });
          break;

        case 'update':
          const updatedCount = updateEmployeesInWeek(week, employees);
          results.push({
            weekNumber,
            success: true,
            employeesUpdated: updatedCount,
            message: `Updated ${updatedCount} employees`
          });
          break;

        case 'reset':
          const resetCount = resetWeekStatuses(week);
          results.push({
            weekNumber,
            success: true,
            employeesReset: resetCount,
            message: `Reset ${resetCount} employees to default status`
          });
          break;

        default:
          results.push({
            weekNumber,
            success: false,
            message: `Unknown update type: ${updateType}`
          });
      }
    }

    // Save changes
    roster.updatedBy = userId;
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Bulk update completed",
      results,
      summary: {
        totalWeeksUpdated: results.filter(r => r.success).length,
        totalWeeksFailed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error("Error in bulk update:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to perform bulk update"
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
    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }
    roster.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
    const weeksWithEditability = roster.weeks.map(week => {
      const weekEndDate = new Date(week.endDate);
      const weekStartDate = new Date(week.startDate);
      let isEditable = false;
      let canAddEmployees = false;
      let editRestrictionReason = '';
      let requiresSuperAdmin = false;
      const hasWeekEnded = weekEndDate < currentDate;
      const isCurrentWeek = weekStartDate <= currentDate && weekEndDate >= currentDate;
      const isUpcomingWeek = weekStartDate > currentDate;
      
      if (userAccountType === 'superAdmin') {
        isEditable = true;
        canAddEmployees = true;  
        requiresSuperAdmin = hasWeekEnded;
      } else if (userAccountType === 'HR') {
        if (hasWeekEnded) {
          isEditable = false;
          canAddEmployees = false;
          requiresSuperAdmin = true;
          editRestrictionReason = 'Week has ended. Only Super Admin can edit past weeks.';
        } else if (isCurrentWeek || isUpcomingWeek) {
          isEditable = true;
          canAddEmployees = true;  
          requiresSuperAdmin = false;
        }
      }
      
      return {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        isEditable: isEditable,
        canAddEmployees: canAddEmployees,
        requiresSuperAdmin: requiresSuperAdmin,
        editRestrictionReason: editRestrictionReason,
        timelineStatus: hasWeekEnded ? 'past' : (isCurrentWeek ? 'current' : 'upcoming'),
        employeeCount: week.employees.length,
        employees: week.employees.map(emp => ({
          _id: emp._id,
          userId: emp.userId,
          name: emp.name,
          transport: emp.transport,
          cabRoute: emp.cabRoute,
          teamLeader: emp.teamLeader || "",
          shiftStartHour: emp.shiftStartHour,
          shiftEndHour: emp.shiftEndHour,
          dailyStatus: emp.dailyStatus.map(status => ({
            date: status.date,
            status: status.status
          }))
        }))
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
        summary: {
          totalWeeks: roster.weeks.length,
          totalEmployees: roster.weeks.reduce((sum, week) => sum + week.employees.length, 0),
          dateRange: {
            start: roster.rosterStartDate,
            end: roster.rosterEndDate
          }
        },
        userPermissions: {
          accountType: userAccountType,
          canEditAllWeeks: userAccountType === 'superAdmin',
          canAddEmployeesToPastWeeks: userAccountType === 'superAdmin',
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
export const bulkUpdateRosterWeeks = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const { weeks, newEmployees } = req.body;  
    const user = req.user;
    const userAccountType = user.accountType;
    const currentDate = new Date();

    if (!rosterId) {
      return res.status(400).json({
        success: false,
        message: "rosterId is required"
      });
    }

    // Check user accountType - only superAdmin and HR can edit
    if (!['superAdmin', 'HR'].includes(userAccountType)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin and HR can edit rosters"
      });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found"
      });
    }

    // Sort roster weeks by week number
    roster.weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    // Track changes and validation results
    const updateResults = [];
    let hasValidationErrors = false;
    const validationErrors = [];

    // Process new employees to add (if provided)
    const employeesToAdd = [];
    if (newEmployees && Array.isArray(newEmployees)) {
      for (const newEmp of newEmployees) {
        try {
          // Validate new employee data
          if (!newEmp.name) {
            throw new Error(`New employee name is required`);
          }

          if (newEmp.shiftStartHour === undefined || newEmp.shiftEndHour === undefined) {
            throw new Error(`New employee ${newEmp.name} must have both shift start and end hours`);
          }

          const shiftStartHour = parseInt(newEmp.shiftStartHour);
          const shiftEndHour = parseInt(newEmp.shiftEndHour);

          if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
            throw new Error(`New employee ${newEmp.name} has invalid shift hours`);
          }

          if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
            throw new Error(`New employee ${newEmp.name}: Shift hours must be between 0 and 23`);
          }

          // Find user in database if needed
          let userId = null;
          if (newEmp.name) {
            const user = await User.findOne({ username: newEmp.name });
            if (user) {
              userId = user._id;
            }
          }

          employeesToAdd.push({
            userId: userId,
            name: newEmp.name,
            transport: newEmp.transport || "",
            cabRoute: newEmp.cabRoute || "",
            teamLeader: newEmp.teamLeader || "",
            shiftStartHour: shiftStartHour,
            shiftEndHour: shiftEndHour,
            // Daily status will be generated per week
          });
        } catch (error) {
          validationErrors.push({
            type: 'new_employee_validation',
            message: error.message,
            employee: newEmp.name
          });
          hasValidationErrors = true;
        }
      }
    }

    // Process each week in the update request
    if (weeks && Array.isArray(weeks)) {
      for (const updatedWeek of weeks) {
        const { weekNumber, employees } = updatedWeek;
        
        // Find the week in the roster
        const weekIndex = roster.weeks.findIndex(w => w.weekNumber === weekNumber);
        
        if (weekIndex === -1) {
          updateResults.push({
            weekNumber,
            success: false,
            message: `Week ${weekNumber} not found in roster`
          });
          hasValidationErrors = true;
          continue;
        }

        const existingWeek = roster.weeks[weekIndex];
        const weekEndDate = new Date(existingWeek.endDate);
        const weekStartDate = new Date(existingWeek.startDate);
        
        // Check if week has ended
        const hasWeekEnded = weekEndDate < currentDate;
        
        // Check if week is current or upcoming
        const isCurrentOrFuture = weekStartDate >= currentDate || (weekStartDate <= currentDate && weekEndDate >= currentDate);
        
        // Check authorization for this specific week
        if (userAccountType === 'HR' && hasWeekEnded) {
          updateResults.push({
            weekNumber,
            success: false,
            message: `Week ${weekNumber} has ended. Only Super Admin can edit past weeks.`,
            requiresSuperAdmin: true
          });
          hasValidationErrors = true;
          continue;
        }

        // Process existing employees for this week
        const processedEmployees = [];
        
        if (employees && Array.isArray(employees)) {
          for (const emp of employees) {
            try {
              // Validate employee data
              if (!emp.name) {
                throw new Error(`Employee name is required`);
              }

              // For editing existing employees, validate shift hours if provided
              if (emp.shiftStartHour !== undefined || emp.shiftEndHour !== undefined) {
                const shiftStartHour = parseInt(emp.shiftStartHour);
                const shiftEndHour = parseInt(emp.shiftEndHour);

                if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
                  throw new Error(`Employee ${emp.name} has invalid shift hours`);
                }

                if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
                  throw new Error(`Employee ${emp.name}: Shift hours must be between 0 and 23`);
                }
              }

              // Find the existing employee
              const existingEmployee = existingWeek.employees.find(e => 
                e._id.toString() === emp._id || 
                e.name === emp.name
              );

              if (!existingEmployee) {
                throw new Error(`Employee ${emp.name} not found in week ${weekNumber}`);
              }

              // Create updated employee object WITH TEAMLEADER
              const employeeData = {
                _id: existingEmployee._id,
                userId: emp.userId || existingEmployee.userId,
                name: emp.name || existingEmployee.name,
                transport: emp.transport !== undefined ? emp.transport : existingEmployee.transport,
                cabRoute: emp.cabRoute !== undefined ? emp.cabRoute : existingEmployee.cabRoute,
                teamLeader: emp.teamLeader !== undefined ? emp.teamLeader : (existingEmployee.teamLeader || ""), // ADDED TEAMLEADER
                shiftStartHour: emp.shiftStartHour !== undefined ? parseInt(emp.shiftStartHour) : existingEmployee.shiftStartHour,
                shiftEndHour: emp.shiftEndHour !== undefined ? parseInt(emp.shiftEndHour) : existingEmployee.shiftEndHour,
                dailyStatus: emp.dailyStatus && Array.isArray(emp.dailyStatus) 
                  ? emp.dailyStatus.map(status => ({
                      date: status.date,
                      status: status.status || "P"
                    }))
                  : existingEmployee.dailyStatus
              };

              // Validate WO count (max 2 per week) if dailyStatus is updated
              if (emp.dailyStatus) {
                const woCount = employeeData.dailyStatus.filter(d => d.status === "WO").length;
                if (woCount > 2) {
                  throw new Error(`Employee ${emp.name} cannot have more than 2 week-offs in a week`);
                }
              }

              processedEmployees.push(employeeData);
            } catch (error) {
              validationErrors.push({
                week: weekNumber,
                type: 'employee_validation',
                message: error.message,
                employee: emp.name
              });
              hasValidationErrors = true;
            }
          }
        }

        // Add new employees to current and future weeks only
        if (employeesToAdd.length > 0 && (userAccountType === 'superAdmin' || isCurrentOrFuture)) {
          for (const newEmp of employeesToAdd) {
            // Check if employee already exists in this week
            const employeeExists = existingWeek.employees.some(e => e.name === newEmp.name);
            
            if (!employeeExists) {
              // Generate daily status for the new employee for this week
              const dailyStatus = generateDefaultDailyStatus(weekStartDate, weekEndDate);
              
              processedEmployees.push({
                userId: newEmp.userId,
                name: newEmp.name,
                transport: newEmp.transport,
                cabRoute: newEmp.cabRoute,
                teamLeader: newEmp.teamLeader || "", // ADDED TEAMLEADER
                shiftStartHour: newEmp.shiftStartHour,
                shiftEndHour: newEmp.shiftEndHour,
                dailyStatus: dailyStatus
              });
            }
          }
        }

        // Update the week with processed employees
        if (!hasValidationErrors) {
          roster.weeks[weekIndex].employees = processedEmployees;
          updateResults.push({
            weekNumber,
            success: true,
            message: `Week ${weekNumber} updated successfully`,
            employeesUpdated: processedEmployees.length,
            newEmployeesAdded: employeesToAdd.length > 0 ? employeesToAdd.length : 0
          });
        }
      }
    }

    // If there are validation errors, return them without saving
    if (hasValidationErrors) {
      return res.status(400).json({
        success: false,
        message: "Validation errors found",
        validationErrors: validationErrors,
        updateResults: updateResults
      });
    }

    // Update roster metadata
    roster.updatedBy = user._id;
    
    // Save the roster
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Bulk update completed successfully",
      updateResults: updateResults,
      summary: {
        totalWeeksUpdated: updateResults.filter(r => r.success).length,
        totalEmployeesAffected: updateResults.reduce((sum, result) => sum + (result.employeesUpdated || 0), 0),
        newEmployeesAdded: employeesToAdd.length
      },
      rosterInfo: {
        rosterId: roster._id,
        month: roster.month,
        year: roster.year,
        updatedBy: user.username,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Error in bulk update:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to perform bulk update"
    });
  }
};
export const getOpsMetaCurrentWeekRoster = async (req, res) => {
  try {
    const user = req.user;
    if (user.department !== "Ops - Meta") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Ops-Meta department employees can access this."
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const roster = await Roster.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "No roster found for current month"
      });
    }

    // Find current week
    const currentWeek = roster.weeks.find(week => {
      const weekStart = new Date(week.startDate);
      const weekEnd = new Date(week.endDate);
      
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      
      return currentDate >= weekStart && currentDate <= weekEnd;
    });

    if (!currentWeek) {
      return res.status(404).json({
        success: false,
        message: "No roster week found for current date"
      });
    }

    // Check edit permission
    const weekStartDate = new Date(currentWeek.startDate);
    const weekEndDate = new Date(currentWeek.endDate);
    
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

    // ========== FILTER: Only show employees where user.username === teamLeader ==========
    // Since teamLeader is stored as String, match it with user's username
    const currentUserUsername = user.username;
    
    // Filter employees where teamLeader matches current user's username
    const teamEmployees = currentWeek.employees.filter(emp => {
      // Check if teamLeader matches current user's username
      // Trim and compare case-insensitively to handle variations
      if (emp.teamLeader && typeof emp.teamLeader === 'string') {
        return emp.teamLeader.trim().toLowerCase() === currentUserUsername.toLowerCase();
      }
      return false;
    });

    // If no employees found for this team leader
    if (teamEmployees.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No employees assigned to you (${currentUserUsername}) as Team Leader`,
        data: {
          weekNumber: currentWeek.weekNumber,
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate,
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
      .filter(emp => emp.userId)
      .map(emp => emp.userId);
    
    const teamUsers = teamUserIds.length > 0 
      ? await User.find({ _id: { $in: teamUserIds } })
          .select('_id username name department accountType')
      : [];

    // Format roster entries with user details
    const formattedRoster = teamEmployees.map(emp => {
      const userDetails = teamUsers.find(u => 
        u._id.toString() === emp.userId?.toString()
      );
      
      return {
        _id: emp._id,
        userId: emp.userId,
        name: emp.name,
        username: userDetails?.username || '',
        department: userDetails?.department || 'Unknown',
        accountType: userDetails?.accountType || 'employee',
        transport: emp.transport || "",
        cabRoute: emp.cabRoute || "",
        teamLeader: emp.teamLeader || "",
        shiftStartHour: emp.shiftStartHour,
        shiftEndHour: emp.shiftEndHour,
        dailyStatus: emp.dailyStatus.map(status => ({
          date: status.date,
          status: status.status || "P"
        }))
      };
    });

    // Get unique departments in the team
    const teamDepartments = [...new Set(formattedRoster.map(e => e.department))];

    return res.status(200).json({
      success: true,
      message: `Current week roster for your team (Team Leader: ${currentUserUsername})`,
      data: {
        weekNumber: currentWeek.weekNumber,
        startDate: currentWeek.startDate,
        endDate: currentWeek.endDate,
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
      message: error.message || "Server error"
    });
  }
}; 
export const updateOpsMetaRoster = async (req, res) => {
  try {
    const user = req.user;
    if (user.department !== "Ops - Meta") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Ops-Meta department employees can access this."
      });
    }

    const { employeeId, updates } = req.body;

    if (!employeeId || !updates) {
      return res.status(400).json({
        success: false,
        message: "employeeId and updates are required"
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const roster = await Roster.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "No roster found for current month"
      });
    }
    const currentWeekIndex = roster.weeks.findIndex(week => {
      const weekStart = new Date(week.startDate);
      const weekEnd = new Date(week.endDate);
      
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      
      return currentDate >= weekStart && currentDate <= weekEnd;
    });

    if (currentWeekIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No current week found"
      });
    }

    const currentWeek = roster.weeks[currentWeekIndex];
    const weekStartDate = new Date(currentWeek.startDate);
    const weekEndDate = new Date(currentWeek.endDate);
    
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    
    if (currentDate < weekStartDate) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit roster before the week starts"
      });
    }

    if (currentDate > weekEndDate) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit roster after the week has ended"
      });
    }
    const employeeIndex = currentWeek.employees.findIndex(emp => 
      emp._id.toString() === employeeId
    );

    if (employeeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in roster"
      });
    }

    const employee = roster.weeks[currentWeekIndex].employees[employeeIndex];
    if (!employee.teamLeader || 
        employee.teamLeader.trim().toLowerCase() !== user.username.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the Team Leader for this employee."
      });
    }
    if (updates.shiftStartHour !== undefined || updates.shiftEndHour !== undefined) {
      if (updates.shiftStartHour === undefined || updates.shiftEndHour === undefined) {
        return res.status(400).json({
          success: false,
          message: "Both shiftStartHour and shiftEndHour are required"
        });
      }
    }
    let shiftStartHour = employee.shiftStartHour;
    let shiftEndHour = employee.shiftEndHour;
    if (updates.shiftStartHour !== undefined) {
      shiftStartHour = parseInt(updates.shiftStartHour);
      if (isNaN(shiftStartHour) || shiftStartHour < 0 || shiftStartHour > 23) {
        return res.status(400).json({
          success: false,
          message: "shiftStartHour must be 0-23"
        });
      }
    }
    
    if (updates.shiftEndHour !== undefined) {
      shiftEndHour = parseInt(updates.shiftEndHour);
      if (isNaN(shiftEndHour) || shiftEndHour < 0 || shiftEndHour > 23) {
        return res.status(400).json({
          success: false,
          message: "shiftEndHour must be 0-23"
        });
      }
    }
    if (updates.dailyStatus && Array.isArray(updates.dailyStatus)) {
      const woCount = updates.dailyStatus.filter(d => d && d.status === "WO").length;
      if (woCount > 2) {
        return res.status(400).json({
          success: false,
          message: "Cannot have more than 2 week-offs"
        });
      }
    }
    Object.keys(updates).forEach(field => {
      if (field === "teamLeader") { 
        return;  
      } else if (field === "dailyStatus" && Array.isArray(updates[field])) {
        roster.weeks[currentWeekIndex].employees[employeeIndex][field] = updates[field].map(ds => ({
          date: new Date(ds.date),
          status: ds.status || "P"
        }));
      } else {
        roster.weeks[currentWeekIndex].employees[employeeIndex][field] = updates[field];
      }
    }); 
    roster.weeks[currentWeekIndex].employees[employeeIndex].shiftStartHour = shiftStartHour;
    roster.weeks[currentWeekIndex].employees[employeeIndex].shiftEndHour = shiftEndHour; 
    roster.updatedBy = user._id;
    roster.markModified('weeks');
    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Roster updated successfully",
      data: {
        employeeId: employeeId,
        employeeName: employee.name,
        weekNumber: currentWeek.weekNumber,
        updatedBy: user.username,
        teamLeader: user.username,
        updatedFields: Object.keys(updates).filter(field => field !== "teamLeader"),  
        updatedAt: new Date(),
        note: "You can only edit employees assigned to you as Team Leader"
      }
    });

  } catch (error) {
    console.error("Error updating roster:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};
export const rosterUploadFromExcel = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = ["admin", "superAdmin", "HR"].includes(user.accountType);
    const isOpsMetaEmployee = user.accountType === "employee" && user.department === "Ops - Meta";
    
    if (!isAdmin && !isOpsMetaEmployee) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin, HR, or Ops-Meta department employees can upload roster."
      });
    }
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Date range is required. Please select start date and end date."
      });
    }
    const selectedStartDate = new Date(startDate);
    const selectedEndDate = new Date(endDate);
    selectedStartDate.setHours(0, 0, 0, 0);
    selectedEndDate.setHours(0, 0, 0, 0);
    
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
    const totalDays = Math.round((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;
    
    if (totalDays !== 7) {
      return res.status(400).json({
        success: false,
        message: "Date range must be exactly 7 days for roster upload."
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isOpsMetaEmployee) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (selectedStartDate < today) {
        return res.status(400).json({
          success: false,
          message: "Ops-Meta employees can only upload roster for future weeks starting from today. Cannot upload for yesterday or past dates."
        });
      }
      if (selectedStartDate < today) {
        return res.status(400).json({
          success: false,
          message: "Ops-Meta employees can only upload roster for dates starting from today onwards."
        });
      }
    } 
    else {
      if (selectedStartDate < today) {
        return res.status(400).json({
          success: false,
          message: "Cannot upload roster for past dates. Please select today or future dates."
        });
      }
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required"
      });
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    if (!excelData || excelData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or has no data"
      });
    }
    const requiredExcelColumns = [
      'Name',
      'Transport',
      'Team Leader',
      'Shift Start Hour',
      'Shift End Hour'
    ];

    const firstRow = excelData[0];
    const availableColumns = Object.keys(firstRow);
    console.log("Available columns:", availableColumns);

    const missingColumns = requiredExcelColumns.filter(col => !availableColumns.includes(col));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns in Excel: ${missingColumns.join(', ')}. Your Excel should have: Name, Transport, Team Leader, Shift Start Hour, Shift End Hour, and date columns (DD/MM)`
      });
    }
    let excelDateColumns = [];
    const pattern1 = /^\d{1,2}\/\d{1,2}(\s+\w+)?$/;
    const pattern2 = /^\d{1,2}\/\d{1,2}$/;
    for (const col of availableColumns) {
      if (pattern1.test(col) || pattern2.test(col)) {
        excelDateColumns.push(col);
      }
    }
    if (excelDateColumns.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No date columns found in Excel. Looking for columns like: 26/01, 26/01 Mon, etc."
      });
    }
    if (excelDateColumns.length !== 7) {
      return res.status(400).json({
        success: false,
        message: `Excel should have exactly 7 date columns (one for each day of the week). Found: ${excelDateColumns.length} columns: ${excelDateColumns.join(', ')}`
      });
    }
    const expectedDateColumns = [];
    const currentDate = new Date(selectedStartDate);
    for (let i = 0; i < 7; i++) {
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dateColumn = `${day}/${month}`;
      expectedDateColumns.push(dateColumn);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const employeesData = [];
    const processedEmployees = new Set();
    for (const [index, row] of excelData.entries()) {
      try {
        if (!row.Name || row.Name.trim() === '') {
          continue;
        }
        const name = (row.Name || "").toString().trim();
        const username = name.toLowerCase().replace(/\s+/g, '.');
        const employeeKey = `${username}-${startDate}-${endDate}`;
        if (processedEmployees.has(employeeKey)) {
          console.warn(`Duplicate entry for employee ${name}, skipping`);
          continue;
        }
        processedEmployees.add(employeeKey);
        const rowTeamLeader = (row['Team Leader'] || "").toString().trim();
        if (isOpsMetaEmployee && rowTeamLeader && rowTeamLeader.toLowerCase() !== user.username.toLowerCase()) {
          console.log(`Ops-Meta employee ${user.username} uploading for team leader: ${rowTeamLeader}`);
        }
        let userRecord = await User.findOne({ username: username });
        if (!userRecord) {
          userRecord = await User.findOne({ 
            $or: [
              { name: name },
              { username: { $regex: new RegExp(`^${name.split(' ')[0].toLowerCase()}`, 'i') } }
            ]
          });
          if (!userRecord) {
            console.warn(`User not found with name: ${name}. Roster entry will be created without userId.`);
          }
        }
        const transportValue = (row.Transport || "").toString().trim();
        const validTransport = ["Yes", "No", ""];
        if (!validTransport.includes(transportValue)) {
          return res.status(400).json({
            success: false,
            message: `Invalid transport value for ${name}. Must be "Yes", "No", or empty.`
          });
        }
        const dailyStatus = [];
        const statusDate = new Date(selectedStartDate);
        for (let i = 0; i < excelDateColumns.length; i++) {
          const excelDateColumn = excelDateColumns[i];
          const statusValue = (row[excelDateColumn] || "P").toString().trim().toUpperCase();
          const validStatus = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", ""];
          if (!validStatus.includes(statusValue)) {
            return res.status(400).json({
              success: false,
              message: `Invalid status "${row[excelDateColumn]}" for ${name} on column ${excelDateColumn}. Valid values: P, WO, L, NCNS, UL, LWP, BL, H, LWD`
            });
          }
          const date = new Date(statusDate);
          date.setHours(0, 0, 0, 0);
          dailyStatus.push({
            date: date,
            status: statusValue || "P",
            originalExcelColumn: excelDateColumn
          });
          statusDate.setDate(statusDate.getDate() + 1);
        }
        const woCount = dailyStatus.filter(d => d.status === "WO").length;
        if (woCount > 2) {
          return res.status(400).json({
            success: false,
            message: `Employee ${name} cannot have more than 2 week-offs in a week`
          });
        }
        const shiftStartHour = parseInt(row['Shift Start Hour']);
        const shiftEndHour = parseInt(row['Shift End Hour']);
        if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
          return res.status(400).json({
            success: false,
            message: `Employee ${name} has invalid shift hours`
          });
        }
        if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
          return res.status(400).json({
            success: false,
            message: `Employee ${name}: Shift hours must be between 0 and 23`
          });
        }
        employeesData.push({
          userId: userRecord?._id || null,
          name: name,
          username: username,
          transport: transportValue,
          cabRoute: (row['CAB Route'] || "").toString().trim(),
          shiftStartHour: shiftStartHour,
          shiftEndHour: shiftEndHour,
          dailyStatus: dailyStatus,
          teamLeader: rowTeamLeader,
          excelDateMapping: excelDateColumns
        });
      } catch (rowError) {
        console.error(`Error processing row ${index + 2}:`, rowError);
        return res.status(400).json({
          success: false,
          message: `Error in row ${index + 2}: ${rowError.message}`
        });
      }
    }
    if (employeesData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid roster data found in the Excel file."
      });
    }
    const rosterMonth = selectedStartDate.getMonth() + 1;
    const rosterYear = selectedStartDate.getFullYear();
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
      roster.rosterStartDate = selectedStartDate;
      roster.rosterEndDate = selectedEndDate;
    }
    const weekNumber = Math.ceil(selectedStartDate.getDate() / 7);
    const existingWeekIndex = roster.weeks.findIndex(w => 
      w.startDate.getTime() === selectedStartDate.getTime() &&
      w.endDate.getTime() === selectedEndDate.getTime()
    );
    
    if (existingWeekIndex !== -1) {
      if (isOpsMetaEmployee) {
        roster.weeks[existingWeekIndex] = {
          weekNumber: weekNumber,
          startDate: selectedStartDate,
          endDate: selectedEndDate,
          employees: employeesData
        };
      } else {
        roster.weeks[existingWeekIndex] = {
          weekNumber: weekNumber,
          startDate: selectedStartDate,
          endDate: selectedEndDate,
          employees: employeesData
        };
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
        selectedDateRange: {
          startDate: startDate,
          endDate: endDate,
          totalDays: totalDays,
          expectedDates: expectedDateColumns
        },
        excelDateMapping: {
          foundDateColumns: excelDateColumns,
          mappingNote: `Excel date columns mapped to selected date range: ${startDate} to ${endDate}`,
          mappingOrder: excelDateColumns.map((col, i) => 
            `${col} → ${expectedDateColumns[i]} (Day ${i+1})`
          )
        },
        summary: {
          totalEmployees: employeesData.length,
          weekNumber: weekNumber,
          month: rosterMonth,
          year: rosterYear,
          uploadedBy: {
            username: user.username,
            accountType: user.accountType,
            department: user.department,
            permissions: isOpsMetaEmployee 
              ? `Ops-Meta employees can upload for any team (future dates only)` 
              : "Admins/HR can upload for any team and future dates"
          }
        },
        excelFormat: {
          acceptedColumns: [...requiredExcelColumns, ...excelDateColumns],
          note: `Username is auto-generated from Name. Excel date columns (${excelDateColumns.length} found) will be mapped to selected date range.`,
          transportValues: ['Yes', 'No', ''],
          statusValues: ['P', 'WO', 'L', 'NCNS', 'UL', 'LWP', 'BL', 'H', 'LWD', ''],
          permissionsNote: isOpsMetaEmployee 
            ? `Ops-Meta employees can upload for any team (future dates from tomorrow only)` 
            : "Admins/HR can upload for any team and future dates",
          sampleRow: {
            Name: 'John Doe',
            Transport: 'Yes',
            'CAB Route': 'Route A',
            'Team Leader': 'AnyTeamLeaderName',  
            'Shift Start Hour': 9,
            'Shift End Hour': 17,
            ...Object.fromEntries(excelDateColumns.map(col => [col, 'P']))
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
