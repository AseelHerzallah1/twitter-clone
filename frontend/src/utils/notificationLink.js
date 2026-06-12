export const getNotificationPath = (notification) => {
	const postId = notification?.post?._id || notification?.post;

	switch (notification?.type) {
		case "follow":
			return null;
		case "like": {
			if (!postId) return null;
			const commentId = notification?.commentId;
			return commentId ? `/post/${postId}#comment-${commentId}` : `/post/${postId}`;
		}
		case "retweet":
		case "quote":
			if (!postId) return null;
			return `/post/${postId}`;
		case "comment": {
			if (!postId) return null;
			const commentId = notification?.commentId;
			return commentId ? `/post/${postId}#comment-${commentId}` : `/post/${postId}`;
		}
		default:
			return null;
	}
};

export const isNotificationClickable = (notification) =>
	Boolean(getNotificationPath(notification));
