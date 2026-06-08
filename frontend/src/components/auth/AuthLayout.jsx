import { MdLightMode, MdDarkMode, MdSettingsBrightness } from "react-icons/md";
import TwitterBird from "../svgs/TwitterBird";
import { useThemeContext } from "../../context/ThemeContext";

const HERO_TEXT = "See what's happening in the world right now.";

const AuthLayout = ({ title, subtitle, children }) => {
	const { preference, setThemePreference, resolved } = useThemeContext();

	const cycleTheme = () => {
		const order = ["light", "black", "system"];
		const next = order[(order.indexOf(preference) + 1) % order.length];
		setThemePreference(next);
	};

	const ThemeIcon =
		preference === "system" ? MdSettingsBrightness : resolved === "black" ? MdLightMode : MdDarkMode;

	return (
		<div className='relative min-h-screen w-full flex flex-col lg:flex-row bg-base-100'>
			<button
				type='button'
				onClick={cycleTheme}
				className='absolute top-4 right-4 z-10 btn btn-ghost btn-circle'
				aria-label='Toggle theme'
			>
				<ThemeIcon className='w-5 h-5' />
			</button>

			{/* Left — branding (desktop) */}
			<div className='hidden lg:flex lg:w-1/2 items-center justify-center px-12 xl:px-24'>
				<div className='max-w-[520px]'>
					<TwitterBird className='w-[280px] h-[280px] fill-primary' />
					<h2 className='text-[42px] xl:text-[52px] font-bold mt-10 leading-[1.15] tracking-tight'>
						{HERO_TEXT}
					</h2>
				</div>
			</div>

			{/* Right — form */}
			<div className='flex-1 lg:w-1/2 flex items-center justify-center px-6 sm:px-10 py-10 lg:py-0'>
				<div className='w-full max-w-[400px]'>
					<TwitterBird className='w-10 h-10 lg:hidden fill-primary mb-10' />
					<h1 className='text-[31px] font-bold leading-tight mb-2'>{title}</h1>
					{subtitle && <p className='text-[17px] text-muted-theme mb-8'>{subtitle}</p>}
					{!subtitle && <div className='mb-8' />}
					{children}
				</div>
			</div>
		</div>
	);
};

export default AuthLayout;
