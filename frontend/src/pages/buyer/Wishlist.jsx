import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineHeart, HiTrash, HiHome } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { wishlistStyles as s } from "../../assets/dummyStyles";
import PropertyCard from "../../components/common/PropertyCard";

const Wishlist = () => {
  const { user, token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  useEffect(() => {
    if (!token) return;
    fetchWishlist();
  }, [token]);

  const fetchWishlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ids = res.data.map((p) => String(p._id || p.property?._id));
      setWishlistedIds(new Set(ids));
      setProperties(res.data.map((p) => p.property || p));
    } catch (err) {
      console.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (propertyId) => {
    try {
      await axios.delete(`${API_URL}/api/wishlist/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties((prev) =>
        prev.filter((p) => String(p._id) !== String(propertyId))
      );
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(propertyId));
        return next;
      });
    } catch (err) {
      console.error("Failed to remove from wishlist");
    }
  };

  const handleToggleWishlist = (propertyId) => {
    handleRemove(propertyId);
  };

  if (loading) {
    return (
      <div className={s.loaderFullPage}>
        <div className={s.loader}></div>
      </div>
    );
  }

  return (
    <div className={s.pageContainer}>
      <div className={s.mainContainer}>
        <div className={s.headingWrapper}>
          <h1 className={s.heading}>My Wishlist</h1>
          <p className={s.subheading}>
            {properties.length > 0
              ? `You have ${properties.length} saved ${
                  properties.length === 1 ? "property" : "properties"
                }`
              : "Start saving properties you love"}
          </p>
        </div>

        {properties.length === 0 ? (
          <div className={s.emptyCard}>
            <div className={s.emptyIconWrapper}>
              <HiOutlineHeart size={40} />
            </div>
            <h2 className={s.emptyTitle}>Your wishlist is empty</h2>
            <p className={s.emptyText}>
              Start exploring properties and save the ones you like.
            </p>
            <Link to="/properties" className={s.browseButton}>
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className={s.gridContainer}>
            {properties.map((property) => (
              <div key={property._id} className="relative">
                <PropertyCard
                  property={property}
                  isWishlisted={true}
                  onToggleWishlist={handleToggleWishlist}
                />
                <button
                  onClick={() => handleRemove(property._id)}
                  className={s.removeButton}
                >
                  <HiTrash size={16} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
