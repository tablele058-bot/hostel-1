import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HiXMark, HiPlus } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";
import { addPropertyStyles as s } from "../../assets/dummyStyles";
import { HiUpload, HiOutlinePhotograph } from "react-icons/hi";

const AddProperty = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    city: "",
    area: "",
    pincode: "",
    propertyType: "flat",
    bhk: "",
    bathrooms: "",
    areaSize: "",
    furnishing: "unfurnished",
    status: "sale",
    amenities: [],
    securityDeposit: "",
    maintenance: "",
  });

  const commonAmenities = [
    "Parking",
    "Pool",
    "Gym",
    "Security",
    "Wifi",
    "Power Backup",
    "Club House",
    "Garden",
  ];

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => {
      const current = prev.amenities || [];
      if (current.includes(amenity)) {
        return { ...prev, amenities: current.filter((a) => a !== amenity) };
      } else {
        return { ...prev, amenities: [...current, amenity] };
      }
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) =>
      [...prev, ...newPreviews].slice(0, 10)
    );
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { amenities, ...rest } = formData;
      const payload = { ...rest, amenities: amenities || [] };

      try {
        await axios.post(`${API_URL}/api/property`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (Array.isArray(v)) v.forEach(i => fd.append(`${k}[]`, i));
          else fd.append(k, v);
        });
        fd.append("seller", JSON.stringify({ _id: user?._id, name: user?.name }));
        await mockApi.createProperty(fd);
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Failed to add property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.outerContainer}>
      <div className={s.innerContainer}>
        <div className={s.header}>
          <h1 className={s.heading}>Register Your PG</h1>
          <p className={s.subheading}>
            Fill in the details below to set up your PG/Hostel for tenant management.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {error && <div className={s.error}>{error}</div>}

          {/* Section 1: Basic Info */}
          <div className={s.section}>
            <div className={`${s.sectionHeader} ${s.sectionHeaderLargeMargin}`}>
              <div className={s.sectionBar}></div>
              <h3 className={s.sectionTitle}>Basic Information</h3>
            </div>
            <div className={s.contentGroupLarge}>
              <div>
                <label className={s.label}>Property Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={s.input}
                  placeholder="e.g. 3 BHK Luxury Apartment in Worli"
                  required
                />
              </div>
              <div>
                <label className={s.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${s.input} ${s.textarea}`}
                  placeholder="Describe your property in detail..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Property Details */}
          <div className={s.section}>
            <div className={`${s.sectionHeader} ${s.sectionHeaderLargeMargin}`}>
              <div className={s.sectionBar}></div>
              <h3 className={s.sectionTitle}>Property Details</h3>
            </div>
            <div className={s.contentGroupMedium}>
              <div>
                <label className={s.labelSmallMargin}>Property Type</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  className={`${s.input} ${s.select}`}
                >
                  <option value="flat">Flat/Apartment</option>
                  <option value="villa">Independent House/Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div className={s.gridThreeCol}>
                <div>
                  <label className={s.labelSmallMargin}>BHK</label>
                  <input
                    type="number"
                    name="bhk"
                    value={formData.bhk}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. 3"
                    required
                  />
                </div>
                <div>
                  <label className={s.labelSmallMargin}>Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className={s.labelSmallMargin}>Area (Sq. Ft)</label>
                  <input
                    type="number"
                    name="areaSize"
                    value={formData.areaSize}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>
              </div>
              <div className={s.gridTwoCol}>
                <div>
                  <label className={s.labelSmallMargin}>Furnishing</label>
                  <select
                    name="furnishing"
                    value={formData.furnishing}
                    onChange={handleInputChange}
                    className={`${s.input} ${s.select}`}
                  >
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="furnished">Fully Furnished</option>
                  </select>
                </div>
                <div>
                  <label className={s.labelSmallMargin}>PG Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`${s.input} ${s.select}`}
                  >
                    <option value="sale">Active (Accepting Tenants)</option>
                    <option value="rent">Available</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Location */}
          <div className={s.section}>
            <div className={`${s.sectionHeader} ${s.sectionHeaderLargeMargin}`}>
              <div className={s.sectionBar}></div>
              <h3 className={s.sectionTitle}>Pricing & Location</h3>
            </div>
            <div className={s.twoColumnGrid}>
              <div className={s.contentGroupMedium}>
                <div>
                  <label className={s.labelSmallMargin}>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. 5000000"
                    required
                  />
                </div>
                {formData.status === "rent" && (
                  <>
                    <div>
                      <label className={s.labelSmallMargin}>
                        Security Deposit (₹)
                      </label>
                      <input
                        type="number"
                        name="securityDeposit"
                        value={formData.securityDeposit}
                        onChange={handleInputChange}
                        className={s.input}
                        placeholder="e.g. 100000"
                      />
                    </div>
                    <div>
                      <label className={s.labelSmallMargin}>
                        Maintenance (₹)
                      </label>
                      <input
                        type="number"
                        name="maintenance"
                        value={formData.maintenance}
                        onChange={handleInputChange}
                        className={s.input}
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className={s.contentGroupMedium}>
                <div>
                  <label className={s.labelSmallMargin}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. Mumbai"
                    required
                  />
                </div>
                <div>
                  <label className={s.labelSmallMargin}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. 400001"
                    required
                  />
                </div>
                <div>
                  <label className={s.labelSmallMargin}>Specific Area</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className={s.input}
                    placeholder="e.g. Worli"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Amenities */}
          <div className={s.section}>
            <div className={`${s.sectionHeader} ${s.sectionHeaderSmallMargin}`}>
              <div className={s.sectionBar}></div>
              <h3 className={s.sectionTitle}>Amenities</h3>
            </div>
            <div className={s.amenitiesGrid}>
              {commonAmenities.map((amenity) => {
                const isSelected = (
                  formData.amenities || []
                ).includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`${s.amenityLabelBase} ${
                      isSelected
                        ? s.amenityLabelActive
                        : s.amenityLabelInactive
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAmenityChange(amenity)}
                      className={s.amenityCheckbox}
                    />
                    <span
                      className={`${s.amenityTextBase} ${
                        isSelected
                          ? s.amenityTextActive
                          : s.amenityTextInactive
                      }`}
                    >
                      {amenity}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: Images */}
          <div className={s.section}>
            <div className={`${s.sectionHeader} ${s.sectionHeaderSmallMargin}`}>
              <div className={s.sectionBar}></div>
              <h3 className={s.sectionTitle}>Images</h3>
            </div>

            {imagePreviews.length === 0 ? (
              <label className={s.uploadArea}>
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className={s.uploadIconWrapper}>
                  <HiUpload size={40} color="#94a3b8" />
                </div>
                <p className={s.uploadTitle}>
                  Click to upload property images
                </p>
                <p className={s.uploadSubtext}>
                  Max 10 images (JPEG, PNG)
                </p>
              </label>
            ) : (
              <>
                <div className={s.previewsGrid}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} className={s.previewItem}>
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className={s.removeButton}
                        onClick={() => removeImage(i)}
                      >
                        <HiXMark size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 10 && (
                    <label className={s.addMoreBox}>
                      <input
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <HiPlus size={24} color="#94a3b8" />
                      <span className={s.addMoreText}>Add More</span>
                    </label>
                  )}
                </div>
                <p className={s.uploadSubtext}>
                  {images.length}/10 images uploaded
                </p>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={s.footerButtons}>
            <Link to="/dashboard" className={s.cancelButton}>
              Cancel
            </Link>
            <button
              type="submit"
              className={s.submitButton}
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
