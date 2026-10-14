const express = require("express");
const router = express.Router();
const {
  getChatMessages,
  sendMessage,
  getUnreadCount,
} = require("../../controllers/usercontrollers/supportchatcontroller");

// Middleware to ensure user is authenticated
const requireUserAuth = (req, res, next) => {
  const userId = req.session?.user?.id || req.user?._id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Please log in" });
  }
  if (!req.user) {
    req.user = { _id: userId, id: userId, ...req.session.user };
  }
  next();
};

router.get("/messages", requireUserAuth, getChatMessages);
router.post("/send", requireUserAuth, sendMessage);
router.get("/unread-count", requireUserAuth, getUnreadCount);

module.exports = router;
