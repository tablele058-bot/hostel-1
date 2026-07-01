import axios from "axios";
import { mockApi } from "./mockApi";

let backendAvailable = null;

async function checkBackend() {
  try {
    await axios.get("/api/health", { timeout: 3000 });
    backendAvailable = true;
  } catch {
    backendAvailable = false;
  }
}

const initPromise = checkBackend();

setTimeout(() => setInterval(checkBackend, 30000), 5000);

async function ensureBackendCheck() {
  if (backendAvailable === null) {
    await initPromise;
  }
}

const api = {
  async get(url, config) {
    await ensureBackendCheck();
    if (backendAvailable === false) {
      const path = url.replace("/api", "");
      if (path === "/property" || path.startsWith("/property?")) {
        const params = config?.params ? new URLSearchParams(config.params).toString() : "";
        return mockApi.getProperties(params);
      }
      if (path.startsWith("/property/") && !path.includes("?")) {
        const id = path.split("/").pop();
        return mockApi.getProperty(id);
      }
      if (path === "/property/counts") {
        return mockApi.getCounts();
      }
      if (path === "/auth/profile") {
        const token = config?.headers?.Authorization?.replace("Bearer ", "");
        return mockApi.getProfile(token);
      }
    }
    try {
      return await axios.get(url, config);
    } catch (err) {
      if (backendAvailable === false) throw err;
      backendAvailable = false;
      return api.get(url, config);
    }
  },

  async post(url, data, config) {
    await ensureBackendCheck();
    if (backendAvailable === false) {
      const path = url.replace("/api", "");
      if (path === "/auth/register") return mockApi.register(data);
      if (path === "/auth/login") return mockApi.login(data);
      if (path === "/property") return mockApi.createProperty(data);
    }
    try {
      return await axios.post(url, data, config);
    } catch (err) {
      if (backendAvailable === false) throw err;
      backendAvailable = false;
      return api.post(url, data, config);
    }
  },

  async put(url, data, config) {
    await ensureBackendCheck();
    if (backendAvailable === false) {
      const path = url.replace("/api", "");
      const match = path.match(/^\/property\/(.+)$/);
      if (match) return mockApi.updateProperty(match[1], data);
    }
    try {
      return await axios.put(url, data, config);
    } catch (err) {
      if (backendAvailable === false) throw err;
      backendAvailable = false;
      return api.put(url, data, config);
    }
  },

  async delete(url, config) {
    await ensureBackendCheck();
    if (backendAvailable === false) {
      const path = url.replace("/api", "");
      const match = path.match(/^\/property\/(.+)$/);
      if (match) return mockApi.deleteProperty(match[1]);
    }
    try {
      return await axios.delete(url, config);
    } catch (err) {
      if (backendAvailable === false) throw err;
      backendAvailable = false;
      return api.delete(url, config);
    }
  },

  async patch(url, data, config) {
    await ensureBackendCheck();
    if (backendAvailable === false) return { data: { success: true } };
    try {
      return await axios.patch(url, data, config);
    } catch {
      return { data: { success: true } };
    }
  },
};

export default api;
