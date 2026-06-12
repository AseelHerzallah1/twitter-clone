import { useQuery } from "@tanstack/react-query";
import {
	NOTIFICATION_UNREAD_KEY,
	DM_UNREAD_KEY,
	fetchNotificationUnreadCount,
	fetchDmUnreadCount,
} from "../utils/unreadCounts";

const unreadQueryDefaults = {
	staleTime: 0,
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
	refetchOnMount: true,
	retry: 2,
	networkMode: "always",
	/** Poll so the recipient sees badges without reloading (other users can't invalidate their cache). */
	refetchInterval: 10_000,
};

export const useNotificationUnreadCount = (enabled = true) =>
	useQuery({
		queryKey: NOTIFICATION_UNREAD_KEY,
		queryFn: fetchNotificationUnreadCount,
		enabled,
		...unreadQueryDefaults,
	});

export const useDmUnreadCount = (enabled = true) =>
	useQuery({
		queryKey: DM_UNREAD_KEY,
		queryFn: fetchDmUnreadCount,
		enabled,
		...unreadQueryDefaults,
	});
