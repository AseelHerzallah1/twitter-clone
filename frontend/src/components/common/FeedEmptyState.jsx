import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { navigationState } from "../../utils/navigation";
import SuggestedUsers from "./SuggestedUsers";

const COPY = {
	forYou: {
		title: "Welcome to your timeline",
		body: "When you're ready, share your first post. Or tap a topic below to see what's happening.",
	},
	following: {
		title: "See posts from people you follow",
		body: "Follow a few accounts and their posts will show up here.",
	},
};

const FeedEmptyState = ({ feedType }) => {
	const location = useLocation();
	const copy = COPY[feedType] || COPY.forYou;

	const { data: trends = [] } = useQuery({
		queryKey: ["trends"],
		queryFn: async () => {
			const res = await fetch("/api/search/trends");
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			return data.trends || [];
		},
		staleTime: 5 * 60 * 1000,
	});

	return (
		<div className='px-4 py-8 flex flex-col items-center text-center gap-6'>
			<div className='max-w-sm'>
				<p className='text-4xl mb-3' aria-hidden='true'>
					{feedType === "following" ? "👥" : "🐦"}
				</p>
				<h2 className='font-bold text-xl mb-2'>{copy.title}</h2>
				<p className='text-muted-theme text-[15px] leading-relaxed'>{copy.body}</p>
			</div>

			{trends.length > 0 && (
				<div className='w-full max-w-md'>
					<p className='text-xs font-semibold text-muted-theme uppercase tracking-wide mb-3'>
						{trends.some((t) => t.starter) ? "Topics to explore" : "Trending now"}
					</p>
					<div className='flex flex-wrap justify-center gap-2'>
						{trends.slice(0, 5).map((trend) => (
							<Link
								key={trend.tag}
								to={`/search?q=${encodeURIComponent(trend.tag)}`}
								state={navigationState(location)}
								className='px-3 py-1.5 rounded-full border border-theme bg-base-200 text-[15px] font-medium hover-bg-theme transition-colors'
							>
								{trend.tag}
							</Link>
						))}
					</div>
				</div>
			)}

			{feedType === "following" && (
				<div className='w-full max-w-md'>
					<SuggestedUsers className='border border-theme text-left' />
				</div>
			)}
		</div>
	);
};

export default FeedEmptyState;
