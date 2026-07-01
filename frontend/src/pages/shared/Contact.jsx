import React, { useState } from "react";
import { HiPhone, HiCheckCircle } from "react-icons/hi2";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { contactStyles as s } from "../../assets/dummyStyles";
import { HiMail, HiLocationMarker } from "react-icons/hi";

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/contact`, formData);
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.mainContainer}>
        <div className={s.header}>
          <h1 className={s.heading}>Get in Touch</h1>
          <p className={s.subheading}>
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
        </div>

        <div className={s.grid}>
          <div className={s.contactInfoContainer}>
            <div className={s.contactInfoCard}>
              <div className={`${s.contactItem} ${s.contactItemMarginBottom}`}>
                <div className={s.contactIconWrapper}>
                  <HiMail size={22} />
                </div>
                <div>
                  <h4 className={s.contactTitle}>Email</h4>
                  <p className={s.contactDetail}>contact@reestate.com</p>
                </div>
              </div>
              <div className={`${s.contactItem} ${s.contactItemMarginBottom}`}>
                <div className={s.contactIconWrapperAlt}>
                  <HiPhone size={22} />
                </div>
                <div>
                  <h4 className={s.contactTitle}>Phone</h4>
                  <p className={s.contactDetail}>+91 1234567890</p>
                </div>
              </div>
              <div className={s.contactItem}>
                <div className={s.contactIconWrapper}>
                  <HiLocationMarker size={22} />
                </div>
                <div>
                  <h4 className={s.contactTitle}>Address</h4>
                  <p className={s.contactDetail}>
                    123 Business Hub, MG Road, Mumbai - 400001, India
                  </p>
                </div>
              </div>
            </div>

            <div className={s.quickSupportCard}>
              <h3 className={s.quickSupportTitle}>Need Quick Support?</h3>
              <p className={s.quickSupportText}>
                Our team is available 24/7 to assist you with any queries.
              </p>
            </div>
          </div>

          <div className={s.formCard}>
            {success ? (
              <div className={s.successContainer}>
                <HiCheckCircle size={64} className={s.successIcon} />
                <h3 className={s.successTitle}>Message Sent!</h3>
                <p className={s.successMessage}>
                  Thank you for reaching out. We'll get back to you shortly.
                </p>
                <button
                  className={s.successButton}
                  onClick={() => setSuccess(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.formTwoColGrid}>
                  <div className={s.inputGroup}>
                    <label className={s.label}>
                      <HiMail size={16} className="inline mr-1" /> Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={s.input}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className={s.inputGroup}>
                    <label className={s.label}>
                      <HiMail size={16} className="inline mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={s.input}
                      placeholder="Your email"
                      required
                    />
                  </div>
                </div>

                <div className={s.inputGroup}>
                  <label className={s.label}>
                    <HiPhone size={16} className="inline mr-1" /> Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={s.input}
                    placeholder="Your phone number"
                  />
                </div>

                <div className={s.inputGroup}>
                  <label className={s.label}>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className={`${s.input} ${s.textarea}`}
                    rows={5}
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                {error && <div className={s.errorMessage}>{error}</div>}

                <button
                  type="submit"
                  className={s.submitButton}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
