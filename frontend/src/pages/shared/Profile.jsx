import React, { useState, useEffect, useRef } from "react";
import { HiOutlineUserCircle, HiOutlinePhone, HiPencil, HiXMark, HiCamera } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { profileStyles as s } from "../../assets/dummyStyles";
import { HiOutlineMail, HiOutlineLocationMarker, HiUpload } from "react-icons/hi";

const Profile = () => {
  const { user, token, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeProfilePic, setRemoveProfilePic] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setRemoveProfilePic(false);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfilePic(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("phone", formData.phone);
      formPayload.append("address", formData.address);
      if (removeProfilePic) formPayload.append("removeProfilePic", "true");
      if (imageFile) formPayload.append("profilePic", imageFile);

      const res = await axios.put(`${API_URL}/api/auth/profile`, formPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUser(res.data);
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
      setRemoveProfilePic(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setImageFile(null);
    setImagePreview(null);
    setRemoveProfilePic(false);
    setError(null);
  };

  if (!user) return null;

  return (
    <div className={s.containerWrapper(user.role)}>
      <div className={s.mainContainer(user.role)}>
        <div className={s.header}>
          <h1 className={s.pageTitle}>My Profile</h1>
          <p className={s.pageSubtitle}>Manage your account information</p>
        </div>

        <div className={s.card}>
          <div className={s.profileHeader}>
            <div className={s.avatarSection}>
              <div className={s.avatarWrapper}>
                {(imagePreview || (user.profilePic && !removeProfilePic)) ? (
                  <img
                    src={imagePreview || user.profilePic}
                    alt={user.name}
                    className={s.avatarImage}
                  />
                ) : (
                  <span className={s.avatarPlaceholder}>
                    <HiOutlineUserCircle size={60} />
                  </span>
                )}
              </div>
              {isEditing && (
                <>
                  <div
                    className={s.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <HiCamera size={18} />
                  </div>
                  {(imagePreview || user.profilePic) && (
                    <div
                      className={s.removeButton}
                      onClick={handleRemoveImage}
                    >
                      <HiXMark size={18} />
                    </div>
                  )}
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div>
              <h2 className={s.userName}>{user.name}</h2>
              <span className={s.roleBadge}>{user.role}</span>
            </div>
          </div>

          {error && <div className={s.errorMessage}>{error}</div>}

          {isEditing ? (
            <form onSubmit={handleSave} className={s.editForm}>
              <div>
                <label className={s.label}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={s.input}
                  required
                />
              </div>
              <div>
                <label className={s.label}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={s.input}
                />
              </div>
              <div>
                <label className={s.label}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={s.textarea}
                />
              </div>
              <div className={s.formActions}>
                <button
                  type="submit"
                  className={s.saveButton}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className={s.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className={s.infoSection}>
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <HiOutlineMail size={22} />
                </div>
                <div>
                  <div className={s.infoLabel}>Email</div>
                  <div className={s.infoValue}>{user.email}</div>
                </div>
              </div>
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <HiOutlinePhone size={22} />
                </div>
                <div>
                  <div className={s.infoLabel}>Phone</div>
                  <div className={s.infoValue}>
                    {user.phone || "Not provided"}
                  </div>
                </div>
              </div>
              <div className={s.infoItem}>
                <div className={s.infoIcon}>
                  <HiOutlineLocationMarker size={22} />
                </div>
                <div>
                  <div className={s.infoLabel}>Address</div>
                  <div className={s.infoValue}>
                    {user.address || "Not provided"}
                  </div>
                </div>
              </div>
              <div className={s.editButtonWrapper}>
                <button
                  className={s.editProfileButton}
                  onClick={() => setIsEditing(true)}
                >
                  <HiPencil size={18} /> Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
