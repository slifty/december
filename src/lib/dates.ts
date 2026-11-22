import { z } from "zod";

const MONTH_DAY_PATTERN = /^(?<month>\d{2})-(?<day>\d{2})$/v;
const LEAP_YEAR = 2000;
const MONTH_INDEX_OFFSET = 1;

export const isRealMonthDay = (monthDay: string): boolean => {
	const groups = MONTH_DAY_PATTERN.exec(monthDay)?.groups;
	if (groups?.month === undefined || groups.day === undefined) {
		return false;
	}
	const month = Number(groups.month);
	const day = Number(groups.day);
	const date = new Date(Date.UTC(LEAP_YEAR, month - MONTH_INDEX_OFFSET, day));
	return (
		date.getUTCMonth() === month - MONTH_INDEX_OFFSET &&
		date.getUTCDate() === day
	);
};

export const monthDaySchema = z
	.string()
	.refine(isRealMonthDay, { message: "Expected a real date as MM-DD" });
