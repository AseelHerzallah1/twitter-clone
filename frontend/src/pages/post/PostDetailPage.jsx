import { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BackButton from "../../components/common/BackButton";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PostDetailPage = () => {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();

	const { data, isLoading, error } = useQuery({
		queryKey: ["post", id],
		queryFn: async () => {
			const res = await fetch(`/api/posts/${id}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || "Post not found");
			return json;
		},
		staleTime: 0,
	});

	const post = data?.post;

	useEffect(() => {
		if (!data?.redirect) return;
		navigate(data.redirect, { replace: true, state: location.state });
	}, [data?.redirect, navigate, location.state]);

	useEffect(() => {
		if (!post || !location.hash) return;
		const target = document.querySelector(location.hash);
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [post, location.hash]);

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex items-center gap-6 px-4 py-2 border-b border-theme'>
				<BackButton />
				<h1 className='text-xl font-bold'>Tweet</h1>
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
