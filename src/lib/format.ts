const LEAP_YEAR = 2000;
const MONTH_INDEX_OFFSET = 1;
const MINUTES_PER_HOUR = 60;

const monthDayFormat = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	timeZone: "UTC",
});

const shortMonthDayFormat = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "UTC",
});

const monthDayToDate = (monthDay: string): Date => {
	const [month = 1, day = 1] = monthDay.split("-").map(Number);
	return new Date(Date.UTC(LEAP_YEAR, month - MONTH_INDEX_OFFSET, day));
};

export const formatMonthDay = (monthDay: string): string =>
	monthDayFormat.format(monthDayToDate(monthDay));

export const formatShortMonthDay = (
	monthDay: string,
	offsetDays = 0,
): string => {
	const date = monthDayToDate(monthDay);
	date.setUTCDate(date.getUTCDate() + offsetDays);
	return shortMonthDayFormat.format(date);
};

export const hasCost = (item: {
	estimatedCostDollars?: number | undefined;
	estimatedMemberCostDollars?: number | undefined;
}): boolean =>
	item.estimatedCostDollars !== undefined ||
	item.estimatedMemberCostDollars !== undefined;

const pluralize = (count: number, unit: string): string =>
	`${String(count)} ${unit}${count === 1 ? "" : "s"}`;

export const describeOffset = (days: number): string => {
	if (days === 0) {
		return "day of";
	}
	return `${pluralize(Math.abs(days), "day")} ${days < 0 ? "before" : "after"}`;
};

export const formatCountdown = (daysBefore: number): string =>
	`T-${pluralize(daysBefore, "day")}`;

export const formatDuration = (minutes: number): string => {
	const hours = Math.floor(minutes / MINUTES_PER_HOUR);
	const remainder = minutes % MINUTES_PER_HOUR;
	return [
		hours > 0 ? pluralize(hours, "hour") : undefined,
		remainder > 0 ? pluralize(remainder, "minute") : undefined,
	]
		.filter((part) => part !== undefined)
		.join(" ");
};

export const formatDollars = (dollars: number): string =>
	`$${dollars.toLocaleString("en-US")}`;

export const capitalize = (word: string): string =>
	word.charAt(0).toUpperCase() + word.slice(1);

export const formatLabel = (id: string): string =>
	capitalize(id.replaceAll("-", " "));

export const formatName = (id: string): string =>
	id.split("-").map(capitalize).join("-");
