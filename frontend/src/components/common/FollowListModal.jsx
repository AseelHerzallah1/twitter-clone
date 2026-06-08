import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const FollowListModal = ({ username, type, onClose }) => {
	const { follow, isPending } = useFollow();

	const { data, isLoading } = useQuery({
		queryKey: ["followList", username, type],
		queryFn: async () => {
			const res = await fetch(`/api/users/profile/${username}/${type}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to fetch");
			return data.users;
		},
	});

	const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: () => null, enabled: false });

	return (
		<dialog open className='modal'>
			<div className='modal-box border border-theme rounded-md max-w-sm'>
				<div className='flex justify-between items-center mb-4'>
					<h3 className='font-bold text-lg capitalize'>{type}</h3>
					<button className='btn btn-sm btn-ghost' onClick={onClose}>✕</button>
				</div>
				{isLoading && <div className='flex justify-center py-4'><LoadingSpinner size='lg' /></div>}
				{!isLoading && data?.length === 0 && (
					<p className='text-center text-slate-500 py-4'>No {type} yet</p>
				)}
				{!isLoading && data?.map((user) => (
					<div key={user._id} className='flex items-center justify-between gap-3 py-2'>
						<Link
							to={`/profile/${user.username}`}
							className='flex items-center gap-2'
							onClick={onClose}
						>
							<div className='avatar'>
								<div className='w-9 rounded-full'>
									<img src={user.profileImage || "/avatar-placeholder.svg"} />
								</div>
							</div>
							<div>
								<p className='font-bold text-sm'>{user.fullName}</p>
								<p className='text-slate-500 text-sm'>@{user.username}</p>
							</div>
						</Link>
						{authUser?._id !== user._id && (
							<button
								className='btn btn-primary btn-sm rounded-full text-white'
								onClick={() => follow(user._id)}
								disabled={isPending}
							>
								{authUser?.following?.some(id => id.toString() === user._id.toString()) ? "Unfollow" : "Follow"}
							</button>
						)}
					</div>
				))}
			</div>
			<form method='dialog' className='modal-backdrop' onSubmit={onClose}>
				<button onClick={onClose}>close</button>
			</form>
		</dialog>
	);
};

export default FollowListModal;
