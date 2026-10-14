const SupportChat = require("../../models/usermodels/supportchat");
const User = require("../../models/usermodels/userSignup");
const { sendUserMessageToAdminEmail } = require("../../config/chatmailer");
const escape = require("escape-html");

/**
 * Get chat messages for logged-in user
 */
const getChatMessages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const messages = await SupportChat.find({ userId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark admin messages as read by user
    await SupportChat.updateMany(
      { userId, sender: "admin", readByUser: false },
      { $set: { readByUser: true } }
    );

    return res.json({
      success: true,
      messages: messages.map((m) => ({
        id: m._id,
        sender: m.sender,
        adminName: m.adminName || "Support Specialist",
        message: m.message,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching support chat messages:", err);
    return res.status(500).json({ error: "Failed to load messages" });
  }
};

/**
 * User sends a new message to support
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rawMessage = (req.body.message || "").trim();
    if (!rawMessage) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const newChatMessage = new SupportChat({
      userId,
      sender: "user",
      message: escape(rawMessage),
      readByUser: true,
      readByAdmin: false,
    });

    await newChatMessage.save();

    // Trigger non-blocking email notification to admin
    sendUserMessageToAdminEmail({
      user,
      messageText: rawMessage,
    }).catch((err) => console.error("Error in sendUserMessageToAdminEmail:", err));

    return res.json({
      success: true,
      message: {
        id: newChatMessage._id,
        sender: newChatMessage.sender,
        message: newChatMessage.message,
        createdAt: newChatMessage.createdAt,
      },
    });
  } catch (err) {
    console.error("Error sending user support message:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

/**
 * Get unread messages count for logged-in user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const unreadCount = await SupportChat.countDocuments({
      userId,
      sender: "admin",
      readByUser: false,
    });

    return res.json({ success: true, unreadCount });
  } catch (err) {
    console.error("Error fetching unread chat count:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getChatMessages,
  sendMessage,
  getUnreadCount,
};
