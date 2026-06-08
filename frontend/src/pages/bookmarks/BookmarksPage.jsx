import Posts from "../../components/common/Posts";

const BookmarksPage = () => (
	<div className='w-full min-h-screen'>
		<div className='sticky-page-header bg-base-100/80 backdrop-blur-md border-b border-theme px-4 py-3'>
			<h1 className='text-xl font-bold'>Bookmarks</h1>
			<p className='text-sm text-muted-theme mt-0.5'>@you</p>
		</div>
		<Posts feedType='bookmarks' />
	</div>
);

export default BookmarksPage;
