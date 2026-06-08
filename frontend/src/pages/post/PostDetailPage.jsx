import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BackButton from "../../components/common/BackButton";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PostDetailPage = () => {
	const { id } = useParams();

	const { data: post, isLoading, error } = useQuery({
		queryKey: ["post", id],
		queryFn: async () => {
			const res = await fetch(`/api/posts/${id}`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Post not found");
			return data.post;
		},
	});

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex items-center gap-6 px-4 py-2 border-b border-theme'>
				<BackButton />
				<h1 className='text-xl font-bold'>Post</h1>
			</div>

			{isLoading && (
				<div className='flex justify-center py-16'>
					<LoadingSpinner size='lg' />
				</div>
			)}
			{error && <p className='text-center py-8 text-muted-theme'>Post not found</p>}
			{post && <Post post={post} variant='detail' />}
		</div>
	);
};

export default PostDetailPage;
