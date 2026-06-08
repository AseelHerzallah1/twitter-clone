import TwitterBird from "../svgs/TwitterBird";

import { MdHomeFilled, MdHome } from "react-icons/md";
import { IoNotifications, IoNotificationsOutline, IoSearch, IoMail, IoMailOutline } from "react-icons/io5";
import NavBadge from "./NavBadge";
import { useNotificationUnreadCount, useDmUnreadCount } from "../../hooks/useUnreadCounts";
import { openNest } from "../../utils/openNest";
import { FaUser } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { NavLink } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import ProfileAccountMenu from "./ProfileAccountMenu";
import { openSettings } from "../../utils/openSettings";

const navLinkClass = ({ isActive }) =>
	`flex gap-4 items-center transition-all rounded-full duration-300 py-3 px-4 max-w-fit cursor-pointer ${
		isActive ? "font-bold" : "font-normal hover-bg-theme"
	}`;

const Sidebar = () => {
	const {data:authUser} = useQuery({queryKey: ["authUser"], queryFn: () => null, enabled: false});
	const { data: notifCount = 0 } = useNotificationUnreadCount();
	const { data: dmCount = 0 } = useDmUnreadCount();

	return (
		<aside className='hidden lg:flex shrink-0 w-[275px]'>
			<div className='sticky top-0 h-screen flex flex-col border-r border-theme w-full px-3 bg-base-100'>
				<NavLink to='/' className='flex justify-start mt-1'>
					<TwitterBird className='p-2 w-12 h-12 rounded-full hover-bg-theme fill-primary' />
				</NavLink>
				<ul className='flex flex-col gap-1 mt-2'>
					<li>
						<NavLink to='/' end className={navLinkClass}>
							{({ isActive }) => (
								<>
									{isActive ? <MdHomeFilled className='w-7 h-7' /> : <MdHome className='w-7 h-7' />}
									<span className='text-xl'>Home</span>
								</>
							)}
						</NavLink>
					</li>
					<li>
						<button type='button' onClick={openNest} className='flex gap-4 items-center transition-all rounded-full duration-300 py-3 px-4 max-w-fit cursor-pointer font-normal hover-bg-theme w-full'>
							<TwitterBird className='w-6 h-6 fill-primary' />
							<span className='text-xl'>Nest</span>
						</button>
					</li>
					<li>
						<NavLink to='/search' className={navLinkClass}>
							<IoSearch className='w-6 h-6' />
							<span className='text-xl'>Explore</span>
						</NavLink>
					</li>
					<li>
						<NavLink to='/messages' className={navLinkClass}>
							{({ isActive }) => (
								<>
									<span className='relative'>
										{isActive ? <IoMail className='w-6 h-6' /> : <IoMailOutline className='w-6 h-6' />}
										<NavBadge count={dmCount} />
									</span>
									<span className='text-xl'>Messages</span>
								</>
							)}
						</NavLink>
					</li>
					<li>
						<NavLink to='/bookmarks' className={navLinkClass}>
							{({ isActive }) => (
								<>
									{isActive ? <FaBookmark className='w-6 h-6' /> : <FaRegBookmark className='w-6 h-6' />}
									<span className='text-xl'>Bookmarks</span>
								</>
							)}
						</NavLink>
					</li>
					<li>
						<NavLink to='/notifications' className={navLinkClass}>
							{({ isActive }) => (
								<>
									<span className='relative'>
										{isActive ? <IoNotifications className='w-7 h-7' /> : <IoNotificationsOutline className='w-7 h-7' />}
										<NavBadge count={notifCount} />
									</span>
									<span className='text-xl'>Notifications</span>
								</>
							)}
						</NavLink>
					</li>
					<li>
						<NavLink to={`/profile/${authUser?.username}`} className={navLinkClass}>
							<FaUser className='w-6 h-6' />
							<span className='text-xl'>Profile</span>
						</NavLink>
					</li>
				</ul>
				<div className='mt-2'>
					<button
						type='button'
						onClick={openSettings}
						className='flex gap-4 items-center hover-bg-theme transition-all rounded-full duration-300 py-3 px-4 max-w-fit cursor-pointer'
					>
						<IoSettingsOutline className='w-6 h-6' />
						<span className='text-xl'>Settings</span>
					</button>
				</div>
				{authUser && (
					<ProfileAccountMenu
						authUser={authUser}
						className='relative mt-auto mb-4 hover-bg-theme py-2 px-3 rounded-full transition-colors'
					/>
				)}
			</div>
		</aside>
	);
};
export default Sidebar;
