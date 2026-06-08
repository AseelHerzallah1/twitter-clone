import { openNest } from "../../utils/openNest";
import TwitterBird from "../svgs/TwitterBird";

const NestFab = () => (
	<button
		type='button'
		onClick={openNest}
		className='app-fab hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2 rounded-full pl-3 pr-4 h-12'
		aria-label='Open Nest AI'
	>
		<TwitterBird className='w-5 h-5 fill-white' />
		<span className='font-bold text-sm hidden sm:inline'>Nest</span>
	</button>
);

export default NestFab;
