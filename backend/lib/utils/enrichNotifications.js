import Post from "../../models/post.model.js";
import Notification from "../../models/notification.model.js";
import { restoreLegacyReplies, findEmbeddedComment } from "./restoreLegacyReplies.js";

const selectPostFields = "_id text img";

const resolveCommentNotification = async (notification) => {
    const fromId = notification.from?._id || notification.from;
    const toId = notification.to?._id || notification.to;
    const postId = notification.post?._id || notification.post;

    if (!fromId || !toId) return notification;

    // Notification may still point at an orphan reply post from the old migration.
    if (postId) {
        const stored = await Post.findById(postId).select("replyTo text user").lean();

        if (stored?.replyTo) {
            await restoreLegacyReplies(stored.replyTo);

            const parent = await Post.findById(stored.replyTo)
                .select(`${selectPostFields} comments`)
                .lean();
            const match = findEmbeddedComment(parent, stored);

            if (parent?._id) {
                notification.post = {
                    _id: parent._id,
                    text: parent.text,
                    img: parent.img,
                };
                if (match?._id) notification.commentId = match._id;

                await Notification.updateOne(
                    { _id: notification._id },
                    {
                        $set: {
                            post: parent._id,
                            ...(match?._id && { commentId: match._id }),
                        },
                    }
                );
            }

            return notification;
        }

        await restoreLegacyReplies(postId);

        const parent = await Post.findById(postId)
            .select(`${selectPostFields} comments`)
            .lean();

        if (parent?._id) {
            notification.post = {
                _id: parent._id,
                text: parent.text,
                img: parent.img,
            };

            if (notification.commentId) {
                const hasComment = parent.comments?.some(
                    (c) => c._id?.toString() === notification.commentId?.toString()
                );
                if (hasComment) return notification;
            }

            const match = parent.comments
                ?.slice()
                .reverse()
                .find((c) => c.user?.toString() === fromId.toString());

            if (match?._id) {
                notification.commentId = match._id;
                await Notification.updateOne(
                    { _id: notification._id },
                    { $set: { commentId: match._id } }
                );
            }

            return notification;
        }
    }

    let post = null;
    let commentId = notification.commentId || null;

    post = await Post.findOne({
        user: toId,
        "comments.user": fromId,
    })
        .sort({ updatedAt: -1 })
        .select(`${selectPostFields} comments`)
        .lean();

    if (post?.comments?.length) {
        const match = [...post.comments]
            .reverse()
            .find((c) => c.user?.toString() === fromId.toString());
        if (match?._id) commentId = match._id;
    }

    if (!post?._id) {
        const orphan = await Post.findOne({
            user: fromId,
            replyTo: { $ne: null },
        })
            .sort({ createdAt: -1 })
            .select("replyTo text user")
            .lean();

        if (orphan?.replyTo) {
            await restoreLegacyReplies(orphan.replyTo);

            post = await Post.findById(orphan.replyTo)
                .select(`${selectPostFields} comments`)
                .lean();
            const match = findEmbeddedComment(post, orphan);
            if (match?._id) commentId = match._id;
        }
    }

    if (post?._id) {
        notification.post = post;
        if (commentId) notification.commentId = commentId;

        await Notification.updateOne(
            { _id: notification._id },
            { $set: { post: post._id, ...(commentId && { commentId }) } }
        );
    }

    return notification;
};

const resolvePostForNotification = async (notification) => {
    if (notification.type === "comment") {
        return resolveCommentNotification(notification);
    }

    if (notification.post?._id) {
        return notification;
    }

    const fromId = notification.from?._id || notification.from;
    const toId = notification.to?._id || notification.to;
    if (!fromId || !toId || notification.type === "follow") {
        return notification;
    }

    let post = null;

    try {
        switch (notification.type) {
            case "like":
                post = await Post.findOne({
                    user: toId,
                    likes: fromId,
                })
                    .sort({ updatedAt: -1 })
                    .select(selectPostFields)
                    .lean();
                break;

            case "retweet": {
                const originalIds = await Post.find({ user: toId }).distinct("_id");
                if (originalIds.length) {
                    const retweet = await Post.findOne({
                        user: fromId,
                        retweetOf: { $in: originalIds },
                    })
                        .sort({ createdAt: -1 })
                        .select("retweetOf")
                        .lean();

                    if (retweet?.retweetOf) {
                        post = await Post.findById(retweet.retweetOf)
                            .select(selectPostFields)
                            .lean();
                    }
                }
                break;
            }

            case "quote": {
                const originalIds = await Post.find({ user: toId }).distinct("_id");
                if (originalIds.length) {
                    post = await Post.findOne({
                        user: fromId,
                        quotedPost: { $in: originalIds },
                    })
                        .sort({ createdAt: -1 })
                        .select(selectPostFields)
                        .lean();
                }
                break;
            }

            default:
                break;
        }

        if (post?._id) {
            notification.post = post;

            await Notification.updateOne(
                { _id: notification._id, post: null },
                { $set: { post: post._id } }
            );
        }
    } catch (error) {
        console.warn("Could not resolve post for notification:", notification._id, error.message);
    }

    return notification;
};

export const enrichNotifications = async (notifications) => {
    const resolved = await Promise.all(notifications.map((n) => resolvePostForNotification(n)));

    for (const notification of resolved) {
        if (notification.type !== "like" || !notification.commentId || !notification.post) continue;

        const postId = notification.post._id || notification.post;
        const post = await Post.findById(postId).select("comments").lean();
        const comment = post?.comments?.find(
            (c) => c._id?.toString() === notification.commentId?.toString()
        );

        if (comment?.text) {
            notification.replyText = comment.text;
        }
    }

    return resolved;
};
