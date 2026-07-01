import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineUserGroup, HiOutlineCheckCircle, HiPlus, HiTrash, HiPencil, HiHome, HiOutlineBuildingLibrary, HiOutlineChartBar, HiOutlineExclamationCircle, HiOutlineCurrencyRupee, HiOutlineBell, HiOutlineCalendarDays } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";

const SellerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifCounts, setNotifCounts] = useState({ dueSoon: 0, overdue: 0, vacantRooms: 0, totalTenants: 0 });
  const [revenue, setRevenue] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState("");

  useEffect(() => {
    if (!user) return;
    if (!token || user.role !== "owner") {
      navigate("/login");
      return;
    }
    fetchAllData();
  }, [token, user]);

  const fetchAllData = async () => {
    try {
      const [propsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/property/my-properties`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const props = propsRes.data.properties || [];
      setProperties(props);
      setNotifications(notifRes.data.notifications || []);
      setNotifCounts(notifRes.data.counts || {});

      if (props.length > 0) {
        const pid = props[0]._id;
        setSelectedProperty(pid);
        const [occRes, revRes, pendingRes] = await Promise.all([
          axios.get(`${API_URL}/api/reports/occupancy?propertyId=${pid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/reports/revenue?propertyId=${pid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/payments/pending?propertyId=${pid}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setOccupancy(occRes.data);
        setRevenue(revRes.data.totalRevenue || 0);
        setPendingDues(pendingRes.data.totalPending || 0);
      }
    } catch {
      try {
        const res = await mockApi.getProperties("");
        const userProps = (res.data.properties || []).filter(
          p => p.seller?._id === user?._id
        );
        setProperties(userProps);
      } catch {
        setProperties([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm("Delete this PG permanently?")) return;
    try {
      await axios.delete(`${API_URL}/api/property/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
    } catch {}
  };

  const kpiCards = [
    { title: "Total Rooms", value: occupancy?.total || 0, icon: HiOutlineBuildingLibrary, color: "#0d6e59", bg: "#f0fdf4" },
    { title: "Occupied", value: occupancy?.occupied || 0, icon: HiOutlineUserGroup, color: "#3b82f6", bg: "#eff6ff" },
    { title: "Vacant", value: occupancy?.vacant || 0, icon: HiHome, color: "#f59e0b", bg: "#fffbeb" },
    { title: "Monthly Revenue", value: `₹${(revenue || 0).toLocaleString("en-IN")}`, icon: HiOutlineCurrencyRupee, color: "#0d6e59", bg: "#f0fdf4" },
    { title: "Pending Dues", value: `₹${(pendingDues || 0).toLocaleString("en-IN")}`, icon: HiOutlineExclamationCircle, color: "#ef4444", bg: "#fef2f2" },
  ];

  const alertCards = [];
  if (notifCounts.overdue > 0) {
    alertCards.push({
      type: "danger",
      icon: HiOutlineExclamationCircle,
      title: `${notifCounts.overdue} overdue rent payment(s)`,
      desc: "Tenants haven't paid this month. Check rent collection.",
      link: "/tenants",
    });
  }
  if (notifCounts.dueSoon > 0) {
    alertCards.push({
      type: "warning",
      icon: HiOutlineBell,
      title: `${notifCounts.dueSoon} rent payment(s) due soon`,
      desc: "Due within the next 3 days. Send reminders.",
      link: "/tenants",
    });
  }
  if (notifCounts.vacantRooms > 0) {
    alertCards.push({
      type: "info",
      icon: HiHome,
      title: `${notifCounts.vacantRooms} vacant room(s)`,
      desc: "Fill them quickly to maximize revenue.",
      link: "/rooms",
    });
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div className="loader"></div>
    </div>
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
        <HiHome size={14} /> <span>Dashboard</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "4px" }}>
            PG Management Dashboard — monitor occupancy, revenue, and due dates.
          </p>
        </div>
        <Link to="/add-property" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "#0d6e59", color: "#fff", padding: "10px 20px",
          borderRadius: "12px", fontWeight: 700, fontSize: "0.875rem",
          textDecoration: "none", transition: "background 0.2s"
        }}>
          <HiPlus size={18} /> Register New PG
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {kpiCards.map((kpi, idx) => (
          <div key={idx} style={{
            background: "#fff", borderRadius: "16px", padding: "20px",
            border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.title}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      {alertCards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {alertCards.map((alert, i) => {
            const colors = {
              danger: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", iconColor: "#ef4444" },
              warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", iconColor: "#f59e0b" },
              info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", iconColor: "#3b82f6" },
            };
            const c = colors[alert.type];
            return (
              <Link key={i} to={alert.link} style={{ textDecoration: "none" }}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px",
                  padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px"
                }}>
                  <alert.icon size={22} style={{ color: c.iconColor, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: c.text }}>{alert.title}</div>
                    <div style={{ fontSize: "0.8rem", color: c.text, opacity: 0.8 }}>{alert.desc}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Management Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "32px" }}>
        {[
          { title: "Rooms", icon: HiOutlineBuildingLibrary, path: "/rooms", color: "#0d6e59", bg: "#f0fdf4" },
          { title: "Tenants", icon: HiOutlineUserGroup, path: "/tenants", color: "#3b82f6", bg: "#eff6ff" },
          { title: "Staff", icon: HiOutlineEye, path: "/staff", color: "#8b5cf6", bg: "#f5f3ff" },
          { title: "Reports", icon: HiOutlineChartBar, path: "/reports", color: "#f59e0b", bg: "#fffbeb" },
        ].map((item, i) => (
          <Link key={i} to={item.path} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", textAlign: "center"
            }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{item.title}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: "24px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
            <HiOutlineBell size={18} style={{ color: "#0d6e59" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>Recent Alerts</h2>
          </div>
          <div style={{ padding: "8px 0" }}>
            {notifications.slice(0, 5).map((n, i) => (
              <div key={i} style={{
                padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px",
                borderBottom: i < notifications.length - 1 ? "1px solid #f8fafc" : "none"
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: n.type === "overdue" ? "#fef2f2" : "#fffbeb",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {n.type === "overdue"
                    ? <HiOutlineExclamationCircle size={16} style={{ color: "#ef4444" }} />
                    : <HiOutlineCalendarDays size={16} style={{ color: "#f59e0b" }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{n.message}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>₹{(n.amount || 0).toLocaleString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My PGs / Properties Table */}
      <div style={{
        background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "12px"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            My PGs ({properties.length})
          </h2>
        </div>

        {properties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏠</div>
            <h3 style={{ color: "#1e293b", margin: "0 0 8px" }}>No PGs Registered Yet</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 20px" }}>
              Register your first PG/Hostel to start managing rooms, tenants, and rent.
            </p>
            <Link to="/add-property" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#0d6e59", color: "#fff", padding: "12px 24px",
              borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem",
              textDecoration: "none"
            }}>
              <HiPlus size={18} /> Register Your First PG
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PG Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rent</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property._id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <Link to={`/property/${property._id}`} style={{ fontWeight: 600, color: "#1e293b", textDecoration: "none", fontSize: "0.875rem" }}>
                        {property.title}
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                        {property.propertyType} • {property.bhk} Sharing
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", color: "#64748b" }}>
                      {property.area}, {property.city}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.875rem", fontWeight: 700, color: "#0d6e59" }}>
                      ₹{Number(property.price).toLocaleString("en-IN")}/mo
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => navigate(`/edit-property/${property._id}`)}
                          style={{
                            padding: "6px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                            background: "#fff", cursor: "pointer", fontSize: "0.75rem",
                            fontWeight: 600, color: "#0d6e59", display: "inline-flex",
                            alignItems: "center", gap: "4px", transition: "all 0.15s"
                          }}
                        >
                          <HiPencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(property._id)}
                          style={{
                            padding: "6px 12px", borderRadius: "8px", border: "1px solid #fecaca",
                            background: "#fff", cursor: "pointer", fontSize: "0.75rem",
                            fontWeight: 600, color: "#ef4444", display: "inline-flex",
                            alignItems: "center", gap: "4px", transition: "all 0.15s"
                          }}
                        >
                          <HiTrash size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;