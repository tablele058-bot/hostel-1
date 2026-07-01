import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { protect } from "../middleware/auth.js";
import { profileUpload } from "../middleware/upload.js";
import { forgotPassword } from "../controllers/auth.controller.js";

const authRouter = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePic: user.profilePic,
        isApproved: user.isApproved,
        isBlocked: user.isBlocked,
        token: generateToken(user._id),
      });
    }

    user = await User.create({
      name: name || "User",
      email: email || `${Date.now()}@user.com`,
      password: password || "password",
      phone: phone || "",
      role: role || "buyer",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: email?.split("@")[0] || "User",
        email: email || `${Date.now()}@user.com`,
        password: password || "password",
        role: "buyer",
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      address: user.address,
      isApproved: user.isApproved,
      isBlocked: user.isBlocked,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.json(null);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.json(user || null);
  } catch (error) {
    res.json(null);
  }
});

authRouter.put("/profile", protect, profileUpload.single("profilePic"), async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (req.file) user.profilePic = req.file.path;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic,
      address: updatedUser.address,
      isApproved: updatedUser.isApproved,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.delete("/profile-pic", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.profilePic = undefined;
    await user.save();
    res.json({ message: "Profile picture removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

authRouter.post("/forgot-password", forgotPassword);

authRouter.put("/reset-password/:token", async (req, res) => {
  try {
    const crypto = await import("crypto");
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful", success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default authRouter;
