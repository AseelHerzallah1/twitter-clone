const normalizeId = (id) => id?.toString?.() ?? id;

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

/** Post detail query stores `{ post }` from the API — patch the nested post object. */
export const patchPostDetailQuery = (queryClient, postId, postUpdater) => {
	queryClient.setQueryData(["post", postId], (old) => {
		if (!old) return old;
		if (old.post) {
			return { ...old, post: postUpdater(old.post) };
		}
		return postUpdater(old);
	});
};

export const updatePostInCache = (queryClient, postId, updater) => {
	const targetId = normalizeId(postId);

	const apply = (oldData) =>
		mapPostsInCache(oldData, (p) => {
			if (normalizeId(p._id) === targetId) return updater(p);

			if (p.retweetOf && normalizeId(p.retweetOf._id) === targetId) {
				return { ...p, retweetOf: updater(p.retweetOf) };
			}

			return p;
		});

	queryClient.setQueriesData({ queryKey: ["posts"] }, apply);
	patchPostDetailQuery(queryClient, postId, updater);
};

export const updatePostCommentsInCache = (queryClient, postId, comments) => {
	const patch = (p) => ({
		...p,
		comments,
		replyCount: comments.length,
	});

	updatePostInCache(queryClient, postId, patch);
};

export const prependPostToFeeds = (queryClient, post) => {
	queryClient.setQueriesData({ queryKey: ["posts", "infinite"] }, (old) => {
		if (!old?.pages?.length) return old;
		const [first, ...rest] = old.pages;
		const items = first.items ?? first;
		if (!Array.isArray(items)) return old;
		if (items.some((p) => normalizeId(p._id) === normalizeId(post._id))) return old;
		return { ...old, pages: [{ ...first, items: [post, ...items] }, ...rest] };
	});
};

export const removePostFromFeeds = (queryClient, postId) => {
	const targetId = normalizeId(postId);

	const apply = (oldData) =>
		mapPostsInCache(oldData, (p) => (normalizeId(p._id) === targetId ? null : p));

	queryClient.setQueriesData({ queryKey: ["posts"] }, apply);
	queryClient.removeQueries({ queryKey: ["post", postId] });
};

/** API returns comments as a raw array or `{ comments }` depending on endpoint. */
export const normalizeCommentsResponse = (data) => {
	if (Array.isArray(data)) return data;
	if (Array.isArray(data?.comments)) return data.comments;
	return [];
};
