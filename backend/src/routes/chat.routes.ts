import { Router } from "express";
import { getChats,createChat,getChat,deleteChat,updateChatTitle } from "../controllers/chatController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getChats);
router.post("/", createChat);
router.get("/:id", getChat);
router.delete("/:id", deleteChat);
router.patch("/:id", updateChatTitle);

export default router;
