import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { populatePostFields } from "./post.controller.js";
import { STARTER_TRENDS } from "../constants/starterTrends.js";
import { escapeRegex, extractHashtags } from "../lib/utils/hashtag.js";

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
            ? { text: { $regex: `#${escapeRegex(searchTerm)}`, $options: "i" } }
            : { text: { $regex: escapeRegex(searchTerm), $options: "i" } };

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
        const TREND_LIMIT = 5;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const posts = await Post.find({
            createdAt: { $gte: weekAgo },
            text: { $regex: /#/, $options: "i" },
            $or: [{ replyTo: { $exists: false } }, { replyTo: null }],
        })
            .select("text likes comments")
            .limit(500)
            .lean();

        if (!posts.length) {
            return res.status(200).json({ trends: STARTER_TRENDS });
        }

        const postIds = posts.map((post) => post._id);
        const retweetCounts = await Post.aggregate([
            { $match: { retweetOf: { $in: postIds } } },
            { $group: { _id: "$retweetOf", count: { $sum: 1 } } },
        ]);
        const retweetMap = Object.fromEntries(
            retweetCounts.map((row) => [row._id.toString(), row.count])
        );

        const stats = {};

        posts.forEach((post) => {
            const tags = extractHashtags(post.text);
            const likes = post.likes?.length || 0;
            const comments = post.comments?.length || 0;
            const retweets = retweetMap[post._id.toString()] || 0;
            const engagement = likes + comments * 2 + retweets * 2;

            tags.forEach((tag) => {
                const key = tag.toLowerCase();

                if (!stats[key]) {
                    stats[key] = { tag, count: 0, score: 0 };
                }

                stats[key].count += 1;
                stats[key].score += engagement + 1;
            });
        });

        const trends = Object.values(stats)
            .sort((a, b) => b.score - a.score || b.count - a.count)
            .slice(0, TREND_LIMIT)
            .map(({ tag, count }) => ({ tag, count }));

        res.status(200).json({ trends: trends.length ? trends : STARTER_TRENDS });
    } catch (error) {
        console.log("Error in getTrends controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
