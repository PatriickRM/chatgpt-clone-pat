import { Router } from "express";
import { sendMessage,getMessages } from "../controllers/messageController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.post("/:id/messages", sendMessage);
router.get("/:id/messages", getMessages);

export default router;