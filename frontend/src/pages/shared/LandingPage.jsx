import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiShieldCheck, HiBolt, HiCurrencyDollar, HiVideoCamera, HiBuildingOffice2, HiHome, HiPhone, HiCheckBadge, HiArrowRight, HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { mockApi } from "../../mockApi";
import PropertyCard from "../../components/common/PropertyCard";
import { landingPageStyles as s } from "../../assets/dummyStyles";
import { HiMail, HiLocationMarker } from "react-icons/hi";

const LandingPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCity, setSearchCity] = useState("");
  const [propertyType, setPropertyType] = useState("Select Type");
  const [propertyCounts, setPropertyCounts] = useState({});
  const [wishlistedIds, setWishlistedIds] = useState([]);

  useEffect(() => {
    fetchFeaturedProperties();
    fetchCategoryCounts();
  }, []);

  useEffect(() => {
    if (token) fetchWishlist();
  }, [token]);

  const fetchFeaturedProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property?limit=6`);
      setProperties(res.data.properties || []);
    } catch (err) {
      try {
        const res = await mockApi.getProperties("limit=6");
        setProperties(res.data.properties || []);
      } catch {
        setError("Failed to load properties.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/counts`);
      setPropertyCounts(res.data || {});
    } catch (err) {
      try {
        const res = await mockApi.getCounts();
        setPropertyCounts(res.data.counts || {});
      } catch {
        console.error("Failed to fetch counts");
      }
    }
  };

  const fetchWishlist = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlistedIds(
        res.data.map((p) => String(p.property?._id || p._id))
      );
    } catch (err) {
      console.error("Failed to fetch wishlist");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCity) params.append("city", searchCity);
    if (propertyType !== "Select Type")
      params.append("propertyType", propertyType);
    navigate(`/properties?${params.toString()}`);
  };

  const handleToggleWishlist = async (propertyId) => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      if (wishlistedIds.includes(String(propertyId))) {
        await axios.delete(`${API_URL}/api/wishlist/${propertyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlistedIds((prev) =>
          prev.filter((id) => id !== String(propertyId))
        );
      } else {
        await axios.post(
          `${API_URL}/api/wishlist`,
          { propertyId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWishlistedIds((prev) => [...prev, String(propertyId)]);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist");
    }
  };

  const categories = [
    {
      name: "Shared Rooms",
      count: propertyCounts.flat || 0,
      icon: <HiBuildingOffice2 size={32} />,
      type: "flat",
    },
    {
      name: "Private Rooms",
      count: propertyCounts.villa || 0,
      icon: <HiHome size={32} />,
      type: "villa",
    },
    {
      name: "Entire PG",
      count: propertyCounts.penthouse || 0,
      icon: <HiBuildingOffice2 size={32} />,
      type: "penthouse",
    },
    {
      name: "Co-Living",
      count: propertyCounts.commercial || 0,
      icon: <HiBuildingOffice2 size={32} />,
      type: "commercial",
    },
  ];

  const features = [
    {
      title: "Digital Records",
      desc: "All tenant details, room allocations, and payments stored digitally — no more paper registers.",
      icon: <HiShieldCheck size={24} />,
    },
    {
      title: "Automated Rent Tracking",
      desc: "Track rent collection, due dates, and pending payments automatically with smart reminders.",
      icon: <HiBolt size={24} />,
    },
    {
      title: "Room Management",
      desc: "Easily manage room occupancy, vacancies, and allocations from a centralized dashboard.",
      icon: <HiCurrencyDollar size={24} />,
    },
    {
      title: "Instant Reports",
      desc: "Generate real-time reports on revenue, occupancy rates, and payment history with one click.",
      icon: <HiVideoCamera size={24} />,
    },
  ];

  const processSteps = [
    {
      step: "01",
      title: "Tenant Registration",
      desc: "Tenants register with their details — no paperwork needed. Everything is captured digitally in seconds.",
      icon: <HiBolt size={32} />,
    },
    {
      step: "02",
      title: "Room Allocation",
      desc: "PG owners assign rooms based on availability, preferences, and requirements with a few clicks.",
      icon: <HiVideoCamera size={32} />,
    },
    {
      step: "03",
      title: "Rent & Payments",
      desc: "Automated rent collection with payment tracking, due reminders, and instant receipt generation.",
      icon: <HiShieldCheck size={32} />,
    },
  ];

  const statsData = [
    { value: "500+", label: "PGs Listed" },
    { value: "50+", label: "Cities" },
    { value: "10K+", label: "Happy Tenants" },
    { value: "4.9", label: "Avg Rating" },
  ];

  const featureListItems = [
    "Digital records — no more paper registers",
    "Automated rent tracking with reminders",
    "Real-time room occupancy dashboard",
    "24/7 Premium customer support",
  ];

  const socialIcons = [FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn];

  return (
    <div className={s.bgMain}>
      {/* Hero Section */}
      <section className={s.heroSection}>
        <div className={s.heroContent}>
          <span className={s.badge}> #1 PG Management Platform</span>
          <h1 className={s.heroTitle}>
            Smart{" "}
            <span className={s.textGradient}>PG & Hostel</span>{" "}
            Management
          </h1>
          <p className={s.heroSubtitle}>
            Transform your traditional PG into a smart digital space. Manage tenants, rooms, rent, and staff — all from one dashboard.
          </p>

          <form onSubmit={handleSearch} className={s.searchForm}>
            <div className={s.searchField}>
              <HiMagnifyingGlass className={s.textPrimary} size={22} />
              <div className={s.flexCol}>
                <label className={s.labelSmall}>City</label>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className={s.inputTransparent}
                  placeholder="Search by city..."
                />
              </div>
            </div>
            <div className={s.searchDivider} />
            <div className={s.searchField}>
              <HiBuildingOffice2 className={s.textPrimary} size={22} />
              <div className={s.flexCol}>
                <label className={s.labelSmall}>Room Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className={`${s.inputTransparent} cursor-pointer`}
                >
                  <option value="Select Type">Select Type</option>
                  <option value="flat">Shared Room</option>
                  <option value="villa">Private Room</option>
                  <option value="penthouse">Entire PG</option>
                  <option value="commercial">Co-Living</option>
                </select>
              </div>
            </div>
            <button type="submit" className={s.searchButton}>
              <HiMagnifyingGlass size={20} /> Search
            </button>
          </form>

          <div className={s.statsContainer}>
            {statsData.map((stat, idx) => (
              <div
                key={idx}
                className={idx === 0 ? s.statItemFlex : s.statItemBorder}
              >
                <div className={s.statNumber}>{stat.value}</div>
                <div className={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={s.heroImageContainer}>
          <div className={s.imageWrapper}>
            <img
              src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"
              alt="PG Hostel"
              className={s.heroImage}
            />
            <div className={s.verifiedBadge}>
              <div className={s.badgeIconWrapper}>
                <HiCheckBadge size={28} className="text-primary" />
              </div>
              <div>
                <p className={s.badgeTitle}>Verified PGs</p>
                <p className={s.badgeText}>100% authentic listings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={s.categorySection}>
        <div className="container">
          <div className={s.categoryHeader}>
            <div className={s.categoryHeaderText}>
              <h2 className={s.categoryTitle}>Browse by Room Type</h2>
              <p className={s.categoryDesc}>
                Find the perfect accommodation type that matches your needs and budget.
              </p>
            </div>
            <Link to="/properties" className="btn btn-outline py-3 px-6 rounded-xl font-bold no-underline">
              View All <HiArrowRight size={18} className="inline" />
            </Link>
          </div>
          <div className={s.categoryGrid}>
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/properties?propertyType=${cat.type}`}
                className={s.categoryCard}
              >
                <div className={s.categoryIconWrapper}>{cat.icon}</div>
                <h3 className={s.categoryName}>{cat.name}</h3>
                <p className={s.categoryCount}>
                  {cat.count} Listings
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={s.featuresSection}>
        <div className={s.featuresContainer}>
          <div className={s.featuresList}>
            {features.map((feature, idx) => (
              <div key={idx} className={s.featureCard}>
                <div className={s.featureIconWrapper}>{feature.icon}</div>
                <h3 className={s.featureTitle}>{feature.title}</h3>
                <p className={s.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
          <div className={s.featuresContent}>
            <h2 className={s.featuresHeading}>
              Why Choose <span className="text-gradient">PG Smart?</span>
            </h2>
            <p className={s.featuresSubtext}>
              We've reinvented PG and hostel management from the ground up. By focusing on digital transformation, automation, and user-centric design, we help PG owners run their business effortlessly.
            </p>
            <div className={s.featuresListItems}>
              {featureListItems.map((item, idx) => (
                <div key={idx} className={s.listItem}>
                  <HiCheckBadge className="text-primary" size={22} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link to="/contact" className={s.learnMoreLink}>
              Learn More About Us <HiArrowRight size={16} className="inline" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={s.processSection}>
        <div className="container">
          <div className={s.processHeader}>
            <span className={s.processBadge}>How It Works</span>
            <h2 className={s.processTitle}>Simple Workflow</h2>
            <p className={s.processSubtitle}>
              Tenant journey made simple — from registration to payment tracking.
            </p>
          </div>
          <div className={s.processGrid}>
            {processSteps.map((p, idx) => (
              <div key={idx} className={s.processCard}>
                <div className={s.stepNumber}>{p.step}</div>
                <div className={s.processIconWrapper}>{p.icon}</div>
                <h3 className={s.processCardTitle}>{p.title}</h3>
                <p className={s.processCardDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className={s.featuredSection}>
        <div className="container">
          <div className={s.featuredHeader}>
            <span className={s.featuredBadge}>Featured Collections</span>
            <h2 className={s.featuredTitle}>Top Rated PGs</h2>
            <p className={s.featuredSubtitle}>
              Curated selection of the best PG accommodations available right now.
            </p>
          </div>

          {loading ? (
            <div className={s.loadingContainer}>
              <div className={s.loader}></div>
            </div>
          ) : error ? (
            <div className={s.errorContainer}>{error}</div>
          ) : (
            <>
              <div className={s.propertiesGrid}>
                {properties
                  .filter((p) => p)
                  .sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                  )
                  .slice(0, 6)
                  .map((property) => (
                    <PropertyCard
                      key={property._id}
                      property={property}
                      isWishlisted={wishlistedIds.includes(
                        String(property._id)
                      )}
                      onToggleWishlist={handleToggleWishlist}
                    />
                  ))}
              </div>
              <div className={s.discoverButtonContainer}>
                <Link to="/properties" className={s.discoverButton}>
                  Discover More PGs <HiArrowRight size={20} className="inline ml-2" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <div className="container">
          <div className={s.footerMainGrid}>
            <div className={s.footerBrand}>
              <div className={s.brandLogo}>
                <span className={s.brandIcon}>
                  <HiHome size={20} />
                </span>
                PGSmart
              </div>
              <p className={s.brandDesc}>
                Your trusted platform for PG and hostel management. Manage your property with cutting-edge digital tools.
              </p>
              <div className={s.socialIcons}>
                {socialIcons.map((Icon, idx) => (
                  <a key={idx} href="#" className={s.socialIcon}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className={s.footerHeading}>Company</h4>
              <ul className={s.footerLinks}>
                <li>
                  <a href="/" className={s.footerLink}>Home</a>
                </li>
                <li>
                  <a href="/properties" className={s.footerLink}>PGs</a>
                </li>
                <li>
                  <a href="/wishlist" className={s.footerLink}>Wishlist</a>
                </li>
                <li>
                  <a href="/contact" className={s.footerLink}>Contact</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className={s.footerHeading}>Support</h4>
              <ul className={s.footerLinks}>
                <li className={s.contactInfo}>
                  <HiMail className="text-primary text-xl" /> contact@pgsmart.com
                </li>
                <li className={s.contactInfo}>
                  <HiPhone className="text-primary text-xl" /> +91 1234567890
                </li>
                <li className={s.contactInfoStart}>
                  <HiLocationMarker className={`text-primary ${s.contactIcon}`} />
                  123 Business Hub, India
                </li>
              </ul>
            </div>

            <div>
              <h4 className={s.footerHeading}>Newsletter</h4>
              <p className={s.newsletterDesc}>
                Subscribe to get the latest PG listings and management tips.
              </p>
              <div className={s.newsletterInputWrapper}>
                <input
                  type="email"
                  className={s.newsletterInput}
                  placeholder="Enter your email"
                />
                <button className={s.newsletterButton}>Subscribe</button>
              </div>
            </div>
          </div>

          <div className={s.bottomBar}>
            <div className={s.bottomBarFlex}>
              <p>&copy; 2026 PGSmart. All rights reserved.</p>
              <div className={s.footerLegalLinks}>
                <a href="#" className={s.footerLink}>Privacy Policy</a>
                <a href="#" className={s.footerLink}>Terms of Service</a>
                <a href="#" className={s.footerLink}>Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
