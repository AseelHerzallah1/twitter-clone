import { useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BackButton from "../../components/common/BackButton";
import Post from "../../components/common/Post";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { navigationState } from "../../utils/navigation";

const PostDetailPage = () => {
	const { id } = useParams();
	const location = useLocation();
	const navigate = useNavigate();
	const redirectHandled = useRef(null);

	useEffect(() => {
		redirectHandled.current = null;
	}, [id]);

	const { data, isLoading, isFetching, error } = useQuery({
		queryKey: ["post", id],
		queryFn: async () => {
			const res = await fetch(`/api/posts/${id}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || "Post not found");
			return json;
		},
		staleTime: 0,
		retry: 1,
	});

	const post = data?.post;
	const pendingRedirect = Boolean(data?.redirect && !post);

	useEffect(() => {
		if (!data?.redirect || redirectHandled.current === id) return;

		const [redirectPath, redirectHash = ""] = data.redirect.split("#");
		const targetHash = redirectHash ? `#${redirectHash}` : "";
		const alreadyThere =
			location.pathname === redirectPath &&
			(location.hash || "") === targetHash;

		if (alreadyThere) {
			redirectHandled.current = id;
			return;
		}

		redirectHandled.current = id;
		navigate(data.redirect, {
			replace: true,
			state: navigationState(location),
		});
	}, [data?.redirect, id, navigate, location.pathname, location.hash, location.state]);

	useEffect(() => {
		if (!post || !location.hash) return;
		const target = document.querySelector(location.hash);
		if (target) {
			target.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}, [post, location.hash]);

	const showLoading = isLoading || (isFetching && !post) || pendingRedirect;

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex items-center gap-6 px-4 py-2 border-b border-theme'>
				<BackButton />
				<h1 className='text-xl font-bold'>Tweet</h1>
			</div>

			{showLoading && (
				<div className='flex justify-center py-16'>
					<LoadingSpinner size='lg' />
				</div>
			)}
			{error && !showLoading && (
				<p className='text-center py-8 text-muted-theme'>Post not found</p>
			)}
			{post && !pendingRedirect && <Post post={post} variant='detail' />}
		</div>
	);
};

export default PostDetailPage;
