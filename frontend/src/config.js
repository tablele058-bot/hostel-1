const API_URL = import.meta.env.VITE_API_URL || "";
export { API_URL };
export const getApiUrl = () => API_URL || "";
