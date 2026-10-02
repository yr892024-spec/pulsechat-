import axios from "axios";


// ============================================================
// AXIOS INSTANCE
// ============================================================

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== "undefined" && window.location.port === "5173") {
        return "http://localhost:5000/api";
    }
    return "/api";
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        "Content-Type": "application/json"
    }
});


// ============================================================
// ADD JWT TOKEN
// ============================================================

api.interceptors.request.use((config) => {

    const token =
        localStorage.getItem("token");


    if (token) {

        config.headers.Authorization =
            `Bearer ${token}`;

    }


    return config;

});


// ============================================================
// EXPORT
// ============================================================

export default api;