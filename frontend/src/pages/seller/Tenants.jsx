import React, { useState, useEffect } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineCash, HiOutlineCheck, HiOutlineExclamation } from "react-icons/hi";
import { HiXMark } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

const Tenants = () => {
  const { token } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pending, setPending] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [activeTab, setActiveTab] = useState("tenants");
  const [showTenantForm, setShowTenantForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", roomId: "", rentAmount: "", rentDueDate: "1" });
  const [payForm, setPayForm] = useState({ amount: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), paymentMethod: "cash", notes: "" });

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => { if (selectedProperty) { fetchTenants(); fetchPending(); fetchPayments(); fetchRooms(); } }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/my-properties`, { headers: { Authorization: `Bearer ${token}` } });
      const props = res.data?.properties || [];
      setProperties(props);
      if (props.length > 0 && !selectedProperty) setSelectedProperty(props[0]._id);
    } catch {}
  };

  const fetchTenants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tenants?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants(res.data || []);
    } catch {}
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setPayments(res.data || []);
    } catch {}
  };

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments/pending?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setPending(res.data || []);
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data || []);
    } catch {}
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/tenants`, { ...form, propertyId: selectedProperty }, { headers: { Authorization: `Bearer ${token}` } });
      setShowTenantForm(false);
      setForm({ name: "", email: "", phone: "", roomId: "", rentAmount: "", rentDueDate: "1" });
      fetchTenants();
      fetchRooms();
      fetchPending();
    } catch {}
  };

  const handleRemoveTenant = async (id) => {
    if (!confirm("Mark this tenant as left?")) return;
    await axios.put(`${API_URL}/api/tenants/${id}`, { status: "left" }, { headers: { Authorization: `Bearer ${token}` } });
    fetchTenants();
    fetchRooms();
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      await axios.post(`${API_URL}/api/payments`, { ...payForm, tenantId: selectedTenant._id, roomId: selectedTenant.roomId, propertyId: selectedProperty }, { headers: { Authorization: `Bearer ${token}` } });
      setShowPaymentForm(false);
      setSelectedTenant(null);
      setPayForm({ amount: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), paymentMethod: "cash", notes: "" });
      fetchPayments();
      fetchPending();
    } catch {}
  };

  const vacantRooms = rooms.filter(r => r.status === "vacant");
  const totalRent = tenants.filter(t => t.status === "active").reduce((s, t) => s + (t.rentAmount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tenants & Rent</h1>
          <p className="text-gray-500 mt-1">Manage tenants, collect rent, track payments</p>
        </div>
        <button onClick={() => { setShowTenantForm(true); setForm({ ...form, roomId: vacantRooms[0]?._id || "" }); }} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all self-stretch sm:self-auto justify-center">
          <HiOutlinePlus size={18} /> Add Tenant
        </button>
      </div>

      <div className="mb-6">
        <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full max-w-md p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-base">
          {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-gray-900">{tenants.filter(t => t.status === "active").length}</div><div className="text-sm font-semibold text-gray-500 mt-1">Active Tenants</div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-teal-600">₹{totalRent.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Monthly Rent Expected</div></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-3xl font-extrabold text-amber-600">{pending.length}</div><div className="text-sm font-semibold text-gray-500 mt-1">Pending Dues</div></div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {["tenants", "payments", "pending"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-bold capitalize border-b-2 transition-all ${activeTab === tab ? "text-teal-600 border-teal-600" : "text-gray-400 border-transparent hover:text-gray-600"}`}>{tab}</button>
        ))}
      </div>

      {activeTab === "tenants" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Room</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Rent</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{t.name}</td>
                    <td className="p-4 text-sm text-gray-600">{t.phone}{t.email ? ` | ${t.email}` : ""}</td>
                    <td className="p-4 text-gray-700">{rooms.find(r => r._id === t.roomId)?.roomNumber || t.roomId?.slice(-4) || "N/A"}</td>
                    <td className="p-4 font-semibold text-gray-900">₹{Number(t.rentAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${t.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{t.status}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelectedTenant(t); setPayForm({ ...payForm, amount: t.rentAmount }); setShowPaymentForm(true); }} className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 text-xs font-bold hover:bg-teal-100 mr-2">Collect Rent</button>
                      {t.status === "active" && <button onClick={() => handleRemoveTenant(t._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><HiOutlineTrash size={16} /></button>}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400 font-medium">No tenants yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Tenant</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Month</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
              </tr></thead>
              <tbody>
                {payments.map(p => {
                  const tenant = tenants.find(t => t._id === p.tenantId);
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  return <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{tenant?.name || "Unknown"}</td>
                    <td className="p-4 text-gray-700">{months[p.month - 1]} {p.year}</td>
                    <td className="p-4 font-semibold text-teal-600">₹{Number(p.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="p-4 capitalize text-gray-600">{p.paymentMethod}</td>
                    <td className="p-4 text-sm text-gray-500">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "N/A"}</td>
                  </tr>;
                })}
                {payments.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No payments recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pending" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Tenant</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Phone</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Month</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Due Date</th>
              </tr></thead>
              <tbody>
                {pending.map((p, i) => {
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  return <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{p.tenantName}</td>
                    <td className="p-4 text-gray-600">{p.tenantPhone}</td>
                    <td className="p-4 text-gray-700">{months[p.month - 1]} {p.year}</td>
                    <td className="p-4 font-semibold text-amber-600">₹{Number(p.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-sm text-gray-500">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "N/A"}</td>
                  </tr>;
                })}
                {pending.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No pending dues! All caught up.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTenantForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowTenantForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Add New Tenant</h2><button onClick={() => setShowTenantForm(false)} className="p-2 rounded-full hover:bg-gray-100"><HiXMark size={20} /></button></div>
            <form onSubmit={handleAddTenant} className="flex flex-col gap-4">
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              <input type="tel" placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              <select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required>
                <option value="">Select Room</option>
                {vacantRooms.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} - {r.roomType} (₹{Number(r.rentAmount || 0).toLocaleString("en-IN")})</option>)}
              </select>
              <input type="number" placeholder="Rent Amount (₹)" value={form.rentAmount} onChange={e => setForm({ ...form, rentAmount: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <div><label className="text-sm font-medium text-gray-600 mb-1 block">Rent Due Date (day of month)</label>
              <input type="number" min="1" max="28" value={form.rentDueDate} onChange={e => setForm({ ...form, rentDueDate: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" /></div>
              <button type="submit" className="bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all">Add Tenant</button>
            </form>
          </div>
        </div>
      )}

      {showPaymentForm && selectedTenant && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPaymentForm(false)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Collect Rent - {selectedTenant.name}</h2><button onClick={() => setShowPaymentForm(false)} className="p-2 rounded-full hover:bg-gray-100"><HiXMark size={20} /></button></div>
            <form onSubmit={handleRecordPayment} className="flex flex-col gap-4">
              <input type="number" placeholder="Amount (₹)" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" required />
              <div className="grid grid-cols-2 gap-3">
                <select value={payForm.month} onChange={e => setPayForm({ ...payForm, month: parseInt(e.target.value) || 1 })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500">
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <input type="number" placeholder="Year" value={payForm.year} onChange={e => setPayForm({ ...payForm, year: parseInt(e.target.value) })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500" />
              </div>
              <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500">
                <option value="cash">Cash</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
              <textarea placeholder="Notes (optional)" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} className="p-3 rounded-xl border border-gray-200 outline-none resize-none h-20 focus:border-teal-500" />
              <button type="submit" className="bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"><HiOutlineCash size={18} /> Record Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
