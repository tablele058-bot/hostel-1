const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function getToken(id) {
  const payload = { id, iat: Date.now(), exp: Date.now() + 86400000 * 30 };
  return btoa(JSON.stringify(payload));
}

function getUsers() {
  const data = localStorage.getItem("mock_users");
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem("mock_users", JSON.stringify(users));
}

function getProperties() {
  const data = localStorage.getItem("mock_properties");
  if (data) return JSON.parse(data);
  const defaults = [
    { _id: "1", title: "Modern 2BHK Apartment", description: "Beautiful apartment in the heart of the city with modern amenities.", price: 4500000, city: "Mumbai", area: "Andheri West", pincode: "400053", propertyType: "flat", bhk: "2", bathrooms: 2, areaSize: 850, furnishing: "furnished", status: "sale", amenities: ["Parking", "Security", "Wifi", "Power Backup"], images: [], views: 42, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { _id: "2", title: "Luxury 3BHK Villa", description: "Premium villa with garden and pool in a gated community.", price: 12000000, city: "Pune", area: "Koregaon Park", pincode: "411001", propertyType: "villa", bhk: "3", bathrooms: 3, areaSize: 2000, furnishing: "furnished", status: "sale", amenities: ["Parking", "Pool", "Gym", "Security", "Garden"], images: [], views: 78, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { _id: "3", title: "Cozy 1BHK Studio", description: "Affordable studio apartment near tech park, perfect for bachelors.", price: 1800000, city: "Bangalore", area: "Whitefield", pincode: "560066", propertyType: "flat", bhk: "1", bathrooms: 1, areaSize: 450, furnishing: "semi-furnished", status: "sale", amenities: ["Security", "Wifi", "Power Backup"], images: [], views: 35, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { _id: "4", title: "4BHK Penthouse", description: "Stunning penthouse with panoramic city views and rooftop terrace.", price: 25000000, city: "Delhi", area: "Dwarka", pincode: "110075", propertyType: "penthouse", bhk: "4", bathrooms: 4, areaSize: 3000, furnishing: "furnished", status: "sale", amenities: ["Parking", "Pool", "Gym", "Security", "Club House", "Garden"], images: [], views: 120, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { _id: "5", title: "Commercial Office Space", description: "Prime commercial space in business district, ready to move in.", price: 8500000, city: "Mumbai", area: "Bandra Kurla Complex", pincode: "400051", propertyType: "commercial", bhk: "0", bathrooms: 2, areaSize: 1200, furnishing: "furnished", status: "sale", amenities: ["Parking", "Security", "Power Backup"], images: [], views: 55, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { _id: "6", title: "3BHK Independent House", description: "Spacious independent house with large backyard and parking.", price: 9500000, city: "Chennai", area: "Adyar", pincode: "600020", propertyType: "villa", bhk: "3", bathrooms: 3, areaSize: 1800, furnishing: "semi-furnished", status: "sale", amenities: ["Parking", "Security", "Garden"], images: [], views: 62, createdAt: new Date().toISOString() },
  ];
  saveProperties(defaults);
  return defaults;
}

function saveProperties(properties) {
  localStorage.setItem("mock_properties", JSON.stringify(properties));
}

export const mockApi = {
  async register(data) {
    await delay();
    const users = getUsers();
    const existing = users.find(u => u.email === data.email);
    if (existing) {
      return { data: { ...existing, token: getToken(existing._id) } };
    }
    const user = {
      _id: generateId(),
      name: data.name || "User",
      email: data.email || `${Date.now()}@user.com`,
      phone: data.phone || "",
      role: "viewer",
      isApproved: true,
      isBlocked: false,
      token: getToken(generateId()),
    };
    users.push(user);
    saveUsers(users);
    return { data: user };
  },

  async login(data) {
    await delay();
    const users = getUsers();
    let user = users.find(u => u.email === data.email);
    if (!user) {
      user = {
        _id: generateId(),
        name: data.email?.split("@")[0] || "User",
        email: data.email || `${Date.now()}@user.com`,
        phone: "",
      role: data.role || "viewer",
        isApproved: true,
        isBlocked: false,
        token: getToken(generateId()),
      };
      users.push(user);
      saveUsers(users);
    }
    return { data: { ...user, token: getToken(user._id) } };
  },

  async getProfile(token) {
    await delay();
    if (!token) return { data: null };
    try {
      const payload = JSON.parse(atob(token));
      const users = getUsers();
      const user = users.find(u => u._id === payload.id);
      return { data: user || null };
    } catch {
      return { data: null };
    }
  },

  async getProperties(params) {
    await delay();
    let properties = getProperties();
    const searchParams = new URLSearchParams(params);
    const propertyType = searchParams.get("propertyType");
    const city = searchParams.get("city");
    const bhk = searchParams.get("bhk");
    const maxPrice = searchParams.get("maxPrice");
    const furnishing = searchParams.get("furnishing");
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit");

    if (city) properties = properties.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
    if (propertyType) {
      const types = propertyType.split(",");
      properties = properties.filter(p => types.includes(p.propertyType));
    }
    if (bhk) {
      if (bhk === "5+") properties = properties.filter(p => parseInt(p.bhk) >= 5);
      else properties = properties.filter(p => p.bhk === bhk);
    }
    if (maxPrice) properties = properties.filter(p => p.price <= parseInt(maxPrice));
    if (furnishing) {
      const f = furnishing.split(",");
      properties = properties.filter(p => f.includes(p.furnishing));
    }

    if (sort === "priceLow") properties.sort((a, b) => a.price - b.price);
    else if (sort === "priceHigh") properties.sort((a, b) => b.price - a.price);
    else properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (limit) properties = properties.slice(0, parseInt(limit));
    return { data: { success: true, properties, count: properties.length } };
  },

  async getProperty(id) {
    await delay();
    const properties = getProperties();
    const property = properties.find(p => p._id === id);
    if (property) {
      property.views = (property.views || 0) + 1;
      saveProperties(properties);
    }
    return { data: { success: true, property } };
  },

  async createProperty(formData) {
    await delay(500);
    const properties = getProperties();
    const property = {
      _id: generateId(),
      title: formData.get("title") || "Untitled",
      description: formData.get("description") || "",
      price: parseInt(formData.get("price")) || 0,
      city: formData.get("city") || "",
      area: formData.get("area") || "",
      pincode: formData.get("pincode") || "",
      propertyType: formData.get("propertyType") || "flat",
      bhk: formData.get("bhk") || "1",
      bathrooms: parseInt(formData.get("bathrooms")) || 1,
      areaSize: parseInt(formData.get("areaSize")) || 500,
      furnishing: formData.get("furnishing") || "unfurnished",
      status: formData.get("status") || "sale",
      amenities: [],
      images: [],
      views: 0,
      seller: formData.get("seller") ? JSON.parse(formData.get("seller")) : undefined,
      createdAt: new Date().toISOString(),
    };
    properties.unshift(property);
    saveProperties(properties);
    return { data: { success: true, property } };
  },

  async updateProperty(id, formData) {
    await delay(500);
    const properties = getProperties();
    const idx = properties.findIndex(p => p._id === id);
    if (idx === -1) throw new Error("Not found");
    const fields = ["title", "description", "price", "city", "area", "pincode", "propertyType", "bhk", "bathrooms", "areaSize", "furnishing", "status"];
    fields.forEach(f => {
      const val = formData.get(f);
      if (val !== null) properties[idx][f] = f === "price" || f === "bathrooms" || f === "areaSize" ? parseInt(val) : val;
    });
    saveProperties(properties);
    return { data: { success: true, property: properties[idx] } };
  },

  async deleteProperty(id) {
    await delay();
    const properties = getProperties().filter(p => p._id !== id);
    saveProperties(properties);
    return { data: { success: true } };
  },

  async getCounts() {
    await delay();
    const properties = getProperties();
    const counts = {};
    properties.forEach(p => {
      if (p.status === "sale") counts[p.propertyType] = (counts[p.propertyType] || 0) + 1;
    });
    return { data: { success: true, counts } };
  },
};
