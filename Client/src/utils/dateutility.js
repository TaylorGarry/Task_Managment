// utils/dateUtils.js

export const getTodayISTDateString = () => {
  const now = new Date();

  // Convert current time to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  const year = istNow.getUTCFullYear();
  const month = String(istNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istNow.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // YYYY-MM-DD
};
