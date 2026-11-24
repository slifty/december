import { describe, expect, it } from "vitest";
import { groundSurface, Snowfall } from "../snow.ts";
import { DEFAULT_FLAKE_SIZE, Flake } from "../snowflake.ts";
import type { Frame } from "../snow.ts";
import type { FlakeSize, Surface } from "../snowflake.ts";

const { width: FLAKE_WIDTH_PX, height: FLAKE_HEIGHT_PX } = DEFAULT_FLAKE_SIZE;

const WIDTH = 400;
const FLOOR = 1000;
const ALWAYS = (): number => 0;
const NEVER = (): number => 0.99;

const makeLedge = (overrides: Partial<Surface> = {}): Surface => ({
	id: "TEST-1",
	left: 100,
	right: 300,
	top: 200,
	bottom: 240,
	landChance: 0.5,
	...overrides,
});

const makeFrame = (
	surfaces: Surface[],
	overrides: Partial<Frame> = {},
): Frame => ({
	surfaces: [...surfaces, groundSurface(WIDTH, FLOOR)],
	width: WIDTH,
	seconds: 0.05,
	random: ALWAYS,
	...overrides,
});

const snowfallWith = (flakes: Flake[]): Snowfall => {
	const snowfall = new Snowfall({ spawnsPerSecond: 0 });
	snowfall.flakes.push(...flakes);
	return snowfall;
};

const makeClump = (
	x: number,
	y: number,
	size: FlakeSize = DEFAULT_FLAKE_SIZE,
): Flake => {
	const flake = new Flake(x, y, { size });
	flake.fall(0, 0);
	return flake;
};

const run = (snowfall: Snowfall, frame: Frame, steps = 2000): void => {
	for (let index = 0; index < steps; index += 1) {
		snowfall.step(frame);
	}
};

describe("Snowfall.step", () => {
	it("lands a flake inside a ledge that catches it", () => {
		const ledge = makeLedge();
		const flake = new Flake(150, 0);
		run(snowfallWith([flake]), makeFrame([ledge]));
		expect(flake.rest).toMatchObject({ surfaceId: "TEST-1", height: 0 });
		expect(flake.y).toBe(ledge.bottom - FLAKE_HEIGHT_PX);
	});

	it("lets a flake pass through a ledge that does not catch it", () => {
		const flake = new Flake(150, 0);
		run(snowfallWith([flake]), makeFrame([makeLedge()], { random: NEVER }));
		expect(flake.rest?.surfaceId).toBe("ground");
		expect(flake.decisions.get("TEST-1")).toBe(false);
	});

	it("stacks a flake landing squarely on another so they overlap by half", () => {
		const above = makeClump(150, 100);
		run(snowfallWith([makeClump(150, 150), above]), makeFrame([makeLedge()]));
		expect(above.rest?.height).toBeCloseTo(FLAKE_HEIGHT_PX * 0.5);
	});

	it("measures overlap against the size of the flake", () => {
		const small = { width: 4, height: 6 };
		const above = makeClump(150, 100, small);
		run(
			snowfallWith([makeClump(150, 150, small), above]),
			makeFrame([makeLedge()]),
		);
		expect(above.rest?.height).toBeCloseTo(small.height * 0.5);
	});

	it("rolls a flake off the shoulder of another", () => {
		const below = makeClump(150, 150);
		const above = makeClump(154, 100);
		run(snowfallWith([below, above]), makeFrame([makeLedge()]));
		expect(above.rest).toMatchObject({ surfaceId: "TEST-1", height: 0 });
		expect(above.x).toBeGreaterThan(154);
	});

	it("rests a flake cradled between two others", () => {
		const above = makeClump(154, 100);
		run(
			snowfallWith([makeClump(150, 150), makeClump(158, 150), above]),
			makeFrame([makeLedge()]),
		);
		expect(above.rest?.surfaceId).toBe("TEST-1");
		expect(above.rest?.height).toBeGreaterThan(0);
	});

	it("catches a clump falling faster than a ledge is tall", () => {
		const flake = makeClump(150, 180);
		flake.vy = 400;
		const thinLedge = makeLedge({ top: 200, bottom: 210 });
		snowfallWith([flake]).step(makeFrame([thinLedge], { seconds: 0.1 }));
		expect(flake.rest).toMatchObject({ surfaceId: "TEST-1", height: 0 });
	});

	it("piles snow at the bottom of the page", () => {
		const flake = new Flake(10, 0);
		run(snowfallWith([flake]), makeFrame([makeLedge()]));
		expect(flake.rest?.surfaceId).toBe("ground");
		expect(flake.y).toBe(FLOOR - FLAKE_HEIGHT_PX);
	});

	it("moves landed snow with its ledge", () => {
		const flake = new Flake(150, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([makeLedge()]));
		snowfall.step(makeFrame([makeLedge({ top: 300, bottom: 340 })]));
		expect(flake.y).toBe(340 - FLAKE_HEIGHT_PX);
	});

	it("lets snow resting on flakes squeezed off a narrowing ledge fall", () => {
		const below = makeClump(288, 150);
		const above = makeClump(286, 100);
		const snowfall = snowfallWith([below, above]);
		run(snowfall, makeFrame([makeLedge()]));
		expect(above.rest?.height).toBeGreaterThan(0);
		run(snowfall, makeFrame([makeLedge({ right: 297 })]));
		expect(below.rest?.surfaceId).not.toBe("TEST-1");
		expect(above.rest).toMatchObject({ surfaceId: "TEST-1", height: 0 });
	});

	it("drops all snow from a ledge that goes away", () => {
		const flake = new Flake(150, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([makeLedge()]));
		snowfall.step(makeFrame([]));
		expect(flake.rest).toBeUndefined();
		run(snowfall, makeFrame([makeLedge()]));
		expect(flake.rest?.surfaceId).toBe("ground");
	});

	it("spawns flakes at the top of the page over time", () => {
		const snowfall = new Snowfall();
		snowfall.step(makeFrame([], { seconds: 1 }));
		expect(snowfall.flakes.length).toBeGreaterThan(0);
		expect(snowfall.flakes.every((flake) => flake.y < makeLedge().top)).toBe(
			true,
		);
	});

	it("holds off spawning until its delay has passed", () => {
		const snowfall = new Snowfall({ delaySeconds: 5 });
		run(snowfall, makeFrame([], { seconds: 1 }), 4);
		expect(snowfall.flakes).toEqual([]);
		run(snowfall, makeFrame([], { seconds: 1 }), 2);
		expect(snowfall.flakes.length).toBeGreaterThan(0);
	});

	it("slumps flakes back a little from the sides of the page", () => {
		const left = new Flake(0, 0);
		left.fall(-1000, 0);
		const right = new Flake(WIDTH, 0);
		right.fall(1000, 0);
		const snowfall = snowfallWith([left, right]);
		snowfall.step(makeFrame([]));
		expect(left.x).toBeGreaterThanOrEqual(0);
		expect(left.x).toBeLessThan(FLAKE_WIDTH_PX);
		expect(left.vx).toBeGreaterThan(0);
		expect(left.vx).toBeLessThan(200);
		expect(right.x).toBeLessThanOrEqual(WIDTH - FLAKE_WIDTH_PX);
		expect(right.x).toBeGreaterThan(WIDTH - FLAKE_WIDTH_PX * 2);
		expect(right.vx).toBeLessThan(0);
		expect(right.vx).toBeGreaterThan(-200);
	});

	it("carries lighter disturbed snow farther and drops it slower", () => {
		const light = new Flake(100, 0, { heft: 0.6 });
		const heavy = new Flake(100, 0, { heft: 1.4 });
		light.fall(100, 0);
		heavy.fall(100, 0);
		run(snowfallWith([light, heavy]), makeFrame([]), 5);
		expect(light.x).toBeGreaterThan(heavy.x);
		expect(light.y).toBeLessThan(heavy.y);
	});

	it("drops disturbed snow faster than falling snow", () => {
		const falling = new Flake(10, 0);
		const disturbed = new Flake(50, 0);
		disturbed.fall(0, 0);
		run(snowfallWith([falling, disturbed]), makeFrame([]), 20);
		expect(disturbed.y).toBeGreaterThan(falling.y);
	});

	it("never lets a flake fall through the bottom of the page", () => {
		const flake = new Flake(10, FLOOR - 20);
		flake.vy = 100_000;
		const snowfall = snowfallWith([flake]);
		snowfall.step(makeFrame([], { random: NEVER }));
		expect(flake.rest?.surfaceId).toBe("ground");
		expect(snowfall.flakes).toEqual([flake]);
	});
});

describe("Snowfall.brush", () => {
	it("bumps dislodged snow up a little before it falls again", () => {
		const flake = new Flake(10, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([]));
		const resting = FLOOR - FLAKE_HEIGHT_PX;
		expect(flake.y).toBe(resting);
		snowfall.brush(flake.center, 20, 0);
		let highest = resting;
		for (let index = 0; index < 100; index += 1) {
			snowfall.step(makeFrame([], { seconds: 0.01 }));
			highest = Math.min(highest, flake.y);
		}
		expect(highest).toBeLessThan(resting);
		expect(resting - highest).toBeLessThan(FLAKE_HEIGHT_PX * 2);
		run(snowfall, makeFrame([]));
		expect(flake.rest?.surfaceId).toBe("ground");
	});

	it("dislodges snow upward whichever way the brush comes from", () => {
		const fromAbove = new Flake(100, 0);
		const fromBelow = new Flake(200, 0);
		const snowfall = snowfallWith([fromAbove, fromBelow]);
		run(snowfall, makeFrame([]));
		snowfall.brush(
			{ x: fromAbove.center.x, y: fromAbove.center.y - 10 },
			15,
			0,
		);
		snowfall.brush(
			{ x: fromBelow.center.x, y: fromBelow.center.y + 10 },
			15,
			0,
		);
		expect(fromAbove.vy).toBeLessThan(0);
		expect(fromAbove.vy).toBe(fromBelow.vy);
	});

	it("limits how hard a fast sweep can throw snow sideways", () => {
		const flake = new Flake(10, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([]));
		snowfall.brush(flake.center, 20, 100_000);
		expect(flake.vx).toBeGreaterThan(0);
		expect(flake.vx).toBeLessThan(1000);
	});

	it("knocks landed snow off its ledge for good", () => {
		const flake = new Flake(150, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([makeLedge()]));
		snowfall.brush(flake.center, 20, 0);
		expect(flake.rest).toBeUndefined();
		run(snowfall, makeFrame([makeLedge()]));
		expect(flake.rest?.surfaceId).not.toBe("TEST-1");
	});

	it("leaves snow outside its reach alone", () => {
		const flake = new Flake(150, 0);
		const snowfall = snowfallWith([flake]);
		run(snowfall, makeFrame([makeLedge()]));
		snowfall.brush({ x: flake.x + 100, y: flake.y }, 20, 0);
		expect(flake.rest).toBeDefined();
	});

	it("lets snow above a brushed flake fall back onto the ledge", () => {
		const below = new Flake(150, 0);
		const above = new Flake(150, -100);
		const snowfall = snowfallWith([below, above]);
		const frame = makeFrame([makeLedge()]);
		run(snowfall, frame);
		snowfall.brush(below.center, 0.5, 0);
		run(snowfall, frame);
		expect(above.rest).toMatchObject({ surfaceId: "TEST-1", height: 0 });
	});
});
