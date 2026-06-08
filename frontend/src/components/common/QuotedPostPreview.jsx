import { Link, useLocation } from "react-router-dom";
import PostText from "./PostText";
import { navigationState } from "../../utils/navigation";

const QuotedPostPreview = ({ post, compact = false, onRemove }) => {
	const location = useLocation();
	if (!post?.user) return null;

	return (
		<div
			className={`relative border border-theme rounded-2xl overflow-hidden ${
				compact ? "mt-2" : "mt-3"
			}`}
			onClick={(e) => e.stopPropagation()}
		>
			{onRemove && (
				<button
					type='button'
					onClick={onRemove}
					className='absolute top-2 right-2 z-10 text-muted-theme hover:text-base-content text-lg leading-none'
					aria-label='Remove quote'
				>
					×
				</button>
			)}
			<Link to={`/post/${post._id}`} state={navigationState(location)} className='block p-3 hover-bg-theme transition-colors'>
				<div className='flex items-center gap-1 text-[15px] min-w-0'>
					<span className='font-bold truncate'>{post.user.fullName}</span>
					<span className='text-muted-theme truncate'>@{post.user.username}</span>
				</div>
				{post.text && (
					<PostText text={post.text} className={`text-[15px] mt-1 ${compact ? "line-clamp-3" : ""}`} />
				)}
				{post.img && (
					<div className='mt-2 rounded-xl overflow-hidden border border-theme'>
						<img src={post.img} alt='' className='w-full max-h-40 object-cover' loading='lazy' />
					</div>
				)}
			</Link>
		</div>
	);
};

export default QuotedPostPreview;
