import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import useLogout from "../../hooks/useLogout";

const ProfileAccountMenu = ({ authUser, className = "" }) => {
	const [open, setOpen] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const containerRef = useRef(null);
	const { mutate: logout, isPending } = useLogout();

	const close = () => {
		setOpen(false);
		setConfirming(false);
	};

	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e) => {
			if (!containerRef.current?.contains(e.target)) close();
		};
		const onKey = (e) => e.key === "Escape" && close();
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const handleLogout = () => logout(undefined, { onSettled: close });

	if (!authUser) return null;

	return (
		<div ref={containerRef} className={`flex gap-2 items-center ${className}`}>
			<Link
				to={`/profile/${authUser.username}`}
				className='flex gap-2 items-center flex-1 min-w-0'
			>
				<div className='avatar shrink-0'>
					<div className='w-10 rounded-full'>
						<img src={authUser.profileImage || "/avatar-placeholder.svg"} alt='' />
					</div>
				</div>
				<div className='min-w-0'>
					<p className='font-bold text-sm truncate'>{authUser.fullName}</p>
					<p className='text-muted-theme text-sm truncate'>@{authUser.username}</p>
				</div>
			</Link>

			<button
				type='button'
				onClick={() => {
					setOpen((prev) => !prev);
					setConfirming(false);
				}}
				className={`p-1.5 rounded-full transition-colors ${
					open ? "bg-base-200 text-base-content" : "hover-bg-theme text-muted-theme"
				}`}
				aria-label='Account menu'
				aria-expanded={open}
			>
				<HiOutlineDotsHorizontal className='w-5 h-5' />
			</button>

			{open && (
				<div className='absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl border border-theme bg-base-100 shadow-2xl overflow-hidden'>
					{confirming ? (
						<>
							<p className='px-4 py-3 text-center text-[15px] font-bold'>
								Log out of @{authUser.username}?
							</p>
							<div className='border-t border-theme'>
								<button
									type='button'
									onClick={handleLogout}
									disabled={isPending}
									className='w-full py-3.5 text-red-500 font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50'
								>
									{isPending ? "Logging out..." : "Log out"}
								</button>
							</div>
							<div className='border-t border-theme'>
								<button
									type='button'
									onClick={() => setConfirming(false)}
									className='w-full py-3.5 font-bold hover-bg-theme transition-colors'
								>
									Cancel
								</button>
							</div>
						</>
					) : (
						<button
							type='button'
							onClick={() => setConfirming(true)}
							className='w-full px-4 py-3 text-left text-[15px] font-bold hover-bg-theme transition-colors'
						>
							Log out @{authUser.username}
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default ProfileAccountMenu;
