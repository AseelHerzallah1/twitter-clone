import daisyui from "daisyui";
import daisyUIThemes from "daisyui/src/theming/themes";
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [daisyui],

	daisyui: {
		themes: [
			{
				light: {
					...daisyUIThemes["light"],
					primary: "#1DA1F2",
					secondary: "#E7E7E8",
				},
			},
			{
				black: {
					...daisyUIThemes["black"],
					primary: "#1DA1F2",
					secondary: "#192734",
					"base-100": "#0D1117",
					"base-200": "#161B22",
					"base-300": "#1C2128",
				},
			},
		],
	},
};