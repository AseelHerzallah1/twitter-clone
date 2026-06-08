import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { ReplyIcon, RetweetIcon, LikeIcon } from "../svgs/PostIcons";
import { useState, useRef, useEffect } from "react";
import { useAutoResizeTextarea } from "../../hooks/useAutoResizeTextarea";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { navigationState } from "../../utils/navigation";
import { openCompose } from "../../utils/openCompose";
import QuotedPostPreview from "./QuotedPostPreview";
import PostText from "./PostText";
import LikesModal from "./LikesModal";
import ConfirmDialog from "./ConfirmDialog";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/db/date/index";
import { updatePostInCache, removePostFromFeeds } from "../../utils/postCache";

const ACTION_STYLES = {
	reply: {
		active: "text-twitter-reply",
		idle: "text-muted-theme hover:text-twitter-reply hover:bg-twitter-reply/10",
	},
	retweet: {
		active: "text-twitter-retweet bg-twitter-retweet/10",
		idle: "text-muted-theme hover:text-twitter-retweet hover:bg-twitter-retweet/10",
	},
	like: {
		active: "text-twitter-like bg-twitter-like/10",
		idle: "text-muted-theme hover:text-twitter-like hover:bg-twitter-like/10",
	},
	bookmark: {
		active: "text-twitter-reply bg-twitter-reply/10",
		idle: "text-muted-theme hover:text-twitter-reply hover:bg-twitter-reply/10",
	},
};

const PostAction = ({ count, active, type, onClick, onCountClick, loading, children }) => {
	const styles = ACTION_STYLES[type];
	return (
		<button
			type='button'
			onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
			disabled={loading}
			className='group flex items-center gap-1 min-w-[36px]'
		>
			<span className={`flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors ${
				active ? styles.active : styles.idle
			}`}>
				{loading ? <LoadingSpinner size='sm' /> : children}
			</span>
			{count > 0 && (
				<span
					onClick={(e) => { if (onCountClick) { e.stopPropagation(); onCountClick(e); } }}
					className={`text-xs tabular-nums min-w-[8px] ${onCountClick ? "cursor-pointer hover:underline" : ""} ${active ? styles.active.split(" ")[0] : "text-muted-theme"}`}
				>
					{count}
				</span>
			)}
		</button>
	);
};

const Post = ({ post, variant = "feed" }) => {
	const [comment, setComment] = useState("");
	const [retweetMenuOpen, setRetweetMenuOpen] = useState(false);
	const [postMenuOpen, setPostMenuOpen] = useState(false);
	const [showLikesModal, setShowLikesModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editText, setEditText] = useState("");
	const retweetMenuRef = useRef(null);
	const postMenuRef = useRef(null);
	const commentRef = useRef(null);
	const resizeComment = useAutoResizeTextarea(commentRef, comment, { min: 40, max: 128 });
	const navigate = useNavigate();
	const location = useLocation();
	const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: () => null, enabled: false });
	const queryClient = useQueryClient();
	const isRetweet = Boolean(post.retweetOf?.user);
	const displayPost = isRetweet ? post.retweetOf : post;
	const retweeter = isRetweet ? post.user : null;
	const postOwner = displayPost.user;
	const postId = displayPost._id;
	const isLiked = authUser ? displayPost.likes?.some((id) => id?.toString() === authUser._id?.toString()) : false;
	const isPinned = authUser?.pinnedPost?.toString() === postId?.toString();
	const isBookmarked = authUser?.bookmarkedPosts?.some((id) => id?.toString() === postId?.toString());
	const isMyPost = authUser?._id === postOwner?._id;
	const isMyRetweet = isRetweet && authUser?._id === retweeter?._id;
	const formattedDate = formatPostDate(displayPost.createdAt);
	const hasRetweeted = displayPost.retweetedByMe ?? false;
	const retweetCount = displayPost.retweetCount ?? 0;
	const isDetail = variant === "detail";

	const goToPost = () => {
		if (!isDetail) navigate(`/post/${postId}`);
	};

	useEffect(() => {
		if (!retweetMenuOpen && !postMenuOpen) return;
		const handleClickOutside = (e) => {
			if (retweetMenuRef.current?.contains(e.target) || postMenuRef.current?.contains(e.target)) return;
			setRetweetMenuOpen(false);
			setPostMenuOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [retweetMenuOpen, postMenuOpen]);

	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to delete post");
			return data;
		},
		onSuccess: () => {
			removePostFromFeeds(queryClient, post._id);
			queryClient.invalidateQueries({ queryKey: ["posts", "infinite"], refetchType: "active" });
			if (isDetail) navigate(isRetweet ? "/" : "/");
		},
	});

	const { mutate: editPost, isPending: isEditing } = useMutation({
		mutationFn: async (text) => {
			const res = await fetch(`/api/posts/${postId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to edit post");
			return data.post;
		},
		onSuccess: (updatedPost) => {
			setShowEditModal(false);
			const patch = (p) => ({
				...p,
				text: updatedPost.text,
				editedAt: updatedPost.editedAt,
			});
			updatePostInCache(queryClient, postId, patch);
			if (isRetweet) {
				updatePostInCache(queryClient, post._id, (p) => ({
					...p,
					retweetOf: patch(p.retweetOf),
				}));
			}
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/like/${postId}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to like post");
			return data;
		},
		onSuccess: (updatedLikes) => {
			updatePostInCache(queryClient, postId, (p) => ({ ...p, likes: updatedLikes }));
			if (isRetweet) {
				updatePostInCache(queryClient, post._id, (p) => ({
					...p,
					retweetOf: { ...p.retweetOf, likes: updatedLikes },
				}));
			}
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
		},
		onError: (error) => toast.error(error.message || "Failed to like post"),
	});

	const { mutate: bookmarkPost, isPending: isBookmarking } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/bookmark/${postId}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to bookmark post");
			return data;
		},
		onSuccess: ({ bookmarked }) => {
			queryClient.setQueryData(["authUser"], (old) => {
				if (!old) return old;
				const bookmarkId = postId.toString();
				const bookmarkedPosts = bookmarked
					? [...(old.bookmarkedPosts || []), postId]
					: (old.bookmarkedPosts || []).filter((id) => id.toString() !== bookmarkId);
				return { ...old, bookmarkedPosts };
			});
			queryClient.setQueriesData({ queryKey: ["posts", "bookmarks"] }, (old) => {
				if (!Array.isArray(old)) return old;
				return bookmarked
					? old
					: old.filter((p) => p._id?.toString() !== postId.toString());
			});
		},
		onError: (error) => toast.error(error.message || "Failed to bookmark"),
	});

	const { mutate: commentPost, isPending: isCommenting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/comment/${postId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: comment }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to post comment");
			return data;
		},
		onSuccess: (updatedComments) => {
			setComment("");
			requestAnimationFrame(resizeComment);
			updatePostInCache(queryClient, postId, (p) => ({ ...p, comments: updatedComments }));
			if (isRetweet) {
				updatePostInCache(queryClient, post._id, (p) => ({
					...p,
					retweetOf: { ...p.retweetOf, comments: updatedComments },
				}));
			}
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => toast.error(error.message || "Failed to post comment"),
	});

	const { mutate: retweetPost, isPending: isRetweeting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/retweet/${postId}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to retweet");
			return data;
		},
		onSuccess: ({ retweetCount: count, retweetedByMe: didRetweet }) => {
			const updater = (p) => ({
				...p,
				retweetCount: count,
				retweetedByMe: didRetweet,
			});
			updatePostInCache(queryClient, postId, updater);
			if (isRetweet) {
				updatePostInCache(queryClient, post._id, (p) => ({
					...p,
					retweetOf: { ...p.retweetOf, retweetCount: count, retweetedByMe: didRetweet },
					retweetCount: count,
					retweetedByMe: didRetweet,
				}));
			}
			queryClient.invalidateQueries({ queryKey: ["posts", "infinite"], refetchType: "active" });
			queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"], refetchType: "active" });
			setRetweetMenuOpen(false);
		},
		onError: (error) => toast.error(error.message || "Failed to retweet"),
	});

	const { mutate: pinPost } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/pin/${postId}`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to pin");
			return data;
		},
		onSuccess: ({ pinnedPost }) => {
			queryClient.setQueryData(["authUser"], (old) =>
				old ? { ...old, pinnedPost } : old
			);
			if (authUser?.username) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "posts", authUser.username],
					refetchType: "active",
				});
			}
			setPostMenuOpen(false);
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: unpinPost } = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/posts/pin", { method: "DELETE" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to unpin");
			return data;
		},
		onSuccess: () => {
			queryClient.setQueryData(["authUser"], (old) =>
				old ? { ...old, pinnedPost: null } : old
			);
			if (authUser?.username) {
				queryClient.invalidateQueries({
					queryKey: ["posts", "posts", authUser.username],
					refetchType: "active",
				});
			}
			setPostMenuOpen(false);
		},
		onError: (error) => toast.error(error.message),
	});

	const copyLink = () => {
		navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
		setPostMenuOpen(false);
	};

	const handlePostComment = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (!isCommenting && comment.trim()) commentPost();
	};

	return (
		<>
			{showLikesModal && <LikesModal postId={postId} onClose={() => setShowLikesModal(false)} />}
			{showDeleteConfirm && (
				<ConfirmDialog
					title='Delete tweet?'
					message="This can't be undone and will be removed from your profile and timeline."
					confirmLabel='Delete'
					onConfirm={() => { setShowDeleteConfirm(false); deletePost(); }}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			)}
			{showEditModal && (
				<dialog open className='modal modal-open'>
					<div className='modal-box max-w-lg rounded-2xl border border-theme'>
						<h3 className='font-bold text-lg mb-3'>Edit post</h3>
						<textarea
							value={editText}
							onChange={(e) => setEditText(e.target.value)}
							className='textarea w-full min-h-[120px] text-[15px] bg-base-200 border border-theme rounded-xl focus:outline-none focus:border-primary'
							maxLength={280}
						/>
						<p className={`text-right text-sm mt-1 ${editText.length > 280 ? "text-red-500" : "text-muted-theme"}`}>
							{280 - editText.length}
						</p>
						<div className='flex justify-end gap-2 mt-4'>
							<button type='button' className='btn btn-ghost rounded-full' onClick={() => setShowEditModal(false)}>
								Cancel
							</button>
							<button
								type='button'
								className='btn btn-primary rounded-full text-white'
								disabled={!editText.trim() || editText.length > 280 || isEditing}
								onClick={() => editPost(editText.trim())}
							>
								{isEditing ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
					<form method='dialog' className='modal-backdrop'>
						<button onClick={() => setShowEditModal(false)}>close</button>
					</form>
				</dialog>
			)}
			{isPinned && isMyPost && !isRetweet && (
				<div className='flex items-center gap-2 px-4 pt-3 text-muted-theme text-xs'>
					<span>📌 Pinned</span>
				</div>
			)}
			{isRetweet && retweeter && (
				<div className='flex items-center gap-2 px-4 pt-3 text-muted-theme text-xs'>
					<RetweetIcon className='w-3 h-3 text-twitter-retweet' />
					<Link to={`/profile/${retweeter.username}`} className='hover:underline' onClick={(e) => e.stopPropagation()}>
						{isMyRetweet ? "You" : retweeter.fullName} reposted
					</Link>
				</div>
			)}
			<article
				onClick={goToPost}
				className={`flex gap-3 items-start px-4 py-3 border-b border-theme ${
					!isDetail ? "hover-bg-theme transition-colors cursor-pointer" : ""
				}`}
			>
				<div className='avatar shrink-0' onClick={(e) => e.stopPropagation()}>
					<Link to={`/profile/${postOwner.username}`} className='w-10 h-10 rounded-full overflow-hidden block'>
						<img src={postOwner.profileImage || "/avatar-placeholder.svg"} alt='' />
					</Link>
				</div>
				<div className='flex flex-col flex-1 min-w-0'>
					<div className='flex gap-1 items-center flex-wrap' onClick={(e) => e.stopPropagation()}>
						<Link to={`/profile/${postOwner.username}`} className='font-bold text-[15px] hover:underline truncate'>
							{postOwner.fullName}
						</Link>
						<span className='text-muted-theme text-[15px] truncate'>
							<Link to={`/profile/${postOwner.username}`} className='hover:underline'>@{postOwner.username}</Link>
							<span className='mx-1'>·</span>
							<span>{formattedDate}</span>
						</span>
						<span className='flex justify-end flex-1 relative' ref={postMenuRef}>
							<button
								type='button'
								className='p-2 rounded-full hover-bg-theme text-muted-theme transition-colors'
								onClick={() => setPostMenuOpen((open) => !open)}
								aria-label='More options'
							>
								{isDeleting ? <LoadingSpinner size='sm' /> : <HiOutlineDotsHorizontal className='w-5 h-5' />}
							</button>
							{postMenuOpen && !isDeleting && (
								<div className='absolute top-full right-0 mt-1 w-48 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-20'>
									<button type='button' className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors' onClick={copyLink}>
										Copy link
									</button>
									{isMyPost && !isRetweet && (
										<>
											<button
												type='button'
												className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors border-t border-theme'
												onClick={() => {
													setPostMenuOpen(false);
													setEditText(displayPost.text || "");
													setShowEditModal(true);
												}}
											>
												Edit
											</button>
											<button
												type='button'
												className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors border-t border-theme'
												onClick={() => { setPostMenuOpen(false); isPinned ? unpinPost() : pinPost(); }}
											>
												{isPinned ? "Unpin from profile" : "Pin to profile"}
											</button>
											<button
												type='button'
												className='w-full px-4 py-3 text-left text-[15px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-theme'
												onClick={() => { setPostMenuOpen(false); setShowDeleteConfirm(true); }}
											>
												Delete
											</button>
										</>
									)}
									{isMyRetweet && (
										<button
											type='button'
											className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors border-t border-theme'
											onClick={() => { setPostMenuOpen(false); retweetPost(); }}
										>
											Undo repost
										</button>
									)}
								</div>
							)}
						</span>
					</div>

					{displayPost.text && (
						<PostText text={displayPost.text} className='mt-1 text-[15px] leading-normal' />
					)}

					{displayPost.img && (
						<div className='mt-3 rounded-2xl overflow-hidden border border-theme'>
							<img
								src={displayPost.img}
								className='w-full max-h-[512px] object-cover'
								alt='Post image'
								loading='lazy'
							/>
						</div>
					)}

					{displayPost.quotedPost?.user && (
						<QuotedPostPreview post={displayPost.quotedPost} />
					)}

					{displayPost.editedAt && (
						<p className='text-xs text-muted-theme mt-1'>Edited</p>
					)}

					<div className='flex items-center justify-between mt-3 w-full max-w-[425px]' onClick={(e) => e.stopPropagation()}>
						<PostAction
							count={displayPost.comments?.length || 0}
							active={false}
							type='reply'
							onClick={() => isDetail ? document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" }) : navigate(`/post/${postId}`, { state: navigationState(location) })}
						>
							<ReplyIcon />
						</PostAction>

						<div className='relative' ref={retweetMenuRef}>
							<PostAction
								count={retweetCount}
								active={hasRetweeted}
								type='retweet'
								onClick={() => setRetweetMenuOpen((open) => !open)}
								loading={isRetweeting}
							>
								<RetweetIcon />
							</PostAction>
							{retweetMenuOpen && (
								<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-20'>
									{hasRetweeted ? (
										<button
											type='button'
											className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors'
											onClick={() => !isRetweeting && retweetPost()}
										>
											Undo Retweet
										</button>
									) : (
										<button
											type='button'
											className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors'
											onClick={() => !isRetweeting && retweetPost()}
										>
											Retweet
										</button>
									)}
									<button
										type='button'
										className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors border-t border-theme'
										onClick={() => {
											setRetweetMenuOpen(false);
											openCompose({ quotedPost: displayPost });
										}}
									>
										Quote Tweet
									</button>
								</div>
							)}
						</div>

						<PostAction
							count={displayPost.likes?.length || 0}
							active={isLiked}
							type='like'
							onClick={() => !isLiking && likePost()}
							onCountClick={displayPost.likes?.length > 0 ? () => setShowLikesModal(true) : undefined}
							loading={isLiking}
						>
							<LikeIcon />
						</PostAction>

						<PostAction
							count={0}
							active={isBookmarked}
							type='bookmark'
							onClick={() => !isBookmarking && bookmarkPost()}
							loading={isBookmarking}
						>
							{isBookmarked ? <FaBookmark className='w-[18px] h-[18px]' /> : <FaRegBookmark className='w-[18px] h-[18px]' />}
						</PostAction>
					</div>

					{!isDetail && displayPost.comments?.length > 0 && (
						<button
							type='button'
							className='text-twitter-reply text-sm mt-2 hover:underline text-left'
							onClick={(e) => { e.stopPropagation(); navigate(`/post/${postId}`, { state: navigationState(location) }); }}
						>
							Show replies ({displayPost.comments.length})
						</button>
					)}
				</div>
			</article>

			{isDetail && (
				<div className='border-b border-theme'>
					{displayPost.comments?.length === 0 && (
						<p className='px-4 py-6 text-center text-muted-theme text-sm'>No replies yet. Be the first!</p>
					)}
					<div className='ml-6 border-l-2 border-theme'>
					{displayPost.comments?.map((c) => (
						<div key={c._id} className='flex gap-3 px-4 py-3 border-b border-theme'>
							<div className='avatar shrink-0'>
								<Link to={`/profile/${c.user.username}`} className='w-10 h-10 rounded-full overflow-hidden block'>
									<img src={c.user.profileImage || "/avatar-placeholder.svg"} alt='' />
								</Link>
							</div>
							<div className='flex flex-col min-w-0'>
								<div className='flex items-center gap-1 flex-wrap'>
									<Link to={`/profile/${c.user.username}`} className='font-bold text-[15px] hover:underline'>
										{c.user.fullName}
									</Link>
									<span className='text-muted-theme text-sm'>@{c.user.username}</span>
								</div>
								<PostText text={c.text} className='text-[15px] mt-0.5' />
							</div>
						</div>
					))}
					</div>

					<form
						id='reply-form'
						className='flex gap-3 px-4 py-3 items-start border-b border-theme'
						onSubmit={handlePostComment}
					>
						<div className='avatar shrink-0'>
							<div className='w-10 rounded-full'>
								<img src={authUser?.profileImage || "/avatar-placeholder.svg"} alt='' />
							</div>
						</div>
						<div className='flex-1 flex gap-2 items-end'>
							<textarea
								ref={commentRef}
								rows={1}
								className='textarea flex-1 p-2 rounded-xl text-[15px] leading-5 resize-none overflow-hidden border border-theme bg-base-100 focus:outline-none focus:border-twitter-reply'
								style={{ height: "40px" }}
								placeholder='Tweet your reply'
								value={comment}
								onChange={(e) => setComment(e.target.value)}
							/>
							<button
								type='submit'
								disabled={!comment.trim() || isCommenting}
								className='btn btn-primary rounded-full btn-sm text-white px-4 font-bold disabled:opacity-50'
							>
								{isCommenting ? <LoadingSpinner size='sm' /> : "Reply"}
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
};

export default Post;
