

const getShiftDate = () => {
  const now = new Date();

  const usOffsetMinutes = -4 * 60;  
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const usTime = new Date(utc -  usOffsetMinutes * 60000);

  const hours = usTime.getHours();  

  const shiftStart = 17;  
  const shiftEnd = 10;  

  const allowed = hours >= shiftStart || hours < shiftEnd;

  if (!allowed) {
    return { allowed: false, message: "Task update not allowed right now." };
  }

  const shiftDate = new Date(usTime);
  if (hours < shiftEnd) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  shiftDate.setHours(0, 0, 0, 0);

  const day = String(shiftDate.getDate()).padStart(2, "0");
  const month = String(shiftDate.getMonth() + 1).padStart(2, "0");
  const year = shiftDate.getFullYear();
  const formatted = `${day}-${month}-${year}`;

  return { allowed: true, taskDate: formatted };
};
console.log(getShiftDate());
