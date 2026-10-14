const User = require("../../models/usermodels/userSignup");
const SupportChat = require("../../models/usermodels/supportchat");
const KYC = require("../../models/usermodels/kyc");
const { getUserCurrency, getCurrencySymbol, formatUserBalance } = require("../../utils/currencyHelper");
const { sendAdminMessageEmail } = require("../../config/chatmailer");
const escape = require("escape-html");

/**
 * Render Admin Support Chat View
 */
const getSupportChatView = async (req, res) => {
  try {
    res.render("admin/support-chat", {
      admin: req.session.admin,
    });
  } catch (err) {
    console.error("Error rendering support chat view:", err);
    res.status(500).send("Server error");
  }
};

/**
 * Get all conversations with user metadata, last message, and unread counts
 * Fetches ALL users regardless of role definition
 */
const getSupportChatConversations = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("Name Email AccountBalance AccountNumber status currency createdAt")
      .lean();

    const userIds = users.map((u) => u._id);
    const kycs = await KYC.find({ userId: { $in: userIds } }).lean();
    const kycMap = new Map();
    kycs.forEach((k) => kycMap.set(String(k.userId), k));

    const conversations = await Promise.all(
      users.map(async (user) => {
        const [lastMessage, unreadCount] = await Promise.all([
          SupportChat.findOne({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean(),
          SupportChat.countDocuments({
            userId: user._id,
            sender: "user",
            readByAdmin: false,
          }),
        ]);

        const userKyc = kycMap.get(String(user._id)) || null;
        const currencyCode = getUserCurrency(user, userKyc);
        const currencySymbol = getCurrencySymbol(currencyCode);
        const formattedBalance = formatUserBalance(user.AccountBalance || 0, currencyCode);

        return {
          user: {
            ...user,
            currencyCode,
            currencySymbol,
            formattedBalance,
          },
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                sender: lastMessage.sender,
                createdAt: lastMessage.createdAt,
              }
            : null,
          unreadCount,
          lastActivity: lastMessage
            ? new Date(lastMessage.createdAt).getTime()
            : (user.createdAt ? new Date(user.createdAt).getTime() : 0),
        };
      })
    );

    conversations.sort((a, b) => {
      // Prioritize unread messages
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      // Then sort by latest activity
      if (b.lastActivity !== a.lastActivity) {
        return b.lastActivity - a.lastActivity;
      }
      return (a.user.Name || "").localeCompare(b.user.Name || "");
    });

    return res.json({ success: true, conversations });
  } catch (err) {
    console.error("Error getting support chat conversations:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get messages for a specific user and mark as read by admin
 */
const getSupportChatUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await SupportChat.find({ userId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark as read by admin
    await SupportChat.updateMany(
      { userId, sender: "user", readByAdmin: false },
      { $set: { readByAdmin: true } }
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
    console.error("Error getting user support messages:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Send admin reply to a user
 */
const sendAdminSupportChatMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const rawMessage = (req.body.message || "").trim();

    if (!rawMessage) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const adminName = req.session.admin?.name || "Support Specialist";
    const adminId = req.session.admin?.id || null;

    const newChatMessage = new SupportChat({
      userId,
      sender: "admin",
      adminId,
      adminName,
      message: escape(rawMessage),
      readByUser: false,
      readByAdmin: true,
    });

    await newChatMessage.save();

    // Send email alert to user (non-blocking)
    sendAdminMessageEmail({
      user,
      messageText: rawMessage,
      adminName,
    }).catch((err) => console.error("Error sending admin chat email to user:", err));

    return res.json({
      success: true,
      message: {
        id: newChatMessage._id,
        sender: newChatMessage.sender,
        adminName: newChatMessage.adminName,
        message: newChatMessage.message,
        createdAt: newChatMessage.createdAt,
      },
    });
  } catch (err) {
    console.error("Error sending admin support message:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getSupportChatView,
  getSupportChatConversations,
  getSupportChatUserMessages,
  sendAdminSupportChatMessage,
};
