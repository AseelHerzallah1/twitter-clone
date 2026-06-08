import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const SuggestedUsers = ({ className = "" }) => {
	const { data: suggestedUsers, isLoading, isError } = useQuery({
		queryKey: ["suggestedUsers"],
		queryFn: async () => {
			const res = await fetch("/api/users/suggested");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch suggested users");
			return data.suggestedUsers;
		},
	});

	const { follow, isPending } = useFollow();

	if (!isLoading && !isError && suggestedUsers?.length === 0) return null;

	return (
		<div className={`bg-base-200 rounded-2xl ${className}`}>
			<div className='p-4'>
				<p className='font-bold text-xl mb-4'>Who to follow</p>
				<div className='flex flex-col gap-4'>
					{isLoading && (
						<>
							<RightPanelSkeleton />
							<RightPanelSkeleton />
							<RightPanelSkeleton />
						</>
					)}
					{isError && (
						<p className='text-sm text-red-400'>Couldn&apos;t load suggestions. Try refreshing.</p>
					)}
					{!isLoading &&
						suggestedUsers?.map((user) => (
							<div className='flex items-center justify-between gap-3' key={user._id}>
								<Link to={`/profile/${user.username}`} className='flex gap-2 items-center min-w-0'>
									<div className='avatar shrink-0'>
										<div className='w-10 rounded-full'>
											<img src={user.profileImage || "/avatar-placeholder.svg"} alt='' />
										</div>
									</div>
									<div className='flex flex-col min-w-0'>
										<span className='font-bold text-sm truncate'>{user.fullName}</span>
										<span className='text-sm text-muted-theme truncate'>@{user.username}</span>
									</div>
								</Link>
								<button
									className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm shrink-0 dark:bg-white'
									onClick={() => follow(user._id)}
									disabled={isPending}
								>
									{isPending ? <LoadingSpinner size='sm' /> : "Follow"}
								</button>
							</div>
						))}
				</div>
			</div>
		</div>
	);
};

export default SuggestedUsers;
