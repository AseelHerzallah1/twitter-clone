import { useCallback, useEffect } from "react";

export const useAutoResizeTextarea = (ref, value, { min = 28, max = 140 } = {}) => {
	const resize = useCallback(() => {
		const el = ref.current;
		if (!el) return;

		el.style.height = "auto";
		const nextHeight = Math.min(Math.max(el.scrollHeight, min), max);
		el.style.height = `${nextHeight}px`;
		el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
	}, [ref, min, max]);

	useEffect(() => {
		resize();
	}, [value, resize]);

	return resize;
};
