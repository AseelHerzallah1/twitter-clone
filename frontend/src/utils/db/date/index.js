export const formatPostDate = (createdAt) => {
	const currentDate = new Date();
	const createdAtDate = new Date(createdAt);

	const timeDifferenceInSeconds = Math.floor((currentDate - createdAtDate) / 1000);
	const timeDifferenceInMinutes = Math.floor(timeDifferenceInSeconds / 60);
	const timeDifferenceInHours = Math.floor(timeDifferenceInMinutes / 60);
	const timeDifferenceInDays = Math.floor(timeDifferenceInHours / 24);

	if (timeDifferenceInDays > 1) {
		return createdAtDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	} else if (timeDifferenceInDays === 1) {
		return "1d";
	} else if (timeDifferenceInHours >= 1) {
		return `${timeDifferenceInHours}h`;
	} else if (timeDifferenceInMinutes >= 1) {
		return `${timeDifferenceInMinutes}m`;
	} else {
		return "Just now";
	}
};

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

const parseLocalDate = (value) => {
	if (!value) return null;
	const raw = String(value).split("T")[0];
	const [year, month, day] = raw.split("-").map(Number);
	if (!year || !month || !day) return new Date(value);
	return new Date(year, month - 1, day);
};

export const toDateInputValue = (value) => {
	if (!value) return "";
	return String(value).split("T")[0];
};

export const formatBirthday = (birthday) => {
	const date = parseLocalDate(birthday);
	if (!date || Number.isNaN(date.getTime())) return null;
	const month = MONTHS[date.getMonth()];
	return `Born ${month} ${date.getDate()}`;
};

export const formatMemberSinceDate = (createdAt) => {
	const date = new Date(createdAt);
	const month = MONTHS[date.getMonth()];
	const year = date.getFullYear();
	return `Joined ${month} ${year}`;
};