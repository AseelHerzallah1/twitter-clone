import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PostText from "./PostText";
import { ReplyIcon, RetweetIcon, LikeIcon } from "../svgs/PostIcons";
import { formatPostDate } from "../../utils/db/date/index";
import { updatePostCommentsInCache, normalizeCommentsResponse } from "../../utils/postCache";
import { invalidateUnreadCounts } from "../../utils/unreadCounts";
import { openCompose } from "../../utils/openCompose";
import LoadingSpinner from "./LoadingSpinner";
import ConfirmDialog from "./ConfirmDialog";

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
};

const CommentAction = ({ count, active, type, onClick, loading, children }) => {
	const styles = ACTION_STYLES[type];
	return (
		<button
			type='button'
			onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
			disabled={loading}
			className='group flex items-center gap-1 min-w-[36px] overflow-visible'
		>
			<span className={`flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors overflow-visible p-0.5 ${
				active ? styles.active : styles.idle
			}`}>
				{loading ? <LoadingSpinner size='sm' /> : children}
			</span>
			{count > 0 && <span className={`text-xs tabular-nums min-w-[8px] ${active ? styles.active.split(" ")[0] : "text-muted-theme"}`}>{count}</span>}
		</button>
	);
};

const updateCommentsCache = (queryClient, postId, data) => {
	const comments = normalizeCommentsResponse(data);
	updatePostCommentsInCache(queryClient, postId, comments);
};

const CommentItem = ({
	comment,
	postId,
	index,
	total,
	authUser,
	onReply,
	hasRetweeted,
	retweetCount,
	onRetweet,
}) => {
	const [retweetMenuOpen, setRetweetMenuOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [editText, setEditText] = useState(comment.text || "");
	const retweetMenuRef = useRef(null);
	const menuRef = useRef(null);
	const queryClient = useQueryClient();
	const author = comment.user;
	const commentDate = comment.createdAt ? formatPostDate(comment.createdAt) : null;
	const isMine = authUser?._id?.toString() === author?._id?.toString();
	const isLiked = authUser
		? comment.likes?.some((id) => id?.toString() === authUser._id?.toString())
		: false;

	useEffect(() => {
		if (!retweetMenuOpen && !menuOpen) return;
		const handleClickOutside = (e) => {
			if (retweetMenuRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
			setRetweetMenuOpen(false);
			setMenuOpen(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [retweetMenuOpen, menuOpen]);

	const { mutate: likeComment, isPending: isLiking } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/${postId}/comments/${comment._id}/like`, { method: "POST" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || data.message || "Failed to like reply");
			return data.comments;
		},
		onSuccess: (data) => {
			updateCommentsCache(queryClient, postId, data);
			invalidateUnreadCounts(queryClient);
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: editComment, isPending: isEditing } = useMutation({
		mutationFn: async (text) => {
			const res = await fetch(`/api/posts/${postId}/comments/${comment._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to edit reply");
			return data.comments;
		},
		onSuccess: (data) => {
			setShowEditModal(false);
			updateCommentsCache(queryClient, postId, data);
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: deleteComment, isPending: isDeleting } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`/api/posts/${postId}/comments/${comment._id}`, { method: "DELETE" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to delete reply");
			return data.comments;
		},
		onSuccess: (data) => {
			setShowDeleteConfirm(false);
			updateCommentsCache(queryClient, postId, data);
			queryClient.invalidateQueries({ queryKey: ["posts", "replies"], refetchType: "active" });
		},
		onError: (error) => toast.error(error.message),
	});

	if (!author) return null;

	const isLast = index === total - 1;

	return (
		<>
			{showDeleteConfirm && (
				<ConfirmDialog
					title='Delete reply?'
					message="This can't be undone and will be removed from the conversation."
					confirmLabel='Delete'
					onConfirm={() => deleteComment()}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			)}
			{showEditModal && (
				<dialog open className='modal modal-open'>
					<div className='modal-box max-w-lg rounded-2xl border border-theme'>
						<h3 className='font-bold text-lg mb-3'>Edit reply</h3>
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
								onClick={() => editComment(editText.trim())}
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
			<div id={comment._id ? `comment-${comment._id}` : undefined} className='flex gap-3 px-4 items-stretch scroll-mt-24'>
				<div className='w-10 shrink-0 flex flex-col items-center'>
					<div className='w-[2px] h-3 bg-base-content/10 shrink-0' aria-hidden='true' />
					<div className='avatar relative z-10 bg-base-100 rounded-full shrink-0'>
						<Link to={`/profile/${author.username}`} className='w-10 h-10 rounded-full overflow-hidden block'>
							<img src={author.profileImage || "/avatar-placeholder.svg"} alt='' />
						</Link>
					</div>
					{!isLast ? (
						<div className='w-[2px] flex-1 min-h-[12px] bg-base-content/10 mt-1' aria-hidden='true' />
					) : (
						<div className='w-[2px] h-3 bg-base-content/10 mt-1 shrink-0' aria-hidden='true' />
					)}
				</div>
				<div className='flex flex-col min-w-0 flex-1 pb-3 pt-0.5'>
					<div className='flex items-center gap-1 flex-wrap'>
						<Link to={`/profile/${author.username}`} className='font-bold text-[15px] hover:underline'>
							{author.fullName}
						</Link>
						<span className='text-muted-theme text-[15px]'>@{author.username}</span>
						{commentDate && (
							<>
								<span className='text-muted-theme text-[15px]'>·</span>
								<span className='text-muted-theme text-[15px]'>{commentDate}</span>
							</>
						)}
						{isMine && (
							<span className='flex justify-end flex-1 relative' ref={menuRef}>
								<button
									type='button'
									className='p-1.5 rounded-full hover-bg-theme text-muted-theme transition-colors'
									onClick={() => setMenuOpen((open) => !open)}
									aria-label='More options'
								>
									{isDeleting ? <LoadingSpinner size='sm' /> : <HiOutlineDotsHorizontal className='w-4 h-4' />}
								</button>
								{menuOpen && !isDeleting && (
									<div className='absolute top-full right-0 mt-1 w-44 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-20'>
										<button
											type='button'
											className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors'
											onClick={() => {
												setMenuOpen(false);
												setEditText(comment.text || "");
												setShowEditModal(true);
											}}
										>
											Edit
										</button>
										<button
											type='button'
											className='w-full px-4 py-3 text-left text-[15px] font-bold text-red-500 hover:bg-red-500/10 transition-colors border-t border-theme'
											onClick={() => {
												setMenuOpen(false);
												setShowDeleteConfirm(true);
											}}
										>
											Delete
										</button>
									</div>
								)}
							</span>
						)}
					</div>
					<PostText text={comment.text} className='text-[15px] mt-0.5 leading-normal' />
					{comment.editedAt && (
						<p className='text-xs text-muted-theme mt-0.5'>Edited</p>
					)}
					<div className='flex items-center justify-between mt-2 w-full max-w-[425px] -ml-2'>
						<CommentAction count={0} type='reply' onClick={() => onReply?.(author.username)}>
							<ReplyIcon />
						</CommentAction>
						<div className='relative' ref={retweetMenuRef}>
							<CommentAction
								count={retweetCount}
								active={hasRetweeted}
								type='retweet'
								onClick={() => setRetweetMenuOpen((open) => !open)}
							>
								<RetweetIcon />
							</CommentAction>
							{retweetMenuOpen && (
								<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-20'>
									{hasRetweeted ? (
										<button type='button' className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors' onClick={() => { setRetweetMenuOpen(false); onRetweet?.(); }}>
											Undo Retweet
										</button>
									) : (
										<button type='button' className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors' onClick={() => { setRetweetMenuOpen(false); onRetweet?.(); }}>
											Retweet
										</button>
									)}
									<button
										type='button'
										className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors border-t border-theme'
										onClick={() => {
											setRetweetMenuOpen(false);
											openCompose({
												quotedPost: {
													_id: postId,
													user: author,
													text: comment.text,
												},
											});
										}}
									>
										Quote Tweet
									</button>
								</div>
							)}
						</div>
						<CommentAction
							count={comment.likes?.length || 0}
							active={isLiked}
							type='like'
							onClick={() => !isLiking && likeComment()}
							loading={isLiking}
						>
							<LikeIcon />
						</CommentAction>
					</div>
				</div>
			</div>
		</>
	);
};

export default CommentItem;
