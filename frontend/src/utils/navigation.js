/** Preserve the original page when drilling into posts — avoids post↔post back loops. */
export const isPostPath = (path) => Boolean(path?.startsWith("/post/"));

export const navigationState = (location) => {
	const inherited = location.state?.from;

	// Keep the first non-post page in the chain (home, profile, etc.)
	if (inherited && !isPostPath(inherited)) {
		return { from: inherited };
	}

	const current = `${location.pathname}${location.search}${location.hash}`;
	if (!isPostPath(current)) {
		return { from: current };
	}

	return { from: "/" };
};
