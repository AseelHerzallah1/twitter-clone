import { runNestAgent, isNestConfigured } from "../lib/nest/agent.js";

export const getNestStatus = async (req, res) => {
	res.status(200).json({
		enabled: isNestConfigured(),
		name: "Nest",
		model: process.env.OPENAI_MODEL || "gpt-4o-mini",
	});
};

export const nestChat = async (req, res) => {
	try {
		if (!isNestConfigured()) {
			return res.status(503).json({
				message: "Nest is not configured. Add OPENAI_API_KEY to your .env file.",
			});
		}

		const { messages } = req.body;
		if (!messages?.length) {
			return res.status(400).json({ message: "Messages are required" });
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders?.();

		await runNestAgent({
			messages,
			userId: req.user._id,
			res,
		});

		res.end();
	} catch (error) {
		console.error("Error in nestChat:", error);
		if (!res.headersSent) {
			return res.status(500).json({ message: error.message || "Nest error" });
		}
		writeErrorSSE(res, error.message);
		res.end();
	}
};

const writeErrorSSE = (res, message) => {
	res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
};
