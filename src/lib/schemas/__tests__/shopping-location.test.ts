import { describe, expect, it } from "vitest";
import { shoppingLocationSchema } from "../shopping-location.ts";

describe("shoppingLocationSchema", () => {
	it("accepts a location with a website", () => {
		expect(
			shoppingLocationSchema.safeParse({
				name: "TEST shop",
				goFor: "TEST things",
				url: "https://example.com",
			}).success,
		).toBe(true);
	});

	it("rejects a url that isn't one", () => {
		expect(
			shoppingLocationSchema.safeParse({
				name: "TEST shop",
				goFor: "TEST things",
				url: "TEST street",
			}).success,
		).toBe(false);
	});
});
