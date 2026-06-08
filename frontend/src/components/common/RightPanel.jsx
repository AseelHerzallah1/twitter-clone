import SuggestedUsers from "./SuggestedUsers";
import TrendsPanel from "./TrendsPanel";
import SearchBar from "./SearchBar";

const RightPanel = () => (
	<aside className='hidden lg:flex shrink-0 w-[280px] lg:w-[350px] p-2 lg:p-4'>
		<div className='w-full sticky top-4 flex flex-col gap-4'>
			<SearchBar />
			<TrendsPanel />
			<SuggestedUsers />
		</div>
	</aside>
);

export default RightPanel;
