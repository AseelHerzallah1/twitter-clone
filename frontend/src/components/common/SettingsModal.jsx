import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode, MdSettingsBrightness } from "react-icons/md";
import { useThemeContext } from "../../context/ThemeContext";

const THEME_OPTIONS = [
	{ id: "light", label: "Light", icon: MdLightMode },
	{ id: "black", label: "Dark", icon: MdDarkMode },
	{ id: "system", label: "System", icon: MdSettingsBrightness },
];

const SettingsModal = () => {
	const [open, setOpen] = useState(false);
	const { preference, setThemePreference } = useThemeContext();

	useEffect(() => {
		const handleOpen = () => setOpen(true);
		window.addEventListener("open-settings", handleOpen);
		return () => window.removeEventListener("open-settings", handleOpen);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKey = (e) => e.key === "Escape" && setOpen(false);
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	if (!open) return null;

	return (
		<dialog open className='modal modal-open'>
			<div className='modal-box border border-theme rounded-2xl max-w-md p-0 overflow-hidden'>
				<div className='px-5 py-4 border-b border-theme flex items-center justify-between'>
					<h3 className='font-bold text-xl'>Settings</h3>
					<button
						type='button'
						onClick={() => setOpen(false)}
						className='btn btn-ghost btn-sm btn-circle'
						aria-label='Close settings'
					>
						×
					</button>
				</div>

				<div className='p-5'>
					<p className='font-bold text-[15px] mb-3'>Appearance</p>
					<div className='flex flex-col gap-2'>
						{THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
							<button
								key={id}
								type='button'
								onClick={() => setThemePreference(id)}
								className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-colors ${
									preference === id
										? "border-primary bg-primary/10 font-bold"
										: "border-theme hover-bg-theme"
								}`}
							>
								<Icon className='w-5 h-5' />
								<span>{label}</span>
							</button>
						))}
					</div>
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button type='button' onClick={() => setOpen(false)}>close</button>
			</form>
		</dialog>
	);
};

export default SettingsModal;
