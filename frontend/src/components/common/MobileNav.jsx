import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useOpenCompose from "../../hooks/useOpenCompose";
import { HiMenu, HiX } from "react-icons/hi";
import { MdHomeFilled, MdHome } from "react-icons/md";
import { IoNotifications, IoNotificationsOutline, IoSearch, IoMail, IoMailOutline } from "react-icons/io5";
import NavBadge from "./NavBadge";
import { useNotificationUnreadCount, useDmUnreadCount } from "../../hooks/useUnreadCounts";
import { FaUser, FaFeatherAlt } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { IoSettingsOutline } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import ProfileAccountMenu from "./ProfileAccountMenu";

import TwitterBird from "../svgs/TwitterBird";
import SearchBar from "./SearchBar";
import { openNest } from "../../utils/openNest";
import { openSettings } from "../../utils/openSettings";

const MOBILE_NAV_HEIGHT = 53;
const MOBILE_SEARCH_HEIGHT = 44;

const navLinkClass = ({ isActive }) =>
	`flex gap-4 items-center text-xl py-3 px-4 rounded-full transition-colors ${
		isActive ? "font-bold" : "font-normal hover-bg-theme"
	}`;

const headerIconClass = (isActive) =>
	`relative p-1.5 rounded-full transition-colors ${
		isActive ? "text-primary" : "text-base-content hover-bg-theme"
	}`;

const MobileNav = () => {
	const [open, setOpen] = useState(false);
	const location = useLocation();
	const handleCompose = useOpenCompose();

	const { data: authUser } = useQuery({ queryKey: ["authUser"], queryFn: () => null, enabled: false });
	const { data: notifCount = 0 } = useNotificationUnreadCount();
	const { data: dmCount = 0 } = useDmUnreadCount();

	useEffect(() => {
		setOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	const showMobileSearch = location.pathname !== "/search";

	useEffect(() => {
		const offset = showMobileSearch
			? MOBILE_NAV_HEIGHT + MOBILE_SEARCH_HEIGHT
			: MOBILE_NAV_HEIGHT;
		document.documentElement.style.setProperty("--mobile-header-offset", `${offset}px`);
		return () => {
			document.documentElement.style.setProperty("--mobile-header-offset", "53px");
		};
	}, [showMobileSearch]);

	return (
		<>
			<header className='lg:hidden sticky top-0 z-30 bg-base-100/85 backdrop-blur-md border-b border-theme overflow-visible'>
				<div className='relative flex items-center justify-between px-3 h-[53px]'>
					<div className='flex items-center'>
						<button
							onClick={() => setOpen(true)}
							className='p-1.5 rounded-full hover-bg-theme transition-colors'
							aria-label='Open menu'
						>
							<HiMenu className='w-6 h-6' />
						</button>
						<NavLink to='/' end className={({ isActive }) => headerIconClass(isActive)} aria-label='Home'>
							{({ isActive }) =>
								isActive ? <MdHomeFilled className='w-[22px] h-[22px]' /> : <MdHome className='w-[22px] h-[22px]' />
							}
						</NavLink>
					</div>

					<NavLink to='/' className='absolute left-1/2 -translate-x-1/2'>
						<TwitterBird className='w-8 h-8 fill-primary' />
					</NavLink>

					<div className='flex items-center -mr-0.5'>
						<NavLink to='/messages' className={({ isActive }) => headerIconClass(isActive)} aria-label='Messages'>
							{({ isActive }) => (
								<span className='relative flex'>
									{isActive ? <IoMail className='w-[22px] h-[22px]' /> : <IoMailOutline className='w-[22px] h-[22px]' />}
									<NavBadge count={dmCount} compact />
								</span>
							)}
						</NavLink>
						<NavLink to='/notifications' className={({ isActive }) => headerIconClass(isActive)} aria-label='Notifications'>
							{({ isActive }) => (
								<span className='relative flex'>
									{isActive ? <IoNotifications className='w-[22px] h-[22px]' /> : <IoNotificationsOutline className='w-[22px] h-[22px]' />}
									<NavBadge count={notifCount} compact />
								</span>
							)}
						</NavLink>
						<button
							type='button'
							onClick={openNest}
							className={`${headerIconClass(false)} p-1.5`}
							aria-label='Open Nest AI'
						>
							<span className='flex items-center justify-center w-7 h-7 rounded-full bg-primary/15'>
								<TwitterBird className='w-4 h-4 fill-primary' />
							</span>
						</button>
					</div>
				</div>

				{showMobileSearch && (
					<div className='px-3 pb-2.5'>
						<SearchBar compact />
					</div>
				)}
			</header>

			{open && (
				<div className='lg:hidden fixed inset-0 z-50'>
					<div
						className='absolute inset-0 bg-black/40'
						onClick={() => setOpen(false)}
					/>
					<nav className='absolute left-0 top-0 bottom-0 w-[min(280px,85vw)] bg-base-100 border-r border-theme flex flex-col animate-slide-in'>
						<div className='flex items-center justify-between px-4 h-[53px] border-b border-theme'>
							<TwitterBird className='w-8 h-8 fill-primary' />
							<button
								onClick={() => setOpen(false)}
								className='p-2 rounded-full hover-bg-theme transition-colors'
								aria-label='Close menu'
							>
								<HiX className='w-6 h-6' />
							</button>
						</div>

						<div className='flex flex-col gap-1 p-3 flex-1 overflow-y-auto'>
							<NavLink to='/search' className={navLinkClass}>
								<IoSearch className='w-6 h-6' />
								Explore
							</NavLink>
							<NavLink to='/bookmarks' className={navLinkClass}>
								{({ isActive }) => (
									<>
										{isActive ? <FaBookmark className='w-6 h-6' /> : <FaRegBookmark className='w-6 h-6' />}
										Bookmarks
									</>
								)}
							</NavLink>
							<NavLink to={`/profile/${authUser?.username}`} className={navLinkClass}>
								<FaUser className='w-6 h-6' />
								Profile
							</NavLink>

							<button
								type='button'
								onClick={() => { setOpen(false); openSettings(); }}
								className='flex gap-4 items-center text-xl py-3 px-4 rounded-full hover-bg-theme transition-colors mt-2'
							>
								<IoSettingsOutline className='w-6 h-6' />
								Settings
							</button>
						</div>

						{authUser && (
							<div className='p-4 border-t border-theme'>
								<ProfileAccountMenu authUser={authUser} className='relative' />
							</div>
						)}
					</nav>
				</div>
			)}

			<button
				type='button'
				onClick={handleCompose}
				className='app-fab lg:hidden fixed bottom-5 right-5 z-40 flex items-center justify-center rounded-full w-14 h-14'
				aria-label='Compose tweet'
			>
				<FaFeatherAlt className='w-5 h-5 text-white' />
			</button>
		</>
	);
};

export default MobileNav;
