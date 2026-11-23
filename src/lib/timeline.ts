import { PHASES } from "./schemas/phase.ts";
import type { Activity } from "./schemas/activity.ts";

const LEAP_YEAR = 2000;
const MONTH_INDEX_OFFSET = 1;
const MILLISECONDS_PER_DAY = 86_400_000;
const DAYS_IN_LEAP_YEAR = 366;
const TIMELINE_START = "07-01";
const UNPLACED = Infinity;

const dayOfLeapYear = (monthDay: string): number => {
	const [month = 1, day = 1] = monthDay.split("-").map(Number);
	const date = Date.UTC(LEAP_YEAR, month - MONTH_INDEX_OFFSET, day);
	return (date - Date.UTC(LEAP_YEAR, 0, 1)) / MILLISECONDS_PER_DAY;
};

const TIMELINE_START_DAY = dayOfLeapYear(TIMELINE_START);

export const timelineDay = (monthDay: string): number =>
	(dayOfLeapYear(monthDay) - TIMELINE_START_DAY + DAYS_IN_LEAP_YEAR) %
	DAYS_IN_LEAP_YEAR;

const earliestPhaseStart = (activity: Activity): string | undefined =>
	activity.phases
		.map((phaseId) => PHASES[phaseId].start)
		.filter((start) => start !== undefined)
		.toSorted((a, b) => timelineDay(a) - timelineDay(b))[0];

export const activityTimelineDay = (activity: Activity): number | undefined => {
	if (activity.date !== undefined) {
		return timelineDay(activity.date);
	}
	if (activity.sweetSpot !== undefined) {
		return (
			timelineDay(activity.sweetSpot.relativeTo) + activity.sweetSpot.fromDays
		);
	}
	const phaseStart = earliestPhaseStart(activity);
	return phaseStart === undefined ? undefined : timelineDay(phaseStart);
};

export const sortByTimeline = (activities: readonly Activity[]): Activity[] =>
	activities.toSorted((a, b) => {
		const dayA = activityTimelineDay(a) ?? UNPLACED;
		const dayB = activityTimelineDay(b) ?? UNPLACED;
		return dayA === dayB ? a.title.localeCompare(b.title) : dayA - dayB;
	});
