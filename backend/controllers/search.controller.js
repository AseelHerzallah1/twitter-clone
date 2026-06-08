import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { populatePostFields } from "./post.controller.js";
import { STARTER_TRENDS } from "../constants/starterTrends.js";

export const searchAll = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) {
            return res.status(200).json({ users: [], posts: [] });
        }

        const suggest = req.query.suggest === "1";
        const userLimit = suggest ? 5 : 10;
        const postLimit = suggest ? 3 : 20;

        const searchTerm = q.startsWith("#") ? q.slice(1) : q;

        const users = await User.find({
            $or: [
                { username: { $regex: searchTerm, $options: "i" } },
                { fullName: { $regex: searchTerm, $options: "i" } },
            ],
        }).select("-password").limit(userLimit);

        const postQuery = q.startsWith("#")
            ? { text: { $regex: `#${searchTerm}\\b`, $options: "i" } }
            : { text: { $regex: searchTerm, $options: "i" } };

        const posts = await populatePostFields(
            Post.find(postQuery).sort({ createdAt: -1 }).limit(postLimit)
        );

        res.status(200).json({ users, posts });
    } catch (error) {
        console.log("Error in searchAll controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTrends = async (req, res) => {
    try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const posts = await Post.find({
            createdAt: { $gte: weekAgo },
            text: { $regex: /#\w+/, $options: "i" },
        }).select("text").limit(500).lean();

        const counts = {};
        posts.forEach((post) => {
            const tags = post.text?.match(/#\w+/gi) || [];
            tags.forEach((tag) => {
                const key = tag.toLowerCase();
                counts[key] = (counts[key] || 0) + 1;
            });
        });

        const trends = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        res.status(200).json({ trends: trends.length ? trends : STARTER_TRENDS });
    } catch (error) {
        console.log("Error in getTrends controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
