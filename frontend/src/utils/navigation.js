/** Preserve the original page when drilling into posts — avoids post↔post back loops. */
export const navigationState = (location) => ({
	from: location.state?.from ?? `${location.pathname}${location.search}${location.hash}`,
});

export const isPostPath = (path) => Boolean(path?.startsWith("/post/"));
