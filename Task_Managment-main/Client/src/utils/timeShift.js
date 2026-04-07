export const getShiftDate = () => {
  const now = new Date();

  const usOffset = -4 * 60;  
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const usTime = new Date(utc + usOffset * 60000);

  const shiftStartHour = 16;  
  const shiftEndHour = 10;    

  let shiftDate = new Date(usTime);

  if (usTime.getHours() < shiftEndHour) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  shiftDate.setHours(0, 0, 0, 0);

  return shiftDate;
};