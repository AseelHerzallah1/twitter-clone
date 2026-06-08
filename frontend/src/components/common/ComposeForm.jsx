import { CiImageOn } from "react-icons/ci";
import { useRef, useState, useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import QuotedPostPreview from "./QuotedPostPreview";
import { useAutoResizeTextarea } from "../../hooks/useAutoResizeTextarea";
import { prependPostToFeeds } from "../../utils/postCache";

const MAX_CHARS = 280;
const TEXTAREA_LIMITS = {
	compact: { min: 28, max: 140 },
	modal: { min: 28, max: 160 },
};

const ComposeForm = ({ autoFocus = false, onSuccess, compact = false, quotedPost = null, draftText = null }) => {
	const [text, setText] = useState("");
	const [img, setImg] = useState(null);
	const imgRef = useRef(null);
	const textareaRef = useRef(null);
	const limits = compact ? TEXTAREA_LIMITS.compact : TEXTAREA_LIMITS.modal;
	const resizeTextarea = useAutoResizeTextarea(textareaRef, text, limits);

	const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: () => null, enabled: false });
	const queryClient = useQueryClient();

	useEffect(() => {
		if (autoFocus) {
			setTimeout(() => textareaRef.current?.focus(), 100);
		}
	}, [autoFocus]);

	const [quote, setQuote] = useState(quotedPost);

	useEffect(() => {
		setQuote(quotedPost);
	}, [quotedPost]);

	useEffect(() => {
		if (draftText) setText(draftText);
	}, [draftText]);

	const { mutate: createPost, isPending, isError, error } = useMutation({
		mutationFn: async ({ text, img, quotedPostId }) => {
			const res = await fetch("/api/posts/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text, img, quotedPostId }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create post");
			return data;
		},
		onSuccess: (data) => {
			setText("");
			setImg(null);
			if (imgRef.current) imgRef.current.value = null;
			requestAnimationFrame(resizeTextarea);
			if (data?.post) prependPostToFeeds(queryClient, data.post);
			onSuccess?.();
		},
	});

	const remaining = MAX_CHARS - text.length;
	const overLimit = remaining < 0;

	const handleSubmit = (e) => {
		e.preventDefault();
		if (overLimit || (!text.trim() && !img && !quote)) return;
		createPost({ text, img, quotedPostId: quote?._id });
	};

	const handleImgChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => setImg(reader.result);
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className='flex items-start gap-3'>
			<div className='avatar shrink-0'>
				<div className='w-10 rounded-full'>
					<img src={authUser?.profileImage || "/avatar-placeholder.svg"} alt='' />
				</div>
			</div>
			<form className={`flex flex-col w-full ${compact ? "gap-2" : "gap-3"}`} onSubmit={handleSubmit}>
				<textarea
					ref={textareaRef}
					rows={1}
					className='textarea w-full p-0 resize-none border-none focus:outline-none bg-transparent placeholder:text-muted-theme overflow-hidden text-base sm:text-xl leading-7'
					style={{ height: `${limits.min}px` }}
					placeholder={quote ? "Add a comment!" : "What's happening?"}
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
				{quote && (
					<QuotedPostPreview post={quote} compact onRemove={() => setQuote(null)} />
				)}
				{img && (
					<div className='relative rounded-2xl overflow-hidden border border-theme'>
						<IoCloseSharp
							className='absolute top-2 right-2 z-10 text-white bg-black/60 rounded-full w-6 h-6 cursor-pointer p-0.5'
							onClick={() => {
								setImg(null);
								imgRef.current.value = null;
							}}
						/>
						<img src={img} className='w-full max-h-80 object-cover' alt='Upload preview' />
					</div>
				)}
				<div className={`flex justify-between items-center border-t border-theme ${compact ? "pt-2" : "pt-3"}`}>
					<CiImageOn
						className='fill-primary w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity'
						onClick={() => imgRef.current.click()}
					/>
					<input type='file' accept='image/*' hidden ref={imgRef} onChange={handleImgChange} />
					<div className='flex items-center gap-3'>
						{text.length > 0 && (
							<span className={`text-sm tabular-nums ${overLimit ? "text-red-500" : remaining <= 20 ? "text-yellow-500" : "text-muted-theme"}`}>
								{remaining}
							</span>
						)}
						<button
							type='submit'
							disabled={overLimit || (!text.trim() && !img && !quote) || isPending}
							className='btn btn-primary rounded-full btn-sm text-white px-5 font-bold disabled:opacity-50'
						>
							{isPending ? "Tweeting..." : "Tweet"}
						</button>
					</div>
				</div>
				{isError && <p className='text-red-500 text-sm'>{error.message}</p>}
			</form>
		</div>
	);
};

export default ComposeForm;
