export const getAuthCookieOptions = (maxAge) => {
	const isCrossOrigin = Boolean(process.env.CLIENT_URL);
	const isProduction = process.env.NODE_ENV !== "development";

	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: isCrossOrigin && isProduction ? "none" : "strict",
		...(maxAge !== undefined && { maxAge }),
	};
};
