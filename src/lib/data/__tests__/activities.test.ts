import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "../activities.ts";

describe("ACTIVITIES", () => {
	it("loads the activity files", () => {
		expect(ACTIVITIES.length).toBeGreaterThan(0);
	});
});
