import { useState } from "react";
import { Link } from "react-router-dom";
import { MdOutlineMail, MdPassword } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AuthLayout from "../../../components/auth/AuthLayout";

const LoginPage = () => {
	const [formData, setFormData] = useState({ username: "", password: "" });
	const queryClient = useQueryClient();

	const { mutate: loginMutation, isPending, isError, error } = useMutation({
		mutationFn: async ({ username, password }) => {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to log in");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation(formData);
	};

	return (
		<AuthLayout title='Sign in to Twitter' subtitle='Welcome back.'>
			<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
				<label className='input input-bordered rounded-lg flex items-center gap-2 border-theme h-12'>
					<MdOutlineMail className='text-muted-theme shrink-0' />
					<input
						type='text'
						className='grow bg-transparent text-[17px]'
						placeholder='Username'
						name='username'
						onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
						value={formData.username}
						required
					/>
				</label>

				<label className='input input-bordered rounded-lg flex items-center gap-2 border-theme h-12'>
					<MdPassword className='text-muted-theme shrink-0' />
					<input
						type='password'
						className='grow bg-transparent text-[17px]'
						placeholder='Password'
						name='password'
						onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
						value={formData.password}
						required
					/>
				</label>

				<button
					type='submit'
					disabled={isPending}
					className='btn rounded-full btn-primary text-white font-bold h-12 min-h-12 text-[17px] mt-1'
				>
					{isPending ? "Signing in..." : "Sign in"}
				</button>

				{isError && <p className='text-red-500 text-sm'>{error.message}</p>}
			</form>

			<div className='mt-10'>
				<p className='text-[17px] font-bold mb-4'>Don&apos;t have an account?</p>
				<Link
					to='/signup'
					className='btn rounded-full btn-outline border-primary text-primary hover:bg-primary/10 font-bold h-12 min-h-12 w-full text-[17px]'
				>
					Sign up
				</Link>
			</div>
		</AuthLayout>
	);
};

export default LoginPage;
