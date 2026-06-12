import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart, FaRegComment } from "react-icons/fa6";
import { FaRetweet } from "react-icons/fa";
import toast from "react-hot-toast";
import { formatPostDate } from "../../utils/db/date/index";
import { getNotificationPath, isNotificationClickable } from "../../utils/notificationLink";
import { navigationState } from "../../utils/navigation";
import {
	invalidateUnreadCounts,
	setNotificationUnreadCount,
} from "../../utils/unreadCounts";

const NOTIFICATION_CONFIG = {
	follow: {
		icon: FaUser,
		iconClass: "text-primary",
		message: "followed you",
	},
	like: {
		icon: FaHeart,
		iconClass: "text-pink-500",
		message: "liked your tweet",
	},
	retweet: {
		icon: FaRetweet,
		iconClass: "text-green-500",
		message: "reposted your tweet",
	},
	comment: {
		icon: FaRegComment,
		iconClass: "text-sky-400",
		message: "replied to your tweet",
	},
	quote: {
		icon: FaRetweet,
		iconClass: "text-green-500",
		message: "quoted your tweet",
	},
};

const getNotificationMessage = (notification) => {
	if (notification.type === "like" && notification.commentId) {
		return "liked your reply";
	}
	return NOTIFICATION_CONFIG[notification.type]?.message || "interacted with you";
};

const NotificationContent = ({ notification, config, Icon, formattedDate }) => {
	const displayName = notification.from?.fullName || notification.from?.username;
	const previewText = notification.replyText || notification.post?.text;
	const message = getNotificationMessage(notification);

	return (
		<>
			<div className='w-7 shrink-0 flex justify-end pt-1'>
				{Icon && <Icon className={`w-[18px] h-[18px] ${config.iconClass}`} />}
			</div>
			<div className='flex gap-3 flex-1 min-w-0'>
				<div className='avatar shrink-0'>
					<div className='w-8 h-8 rounded-full overflow-hidden ring-1 ring-base-content/10'>
						<img
							src={notification.from?.profileImage || "/avatar-placeholder.svg"}
							alt=''
							className='w-full h-full object-cover'
						/>
					</div>
				</div>
				<div className='flex flex-col min-w-0 gap-1 flex-1 pt-0.5'>
					<p className='text-[15px] leading-snug'>
						<span className='font-bold'>{displayName}</span>
						{" "}
						<span className='text-muted-theme font-normal'>{message}</span>
					</p>
					{previewText && (
						<p className='text-[15px] text-muted-theme leading-snug line-clamp-2'>
							{previewText}
						</p>
					)}
					<span className='text-[13px] text-muted-theme/70'>{formattedDate}</span>
				</div>
			</div>
		</>
	);
};

const NotificationPage = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		fetch("/api/notifications/read", { method: "PATCH" })
			.then(() => {
				setNotificationUnreadCount(queryClient, 0);
				invalidateUnreadCounts(queryClient);
			})
			.catch(() => invalidateUnreadCounts(queryClient));
	}, [queryClient]);

	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to fetch notifications");
			return data || [];
		},
	});

	const { mutate: deleteNotifications } = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/notifications", { method: "DELETE" });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to delete notifications");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete notifications");
		},
	});

	const handleNotificationClick = (notification, destination) => {
		if (!destination) {
			if (notification.type !== "follow") {
				toast.error("That tweet is no longer available");
			}
			return;
		}
		navigate(destination, { state: navigationState(location) });
	};

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex justify-between items-center px-4 py-3 border-b border-base-content/10'>
				<p className='font-bold text-xl'>Notifications</p>
				<div className='dropdown dropdown-end'>
					<div tabIndex={0} role='button' className='btn btn-ghost btn-sm btn-circle'>
						<IoSettingsOutline className='w-5 h-5' />
					</div>
					<ul
						tabIndex={0}
						className='dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-2xl w-52 border border-base-content/10'
					>
						<li>
							<button onClick={deleteNotifications}>Delete all notifications</button>
						</li>
					</ul>
				</div>
			</div>

			{isLoading && (
				<div className='flex justify-center py-16'>
					<LoadingSpinner size='lg' />
				</div>
			)}

			{!isLoading && notifications?.length === 0 && (
				<div className='text-center p-8 text-muted-theme'>No notifications yet</div>
			)}

			{!isLoading && notifications?.map((notification) => {
				const config = NOTIFICATION_CONFIG[notification.type];
				const Icon = config?.icon;
				const formattedDate = formatPostDate(notification.createdAt);
				const destination = getNotificationPath(notification);
				const clickable = isNotificationClickable(notification);
				const rowClass = `flex gap-2 px-4 py-3.5 border-b border-base-content/[0.08] transition-colors duration-150 ${
					notification.read !== true ? "bg-primary/[0.04]" : ""
				} ${clickable ? "hover:bg-base-content/[0.03] cursor-pointer" : "cursor-default"}`;

				if (clickable) {
					return (
						<Link key={notification._id} to={destination} state={navigationState(location)} className={rowClass}>
							<NotificationContent
								notification={notification}
								config={config}
								Icon={Icon}
								formattedDate={formattedDate}
							/>
						</Link>
					);
				}

				return (
					<div
						key={notification._id}
						className={rowClass}
						onClick={() => handleNotificationClick(notification, destination)}
						role='presentation'
					>
						<NotificationContent
							notification={notification}
							config={config}
							Icon={Icon}
							formattedDate={formattedDate}
						/>
					</div>
				);
			})}
		</div>
	);
};
export default NotificationPage;
