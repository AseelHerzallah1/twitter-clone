import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./LoadingSpinner";

const LikesModal = ({ postId, onClose }) => {
	const { data: likers, isLoading } = useQuery({
		queryKey: ["postLikers", postId],
		queryFn: async () => {
			const res = await fetch(`/api/posts/${postId}/likers`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			return data.likers || [];
		},
		enabled: !!postId,
	});

	return (
		<dialog open className='modal modal-open'>
			<div className='modal-box max-w-md rounded-2xl border border-theme p-0'>
				<div className='px-4 py-3 border-b border-theme font-bold text-lg'>Liked by</div>
				{isLoading && (
					<div className='flex justify-center py-8'>
						<LoadingSpinner />
					</div>
				)}
				{!isLoading && likers?.length === 0 && (
					<p className='text-center py-8 text-muted-theme'>No likes yet</p>
				)}
				<div className='max-h-80 overflow-y-auto'>
					{likers?.map((user) => (
						<Link
							key={user._id}
							to={`/profile/${user.username}`}
							onClick={onClose}
							className='flex gap-3 px-4 py-3 hover-bg-theme transition-colors'
						>
							<img
								src={user.profileImage || "/avatar-placeholder.svg"}
								alt=''
								className='w-10 h-10 rounded-full'
							/>
							<div>
								<p className='font-bold text-[15px]'>{user.fullName}</p>
								<p className='text-muted-theme text-sm'>@{user.username}</p>
							</div>
						</Link>
					))}
				</div>
				<div className='p-4 border-t border-theme'>
					<button type='button' className='btn btn-ghost btn-sm w-full' onClick={onClose}>
						Close
					</button>
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button onClick={onClose}>close</button>
			</form>
		</dialog>
	);
};

export default LikesModal;
