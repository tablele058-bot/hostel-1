import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db("pgsmart");
  console.log("MongoDB connected");
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) });
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: decoded.id, role: user.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ── Auth Routes ──
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = {
      name: name || "User", email, password: hashed,
      phone: phone || "", role: role || "viewer",
      isApproved: true, isBlocked: false, createdAt: new Date(),
    };
    const result = await db.collection("users").insertOne(user);
    const token = jwt.sign({ id: result.insertedId.toString() }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      _id: result.insertedId.toString(), name: user.name, email: user.email,
      phone: user.phone, role: user.role, isApproved: user.isApproved, isBlocked: user.isBlocked, token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
    if (role && user.role !== role) {
      await db.collection("users").updateOne({ _id: user._id }, { $set: { role } });
      user.role = role;
    }
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({
      _id: user._id.toString(), name: user.name, email: user.email,
      phone: user.phone, role: user.role, profilePic: user.profilePic,
      isApproved: user.isApproved, isBlocked: user.isBlocked, token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });
    if (!user) return res.json(null);
    res.json({ ...user, _id: user._id.toString() });
  } catch {
    res.json(null);
  }
});

// ── Health Check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ── Property Routes ──
app.get("/api/property", async (req, res) => {
  try {
    let filter = {};
    if (req.query.city) filter.city = { $regex: req.query.city, $options: "i" };
    if (req.query.propertyType) filter.propertyType = { $in: req.query.propertyType.split(",") };
    if (req.query.bhk) {
      if (req.query.bhk === "5+") filter.bhk = { $gte: "5" };
      else filter.bhk = req.query.bhk;
    }
    if (req.query.maxPrice) filter.price = { $lte: parseInt(req.query.maxPrice) };
    if (req.query.furnishing) filter.furnishing = { $in: req.query.furnishing.split(",") };
    let sort = { createdAt: -1 };
    if (req.query.sort === "priceLow") sort = { price: 1 };
    else if (req.query.sort === "priceHigh") sort = { price: -1 };
    const limit = parseInt(req.query.limit) || 0;
    let properties = await db.collection("properties").find(filter).sort(sort).limit(limit).toArray();
    properties = properties.map(p => ({ ...p, _id: p._id.toString(), seller: p.seller ? { ...p.seller, _id: p.seller._id?.toString() } : undefined }));
    res.json({ success: true, properties, count: properties.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch" });
  }
});

app.get("/api/property/counts", async (req, res) => {
  try {
    const properties = await db.collection("properties").find({}).toArray();
    const counts = {};
    properties.forEach(p => { counts[p.propertyType] = (counts[p.propertyType] || 0) + 1; });
    res.json(counts);
  } catch {
    res.json({});
  }
});

app.get("/api/property/my-properties", authMiddleware, async (req, res) => {
  const properties = await db.collection("properties").find({ "seller._id": req.user.id }).sort({ createdAt: -1 }).toArray();
  res.json({ success: true, properties: properties.map(p => ({ ...p, _id: p._id.toString() })) });
});

app.get("/api/property/seller-stats", authMiddleware, async (req, res) => {
  try {
    const properties = await db.collection("properties").find({ "seller._id": req.user.id }).toArray();
    res.json({
      totalProperties: properties.length,
      activeListings: properties.filter(p => p.status === "sale" || p.status === "rent").length,
      soldProperties: properties.filter(p => p.status === "sold").length,
      totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
    });
  } catch {
    res.json({});
  }
});

app.get("/api/property/:id", async (req, res) => {
  try {
    const property = await db.collection("properties").findOne({ _id: new ObjectId(req.params.id) });
    if (!property) return res.status(404).json({ message: "Not found" });
    await db.collection("properties").updateOne({ _id: new ObjectId(req.params.id) }, { $inc: { views: 1 } });
    property.views = (property.views || 0) + 1;
    res.json({ success: true, property: { ...property, _id: property._id.toString() } });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
});

app.post("/api/property", authMiddleware, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.id) });
    const property = {
      ...req.body,
      seller: { _id: req.user.id, name: user?.name || "Owner" },
      images: [],
      views: 0,
      createdAt: new Date(),
    };
    const result = await db.collection("properties").insertOne(property);
    res.json({ success: true, property: { ...property, _id: result.insertedId.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to create" });
  }
});

app.put("/api/property/:id", authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await db.collection("properties").updateOne({ _id: new ObjectId(req.params.id), "seller._id": req.user.id }, { $set: updates });
    const property = await db.collection("properties").findOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true, property: { ...property, _id: property._id.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to update" });
  }
});

app.delete("/api/property/:id", authMiddleware, async (req, res) => {
  try {
    await db.collection("properties").deleteOne({ _id: new ObjectId(req.params.id), "seller._id": req.user.id });
    res.json({ success: true, message: "Deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete" });
  }
});

// ── Inquiry Routes ──
app.get("/api/inquiry/my-inquiries", authMiddleware, async (req, res) => {
  try {
    const inquiries = await db.collection("inquiries").find({ sellerId: req.user.id }).sort({ createdAt: -1 }).toArray();
    res.json(inquiries.map(i => ({ ...i, _id: i._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/inquiry", authMiddleware, async (req, res) => {
  try {
    const inquiry = { ...req.body, userId: req.user.id, status: "new", createdAt: new Date() };
    const result = await db.collection("inquiries").insertOne(inquiry);
    res.json({ success: true, inquiry: { ...inquiry, _id: result.insertedId.toString() } });
  } catch {
    res.json({ success: false });
  }
});

// ── Wishlist Routes ──
app.get("/api/wishlist", authMiddleware, async (req, res) => {
  try {
    const items = await db.collection("wishlist").find({ userId: req.user.id }).toArray();
    res.json(items.map(i => ({ ...i, _id: i._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/wishlist", authMiddleware, async (req, res) => {
  try {
    const item = { userId: req.user.id, propertyId: req.body.propertyId, createdAt: new Date() };
    await db.collection("wishlist").insertOne(item);
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

app.delete("/api/wishlist/:id", authMiddleware, async (req, res) => {
  try {
    await db.collection("wishlist").deleteOne({ userId: req.user.id, propertyId: req.params.id });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// ── Contact Routes ──
app.post("/api/contact", async (req, res) => {
  try {
    await db.collection("contacts").insertOne({ ...req.body, createdAt: new Date() });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// ── Room Routes ──
app.get("/api/rooms", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.query;
    let filter = {};
    if (propertyId) filter.propertyId = propertyId;
    const rooms = await db.collection("rooms").find(filter).sort({ roomNumber: 1 }).toArray();
    res.json(rooms.map(r => ({ ...r, _id: r._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/rooms", authMiddleware, async (req, res) => {
  try {
    const room = { ...req.body, status: "vacant", createdAt: new Date() };
    const result = await db.collection("rooms").insertOne(room);
    res.json({ success: true, room: { ...room, _id: result.insertedId.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to create room" });
  }
});

app.put("/api/rooms/:id", authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await db.collection("rooms").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to update room" });
  }
});

app.delete("/api/rooms/:id", authMiddleware, async (req, res) => {
  try {
    await db.collection("rooms").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete room" });
  }
});

// ── Tenant Routes ──
app.get("/api/tenants", authMiddleware, async (req, res) => {
  try {
    const { propertyId, status } = req.query;
    let filter = {};
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;
    const tenants = await db.collection("tenants").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(tenants.map(t => ({ ...t, _id: t._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/tenants", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, roomId, propertyId, rentAmount, rentDueDate } = req.body;
    const tenant = {
      name, email: email || "", phone: phone || "",
      roomId, propertyId, rentAmount: parseInt(rentAmount) || 0,
      rentDueDate: rentDueDate || "1",
      checkInDate: new Date(), status: "active",
      documents: [], createdAt: new Date(),
    };
    const result = await db.collection("tenants").insertOne(tenant);
    await db.collection("rooms").updateOne({ _id: new ObjectId(roomId) }, { $set: { status: "occupied" } });
    res.json({ success: true, tenant: { ...tenant, _id: result.insertedId.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to add tenant" });
  }
});

app.put("/api/tenants/:id", authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    if (updates.status === "left") {
      const tenant = await db.collection("tenants").findOne({ _id: new ObjectId(req.params.id) });
      if (tenant?.roomId) {
        await db.collection("rooms").updateOne({ _id: new ObjectId(tenant.roomId) }, { $set: { status: "vacant" } });
      }
    }
    await db.collection("tenants").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to update tenant" });
  }
});

app.delete("/api/tenants/:id", authMiddleware, async (req, res) => {
  try {
    const tenant = await db.collection("tenants").findOne({ _id: new ObjectId(req.params.id) });
    if (tenant?.roomId) {
      await db.collection("rooms").updateOne({ _id: new ObjectId(tenant.roomId) }, { $set: { status: "vacant" } });
    }
    await db.collection("tenants").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete tenant" });
  }
});

// ── Rent / Payment Routes ──
app.get("/api/payments", authMiddleware, async (req, res) => {
  try {
    const { propertyId, tenantId, status } = req.query;
    let filter = {};
    if (propertyId) filter.propertyId = propertyId;
    if (tenantId) filter.tenantId = tenantId;
    if (status) filter.status = status;
    const payments = await db.collection("payments").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(payments.map(p => ({ ...p, _id: p._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/payments", authMiddleware, async (req, res) => {
  try {
    const { tenantId, roomId, propertyId, amount, month, year, dueDate, paymentMethod, notes } = req.body;
    const payment = {
      tenantId, roomId, propertyId,
      amount: parseInt(amount) || 0,
      month: parseInt(month), year: parseInt(year),
      dueDate: dueDate || new Date().toISOString(),
      paidDate: new Date().toISOString(),
      status: "paid",
      paymentMethod: paymentMethod || "cash",
      notes: notes || "", createdAt: new Date(),
    };
    const result = await db.collection("payments").insertOne(payment);
    await db.collection("tenants").updateOne({ _id: new ObjectId(tenantId) }, { $set: { lastPaidDate: new Date() } });
    res.json({ success: true, payment: { ...payment, _id: result.insertedId.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to record payment" });
  }
});

app.get("/api/payments/pending", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.query;
    let tFilter = { status: "active" };
    if (propertyId) tFilter.propertyId = propertyId;
    const tenants = await db.collection("tenants").find(tFilter).toArray();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const pending = [];
    for (const t of tenants) {
      const lastPayment = await db.collection("payments").findOne(
        { tenantId: t._id.toString(), year: currentYear },
        { sort: { month: -1 } }
      );
      const lastPaidMonth = lastPayment?.month || 0;
      for (let m = lastPaidMonth + 1; m <= currentMonth; m++) {
        pending.push({
          tenantId: t._id.toString(), tenantName: t.name, tenantPhone: t.phone,
          roomId: t.roomId, propertyId: t.propertyId,
          amount: t.rentAmount, month: m, year: currentYear,
          dueDate: `${currentYear}-${String(m).padStart(2, "0")}-${String(t.rentDueDate || 1).padStart(2, "0")}`,
        });
      }
    }
    res.json(pending);
  } catch {
    res.json([]);
  }
});

// ── Staff Routes ──
app.get("/api/staff", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.query;
    let filter = {};
    if (propertyId) filter.propertyId = propertyId;
    const staff = await db.collection("staff").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(staff.map(s => ({ ...s, _id: s._id.toString() })));
  } catch {
    res.json([]);
  }
});

app.post("/api/staff", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, role, propertyId, salary } = req.body;
    const member = {
      name, email: email || "", phone: phone || "",
      role: role || "cleaner", propertyId, salary: parseInt(salary) || 0,
      joiningDate: new Date(), status: "active", createdAt: new Date(),
    };
    const result = await db.collection("staff").insertOne(member);
    res.json({ success: true, staff: { ...member, _id: result.insertedId.toString() } });
  } catch {
    res.status(500).json({ message: "Failed to add staff" });
  }
});

app.put("/api/staff/:id", authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    await db.collection("staff").updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to update staff" });
  }
});

app.delete("/api/staff/:id", authMiddleware, async (req, res) => {
  try {
    await db.collection("staff").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete staff" });
  }
});

// ── Reports / Stats Routes ──
app.get("/api/reports/occupancy", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.query;
    let rFilter = {};
    if (propertyId) rFilter.propertyId = propertyId;
    const rooms = await db.collection("rooms").find(rFilter).toArray();
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === "occupied").length;
    const vacant = rooms.filter(r => r.status === "vacant").length;
    const maintenance = rooms.filter(r => r.status === "maintenance").length;
    res.json({ total, occupied, vacant, maintenance, occupancyRate: total ? Math.round((occupied / total) * 100) : 0 });
  } catch {
    res.json({ total: 0, occupied: 0, vacant: 0, maintenance: 0, occupancyRate: 0 });
  }
});

app.get("/api/reports/revenue", authMiddleware, async (req, res) => {
  try {
    const { propertyId, year } = req.query;
    let filter = { status: "paid" };
    if (propertyId) filter.propertyId = propertyId;
    if (year) filter.year = parseInt(year);
    const payments = await db.collection("payments").find(filter).toArray();
    const monthlyData = Array(12).fill(0);
    payments.forEach(p => { if (p.month >= 1 && p.month <= 12) monthlyData[p.month - 1] += p.amount; });
    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = await db.collection("tenants").find({ status: "active", ...(propertyId ? { propertyId } : {}) }).toArray();
    const expectedMonthly = pendingPayments.reduce((s, t) => s + (t.rentAmount || 0), 0);
    res.json({ monthlyData, totalRevenue, expectedMonthly, pendingTenants: pendingPayments.length });
  } catch {
    res.json({ monthlyData: Array(12).fill(0), totalRevenue: 0, expectedMonthly: 0, pendingTenants: 0 });
  }
});

app.get("/api/reports/rent-collection", authMiddleware, async (req, res) => {
  try {
    const { propertyId, month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    let tFilter = { status: "active" };
    if (propertyId) tFilter.propertyId = propertyId;
    const tenants = await db.collection("tenants").find(tFilter).toArray();
    const pFilter = { month: m, year: y };
    if (propertyId) pFilter.propertyId = propertyId;
    const paidPayments = await db.collection("payments").find(pFilter).toArray();
    const paidTenantIds = new Set(paidPayments.map(p => p.tenantId));
    const totalExpected = tenants.reduce((s, t) => s + (t.rentAmount || 0), 0);
    const totalCollected = paidPayments.reduce((s, p) => s + p.amount, 0);
    res.json({
      month: m, year: y, totalTenants: tenants.length,
      paidCount: paidTenantIds.size, unpaidCount: tenants.length - paidTenantIds.size,
      totalExpected, totalCollected, collectionRate: totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0,
      paidTenants: tenants.filter(t => paidTenantIds.has(t._id.toString())).map(t => t.name),
      unpaidTenants: tenants.filter(t => !paidTenantIds.has(t._id.toString())).map(t => ({ name: t.name, phone: t.phone, amount: t.rentAmount })),
    });
  } catch {
    res.json({ totalExpected: 0, totalCollected: 0, collectionRate: 0, paidCount: 0, unpaidCount: 0, paidTenants: [], unpaidTenants: [] });
  }
});

// ── Notifications Route ──
app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const myProperties = await db.collection("properties").find({ seller: req.user.id }).toArray();
    const propertyIds = myProperties.map(p => p._id.toString());
    if (!propertyIds.length) return res.json({ notifications: [], counts: { dueSoon: 0, overdue: 0, vacantRooms: 0 } });

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    const tenants = await db.collection("tenants").find({ propertyId: { $in: propertyIds }, status: "active" }).toArray();

    const paidFilter = { month: currentMonth, year: currentYear, propertyId: { $in: propertyIds } };
    const paidPayments = await db.collection("payments").find(paidFilter).toArray();
    const paidTenantIds = new Set(paidPayments.map(p => p.tenantId));

    const notifications = [];
    let dueSoon = 0, overdue = 0;

    for (const tenant of tenants) {
      const dueDay = parseInt(tenant.rentDueDate) || 1;
      const alreadyPaid = paidTenantIds.has(tenant._id.toString());

      if (alreadyPaid) continue;

      if (dueDay < currentDay) {
        overdue++;
        notifications.push({
          type: "overdue",
          message: `Rent overdue for ${tenant.name} — was due on ${dueDay} of this month`,
          tenantId: tenant._id.toString(),
          propertyId: tenant.propertyId,
          amount: tenant.rentAmount,
          date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`,
        });
      } else if (dueDay - currentDay <= 3) {
        dueSoon++;
        notifications.push({
          type: "due_soon",
          message: `Rent due for ${tenant.name} in ${dueDay - currentDay} day(s) — ${dueDay}/${currentMonth}`,
          tenantId: tenant._id.toString(),
          propertyId: tenant.propertyId,
          amount: tenant.rentAmount,
          date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`,
        });
      }
    }

    const roomsResult = await db.collection("rooms").aggregate([
      { $match: { propertyId: { $in: propertyIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    const vacantRooms = roomsResult.find(r => r._id === "vacant")?.count || 0;

    res.json({
      notifications,
      counts: { dueSoon, overdue, vacantRooms, totalTenants: tenants.length },
    });
  } catch (err) {
    res.json({ notifications: [], counts: { dueSoon: 0, overdue: 0, vacantRooms: 0, totalTenants: 0 } });
  }
});

app.post("/api/notifications/mark-read", authMiddleware, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: "notificationIds array required" });
    }
    const result = await db.collection("notifications").updateMany(
      { _id: { $in: notificationIds.map(id => new ObjectId(id)) }, userId: req.user.id },
      { $set: { read: true } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch {
    res.json({ success: false });
  }
});

// ── Start ──
async function start() {
  await connectDB();

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
start();
