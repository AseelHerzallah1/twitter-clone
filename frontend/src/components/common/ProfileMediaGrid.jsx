import { useNavigate, useLocation } from "react-router-dom";
import { navigationState } from "../../utils/navigation";

const ProfileMediaGrid = ({ posts }) => {
	const navigate = useNavigate();

	return (
		<div className='grid grid-cols-3 gap-0.5'>
			{posts.map((post) => (
				<button
					key={post._id}
					type='button'
					onClick={() => navigate(`/post/${post._id}`, { state: navigationState(location) })}
					className='aspect-square overflow-hidden hover:opacity-90 transition-opacity'
				>
					<img src={post.img} alt='' className='w-full h-full object-cover' loading='lazy' />
				</button>
			))}
		</div>
	);
};

export default ProfileMediaGrid;
