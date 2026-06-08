import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";

export const populatePostFields = (query) =>
    query
        .populate({ path: "user", select: "-password" })
        .populate({ path: "comments.user", select: "-password" })
        .populate({
            path: "quotedPost",
            populate: { path: "user", select: "-password" },
        })
        .populate({
            path: "retweetOf",
            populate: [
                { path: "user", select: "-password" },
                {
                    path: "quotedPost",
                    populate: { path: "user", select: "-password" },
                },
            ],
        });

const toPlainPost = (post) => (post?.toObject ? post.toObject() : post);

const enrichPosts = async (posts, userId) => {
    if (!posts?.length) return [];

    const plainPosts = posts.map(toPlainPost);
    const originalIds = plainPosts
        .map((post) => (post.retweetOf?._id || post.retweetOf || post._id))
        .filter(Boolean);

    const [counts, mine] = await Promise.all([
        Post.aggregate([
            { $match: { retweetOf: { $in: originalIds } } },
            { $group: { _id: "$retweetOf", count: { $sum: 1 } } },
        ]),
        userId
            ? Post.find({ user: userId, retweetOf: { $in: originalIds } })
                .select("retweetOf")
                .lean()
            : [],
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const mineSet = new Set(mine.map((m) => m.retweetOf.toString()));

    return plainPosts.map((post) => {
        const originalId = (post.retweetOf?._id || post.retweetOf || post._id).toString();
        const retweetMeta = {
            retweetCount: countMap[originalId] || 0,
            retweetedByMe: mineSet.has(originalId),
        };

        if (post.retweetOf) {
            return {
                ...post,
                ...retweetMeta,
                retweetOf: { ...post.retweetOf, ...retweetMeta },
            };
        }

        return { ...post, ...retweetMeta };
    });
};

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;

const parsePagination = (req) => {
    const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE
    );
    return { limit, cursor: req.query.cursor || null };
};

const buildCursor = (post, effectiveDate) => {
    const date = effectiveDate || post.createdAt;
    return `${new Date(date).toISOString()}_${post._id}`;
};

const paginateSortedPosts = (posts, limit, cursor, getEffectiveTime) => {
    let start = 0;
    if (cursor) {
        const [cursorDate, cursorId] = cursor.split("_");
        const idx = posts.findIndex((post) => {
            const time = getEffectiveTime(post);
            return (
                new Date(time).toISOString() === cursorDate &&
                post._id.toString() === cursorId
            );
        });
        start = idx >= 0 ? idx + 1 : 0;
    }

    const slice = posts.slice(start, start + limit + 1);
    const hasMore = slice.length > limit;
    const page = hasMore ? slice.slice(0, limit) : slice;
    const nextCursor =
        hasMore && page.length
            ? buildCursor(page[page.length - 1], getEffectiveTime(page[page.length - 1]))
            : null;

    return { page, nextCursor };
};

export const createPost = async (req, res) => {
    try {
        const { text, quotedPostId } = req.body;
        let { img } = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!text && !img && !quotedPostId) {
            return res.status(400).json({ message: "Post cannot be empty" });
        }

        if (quotedPostId) {
            const quoted = await Post.findById(quotedPostId);
            if (!quoted) {
                return res.status(404).json({ message: "Quoted post not found" });
            }
        }

        if (img) {
            const uploadResult = await cloudinary.uploader.upload(img);
            img = uploadResult.secure_url;
        }

        const newPost = new Post({
            user: userId,
            text,
            img,
            ...(quotedPostId && { quotedPost: quotedPostId }),
        });

        await newPost.save();

        if (quotedPostId) {
            const quoted = await Post.findById(quotedPostId);
            if (quoted && userId !== quoted.user.toString()) {
                await Notification.create({
                    from: userId,
                    to: quoted.user,
                    type: "quote",
                });
            }
        }

        const post = await populatePostFields(Post.findById(newPost._id));

        res.status(201).json({ message: "Post created successfully", post });
    } catch (error) {
        console.log("Error in createPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this post" });
        }
        if(post.img) {
            const imgId = post.img.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }
        await Post.deleteMany({ $or: [{ retweetOf: req.params.id }, { quotedPost: req.params.id }] });
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        console.log("Error in deletePost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id.toString();

        if (!text) {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = {
            user: userId,
            text,
        };

        post.comments.push(comment);
        await post.save();

        if (userId.toString() !== post.user.toString()) {
            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "comment"
            });
            await notification.save();
        }

        const updatedPost = await Post.findById(postId).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(updatedPost.comments);
    } catch (error) {
        console.log("Error in commentOnPost controller:", error);
        res.status(500).json({ message: "Internal server error" }); 
    }
}


export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userLikedPost = post.likes.some(id => id.toString() === userId.toString());

        if (userLikedPost) {
            // Unlike the post
            await post.updateOne({ $pull: { likes: userId } });
            await User.updateOne({_id: post.user}, { $pull: { likedPosts: postId } });
            await Notification.deleteOne({ from: userId, to: post.user, type: "like" });

            const updatedLikes = post.likes.filter(id => id.toString() !== userId.toString());

            return res.status(200).json(updatedLikes);
        } else {
            // Like the post
            post.likes.push(userId);
            await User.updateOne({_id: post.user}, { $push: { likedPosts: postId } });
            await post.save();

            if (userId.toString() !== post.user.toString()) {
                const notification = new Notification({
                    from: userId,
                    to: post.user,
                    type: "like"
                });
                await notification.save();
            }
            const updatedLikes = post.likes.map(id => id.toString());
            return res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const { limit, cursor } = parsePagination(req);

        let filter = {};
        if (cursor) {
            const [cursorDate, cursorId] = cursor.split("_");
            filter = {
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
                ],
            };
        }

        const posts = await populatePostFields(
            Post.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1)
        );

        const hasMore = posts.length > limit;
        const page = hasMore ? posts.slice(0, limit) : posts;
        const nextCursor = hasMore && page.length ? buildCursor(page[page.length - 1]) : null;
        const enriched = await enrichPosts(page, req.user._id);

        res.status(200).json({ posts: enriched, nextCursor });
    } catch (error) {
        console.log("Error in getAllPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);

        if(!user) return res.status(404).json({ message: "User not found" });

        const likedPosts = await populatePostFields(Post.find({ _id: { $in: user.likedPosts } }));
        const enriched = await enrichPosts(likedPosts, req.user?._id);

        res.status(200).json({ likedPosts: enriched });

    } catch (error) {
        console.log("Error in getLikedPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if(!user) return res.status(404).json({ message: "User not found" });
        
        const following = user.following;
        const { limit, cursor } = parsePagination(req);

        let filter = { user: { $in: following } };
        if (cursor) {
            const [cursorDate, cursorId] = cursor.split("_");
            filter = {
                user: { $in: following },
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
                ],
            };
        }

        const followingPosts = await populatePostFields(
            Post.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1)
        );

        const hasMore = followingPosts.length > limit;
        const page = hasMore ? followingPosts.slice(0, limit) : followingPosts;
        const nextCursor = hasMore && page.length ? buildCursor(page[page.length - 1]) : null;
        const enriched = await enrichPosts(page, req.user._id);

        res.status(200).json({ followingPosts: enriched, nextCursor });
    } catch (error) {
        console.log("Error in getFollowingPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserReplies = async (req, res) => {
    const username = req.params.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const posts = await Post.find({ "comments.user": user._id })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })
            .lean();

        const userReplies = [];

        posts.forEach((post) => {
            post.comments.forEach((comment) => {
                const commentUserId = comment.user?._id?.toString() || comment.user?.toString();
                if (commentUserId === user._id.toString()) {
                    userReplies.push({
                        _id: comment._id,
                        text: comment.text,
                        user: comment.user,
                        parentPost: {
                            _id: post._id,
                            user: post.user,
                            text: post.text,
                        },
                    });
                }
            });
        });

        userReplies.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));

        res.status(200).json({ userReplies });
    } catch (error) {
        console.log("Error in getUserReplies controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserPosts = async (req, res) => {
    const username = req.params.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userPosts = await populatePostFields(
            Post.find({ user: user._id }).sort({ createdAt: -1 })
        );

        const pinnedId = user.pinnedPost?.toString();
        const sorted = [...userPosts].sort((a, b) => {
            if (pinnedId) {
                const aOriginal = (a.retweetOf?._id || a._id).toString();
                const bOriginal = (b.retweetOf?._id || b._id).toString();
                if (aOriginal === pinnedId || a._id.toString() === pinnedId) return -1;
                if (bOriginal === pinnedId || b._id.toString() === pinnedId) return 1;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const enriched = await enrichPosts(sorted, req.user._id);
        res.status(200).json({ userPosts: enriched });
    } catch (error) {
        console.log("Error in getUserPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserMedia = async (req, res) => {
    const username = req.params.username;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const mediaPosts = await populatePostFields(
            Post.find({
                user: user._id,
                retweetOf: null,
                img: { $exists: true, $ne: "" },
            }).sort({ createdAt: -1 })
        ).lean();

        res.status(200).json({ mediaPosts });
    } catch (error) {
        console.log("Error in getUserMedia controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const post = await populatePostFields(Post.findById(req.params.id));

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const [enriched] = await enrichPosts([post], req.user._id);
        res.status(200).json({ post: enriched });
    } catch (error) {
        console.log("Error in getPostById controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const bookmarkPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const user = await User.findById(userId);
        const isBookmarked = user.bookmarkedPosts.some(id => id.toString() === postId);

        if (isBookmarked) {
            await User.findByIdAndUpdate(userId, { $pull: { bookmarkedPosts: postId } });
            return res.status(200).json({ bookmarked: false });
        }

        await User.findByIdAndUpdate(userId, { $push: { bookmarkedPosts: postId } });
        return res.status(200).json({ bookmarked: true });
    } catch (error) {
        console.log("Error in bookmarkPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBookmarkedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const bookmarkedPosts = await populatePostFields(
            Post.find({ _id: { $in: user.bookmarkedPosts } })
        ).lean();

        bookmarkedPosts.sort((a, b) => {
            const aIndex = user.bookmarkedPosts.findIndex(id => id.toString() === a._id.toString());
            const bIndex = user.bookmarkedPosts.findIndex(id => id.toString() === b._id.toString());
            return bIndex - aIndex;
        });

        const enriched = await enrichPosts(bookmarkedPosts, req.user._id);
        res.status(200).json({ bookmarkedPosts: enriched });
    } catch (error) {
        console.log("Error in getBookmarkedPosts controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPostLikers = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate({
            path: "likes",
            select: "-password",
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json({ likers: post.likes });
    } catch (error) {
        console.log("Error in getPostLikers controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const pinPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only pin your own posts" });
        }

        await User.findByIdAndUpdate(userId, { pinnedPost: postId });
        res.status(200).json({ message: "Post pinned", pinnedPost: postId });
    } catch (error) {
        console.log("Error in pinPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const unpinPost = async (req, res) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndUpdate(userId, { pinnedPost: null });
        res.status(200).json({ message: "Post unpinned" });
    } catch (error) {
        console.log("Error in unpinPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const retweetPost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        let original = await Post.findById(postId);
        if (!original) return res.status(404).json({ message: "Post not found" });
        if (original.retweetOf) {
            original = await Post.findById(original.retweetOf);
            if (!original) return res.status(404).json({ message: "Original post not found" });
        }

        const originalId = original._id;
        const existing = await Post.findOne({ user: userId, retweetOf: originalId });

        if (existing) {
            await Post.findByIdAndDelete(existing._id);
            await Notification.deleteOne({ from: userId, to: original.user, type: "retweet" });
            const retweetCount = await Post.countDocuments({ retweetOf: originalId });
            return res.status(200).json({
                retweeted: false,
                retweetCount,
                retweetedByMe: false,
            });
        }

        await Post.create({ user: userId, retweetOf: originalId });

        if (userId.toString() !== original.user.toString()) {
            await Notification.create({
                from: userId,
                to: original.user,
                type: "retweet",
            });
        }

        const retweetCount = await Post.countDocuments({ retweetOf: originalId });
        return res.status(200).json({
            retweeted: true,
            retweetCount,
            retweetedByMe: true,
        });
    } catch (error) {
        console.log("Error in retweetPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editPost = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: "Post not found" });
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only edit your own posts" });
        }
        if (post.retweetOf) {
            return res.status(400).json({ message: "Retweets cannot be edited" });
        }
        if (!text?.trim()) {
            return res.status(400).json({ message: "Post text cannot be empty" });
        }
        if (text.trim().length > 280) {
            return res.status(400).json({ message: "Post cannot exceed 280 characters" });
        }

        post.text = text.trim();
        post.editedAt = new Date();
        await post.save();

        const populated = await populatePostFields(Post.findById(post._id));
        const [enriched] = await enrichPosts([populated], req.user._id);
        res.status(200).json({ post: enriched });
    } catch (error) {
        console.log("Error in editPost controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};