import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Post from "../../components/common/Post";
import SearchBar from "../../components/common/SearchBar";
import BackButton from "../../components/common/BackButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const SearchPage = () => {
	const [params] = useSearchParams();
	const q = params.get("q") || "";

	const { data, isLoading } = useQuery({
		queryKey: ["search", q],
		queryFn: async () => {
			if (!q.trim()) return { users: [], posts: [] };
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json;
		},
		enabled: !!q.trim(),
	});

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md border-b border-theme px-4 py-3'>
				<div className='flex items-center gap-2'>
					<BackButton />
					<div className='flex-1'>
						<SearchBar initialQuery={q} />
					</div>
				</div>
			</div>

			{!q.trim() && (
				<p className='text-center py-12 text-muted-theme'>Try searching for people, posts, or #hashtags</p>
			)}

			{isLoading && (
				<div className='flex justify-center py-16'>
					<LoadingSpinner size='lg' />
				</div>
			)}

			{!isLoading && q.trim() && (
				<>
					{data?.users?.length > 0 && (
						<div className='border-b border-theme'>
							<p className='px-4 py-3 font-bold text-xl'>People</p>
							{data.users.map((user) => (
								<Link
									key={user._id}
									to={`/profile/${user.username}`}
									className='flex gap-3 px-4 py-3 hover-bg-theme transition-colors'
								>
									<img
										src={user.profileImage || "/avatar-placeholder.svg"}
										alt=''
										className='w-10 h-10 rounded-full'
									/>
									<div>
										<p className='font-bold'>{user.fullName}</p>
										<p className='text-muted-theme text-sm'>@{user.username}</p>
									</div>
								</Link>
							))}
						</div>
					)}

					{data?.posts?.length > 0 && (
						<div>
							<p className='px-4 py-3 font-bold text-xl'>Posts</p>
							{data.posts.map((post) => (
								<Post key={post._id} post={post} />
							))}
						</div>
					)}

					{data?.users?.length === 0 && data?.posts?.length === 0 && (
						<p className='text-center py-12 px-4 text-muted-theme'>
							{q.startsWith("#")
								? `No posts with ${q} yet — be the first to tweet about it!`
								: `No results for "${q}"`}
						</p>
					)}
				</>
			)}
		</div>
	);
};

export default SearchPage;
