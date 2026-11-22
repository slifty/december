import { describe, expect, it } from "vitest";
import { isRealMonthDay } from "../dates.ts";

describe("isRealMonthDay", () => {
	it.each(["01-01", "12-25", "02-29"])("accepts %s", (monthDay) => {
		expect(isRealMonthDay(monthDay)).toBe(true);
	});

	it.each(["02-30", "13-01", "00-10", "1-01", "12-5", "2026-12-25", "TEST"])(
		"rejects %s",
		(monthDay) => {
			expect(isRealMonthDay(monthDay)).toBe(false);
		},
	);
});
