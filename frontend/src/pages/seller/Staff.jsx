import React, { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineUserGroup } from "react-icons/hi";
import { HiXMark } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

const roleColors = {
  manager: "bg-purple-100 text-purple-700",
  cleaner: "bg-blue-100 text-blue-700",
  security: "bg-green-100 text-green-700",
  reception: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-700",
};

const Staff = () => {
  const { token } = useAuth();
  const [staff, setStaff] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "cleaner", salary: "" });

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => { if (selectedProperty) fetchStaff(); }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/my-properties`, { headers: { Authorization: `Bearer ${token}` } });
      const props = res.data?.properties || [];
      setProperties(props);
      if (props.length > 0 && !selectedProperty) setSelectedProperty(props[0]._id);
    } catch {}
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/staff?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setStaff(res.data || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/api/staff/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/staff`, { ...form, propertyId: selectedProperty }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", email: "", phone: "", role: "cleaner", salary: "" });
      fetchStaff();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this staff member?")) return;
    await axios.delete(`${API_URL}/api/staff/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchStaff();
  };

  const handleEdit = (member) => {
    setEditing(member._id);
    setForm({ name: member.name, email: member.email || "", phone: member.phone || "", role: member.role, salary: member.salary });
    setShowForm(true);
  };

  const activeStaff = staff.filter(s => s.status === "active");
  const monthlySalary = activeStaff.reduce((s, m) => s + (m.salary || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage your PG staff</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", email: "", phone: "", role: "cleaner", salary: "" }); }} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all self-stretch sm:self-auto justify-center">
          <HiOutlinePlus size={18} /> Add Staff
        </button>
      </div>

      <div className="mb-6">
        <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full max-w-md p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-base">
          {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-gray-900">{staff.length}</div><div className="text-sm font-semibold text-gray-500 mt-1">Total Staff</div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-green-600">{activeStaff.length}</div><div className="text-sm font-semibold text-gray-500 mt-1">Active</div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-teal-600">₹{monthlySalary.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Monthly Salary</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map(member => (
          <div key={member._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"><HiOutlineUserGroup size={24} /></div>
                <div><h3 className="font-bold text-gray-900">{member.name}</h3><p className="text-sm text-gray-500">{member.email || member.phone || "No contact"}</p></div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(member)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><HiOutlinePencil size={14} /></button>
                <button onClick={() => handleDelete(member._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><HiOutlineTrash size={14} /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors[member.role] || roleColors.other}`}>{member.role}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{member.status}</span>
            </div>
            <div className="text-sm text-gray-600">Salary: <strong>₹{Number(member.salary || 0).toLocaleString("en-IN")}</strong></div>
            <div className="text-xs text-gray-400 mt-1">Joined: {member.joiningDate ? new Date(member.joiningDate).toLocaleDateString() : "N/A"}</div>
          </div>
        ))}
        {staff.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 font-medium">No staff added yet.</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">{editing ? "Edit Staff" : "Add Staff"}</h2><button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100"><HiXMark size={20} /></button></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500">
                <option value="manager">Manager</option>
                <option value="cleaner">Cleaner</option>
                <option value="security">Security</option>
                <option value="reception">Reception</option>
                <option value="other">Other</option>
              </select>
              <input type="number" placeholder="Monthly Salary (₹)" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              <button type="submit" className="bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all">{editing ? "Update Staff" : "Add Staff"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
