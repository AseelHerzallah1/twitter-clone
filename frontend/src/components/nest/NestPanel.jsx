import { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { useQuery } from "@tanstack/react-query";
import { streamNestChat } from "../../utils/nestChat";
import { openCompose } from "../../utils/openCompose";
import { pickSuggestions } from "../../utils/nestSuggestions";
import {
	getWelcomeMessage,
	getPastConversations,
	saveConversation,
	deleteConversation,
} from "../../utils/nestStorage";
import TwitterBird from "../svgs/TwitterBird";
import NestMessage from "./NestMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatPostDate } from "../../utils/db/date/index";

const TOOL_LABELS = {
	search_posts: "Searching posts",
	search_users: "Searching people",
	get_trends: "Checking trends",
	get_notifications_summary: "Reading notifications",
	get_post_thread: "Loading thread",
	draft_tweet: "Drafting tweet",
};

const NestPanel = () => {
	const [open, setOpen] = useState(false);
	const [view, setView] = useState("chat");
	const [menuOpen, setMenuOpen] = useState(false);
	const [messages, setMessages] = useState([getWelcomeMessage()]);
	const [suggestions, setSuggestions] = useState(() => pickSuggestions());
	const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
	const [pastConversations, setPastConversations] = useState([]);
	const [input, setInput] = useState("");
	const [streaming, setStreaming] = useState(false);
	const [activeTools, setActiveTools] = useState([]);
	const [lastDraft, setLastDraft] = useState(null);
	const [error, setError] = useState(null);
	const bottomRef = useRef(null);
	const menuRef = useRef(null);

	const { data: status } = useQuery({
		queryKey: ["nestStatus"],
		queryFn: async () => {
			const res = await fetch("/api/nest/status");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || data.message || "Failed to check Nest status");
			return data;
		},
		staleTime: 30000,
		refetchOnWindowFocus: true,
	});

	const startNewChat = () => {
		setMessages([getWelcomeMessage()]);
		setSuggestions(pickSuggestions());
		setConversationId(crypto.randomUUID());
		setInput("");
		setError(null);
		setLastDraft(null);
		setActiveTools([]);
		setView("chat");
	};

	const closePanel = () => {
		saveConversation({ id: conversationId, messages });
		setOpen(false);
		setMenuOpen(false);
	};

	const openPanel = () => {
		startNewChat();
		setPastConversations(getPastConversations());
		setOpen(true);
	};

	useEffect(() => {
		const handleOpen = () => openPanel();
		window.addEventListener("open-nest", handleOpen);
		return () => window.removeEventListener("open-nest", handleOpen);
	}, []);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	useEffect(() => {
		window.dispatchEvent(new CustomEvent("nest-panel-change", { detail: { open } }));
	}, [open]);

	useEffect(() => {
		if (!menuOpen) return;
		const handleClick = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [menuOpen]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, activeTools, streaming, view]);

	const sendMessage = async (text) => {
		const trimmed = text.trim();
		if (!trimmed || streaming) return;

		setError(null);
		setLastDraft(null);
		setActiveTools([]);

		const userMsg = { role: "user", content: trimmed };
		const history = [...messages.filter((m) => m.role !== "system"), userMsg];
		setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
		setInput("");
		setStreaming(true);

		try {
			await streamNestChat(
				history.map((m) => ({ role: m.role, content: m.content })),
				(event, data) => {
					if (event === "tool") {
						setActiveTools((prev) => [...prev, TOOL_LABELS[data.name] || data.name]);
					}
					if (event === "token") {
						setMessages((prev) => {
							const next = [...prev];
							const last = next[next.length - 1];
							if (last?.role === "assistant") {
								next[next.length - 1] = { ...last, content: last.content + data };
							}
							return next;
						});
					}
					if (event === "draft" && data?.text) {
						setLastDraft(data.text);
					}
					if (event === "error") {
						setError(data.message);
					}
				}
			);
		} catch (err) {
			setError(err.message);
			setMessages((prev) => {
				const next = [...prev];
				const last = next[next.length - 1];
				if (last?.role === "assistant" && !last.content) {
					next[next.length - 1] = { role: "assistant", content: `Sorry, I couldn't respond. ${err.message}` };
				}
				return next;
			});
		} finally {
			setStreaming(false);
			setActiveTools([]);
		}
	};

	const loadConversation = (convo) => {
		setConversationId(convo.id);
		setMessages(convo.messages);
		setView("chat");
		setMenuOpen(false);
		setError(null);
		setLastDraft(null);
	};

	const handleNewChat = () => {
		saveConversation({ id: conversationId, messages });
		startNewChat();
		setPastConversations(getPastConversations());
		setMenuOpen(false);
	};

	const showSuggestions = !messages.some((m) => m.role === "user") && !streaming && view === "chat";

	if (!open) return null;

	return (
		<div className='fixed inset-0 z-[60] flex justify-end'>
			<div className='absolute inset-0 bg-black/40' onClick={closePanel} />
			<aside className='relative w-full max-w-md h-full bg-base-100 border-l border-theme flex flex-col shadow-2xl animate-slide-in-right'>
				<header className='flex items-center justify-between px-4 py-3 border-b border-theme shrink-0'>
					<div className='flex items-center gap-2'>
						{view === "history" ? (
							<button
								type='button'
								onClick={() => setView("chat")}
								className='text-sm text-primary hover:underline'
							>
								← Back
							</button>
						) : (
							<div className='w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center'>
								<TwitterBird className='w-5 h-5 fill-primary' />
							</div>
						)}
						<div>
							<h2 className='font-bold text-lg leading-tight'>
								{view === "history" ? "Past conversations" : "Nest"}
							</h2>
							{view === "chat" && (
								<p className='text-xs text-muted-theme'>
									{status?.enabled ? `Powered by ${status.model}` : "Add OPENAI_API_KEY to .env and restart backend"}
								</p>
							)}
						</div>
					</div>
					<div className='flex items-center gap-1'>
						<div className='relative' ref={menuRef}>
							<button
								type='button'
								onClick={() => setMenuOpen((o) => !o)}
								className='p-2 rounded-full hover-bg-theme transition-colors'
								aria-label='Nest menu'
							>
								<HiOutlineDotsHorizontal className='w-5 h-5' />
							</button>
							{menuOpen && (
								<div className='absolute top-full right-0 mt-1 w-48 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-20'>
									<button
										type='button'
										className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors'
										onClick={handleNewChat}
									>
										New chat
									</button>
									<button
										type='button'
										className='w-full px-4 py-3 text-left text-[15px] hover-bg-theme transition-colors border-t border-theme'
										onClick={() => {
											setPastConversations(getPastConversations());
											setView("history");
											setMenuOpen(false);
										}}
									>
										Past conversations
									</button>
								</div>
							)}
						</div>
						<button
							type='button'
							onClick={closePanel}
							className='p-2 rounded-full hover-bg-theme transition-colors'
							aria-label='Close Nest'
						>
							<IoClose className='w-5 h-5' />
						</button>
					</div>
				</header>

				{view === "history" ? (
					<div className='flex-1 overflow-y-auto'>
						{pastConversations.length === 0 && (
							<p className='text-center py-12 text-muted-theme px-4'>No past conversations yet</p>
						)}
						{pastConversations.map((convo) => (
							<div
								key={convo.id}
								className='flex items-center gap-2 px-4 py-3 border-b border-theme hover-bg-theme transition-colors'
							>
								<button
									type='button'
									className='flex-1 text-left min-w-0'
									onClick={() => loadConversation(convo)}
								>
									<p className='font-medium text-[15px] truncate'>{convo.title}</p>
									<p className='text-xs text-muted-theme'>{formatPostDate(convo.updatedAt)}</p>
								</button>
								<button
									type='button'
									className='text-xs text-red-500 px-2 py-1 rounded hover:bg-red-500/10'
									onClick={() => {
										deleteConversation(convo.id);
										setPastConversations(getPastConversations());
									}}
								>
									Delete
								</button>
							</div>
						))}
					</div>
				) : (
					<>
						<div className='flex-1 overflow-y-auto px-4 py-4 space-y-4'>
							{messages.map((msg, i) => (
								<div
									key={i}
									className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
											msg.role === "user"
												? "bg-primary text-white rounded-br-sm"
												: "bg-base-200 rounded-bl-sm"
										}`}
									>
										{msg.content ? (
											msg.role === "assistant" ? (
												<NestMessage content={msg.content} />
											) : (
												msg.content
											)
										) : streaming && i === messages.length - 1 ? (
											<span className='inline-flex gap-1 items-center text-muted-theme'>
												<LoadingSpinner size='sm' /> Thinking...
											</span>
										) : null}
									</div>
								</div>
							))}

							{activeTools.length > 0 && (
								<div className='text-xs text-muted-theme space-y-1'>
									{activeTools.map((t, i) => (
										<p key={i} className='flex items-center gap-2'>
											<LoadingSpinner size='sm' /> {t}...
										</p>
									))}
								</div>
							)}

							{lastDraft && (
								<div className='border border-theme rounded-xl p-3 bg-base-200'>
									<p className='text-xs text-muted-theme mb-1'>Tweet draft</p>
									<p className='text-[15px] whitespace-pre-wrap'>{lastDraft}</p>
									<button
										type='button'
										className='btn btn-primary btn-sm rounded-full mt-2 text-white'
										onClick={() => {
											openCompose({ draftText: lastDraft });
											closePanel();
										}}
									>
										Use in Tweet
									</button>
								</div>
							)}

							{error && <p className='text-red-500 text-sm'>{error}</p>}
							<div ref={bottomRef} />
						</div>

						{showSuggestions && (
							<div className='px-4 pb-2 flex flex-wrap gap-2'>
								{suggestions.map((s) => (
									<button
										key={s}
										type='button'
										onClick={() => sendMessage(s)}
										className='text-sm px-3 py-1.5 rounded-full border border-theme hover-bg-theme transition-colors'
									>
										{s}
									</button>
								))}
							</div>
						)}
					</>
				)}

				{view === "chat" && (
					<form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className='p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-theme shrink-0'>
						<div className='flex gap-2'>
							<input
								type='text'
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder='Ask Nest anything...'
								disabled={streaming || !status?.enabled}
								className='flex-1 bg-base-200 rounded-full px-4 py-2.5 text-[15px] border border-transparent focus:outline-none focus:border-primary disabled:opacity-50'
							/>
							<button
								type='submit'
								disabled={!input.trim() || streaming || !status?.enabled}
								className='btn btn-primary rounded-full btn-sm text-white px-4 font-bold disabled:opacity-50'
							>
								Ask
							</button>
						</div>
					</form>
				)}
			</aside>
		</div>
	);
};

export default NestPanel;
