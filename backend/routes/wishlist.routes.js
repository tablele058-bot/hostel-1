import express from "express";
import Wishlist from "../models/wishlist.model.js";
import { protect } from "../middleware/auth.js";

const wishlistRouter = express.Router();

wishlistRouter.get("/", protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: "properties",
        populate: { path: "seller", select: "name email" },
      });

    res.json({
      success: true,
      items: wishlist ? wishlist.properties : [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

wishlistRouter.post("/:propertyId", protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        properties: [req.params.propertyId],
      });
    } else {
      if (!wishlist.properties.includes(req.params.propertyId)) {
        wishlist.properties.push(req.params.propertyId);
        await wishlist.save();
      }
    }
    res.json({ success: true, message: "Added to wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

wishlistRouter.delete("/:propertyId", protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.properties = wishlist.properties.filter(
        (p) => p.toString() !== req.params.propertyId
      );
      await wishlist.save();
    }
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

wishlistRouter.get("/check/:propertyId", protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const isWishlisted = wishlist
      ? wishlist.properties.includes(req.params.propertyId)
      : false;
    res.json({ success: true, isWishlisted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default wishlistRouter;
