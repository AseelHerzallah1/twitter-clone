import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "../../components/common/BackButton";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import FollowListModal from "../../components/common/FollowListModal";
import EditProfileModal from "./EditProfileModal";

import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { formatMemberSinceDate } from "../../utils/db/date/index";
import useFollow from "../../hooks/useFollow";
import useStartConversation from "../../hooks/useStartConversation";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import ImageCropModal from "../../components/common/ImageCropModal";

const ProfilePage = () => {
	const [coverImg, setCoverImg] = useState(null);
	const [profileImg, setProfileImg] = useState(null);
	const [cropState, setCropState] = useState(null);
	const [feedType, setFeedType] = useState("posts");
	const [followModal, setFollowModal] = useState(null); // "followers" | "following" | null

	const coverImgRef = useRef(null);
	const profileImgRef = useRef(null);
	const { username } = useParams();

	const { follow, isPending } = useFollow();
	const { mutate: startConversation, isPending: isStartingConvo } = useStartConversation();
	const {data: authUser} = useQuery({queryKey: ["authUser"], queryFn: () => null, enabled: false});

	const {
		data: user,
		isLoading,
	} = useQuery({
		queryKey: ["userProfile", username],
		queryFn: async () => {
			try {
				const res = await fetch(`/api/users/profile/${username}`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Failed to fetch user profile");
				return data.user;
			} catch (error) {
				throw new Error(error);
			}
		}
	});

	const {updateProfile, isUpdatingProfile} = useUpdateUserProfile();

	const isMyProfile = authUser?.username === user?.username;
	const memberSinceDate = formatMemberSinceDate(user?.createdAt);
	const amIFollowing = user?.followers.some(id => id?.toString() === authUser?._id?.toString());


	const handleImgChange = (e, type) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setCropState({ src: reader.result, type });
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	};

	const handleCropComplete = (croppedImage) => {
		if (cropState?.type === "coverImg") setCoverImg(croppedImage);
		if (cropState?.type === "profileImg") setProfileImg(croppedImage);
		setCropState(null);
	};

	const handleSaveImages = async () => {
		const payload = {};
		if (coverImg) payload.coverImage = coverImg;
		if (profileImg) payload.profileImage = profileImg;
		if (Object.keys(payload).length === 0) return;

		await updateProfile(payload);
		setCoverImg(null);
		setProfileImg(null);
	};

	return (
		<>
			<div className='w-full min-h-screen'>
				{/* HEADER */}
				{isLoading && <ProfileHeaderSkeleton />}
				{!isLoading && !user && <p className='text-center text-lg mt-4'>User not found</p>}
				<div className='flex flex-col'>
					{!isLoading && user && (
						<>
							<div className='sticky-page-header bg-base-100/80 backdrop-blur-md flex gap-6 px-4 py-2 items-center border-b border-theme'>
								<BackButton className='hover:bg-base-200 rounded-full p-2 transition-colors' />
								<div className='flex flex-col'>
									<p className='font-bold text-lg leading-tight'>{user?.fullName}</p>
									<span className='text-sm text-muted-theme'>{user?.tweetsCount} Tweets</span>
								</div>
							</div>
							{/* COVER IMG */}
							<div className='relative group/cover'>
								<img
									src={coverImg || user?.coverImage || "/cover.svg"}
									className='h-52 w-full object-cover'
									alt='cover image'
								/>
								{isMyProfile && (
									<div
										className='absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-100 sm:opacity-0 sm:group-hover/cover:opacity-100 transition duration-200'
										onClick={() => coverImgRef.current.click()}
									>
										<MdEdit className='w-5 h-5 text-white' />
									</div>
								)}

								<input
									type='file'
									hidden
									ref={coverImgRef}
									onChange={(e) => handleImgChange(e, "coverImg")}
								/>
								<input
									type='file'
									hidden
									ref={profileImgRef}
									onChange={(e) => handleImgChange(e, "profileImg")}
								/>
								{/* USER AVATAR */}
								<div className='avatar absolute -bottom-16 left-4'>
									<div className='w-32 rounded-full relative group/avatar'>
										<img src={profileImg || user?.profileImage || "/avatar-placeholder.svg"} />
										<div className='absolute top-5 right-3 p-1 bg-primary rounded-full opacity-100 sm:opacity-0 sm:group-hover/avatar:opacity-100 cursor-pointer'>
											{isMyProfile && (
												<MdEdit
													className='w-4 h-4 text-white'
													onClick={() => profileImgRef.current.click()}
												/>
											)}
										</div>
									</div>
								</div>
							</div>
							<div className='flex justify-end flex-wrap gap-2 px-4 mt-5'>
								{isMyProfile && <EditProfileModal authUser={authUser} />}
								{!isMyProfile && (
									<div className='flex gap-2'>
										<button
											className='btn btn-outline rounded-full btn-sm'
											onClick={() => startConversation(user?._id)}
											disabled={isStartingConvo}
										>
											{isStartingConvo ? "..." : "Message"}
										</button>
										<button
											className='btn btn-outline rounded-full btn-sm'
											onClick={() => follow(user?._id)}
										>
											{isPending && "Loading..."}
											{!isPending && amIFollowing && "Unfollow"}
											{!isPending && !amIFollowing && "Follow"}
										</button>
									</div>
								)}
								{(coverImg || profileImg) && (
									<button
										className='btn btn-primary rounded-full btn-sm text-white px-4'
										onClick={handleSaveImages}
										disabled={isUpdatingProfile}
									>
										{isUpdatingProfile ? "Saving..." : "Save"}
									</button>
								)}
							</div>

							<div className='flex flex-col gap-4 mt-14 px-4'>
								<div className='flex flex-col'>
									<span className='font-bold text-lg'>{user?.fullName}</span>
									<span className='text-sm text-slate-500'>@{user?.username}</span>
									<span className='text-sm my-1'>{user?.bio}</span>
								</div>

								<div className='flex gap-2 flex-wrap'>
									{user?.link && (
										<div className='flex gap-1 items-center '>
											<>
												<FaLink className='w-3 h-3 text-slate-500' />
												<a
													href={user?.link}
													target='_blank'
													rel='noreferrer'
													className='text-sm text-blue-500 hover:underline break-all'
												>
													{user?.link}
												</a>
											</>
										</div>
									)}
									<div className='flex gap-2 items-center'>
										<IoCalendarOutline className='w-4 h-4 text-slate-500' />
										<span className='text-sm text-slate-500'>{memberSinceDate}</span>
									</div>
								</div>
								<div className='flex gap-2'>
									<div className='flex gap-1 items-center cursor-pointer hover:underline' onClick={() => setFollowModal("following")}>
										<span className='font-bold text-xs'>{user?.following.length}</span>
										<span className='text-slate-500 text-xs'>Following</span>
									</div>
									<div className='flex gap-1 items-center cursor-pointer hover:underline' onClick={() => setFollowModal("followers")}>
										<span className='font-bold text-xs'>{user?.followers.length}</span>
										<span className='text-slate-500 text-xs'>Followers</span>
									</div>
								</div>
							</div>
							<div className='flex w-full border-b border-theme overflow-x-auto scrollbar-hide'>
								<button
									className={`flex justify-center flex-1 min-w-[4.5rem] shrink-0 whitespace-nowrap py-4 hover-bg-theme transition duration-300 relative cursor-pointer font-medium text-sm sm:text-base ${
										feedType === "posts" ? "font-bold" : "text-muted-theme"
									}`}
									onClick={() => setFeedType("posts")}
								>
									Tweets
									{feedType === "posts" && (
										<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
									)}
								</button>
								<button
									className={`flex justify-center flex-1 min-w-[4.5rem] shrink-0 whitespace-nowrap py-4 hover-bg-theme transition duration-300 relative cursor-pointer font-medium text-sm sm:text-base ${
										feedType === "replies" ? "font-bold" : "text-muted-theme"
									}`}
									onClick={() => setFeedType("replies")}
								>
									Replies
									{feedType === "replies" && (
										<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
									)}
								</button>
								<button
									className={`flex justify-center flex-1 min-w-[4.5rem] shrink-0 whitespace-nowrap py-4 hover-bg-theme transition duration-300 relative cursor-pointer font-medium text-sm sm:text-base ${
										feedType === "media" ? "font-bold" : "text-muted-theme"
									}`}
									onClick={() => setFeedType("media")}
								>
									Media
									{feedType === "media" && (
										<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
									)}
								</button>
								<button
									className={`flex justify-center flex-1 min-w-[4.5rem] shrink-0 whitespace-nowrap py-4 hover-bg-theme transition duration-300 relative cursor-pointer font-medium text-sm sm:text-base ${
										feedType === "likes" ? "font-bold" : "text-muted-theme"
									}`}
									onClick={() => setFeedType("likes")}
								>
									Likes
									{feedType === "likes" && (
										<div className='absolute bottom-0 w-14 h-1 rounded-full bg-primary' />
									)}
								</button>
							</div>
						</>
					)}

					{user && <Posts feedType={feedType} username={user?.username} userId={user?._id}/>}
				</div>
			</div>
			{followModal && (
				<FollowListModal
					username={username}
					type={followModal}
					onClose={() => setFollowModal(null)}
				/>
			)}
			<ImageCropModal
				key={cropState?.src || "crop"}
				open={Boolean(cropState)}
				imageSrc={cropState?.src}
				aspect={cropState?.type === "coverImg" ? 3 : 1}
				title={cropState?.type === "coverImg" ? "Edit cover photo" : "Edit profile photo"}
				onComplete={handleCropComplete}
				onCancel={() => setCropState(null)}
			/>
		</>
	);
};
export default ProfilePage;