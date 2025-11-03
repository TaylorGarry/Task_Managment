

const getShiftDate = () => {
  const now = new Date();

  // Convert to US Eastern time (UTC-4)
  const usOffsetMinutes = -4 * 60; // −4 hours
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const usTime = new Date(utc -  usOffsetMinutes * 60000);

  const hours = usTime.getHours(); // current hour in US time

  const shiftStart = 17; // 5 PM
  const shiftEnd = 10;   // 10 AM next day

  // Check if current time is within 5 PM → 10 AM window
  const allowed = hours >= shiftStart || hours < shiftEnd;

  if (!allowed) {
    return { allowed: false, message: "Task update not allowed right now." };
  }

  // Determine the correct 'shift date'
  const shiftDate = new Date(usTime);
  if (hours < shiftEnd) {
    // Between midnight and 10 AM → counts for yesterday's shift
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  // Normalize to midnight
  shiftDate.setHours(0, 0, 0, 0);

  // Format as YYYY-MM-DD (or whatever you need)
  const day = String(shiftDate.getDate()).padStart(2, "0");
  const month = String(shiftDate.getMonth() + 1).padStart(2, "0");
  const year = shiftDate.getFullYear();
  const formatted = `${day}-${month}-${year}`;

  return { allowed: true, taskDate: formatted };
};
console.log(getShiftDate());



// function getShiftDate1() {
//   // Get current time in IST using built-in Intl API
//   const nowIST = new Date(
//     new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//   );

//   const hours = nowIST.getHours();

//   let allowed = false;
//   let taskDate = null;

//   // Check allowed window (4 PM today → 10 AM next day)
//   if (hours >= 16 || hours < 10) {
//     allowed = true;

//     // Determine task date
//     const taskDateObj = new Date(nowIST);
//     if (hours < 10) {
//       taskDateObj.setDate(taskDateObj.getDate() - 1); // before 10 AM → yesterday
//     }

//     // Format date as DD-MM-YYYY
//     const day = String(taskDateObj.getDate()).padStart(2, "0");
//     const month = String(taskDateObj.getMonth() + 1).padStart(2, "0");
//     const year = taskDateObj.getFullYear();

//     taskDate = `${day}-${month}-${year}`;
//   }

//   return allowed
//     ? { allowed: true, taskDate }
//     : { allowed: false, message: "Task update not allowed right now." };
// }

// console.log(getShiftDate1());