const NavBadge = ({ count, compact = false, sidebar = false }) => {
	if (!count || count <= 0) return null;
	return (
		<span
			className={`absolute flex items-center justify-center rounded-full bg-primary text-white font-bold leading-none ${
				compact
					? "top-0 right-0 min-w-[16px] h-4 px-0.5 text-[10px] translate-x-1/3 -translate-y-1/3"
					: sidebar
						? "top-0 right-0 min-w-[18px] h-[18px] px-1 text-[11px] translate-x-1/2 -translate-y-1/2"
						: "top-1 left-7 min-w-[18px] h-[18px] px-1 text-[11px]"
			}`}
		>
			{count > 99 ? "99+" : count}
		</span>
	);
};

export default NavBadge;
