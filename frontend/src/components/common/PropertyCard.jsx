import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiHeart,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import { HiArrowsExpand, HiShieldCheck, HiLocationMarker } from "react-icons/hi";
import { propertyCardStyles as s } from "../../assets/dummyStyles";

const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0MDAnIGhlaWdodD0nMzAwJyB2aWV3Qm94PScwIDAgNDAwIDMwMCc+PHJlY3QgZmlsbD0nI2UyZThmMCcgd2lkdGg9JzQwMCcgaGVpZ2h0PSczMDAnLz48dGV4dCBmaWxsPScjOTRhM2I4JyBmb250LWZhbWlseT0nQXJpYWwsc2Fucy1zZXJpZicgZm9udC1zaXplPScxOCcgdGV4dC1hbmNob3I9J21pZGRsZScgeD0nMjAwJyB5PScxNTUnPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

const PropertyCard = ({ property, isWishlisted, onToggleWishlist, renderActions, actions }) => {
  const [imgIndex, setImgIndex] = useState(0);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(property?.price || 0);

  const statusBadgeClass = s.badgeStatus ? s.badgeStatus(property?.status) : "";

  const images = property?.images && property.images.length > 0
    ? property.images
    : [PLACEHOLDER];

  const nextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist && property?._id) onToggleWishlist(property._id);
  };

  const isNew = property?.createdAt && (Date.now() - new Date(property.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={s.card}>
      <Link to={`/property/${property?._id}`} className={s.link}>
        <div className={s.imageSection}>
          {images.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center border-none cursor-pointer z-10 shadow-md hover:bg-white transition-colors"
              >
                <HiChevronLeft size={16} />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center border-none cursor-pointer z-10 shadow-md hover:bg-white transition-colors"
              >
                <HiChevronRight size={16} />
              </button>
            </>
          )}
          <div className={s.topBadges}>
            <div className={s.badgesLeft}>
              <span className={statusBadgeClass}>
                For {property?.status || "Sale"}
              </span>
              {isNew && <span className={s.badgeNew}>New</span>}
            </div>
            <button
              onClick={handleWishlistClick}
              className={s.wishlistButton ? s.wishlistButton(isWishlisted) : ""}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {isWishlisted ? <HiHeart size={16} /> : <HiOutlineHeart size={16} />}
            </button>
          </div>
          <img
            src={images[imgIndex]}
            alt={property?.title || "Property Image"}
            className={s.image}
            onError={(e) => {
              e.target.src = PLACEHOLDER;
            }}
          />
          <div className={s.priceOverlay}>
            <p className={s.price}>
              {property?.status?.toLowerCase() === "rent"
                ? `₹${Number(property?.price || 0).toLocaleString("en-IN")}/mo`
                : formattedPrice}
            </p>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[0.65rem] px-2 py-0.5 rounded-full font-semibold">
              {imgIndex + 1}/{images.length}
            </div>
          )}
        </div>

        <div className={s.content}>
          <div className="flex justify-between items-start">
            <span className={s.propertyType}>
              {property?.propertyType || "Property"}
            </span>

          </div>
          <h3 className={s.title}>{property?.title || "Untitled Property"}</h3>
          <div className={s.location}>
            <HiLocationMarker className={s.locationIcon} size={16} />
            <span>
              {property?.area || "Unknown Area"}, {property?.city || "Unknown City"}
            </span>
          </div>

          <div className={s.specsGrid}>
            <div className={s.specItem}>
              <div className={s.specIcon}>
                <HiOutlineHome size={20} />
              </div>
              <div className={s.specValue}>{property?.bhk || 0}</div>
              <div className={s.specLabel}>Beds</div>
            </div>
            <div className={`${s.specItem} ${s.specDivider}`}>
              <div className={s.specIcon}>
                <HiOutlineUserGroup size={20} />
              </div>
              <div className={s.specValue}>
                {property?.bathrooms || Math.max(1, parseInt(property?.bhk || 0) - 1)}
              </div>
              <div className={s.specLabel}>Baths</div>
            </div>
            <div className={s.specItem}>
              <div className={s.specIcon}>
                <HiArrowsExpand size={20} />
              </div>
              <div className={s.specValue}>{property?.areaSize || 0}</div>
              <div className={s.specLabel}>Sq Ft</div>
            </div>
          </div>

          {!renderActions && !actions && (
            <div className={s.viewDetailsButton}>
              <span className={s.viewDetailsBtn}>View Details</span>
            </div>
          )}
        </div>
      </Link>

      {renderActions && (
        <div className={s.actionsContainer}>
          {typeof renderActions === "function" ? renderActions(property) : renderActions}
        </div>
      )}

      {actions && !renderActions && (
        <div className={s.actionsContainer}>{actions}</div>
      )}
    </div>
  );
};

export default PropertyCard;