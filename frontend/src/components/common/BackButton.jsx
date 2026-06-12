import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import { isPostPath } from "../../utils/navigation";

const BackButton = ({ fallback = "/", className = "p-2 -ml-2 rounded-full hover-bg-theme transition-colors" }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const handleBack = () => {
		const origin = location.state?.from;

		// Never bounce between two post pages — that creates an infinite loop.
		if (origin && !isPostPath(origin)) {
			navigate(origin);
			return;
		}

		if (window.history.length > 1) {
			navigate(-1);
			return;
		}

		navigate(fallback);
	};

	return (
		<button type='button' onClick={handleBack} className={className} aria-label='Go back'>
			<FaArrowLeft className='w-4 h-4' />
		</button>
	);
};

export default BackButton;
