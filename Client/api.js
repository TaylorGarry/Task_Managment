import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app", 
});
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000", 
// });

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
