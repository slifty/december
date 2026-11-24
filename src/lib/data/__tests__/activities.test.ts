import { describe, expect, it } from "vitest";
import { ACTIVITIES, activityIdFromPath } from "../activities.ts";

describe("ACTIVITIES", () => {
	it("loads the activity files", () => {
		expect(ACTIVITIES.length).toBeGreaterThan(0);
	});
});

describe("activityIdFromPath", () => {
	it("uses the file name without its extension", () => {
		expect(activityIdFromPath("./activities/test-activity.json")).toBe(
			"test-activity",
		);
	});
});
