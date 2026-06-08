import { useState } from "react";

import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";
import SuggestedUsers from "../../components/common/SuggestedUsers";
import TrendsPanel from "../../components/common/TrendsPanel";
const HomePage = () => {
	const [feedType, setFeedType] = useState("forYou");

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md border-b border-theme'>
				<h1 className='hidden lg:block text-xl font-bold px-4 py-3'>Home</h1>
				<div className='flex w-full'>
					<button
						className={`flex justify-center flex-1 py-4 hover-bg-theme transition duration-300 cursor-pointer relative font-medium ${
							feedType === "forYou" ? "font-bold" : "text-muted-theme"
						}`}
						onClick={() => setFeedType("forYou")}
					>
						For you
						{feedType === "forYou" && (
							<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
						)}
					</button>
					<button
						className={`flex justify-center flex-1 py-4 hover-bg-theme transition duration-300 cursor-pointer relative font-medium ${
							feedType === "following" ? "font-bold" : "text-muted-theme"
						}`}
						onClick={() => setFeedType("following")}
					>
						Following
						{feedType === "following" && (
							<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
						)}
					</button>
				</div>
			</div>

			<CreatePost />
			<Posts feedType={feedType} />

			<div className='lg:hidden p-4 flex flex-col gap-4'>
				<TrendsPanel />
				<SuggestedUsers />
			</div>
		</div>
	);
};
export default HomePage;
