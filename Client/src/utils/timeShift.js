// src/utils/timeShift.js
export const getShiftDate = () => {
  const now = new Date();

  // Convert to US time (UTC-4)
  const usOffset = -4 * 60; // minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const usTime = new Date(utc + usOffset * 60000);

  // Define shift hours
  const shiftStartHour = 16; // 4 PM
  const shiftEndHour = 10;   // 10 AM (next day)

  let shiftDate = new Date(usTime);

  // If current time is between midnight and shiftEndHour (next day part of shift)
  if (usTime.getHours() < shiftEndHour) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  // Reset to start of day
  shiftDate.setHours(0, 0, 0, 0);

  return shiftDate;
};