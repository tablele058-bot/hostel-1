import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineUserGroup, HiOutlineTicket, HiOutlineCheckCircle, HiShieldCheck, HiOutlineUsers, HiTrash } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { adminDashboardStyles as s } from "../../assets/dummyStyles";
import { HiOutlineLibrary, HiRefresh, HiOutlineMail } from "react-icons/hi";

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [healthOk, setHealthOk] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    fetchStats();
  }, [token, user]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data || {});
    } catch (err) {
      console.error("Failed to fetch admin stats");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      icon: HiOutlineUserGroup,
      color: "#0d9488",
      bg: "#ccfbf1",
    },
    {
      title: "Total Properties",
      value: stats.totalProperties || 0,
      icon: HiOutlineLibrary,
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    {
      title: "Active Listings",
      value: stats.activeListings || 0,
      icon: HiOutlineTicket,
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      title: "Sold Properties",
      value: stats.soldProperties || 0,
      icon: HiOutlineCheckCircle,
      color: "#10b981",
      bg: "#dcfce7",
    },
  ];

  const services = ["Database", "Media Storage", "Auth Service", "API Gateway"];

  if (loading) {
    return (
      <div className={s.loaderFullPage}>
        <div className={s.loader}></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className={s.headerContainer}>
        <div>
          <h1 className={s.pageTitle}>Admin Dashboard</h1>
          <p className={s.pageSubtitle}>
            Manage your platform at a glance
          </p>
        </div>
        <button onClick={fetchStats} className={s.refreshButton}>
          <HiRefresh size={18} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className={s.statsGrid}>
        {statCards.map((stat, idx) => (
          <div key={idx} className={s.statCard}>
            <div
              className={s.statIconContainer}
              style={{ background: stat.bg }}
            >
              <stat.icon size={24} style={{ color: stat.color }} />
            </div>
            <div>
              <div className={s.statTitle}>{stat.title}</div>
              <div className={s.statValue}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health & Admin Tools */}
      <div className={s.secondGrid}>
        {/* System Health */}
        <div className={s.systemHealthCard}>
          <h3 className={s.systemHealthTitle}>System Health</h3>
          <div className={s.servicesContainer}>
            {services.map((service, i) => (
              <div key={i} className={s.serviceItem}>
                <span className={s.serviceName}>{service}</span>
                <div className={s.statusContainer}>
                  <div className={s.statusDot}></div>
                  <span className={s.statusText}>Operational</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Tools */}
        <div className={s.adminToolsCard}>
          <h3 className={s.adminToolsTitle}>Admin Tools</h3>
          <p className={s.adminToolsDesc}>
            Quick access to administrative functions
          </p>
          <div className={s.adminToolsButtonsContainer}>
            <Link to="/admin/users" className={s.adminToolButton}>
              <HiOutlineUsers size={20} /> Manage Users
            </Link>
            <Link to="/admin/properties" className={s.adminToolButton}>
              <HiOutlineLibrary size={20} /> Manage Properties
            </Link>
            <Link to="/admin/inquiries" className={s.adminToolButton}>
              <HiOutlineMail size={20} /> View Inquiries
            </Link>
            <Link to="/admin/contacts" className={s.adminToolButton}>
              <HiOutlineMail size={20} /> Contact Inbox
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
