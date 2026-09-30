export const getEffectiveTaskDate = () => {
  const istTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  if (istTime.getHours() < 10) {
    istTime.setDate(istTime.getDate() - 1);
  }

  istTime.setHours(0, 0, 0, 0);
  return istTime;
};
