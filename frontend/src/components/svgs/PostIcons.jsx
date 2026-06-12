import { IoChatbubbleOutline } from "react-icons/io5";

export const ReplyIcon = ({ className = "w-[19px] h-[19px]" }) => (
	<IoChatbubbleOutline className={`shrink-0 ${className}`} aria-hidden='true' />
);

export const RetweetIcon = ({ className = "w-[18px] h-[18px]" }) => (
	<svg viewBox='0 0 24 24' aria-hidden='true' className={className} fill='currentColor'>
		<path d='M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z' />
	</svg>
);

export const LikeIcon = ({ className = "w-[18px] h-[18px]" }) => (
	<svg viewBox='0 0 24 24' aria-hidden='true' className={className} fill='currentColor'>
		<path d='M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12z' />
	</svg>
);
