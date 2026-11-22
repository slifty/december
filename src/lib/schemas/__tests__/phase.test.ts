import { describe, expect, it } from "vitest";
import { PHASES, phaseIdSchema, phaseSchema } from "../phase.ts";

describe("PHASES", () => {
	it("defines every phase, in order", () => {
		expect(Object.keys(PHASES)).toEqual(phaseIdSchema.options);
	});
});

describe("phaseSchema", () => {
	it("accepts a phase with no dates", () => {
		expect(phaseSchema.safeParse({ name: "TEST phase" }).success).toBe(true);
	});

	it("rejects a boundary that isn't a real month-day", () => {
		expect(
			phaseSchema.safeParse({ name: "TEST phase", start: "02-30" }).success,
		).toBe(false);
	});
});
