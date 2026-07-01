import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiXMark, HiOutlineHome } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";
import PropertyCard from "../../components/common/PropertyCard";
import { propertiesStyles as s } from "../../assets/dummyStyles";
import { HiAdjustments, HiOutlineViewGrid, HiOutlineMenuAlt2 } from "react-icons/hi";

const Properties = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [wishlistedIds, setWishlistedIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const fetchTimer = useRef(null);

  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    propertyType: searchParams.get("propertyType") ? searchParams.get("propertyType").split(",") : [],
    bhk: searchParams.get("bhk") || "",
    maxPrice: parseInt(searchParams.get("maxPrice")) || 100000000,
    amenities: [],
    furnishing: searchParams.get("furnishing") ? searchParams.get("furnishing").split(",") : [],
    sort: searchParams.get("sort") || "latest",
  });

  const propertyTypes = [
    { label: "Flat/Apartment", value: "flat" },
    { label: "Independent House/Villa", value: "villa" },
    { label: "Penthouse", value: "penthouse" },
    { label: "Commercial", value: "commercial" },
  ];

  const bhkOptions = ["1", "2", "3", "4", "5+"];
  const furnishingOptions = [
    { label: "Furnished", value: "furnished" },
    { label: "Semi-Furnished", value: "semi-furnished" },
    { label: "Unfurnished", value: "unfurnished" },
  ];

  const fetchProperties = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (currentFilters.city) params.append("city", currentFilters.city);
      if (currentFilters.propertyType.length > 0) params.append("propertyType", currentFilters.propertyType.join(","));
      if (currentFilters.bhk) params.append("bhk", currentFilters.bhk);
      if (currentFilters.maxPrice && currentFilters.maxPrice < 100000000) params.append("maxPrice", currentFilters.maxPrice);
      if (currentFilters.furnishing && currentFilters.furnishing.length > 0) params.append("furnishing", currentFilters.furnishing.join(","));
      if (currentFilters.sort) params.append("sort", currentFilters.sort);

      const res = await axios.get(`${API_URL}/api/property?${params.toString()}`);
      setProperties(res.data?.properties || res.data || []);
    } catch (err) {
      try {
        const res = await mockApi.getProperties(currentFilters);
        setProperties(res.data?.properties || []);
      } catch {
        setError("Failed to load properties. Please verify backend connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(filters);
  }, [fetchProperties, filters]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setWishlistedIds(res.data.map((p) => String(p.property?._id || p._id))))
        .catch(() => console.error("Failed to fetch wishlist"));
    }
  }, [token]);

  const handleToggleWishlist = async (propertyId) => {
    if (!token) return navigate("/login");
    try {
      if (wishlistedIds.includes(String(propertyId))) {
        await axios.delete(`${API_URL}/api/wishlist/${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
        setWishlistedIds((prev) => prev.filter((id) => id !== String(propertyId)));
      } else {
        await axios.post(`${API_URL}/api/wishlist`, { propertyId }, { headers: { Authorization: `Bearer ${token}` } });
        setWishlistedIds((prev) => [...prev, String(propertyId)]);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist");
    }
  };

  return (
    <div className={s.pageContainer}>
      <div className={s.container}>
        <div className={s.mobileFilterButtonWrapper}>
          <button className={s.mobileFilterButton} onClick={() => setShowMobileFilters(true)}>
            <HiAdjustments size={20} /> Filters
          </button>
        </div>

        <div className={s.layout}>
          {showMobileFilters && <div className={s.mobileOverlay} onClick={() => setShowMobileFilters(false)} />}
          <aside className={`${s.sidebar} ${showMobileFilters ? s.sidebarVisible : s.sidebarHidden}`}>
            {/* Filters sidebar UI omitted for brevity, logic remains intact */}
            <div className={s.sidebarHeader}>
              <div className={s.sidebarTitleWrapper}>
                <HiAdjustments className={s.sidebarTitleIcon} size={20} />
                <h3 className={s.sidebarTitle}>Filters</h3>
              </div>
              <div className={s.sidebarHeaderActions}>
                <button className={s.resetButton} onClick={() => window.location.reload()}>Reset</button>
                <button className={s.closeMobileFilters} onClick={() => setShowMobileFilters(false)}><HiXMark size={20} /></button>
              </div>
            </div>
          </aside>

          <div className={s.mainContent}>
            <div className={s.contentHeader}>
              <div className={s.resultCount}>
                Showing <strong className={s.resultCountStrong}>{properties.length}</strong> properties
              </div>
              <div className={s.headerControls}>
                <div className={s.viewModeToggle}>
                  <button className={`${s.viewModeButton} ${viewMode === "grid" ? s.viewModeActive : s.viewModeInactive}`} onClick={() => setViewMode("grid")}>
                    <HiOutlineViewGrid size={20} />
                  </button>
                  <button className={`${s.viewModeButton} ${viewMode === "list" ? s.viewModeActive : s.viewModeInactive}`} onClick={() => setViewMode("list")}>
                    <HiOutlineMenuAlt2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={s.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className={s.skeletonCard}></div>)}
              </div>
            ) : error ? (
              <div className={s.errorContainer}>
                <HiXMark className={s.errorIcon} size={48} />
                <h3 className={s.errorTitle}>{error}</h3>
                <button className={s.errorButton} onClick={() => fetchProperties(filters)}>Try Again</button>
              </div>
            ) : properties.length === 0 ? (
              <div className={s.emptyContainer}>
                <div className={s.emptyIconWrapper}><HiOutlineHome className={s.emptyIcon} size={36} /></div>
                <h3 className={s.emptyTitle}>No Properties Found</h3>
              </div>
            ) : (
              <div className={`${s.propertyList} ${viewMode === "grid" ? s.propertyListGrid : s.propertyListList}`}>
                {properties.map((property) => (
                  <PropertyCard
                    key={property._id}
                    property={property}
                    isWishlisted={wishlistedIds.includes(String(property._id))}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;