import { useState, useEffect } from "react";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

const EditProfileModal = ({ authUser }) => {
	const [open, setOpen] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		fullName: "",
		username: "",
		email: "",
		bio: "",
		link: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();

	useEffect(() => {
		if (!authUser) return;
		setFormData({
			fullName: authUser.fullName || "",
			username: authUser.username || "",
			email: authUser.email || "",
			bio: authUser.bio || "",
			link: authUser.link || "",
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		});
	}, [authUser, open]);

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (showPassword) {
			if (!formData.currentPassword || !formData.newPassword) return;
			if (formData.newPassword.length < 6) return;
			if (formData.newPassword !== formData.confirmPassword) return;
		}

		const payload = {
			fullName: formData.fullName,
			username: formData.username,
			email: formData.email,
			bio: formData.bio,
			link: formData.link,
		};

		if (showPassword) {
			payload.currentPassword = formData.currentPassword;
			payload.newPassword = formData.newPassword;
		}

		try {
			await updateProfile(payload);
			setOpen(false);
			setShowPassword(false);
		} catch {
			// Error toast handled in hook
		}
	};

	const passwordMismatch =
		showPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword;

	return (
		<>
			<button
				type='button'
				className='btn btn-outline rounded-full btn-sm'
				onClick={() => setOpen(true)}
			>
				Edit profile
			</button>

			{open && (
				<dialog open className='modal modal-open'>
					<div className='modal-box border border-theme rounded-2xl max-w-lg w-full'>
						<h3 className='font-bold text-xl mb-1'>Edit profile</h3>
						<p className='text-muted-theme text-sm mb-5'>Update your public profile and account details.</p>

						<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
							<div>
								<label className='text-sm font-medium mb-1 block'>Name</label>
								<input
									type='text'
									className='w-full input input-bordered rounded-xl'
									value={formData.fullName}
									name='fullName'
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label className='text-sm font-medium mb-1 block'>Username</label>
								<input
									type='text'
									className='w-full input input-bordered rounded-xl'
									value={formData.username}
									name='username'
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label className='text-sm font-medium mb-1 block'>Email</label>
								<input
									type='email'
									className='w-full input input-bordered rounded-xl'
									value={formData.email}
									name='email'
									onChange={handleInputChange}
									required
								/>
							</div>

							<div>
								<label className='text-sm font-medium mb-1 block'>Bio</label>
								<textarea
									className='w-full textarea textarea-bordered rounded-xl min-h-[80px]'
									value={formData.bio}
									name='bio'
									onChange={handleInputChange}
									maxLength={160}
									placeholder='Tell people about yourself'
								/>
								<p className='text-xs text-muted-theme text-right mt-1'>{formData.bio.length}/160</p>
							</div>

							<div>
								<label className='text-sm font-medium mb-1 block'>Website</label>
								<input
									type='url'
									className='w-full input input-bordered rounded-xl'
									value={formData.link}
									name='link'
									onChange={handleInputChange}
									placeholder='https://'
								/>
							</div>

							<div className='border-t border-theme pt-4'>
								{!showPassword ? (
									<button
										type='button'
										onClick={() => setShowPassword(true)}
										className='text-primary text-sm font-medium hover:underline'
									>
										Change password
									</button>
								) : (
									<div className='flex flex-col gap-3'>
										<p className='font-medium text-sm'>Change password</p>
										<input
											type='password'
											placeholder='Current password'
											className='w-full input input-bordered rounded-xl'
											value={formData.currentPassword}
											name='currentPassword'
											onChange={handleInputChange}
											autoComplete='current-password'
										/>
										<input
											type='password'
											placeholder='New password (min. 6 characters)'
											className='w-full input input-bordered rounded-xl'
											value={formData.newPassword}
											name='newPassword'
											onChange={handleInputChange}
											autoComplete='new-password'
										/>
										<input
											type='password'
											placeholder='Confirm new password'
											className='w-full input input-bordered rounded-xl'
											value={formData.confirmPassword}
											name='confirmPassword'
											onChange={handleInputChange}
											autoComplete='new-password'
										/>
										{passwordMismatch && (
											<p className='text-red-500 text-sm'>Passwords do not match</p>
										)}
										<button
											type='button'
											onClick={() => {
												setShowPassword(false);
												setFormData((prev) => ({
													...prev,
													currentPassword: "",
													newPassword: "",
													confirmPassword: "",
												}));
											}}
											className='text-sm text-muted-theme hover:underline self-start'
										>
											Cancel password change
										</button>
									</div>
								)}
							</div>

							<div className='flex gap-2 justify-end pt-2'>
								<button
									type='button'
									className='btn btn-ghost rounded-full'
									onClick={() => setOpen(false)}
								>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-primary rounded-full text-white'
									disabled={
										isUpdatingProfile ||
										passwordMismatch ||
										(showPassword &&
											(!formData.currentPassword ||
												!formData.newPassword ||
												formData.newPassword.length < 6))
									}
								>
									{isUpdatingProfile ? "Saving..." : "Save"}
								</button>
							</div>
						</form>
					</div>
					<form method='dialog' className='modal-backdrop'>
						<button type='button' onClick={() => setOpen(false)}>close</button>
					</form>
				</dialog>
			)}
		</>
	);
};

export default EditProfileModal;
