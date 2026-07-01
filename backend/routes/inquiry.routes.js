import express from "express";
import Inquiry from "../models/inquiry.model.js";
import { protect } from "../middleware/auth.js";

const inquiryRouter = express.Router();

inquiryRouter.post("/", protect, async (req, res) => {
  try {
    const { propertyId, sellerId, message } = req.body;

    const inquiry = await Inquiry.create({
      property: propertyId,
      buyer: req.user._id,
      seller: sellerId,
      message,
    });

    res.status(201).json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

inquiryRouter.get("/my", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ buyer: req.user._id })
      .populate("property", "title price images city area")
      .populate("seller", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

inquiryRouter.get("/received", protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ seller: req.user._id })
      .populate("property", "title price images city area")
      .populate("buyer", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

inquiryRouter.patch("/:id/read", protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default inquiryRouter;
