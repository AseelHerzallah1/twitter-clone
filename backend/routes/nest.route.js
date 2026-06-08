import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getNestStatus, nestChat } from "../controllers/nest.controller.js";

const router = express.Router();

router.get("/status", protectRoute, getNestStatus);
router.post("/chat", protectRoute, nestChat);

export default router;
