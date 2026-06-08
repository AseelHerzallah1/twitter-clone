import Post from "../../models/post.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { populatePostFields } from "../../controllers/post.controller.js";

export const NEST_TOOL_DEFINITIONS = [
	{
		type: "function",
		function: {
			name: "search_posts",
			description: "Search posts by keyword or hashtag in post text.",
			parameters: {
				type: "object",
				properties: {
					query: { type: "string", description: "Search term or hashtag (with or without #)" },
				},
				required: ["query"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "search_users",
			description: "Search users by username or display name.",
			parameters: {
				type: "object",
				properties: {
					query: { type: "string", description: "Username or name fragment" },
				},
				required: ["query"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "get_trends",
			description: "Get trending hashtags from recent posts in the app.",
			parameters: { type: "object", properties: {} },
		},
	},
	{
		type: "function",
		function: {
			name: "get_notifications_summary",
			description: "Get a summary of the current user's recent notifications.",
			parameters: { type: "object", properties: {} },
		},
	},
	{
		type: "function",
		function: {
			name: "get_post_thread",
			description: "Get a post and its replies/comments by post ID.",
			parameters: {
				type: "object",
				properties: {
					postId: { type: "string", description: "MongoDB post ID" },
				},
				required: ["postId"],
			},
		},
	},
	{
		type: "function",
		function: {
			name: "draft_tweet",
			description: "Return a tweet draft for the user (max 280 chars). Call when user wants help writing a tweet.",
			parameters: {
				type: "object",
				properties: {
					topic: { type: "string", description: "What the tweet should be about" },
					tone: { type: "string", description: "Optional tone: casual, professional, funny, etc." },
				},
				required: ["topic"],
			},
		},
	},
];

const extractHashtags = (posts) => {
	const counts = {};
	posts.forEach((post) => {
		const tags = post.text?.match(/#\w+/gi) || [];
		tags.forEach((tag) => {
			const key = tag.toLowerCase();
			counts[key] = (counts[key] || 0) + 1;
		});
	});
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([tag, count]) => ({ tag, count }));
};

export const executeNestTool = async (name, args, userId) => {
	switch (name) {
		case "search_posts": {
			const q = args.query?.trim();
			if (!q) return { summary: "No query provided", posts: [] };
			const term = q.startsWith("#") ? q.slice(1) : q;
			const query = q.startsWith("#")
				? { text: { $regex: `#${term}\\b`, $options: "i" } }
				: { text: { $regex: term, $options: "i" } };
			const posts = await populatePostFields(
				Post.find(query).sort({ createdAt: -1 }).limit(8)
			).lean();
			return {
				summary: `Found ${posts.length} post(s) matching "${q}"`,
				posts: posts.map((p) => ({
					id: p._id,
					author: p.user?.username,
					text: p.text?.slice(0, 280),
					likes: p.likes?.length || 0,
					comments: p.comments?.length || 0,
				})),
			};
		}
		case "search_users": {
			const q = args.query?.trim();
			const users = await User.find({
				$or: [
					{ username: { $regex: q, $options: "i" } },
					{ fullName: { $regex: q, $options: "i" } },
				],
			})
				.select("username fullName bio")
				.limit(8)
				.lean();
			return {
				summary: `Found ${users.length} user(s) matching "${q}"`,
				users: users.map((u) => ({
					username: u.username,
					fullName: u.fullName,
					bio: u.bio?.slice(0, 120),
				})),
			};
		}
		case "get_trends": {
			const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const posts = await Post.find({
				createdAt: { $gte: weekAgo },
				text: { $regex: /#\w+/, $options: "i" },
			})
				.select("text")
				.limit(300)
				.lean();
			const trends = extractHashtags(posts);
			return {
				summary: trends.length ? `${trends.length} trending hashtag(s)` : "No trends yet — try posting with hashtags!",
				trends,
			};
		}
		case "get_notifications_summary": {
			const notifications = await Notification.find({ to: userId })
				.populate({ path: "from", select: "username fullName" })
				.sort({ createdAt: -1 })
				.limit(15)
				.lean();
			return {
				summary: `${notifications.length} recent notification(s)`,
				notifications: notifications.map((n) => ({
					type: n.type,
					from: n.from?.username,
					name: n.from?.fullName,
					read: n.read,
					when: n.createdAt,
				})),
			};
		}
		case "get_post_thread": {
			const post = await populatePostFields(Post.findById(args.postId)).lean();
			if (!post) return { summary: "Post not found", post: null };
			return {
				summary: `Thread by @${post.user?.username} with ${post.comments?.length || 0} replies`,
				post: {
					id: post._id,
					author: post.user?.username,
					text: post.text,
					likes: post.likes?.length || 0,
					comments: (post.comments || []).map((c) => ({
						author: c.user?.username,
						text: c.text,
					})),
				},
			};
		}
		case "draft_tweet": {
			const topic = args.topic || "something interesting";
			const tone = args.tone || "casual";
			return {
				summary: `Draft requested about: ${topic}`,
				topic,
				tone,
				hint: "Compose a single tweet under 280 characters based on this topic and tone.",
			};
		}
		default:
			return { summary: "Unknown tool", error: true };
	}
};
