import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HiOutlineHome, HiOutlineUserGroup, HiChatBubbleLeftRight, HiChevronLeft, HiChevronRight, HiXMark, HiHeart, HiOutlineHeart, HiCheckBadge } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";
import PropertyCard from "../../components/common/PropertyCard";
import { HiOutlineViewGrid, HiCollection, HiLocationMarker, HiPhone } from "react-icons/hi";

const PropertyDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inquiry, setInquiry] = useState({ message: "" });
  const [inquiryStatus, setInquiryStatus] = useState({ loading: false, success: false, error: null });
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProperty();
      window.scrollTo(0, 0);
    }
  }, [id]);

  useEffect(() => {
    if (token && property?._id) {
      axios.get(`${API_URL}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const items = res.data || [];
          setIsInWishlist(items.some(i => String(i.propertyId || i.property?._id) === id));
        })
        .catch(() => {});
    }
  }, [token, property?._id]);

  const fetchProperty = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/property/${id}`);
      const propertyData = res.data?.property || res.data;
      setProperty(propertyData);

      if (propertyData?.propertyType) {
        try {
          const simRes = await axios.get(`${API_URL}/api/property?propertyType=${propertyData.propertyType}&limit=4`);
          const simProps = simRes.data?.properties || simRes.data || [];
          setSimilarProperties(simProps.filter(p => p._id !== id));
        } catch (e) {
          console.warn("Could not load similar properties.");
        }
      }
    } catch (err) {
      console.error("Backend Error:", err);
      try {
        const mockRes = await mockApi.getProperty(id);
        if (mockRes.data?.property) {
          setProperty(mockRes.data.property);
        } else {
          throw new Error("Not found");
        }
      } catch (mockErr) {
        setError("Property not found. Make sure backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!token) return navigate("/login");
    try {
      if (isInWishlist) {
        await axios.delete(`${API_URL}/api/wishlist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsInWishlist(false);
      } else {
        await axios.post(`${API_URL}/api/wishlist`, { propertyId: id }, { headers: { Authorization: `Bearer ${token}` } });
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error("Wishlist toggle failed");
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");
    setInquiryStatus({ loading: true, success: false, error: null });
    try {
      await axios.post(`${API_URL}/api/inquiry`, {
        message: inquiry.message,
        propertyId: id,
        sellerId: property?.seller?._id,
        propertyTitle: property?.title
      }, { headers: { Authorization: `Bearer ${token}` } });
      setInquiryStatus({ loading: false, success: true, error: null });
      setInquiry({ message: "" });
    } catch (err) {
      setInquiryStatus({ loading: false, success: false, error: "Failed to send inquiry." });
    }
  };

  const handleChatStart = () => {
    if (!token) return navigate("/login");
    navigate("/chat-messages");
  };

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  if (loading) return <div className="text-center py-20 text-xl font-bold">Loading Property Details...</div>;
  if (error || !property) return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(property?.price || 0);

  const PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4MDAnIGhlaWdodD0nNjAwJyB2aWV3Qm94PScwIDAgODAwIDYwMCc+PHJlY3QgZmlsbD0nI2UyZThmMCcgd2lkdGg9JzgwMCcgaGVpZ2h0PSc2MDAnLz48dGV4dCBmaWxsPScjOTRhM2I4JyBmb250LWZhbWlseT0nQXJpYWwsc2Fucy1zZXJpZicgZm9udC1zaXplPScyNCcgdGV4dC1hbmNob3I9J21pZGRsZScgeD0nNDAwJyB5PSczMTAnPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
  const images = property?.images && property.images.length > 0 ? property.images : [PLACEHOLDER];
  const totalArea = property?.areaSize || 0;
  const carpetArea = Math.round(totalArea * 0.8);
  const superArea = Math.round(totalArea * 1.2);
  const currIndex = lightboxIndex;

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 pt-28 max-lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fade-in pt-4">
        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="text-teal-600 hover:text-teal-700 font-semibold no-underline">Home</Link>
          <span>/</span>
          <Link to="/properties" className="text-teal-600 hover:text-teal-700 font-semibold no-underline">Properties</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-[250px]">{property?.title || "Details"}</span>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2.5 h-[400px] mb-10">
          {images.slice(0, 4).map((src, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl cursor-pointer group relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              onClick={() => openLightbox(i)}
            >
              <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
              {images.length > 4 && i === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">+{images.length - 4}</div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="bg-gradient-to-r from-teal-700 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                  For {property?.status || "Sale"}
                </span>
                <button onClick={handleWishlistToggle} className="ml-auto p-2.5 rounded-full bg-gray-100 hover:bg-red-50 transition-all">
                  {isInWishlist ? <HiHeart className="text-red-500" size={22} /> : <HiOutlineHeart className="text-gray-500" size={22} />}
                </button>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">{property?.title || "Untitled Property"}</h1>
              <div className="flex items-center gap-2 text-gray-500">
                <HiLocationMarker className="text-teal-600 shrink-0" size={20} />
                <span className="text-lg">{property?.area || "N/A"}, {property?.city || "N/A"}{property?.pincode ? " - " + property.pincode : ""}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Bedrooms", value: property?.bhk || 0, icon: HiOutlineHome, color: "bg-blue-50 text-blue-600" },
                { label: "Bathrooms", value: property?.bathrooms || 1, icon: HiOutlineUserGroup, color: "bg-purple-50 text-purple-600" },
                { label: "Furnishing", value: property?.furnishing ? property.furnishing.charAt(0).toUpperCase() + property.furnishing.slice(1) : "N/A", icon: HiCollection, color: "bg-amber-50 text-amber-600" },
                { label: "Total Area", value: totalArea + " sqft", icon: HiOutlineViewGrid, color: "bg-green-50 text-green-600" },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                    <stat.icon size={22} />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {totalArea > 0 && (
              <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <HiOutlineViewGrid className="text-teal-600" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">Size Options</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-5 text-center border border-teal-200 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">Carpet Area</div>
                    <div className="text-2xl font-extrabold text-gray-900">{carpetArea} <span className="text-sm font-normal text-gray-500">sqft</span></div>
                    <div className="text-xs text-gray-400 mt-1">usable area</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center border border-blue-200 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Built-up Area</div>
                    <div className="text-2xl font-extrabold text-gray-900">{totalArea} <span className="text-sm font-normal text-gray-500">sqft</span></div>
                    <div className="text-xs text-gray-400 mt-1">total built-up</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 text-center border border-amber-200 hover:shadow-md transition-all">
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Super Area</div>
                    <div className="text-2xl font-extrabold text-gray-900">{superArea} <span className="text-sm font-normal text-gray-500">sqft</span></div>
                    <div className="text-xs text-gray-400 mt-1">incl. common areas</div>
                  </div>
                </div>
              </div>
            )}

            {property?.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-5">Amenities</h3>
                <div className="flex flex-wrap gap-2.5">
                  {property.amenities.map((a, i) => (
                    <span key={i} className="bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold border border-teal-100 flex items-center gap-1.5">
                      <HiCheckBadge className="text-teal-500 shrink-0" size={16} /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed text-base">{property?.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                <span><strong className="text-gray-800">BHK:</strong> {property?.bhk || "N/A"}</span>
                <span><strong className="text-gray-800">Furnishing:</strong> <span className="capitalize">{property?.furnishing || "N/A"}</span></span>
                <span><strong className="text-gray-800">Type:</strong> <span className="capitalize">{property?.propertyType || "N/A"}</span></span>

              </div>
            </div>

            {token && (
              <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Interested in this property?</h3>
                <p className="text-gray-500 mb-5 text-sm">Send an inquiry to the owner</p>
                {inquiryStatus.success ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl font-semibold flex items-center gap-2">
                    <HiCheckBadge size={20} /> Inquiry sent successfully!
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
                    <textarea
                      className="w-full p-4 rounded-xl border border-gray-200 outline-none resize-none h-28 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-base"
                      placeholder="Hi, I'm interested in this property. Please share more details..."
                      value={inquiry.message}
                      onChange={e => setInquiry({ message: e.target.value })}
                      required
                    />
                    {inquiryStatus.error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{inquiryStatus.error}</div>}
                    <button
                      type="submit"
                      disabled={inquiryStatus.loading}
                      className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-3.5 px-8 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 self-start flex items-center gap-2"
                    >
                      {inquiryStatus.loading ? "Sending..." : "Send Inquiry"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 rounded-2xl p-7 text-white shadow-xl">
              <div className="text-sm font-medium opacity-80 mb-1">Price</div>
              <div className="text-3xl md:text-4xl font-extrabold">
                {property?.status?.toLowerCase() === "rent"
                  ? "₹" + Number(property?.price || 0).toLocaleString("en-IN")
                  : formattedPrice}
                {property?.status?.toLowerCase() === "rent" && <span className="text-lg font-medium opacity-80"> /month</span>}
              </div>
              {property?.status?.toLowerCase() === "sale" && totalArea > 0 && (
                <div className="mt-2 text-sm opacity-75">
                  ₹{Math.round((property?.price || 0) / totalArea).toLocaleString("en-IN")} per sqft
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineViewGrid size={18} className="text-teal-600" /> Property Details
              </h4>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">Type</span><span className="font-semibold text-gray-900 capitalize">{property?.propertyType || "N/A"}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">Status</span><span className="font-semibold text-gray-900 capitalize">{property?.status || "N/A"}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">BHK</span><span className="font-semibold text-gray-900">{property?.bhk || "N/A"}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">Bathrooms</span><span className="font-semibold text-gray-900">{property?.bathrooms || "N/A"}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">Furnishing</span><span className="font-semibold text-gray-900 capitalize">{property?.furnishing || "N/A"}</span></div>
                <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-gray-500">Area</span><span className="font-semibold text-gray-900">{totalArea} sqft</span></div>
                {property?.pincode && <div className="flex justify-between py-2.5"><span className="text-gray-500">Pincode</span><span className="font-semibold text-gray-900">{property.pincode}</span></div>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={property?.seller?.profilePic || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4MCcgaGVpZ2h0PSc4MCcgdmlld0JveD0nMCAwIDgwIDgwJz48cmVjdCBmaWxsPScjMGQ5NDg4JyB3aWR0aD0nODAnIGhlaWdodD0nODAnIHJ4PSc0MCcvPjx0ZXh0IGZpbGw9JyNmZmYnIGZvbnQtZmFtaWx5PSdBcmlhbCxzYW5zLXNlcmlmJyBmb250LXNpemU9JzMyJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyB4PSc0MCcgeT0nNTAnPk88L3RleHQ+PC9zdmc+"}
                  alt="Owner"
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{property?.seller?.name || "Property Owner"}</h4>
                  <p className="text-sm text-gray-500">Property Owner</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                {property?.seller?.phone && (
                  <a href={"tel:" + property.seller.phone} className="flex-1 text-center py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <HiPhone size={16} /> Call
                  </a>
                )}
                <button onClick={handleChatStart} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-bold hover:shadow-lg transition-all">
                  <HiChatBubbleLeftRight size={16} /> Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {similarProperties.length > 0 && (
          <div className="mt-20 mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 flex items-center gap-2">
              <HiOutlineHome className="text-teal-600" size={24} /> Similar Properties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarProperties.map(p => <PropertyCard key={p._id} property={p} />)}
            </div>
          </div>
        )}

        {currIndex !== null && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={closeLightbox}>
            <button onClick={closeLightbox} className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 p-2.5 rounded-full transition-all z-10">
              <HiXMark size={28} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + images.length) % images.length); }} className="absolute left-5 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all z-10">
              <HiChevronLeft size={28} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % images.length); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all z-10">
              <HiChevronRight size={28} />
            </button>
            <img src={images[currIndex]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
              {currIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;
