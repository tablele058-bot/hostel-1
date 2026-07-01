import React, { useState, useEffect } from "react";
import { HiOutlineChartBar, HiOutlineChartPie, HiOutlineTrendingUp, HiOutlineCurrencyRupee, HiOutlineHome, HiOutlineUserGroup } from "react-icons/hi";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BarChart({ data, label, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-48 pt-4">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-gray-500">{v.toLocaleString()}</span>
          <div className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80" style={{ height: `${(v / max) * 100}%`, backgroundColor: color || "#0d9488", minHeight: v > 0 ? "4px" : "0" }} />
          <span className="text-[10px] text-gray-400 font-medium">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#0d9488", "#f59e0b", "#ef4444", "#3b82f6"];
  let offset = 0;
  const segments = data.map((d, i) => {
    const p = (d.value / total) * 360;
    const seg = { ...d, start: offset, end: offset + p, color: colors[i % colors.length] };
    offset += p;
    return seg;
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 36 36" className="-rotate-90">
        {segments.map((s, i) => {
          const r = 15.9;
          const cx = 18, cy = 18;
          const startAngle = (s.start * Math.PI) / 180;
          const endAngle = (s.end * Math.PI) / 180;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = s.end - s.start > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={i} d={path} fill={s.color} />;
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-gray-600">{d.label}: <strong>{d.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

const Reports = () => {
  const { token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [rentCollection, setRentCollection] = useState(null);
  const [activeReport, setActiveReport] = useState("occupancy");
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => { if (selectedProperty) { fetchOccupancy(); fetchRevenue(); fetchRentCollection(); } }, [selectedProperty, reportYear, reportMonth]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/my-properties`, { headers: { Authorization: `Bearer ${token}` } });
      const props = res.data?.properties || [];
      setProperties(props);
      if (props.length > 0 && !selectedProperty) setSelectedProperty(props[0]._id);
    } catch {}
  };

  const fetchOccupancy = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/occupancy?propertyId=${selectedProperty}`, { headers: { Authorization: `Bearer ${token}` } });
      setOccupancy(res.data);
    } catch {}
  };

  const fetchRevenue = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/revenue?propertyId=${selectedProperty}&year=${reportYear}`, { headers: { Authorization: `Bearer ${token}` } });
      setRevenue(res.data);
    } catch {}
  };

  const fetchRentCollection = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/reports/rent-collection?propertyId=${selectedProperty}&month=${reportMonth}&year=${reportYear}`, { headers: { Authorization: `Bearer ${token}` } });
      setRentCollection(res.data);
    } catch {}
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Visual insights into your PG business</p>
        </div>
        <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="w-full sm:max-w-xs p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500 text-base">
          {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-8 border-b border-gray-100">
        {["occupancy", "revenue", "rent-collection"].map(tab => (
          <button key={tab} onClick={() => setActiveReport(tab)} className={`px-5 py-3 text-sm font-bold capitalize border-b-2 transition-all ${activeReport === tab ? "text-teal-600 border-teal-600" : "text-gray-400 border-transparent hover:text-gray-600"}`}>
            {tab === "occupancy" ? "Occupancy" : tab === "revenue" ? "Revenue" : "Rent Collection"}
          </button>
        ))}
      </div>

      {activeReport === "occupancy" && occupancy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><HiOutlineChartPie className="text-teal-600" size={22} /> Occupancy Overview</h3>
            <PieChart data={[
              { label: "Occupied", value: occupancy.occupied },
              { label: "Vacant", value: occupancy.vacant },
              { label: "Maintenance", value: occupancy.maintenance },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Rooms", value: occupancy.total, color: "bg-gray-50 text-gray-900 border-gray-200" },
              { label: "Occupied", value: occupancy.occupied, color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Vacant", value: occupancy.vacant, color: "bg-green-50 text-green-700 border-green-200" },
              { label: "Occupancy Rate", value: `${occupancy.occupancyRate}%`, color: "bg-teal-50 text-teal-700 border-teal-200" },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl p-6 border ${s.color}`}>
                <div className="text-3xl font-extrabold">{s.value}</div>
                <div className="text-sm font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReport === "revenue" && revenue && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-teal-600">₹{revenue.totalRevenue.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Total Revenue ({reportYear})</div></div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-amber-600">₹{revenue.expectedMonthly.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Expected Monthly</div></div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-blue-600">{revenue.pendingTenants}</div><div className="text-sm font-semibold text-gray-500 mt-1">Active Tenants</div></div>
          </div>
          <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><HiOutlineTrendingUp className="text-teal-600" size={22} /> Monthly Revenue</h3>
              <input type="number" value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} className="p-2 rounded-lg border border-gray-200 w-24 text-center text-sm" />
            </div>
            <BarChart data={revenue.monthlyData} color="#0d9488" />
          </div>
        </div>
      )}

      {activeReport === "rent-collection" && rentCollection && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-2">
            <select value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={reportYear} onChange={e => setReportYear(parseInt(e.target.value))} className="p-3 rounded-xl border border-gray-200 outline-none focus:border-teal-500 w-24 text-center" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-gray-900">₹{rentCollection.totalExpected.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Expected</div></div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-teal-600">₹{rentCollection.totalCollected.toLocaleString("en-IN")}</div><div className="text-sm font-semibold text-gray-500 mt-1">Collected</div></div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-green-600">{rentCollection.collectionRate}%</div><div className="text-sm font-semibold text-gray-500 mt-1">Collection Rate</div></div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="text-2xl font-extrabold text-amber-600">{rentCollection.unpaidCount}</div><div className="text-sm font-semibold text-gray-500 mt-1">Unpaid</div></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-green-700 mb-4 flex items-center gap-2"><HiOutlineTrendingUp size={18} /> Paid Tenants ({rentCollection.paidCount})</h4>
              {rentCollection.paidTenants?.map((name, i) => <div key={i} className="py-2 border-b border-gray-50 text-sm text-gray-700 last:border-0">{i + 1}. {name}</div>)}
              {(!rentCollection.paidTenants || rentCollection.paidTenants.length === 0) && <div className="text-sm text-gray-400">No payments recorded</div>}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">Pending Payments ({rentCollection.unpaidCount})</h4>
              {rentCollection.unpaidTenants?.map((t, i) => <div key={i} className="py-2 border-b border-gray-50 text-sm flex justify-between last:border-0"><span className="text-gray-700">{i + 1}. {t.name}</span><span className="font-semibold text-red-500">₹{Number(t.amount || 0).toLocaleString("en-IN")}</span></div>)}
              {(!rentCollection.unpaidTenants || rentCollection.unpaidTenants.length === 0) && <div className="text-sm text-green-600 font-semibold">All tenants have paid!</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
