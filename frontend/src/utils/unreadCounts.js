/** Badge count — separate key so list invalidation doesn't race with the count query. */
export const NOTIFICATION_UNREAD_KEY = ["notificationUnreadCount"];
export const DM_UNREAD_KEY = ["dmUnreadCount"];

export const fetchNotificationUnreadCount = async () => {
	const res = await fetch("/api/notifications/unread-count");
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to fetch notification count");
	return data.count ?? 0;
};

export const fetchDmUnreadCount = async () => {
	const res = await fetch("/api/messages/unread-count");
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to fetch message count");
	return data.count ?? 0;
};

export const invalidateUnreadCounts = (queryClient, { refetchType = "active" } = {}) => {
	queryClient.invalidateQueries({ queryKey: NOTIFICATION_UNREAD_KEY, refetchType });
	queryClient.invalidateQueries({ queryKey: DM_UNREAD_KEY, refetchType });
};

export const setNotificationUnreadCount = (queryClient, count) => {
	queryClient.setQueryData(NOTIFICATION_UNREAD_KEY, count);
};

export const setDmUnreadCount = (queryClient, count) => {
	queryClient.setQueryData(DM_UNREAD_KEY, count);
};
