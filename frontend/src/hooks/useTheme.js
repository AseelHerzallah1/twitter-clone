import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "theme-preference";

const getSystemTheme = () =>
	window.matchMedia("(prefers-color-scheme: dark)").matches ? "black" : "light";

const resolveTheme = (preference) => {
	if (preference === "system") return getSystemTheme();
	return preference === "light" ? "light" : "black";
};

const applyTheme = (preference) => {
	document.documentElement.setAttribute("data-theme", resolveTheme(preference));
};

export const useTheme = () => {
	const [preference, setPreference] = useState(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return stored;
		const legacy = localStorage.getItem("theme");
		if (legacy === "light" || legacy === "black") return legacy;
		return "system";
	});

	useEffect(() => {
		applyTheme(preference);
		localStorage.setItem(STORAGE_KEY, preference);
	}, [preference]);

	useEffect(() => {
		if (preference !== "system") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyTheme("system");
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [preference]);

	const setThemePreference = useCallback((next) => setPreference(next), []);

	return { preference, setThemePreference, resolved: resolveTheme(preference) };
};

export default useTheme;
