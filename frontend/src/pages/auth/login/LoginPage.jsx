import { useState, useEffect } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { Link } from "react-router-dom";

import TwitterBird from "../../../components/svgs/TwitterBird";

import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";
import {useMutation} from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

const LoginPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "black");
	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
	}, [theme]);
	const toggleTheme = () => setTheme(theme === "black" ? "light" : "black");

	const queryClient = useQueryClient();

	const {
		mutate:loginMutation,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationFn: async({username, password}) => {
			try {
				const res = await fetch("/api/auth/login", {
					method: "POST",
					headers:{
						"Content-Type": "application/json"
					},
					body: JSON.stringify({username, password})
				});

				const data = await res.json();
				if(!res.ok) throw new Error(data.error || "Failed to log in");
			} catch (error) {
				console.error(error);
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
		<div className='max-w-screen-xl mx-auto flex h-screen relative'>
			<button onClick={toggleTheme} className='absolute top-4 right-4 btn btn-ghost btn-circle'>
				{theme === "black" ? <MdLightMode className='w-5 h-5' /> : <MdDarkMode className='w-5 h-5' />}
			</button>
			<div className='flex-1 hidden lg:flex flex-col items-center justify-center px-8'>
				<TwitterBird className='w-80 fill-primary' />
				<h2 className='text-6xl font-bold mt-12 max-w-md leading-tight'>
					See what&apos;s happening in the world right now.
				</h2>
			</div>
			<div className='flex-1 flex flex-col justify-center items-center px-8'>
				<div className='w-full max-w-sm'>
					<TwitterBird className='w-12 h-12 lg:hidden fill-primary mb-6' />
					<h1 className='text-4xl font-bold mb-8'>Happening now</h1>
					<h2 className='text-2xl font-bold mb-6'>Join today.</h2>
					<form className='flex gap-4 flex-col' onSubmit={handleSubmit}>
						<label className='input input-bordered rounded flex items-center gap-2 border-theme'>
							<MdOutlineMail />
							<input
								type='text'
								className='grow'
								placeholder='Username'
								name='username'
								onChange={handleInputChange}
								value={formData.username}
							/>
						</label>

						<label className='input input-bordered rounded flex items-center gap-2 border-theme'>
							<MdPassword />
							<input
								type='password'
								className='grow'
								placeholder='Password'
								name='password'
								onChange={handleInputChange}
								value={formData.password}
							/>
						</label>
						<button className='btn rounded-full btn-primary text-white font-bold'>
							{isPending ? "Signing in..." : "Sign in"}
						</button>
						{isError && <p className='text-red-500'>{error.message}</p>}
					</form>
					<div className='flex flex-col gap-2 mt-8'>
						<p className="text-lg font-bold">Don&apos;t have an account?</p>
						<Link to='/signup'>
							<button className='btn rounded-full btn-primary text-white btn-outline w-full font-bold'>Sign up</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
export default LoginPage;
