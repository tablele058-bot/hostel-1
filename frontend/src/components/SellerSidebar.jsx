import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HiOutlineClipboardDocumentList, HiOutlineChartBar, HiOutlineUser, HiOutlineQuestionMarkCircle, HiXMark, HiHome, HiOutlineCreditCard, HiOutlineBuildingOffice2, HiOutlineBell, HiOutlineCalendarDays, HiOutlineCurrencyRupee } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { sellerSidebarStyles as s } from "../assets/dummyStyles";
import { HiOutlineViewGrid } from "react-icons/hi";

const SellerSidebar = ({ isOpen, onClose, notificationCount }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: HiOutlineViewGrid, path: "/dashboard" },
    { name: "My PGs", icon: HiOutlineBuildingOffice2, path: "/my-properties" },
    { name: "Rooms", icon: HiOutlineCalendarDays, path: "/rooms" },
    { name: "Tenants & Rent", icon: HiOutlineUser, path: "/tenants" },
    { name: "Staff", icon: HiOutlineCreditCard, path: "/staff" },
    { name: "Reports", icon: HiOutlineChartBar, path: "/reports" },
    { name: "Notifications", icon: HiOutlineBell, path: "/notifications", badge: notificationCount },
    { name: "Profile", icon: HiOutlineUser, path: "/profile" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div
        className={`${s.backdrop} ${isOpen ? s.backdropVisible : s.backdropHidden}`}
        onClick={onClose}
      />

      <div
        className={`${s.sidebar} ${isOpen ? s.sidebarOpen : s.sidebarClosed}`}
      >
        <div className={s.logoContainer}>
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold text-primary no-underline"
          >
            <span className="bg-primary text-white p-2 rounded-xl">
              <HiHome size={20} />
            </span>
            <span className="text-[#0d6e59]">PG Manager</span>
          </NavLink>
          <button
            onClick={onClose}
            className="md:hidden bg-transparent border-none text-text-main cursor-pointer"
          >
            <HiXMark size={22} />
          </button>
        </div>

        <nav className={s.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `${s.navLink} ${isActive ? s.navLinkActive : s.navLinkInactive}`
              }
              onClick={onClose}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                <item.icon size={22} />
                <span>{item.name}</span>
                {item.badge > 0 && (
                  <span style={{
                    marginLeft: "auto", background: "#ef4444", color: "#fff",
                    fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px",
                    borderRadius: "999px", lineHeight: "1.2"
                  }}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          ))}
        </nav>

        <div className={s.logoutContainer}>
          <button onClick={handleLogout} className={s.logoutButton}>
            <HiXMark size={22} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SellerSidebar;