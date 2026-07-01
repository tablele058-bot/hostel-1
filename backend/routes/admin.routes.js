import express from "express";
import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import Inquiry from "../models/inquiry.model.js";
import Contact from "../models/contact.model.js";
import { protect, adminOnly } from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    const activeListings = await Property.countDocuments({ status: "sale" });
    const soldProperties = await Property.countDocuments({ status: "sold" });
    const totalInquiries = await Inquiry.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const pendingApprovals = await User.countDocuments({ isApproved: false, role: "seller" });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        activeListings,
        soldProperties,
        totalInquiries,
        totalContacts,
        pendingApprovals,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.patch("/users/:id/toggle-block", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? "blocked" : "unblocked"}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.get("/properties", protect, adminOnly, async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.delete("/properties/:id", protect, adminOnly, async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.get("/seller-requests", protect, adminOnly, async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller", isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, sellers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.patch("/seller-requests/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isApproved = true;
    await user.save();
    res.json({ success: true, message: "Seller approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.get("/contacts", protect, adminOnly, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.delete("/contacts/:id", protect, adminOnly, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

adminRouter.get("/inquiries", protect, adminOnly, async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("property", "title price")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default adminRouter;
