// middleware/validation.js
export const validateRosterWeek = (req, res, next) => {
  const { month, year, weekNumber, startDate, endDate, employees } = req.body;
  
  if (!month || !year || !weekNumber || !startDate || !endDate || !employees) {
    return res.status(400).json({ 
      message: "Missing required fields: month, year, weekNumber, startDate, endDate, employees" 
    });
  }
  
  if (!Array.isArray(employees)) {
    return res.status(400).json({ 
      message: "Employees must be an array" 
    });
  }
  
  if (employees.length === 0) {
    return res.status(400).json({ 
      message: "At least one employee is required" 
    });
  }
  
  next();
};