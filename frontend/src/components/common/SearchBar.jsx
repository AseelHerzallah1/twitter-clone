import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { navigationState } from "../../utils/navigation";
import { IoSearch } from "react-icons/io5";
import { HiHashtag } from "react-icons/hi";
import LoadingSpinner from "./LoadingSpinner";

const useDebouncedValue = (value, delay = 300) => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};

const SearchBar = ({ className = "", compact = false, onNavigate, initialQuery = "" }) => {
	const [query, setQuery] = useState(initialQuery);
	const [open, setOpen] = useState(false);
	const wrapperRef = useRef(null);
	const navigate = useNavigate();
	const location = useLocation();
	const debouncedQuery = useDebouncedValue(query.trim());

	useEffect(() => {
		setQuery(initialQuery);
	}, [initialQuery]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const { data, isFetching } = useQuery({
		queryKey: ["searchSuggest", debouncedQuery],
		queryFn: async () => {
			const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&suggest=1`);
			const json = await res.json();
			if (!res.ok) throw new Error(json.message);
			return json;
		},
		enabled: debouncedQuery.length >= 1 && open,
		staleTime: 30_000,
	});

	const goToSearch = (term) => {
		const value = (term ?? query).trim();
		if (!value) return;
		setOpen(false);
		onNavigate?.();
		navigate(`/search?q=${encodeURIComponent(value)}`, { state: navigationState(location) });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		goToSearch();
	};

	const goToProfile = (username) => {
		setOpen(false);
		setQuery("");
		onNavigate?.();
		navigate(`/profile/${username}`, { state: navigationState(location) });
	};

	const goToPost = (postId) => {
		setOpen(false);
		onNavigate?.();
		navigate(`/post/${postId}`, { state: navigationState(location) });
	};

	const users = data?.users?.slice(0, 5) ?? [];
	const posts = data?.posts?.slice(0, 3) ?? [];
	const showDropdown = open && query.trim().length >= 1;
	const hasResults = users.length > 0 || posts.length > 0;
	const showHashtag = query.trim().startsWith("#");

	return (
		<form onSubmit={handleSubmit} className={className}>
			<div ref={wrapperRef} className='relative'>
				<IoSearch
					className={`absolute top-1/2 -translate-y-1/2 text-muted-theme pointer-events-none z-10 ${
						compact ? "left-3 w-4 h-4" : "left-4 w-5 h-5"
					}`}
				/>
				<input
					type='text'
					placeholder='Search Twitter'
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					autoComplete='off'
					className={`w-full bg-base-200 rounded-full border border-transparent focus:outline-none focus:border-primary focus:bg-base-100 transition-colors ${
						compact ? "py-2 pl-9 pr-3 text-sm" : "py-3 pl-12 pr-4 text-[15px]"
					}`}
				/>

				{showDropdown && (
					<div
						className={`absolute left-0 right-0 mt-1 bg-base-100 border border-theme rounded-2xl shadow-xl overflow-hidden z-50 ${
							compact ? "max-h-[min(70vh,360px)]" : "max-h-[min(70vh,420px)]"
						} overflow-y-auto`}
					>
						<button
							type='button'
							onClick={() => goToSearch()}
							className='w-full flex items-center gap-3 px-4 py-3 hover-bg-theme transition-colors text-left border-b border-theme'
						>
							<IoSearch className='w-5 h-5 text-muted-theme shrink-0' />
							<span className='text-[15px]'>
								Search for <span className='font-bold'>"{query.trim()}"</span>
							</span>
						</button>

						{showHashtag && (
							<button
								type='button'
								onClick={() => goToSearch()}
								className='w-full flex items-center gap-3 px-4 py-3 hover-bg-theme transition-colors text-left border-b border-theme'
							>
								<HiHashtag className='w-5 h-5 text-primary shrink-0' />
								<span className='text-[15px] font-medium'>{query.trim()}</span>
							</button>
						)}

						{isFetching && !hasResults && (
							<div className='flex justify-center py-6'>
								<LoadingSpinner size='sm' />
							</div>
						)}

						{users.length > 0 && (
							<div>
								<p className='px-4 py-2 text-xs font-bold text-muted-theme uppercase tracking-wide'>People</p>
								{users.map((user) => (
									<button
										key={user._id}
										type='button'
										onClick={() => goToProfile(user.username)}
										className='w-full flex items-center gap-3 px-4 py-2.5 hover-bg-theme transition-colors text-left'
									>
										<img
											src={user.profileImage || "/avatar-placeholder.svg"}
											alt=''
											className='w-10 h-10 rounded-full shrink-0'
										/>
										<div className='min-w-0'>
											<p className='font-bold text-[15px] truncate'>{user.fullName}</p>
											<p className='text-muted-theme text-sm truncate'>@{user.username}</p>
										</div>
									</button>
								))}
							</div>
						)}

						{posts.length > 0 && (
							<div className={users.length > 0 ? "border-t border-theme" : ""}>
								<p className='px-4 py-2 text-xs font-bold text-muted-theme uppercase tracking-wide'>Tweets</p>
								{posts.map((post) => (
									<button
										key={post._id}
										type='button'
										onClick={() => goToPost(post._id)}
										className='w-full flex gap-3 px-4 py-2.5 hover-bg-theme transition-colors text-left'
									>
										<img
											src={post.user?.profileImage || "/avatar-placeholder.svg"}
											alt=''
											className='w-9 h-9 rounded-full shrink-0'
										/>
										<div className='min-w-0'>
											<p className='text-sm font-bold truncate'>{post.user?.fullName}</p>
											<p className='text-[15px] text-muted-theme truncate'>{post.text}</p>
										</div>
									</button>
								))}
							</div>
						)}

						{!isFetching && !hasResults && debouncedQuery === query.trim() && (
							<p className='px-4 py-4 text-sm text-muted-theme text-center'>No suggestions yet</p>
						)}
					</div>
				)}
			</div>
		</form>
	);
};

export default SearchBar;
