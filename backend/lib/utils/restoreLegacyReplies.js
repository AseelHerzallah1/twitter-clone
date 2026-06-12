import Post from "../../models/post.model.js";
import Notification from "../../models/notification.model.js";

/**
 * Re-embed reply posts that were wrongly split out (replyTo field) back into
 * the parent post's comments array, then delete the orphan documents.
 */
export const restoreLegacyReplies = async (postId) => {
    if (!postId) return false;

    const orphans = await Post.find({ replyTo: postId }).sort({ createdAt: 1 });
    if (!orphans.length) return false;

    const parent = await Post.findById(postId);
    if (!parent) return false;

    let changed = false;

    for (const orphan of orphans) {
        const alreadyEmbedded = parent.comments.some(
            (c) =>
                c.user?.toString() === orphan.user?.toString() &&
                c.text === orphan.text
        );

        if (!alreadyEmbedded) {
            parent.comments.push({
                user: orphan.user,
                text: orphan.text,
                createdAt: orphan.createdAt || new Date(),
                likes: orphan.likes || [],
            });
            changed = true;
        }
    }

    if (changed) {
        await parent.save();
    }

    const refreshed = await Post.findById(postId);

    for (const orphan of orphans) {
        const embedded = refreshed.comments.find(
            (c) =>
                c.user?.toString() === orphan.user?.toString() &&
                c.text === orphan.text
        );

        if (embedded) {
            await Notification.updateMany(
                { post: orphan._id },
                { $set: { post: postId, commentId: embedded._id } }
            );
        }
    }

    await Post.deleteMany({ replyTo: postId });

    return true;
};

export const findEmbeddedComment = (parent, orphan) =>
    parent?.comments?.find(
        (c) =>
            c.user?.toString() === orphan.user?.toString() &&
            c.text === orphan.text
    );
