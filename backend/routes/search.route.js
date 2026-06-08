import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { searchAll, getTrends } from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", protectRoute, searchAll);
router.get("/trends", protectRoute, getTrends);

export default router;
