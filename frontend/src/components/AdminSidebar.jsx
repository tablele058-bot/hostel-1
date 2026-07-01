import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HiOutlineUsers, HiOutlineUserCircle, HiOutlineChatBubbleLeftRight, HiXMark, HiHome } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { adminSidebarStyles as s } from "../assets/dummyStyles";
import { HiOutlineViewGrid, HiOutlineLibrary, HiOutlineMail } from "react-icons/hi";

const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: "Overview", icon: HiOutlineViewGrid, path: "/admin-dashboard" },
    { name: "Users", icon: HiOutlineUsers, path: "/admin/users" },
    {
      name: "Seller Requests",
      icon: HiOutlineUserCircle,
      path: "/admin/seller-requests",
    },
    { name: "Properties", icon: HiOutlineLibrary, path: "/admin/properties" },
    { name: "Inquiries", icon: HiOutlineChatBubbleLeftRight, path: "/admin/inquiries" },
    { name: "Contact Inbox", icon: HiOutlineMail, path: "/admin/contacts" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className={s.backdrop(isOpen)} onClick={onClose} />

      <div className={s.sidebar(isOpen)}>
        <div className={s.logoContainer}>
          <NavLink
            to="/admin-dashboard"
            className="flex items-center gap-2 text-xl font-extrabold text-primary no-underline"
          >
            <span className="bg-primary text-white p-2 rounded-xl">
              <HiHome size={20} />
            </span>
            <span className="text-[#0d6e59]">Admin</span>
          </NavLink>
          <button
            onClick={onClose}
            className="md:hidden bg-transparent border-none text-text-main cursor-pointer"
          >
            <HiXMark size={22} />
          </button>
        </div>

        <nav className={s.navContainer}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin-dashboard"}
              className={({ isActive }) => s.navLink(isActive)}
              onClick={onClose}
            >
              <item.icon size={22} />
              <span>{item.name}</span>
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

export default AdminSidebar;
