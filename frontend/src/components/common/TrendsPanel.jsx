import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { navigationState } from "../../utils/navigation";

const TrendsPanel = () => {
	const location = useLocation();
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

	const hasStarter = trends.some((t) => t.starter);

	return (
		<div className='bg-base-200 rounded-2xl border border-theme overflow-hidden'>
			<h2 className='font-bold text-xl px-4 py-3'>
				{hasStarter ? "Topics to explore" : "Trends for you"}
			</h2>
			{trends.map((trend) => (
				<Link
					key={trend.tag}
					to={`/search?q=${encodeURIComponent(trend.tag)}`}
					state={navigationState(location)}
					className='block px-4 py-3 hover-bg-theme transition-colors'
				>
					<p className='text-xs text-muted-theme'>
						{trend.starter ? "Get started" : "Trending"}
					</p>
					<p className='font-bold text-[15px]'>{trend.tag}</p>
					<p className='text-xs text-muted-theme'>
						{trend.starter ? "Tap to explore" : `${trend.count} ${trend.count === 1 ? "tweet" : "tweets"}`}
					</p>
				</Link>
			))}
		</div>
	);
};

export default TrendsPanel;
