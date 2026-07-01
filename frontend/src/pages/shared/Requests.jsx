import React, { useState, useEffect } from "react";
import { HiOutlineCheck, HiOutlineXMark, HiOutlineUser, HiOutlineClock } from "react-icons/hi2";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("received");

  useEffect(() => { fetchRequests(); }, [tab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/requests?direction=${tab}&status=pending`);
      setRequests(res.data || []);
    } catch { setRequests([]); } finally { setLoading(false); }
  };

  const handleAction = async (reqId, status) => {
    try {
      const rentAmount = prompt("Enter monthly rent amount (₹):");
      if (!rentAmount || isNaN(rentAmount)) return;
      const dueDate = prompt("Enter rent due date (day of month, 1-28):", "5");
      if (!dueDate) return;
      await api.put(`/api/requests/${reqId}`, { status, rentAmount: parseFloat(rentAmount), rentDueDate: parseInt(dueDate) });
      fetchRequests();
    } catch {}
  };

  const handleReject = async (reqId) => {
    try { await api.put(`/api/requests/${reqId}`, { status: "rejected" }); fetchRequests(); } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Requests</h1>
        <p className="text-gray-500 mb-6">Manage your connection requests</p>

        <div className="flex gap-2 mb-6 border-b border-gray-100">
          {["received", "sent"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-bold capitalize border-b-2 transition-all ${tab === t ? "text-teal-600 border-teal-600" : "text-gray-400 border-transparent hover:text-gray-600"}`}
            >{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <HiOutlineClock size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No {tab} requests pending</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <div key={req._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg">
                    {req.otherUser?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{req.otherUser?.name || "Unknown"} <span className="text-gray-400 font-normal">@{req.otherUser?.username}</span></p>
                    <p className="text-sm text-gray-500">{req.otherUser?.phone || "No phone"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {tab === "received" && user?.role === "owner" && (
                    <>
                      <button onClick={() => handleAction(req._id, "accepted")} className="p-2.5 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100"><HiOutlineCheck size={20} /></button>
                      <button onClick={() => handleReject(req._id)} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"><HiOutlineXMark size={20} /></button>
                    </>
                  )}
                  {tab === "sent" && (
                    <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
