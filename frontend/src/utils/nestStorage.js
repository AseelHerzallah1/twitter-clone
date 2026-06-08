const STORAGE_KEY = "nest_conversations";
const MAX_CONVERSATIONS = 25;

export const getWelcomeMessage = () => ({
	role: "assistant",
	content: "Hey — I'm Nest 🪺 Your assistant in this timeline. Ask me anything, search posts, check trends, summarize notifications, or draft tweets!",
});

export const getPastConversations = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
};

export const saveConversation = (conversation) => {
	const hasUser = conversation.messages?.some((m) => m.role === "user");
	if (!hasUser) return;

	const all = getPastConversations().filter((c) => c.id !== conversation.id);
	const title =
		conversation.messages.find((m) => m.role === "user")?.content.slice(0, 60) || "Chat";

	all.unshift({
		id: conversation.id,
		title,
		messages: conversation.messages,
		updatedAt: Date.now(),
	});

	localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_CONVERSATIONS)));
};

export const deleteConversation = (id) => {
	const all = getPastConversations().filter((c) => c.id !== id);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};
