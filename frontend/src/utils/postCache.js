const mapPostsInCache = (oldData, mapper) => {
	if (!oldData) return oldData;

	if (oldData.pages) {
		return {
			...oldData,
			pages: oldData.pages.map((page) => {
				const items = page.items ?? page;
				if (!Array.isArray(items)) return page;
				return { ...page, items: items.map(mapper).filter(Boolean) };
			}),
		};
	}

	if (Array.isArray(oldData)) {
		return oldData.map(mapper).filter(Boolean);
	}

	return oldData;
};

export const updatePostInCache = (queryClient, postId, updater) => {
	const apply = (oldData) =>
		mapPostsInCache(oldData, (p) => (p._id === postId ? updater(p) : p));

	queryClient.setQueriesData({ queryKey: ["posts"] }, apply);
	queryClient.setQueryData(["post", postId], (old) => (old ? updater(old) : old));
};

export const prependPostToFeeds = (queryClient, post) => {
	queryClient.setQueriesData({ queryKey: ["posts", "infinite"] }, (old) => {
		if (!old?.pages?.length) return old;
		const [first, ...rest] = old.pages;
		const items = first.items ?? first;
		if (!Array.isArray(items)) return old;
		if (items.some((p) => p._id === post._id)) return old;
		return { ...old, pages: [{ ...first, items: [post, ...items] }, ...rest] };
	});
};

export const removePostFromFeeds = (queryClient, postId) => {
	const apply = (oldData) =>
		mapPostsInCache(oldData, (p) => (p._id === postId ? null : p));

	queryClient.setQueriesData({ queryKey: ["posts"] }, apply);
	queryClient.removeQueries({ queryKey: ["post", postId] });
};
