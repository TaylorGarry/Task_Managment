import XLSX from "xlsx-js-style";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

<<<<<<< HEAD
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
// export const addRosterWeek = async (req, res) => {
//   try {
//     const { month, year, weekNumber, startDate, endDate, employees, action = "create" } = req.body;
//     const createdBy = req.user._id;  

//     if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
//       return res.status(400).json({ 
<<<<<<< HEAD
=======
//         success: false,
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

//         const employeeData = {
//           userId: user?._id || null,
//           name: emp.name,
//           transport: emp.transport || "",
//           cabRoute: emp.cabRoute || "",
<<<<<<< HEAD
//           // isCoreTeam: emp.isCoreTeam || false,
//           dailyStatus,
//         };

//         if (!employeeData.isCoreTeam) {
//           if (!emp.shift) {
//             throw new Error(`Employee ${emp.name} (non-core team) must have a shift type`);
//           }
//           if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
//             throw new Error(`Employee ${emp.name} (non-core team) must have shift hours`);
//           }

//           employeeData.shift = emp.shift;
//           employeeData.shiftStartHour = parseInt(emp.shiftStartHour) || 0;
//           employeeData.shiftEndHour = parseInt(emp.shiftEndHour) || 0;
//         }

=======
//           shiftStartHour,
//           shiftEndHour,
//           dailyStatus,
//         };

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD




export const addRosterWeek = async (req, res) => {
  try {
    const { month, year, weekNumber, startDate, endDate, employees, action = "create" } = req.body;
    const createdBy = req.user._id;  

    if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: month, year, weekNumber, startDate, endDate, employees" 
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

        // Validate shift hours for all employees
        if (emp.shiftStartHour === undefined || emp.shiftEndHour === undefined) {
          throw new Error(`Employee ${emp.name} must have both shift start and end hours`);
        }

        const shiftStartHour = parseInt(emp.shiftStartHour) || 0;
        const shiftEndHour = parseInt(emp.shiftEndHour) || 0;

        // Optional: Validate that shift hours are valid
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
        };

        return employeeData;
      })
    );

    let roster = await Roster.findOne({ month, year });
    if (!roster) {
      roster = new Roster({
        month,
        year,
        weeks: [],
        createdBy,
      });
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

    roster.updatedBy = createdBy;
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
=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD

// export const updateRoster = async (req, res) => {
//   try {
//     const { month, year, weekNumber, employeeId, updates } = req.body;

//     if (!month || !year || !weekNumber || !employeeId || !updates) {
//       return res.status(400).json({
//         message: "month, year, weekNumber, employeeId and updates are required",
//       });
//     }

//     const roster = await Roster.findOne({ month, year });
//     if (!roster) {
//       return res.status(404).json({ message: "Roster not found" });
//     }

//     const week = roster.weeks.find((w) => w.weekNumber === weekNumber);
//     if (!week) {
//       return res.status(404).json({ message: "Week not found in roster" });
//     }

//     const employee = week.employees.id(employeeId);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found in this week" });
//     }

//     const allowedFields = [
//       "name",
//       "userId",
//       "transport",
//       "cabRoute",
//       "shift",
//       "shiftStartHour",
//       "shiftEndHour",
//       "isCoreTeam",
//       "dailyStatus",
//     ];

//     Object.keys(updates).forEach((field) => {
//       if (allowedFields.includes(field)) {
//         employee[field] = updates[field];
//       }
//     });

//     if (updates.isCoreTeam === true) {
//       employee.shift = undefined;
//       employee.shiftStartHour = undefined;
//       employee.shiftEndHour = undefined;
//     }

//     await roster.save();

//     return res.status(200).json({
//       message: "Employee updated successfully",
//       employee,
//       roster,
//     });

//   } catch (error) {
//     console.error("Update roster error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
export const updateRoster = async (req, res) => {
  try {
    const { month, year, weekNumber, employeeId, updates } = req.body;
    const user = req.user;

<<<<<<< HEAD
    if (!month || !year || !weekNumber || !employeeId || !updates) {
      return res.status(400).json({
        success: false,
        message: "month, year, weekNumber, employeeId and updates are required",
      });
    }
    const roster = await Roster.findOne({ month, year });
    if (!roster) {
      return res.status(403).json({ 
        success: false,
        message: "Roster not found" 
      });
    }
    const week = roster.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) {
      return res.status(403).json({ 
        success: false,
        message: "Week not found in roster" 
      });
    }
    const currentDate = new Date();
    const weekStartDate = new Date(week.startDate);
    const weekEndDate = new Date(week.endDate);
    weekStartDate.setHours(0, 0, 0, 0);
    weekEndDate.setHours(23, 59, 59, 999);
    if (currentDate > weekEndDate) {
      return res.status(403).json({
        success: false,
        message: "Cannot update previous week rosters. Previous weeks are locked for all users."
      });
    }
    const isCurrentWeek = currentDate >= weekStartDate && currentDate <= weekEndDate;
    if (isCurrentWeek) {
      if (user.accountType !== "HR" && user.accountType !== "superAdmin") {
        return res.status(403).json({
          success: false,
          message: "Only HR and Super Admin can edit current week roster"
        });
      }
    }
    const employee = week.employees.id(employeeId);
    if (!employee) {
      return res.status(403).json({ 
        success: false,
        message: "Employee not found in this week" 
      });
    }
    const allowedFields = [
      "name",
      "userId",
      "transport",
      "cabRoute",
      "shiftStartHour",
      "shiftEndHour",
      "dailyStatus",
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
    Object.keys(updates).forEach((field) => {
      if (allowedFields.includes(field)) {
        if (field !== "shiftStartHour" && field !== "shiftEndHour") {
          employee[field] = updates[field];
        }
      }
    });
    employee.shiftStartHour = shiftStartHour;
    employee.shiftEndHour = shiftEndHour;
    if (employee.shiftStartHour === undefined || employee.shiftEndHour === undefined) {
      return res.status(400).json({
        success: false,
        message: "Both shiftStartHour and shiftEndHour are required for all employees"
      });
    }
    roster.updatedBy = user._id;
    await roster.save();
    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
      roster,
      updatedBy: user.username,
      accountType: user.accountType,
      weekType: isCurrentWeek ? "current" : "future"
    });
  } catch (error) {
    console.error("Update roster error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Server error"
    });
  }
};
=======
    const roster = await Roster.findOne({ month, year });
    if (!roster) return res.status(404).json({ success: false, message: "Roster not found" });

    const week = roster.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return res.status(404).json({ success: false, message: "Week not found" });

    const employee = week.employees.id(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

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
        weekNumber,
        employeeId,
        employeeName: employee.name,
        changes
      });
    }

    roster.updatedBy = user._id;
    roster.markModified("weeks");
    roster.markModified("editHistory");

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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

<<<<<<< HEAD
=======



>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
        "Total HD",
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
        let totalHD = 0;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
                case "HD":
                  totalHD++;
                  break;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
        row.push(totalHD);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
          WO: 0, L: 0, P: 0, NCNS: 0, UL: 0, LWP: 0, BL: 0, Empty: 0
=======
          WO: 0, L: 0, P: 0, NCNS: 0, UL: 0, LWP: 0, BL: 0, HD:0, Empty: 0
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
                  case "HD": totals.HD++; break;
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
        summaryRow.push(`HD: ${totals.HD}`);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
              } else if (status === "" || status === null) {
=======
              } else if (status === "HD") {
                cellStyle.fill = {  fgColor: {rgb: "#FFD966"} };
              }
               else if (status === "" || status === null) {
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD

=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD

=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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

<<<<<<< HEAD
=======
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

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
    roster.weeks.forEach((week) => {
      const sortedEmployees = [...week.employees].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      const data = [];
      
<<<<<<< HEAD
      const header = ["Name", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
=======
      // Header row - ADDED "Team Leader" after "CAB Route"
      const header = ["Name", "Transport", "CAB Route", "Team Leader", "Shift Start Hour", "Shift End Hour"];
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      
      const dayCount = sortedEmployees[0]?.dailyStatus?.length || 0;
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(week.startDate);
        date.setDate(date.getDate() + i);
        header.push(formatDateWithDay(date));
      }
      
<<<<<<< HEAD
      header.push("Total WO");
      header.push("Total L");
      header.push("Total P");
      header.push("Total H");
      
      data.push(header);

=======
      // Add total columns for each status type
      STATUS_TYPES.forEach(status => {
        header.push(`Total ${STATUS_NAMES[status] || status}`);
      });
      
      data.push(header);

      // Process each employee
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      sortedEmployees.forEach((emp) => {
        const row = [
          emp.name || "", 
          emp.transport || "", 
          emp.cabRoute || "", 
<<<<<<< HEAD
=======
          emp.teamLeader || "", // ADDED: Team Leader field
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
          emp.shiftStartHour !== undefined ? emp.shiftStartHour : "", 
          emp.shiftEndHour !== undefined ? emp.shiftEndHour : ""
        ];
        
<<<<<<< HEAD
        let totalWO = 0;
        let totalL = 0;
        let totalP = 0;
        let totalH = 0;
        
=======
        // Initialize counters for all status types
        const statusCounts = {};
        STATUS_TYPES.forEach(status => {
          statusCounts[status] = 0;
        });
        
        // Process daily statuses
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds?.status || "";
            row.push(status);
            
<<<<<<< HEAD
            if (status === "P") totalP++;
            else if (status === "WO") totalWO++;
            else if (status === "L") totalL++;
            else if (status === "H") totalH++;
          });
        } else {
=======
            // Count each status type
            if (status && STATUS_TYPES.includes(status)) {
              statusCounts[status]++;
            }
          });
        } else {
          // Add empty cells for days if no daily status
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
          for (let i = 0; i < dayCount; i++) {
            row.push("");
          }
        }
        
<<<<<<< HEAD
        row.push(totalWO);
        row.push(totalL);
        row.push(totalP);
        row.push(totalH);
=======
        // Add totals for each status type
        STATUS_TYPES.forEach(status => {
          row.push(statusCounts[status]);
        });
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
        
        data.push(row);
      });

<<<<<<< HEAD
      if (sortedEmployees.length > 0) {
        const summaryRow = ["", "", "", "", "Summary"];
        
=======
      // Add summary row if there are employees
      if (sortedEmployees.length > 0) {
        const summaryRow = ["", "", "", "", "", "Week Summary"];
        
        // Empty cells for days
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
        for (let i = 0; i < dayCount; i++) {
          summaryRow.push("");
        }
        
<<<<<<< HEAD
        const totalWO = sortedEmployees.reduce((sum, emp) => {
          let empWO = 0;
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              if (ds?.status === "WO") empWO++;
            });
          }
          return sum + empWO;
        }, 0);
        
        const totalL = sortedEmployees.reduce((sum, emp) => {
          let empL = 0;
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              if (ds?.status === "L") empL++;
            });
          }
          return sum + empL;
        }, 0);
        
        const totalP = sortedEmployees.reduce((sum, emp) => {
          let empP = 0;
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              if (ds?.status === "P") empP++;
            });
          }
          return sum + empP;
        }, 0);
        
        const totalH = sortedEmployees.reduce((sum, emp) => {
          let empH = 0;
          if (emp.dailyStatus) {
            emp.dailyStatus.forEach(ds => {
              if (ds?.status === "H") empH++;
            });
          }
          return sum + empH;
        }, 0);
        
        summaryRow.push(`WO: ${totalWO}`);
        summaryRow.push(`L: ${totalL}`);
        summaryRow.push(`P: ${totalP}`);
        summaryRow.push(`H: ${totalH}`);
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
        
        data.push(summaryRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
<<<<<<< HEAD
=======
      // Style header row
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        
<<<<<<< HEAD
        let bgColor = "4472C4";  
        if (C >= range.e.c - 3) {  
=======
        let bgColor = "4472C4";  // Blue for main headers
        if (C >= range.e.c - STATUS_TYPES.length) {  // Orange for total columns
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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

<<<<<<< HEAD
=======
      // Style data rows
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
            if (C >= 5 && C < range.e.c - 3) {  
              const status = worksheet[cellAddress].v;
              if (status === "P" || status === "Present") {
                cellStyle.fill = { fgColor: { rgb: "C6EFCE" } };  
              } else if (status === "WO" || status === "Week Off") {
                cellStyle.fill = { fgColor: { rgb: "FFC7CE" } };  
              } else if (status === "L" || status === "Leave") {
                cellStyle.fill = { fgColor: { rgb: "FFEB9C" } };  
              } else if (status === "H" || status === "Holiday") {
                cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  
              }
              cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
              cellStyle.font = { bold: true };
            }
          } else if (isSummaryRow) {
            cellStyle.font = { bold: true };
<<<<<<< HEAD
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray
            
            if (C >= range.e.c - 3) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue
=======
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray for summary
            
            if (C >= range.e.c - STATUS_TYPES.length) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue for status totals
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
            }
          }
          
          worksheet[cellAddress].s = cellStyle;
        }
      }

<<<<<<< HEAD
      worksheet['!cols'] = [
        { wch: 20 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        { wch: 15 },  
        ...Array(dayCount).fill({ wch: 15 }),  
        { wch: 10 },  
        { wch: 10 },  
        { wch: 10 },  
        { wch: 10 }   
=======
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
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
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
<<<<<<< HEAD
=======
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
        editHistory: roster.editHistory || [],
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
    const { weeks } = req.body;
    const user = req.user;

    if (!rosterId) {
      return res.status(400).json({ success: false, message: "rosterId required" });
    }

    const roster = await Roster.findById(rosterId);
    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    for (const updatedWeek of weeks) {
      const week = roster.weeks.find(w => w.weekNumber === updatedWeek.weekNumber);
      if (!week) continue;

      for (const empUpdate of updatedWeek.employees) {
        const employee = week.employees.id(empUpdate._id);
        if (!employee) continue;

        const changes = [];

        // Compare normal fields
        ["name","transport","cabRoute","teamLeader","shiftStartHour","shiftEndHour"].forEach(field => {
          if (empUpdate[field] !== undefined && employee[field] !== empUpdate[field]) {
            changes.push({
              field,
              oldValue: employee[field],
              newValue: empUpdate[field]
            });
            employee[field] = empUpdate[field];
          }
        });

        // Compare dailyStatus
        if (empUpdate.dailyStatus) {
          empUpdate.dailyStatus.forEach((newDay, index) => {
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
        }

        // Push history if changes exist
        if (changes.length > 0) {
          roster.editHistory.push({
            editedBy: user._id,
            editedByName: user.username,
            accountType: user.accountType,
            actionType: "bulk-update",
            weekNumber: week.weekNumber,
            employeeId: employee._id,
            employeeName: employee.name,
            changes
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
    const allowedTeamLeaderDepartments = ["Ops - Meta", "Marketing", "CS"];
    if (!allowedTeamLeaderDepartments.includes(user.department)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Ops-Meta, Marketing, or CS department employees can access this."
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
    const { employeeId, updates } = req.body;
    const user = req.user;

    const currentDate = new Date();
    const roster = await Roster.findOne({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear()
    });

    if (!roster) {
      return res.status(404).json({ success: false, message: "Roster not found" });
    }

    const week = roster.weeks.find(w => {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      return currentDate >= start && currentDate <= end;
    });

    if (!week) {
      return res.status(404).json({ success: false, message: "Current week not found" });
    }

    const employee = week.employees.id(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
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

    await roster.save();

    return res.status(200).json({
      success: true,
      message: "Roster updated successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const rosterUploadFromExcel = async (req, res) => {
  try {
    const user = req.user;
    const isSuperAdmin = user.accountType === "superAdmin";
    const isAdmin = ["admin", "HR"].includes(user.accountType);
    const allowedEmployeeDepartments = ["Ops - Meta", "Marketing", "CS"];
    const isAllowedDepartmentEmployee = user.accountType === "employee" && allowedEmployeeDepartments.includes(user.department);
    
    if (!isSuperAdmin && !isAdmin && !isAllowedDepartmentEmployee) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only superAdmin, admin, HR, or Ops-Meta/Marketing/CS department employees can upload roster."
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
    
    // DATE VALIDATION BASED ON USER ROLE
    if (isAllowedDepartmentEmployee) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (selectedStartDate < tomorrow) {
        return res.status(400).json({
          success: false,
          message: "Ops-Meta, Marketing, and CS employees can only upload roster for future weeks starting from tomorrow. Cannot upload for today or past dates."
        });
      }
    } 
    else if (isAdmin) {
      if (selectedStartDate < today) {
        return res.status(400).json({
          success: false,
          message: "Admin/HR can only upload roster for today or future dates. Cannot upload for past dates."
        });
      }
    }
    else if (isSuperAdmin) {
      console.log(`SuperAdmin ${user.username} uploading roster for date range: ${startDate} to ${endDate}`);
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
    const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // DEBUGGING: Log raw headers
    console.log("Raw Excel Headers (first row):", excelData[0]);
    
    // Check if first row is info text, then use second row as headers
    let headerRowIndex = 0;
    let dataStartRowIndex = 1;
    
    // If first row contains instruction text, headers are in second row
    if (excelData[0] && excelData[0][0] && excelData[0][0].toString().includes('IMPORTANT')) {
      headerRowIndex = 1;
      dataStartRowIndex = 2;
    }
    
    const headers = excelData[headerRowIndex];
    const dataRows = excelData.slice(dataStartRowIndex);
    
    // Clean headers - remove BOM, trim spaces, normalize
    const cleanHeaders = headers.map(header => {
      if (!header) return '';
      // Remove BOM character if present, trim spaces
      return header.toString().replace(/^\uFEFF/, '').trim();
    });
    
    console.log("Cleaned Headers:", cleanHeaders);
    
    // Convert to array of objects with cleaned headers
    const formattedData = dataRows.map(row => {
      const obj = {};
      cleanHeaders.forEach((header, index) => {
        if (header) {
          obj[header] = row[index] || '';
        }
      });
      return obj;
    }).filter(row => row.Name && row.Name.toString().trim() !== ''); // Filter out empty rows
    
    console.log("First formatted row:", formattedData[0]);
    
    if (!formattedData || formattedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or has no data"
      });
    }
    
    // Define required columns (including date columns which will be validated separately)
    const baseRequiredColumns = [
      'Name',
      'Transport',
      'Team Leader',
      'Shift Start Hour',
      'Shift End Hour'
    ];

    // Optional columns that we don't want to block upload if missing
    const optionalColumns = [
      'CAB Route',
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

    const firstRow = formattedData[0];
    const availableColumns = Object.keys(firstRow);
    console.log("Available columns after formatting:", availableColumns);

    // Case-insensitive column matching for required columns
    const columnMap = {};
    const requiredColumnMap = {};
    
    availableColumns.forEach(col => {
      const colLower = col.toLowerCase().trim();
      
      // Map base required columns
      if (colLower === 'name') {
        columnMap['Name'] = col;
        requiredColumnMap['Name'] = col;
      }
      else if (colLower === 'transport') {
        columnMap['Transport'] = col;
        requiredColumnMap['Transport'] = col;
      }
      else if (colLower === 'team leader') {
        columnMap['Team Leader'] = col;
        requiredColumnMap['Team Leader'] = col;
      }
      else if (colLower === 'shift start hour') {
        columnMap['Shift Start Hour'] = col;
        requiredColumnMap['Shift Start Hour'] = col;
      }
      else if (colLower === 'shift end hour') {
        columnMap['Shift End Hour'] = col;
        requiredColumnMap['Shift End Hour'] = col;
      }
      // Map optional columns (but don't add to requiredColumnMap)
      else if (colLower === 'cab route') {
        columnMap['CAB Route'] = col;
      }
    });

    // Check for base required columns
    const missingBaseColumns = baseRequiredColumns.filter(col => !requiredColumnMap[col]);
    
    if (missingBaseColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns in Excel: ${missingBaseColumns.join(', ')}. Found columns: ${availableColumns.join(', ')}. Your Excel should have at least: Name, Transport, Team Leader, Shift Start Hour, Shift End Hour, and 7 date columns (DD/MM)`
      });
    }
    
    // Now identify and validate date columns (these are also required)
    let excelDateColumns = [];
    const datePattern = /^\d{1,2}\/\d{1,2}/; // Pattern for DD/MM format
    
    for (const col of availableColumns) {
      if (datePattern.test(col)) {
        excelDateColumns.push(col);
      }
    }
    
    // Date columns are required - must have exactly 7
    if (excelDateColumns.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No date columns found in Excel. Date columns are required. Looking for columns like: 02/03, 02/03 Mon, etc. Found columns: ${availableColumns.join(', ')}`
      });
    }
    
    if (excelDateColumns.length !== 7) {
      return res.status(400).json({
        success: false,
        message: `Excel must have exactly 7 date columns (one for each day of the week). Found: ${excelDateColumns.length} columns: ${excelDateColumns.join(', ')}`
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
    const errors = [];
    
    for (const [index, row] of formattedData.entries()) {
      try {
        const name = (row[columnMap['Name']] || "").toString().trim();
        if (!name) {
          continue;
        }
        
        const username = name.toLowerCase().replace(/\s+/g, '.');
        const employeeKey = `${username}-${startDate}-${endDate}`;
        
        if (processedEmployees.has(employeeKey)) {
          console.warn(`Duplicate entry for employee ${name}, skipping`);
          continue;
        }
        processedEmployees.add(employeeKey);
        
        const rowTeamLeader = (row[columnMap['Team Leader']] || "").toString().trim();
        
        if (isAllowedDepartmentEmployee && rowTeamLeader && rowTeamLeader.toLowerCase() !== user.username.toLowerCase()) {
          console.log(`Department employee ${user.username} uploading for team leader: ${rowTeamLeader}`);
        }
        
        let userRecord = await User.findOne({ username: username });
        if (!userRecord) {
          userRecord = await User.findOne({ 
            $or: [
              { name: name },
              { username: { $regex: new RegExp(`^${name.split(' ')[0].toLowerCase()}`, 'i') } }
            ]
          });
        }
        
        // TRANSPORT: Case-insensitive validation
        const transportValue = (row[columnMap['Transport']] || "").toString().trim();
        const transportUpper = transportValue.toUpperCase();
        const validTransport = ["YES", "NO", ""];
        
        if (!validTransport.includes(transportUpper)) {
          errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid transport value "${transportValue}". Must be "Yes", "No", or empty (case-insensitive).`);
          continue;
        }
        
        // Store the original case value but normalize for display
        const normalizedTransport = transportUpper === "YES" ? "Yes" : transportUpper === "NO" ? "No" : "";
        
        // CAB ROUTE: Accept any value (string or number)
        const cabRouteValue = columnMap['CAB Route'] 
          ? (row[columnMap['CAB Route']] || "").toString().trim() 
          : "";
        
        const dailyStatus = [];
        const statusDate = new Date(selectedStartDate);
        
        for (let i = 0; i < excelDateColumns.length; i++) {
          const excelDateColumn = excelDateColumns[i];
          const rawStatusValue = (row[excelDateColumn] || "P").toString().trim();
          const statusValue = rawStatusValue.toUpperCase(); // Convert to uppercase for validation
          
          // Valid status values (uppercase for comparison)
          const validStatus = ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", ""];
          
          if (!validStatus.includes(statusValue)) {
            errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid status "${rawStatusValue}" on column ${excelDateColumn}. Valid values: P, WO, L, NCNS, UL, LWP, BL, H, LWD, HD (case-insensitive).`);
            continue;
          }
          
          const date = new Date(statusDate);
          date.setHours(0, 0, 0, 0);
          
          dailyStatus.push({
            date: date,
            status: statusValue || "P", // Store uppercase
            originalExcelColumn: excelDateColumn
          });
          
          statusDate.setDate(statusDate.getDate() + 1);
        }
        
        // Check if there were any errors in status processing
        if (errors.length > 0) {
          continue;
        }
        
        const woCount = dailyStatus.filter(d => d.status === "WO").length;
        if (woCount > 2) {
          errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Cannot have more than 2 week-offs (WO) in a week. Found: ${woCount}`);
          continue;
        }
        
        const shiftStartHour = parseInt(row[columnMap['Shift Start Hour']]);
        const shiftEndHour = parseInt(row[columnMap['Shift End Hour']]);
        
        if (isNaN(shiftStartHour) || isNaN(shiftEndHour)) {
          errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Invalid shift hours. Must be numbers between 0-23.`);
          continue;
        }
        
        if (shiftStartHour < 0 || shiftStartHour > 23 || shiftEndHour < 0 || shiftEndHour > 23) {
          errors.push(`Row ${index + dataStartRowIndex + 1} (${name}): Shift hours must be between 0 and 23.`);
          continue;
        }
        
        employeesData.push({
          userId: userRecord?._id || null,
          name: name,
          username: username,
          transport: normalizedTransport, // Store normalized value
          cabRoute: cabRouteValue, // Any value accepted
          shiftStartHour: shiftStartHour,
          shiftEndHour: shiftEndHour,
          dailyStatus: dailyStatus,
          teamLeader: rowTeamLeader,
          excelDateMapping: excelDateColumns
        });
      } catch (rowError) {
        console.error(`Error processing row ${index + dataStartRowIndex + 1}:`, rowError);
        errors.push(`Row ${index + dataStartRowIndex + 1}: ${rowError.message}`);
      }
    }
    
    // If there are any errors, return them all at once
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors found in Excel file",
        errors: errors.slice(0, 10), // Return first 10 errors to avoid huge response
        totalErrors: errors.length
      });
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
      roster.weeks[existingWeekIndex] = {
        weekNumber: weekNumber,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        employees: employeesData
      };
    } else {
      roster.weeks.push({
        weekNumber: weekNumber,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        employees: employeesData
      });
    }
    
    await roster.save();
    
    let permissionsNote = "";
    if (isAllowedDepartmentEmployee) {
      permissionsNote = "Ops-Meta, Marketing, and CS employees: Can upload for any team (future dates from tomorrow only)";
    } else if (isAdmin) {
      permissionsNote = "Admin/HR: Can upload for any team (today and future dates only)";
    } else if (isSuperAdmin) {
      permissionsNote = "SuperAdmin: Can upload for any team (any date - past, present, future)";
    }
    
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
            permissions: permissionsNote
          }
        },
        excelFormat: {
          requiredColumns: [...baseRequiredColumns, ...excelDateColumns],
          optionalColumns: optionalColumns,
          note: "Username is auto-generated from Name. Date columns (7 days) are required. Total count columns are optional. All text fields are case-insensitive.",
          transportValues: ['Yes', 'No', ''],
          statusValues: ['P', 'WO', 'L', 'NCNS', 'UL', 'LWP', 'BL', 'H', 'LWD', "HD", ''],
          permissionsNote: permissionsNote
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

export const exportRosterTemplate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { accountType } = req.user;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const fromDate = new Date(startDate);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);

    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const isSuperAdmin = accountType === 'superAdmin';
    
    if (!isSuperAdmin) {
      if (diffDays !== 7) {
        return res.status(400).json({
          success: false,
          message: `Date range must be exactly 7 days. You selected ${diffDays} days. Please select a 7-day period.`
        });
      }
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

    const headers = [
      'Name',
      'Transport',
      'CAB Route',
      'Team Leader',
      'Shift Start Hour',
      'Shift End Hour',
      ...dateHeaders,
      'Total Present',
      'Total Week Off',
      'Total Leave',
      'Total No Call No Show',
      'Total Unpaid Leave',
      'Total Leave Without Pay',
      'Total Bereavement Leave',
      'Total Holiday',
      'Half Day',
      'Total Last Working Day'
    ];

    const workbook = XLSX.utils.book_new(); 
    workbook.Props = {
      Title: `Roster_Template_${fromDate.getFullYear()}-${(fromDate.getMonth()+1)}-${fromDate.getDate()}`,
      Author: "Task Management CRM",
      CreatedDate: new Date()
    };

    const data = [];
    data.push(headers); 

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: headers[C] || "" };
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

    const colWidths = [
      { wch: 25 }, 
      { wch: 15 },  
      { wch: 15 },  
      { wch: 15 }, 
      { wch: 15 }, 
      { wch: 15 },  
      ...Array(dateHeaders.length).fill({ wch: 12 }), 
      { wch: 12 },  
      { wch: 12 },  
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

    worksheet['!rows'] = [
      { hpt: 25 } 
    ];

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

>>>>>>> a4bba92 (Initial commit on Farhan_dev)
