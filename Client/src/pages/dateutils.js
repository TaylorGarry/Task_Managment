const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const BUSINESS_DAY_CUTOFF_HOUR = 11;
const BUSINESS_DAY_CUTOFF_MINUTE = 30;

const getISTNow = () => {
  return new Date(Date.now() + IST_OFFSET_MS);
};

export const getBusinessDateIST = () => {
  const istNow = getISTNow();

  const hours = istNow.getUTCHours();
  const minutes = istNow.getUTCMinutes();

  const businessDate = new Date(istNow);

  if (
    hours < BUSINESS_DAY_CUTOFF_HOUR ||
    (hours === BUSINESS_DAY_CUTOFF_HOUR && minutes < BUSINESS_DAY_CUTOFF_MINUTE)
  ) {
    businessDate.setUTCDate(businessDate.getUTCDate() - 1);
  }

  const y = businessDate.getUTCFullYear();
  const m = String(businessDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(businessDate.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

export const formatDDMMYYYY = (yyyyMMdd) => {
  if (!yyyyMMdd) return "";
  const [y, m, d] = yyyyMMdd.split("-");
  return `${d}/${m}/${y}`;
};

export const getTaskBusinessDateFromUTC = (utcDate) => {
  if (!utcDate) return "";

  const istDate = new Date(new Date(utcDate).getTime() + IST_OFFSET_MS);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(istDate.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};
