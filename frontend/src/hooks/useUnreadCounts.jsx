import { useQuery } from "@tanstack/react-query";

export const useNotificationUnreadCount = () =>
	useQuery({
		queryKey: ["notifications", "unreadCount"],
		queryFn: async () => {
			const res = await fetch("/api/notifications/unread-count");
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			return data.count || 0;
		},
		refetchInterval: 30000,
	});

export const useDmUnreadCount = () =>
	useQuery({
		queryKey: ["dmUnreadCount"],
		queryFn: async () => {
			const res = await fetch("/api/messages/unread-count");
			const data = await res.json();
			if (!res.ok) throw new Error(data.message);
			return data.count || 0;
		},
		refetchInterval: 30000,
	});
