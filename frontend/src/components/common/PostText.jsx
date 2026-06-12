import { Link, useLocation } from "react-router-dom";
import { navigationState } from "../../utils/navigation";

// Match #hashtag for any language (letters, numbers, marks, underscore)
const HASHTAG_REGEX = /(#[\p{L}\p{M}\p{N}_]+)/gu;

const PostText = ({ text, className = "" }) => {
	const location = useLocation();

	if (!text) return null;

	const parts = text.split(HASHTAG_REGEX);

	return (
		<p className={`whitespace-pre-wrap break-words ${className}`}>
			{parts.map((part, i) =>
				part.startsWith("#") ? (
					<Link
						key={i}
						to={`/search?q=${encodeURIComponent(part)}`}
						state={navigationState(location)}
						className='text-twitter-reply hover:underline'
						onClick={(e) => e.stopPropagation()}
					>
						{part}
					</Link>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</p>
	);
};

export default PostText;
