import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiUser, HiOutlineHome } from "react-icons/hi2";
import api from "../../api";

const SearchOwners = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();

  const handleSearch = async (q) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(q)}&role=owner`);
        setResults(res.data?.users || []);
      } catch { setResults([]); }
      setSearched(true);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Find PG Owners</h1>
        <p className="text-gray-500 mb-6">Search by username to find and request a PG owner</p>

        <div className="relative mb-6">
          <HiMagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full p-4 pl-12 rounded-2xl border border-gray-200 outline-none focus:border-teal-500 text-base bg-white shadow-sm"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-12">
            <HiUser size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No owners found for "{query}"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((owner) => (
              <div
                key={owner._id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate(`/owner/${owner._id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg">
                    {owner.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">@{owner.username}</p>
                    <p className="text-sm text-gray-500">{owner.name}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-teal-600">View Profile →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOwners;
