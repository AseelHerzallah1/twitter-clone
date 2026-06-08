import { useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart, FaRegComment } from "react-icons/fa6";
import { FaRetweet } from "react-icons/fa";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatPostDate } from "../../utils/db/date/index";

const NOTIFICATION_CONFIG = {
	follow: {
		icon: FaUser,
		iconClass: "text-primary",
		message: "followed you",
	},
	like: {
		icon: FaHeart,
		iconClass: "text-pink-500",
		message: "liked your post",
	},
	retweet: {
		icon: FaRetweet,
		iconClass: "text-green-500",
		message: "retweeted your post",
	},
	comment: {
		icon: FaRegComment,
		iconClass: "text-sky-400",
		message: "commented on your post",
	},
	quote: {
		icon: FaRetweet,
		iconClass: "text-green-500",
		message: "quoted your post",
	},
};

const NotificationPage = () => {
	const queryClient = useQueryClient();

	useEffect(() => {
		fetch("/api/notifications/read", { method: "PATCH" }).then(() => {
			queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
		});
	}, [queryClient]);

	const {data: notifications, isLoading} = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			try {
				const res = await fetch("/api/notifications");
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to fetch notifications");
				return data || [];	
			} catch (error) {
				throw new Error(error);
			}
		}});

	const {mutate: deleteNotifications} = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch("/api/notifications", {
					method: "DELETE",
				});
				const data = await res.json();

				if (!res.ok) throw new Error(data.error || "Failed to delete notifications");
				return data;

			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ["notifications"]});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete notifications");
		}
	});

	return (
		<div className='w-full min-h-screen'>
			<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex justify-between items-center px-4 py-3 border-b border-theme'>
				<p className='font-bold text-xl'>Notifications</p>
				<div className='dropdown dropdown-end'>
					<div tabIndex={0} role='button' className='btn btn-ghost btn-sm btn-circle'>
						<IoSettingsOutline className='w-5 h-5' />
					</div>
					<ul
						tabIndex={0}
						className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-theme'
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
				<div className='text-center p-8 text-slate-500'>No notifications yet</div>
			)}

			{!isLoading && notifications?.map((notification) => {
				const config = NOTIFICATION_CONFIG[notification.type];
				const Icon = config?.icon;
				const formattedDate = formatPostDate(notification.createdAt);

				return (
					<div
						className={`flex gap-3 px-4 py-3 border-b border-theme hover-bg-theme transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
						key={notification._id}
					>
						<div className='w-8 shrink-0 flex justify-center pt-1'>
							{Icon && <Icon className={`w-5 h-5 ${config.iconClass}`} />}
						</div>
						<Link
							to={`/profile/${notification.from.username}`}
							className='flex gap-3 flex-1 min-w-0'
						>
							<div className='avatar shrink-0'>
								<div className='w-10 rounded-full'>
									<img
										src={notification.from.profileImage || "/avatar-placeholder.svg"}
										alt=''
									/>
								</div>
							</div>
							<div className='flex flex-col min-w-0 gap-0.5'>
								<p className='text-sm leading-snug'>
									<span className='font-bold'>{notification.from.fullName || notification.from.username}</span>
									{notification.from.fullName && (
										<span className='text-slate-500'> @{notification.from.username}</span>
									)}
									{" "}
									<span className='text-slate-500'>{config?.message || "interacted with you"}</span>
								</p>
								<span className='text-slate-500 text-sm'>{formattedDate}</span>
							</div>
						</Link>
					</div>
				);
			})}
		</div>
	);
};
export default NotificationPage;
