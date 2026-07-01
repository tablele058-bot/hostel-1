import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiEye } from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import { loginStyles as s } from "../../assets/dummyStyles";
import { HiEyeOff } from "react-icons/hi";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("owner");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password, role);
      if (data.role === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.containerCenter}>
        <div className={s.card}>
          <h2 className={s.title}>Welcome Back</h2>
          <p className={s.subtitle}>Sign in to manage your PG</p>

          {error && <div className={s.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.label}>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={s.input}
                placeholder="Anything"
              />
            </div>

            <div>
              <div className={s.passwordHeader}>
                <label className={s.label}>Password</label>
                <Link to="/forgot-password" className={s.forgotLink}>
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={s.input}
                  placeholder="Anything"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className={s.label}>I want to</label>
              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <label
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "12px",
                    border: role === "viewer" ? "2px solid #0d6e59" : "2px solid #e2e8f0",
                    background: role === "viewer" ? "#f0fdf4" : "#fff",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: role === "viewer" ? "#0d6e59" : "#64748b",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="loginRole"
                    value="viewer"
                    checked={role === "viewer"}
                    onChange={() => setRole("viewer")}
                    style={{ display: "none" }}
                  />
                  Browse PGs
                </label>
                <label
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    borderRadius: "12px",
                    border: role === "owner" ? "2px solid #0d6e59" : "2px solid #e2e8f0",
                    background: role === "owner" ? "#f0fdf4" : "#fff",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: role === "owner" ? "#0d6e59" : "#64748b",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="radio"
                    name="loginRole"
                    value="owner"
                    checked={role === "owner"}
                    onChange={() => setRole("owner")}
                    style={{ display: "none" }}
                  />
                  List My PG
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={s.submitButton}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className={s.footerText}>
            Don't have an account?{" "}
            <Link to="/register" className={s.registerLink}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
