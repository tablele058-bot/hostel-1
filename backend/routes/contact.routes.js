import express from "express";
import Contact from "../models/contact.model.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const contactRouter = express.Router();

contactRouter.post("/", async (req, res) => {
  try {
    const { name, email, phone, role, message } = req.body;

    const contact = await Contact.create({ name, email, phone, role, message });

    const adminEmail = process.env.EMAIL_USER;
    if (adminEmail) {
      const adminMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <h2 style="color: #0d9488;">New Contact Request</h2>
          <p>You have received a new message from the platform.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>Role:</strong> ${role}</p>
            <p style="margin-top: 15px;"><strong>Message:</strong></p>
            <p style="font-style: italic; color: #475569;">"${message}"</p>
          </div>
        </div>
      `;

      try {
        await sendEmail({
          email: adminEmail,
          subject: "New Contact Request - Real Estate Platform",
          message: adminMessage,
        });
      } catch (emailErr) {
        console.error("Failed to notify admin:", emailErr.message);
      }
    }

    res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

contactRouter.get("/", protect, adminOnly, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

contactRouter.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default contactRouter;
