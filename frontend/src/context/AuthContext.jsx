import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function mapUser(data) {
  if (!data) return null;
  return {
    _id: data._id,
    username: data.username || "",
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    role: data.role || "viewer",
    isApproved: data.isApproved ?? true,
    isBlocked: data.isBlocked ?? false,
    profilePic: data.profilePic,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.data) {
            setUser(mapUser(res.data));
          } else {
            localStorage.removeItem("token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password, role) => {
    const payload = { password, role };
    if (username.includes("@")) {
      payload.email = username;
    } else {
      payload.username = username;
    }
    const res = await api.post("/api/auth/login", payload);
    const data = res.data;
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(mapUser(data));
    return { role: data.role };
  }, []);

  const register = useCallback(async (formData) => {
    const res = await api.post("/api/auth/register", formData);
    const data = res.data;
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(mapUser(data));
    return { role: data.role };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    if (updates.role) localStorage.setItem("userRole", updates.role);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
