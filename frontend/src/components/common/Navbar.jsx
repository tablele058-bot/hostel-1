import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiBars3,
  HiXMark,
  HiMagnifyingGlass,
  HiHeart,
  HiOutlineHeart,
  HiHome,
  HiOutlineBell,
  HiBell,
} from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";
import { navbarStyles as s } from "../../assets/dummyStyles";
import axios from "axios";
import { API_URL } from "../../config";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === "owner") {
      fetchNotifCount();
      const interval = setInterval(fetchNotifCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const c = res.data.counts || {};
      setNotifCount((c.overdue || 0) + (c.dueSoon || 0));
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsDrawerOpen(false);
  };

  const navLinks = !user
    ? [
        { name: "Home", path: "/" },
        { name: "PGs", path: "/properties" },
        { name: "Contact", path: "/contact" },
      ]
    : user.role === "owner"
      ? [
          { name: "Home", path: "/" },
          { name: "Dashboard", path: "/dashboard" },
          { name: "My PGs", path: "/my-properties" },
          { name: "Add PG", path: "/add-property" },
          { name: "Contact", path: "/contact" },
        ]
      : [
          { name: "Home", path: "/" },
          { name: "Browse PGs", path: "/properties" },
          { name: "Wishlist", path: "/wishlist" },
          { name: "Contact", path: "/contact" },
        ];

  return (
    <>
      <nav className={s.nav}>
        <div className={s.container}>
          <div className={s.grid}>
            <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-primary no-underline">
              <span className="bg-primary text-white p-2 rounded-xl">
                <HiHome size={22} />
              </span>
              <span className="text-[#0d6e59]">PGSmart</span>
            </Link>

            <div className={s.desktopMenu}>
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} className={s.navLink}>
                  {link.name}
                </Link>
              ))}
            </div>

            <div className={s.rightSection}>
              {user ? (
                <div className={s.userSection} ref={menuRef}>
                  {user.role === "owner" ? (
                    <Link to="/dashboard" className="relative text-text-main hover:text-primary transition-colors">
                      <HiOutlineBell size={22} />
                      {notifCount > 0 && (
                        <span style={{
                          position: "absolute", top: "-6px", right: "-6px",
                          background: "#ef4444", color: "#fff", fontSize: "0.6rem",
                          fontWeight: 700, padding: "1px 5px", borderRadius: "999px",
                          lineHeight: "1.3", minWidth: "16px", textAlign: "center"
                        }}>
                          {notifCount > 9 ? "9+" : notifCount}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <>
                      <Link to="/wishlist" className="text-text-main hover:text-primary transition-colors">
                        <HiOutlineHeart size={22} />
                      </Link>
                      <Link to="/chat-messages" className="text-text-main hover:text-primary transition-colors">
                        <HiMagnifyingGlass size={20} />
                      </Link>
                    </>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="cursor-pointer bg-transparent border-none p-0"
                    >
                      <img
                        src={user.profilePic || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4MCcgaGVpZ2h0PSc4MCcgdmlld0JveD0nMCAwIDgwIDgwJz48cmVjdCBmaWxsPScjMGQ2ZTU5JyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHJ4PSc0MCcvPjx0ZXh0IGZpbGw9JyNmZmYnIGZvbnQtZmFtaWx5PSdBcmlhbCxzYW5zLXNlcmlmJyBmb250LXNpemU9JzMyJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyB4PSc0MCcgeT0nNTAnPlU8L3RleHQ+PC9zdmc+"}
                        alt="Profile"
                        className={s.avatar}
                        onError={(e) => { e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4MCcgaGVpZ2h0PSc4MCcgdmlld0JveD0nMCAwIDgwIDgwJz48cmVjdCBmaWxsPScjMGQ2ZTU5JyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHJ4PSc0MCcvPjx0ZXh0IGZpbGw9JyNmZmYnIGZvbnQtZmFtaWx5PSdBcmlhbCxzYW5zLXNlcmlmJyBmb250LXNpemU9JzMyJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyB4PSc0MCcgeT0nNTAnPlU8L3RleHQ+PC9zdmc+"; }}
                      />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-lg border border-[#f1f5f9] py-2 z-50">
                        <div className="px-4 py-3 border-b border-[#f1f5f9]">
                          <p className="font-semibold text-sm text-text-main">{user.name}</p>
                          <p className="text-xs text-text-muted capitalize">{user.role}</p>
                        </div>
                        <Link
                          to={user.role === "owner" ? "/dashboard" : "/profile"}
                          className="block px-4 py-2.5 text-sm text-text-main hover:bg-[#f8fafc] no-underline"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          {user.role === "owner" ? "Dashboard" : "Profile"}
                        </Link>
                        <Link
                          to="/profile"
                          className="block px-4 py-2.5 text-sm text-text-main hover:bg-[#f8fafc] no-underline"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            to="/admin-dashboard"
                            className="block px-4 py-2.5 text-sm text-text-main hover:bg-[#f8fafc] no-underline"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-[#f1f5f9] mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-[#fef2f2] bg-transparent border-none cursor-pointer"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    to="/login"
                    className="btn btn-outline py-2 px-5 rounded-xl font-semibold text-sm no-underline"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary py-2 px-5 rounded-xl font-semibold text-sm no-underline hidden lg:inline-block"
                  >
                    Register
                  </Link>
                </div>
              )}
              <div className={s.mobileToggle} onClick={() => setIsDrawerOpen(true)}>
                <HiBars3 size={24} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className={s.backdrop(isDrawerOpen)} onClick={() => setIsDrawerOpen(false)} />

      <div className={s.drawer(isDrawerOpen)}>
        <div className={s.drawerHeader}>
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary no-underline">
            <span className="bg-primary text-white p-2 rounded-xl">
              <HiHome size={20} />
            </span>
            PGSmart
          </Link>
          <div className={s.drawerCloseIcon} onClick={() => setIsDrawerOpen(false)}>
            <HiXMark size={24} />
          </div>
        </div>

        <div className={s.drawerNavLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-text-main no-underline font-semibold hover:text-primary transition-colors"
              onClick={() => setIsDrawerOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {user?.role === "owner" && (
          <div className="px-6 py-3 border-t border-[#f1f5f9]">
            <p className="text-[0.65rem] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Management</p>
            <div className="flex flex-col gap-1">
              {[
                { name: "Rooms", path: "/rooms" },
                { name: "Tenants & Rent", path: "/tenants" },
                { name: "Staff", path: "/staff" },
                { name: "Reports", path: "/reports" },
              ].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-text-main no-underline font-semibold hover:text-primary transition-colors text-sm py-1.5"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className={s.drawerUserSection}>
          {user ? (
            <>
              <div className={s.drawerUserInfo}>
                <img
                  src={user.profilePic || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4MCcgaGVpZ2h0PSc4MCcgdmlld0JveD0nMCAwIDgwIDgwJz48cmVjdCBmaWxsPScjMGQ2ZTU5JyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHJ4PSc0MCcvPjx0ZXh0IGZpbGw9JyNmZmYnIGZvbnQtZmFtaWx5PSdBcmlhbCxzYW5zLXNlcmlmJyBmb250LXNpemU9JzMyJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyB4PSc0MCcgeT0nNTAnPlU8L3RleHQ+PC9zdmc+"}
                  alt="Profile"
                  className={s.drawerAvatar}
                />
                <div>
                  <div className={s.drawerUserName}>{user.name}</div>
                  <div className={s.drawerUserEmail}>{user.email}</div>
                </div>
              </div>
              <Link
                to="/profile"
                className="block w-full text-center py-3 rounded-xl bg-[#f8fafc] text-text-main font-semibold no-underline mb-3"
                onClick={() => setIsDrawerOpen(false)}
              >
                Profile
              </Link>
              <button onClick={handleLogout} className={s.drawerLogoutButton}>
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="btn btn-outline w-full text-center py-3 rounded-xl font-semibold no-underline"
                onClick={() => setIsDrawerOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary w-full text-center py-3 rounded-xl font-semibold no-underline"
                onClick={() => setIsDrawerOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;