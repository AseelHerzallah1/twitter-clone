import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";
import { restoreLegacyReplies, findEmbeddedComment } from "../lib/utils/restoreLegacyReplies.js";

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

const excludeReplyPosts = {
    $or: [{ replyTo: { $exists: false } }, { replyTo: null }],
};

const feedFilter = (extra = {}) => {
    const { $or: cursorOr, ...rest } = extra;
    if (!cursorOr) {
        return { ...rest, ...excludeReplyPosts };
    }
    return {
        ...rest,
        $and: [excludeReplyPosts, { $or: cursorOr }],
    };
};

const enrichPosts = async (posts, userId) => {
    if (!posts?.length) return [];

    const plainPosts = posts.map(toPlainPost);
    const originalIds = plainPosts
        .map((post) => (post.retweetOf?._id || post.retweetOf || post._id))
        .filter(Boolean);
    const postIds = plainPosts.map((post) => post._id).filter(Boolean);

    const [counts, mine, orphanCounts] = await Promise.all([
        Post.aggregate([
            { $match: { retweetOf: { $in: originalIds } } },
            { $group: { _id: "$retweetOf", count: { $sum: 1 } } },
        ]),
        userId
            ? Post.find({ user: userId, retweetOf: { $in: originalIds } })
                .select("retweetOf")
                .lean()
            : [],
        postIds.length
            ? Post.aggregate([
                { $match: { replyTo: { $in: postIds } } },
                { $group: { _id: "$replyTo", count: { $sum: 1 } } },
            ])
            : [],
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const mineSet = new Set(mine.map((m) => m.retweetOf.toString()));
    const orphanCountMap = Object.fromEntries(
        orphanCounts.map((c) => [c._id.toString(), c.count])
    );

    return plainPosts.map((post) => {
        const originalId = (post.retweetOf?._id || post.retweetOf || post._id).toString();
        const embeddedReplies = post.comments?.length || 0;
        const legacyReplies = orphanCountMap[post._id.toString()] || 0;
        const retweetMeta = {
            retweetCount: countMap[originalId] || 0,
            retweetedByMe: mineSet.has(originalId),
            replyCount: embeddedReplies + legacyReplies,
        };

        if (post.retweetOf) {
            return {
                ...post,
                ...retweetMeta,
                retweetOf: {
                    ...post.retweetOf,
                    retweetCount: countMap[originalId] || 0,
                    retweetedByMe: mineSet.has(originalId),
                    replyCount: (post.retweetOf.comments?.length || 0) +
                        (orphanCountMap[(post.retweetOf._id || post.retweetOf).toString()] || 0),
                },
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
                    post: quotedPostId,
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
        await Post.deleteMany({
            $or: [
                { retweetOf: req.params.id },
                { quotedPost: req.params.id },
                { replyTo: req.params.id },
            ],
        });
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
        const userId = req.user._id;

        if (!text?.trim()) {
            return res.status(400).json({ message: "Reply cannot be empty" });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.comments.push({ user: userId, text: text.trim() });
        await post.save();

        const savedComment = post.comments[post.comments.length - 1];

        if (userId.toString() !== post.user.toString()) {
            await Notification.create({
                from: userId,
                to: post.user,
                type: "comment",
                post: postId,
                commentId: savedComment._id,
            });
        }

        const updated = await populatePostFields(Post.findById(postId));
        res.status(200).json(updated.comments);
    } catch (error) {
        console.log("Error in commentOnPost controller:", error);
        res.status(500).json({ message: "Internal server error" }); 
    }
}

export const likeUnlikeComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { commentId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (!comment.likes) {
            comment.likes = [];
        }

        const userLiked = comment.likes.some((id) => id.toString() === userId.toString());
        const commentAuthorId = comment.user;

        if (userLiked) {
            comment.likes.pull(userId);
            await Notification.deleteOne({
                from: userId,
                to: commentAuthorId,
                type: "like",
                post: postId,
                commentId,
            });
        } else {
            comment.likes.push(userId);

            if (userId.toString() !== commentAuthorId.toString()) {
                await Notification.create({
                    from: userId,
                    to: commentAuthorId,
                    type: "like",
                    post: postId,
                    commentId,
                });
            }
        }

        await post.save();

        const updated = await Post.findById(postId).populate("comments.user", "-password");
        res.status(200).json({ comments: updated.comments });
    } catch (error) {
        console.log("Error in likeUnlikeComment controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const editComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { commentId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        if (!text?.trim()) {
            return res.status(400).json({ message: "Reply cannot be empty" });
        }
        if (text.trim().length > 280) {
            return res.status(400).json({ message: "Reply cannot exceed 280 characters" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only edit your own replies" });
        }

        comment.text = text.trim();
        comment.editedAt = new Date();
        await post.save();

        const updated = await populatePostFields(Post.findById(postId));
        res.status(200).json({ comments: updated.comments });
    } catch (error) {
        console.log("Error in editComment controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const { commentId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You can only delete your own replies" });
        }

        post.comments.pull(commentId);
        await post.save();

        await Notification.deleteMany({
            post: postId,
            commentId,
        });

        const updated = await populatePostFields(Post.findById(postId));
        res.status(200).json({ comments: updated.comments });
    } catch (error) {
        console.log("Error in deleteComment controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


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
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
            await Notification.deleteOne({
                from: userId,
                to: post.user,
                type: "like",
                $or: [{ commentId: null }, { commentId: { $exists: false } }],
            });

            const updatedLikes = post.likes.filter(id => id.toString() !== userId.toString());

            return res.status(200).json(updatedLikes);
        } else {
            // Like the post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();

            if (userId.toString() !== post.user.toString()) {
                const notification = new Notification({
                    from: userId,
                    to: post.user,
                    type: "like",
                    post: postId,
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

        let filter = feedFilter();
        if (cursor) {
            const [cursorDate, cursorId] = cursor.split("_");
            filter = feedFilter({
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
                ],
            });
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

        const likedPosts = await populatePostFields(
            Post.find({ likes: userId }).sort({ createdAt: -1 })
        );
        const likedPostIds = likedPosts.map((p) => p._id);

        // Keep user.likedPosts in sync with post.likes (repairs legacy drift)
        const storedIds = user.likedPosts.map((id) => id.toString()).sort().join(",");
        const actualIds = likedPostIds.map((id) => id.toString()).sort().join(",");
        if (storedIds !== actualIds) {
            await User.updateOne({ _id: userId }, { $set: { likedPosts: likedPostIds } });
        }

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

        let filter = feedFilter({ user: { $in: following } });
        if (cursor) {
            const [cursorDate, cursorId] = cursor.split("_");
            filter = feedFilter({
                user: { $in: following },
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } },
                ],
            });
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

        const postsWithReplies = await Post.find({ "comments.user": user._id })
            .populate({ path: "user", select: "-password" })
            .populate({ path: "comments.user", select: "-password" })
            .sort({ updatedAt: -1 })
            .lean();

        const userReplies = [];

        for (const post of postsWithReplies) {
            for (const comment of post.comments) {
                const commentUserId = comment.user?._id || comment.user;
                if (commentUserId?.toString() !== user._id.toString()) continue;

                userReplies.push({
                    _id: comment._id,
                    text: comment.text,
                    user: comment.user,
                    createdAt: comment.createdAt,
                    parentPost: {
                        _id: post._id,
                        user: post.user,
                        text: post.text,
                    },
                });
            }
        }

        const orphanReplies = await Post.find({ user: user._id, replyTo: { $ne: null } })
            .populate({ path: "user", select: "-password" })
            .populate({
                path: "replyTo",
                select: "text user",
                populate: { path: "user", select: "-password" },
            })
            .sort({ createdAt: -1 })
            .lean();

        for (const orphan of orphanReplies) {
            const parent = orphan.replyTo;
            if (!parent?._id) continue;

            userReplies.push({
                _id: orphan._id,
                text: orphan.text,
                user: orphan.user,
                createdAt: orphan.createdAt,
                parentPost: {
                    _id: parent._id,
                    user: parent.user,
                    text: parent.text,
                },
            });

            await restoreLegacyReplies(parent._id);
        }

        userReplies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
            Post.find(feedFilter({ user: user._id })).sort({ createdAt: -1 })
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
                ...excludeReplyPosts,
                img: { $exists: true, $nin: ["", null] },
            }).sort({ createdAt: -1 })
        ).lean();

        const withImages = mediaPosts.filter((post) => post.img?.trim());

        res.status(200).json({ mediaPosts: withImages });
    } catch (error) {
        console.log("Error in getUserMedia controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPostById = async (req, res) => {
    try {
        const postDoc = await Post.findById(req.params.id).lean();

        if (!postDoc) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Legacy reply posts from an old migration — restore into parent thread.
        if (postDoc.replyTo) {
            await restoreLegacyReplies(postDoc.replyTo);

            const parent = await Post.findById(postDoc.replyTo).lean();
            const match = findEmbeddedComment(parent, postDoc);

            const redirect = match?._id
                ? `/post/${postDoc.replyTo}#comment-${match._id}`
                : `/post/${postDoc.replyTo}`;

            return res.status(200).json({ redirect, post: null });
        }

        await restoreLegacyReplies(req.params.id);

        const post = await populatePostFields(Post.findById(req.params.id));
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
                post: originalId,
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