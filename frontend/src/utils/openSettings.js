export const openSettings = () => {
	window.dispatchEvent(new CustomEvent("open-settings"));
};
