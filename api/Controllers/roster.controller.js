import XLSX from "xlsx-js-style";
import Roster from "../Modals/Roster.modal.js";
import User from "../Modals/User.modal.js";

// export const addRosterWeek = async (req, res) => {
//   try {
//     const { month, year, weekNumber, startDate, endDate, employees, action = "create" } = req.body;
//     const createdBy = req.user._id;  

//     if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
//       return res.status(400).json({ 
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

//         const employeeData = {
//           userId: user?._id || null,
//           name: emp.name,
//           transport: emp.transport || "",
//           cabRoute: emp.cabRoute || "",
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

    // Find the roster
    const roster = await Roster.findOne({ month, year });
    if (!roster) {
      return res.status(403).json({ 
        success: false,
        message: "Roster not found" 
      });
    }

    // Find the week
    const week = roster.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) {
      return res.status(403).json({ 
        success: false,
        message: "Week not found in roster" 
      });
    }

    // Check if it's a previous week
    const currentDate = new Date();
    const weekEndDate = new Date(week.endDate);
    
    // Set week end date to end of day (23:59:59.999)
    weekEndDate.setHours(23, 59, 59, 999);
    
    // Debug logs
    console.log('Current Date:', currentDate);
    console.log('Week End Date (EOD):', weekEndDate);
    console.log('Is Past Week?', currentDate > weekEndDate);

    // BLOCK ALL UPDATES FOR PREVIOUS WEEKS
    if (currentDate > weekEndDate) {
      return res.status(403).json({
        success: false,
        message: "Cannot update previous week rosters. Previous weeks are locked for all users."
      });
    }

    // Find the employee
    const employee = week.employees.id(employeeId);
    if (!employee) {
      return res.status(403).json({ 
        success: false,
        message: "Employee not found in this week" 
      });
    }

    // Define allowed fields for update
    const allowedFields = [
      "name",
      "userId",
      "transport",
      "cabRoute",
      "shiftStartHour",
      "shiftEndHour",
      "dailyStatus",
    ];

    // Validate that shift hours are provided if being updated
    if (updates.shiftStartHour !== undefined || updates.shiftEndHour !== undefined) {
      if (updates.shiftStartHour === undefined || updates.shiftEndHour === undefined) {
        return res.status(400).json({
          success: false,
          message: "Both shiftStartHour and shiftEndHour are required when updating shift hours"
        });
      }
    }

    // Validate shift hour values if being updated
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

    // Validate WO count if dailyStatus is being updated
    if (updates.dailyStatus && Array.isArray(updates.dailyStatus)) {
      const woCount = updates.dailyStatus.filter(d => d && d.status === "WO").length;
      if (woCount > 2) {
        return res.status(400).json({
          success: false,
          message: "Cannot have more than 2 week-offs (WO) in a week"
        });
      }
    }

    // Update allowed fields
    Object.keys(updates).forEach((field) => {
      if (allowedFields.includes(field)) {
        // Skip shift hour fields as they're already processed
        if (field !== "shiftStartHour" && field !== "shiftEndHour") {
          employee[field] = updates[field];
        }
      }
    });

    // Ensure shift hours are always set
    employee.shiftStartHour = shiftStartHour;
    employee.shiftEndHour = shiftEndHour;

    // Validate that both shift hours exist
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
      accountType: user.accountType
    });

  } catch (error) {
    console.error("Update roster error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Server error"
    });
  }
};
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
      
      // Add all summary headers - even if they might be empty
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
        
        // Initialize all counters to 0
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
            
            // For empty cells, push empty string instead of null/undefined
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
          // If no dailyStatus, add empty cells for all days
          const dayCount = week.employees[0]?.dailyStatus?.length || 0;
          for (let i = 0; i < dayCount; i++) {
            row.push("");
            totalEmpty++;
          }
        }
        
        // Add summary counts to row - always add all 8 values
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

      // Add summary row at the bottom
      if (week.employees.length > 0) {
        const summaryRow = ["", "", "", "", "Summary"];
        
        // Calculate day count properly
        const dayCount = week.employees[0]?.dailyStatus?.length || 0;
        
        // Add empty cells for date columns
        for (let i = 0; i < dayCount; i++) {
          summaryRow.push("");
        }
        
        // Calculate totals for all status types - initialize to 0
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
        
        // Add total counts to summary row - always add all 8 values
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
      
      // Ensure all cells are properly formatted
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Style header row - FIXED: Make sure all headers are styled
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        
        // Create header cell if it doesn't exist
        if (!worksheet[cellAddress]) {
          worksheet[cellAddress] = { v: header[C] || "" };
        }
        
        let bgColor = "4472C4";  
        // Last 8 columns are summary columns
        const summaryStartCol = range.e.c - 7;  // Adjusted calculation
        if (C >= summaryStartCol && C <= range.e.c) {  
          bgColor = "FF9900";  // Orange for summary headers
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
        const isSummaryRow = (R === range.e.r);
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          
          // Ensure cell exists
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
          const summaryStartCol = 5 + dayCount;  // First 5 columns + day columns
          
          if (!isSummaryRow) {
            // Employee data row
            if (C >= 5 && C < summaryStartCol) { 
              // Date status cells
              const status = worksheet[cellAddress].v;
              if (status === "P") {
                cellStyle.fill = { fgColor: { rgb: "C6EFCE" } };  // Green for Present
              } else if (status === "WO") {
                cellStyle.fill = { fgColor: { rgb: "FFC7CE" } };  // Red for Week Off
              } else if (status === "L") {
                cellStyle.fill = { fgColor: { rgb: "FFEB9C" } };  // Yellow for Leave
              } else if (status === "NCNS") {
                cellStyle.fill = { fgColor: { rgb: "E7E6E6" } };  // Gray for No Call No Show
              } else if (status === "UL") {
                cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };  // Blue for Unpaid Leave
              } else if (status === "LWP") {
                cellStyle.fill = { fgColor: { rgb: "F8CBAD" } };  // Orange for Leave Without Pay
              } else if (status === "BL") {
                cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };  // Dark Gray for Balance Leave
              } else if (status === "" || status === null) {
                cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  // White for Empty
              } else {
                cellStyle.fill = { fgColor: { rgb: "FFFFFF" } };  // Default white
              }
            } 
            // Summary columns for employee rows
            else if (C >= summaryStartCol) {  
              cellStyle.fill = { fgColor: { rgb: "FFF2CC" } };  // Light yellow
              cellStyle.font = { bold: true };
              
              // Ensure zero values are displayed as 0, not empty
              if (worksheet[cellAddress].v === undefined || worksheet[cellAddress].v === "") {
                worksheet[cellAddress].v = 0;
              }
            }
          } 
          // Summary row styling
          else if (isSummaryRow) {
            cellStyle.font = { bold: true };
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray
            
            // Summary columns in summary row
            if (C >= summaryStartCol) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue
            }
          }
          
          worksheet[cellAddress].s = cellStyle;
        }
      }

      // Set column widths - ensure all columns have proper width
      const dateCols = week.employees[0]?.dailyStatus?.length || 0;
      const colWidths = [
        { wch: 20 },  // Name
        { wch: 15 },  // Transport
        { wch: 15 },  // CAB Route
        { wch: 15 },  // Shift Start Hour
        { wch: 15 },  // Shift End Hour
        ...Array(dateCols).fill({ wch: 12 }),  // Date columns (reduced from 15 to 12)
        { wch: 12 },  // Total WO
        { wch: 12 },  // Total L
        { wch: 12 },  // Total P
        { wch: 12 },  // Total NCNS
        { wch: 12 },  // Total UL
        { wch: 12 },  // Total LWP
        { wch: 12 },  // Total BL
        { wch: 12 }   // Total Empty
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

    roster.weeks.forEach((week) => {
      const sortedEmployees = [...week.employees].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      const data = [];
      
      const header = ["Name", "Transport", "CAB Route", "Shift Start Hour", "Shift End Hour"];
      
      const dayCount = sortedEmployees[0]?.dailyStatus?.length || 0;
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(week.startDate);
        date.setDate(date.getDate() + i);
        header.push(formatDateWithDay(date));
      }
      
      header.push("Total WO");
      header.push("Total L");
      header.push("Total P");
      header.push("Total H");
      
      data.push(header);

      sortedEmployees.forEach((emp) => {
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
        let totalH = 0;
        
        if (emp.dailyStatus && emp.dailyStatus.length > 0) {
          emp.dailyStatus.forEach((ds) => {
            const status = ds?.status || "";
            row.push(status);
            
            if (status === "P") totalP++;
            else if (status === "WO") totalWO++;
            else if (status === "L") totalL++;
            else if (status === "H") totalH++;
          });
        } else {
          for (let i = 0; i < dayCount; i++) {
            row.push("");
          }
        }
        
        row.push(totalWO);
        row.push(totalL);
        row.push(totalP);
        row.push(totalH);
        
        data.push(row);
      });

      if (sortedEmployees.length > 0) {
        const summaryRow = ["", "", "", "", "Summary"];
        
        for (let i = 0; i < dayCount; i++) {
          summaryRow.push("");
        }
        
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
        
        data.push(summaryRow);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;
        
        let bgColor = "4472C4";  
        if (C >= range.e.c - 3) {  
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
              cellStyle.font = { bold: true };
            }
          } else if (isSummaryRow) {
            cellStyle.font = { bold: true };
            cellStyle.fill = { fgColor: { rgb: "F2F2F2" } }; // Light gray
            
            if (C >= range.e.c - 3) {
              cellStyle.fill = { fgColor: { rgb: "DDEBF7" } }; // Light blue
            }
          }
          
          worksheet[cellAddress].s = cellStyle;
        }
      }

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
