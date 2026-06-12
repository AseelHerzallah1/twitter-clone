import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa6";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatPostDate } from "../../utils/db/date/index";
import { invalidateUnreadCounts } from "../../utils/unreadCounts";

const ConversationView = ({ conversationId, onBack }) => {
	const [text, setText] = useState("");
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: () => null, enabled: false });

	const { data, isLoading } = useQuery({
		queryKey: ["messages", conversationId],
		queryFn: async () => {
			const res = await fetch(`/api/messages/${conversationId}`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json;
		},
		refetchInterval: 5000,
	});

	const invalidateMessageQueries = () => {
		queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
		queryClient.invalidateQueries({ queryKey: ["conversations"] });
		invalidateUnreadCounts(queryClient);
	};

	const { mutate: send, isPending } = useMutation({
		mutationFn: async (messageText) => {
			const res = await fetch(`/api/messages/${conversationId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: messageText }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json;
		},
		onSuccess: () => {
			setText("");
			invalidateMessageQueries();
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		if (text.trim() && !isPending) send(text.trim());
	};

	if (isLoading) {
		return (
			<div className='flex justify-center py-16'>
				<LoadingSpinner size='lg' />
			</div>
		);
	}

	const { messages = [], otherUser } = data || {};

	return (
		<div className='flex flex-col h-[calc(100vh-var(--mobile-header-offset,53px))] lg:h-screen'>
			<div className='sticky top-0 z-10 bg-base-100/80 backdrop-blur-md flex items-center gap-4 px-4 py-3 border-b border-theme'>
				<button type='button' onClick={onBack} className='p-2 -ml-2 rounded-full hover-bg-theme lg:hidden'>
					<FaArrowLeft className='w-4 h-4' />
				</button>
				<Link to={`/profile/${otherUser?.username}`} className='flex items-center gap-3 flex-1 min-w-0'>
					<img src={otherUser?.profileImage || "/avatar-placeholder.svg"} alt='' className='w-8 h-8 rounded-full' />
					<span className='font-bold truncate'>{otherUser?.fullName}</span>
				</Link>
			</div>

			<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3'>
				{messages.length === 0 && (
					<p className='text-center text-muted-theme text-sm py-8'>No messages yet. Say hello!</p>
				)}
				{messages.map((msg) => {
					const mine = msg.sender._id?.toString() === authUser?._id?.toString();

					return (
						<div key={msg._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[75%] px-4 py-2 rounded-2xl text-[15px] ${
									mine ? "bg-primary text-white rounded-br-sm" : "bg-base-200 rounded-bl-sm"
								}`}
							>
								{msg.text}
							</div>
						</div>
					);
				})}
			</div>

			<form onSubmit={handleSubmit} className='flex gap-2 px-4 py-3 border-t border-theme'>
				<input
					type='text'
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder='Start a message'
					className='flex-1 bg-base-200 rounded-full px-4 py-2 text-[15px] border border-transparent focus:outline-none focus:border-primary'
				/>
				<button
					type='submit'
					disabled={!text.trim() || isPending}
					className='btn btn-primary btn-circle btn-sm text-white border-none'
				>
					<FaPaperPlane className='w-3.5 h-3.5' />
				</button>
			</form>
		</div>
	);
};

const ConversationListItem = ({ convo, isActive, onSelect, onDeleteRequest, menuOpen, onMenuToggle }) => {
	const menuRef = useRef(null);

	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = (e) => {
			if (!menuRef.current?.contains(e.target)) onMenuToggle(null);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen, onMenuToggle]);

	return (
		<div
			className={`relative flex items-center gap-2 px-4 py-3 border-b border-theme transition-colors ${
				isActive ? "bg-base-200" : "hover-bg-theme"
			}`}
		>
			<button
				type='button'
				onClick={() => onSelect(convo._id)}
				className='flex gap-3 flex-1 min-w-0 text-left'
			>
				<img
					src={convo.otherUser?.profileImage || "/avatar-placeholder.svg"}
					alt=''
					className='w-12 h-12 rounded-full shrink-0'
				/>
				<div className='min-w-0 flex-1'>
					<div className='flex justify-between gap-2'>
						<p className='font-bold truncate'>{convo.otherUser?.fullName}</p>
						<span className='text-xs text-muted-theme shrink-0'>
							{formatPostDate(convo.lastMessageAt)}
						</span>
					</div>
					{convo.lastMessage && (
						<p className='text-sm text-muted-theme truncate mt-0.5'>{convo.lastMessage}</p>
					)}
				</div>
			</button>

			<span className='relative shrink-0' ref={menuRef}>
				<button
					type='button'
					onClick={(e) => {
						e.stopPropagation();
						onMenuToggle(menuOpen ? null : convo._id);
					}}
					className={`p-1.5 rounded-full transition-colors ${
						menuOpen ? "bg-base-300 text-base-content" : "hover-bg-theme text-muted-theme"
					}`}
					aria-label='Conversation options'
					aria-expanded={menuOpen}
				>
					<HiOutlineDotsHorizontal className='w-5 h-5' />
				</button>
				{menuOpen && (
					<div className='absolute top-full right-0 mt-1 w-52 bg-base-100 border border-theme rounded-xl shadow-lg overflow-hidden z-30'>
						<button
							type='button'
							className='w-full px-4 py-3 text-left text-[15px] font-bold text-red-500 hover:bg-red-500/10 transition-colors'
							onClick={(e) => {
								e.stopPropagation();
								onMenuToggle(null);
								onDeleteRequest(convo._id);
							}}
						>
							Delete conversation
						</button>
					</div>
				)}
			</span>
		</div>
	);
};

const MessagesPage = () => {
	const [params] = useSearchParams();
	const [activeId, setActiveId] = useState(params.get("c"));
	const [openMenuId, setOpenMenuId] = useState(null);
	const [confirmDeleteId, setConfirmDeleteId] = useState(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		const c = params.get("c");
		if (c) setActiveId(c);
	}, [params]);

	const { data: conversations = [], isLoading } = useQuery({
		queryKey: ["conversations"],
		queryFn: async () => {
			const res = await fetch("/api/messages");
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json.conversations || [];
		},
		refetchInterval: 10_000,
		staleTime: 0,
	});

	const { mutate: deleteConversation } = useMutation({
		mutationFn: async (conversationId) => {
			const res = await fetch(`/api/messages/${conversationId}`, { method: "DELETE" });
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json;
		},
		onSuccess: (_, conversationId) => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			invalidateUnreadCounts(queryClient);
			if (activeId === conversationId) setActiveId(null);
			setConfirmDeleteId(null);
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<div className='w-full min-h-screen flex'>
			<div className={`w-full lg:w-[350px] lg:border-r border-theme ${activeId ? "hidden lg:block" : ""}`}>
				<div className='sticky-page-header bg-base-100/80 backdrop-blur-md px-4 py-3 border-b border-theme'>
					<h1 className='font-bold text-xl'>Messages</h1>
				</div>
				{isLoading && (
					<div className='flex justify-center py-16'>
						<LoadingSpinner />
					</div>
				)}
				{!isLoading && conversations.length === 0 && (
					<p className='text-center py-12 text-muted-theme px-4'>
						No messages yet. Visit a profile and start a conversation.
					</p>
				)}
				{conversations.map((convo) => (
					<ConversationListItem
						key={convo._id}
						convo={convo}
						isActive={activeId === convo._id}
						onSelect={setActiveId}
						onDeleteRequest={setConfirmDeleteId}
						menuOpen={openMenuId === convo._id}
						onMenuToggle={setOpenMenuId}
					/>
				))}
			</div>

			<div className={`flex-1 ${!activeId ? "hidden lg:flex" : "flex"} items-center justify-center`}>
				{activeId ? (
					<div className='w-full h-full'>
						<ConversationView conversationId={activeId} onBack={() => setActiveId(null)} />
					</div>
				) : (
					<p className='text-muted-theme hidden lg:block'>Select a message</p>
				)}
			</div>

			{confirmDeleteId && (
				<ConfirmDialog
					title='Delete conversation?'
					message='This will permanently delete this entire conversation and all messages in it.'
					confirmLabel='Delete'
					onConfirm={() => deleteConversation(confirmDeleteId)}
					onCancel={() => setConfirmDeleteId(null)}
				/>
			)}
		</div>
	);
};

export default MessagesPage;
