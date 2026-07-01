import express from "express";
import Property from "../models/property.model.js";
import { upload } from "../middleware/upload.js";
import {
  getAllProperties,
  updateProperty,
} from "../controllers/property.controller.js";

const propertyRouter = express.Router();

propertyRouter.get("/", getAllProperties);

propertyRouter.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("seller", "name email phone profilePic");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    property.views += 1;
    await property.save();

    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

propertyRouter.post("/", upload.array("images", 10), async (req, res) => {
  try {
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "properties");
        imageUrls.push(result.secure_url);
      }
    }

    const property = await Property.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      city: req.body.city,
      area: req.body.area,
      pincode: req.body.pincode,
      propertyType: req.body.propertyType,
      bhk: req.body.bhk ? String(req.body.bhk) : undefined,
      bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
      areaSize: req.body.areaSize ? Number(req.body.areaSize) : undefined,
      furnishing: req.body.furnishing,
      status: req.body.status || "sale",
      images: imageUrls,
      amenities: req.body.amenities
        ? Array.isArray(req.body.amenities)
          ? req.body.amenities
          : (() => {
              try {
                return JSON.parse(req.body.amenities);
              } catch (e) {
                return req.body.amenities.split(",");
              }
            })()
        : [],
    });

    res.status(201).json({ success: true, property });
  } catch (error) {
    console.error("ADD_PROPERTY_ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error while adding property",
    });
  }
});

propertyRouter.put("/:id", upload.array("images", 10), updateProperty);

propertyRouter.patch("/:id/status", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    property.status = req.body.status;
    await property.save();
    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

propertyRouter.delete("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }
    await property.deleteOne();
    res.json({ success: true, message: "Property deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

propertyRouter.get("/stats/counts", async (req, res) => {
  try {
    const counts = await Property.aggregate([
      { $match: { status: "sale" } },
      { $group: { _id: "$propertyType", count: { $sum: 1 } } },
    ]);
    const formattedCounts = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    res.json({ success: true, counts: formattedCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

propertyRouter.get("/all", async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default propertyRouter;
