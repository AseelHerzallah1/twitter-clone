import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	useNotificationUnreadCount,
	useDmUnreadCount,
} from "../../hooks/useUnreadCounts";
import { invalidateUnreadCounts } from "../../utils/unreadCounts";

/** Keeps notification + DM badge counts fresh while the user is logged in. */
const UnreadCountsSync = () => {
	const queryClient = useQueryClient();

	useNotificationUnreadCount(true);
	useDmUnreadCount(true);

	useEffect(() => {
		const refetch = () => invalidateUnreadCounts(queryClient, { refetchType: "active" });

		refetch();

		window.addEventListener("focus", refetch);
		const onVisibility = () => {
			if (document.visibilityState === "visible") refetch();
		};
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			window.removeEventListener("focus", refetch);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [queryClient]);

	return null;
};

export default UnreadCountsSync;
