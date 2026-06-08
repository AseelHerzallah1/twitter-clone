import { Link, useNavigate, useLocation } from "react-router-dom";
import { navigationState } from "../../utils/navigation";

const ProfileReply = ({ reply }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const author = reply.user;
	const parent = reply.parentPost;

	return (
		<article
			onClick={() => navigate(`/post/${parent._id}`, { state: navigationState(location) })}
			className='flex gap-3 px-4 py-3 border-b border-theme hover-bg-theme transition-colors cursor-pointer'
		>
			<div className='avatar shrink-0' onClick={(e) => e.stopPropagation()}>
				<Link to={`/profile/${author.username}`} className='w-10 h-10 rounded-full overflow-hidden block'>
					<img src={author.profileImage || "/avatar-placeholder.svg"} alt='' />
				</Link>
			</div>
			<div className='flex flex-col flex-1 min-w-0'>
				<p className='text-sm text-muted-theme'>
					Replying to{" "}
					<Link
						to={`/profile/${parent.user.username}`}
						className='text-twitter-reply hover:underline'
						onClick={(e) => e.stopPropagation()}
					>
						@{parent.user.username}
					</Link>
				</p>
				<div className='flex gap-1 items-center flex-wrap mt-0.5' onClick={(e) => e.stopPropagation()}>
					<Link to={`/profile/${author.username}`} className='font-bold text-[15px] hover:underline truncate'>
						{author.fullName}
					</Link>
					<span className='text-muted-theme text-[15px] truncate'>@{author.username}</span>
				</div>
				<p className='mt-1 text-[15px] leading-normal whitespace-pre-wrap break-words'>{reply.text}</p>
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
