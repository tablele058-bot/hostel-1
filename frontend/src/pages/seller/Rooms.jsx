import React, { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiHome, HiOutlineOfficeBuilding } from "react-icons/hi";
import { HiCheckBadge, HiXMark } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

const statusColors = {
  vacant: "bg-green-100 text-green-700 border-green-200",
  occupied: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
};

const Rooms = () => {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ roomNumber: "", roomType: "single", capacity: 1, rentAmount: "", propertyId: "" });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) fetchRooms();
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/my-properties`, { headers: { Authorization: `Bearer ${token}` } });
      const props = res.data?.properties || [];
      setProperties(props);
      if (props.length > 0 && !selectedProperty) {
        setSelectedProperty(props[0]._id);
        setForm(f => ({ ...f, propertyId: props[0]._id }));
      }
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/api/rooms/${editing}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/api/rooms`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ roomNumber: "", roomType: "single", capacity: 1, rentAmount: "", propertyId: selectedProperty });
      fetchRooms();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this room?")) return;
    await axios.delete(`${API_URL}/api/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchRooms();
  };

  const handleEdit = (room) => {
    setEditing(room._id);
    setForm({ roomNumber: room.roomNumber, roomType: room.roomType, capacity: room.capacity, rentAmount: room.rentAmount, propertyId: room.propertyId });
    setShowForm(true);
  };

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === "occupied").length;
  const vacant = rooms.filter(r => r.status === "vacant").length;
  const maintenance = rooms.filter(r => r.status === "maintenance").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Room Management</h1>
          <p className="text-gray-500 mt-1">Manage rooms across your properties</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ roomNumber: "", roomType: "single", capacity: 1, rentAmount: "", propertyId: selectedProperty }); }} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all self-stretch sm:self-auto justify-center">
          <HiOutlinePlus size={18} /> Add Room
        </button>
      </div>

      <div className="mb-6">
        <select value={selectedProperty} onChange={e => { setSelectedProperty(e.target.value); setForm(f => ({ ...f, propertyId: e.target.value })); }} className="w-full max-w-md p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-base">
          {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Rooms", value: total, color: "bg-gray-50 text-gray-700 border-gray-200" },
          { label: "Occupied", value: occupied, color: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Vacant", value: vacant, color: "bg-green-50 text-green-700 border-green-200" },
          { label: "Maintenance", value: maintenance, color: "bg-amber-50 text-amber-700 border-amber-200" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 border ${s.color}`}>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? "Edit Room" : "Add New Room"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100"><HiXMark size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="text" placeholder="Room Number" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <select value={form.roomType} onChange={e => setForm({ ...form, roomType: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500">
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="dorm">Dormitory</option>
              </select>
              <input type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" min="1" required />
              <input type="number" placeholder="Rent Amount (₹)" value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <button type="submit" className="bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all">{editing ? "Update Room" : "Add Room"}</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Room</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Capacity</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Rent</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-900">{room.roomNumber}</td>
                  <td className="p-4 capitalize text-gray-700">{room.roomType}</td>
                  <td className="p-4 text-gray-700">{room.capacity}</td>
                  <td className="p-4 font-semibold text-gray-900">₹{Number(room.rentAmount || 0).toLocaleString("en-IN")}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[room.status] || statusColors.vacant}`}>{room.status}</span></td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEdit(room)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><HiOutlinePencil size={16} /></button>
                    <button onClick={() => handleDelete(room._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 ml-1"><HiOutlineTrash size={16} /></button>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-medium">No rooms added yet. Click "Add Room" to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
