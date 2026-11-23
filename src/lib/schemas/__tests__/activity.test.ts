import { describe, expect, it } from "vitest";
import { activitySchema } from "../activity.ts";

const validActivity = {
	title: "TEST activity",
	category: "outdoor",
	traditionLevel: 3,
	phases: ["growing-anticipation"],
	sweetSpot: { relativeTo: "12-25", fromDays: -10, toDays: -7 },
	durationMinutes: 180,
	estimatedCostDollars: 200,
	estimatedMemberCostDollars: 150,
	participants: ["duey-schultzes"],
	advanceSteps: [{ title: "TEST step", daysBefore: 30 }],
};

describe("activitySchema", () => {
	it("accepts a complete activity and defaults the lists", () => {
		const activity = activitySchema.parse(validActivity);
		expect(activity.checklist).toEqual([]);
		expect(activity.variants).toEqual([]);
		expect(activity.advanceSteps).toHaveLength(1);
		expect(activity.narrowlyScheduled).toBe(false);
	});

	it("accepts a narrowly scheduled activity", () => {
		expect(
			activitySchema.parse({ ...validActivity, narrowlyScheduled: true })
				.narrowlyScheduled,
		).toBe(true);
	});

	it.each([
		["entirely after the date", { fromDays: 1, toDays: 3 }],
		["around the date", { fromDays: -2, toDays: 2 }],
		["on the date alone", { fromDays: 0, toDays: 0 }],
	])("accepts a sweet spot %s", (_, days) => {
		expect(
			activitySchema.safeParse({
				...validActivity,
				sweetSpot: { relativeTo: "12-25", ...days },
			}).success,
		).toBe(true);
	});

	it("accepts an activity with a location", () => {
		expect(
			activitySchema.safeParse({
				...validActivity,
				location: { name: "TEST place", url: "https://example.com" },
			}).success,
		).toBe(true);
	});

	it("accepts an activity with variants", () => {
		expect(
			activitySchema.safeParse({
				...validActivity,
				variants: [
					{
						name: "TEST variant",
						description: "TEST description",
						location: { name: "TEST place" },
						estimatedCostDollars: 50,
						estimatedMemberCostDollars: 0,
					},
					{ name: "TEST bare variant" },
				],
			}).success,
		).toBe(true);
	});

	it("accepts times of day on an activity and its variants", () => {
		expect(
			activitySchema.safeParse({
				...validActivity,
				timesOfDay: ["morning", "after-bedtime"],
				variants: [{ name: "TEST variant", timesOfDay: ["evening"] }],
			}).success,
		).toBe(true);
	});

	it("accepts an activity with no phases", () => {
		expect(
			activitySchema.safeParse({ ...validActivity, phases: [] }).success,
		).toBe(true);
	});

	it.each([
		["an unknown category", { category: "TEST-category" }],
		["an unknown phase", { phases: ["TEST-phase"] }],
		["an unknown participant", { participants: ["TEST-participant"] }],
		["a tradition level above 5", { traditionLevel: 6 }],
		["a fractional tradition level", { traditionLevel: 2.5 }],
		["a date that doesn't exist", { date: "02-30" }],
		["a date with a year", { date: "2026-12-25" }],
		[
			"a sweet spot that ends before it starts",
			{ sweetSpot: { relativeTo: "12-25", fromDays: -7, toDays: -10 } },
		],
		[
			"a sweet spot relative to a date that doesn't exist",
			{ sweetSpot: { relativeTo: "13-01", fromDays: -7, toDays: -1 } },
		],
		["an unknown time of day", { timesOfDay: ["TEST-time"] }],
		["an empty list of times of day", { timesOfDay: [] }],
		[
			"a variant with an unknown time of day",
			{ variants: [{ name: "TEST variant", timesOfDay: ["TEST-time"] }] },
		],
		["a location with no name", { location: { url: "https://example.com" } }],
		["a variant with no name", { variants: [{ estimatedCostDollars: 50 }] }],
		[
			"a variant with a field the schema doesn't know",
			{ variants: [{ name: "TEST variant", chosen: true }] },
		],
		["a field the schema doesn't know", { done: true }],
	])("rejects %s", (_, override) => {
		expect(
			activitySchema.safeParse({ ...validActivity, ...override }).success,
		).toBe(false);
	});

	it("accepts February 29", () => {
		expect(
			activitySchema.safeParse({ ...validActivity, date: "02-29" }).success,
		).toBe(true);
	});
});
