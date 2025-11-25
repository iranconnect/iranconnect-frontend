// frontend/utils/apiClientAdmin.js
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://api.iranconnect.org/api";

const apiClientAdmin = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "x-iranconnect-admin": "1",   // هدر الزامی فقط برای Admin
  },
});

apiClientAdmin.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    config.headers["x-iranconnect-admin"] = "1";
    return config;
  },
  (err) => Promise.reject(err)
);

export default apiClientAdmin;
