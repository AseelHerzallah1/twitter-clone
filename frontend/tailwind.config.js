import daisyui from "daisyui";
import daisyUIThemes from "daisyui/src/theming/themes";
/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"-apple-system",
					"BlinkMacSystemFont",
					'"Segoe UI"',
					"Roboto",
					"Helvetica",
					"Arial",
					"sans-serif",
				],
			},
			colors: {
				twitter: {
					blue: "#1D9BF0",
					border: "#38444D",
					"border-light": "#EFF3F4",
					dark: "#15202B",
					"dark-hover": "#192734",
					like: "#F91880",
					retweet: "#00BA7C",
					reply: "#1D9BF0",
				},
			},
		},
	},
	plugins: [daisyui],

	daisyui: {
		themes: [
			{
				light: {
					...daisyUIThemes["light"],
					primary: "#1D9BF0",
					"primary-content": "#FFFFFF",
					secondary: "#F7F9F9",
					"base-100": "#FFFFFF",
					"base-200": "#F7F9F9",
					"base-300": "#EFF3F4",
					"base-content": "#0F1419",
				},
			},
			{
				black: {
					...daisyUIThemes["black"],
					primary: "#1D9BF0",
					"primary-content": "#FFFFFF",
					secondary: "#192734",
					"base-100": "#15202B",
					"base-200": "#192734",
					"base-300": "#22303C",
					"base-content": "#FFFFFF",
				},
			},
		],
	},
};
