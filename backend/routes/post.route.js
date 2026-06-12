import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';

import { createPost, deletePost, commentOnPost, editComment, deleteComment, likeUnlikeComment, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts, getUserReplies, getUserMedia, getPostLikers, pinPost, unpinPost, retweetPost, editPost, getPostById, bookmarkPost, getBookmarkedPosts } from '../controllers/post.controller.js';


const router = express.Router();
router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/bookmarks", protectRoute, getBookmarkedPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.get("/replies/:username", protectRoute, getUserReplies);
router.get("/media/:username", protectRoute, getUserMedia);
router.get("/:id/likers", protectRoute, getPostLikers);
router.get("/:id", protectRoute, getPostById);
router.post("/pin/:id", protectRoute, pinPost);
router.delete("/pin", protectRoute, unpinPost);
router.post("/create", protectRoute, createPost);
router.put("/:id", protectRoute, editPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/retweet/:id", protectRoute, retweetPost);
router.post("/bookmark/:id", protectRoute, bookmarkPost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.put("/:id/comments/:commentId", protectRoute, editComment);
router.delete("/:id/comments/:commentId", protectRoute, deleteComment);
router.post("/:id/comments/:commentId/like", protectRoute, likeUnlikeComment);
router.delete("/:id", protectRoute, deletePost);

export default router;
