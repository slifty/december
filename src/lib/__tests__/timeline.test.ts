import { describe, expect, it } from "vitest";
import {
	activityTimelineDay,
	sortByTimeline,
	timelineDay,
} from "../timeline.ts";
import type { Activity } from "../schemas/activity.ts";

const makeActivity = (overrides: Partial<Activity>): Activity => ({
	title: "TEST activity",
	category: "home",
	participants: [],
	advanceSteps: [],
	checklist: [],
	traditionLevel: 0,
	phases: [],
	...overrides,
});

describe("timelineDay", () => {
	it("places January after December", () => {
		expect(timelineDay("01-02")).toBeGreaterThan(timelineDay("12-31"));
	});

	it("orders dates within a month", () => {
		expect(timelineDay("12-24")).toBeLessThan(timelineDay("12-25"));
	});
});

describe("activityTimelineDay", () => {
	it("uses the date when there is one", () => {
		const activity = makeActivity({
			date: "12-10",
			phases: ["preparation"],
			sweetSpot: { relativeTo: "12-25", fromDays: -30, toDays: 0 },
		});
		expect(activityTimelineDay(activity)).toBe(timelineDay("12-10"));
	});

	it("uses the start of the sweet spot without a date", () => {
		const activity = makeActivity({
			phases: ["preparation"],
			sweetSpot: { relativeTo: "12-25", fromDays: -5, toDays: 0 },
		});
		expect(activityTimelineDay(activity)).toBe(timelineDay("12-20"));
	});

	it("falls back to the earliest phase start", () => {
		const activity = makeActivity({
			phases: ["new-year", "growing-anticipation"],
		});
		expect(activityTimelineDay(activity)).toBe(timelineDay("12-01"));
	});

	it("is undefined when nothing places the activity", () => {
		const activity = makeActivity({ phases: ["tear-down"] });
		expect(activityTimelineDay(activity)).toBeUndefined();
	});
});

describe("sortByTimeline", () => {
	it("orders activities by when they happen, unplaced ones last", () => {
		const unplaced = makeActivity({ title: "TEST-1", phases: ["tear-down"] });
		const newYear = makeActivity({ title: "TEST-2", date: "01-01" });
		const december = makeActivity({ title: "TEST-3", date: "12-05" });
		expect(sortByTimeline([unplaced, newYear, december])).toEqual([
			december,
			newYear,
			unplaced,
		]);
	});

	it("breaks ties by title", () => {
		const second = makeActivity({ title: "TEST-B", date: "12-05" });
		const first = makeActivity({ title: "TEST-A", date: "12-05" });
		expect(sortByTimeline([second, first])).toEqual([first, second]);
	});
});
