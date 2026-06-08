export const streamNestChat = async (messages, onEvent) => {
	const res = await fetch("/api/nest/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ messages }),
		credentials: "include",
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.message || "Failed to reach Nest");
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let currentEvent = "";

	const flushLine = (line) => {
		if (line.startsWith("event: ")) {
			currentEvent = line.slice(7).trim();
		} else if (line.startsWith("data: ") && currentEvent) {
			const raw = line.slice(6);
			let data = raw;
			try {
				data = JSON.parse(raw);
			} catch {
				// token events are plain strings
			}
			onEvent(currentEvent, data);
			currentEvent = "";
		}
	};

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";
		lines.forEach(flushLine);
	}
	if (buffer) buffer.split("\n").forEach(flushLine);
};
