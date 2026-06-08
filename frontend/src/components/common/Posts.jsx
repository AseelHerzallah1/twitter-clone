import { useEffect, useRef } from "react";
import Post from "./Post";
import ProfileReply from "./ProfileReply";
import ProfileMediaGrid from "./ProfileMediaGrid";
import PostSkeleton from "../skeletons/PostSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import FeedEmptyState from "./FeedEmptyState";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 15;
const INFINITE_FEEDS = new Set(["forYou", "following"]);

const getPostEndpoint = (feedType, username, userId) => {
	switch (feedType) {
		case "forYou":
			return "/api/posts/all";
		case "following":
			return "/api/posts/following";
		case "posts":
			return `/api/posts/user/${username}`;
		case "likes":
			return `/api/posts/likes/${userId}`;
		case "replies":
			return `/api/posts/replies/${username}`;
		case "media":
			return `/api/posts/media/${username}`;
		case "bookmarks":
			return "/api/posts/bookmarks";
		default:
			return "/api/posts/all";
	}
};

const extractItems = (feedType, data) =>
	data.posts ||
	data.userPosts ||
	data.likedPosts ||
	data.followingPosts ||
	data.bookmarkedPosts ||
	data.userReplies ||
	data.mediaPosts ||
	[];

const emptyMessage = {
	forYou: "No tweets yet.",
	following: "No tweets from people you follow.",
	bookmarks: "Save tweets for later by tapping the bookmark icon.",
	likes: "No liked tweets yet.",
	replies: "No replies yet.",
	media: "No media yet.",
	posts: "No tweets yet.",
};

const fetchPostsPage = async (endpoint, feedType, cursor) => {
	const url = new URL(endpoint, window.location.origin);
	if (INFINITE_FEEDS.has(feedType)) {
		url.searchParams.set("limit", PAGE_SIZE);
		if (cursor) url.searchParams.set("cursor", cursor);
	}

	const res = await fetch(url.pathname + url.search);
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.error || "Failed to fetch posts");
	}

	return {
		items: extractItems(feedType, data),
		nextCursor: data.nextCursor ?? null,
	};
};

const PostsList = ({ feedType, items }) => {
	if (feedType === "replies") {
		return items.map((reply) => <ProfileReply key={reply._id} reply={reply} />);
	}
	if (feedType === "media") {
		return <ProfileMediaGrid posts={items} />;
	}
	return items.map((post) => <Post key={post._id} post={post} />);
};

const Posts = ({ feedType, username, userId }) => {
	const loadMoreRef = useRef(null);
	const endpoint = getPostEndpoint(feedType, username, userId);
	const isInfiniteFeed = INFINITE_FEEDS.has(feedType);

	const infiniteQuery = useInfiniteQuery({
		queryKey: ["posts", "infinite", feedType, username, userId],
		queryFn: ({ pageParam }) => fetchPostsPage(endpoint, feedType, pageParam),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
		enabled: isInfiniteFeed,
		staleTime: 2 * 60 * 1000,
		placeholderData: (previousData) => previousData,
	});

	const standardQuery = useQuery({
		queryKey: ["posts", feedType, username, userId],
		queryFn: () => fetchPostsPage(endpoint, feedType).then((page) => page.items),
		enabled: !isInfiniteFeed,
	});

	const isLoading = isInfiniteFeed ? infiniteQuery.isLoading : standardQuery.isLoading;
	const isError = isInfiniteFeed ? infiniteQuery.isError : standardQuery.isError;

	const items = isInfiniteFeed
		? infiniteQuery.data?.pages.flatMap((page) => page.items) ?? []
		: Array.isArray(standardQuery.data)
			? standardQuery.data
			: [];
	const hasNextPage = isInfiniteFeed ? infiniteQuery.hasNextPage : false;
	const isFetchingNextPage = isInfiniteFeed ? infiniteQuery.isFetchingNextPage : false;
	const fetchNextPage = isInfiniteFeed ? infiniteQuery.fetchNextPage : () => {};

	useEffect(() => {
		if (!isInfiniteFeed || !hasNextPage || isFetchingNextPage) return;

		const el = loadMoreRef.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) fetchNextPage();
			},
			{ rootMargin: "240px" }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [isInfiniteFeed, hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

	return (
		<>
			{isLoading && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && isError && (
				<p className='text-center my-8 px-4 text-red-500'>Could not load posts. Try refreshing.</p>
			)}
			{!isLoading && !isError && items.length === 0 && (
				INFINITE_FEEDS.has(feedType) ? (
					<FeedEmptyState feedType={feedType} />
				) : (
					<p className='text-center my-8 px-4 text-muted-theme'>
						{emptyMessage[feedType] || "No tweets found."}
					</p>
				)
			)}
			{!isLoading && !isError && items.length > 0 && (
				<div>
					<PostsList feedType={feedType} items={items} />
					{isInfiniteFeed && hasNextPage && (
						<div ref={loadMoreRef} className='flex justify-center py-6'>
							{isFetchingNextPage && <LoadingSpinner size='md' />}
						</div>
					)}
				</div>
			)}
		</>
	);
};

export default Posts;
