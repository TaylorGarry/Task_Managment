export const getISTime = () => {
  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  console.log(`🔧 getISTime() returned: ${ist.toLocaleString('en-IN')}`);
  return ist;
};

export const getShiftDate = () => {
  const istNow = getISTime();
  const shiftDate = new Date(istNow);
  
  console.log(`🔧 getShiftDate() input: ${istNow.toLocaleString('en-IN')}`);
  console.log(`🔧 Current hour: ${istNow.getHours()}`);
  
  if (istNow.getHours() < 12) {
    console.log(`🔧 Hour < 12, subtracting 1 day`);
    shiftDate.setDate(shiftDate.getDate() - 1);
  }
  
  shiftDate.setHours(0, 0, 0, 0);
  console.log(`🔧 getShiftDate() output: ${shiftDate.toLocaleString('en-IN')}`);
  
  return shiftDate;  
};

export const calculateShiftWindows = (employee, taskDate, shift) => {
  try {
    console.log(`\n🔧 calculateShiftWindows() CALLED:`);
    console.log(`   Employee: ${employee?.username}`);
    console.log(`   Task Date input: ${taskDate.toLocaleString('en-IN')}`);
    console.log(`   Shift: ${shift}`);
    console.log(`   Employee shift hours: ${employee?.shiftStartHour}:00 to ${employee?.shiftEndHour}:00`);

    if (!employee || !taskDate || !shift) {
      console.error("❌ Missing parameters for shift calculation");
      return null;
    }

    const istTime = getISTime();
    const date = new Date(taskDate);
    
    console.log(`\n🔧 Date calculations:`);
    console.log(`   Original task date: ${date.toLocaleString('en-IN')}`);

    const getEffectiveDate = () => {
  const effectiveDate = new Date(date);
  console.log(`   Effective date before adjust: ${effectiveDate.toLocaleString('en-IN')}`);
  effectiveDate.setHours(0, 0, 0, 0);  // Just set to midnight, no day subtraction
  console.log(`   Effective date final: ${effectiveDate.toLocaleString('en-IN')}`);
  return effectiveDate;
};

    const effectiveDate = getEffectiveDate();
    
    let baseDate = new Date(effectiveDate);
    console.log(`\n🔧 Base date initial: ${baseDate.toLocaleString('en-IN')}`);
    
    // CRITICAL: For 1 AM shift workers
    if (employee.shiftStartHour === 1 && employee.shiftEndHour === 10) {
      console.log(`🔧 1 AM shift worker detected`);
      
      const currentDate = new Date(istTime);
      currentDate.setHours(0, 0, 0, 0);
      
      const taskDateOnly = new Date(effectiveDate);
      taskDateOnly.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      console.log(`   Current date: ${currentDate.toLocaleDateString('en-IN')}`);
      console.log(`   Task date only: ${taskDateOnly.toLocaleDateString('en-IN')}`);
      console.log(`   Yesterday: ${yesterday.toLocaleDateString('en-IN')}`);
      
      if (taskDateOnly.getTime() === yesterday.getTime()) {
        console.log(`   Task is from yesterday, adjusting base date to today`);
        baseDate = new Date(currentDate);
      }
    }
    
    console.log(`🔧 Base date final: ${baseDate.toLocaleString('en-IN')}`);
    
    const startShiftStart = new Date(baseDate);
    startShiftStart.setHours(employee.shiftStartHour, 0, 0, 0);
    
    console.log(`\n🔧 Shift calculations:`);
    console.log(`   Employee shift start: ${employee.shiftStartHour}:00`);
    console.log(`   Absolute start time: ${startShiftStart.toLocaleString('en-IN')}`);
    
    const windows = {
      Start: {
        start: new Date(startShiftStart),
        end: new Date(startShiftStart.getTime() + 2 * 60 * 60 * 1000)
      },
      Mid: {
        start: new Date(startShiftStart.getTime() + 3 * 60 * 60 * 1000),
        end: new Date(startShiftStart.getTime() + 6 * 60 * 60 * 1000)
      },
      End: {
        start: new Date(startShiftStart.getTime() + 8.5 * 60 * 60 * 1000),
        end: new Date(startShiftStart.getTime() + 10 * 60 * 60 * 1000)
      }
    };

    console.log(`\n🔧 Window durations:`);
    console.log(`   Start: ${windows.Start.start.toLocaleString('en-IN')} to ${windows.Start.end.toLocaleString('en-IN')}`);
    console.log(`   Mid: ${windows.Mid.start.toLocaleString('en-IN')} to ${windows.Mid.end.toLocaleString('en-IN')}`);
    console.log(`   End: ${windows.End.start.toLocaleString('en-IN')} to ${windows.End.end.toLocaleString('en-IN')}`);

    const adjustOvernight = (window) => {
      if (window.end.getDate() !== baseDate.getDate()) {
        console.log(`🔧 Adjusting overnight shift`);
        const nextDay = new Date(baseDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (window.start.getDate() === baseDate.getDate()) {
          window.end = nextDay;
          window.end.setHours(window.end.getHours(), 0, 0, 0);
        } else {
          window.start = nextDay;
          window.start.setHours(window.start.getHours(), 0, 0, 0);
          window.end = new Date(nextDay.getTime() + (window.end.getTime() - window.start.getTime()));
        }
      }
    };

    if (employee.shiftEndHour < employee.shiftStartHour) {
      console.log(`🔧 Overnight shift detected (${employee.shiftStartHour}:00 to ${employee.shiftEndHour}:00)`);
      adjustOvernight(windows.Start);
      adjustOvernight(windows.Mid);
      adjustOvernight(windows.End);
    }

    console.log(`\n🔧 Final windows:`);
    console.log(`   Start: ${windows.Start.start.toLocaleString('en-IN')} to ${windows.Start.end.toLocaleString('en-IN')}`);
    console.log(`   Mid: ${windows.Mid.start.toLocaleString('en-IN')} to ${windows.Mid.end.toLocaleString('en-IN')}`);
    console.log(`   End: ${windows.End.start.toLocaleString('en-IN')} to ${windows.End.end.toLocaleString('en-IN')}`);

    return windows;

  } catch (error) {
    console.error("❌ Error in calculateShiftWindows:", error);
    return null;
  }
};

export const getShiftWindow = (employee, taskDate, shift) => {
  console.log(`\n🔧 getShiftWindow() called:`);
  console.log(`   Employee: ${employee?.username}`);
  console.log(`   Task Date: ${taskDate.toLocaleString('en-IN')}`);
  console.log(`   Shift: ${shift}`);
  
  const windows = calculateShiftWindows(employee, taskDate, shift);
  
  if (!windows) {
    console.log(`❌ No windows calculated`);
    return null;
  }
  
  const window = windows[shift];
  
  if (!window) {
    console.log(`❌ No window found for shift: ${shift}`);
    console.log(`   Available shifts: ${Object.keys(windows).join(', ')}`);
    return null;
  }
  
  console.log(`✅ Window found:`);
  console.log(`   Start: ${window.start.toLocaleString('en-IN')}`);
  console.log(`   End: ${window.end.toLocaleString('en-IN')}`);
  console.log(`   Duration: ${((window.end - window.start) / (1000 * 60 * 60)).toFixed(1)} hours`);
  
  return window;
};