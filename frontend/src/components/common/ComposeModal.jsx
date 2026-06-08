import { useEffect, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import ComposeForm from "./ComposeForm";

const ComposeModal = () => {
	const dialogRef = useRef(null);
	const [formKey, setFormKey] = useState(0);
	const [quotedPost, setQuotedPost] = useState(null);
	const [draftText, setDraftText] = useState(null);

	const close = () => {
		dialogRef.current?.close();
		setQuotedPost(null);
		setDraftText(null);
	};

	useEffect(() => {
		const handleOpen = (e) => {
			setQuotedPost(e.detail?.quotedPost || null);
			setDraftText(e.detail?.draftText || null);
			setFormKey((k) => k + 1);
			dialogRef.current?.showModal();
		};
		window.addEventListener("open-compose", handleOpen);
		return () => window.removeEventListener("open-compose", handleOpen);
	}, []);

	return (
		<dialog ref={dialogRef} className='modal modal-bottom sm:modal-middle'>
			<div className='modal-box w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-theme bg-base-100 p-0'>
				<div className='flex items-center justify-between px-4 py-3 border-b border-theme'>
					<button
						type='button'
						onClick={close}
						className='p-2 -ml-2 rounded-full hover-bg-theme transition-colors'
						aria-label='Close'
					>
						<IoClose className='w-5 h-5' />
					</button>
				</div>
				<div className='p-4'>
					<ComposeForm key={formKey} autoFocus quotedPost={quotedPost} draftText={draftText} onSuccess={close} />
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button className='outline-none' aria-label='Close'>close</button>
			</form>
		</dialog>
	);
};

export default ComposeModal;
