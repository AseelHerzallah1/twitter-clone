import OpenAI from "openai";
import { NEST_SYSTEM_PROMPT } from "./systemPrompt.js";
import { NEST_TOOL_DEFINITIONS, executeNestTool } from "./tools.js";

const getClient = () => {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
	return new OpenAI({ apiKey });
};

const getModel = () => process.env.OPENAI_MODEL || "gpt-4o-mini";

const writeSSE = (res, event, data) => {
	res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const runNestAgent = async ({ messages, userId, res }) => {
	const openai = getClient();
	const model = getModel();

	let fullMessages = [
		{ role: "system", content: NEST_SYSTEM_PROMPT },
		...messages.filter((m) => m.role === "user" || m.role === "assistant"),
	];

	const maxSteps = 6;

	for (let step = 0; step < maxSteps; step++) {
		const completion = await openai.chat.completions.create({
			model,
			messages: fullMessages,
			tools: NEST_TOOL_DEFINITIONS,
			tool_choice: "auto",
		});

		const msg = completion.choices[0].message;

		if (msg.tool_calls?.length) {
			fullMessages.push(msg);
			for (const tc of msg.tool_calls) {
				const args = JSON.parse(tc.function.arguments || "{}");
				const result = await executeNestTool(tc.function.name, args, userId);
				writeSSE(res, "tool", {
					name: tc.function.name,
					summary: result.summary,
				});
				if (tc.function.name === "draft_tweet") {
					writeSSE(res, "draft_hint", { topic: args.topic, tone: args.tone });
				}
				fullMessages.push({
					role: "tool",
					tool_call_id: tc.id,
					content: JSON.stringify(result),
				});
			}
			continue;
		}

		if (msg.content) {
			const words = msg.content.split(/(\s+)/);
			for (const part of words) {
				if (part) writeSSE(res, "token", part);
			}
			writeSSE(res, "draft", { text: extractDraft(msg.content) });
		}
		break;
	}

	writeSSE(res, "done", {});
};

const extractDraft = (content) => {
	const match = content.match(/```tweet\n([\s\S]*?)```/);
	if (match) return match[1].trim().slice(0, 280);
	return null;
};

export const isNestConfigured = () => Boolean(process.env.OPENAI_API_KEY);
