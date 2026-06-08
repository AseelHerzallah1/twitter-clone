import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

const BackButton = ({ fallback = "/", className = "p-2 -ml-2 rounded-full hover-bg-theme transition-colors" }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const handleBack = () => {
		if (location.state?.from) {
			navigate(location.state.from);
			return;
		}
		if (window.history.length > 2) {
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
