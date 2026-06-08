import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdOutlineMail, MdPassword, MdDriveFileRenameOutline } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AuthLayout from "../../../components/auth/AuthLayout";

const SignUpPage = () => {
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		fullName: "",
		password: "",
	});

	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { mutate, isError, isPending, error } = useMutation({
		mutationFn: async ({ email, username, fullName, password }) => {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, username, fullName, password }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create account");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			navigate("/");
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		mutate(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const inputClass =
		"input input-bordered rounded-lg flex items-center gap-2 border-theme h-12";

	return (
		<AuthLayout title='Create your account' subtitle='Join Twitter today.'>
			<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
				<label className={inputClass}>
					<MdOutlineMail className='text-muted-theme shrink-0' />
					<input
						type='email'
						className='grow bg-transparent text-[17px]'
						placeholder='Email'
						name='email'
						onChange={handleInputChange}
						value={formData.email}
						required
					/>
				</label>
				<label className={inputClass}>
					<FaUser className='text-muted-theme shrink-0 w-4' />
					<input
						type='text'
						className='grow bg-transparent text-[17px]'
						placeholder='Username'
						name='username'
						onChange={handleInputChange}
						value={formData.username}
						required
					/>
				</label>
				<label className={inputClass}>
					<MdDriveFileRenameOutline className='text-muted-theme shrink-0' />
					<input
						type='text'
						className='grow bg-transparent text-[17px]'
						placeholder='Full Name'
						name='fullName'
						onChange={handleInputChange}
						value={formData.fullName}
						required
					/>
				</label>
				<label className={inputClass}>
					<MdPassword className='text-muted-theme shrink-0' />
					<input
						type='password'
						className='grow bg-transparent text-[17px]'
						placeholder='Password'
						name='password'
						onChange={handleInputChange}
						value={formData.password}
						required
					/>
				</label>

				<button
					type='submit'
					disabled={isPending}
					className='btn rounded-full btn-primary text-white font-bold h-12 min-h-12 text-[17px] mt-1'
				>
					{isPending ? "Creating account..." : "Sign up"}
				</button>

				{isError && <p className='text-red-500 text-sm'>{error.message}</p>}
			</form>

			<div className='mt-10'>
				<p className='text-[17px] font-bold mb-4'>Already have an account?</p>
				<Link
					to='/login'
					className='btn rounded-full btn-outline border-primary text-primary hover:bg-primary/10 font-bold h-12 min-h-12 w-full text-[17px]'
				>
					Sign in
				</Link>
			</div>
		</AuthLayout>
	);
};

export default SignUpPage;
