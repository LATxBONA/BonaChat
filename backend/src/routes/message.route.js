import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessagesCount,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// add isRead
router.get("/unread-count", protectRoute, getUnreadMessagesCount);
router.put("/mark-read", protectRoute, markMessagesAsRead);

router.get("/:id", protectRoute, getMessages);

router.delete("/:messageId", protectRoute, deleteMessage);
router.post("/send/:id", protectRoute, sendMessage);

export default router;
