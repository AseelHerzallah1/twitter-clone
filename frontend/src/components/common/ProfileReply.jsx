import { Link, useNavigate, useLocation } from "react-router-dom";
import { navigationState } from "../../utils/navigation";
import PostText from "./PostText";
import { formatPostDate } from "../../utils/db/date/index";

const ProfileReply = ({ reply }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const author = reply?.user;
	const parent = reply?.parentPost;
	const parentUsername = parent?.user?.username;

	if (!author || !parent?._id) return null;

	const postPath = parent._id
		? `/post/${parent._id}${reply._id ? `#comment-${reply._id}` : ""}`
		: null;

	if (!postPath) return null;
	const replyDate = reply.createdAt ? formatPostDate(reply.createdAt) : null;

	return (
		<article
			onClick={() => navigate(postPath, { state: navigationState(location) })}
			className='flex gap-3 px-4 py-3 border-b border-theme hover-bg-theme transition-colors cursor-pointer'
		>
			<div className='avatar shrink-0' onClick={(e) => e.stopPropagation()}>
				{author.username ? (
					<Link to={`/profile/${author.username}`} className='w-10 h-10 rounded-full overflow-hidden block'>
						<img src={author.profileImage || "/avatar-placeholder.svg"} alt='' />
					</Link>
				) : (
					<div className='w-10 h-10 rounded-full overflow-hidden'>
						<img src={author.profileImage || "/avatar-placeholder.svg"} alt='' />
					</div>
				)}
			</div>
			<div className='flex flex-col flex-1 min-w-0'>
				{parentUsername && (
					<p className='text-sm text-muted-theme'>
						Replying to{" "}
						<Link
							to={`/profile/${parentUsername}`}
							className='text-twitter-reply hover:underline'
							onClick={(e) => e.stopPropagation()}
						>
							@{parentUsername}
						</Link>
					</p>
				)}
				<div className='flex gap-1 items-center flex-wrap mt-0.5' onClick={(e) => e.stopPropagation()}>
					{author.username ? (
						<>
							<Link to={`/profile/${author.username}`} className='font-bold text-[15px] hover:underline truncate'>
								{author.fullName || author.username}
							</Link>
							<span className='text-muted-theme text-[15px] truncate'>@{author.username}</span>
							{replyDate && (
								<>
									<span className='text-muted-theme text-[15px]'>·</span>
									<span className='text-muted-theme text-[15px]'>{replyDate}</span>
								</>
							)}
						</>
					) : (
						<span className='font-bold text-[15px] truncate'>{author.fullName || "User"}</span>
					)}
				</div>
				{reply.text && (
					<PostText text={reply.text} className='mt-1 text-[15px] leading-normal' />
				)}
				{parent.text && (
					<p className='mt-2 text-sm text-muted-theme border border-theme rounded-xl px-3 py-2 line-clamp-2'>
						{parent.text}
					</p>
				)}
			</div>
		</article>
	);
};

export default ProfileReply;
