// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app", 
// });
// // const api = axios.create({
// //   baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000", 
// // });

// api.interceptors.request.use(
//   (config) => {
//     const user = JSON.parse(localStorage.getItem("user"));

//     if (user?.token) {
//       config.headers.Authorization = `Bearer ${user.token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;



import axios from "axios";

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");
const getBaseUrl = () => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }

  return "https://fdbs-server-a9gqg.ondigitalocean.app";
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
