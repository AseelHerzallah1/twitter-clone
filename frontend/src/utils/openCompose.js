export const openCompose = (options = {}) => {
	window.dispatchEvent(new CustomEvent("open-compose", { detail: options }));
};
