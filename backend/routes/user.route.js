import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getUserProfile, followUnfollowUser, getSuggestedUsers, updateUser, getFollowers, getFollowing} from '../controllers/user.controller.js';

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/profile/:username/followers", protectRoute, getFollowers);
router.get("/profile/:username/following", protectRoute, getFollowing);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUser);

export default router;