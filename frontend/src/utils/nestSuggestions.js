const SUGGESTION_POOL = [
	"What is React?",
	"What is a REST API?",
	"What's trending?",
	"Summarize my notifications",
	"Draft a tweet about my portfolio project",
	"Explain JWT in simple terms",
	"What are React hooks?",
	"Help me write a LinkedIn post",
	"Draft a tweet celebrating a project launch",
	"Search posts about coding",
	"How does MongoDB work?",
	"What's the difference between SQL and NoSQL?",
	"Give me tweet ideas for developers",
	"Explain async/await",
	"What is TypeScript?",
	"Draft a motivational tweet",
	"Summarize what hashtags are trending",
	"How do I explain full-stack dev in a tweet?",
	"What is an API?",
	"Draft a tweet about learning to code",
];

export const pickSuggestions = (count = 4) => {
	const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
};
