import express from "express";
import Chat from "../models/chat.model.js";
import { protect } from "../middleware/auth.js";

const chatRouter = express.Router();

chatRouter.get("/", protect, async (req, res) => {
  try {
    let chats;
    if (req.user.role === "seller") {
      chats = await Chat.find({ seller: req.user._id })
        .populate("buyer", "name email profilePic")
        .populate("seller", "name email profilePic")
        .populate("property", "title price images")
        .sort({ updatedAt: -1 });
    } else {
      chats = await Chat.find({ buyer: req.user._id })
        .populate("buyer", "name email profilePic")
        .populate("seller", "name email profilePic")
        .populate("property", "title price images")
        .sort({ updatedAt: -1 });
    }
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching chats", error: err.message });
  }
});

chatRouter.post("/start", protect, async (req, res) => {
  try {
    const { propertyId, sellerId, buyerId: providedBuyerId } = req.body;
    let buyerId, finalSellerId;

    if (req.user.role === "seller") {
      buyerId = providedBuyerId;
      finalSellerId = req.user._id;
    } else {
      buyerId = req.user._id;
      finalSellerId = sellerId;
    }

    if (!buyerId || !finalSellerId) {
      return res.status(400).json({ message: "Missing buyer or seller ID" });
    }

    let chat = await Chat.findOne({
      buyer: buyerId,
      seller: finalSellerId,
    });

    if (!chat) {
      chat = await Chat.create({
        property: propertyId,
        buyer: buyerId,
        seller: finalSellerId,
        messages: [],
      });
    }

    chat = await Chat.findById(chat._id)
      .populate("buyer", "name email profilePic")
      .populate("seller", "name email profilePic")
      .populate("property", "title price images");

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: "Error creating or getting chat", error: err.message });
  }
});

chatRouter.post("/:chatId/messages", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages.push({
      sender: req.user._id,
      text: req.body.text,
      image: req.body.image || undefined,
    });

    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: "Error sending message", error: err.message });
  }
});

chatRouter.delete("/:chatId/messages/:messageId", protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages = chat.messages.filter(
      (msg) => msg._id.toString() !== req.params.messageId
    );
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: "Error deleting message", error: err.message });
  }
});

chatRouter.delete("/:chatId", protect, async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({ message: "Chat deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting chat", error: err.message });
  }
});

export default chatRouter;
