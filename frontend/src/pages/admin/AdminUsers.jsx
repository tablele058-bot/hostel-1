import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { HiOutlineUsers, HiOutlinePhone, HiTrash, HiOutlineCheckCircle } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { adminUsersStyles as s } from "../../assets/dummyStyles";
import { HiOutlineMail, HiBan, HiFilter } from "react-icons/hi";

const AdminUsers = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    fetchUsers();
  }, [token, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/users/${userId}/block`,
        { isBlocked: !isBlocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isBlocked: !isBlocked } : u
        )
      );
    } catch (err) {
      console.error("Failed to toggle block status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user permanently? This action cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Failed to delete user");
    }
  };

  const filterOptions = [
    { label: "All Users", value: "all" },
    { label: "PG Owners", value: "owner" },
    { label: "Admins", value: "admin" },
  ];

  if (loading) {
    return (
      <div className="loader-full-page">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className={s.containerHeader}>
        <div>
          <h1 className={s.headerTitle}>User Management</h1>
          <p className={s.headerSubtitle}>
            View and manage all registered users
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className={s.filterWrapper} ref={filterRef}>
          <button
            className={s.filterButton}
            onClick={() => setOpenFilter(!openFilter)}
          >
            <HiFilter size={18} />
            {roleFilter === "all"
              ? "All Users"
              : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) + "s"}
          </button>

          {openFilter && (
            <div className={s.filterDropdown}>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={s.filterOption(roleFilter === opt.value)}
                  onClick={() => {
                    setRoleFilter(opt.value);
                    setOpenFilter(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className={s.cardContainer}>
        <div className={s.cardHeader}>
          <div className={s.cardTitleRow}>
            <h2 className={s.cardTitle}>
              <HiOutlineUsers size={22} className="inline mr-2" />
              Registered Users
            </h2>
            <div className={s.userCount}>
              Total: <span className={s.userCountSpan}>{filteredUsers.length}</span>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={s.emptyState}>
            No users found with the selected filter.
          </div>
        ) : (
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead className={s.thead}>
                <tr className={s.tableRow}>
                  <th className={s.thUserInfo}>User Info</th>
                  <th className={s.thRole}>Role</th>
                  <th className={s.thContact}>Contact Details</th>
                  <th className={s.thStatus}>Account Status</th>
                  <th className={s.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} className={s.tableRow}>
                    <td className={s.tdUserInfo}>
                      <div className="flex items-center gap-3">
                        <div className={s.userAvatar}>
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className={s.userInfoName}>{u.name}</div>
                          <div className={s.userInfoId}>
                            ID: {u._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={s.tdRole}>
                      <span className={s.roleBadge(u.role)}>{u.role}</span>
                    </td>
                    <td className={s.tdContact}>
                      <div className={s.contactWrapper}>
                        <div className={s.contactEmail}>
                          <HiOutlineMail size={14} /> {u.email}
                        </div>
                        <div className={s.contactPhone}>
                          <HiOutlinePhone size={14} />{" "}
                          {u.phone || "Not provided"}
                        </div>
                      </div>
                    </td>
                    <td className={s.tdStatus}>
                      {u.isBlocked ? (
                        <span className={s.statusBadgeBlocked}>
                          <HiBan size={14} /> Blocked
                        </span>
                      ) : (
                        <span className={s.statusBadgeActive}>
                          <HiOutlineCheckCircle size={14} /> Active
                        </span>
                      )}
                    </td>
                    <td className={s.tdActions}>
                      <div className={s.actionsWrapper}>
                        <button
                          className={s.blockButton(u.isBlocked)}
                          onClick={() =>
                            handleToggleBlock(u._id, u.isBlocked)
                          }
                          title={
                            u.isBlocked ? "Unblock User" : "Block User"
                          }
                        >
                          {u.isBlocked ? (
                            <HiOutlineCheckCircle size={18} />
                          ) : (
                            <HiBan size={18} />
                          )}
                        </button>
                        <button
                          className={s.deleteButton}
                          onClick={() => handleDeleteUser(u._id)}
                          title="Delete User"
                        >
                          <HiTrash size={16} />
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

export default AdminUsers;
