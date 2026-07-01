import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { HiXMark } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";
import { editPropertyStyles as s } from "../../assets/dummyStyles";
import { HiUpload } from "react-icons/hi";

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
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

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/${id}`);
      const p = res.data;
      setFormData({
        title: p.title || "",
        description: p.description || "",
        price: p.price || "",
        city: p.city || "",
        area: p.area || "",
        pincode: p.pincode || "",
        propertyType: p.propertyType || "flat",
        bhk: p.bhk || "",
        bathrooms: p.bathrooms || "",
        areaSize: p.areaSize || "",
        furnishing: p.furnishing || "unfurnished",
        status: p.status || "sale",
        amenities: p.amenities || [],
        securityDeposit: p.securityDeposit || "",
        maintenance: p.maintenance || "",
      });
      setExistingImages(p.images || []);
    } catch (err) {
      try {
        const res = await mockApi.getProperty(id);
        const p = res.data.property;
        if (p) {
          setFormData({
            title: p.title || "",
            description: p.description || "",
            price: p.price || "",
            city: p.city || "",
            area: p.area || "",
            pincode: p.pincode || "",
            propertyType: p.propertyType || "flat",
            bhk: p.bhk || "",
            bathrooms: p.bathrooms || "",
            areaSize: p.areaSize || "",
            furnishing: p.furnishing || "unfurnished",
            status: p.status || "sale",
            amenities: p.amenities || [],
            securityDeposit: p.securityDeposit || "",
            maintenance: p.maintenance || "",
          });
          setExistingImages(p.images || []);
          return;
        }
      } catch {}
      setError("Failed to load property.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...newImages, ...files].slice(0, 10 - existingImages.length);
    setNewImages(newFiles);

    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) =>
      [...prev, ...previews].slice(0, 10 - existingImages.length)
    );
  };

  const removeExistingImage = (src) => {
    setExistingImages((prev) => prev.filter((img) => img !== src));
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { amenities, ...rest } = formData;
      const payload = { ...rest, amenities: amenities || [] };

      await axios.put(`${API_URL}/api/property/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/dashboard");
    } catch (err) {
      try {
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (Array.isArray(v)) v.forEach(i => fd.append(`${k}[]`, i));
          else fd.append(k, v);
        });
        await mockApi.updateProperty(id, fd);
        navigate("/dashboard");
      } catch {
        setError(
          err.response?.data?.message || "Failed to update property."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-full-page">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className={s.pageContainer}>
      <div className={s.innerContainer}>
        <div className={s.headerWrapper}>
          <h1 className={s.pageTitle}>Edit PG</h1>
          <p className={s.pageSubtitle}>Update your PG details</p>
        </div>

        <form onSubmit={handleSubmit} className={s.formContainer}>
          {error && (
            <div
              style={{
                padding: "1rem",
                background: "#fee2e2",
                color: "#dc2626",
                borderRadius: "0.75rem",
                marginBottom: "2rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <div className={s.sectionIndicator}></div>
              <h3 className={s.sectionTitle}>Basic Information</h3>
            </div>
            <div className={s.sectionContent}>
              <div>
                <label className={s.label}>Property Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={s.input}
                  placeholder="e.g. 3 BHK Luxury Apartment"
                  required
                />
              </div>
              <div>
                <label className={s.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={s.textarea}
                  placeholder="Describe your property..."
                  required
                />
              </div>
            </div>
          </div>

          <div className={s.twoColumnGrid}>
            {/* Section 2: Property Details */}
            <div>
              <div className={s.sectionHeader}>
                <div className={s.sectionIndicator}></div>
                <h3 className={s.sectionTitle}>Property Details</h3>
              </div>
              <div className={s.sectionContent}>
                <div>
                  <label className={s.label}>Property Type</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    className={s.select}
                  >
                    <option value="flat">Flat/Apartment</option>
                    <option value="villa">Independent House/Villa</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div className={s.threeColumnGrid}>
                  <div>
                    <label className={s.label}>BHK</label>
                    <input
                      type="number"
                      name="bhk"
                      value={formData.bhk}
                      onChange={handleInputChange}
                      placeholder="e.g. 3"
                      className={s.input}
                    />
                  </div>
                  <div>
                    <label className={s.label}>Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms || ""}
                      onChange={handleInputChange}
                      placeholder="e.g. 2"
                      className={s.input}
                    />
                  </div>
                  <div>
                    <label className={s.label}>Area (Sq.Ft)</label>
                    <input
                      type="number"
                      name="areaSize"
                      value={formData.areaSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 1500"
                      className={s.input}
                      required
                    />
                  </div>
                </div>
                <div className={s.twoColumnGridInner}>
                  <div>
                    <label className={s.label}>Furnishing</label>
                    <select
                      name="furnishing"
                      value={formData.furnishing}
                      onChange={handleInputChange}
                      className={s.select}
                    >
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="furnished">Fully Furnished</option>
                    </select>
                  </div>
                  <div>
                    <label className={s.label}>PG Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={s.select}
                    >
                      <option value="sale">Active (Accepting Tenants)</option>
                      <option value="sold">Full</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Pricing & Location */}
            <div>
              <div className={s.sectionHeader}>
                <div className={s.sectionIndicator}></div>
                <h3 className={s.sectionTitle}>Pricing & Location</h3>
              </div>
              <div className={s.sectionContent}>
                <div>
                  <label className={s.label}>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000000"
                    className={s.input}
                    required
                  />
                </div>

                {formData.status === "rent" && (
                  <>
                    <div>
                      <label className={s.label}>Security Deposit (₹)</label>
                      <input
                        type="number"
                        name="securityDeposit"
                        value={formData.securityDeposit}
                        onChange={handleInputChange}
                        placeholder="e.g. 100000"
                        className={s.input}
                      />
                    </div>
                    <div>
                      <label className={s.label}>Maintenance (₹)</label>
                      <input
                        type="number"
                        name="maintenance"
                        value={formData.maintenance}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        className={s.input}
                      />
                    </div>
                  </>
                )}

                <div className={s.twoColumnGridInner}>
                  <div>
                    <label className={s.label}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Mumbai"
                      className={s.input}
                      required
                    />
                  </div>
                  <div>
                    <label className={s.label}>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 400001"
                      className={s.input}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={s.label}>Specific Area</label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g. Worli"
                    className={s.input}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Amenities */}
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <div className={s.sectionIndicator}></div>
              <h3 className={s.sectionTitle}>Amenities</h3>
            </div>
            <div className={s.amenitiesGrid}>
              {commonAmenities.map((amenity) => {
                const isSelected = (formData.amenities || []).includes(
                  amenity
                );
                return (
                  <label
                    key={amenity}
                    className={s.amenityLabel(isSelected)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAmenityChange(amenity)}
                      className={s.amenityCheckbox}
                    />
                    <span className={s.amenityText(isSelected)}>
                      {amenity}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: Image Management */}
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <div className={s.sectionIndicator}></div>
              <h3 className={s.sectionTitle}>Image Management</h3>
            </div>

            <div className={s.imageGrid}>
              {existingImages.map((src, i) => (
                <div key={`existing-${i}`} className={s.imageCard}>
                  <img
                    src={src}
                    alt="Existing"
                    className={s.imageCardImg}
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(src)}
                    className={s.removeImageBtn}
                  >
                    <HiXMark size={12} />
                  </button>
                  <div className={s.imageBadgeExisting}>EXISTING</div>
                </div>
              ))}

              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`} className={s.imageCardNew}>
                  <img
                    src={src}
                    alt="New Preview"
                    className={s.imageCardImg}
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className={s.removeImageBtn}
                  >
                    <HiXMark size={12} />
                  </button>
                  <div className={s.imageBadgeNew}>NEW</div>
                </div>
              ))}

              {existingImages.length + newImages.length < 10 && (
                <div className={s.uploadCard}>
                  <input
                    type="file"
                    multiple
                    onChange={handleNewImageChange}
                    className={s.uploadInput}
                    accept="image/*"
                  />
                  <HiUpload size={22} color="#64748b" />
                  <span className={s.uploadText}>Add Image</span>
                </div>
              )}
            </div>
          </div>

          <div className={s.formActions}>
            <Link to="/dashboard" className={s.cancelButton}>
              Cancel
            </Link>
            <button
              type="submit"
              className={s.submitButton}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;
