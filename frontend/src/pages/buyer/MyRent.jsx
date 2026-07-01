import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import { HiOutlineCalendar, HiOutlineBanknotes, HiOutlineExclamationCircle } from "react-icons/hi2";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const MyRent = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.email) {
      fetchRentData(user.email);
    } else {
      setLoading(false);
      setError("Please log in to view your rent details.");
    }
  }, [user]);

  const fetchRentData = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/tenants/my-rent?email=${encodeURIComponent(email)}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No active tenancy found. Contact your PG owner.");
      } else {
        setError("Could not load rent details. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <HiOutlineExclamationCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Rental Info</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tenant, payments, rentStatus, penalty, totalDue, leaseInfo } = data;
  const statusColor = rentStatus.status === "overdue" ? "red" : rentStatus.status === "due_today" ? "orange" : rentStatus.status === "due_soon" ? "amber" : "green";
  const statusBg = { red: "bg-red-50 border-red-200", orange: "bg-orange-50 border-orange-200", amber: "bg-amber-50 border-amber-200", green: "bg-green-50 border-green-200" }[statusColor];
  const statusText = { red: "text-red-700", orange: "text-orange-700", amber: "text-amber-700", green: "text-green-700" }[statusColor];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Rent Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {tenant.name}</p>
        </div>

        {/* Lease Status Alert */}
        {leaseInfo?.expired && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <HiOutlineExclamationCircle size={24} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-red-700">Lease Expired</p>
              <p className="text-red-600 text-sm">{leaseInfo.message}</p>
            </div>
          </div>
        )}
        {leaseInfo && !leaseInfo.expired && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <HiOutlineCalendar size={24} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-blue-700">Lease Status</p>
              <p className="text-blue-600 text-sm">{leaseInfo.message}</p>
            </div>
          </div>
        )}

        {/* Rent Status Card */}
        <div className={`mb-6 p-5 sm:p-6 rounded-2xl border ${statusBg}`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: statusColor === "green" ? "#059669" : statusColor === "amber" ? "#d97706" : "#dc2626" }}>
                Rent Status
              </p>
              <p className={`text-xl sm:text-2xl font-extrabold mt-1 ${statusText}`}>{rentStatus.label}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Monthly Rent</p>
              <p className="text-2xl font-extrabold text-gray-900">₹{Number(tenant.rentAmount || 0).toLocaleString("en-IN")}</p>
              <p className="text-xs text-gray-400">Due on {tenant.rentDueDate}<sup>th</sup> of each month</p>
            </div>
          </div>
          {penalty > 0 && (
            <div className="mt-3 pt-3 border-t border-red-200 flex justify-between">
              <span className="text-sm font-semibold text-red-600">Late Fee Applied</span>
              <span className="text-sm font-bold text-red-600">+₹{penalty.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-teal-50"><HiOutlineBanknotes size={18} className="text-teal-600" /></div>
              <span className="text-sm font-semibold text-gray-500">Total Paid</span>
            </div>
            <p className="text-2xl font-extrabold text-teal-600">₹{Number(totalDue?.total_paid || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{totalDue?.months_paid || 0} month(s) paid</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50"><HiOutlineExclamationCircle size={18} className="text-amber-600" /></div>
              <span className="text-sm font-semibold text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-amber-600">₹{Number(totalDue?.pending || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{totalDue?.months_pending || 0} month(s) pending</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50"><HiOutlineCalendar size={18} className="text-blue-600" /></div>
              <span className="text-sm font-semibold text-gray-500">Total Due</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{Number(totalDue?.total_due || 0).toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1">{totalDue?.months_total || 0} month(s) total</p>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Month</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Method</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{months[p.month - 1]} {p.year}</td>
                    <td className="p-4 font-semibold text-teal-600">₹{Number(p.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="p-4 capitalize text-gray-600">{p.paymentMethod || "N/A"}</td>
                    <td className="p-4 text-sm text-gray-500">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "N/A"}</td>
                    <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Paid</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">No payments recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-500 text-sm">Contact your PG owner for any questions about your rent, lease, or payments. All records are maintained digitally — no paper needed.</p>
        </div>
      </div>
    </div>
  );
};

export default MyRent;
