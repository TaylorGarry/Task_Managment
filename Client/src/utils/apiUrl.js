const PROD_API_BASE_URL = "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";
const LOCAL_API_BASE_URL = "http://localhost:4000/api/v1";

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const envUrl = trimTrailingSlash(import.meta?.env?.VITE_API_URL);
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return LOCAL_API_BASE_URL;
    }
  }

  return PROD_API_BASE_URL;
};

