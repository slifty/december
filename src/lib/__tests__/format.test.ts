import { describe, expect, it } from "vitest";
import {
	describeOffset,
	formatCountdown,
	formatDollars,
	formatDuration,
	formatLabel,
	formatMonthDay,
	formatName,
	formatShortMonthDay,
	hasCost,
} from "../format.ts";

describe("formatMonthDay", () => {
	it("spells out the month", () => {
		expect(formatMonthDay("12-25")).toBe("December 25");
	});

	it("handles leap days", () => {
		expect(formatMonthDay("02-29")).toBe("February 29");
	});
});

describe("formatShortMonthDay", () => {
	it("abbreviates the month", () => {
		expect(formatShortMonthDay("12-25")).toBe("Dec 25");
	});

	it("counts back across a month boundary", () => {
		expect(formatShortMonthDay("12-25", -25)).toBe("Nov 30");
	});

	it("counts forward across the new year", () => {
		expect(formatShortMonthDay("12-25", 8)).toBe("Jan 2");
	});
});

describe("hasCost", () => {
	it("is false with no cost", () => {
		expect(hasCost({})).toBe(false);
	});

	it("counts a member-only cost", () => {
		expect(hasCost({ estimatedMemberCostDollars: 0 })).toBe(true);
	});
});

describe("describeOffset", () => {
	it("names the day itself", () => {
		expect(describeOffset(0)).toBe("day of");
	});

	it("uses the singular for one day", () => {
		expect(describeOffset(-1)).toBe("1 day before");
	});

	it("uses the plural for several days", () => {
		expect(describeOffset(3)).toBe("3 days after");
	});
});

describe("formatCountdown", () => {
	it("counts down to the activity", () => {
		expect(formatCountdown(90)).toBe("T-90 days");
	});

	it("uses the singular for one day", () => {
		expect(formatCountdown(1)).toBe("T-1 day");
	});

	it("marks the day itself as zero", () => {
		expect(formatCountdown(0)).toBe("T-0 days");
	});
});

describe("formatDuration", () => {
	it("keeps short durations in minutes", () => {
		expect(formatDuration(45)).toBe("45 minutes");
	});

	it("uses whole hours", () => {
		expect(formatDuration(180)).toBe("3 hours");
	});

	it("combines hours and minutes", () => {
		expect(formatDuration(61)).toBe("1 hour 1 minute");
	});
});

describe("formatDollars", () => {
	it("groups thousands", () => {
		expect(formatDollars(1250)).toBe("$1,250");
	});
});

describe("formatLabel", () => {
	it("turns an id into a sentence-case label", () => {
		expect(formatLabel("after-bedtime")).toBe("After bedtime");
	});
});

describe("formatName", () => {
	it("capitalizes each part of a hyphenated name", () => {
		expect(formatName("test-names")).toBe("Test-Names");
	});
});
