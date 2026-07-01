import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiEye } from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import { registerStyles as s } from "../../assets/dummyStyles";
import { HiEyeOff } from "react-icons/hi";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "owner",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await register(formData);
      if (data.role === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageWrapper}>
      <div className={s.container}>
        <div className={s.formCard}>
          <h2 className={s.heading}>Create Account</h2>
          <p className={s.subheading}>Join us and find your perfect PG</p>

          {error && <div className={s.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.label}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={s.input}
                placeholder="Anything"
              />
            </div>

            <div>
              <label className={s.label}>Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={s.input}
                placeholder="Anything"
              />
            </div>

            <div>
              <label className={s.label}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
              <label className={s.label}>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={s.input}
                placeholder="Anything"
              />
            </div>

            <div>
              <label className={s.label}>I want to</label>
              <div className={s.roleContainer}>
                <label
                  className={`${s.roleLabelBase} ${formData.role === "viewer" ? s.roleLabelActive : s.roleLabelInactive}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={formData.role === "viewer"}
                    onChange={handleChange}
                    className={s.hiddenRadio}
                  />
                  <span className="font-semibold">Browse PGs</span>
                </label>
                <label
                  className={`${s.roleLabelBase} ${formData.role === "owner" ? s.roleLabelActive : s.roleLabelInactive}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={formData.role === "owner"}
                    onChange={handleChange}
                    className={s.hiddenRadio}
                  />
                  <span className="font-semibold">List My PG</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={s.submitButton}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className={s.footerText}>
            Already have an account?{" "}
            <Link to="/login" className={s.loginLink}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
