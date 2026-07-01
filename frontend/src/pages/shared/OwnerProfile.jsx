import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineHome, HiArrowLeft } from "react-icons/hi2";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const OwnerProfile = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/search?q=${id.substring(0, 5)}&role=owner`);
        const found = res.data?.users?.find(u => u._id === id);
        if (found) setOwner(found);
        const propRes = await api.get(`/api/property?sellerId=${id}`);
        setProperties(propRes.data?.properties || []);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleRequest = async () => {
    if (!token) return navigate("/login");
    setSending(true);
    try {
      await api.post("/api/requests", { toUserId: id });
      setSent(true);
    } catch (err) {
      if (err.response?.status === 400) setSent(true);
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
    </div>
  );

  if (!owner) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center"><p className="text-gray-500 font-medium">Owner not found</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <HiArrowLeft size={20} /> Back
        </button>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-2xl">
              {owner.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">@{owner.username}</h1>
              <p className="text-gray-500">{owner.name}</p>
            </div>
          </div>

          {(!token || user?.role === "viewer") && (
            <button
              onClick={handleRequest}
              disabled={sending || sent}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all ${sent ? "bg-teal-400 cursor-default" : "bg-teal-600 hover:bg-teal-700"}`}
            >
              {sending ? "Sending..." : sent ? "Request Sent ✓" : "Request to Rent"}
            </button>
          )}
        </div>

        {properties.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">PGs by {owner.name}</h2>
            <div className="flex flex-col gap-3">
              {properties.map((p) => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <HiOutlineHome size={20} className="text-teal-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.city}{p.area ? `, ${p.area}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerProfile;
