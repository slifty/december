import { clamp, DEFAULT_FLAKE_SIZE, Flake } from "./snowflake.ts";
import type { Bounds, FlakeSize, Point, Surface } from "./snowflake.ts";

export const GROUND_ID = "ground";

const HALF = 0.5;
const COLUMN_REACH = 1;
const SUPPORT_TOLERANCE_PX = 0.5;
const FRICTION = 0.7;
const STICKING_UPRIGHTNESS = 1 / Math.hypot(1, FRICTION);
const LIGHTEST_HEFT = 0.6;
const HEAVIEST_HEFT = 1.4;
const FULL_TURN_RADIANS = Math.PI + Math.PI;
const FALL_OFF_SPEED_PX_PER_SECOND = 30;
const NUDGE_SPEED_PX_PER_SECOND = 60;
const DISLODGE_SPEED_PX_PER_SECOND = 150;
const MAX_SHOVE_PX_PER_SECOND = 400;
const SPAWNS_PER_SECOND = 10;
const MAX_FLAKES = 6000;

export interface Frame {
	surfaces: Surface[];
	width: number;
	seconds: number;
	random: () => number;
}

export interface SnowfallOptions {
	spawnsPerSecond?: number;
	delaySeconds?: number;
	flakeSize?: FlakeSize;
}

export const groundSurface = (width: number, floor: number): Surface => ({
	id: GROUND_ID,
	left: 0,
	right: width,
	top: floor,
	bottom: floor,
	landChance: 1,
});

const distanceBetween = (a: Point, b: Point): number =>
	Math.hypot(a.x - b.x, a.y - b.y);

const isBelow = (flake: Flake, other: Flake): boolean =>
	other.center.y > flake.center.y;

const uprightness = (flake: Flake, support: Flake): number => {
	const distance = distanceBetween(flake.center, support.center);
	return distance === 0 ? 1 : (support.center.y - flake.center.y) / distance;
};

const isBeside = (flake: Flake, other: Flake): boolean =>
	other.center.y > flake.center.y - flake.contactDistance * HALF;

const isWedged = (flake: Flake, contacts: Flake[]): boolean => {
	const blockers = contacts.filter((other) => isBeside(flake, other));
	return (
		flake.atWall ||
		(blockers.some((other) => other.center.x < flake.center.x) &&
			blockers.some((other) => other.center.x > flake.center.x))
	);
};

const isStable = (flake: Flake, contacts: Flake[]): boolean => {
	const supports = contacts.filter((other) => isBelow(flake, other));
	return (
		supports.some(
			(support) => uprightness(flake, support) >= STICKING_UPRIGHTNESS,
		) ||
		(supports.length > 0 && isWedged(flake, contacts))
	);
};

const pushApart = (flake: Flake, other: Flake): void => {
	const distance = distanceBetween(flake.center, other.center);
	if (distance >= flake.contactDistance) {
		return;
	}
	const overlap = flake.contactDistance - distance;
	if (distance === 0) {
		flake.moveBy(0, -overlap);
		return;
	}
	flake.moveBy(
		((flake.center.x - other.center.x) / distance) * overlap,
		((flake.center.y - other.center.y) / distance) * overlap,
	);
};

const columnOf = (flake: Flake): number =>
	Math.floor(flake.center.x / flake.contactDistance);

const NEIGHBORING_COLUMNS = [-COLUMN_REACH, 0, COLUMN_REACH];

class Pile {
	readonly surface: Surface;
	readonly flakes: Flake[] = [];
	readonly #columns = new Map<number, Flake[]>();
	top: number;

	constructor(surface: Surface) {
		const { top } = surface;
		this.surface = surface;
		this.top = top;
	}

	add(flake: Flake): void {
		this.flakes.push(flake);
		const column = columnOf(flake);
		const neighbors = this.#columns.get(column) ?? [];
		neighbors.push(flake);
		this.#columns.set(column, neighbors);
		this.top = Math.min(this.top, flake.y);
	}

	catches(flake: Flake): boolean {
		const { center } = flake;
		return (
			center.x >= this.surface.left &&
			center.x <= this.surface.right &&
			flake.y + flake.size.height >= this.top &&
			flake.y < this.surface.bottom
		);
	}

	supports(flake: Flake): boolean {
		return (
			(flake.rest?.height ?? 0) <= SUPPORT_TOLERANCE_PX ||
			isStable(
				flake,
				this.#within(flake, flake.contactDistance + SUPPORT_TOLERANCE_PX),
			)
		);
	}

	collide(flake: Flake, startY: number): boolean {
		const contacts = this.#within(flake, flake.contactDistance);
		for (const other of contacts) {
			pushApart(flake, other);
		}
		const support = contacts.find((other) => isBelow(flake, other));
		const isHeldUp = support !== undefined && flake.y <= startY;
		if (
			flake.y + flake.size.height >= this.surface.bottom ||
			isHeldUp ||
			isStable(flake, contacts)
		) {
			return this.#land(flake);
		}
		if (support !== undefined) {
			flake.roll(Math.sign(flake.center.x - support.center.x));
		}
		return false;
	}

	#land(flake: Flake): boolean {
		flake.settle(this.surface);
		this.add(flake);
		return true;
	}

	#within(flake: Flake, reach: number): Flake[] {
		const column = columnOf(flake);
		return NEIGHBORING_COLUMNS.flatMap(
			(offset) => this.#columns.get(column + offset) ?? [],
		).filter(
			(other) =>
				other !== flake && distanceBetween(flake.center, other.center) < reach,
		);
	}
}

const travel = (
	flake: Flake,
	piles: Pile[],
	bounds: Bounds,
	frame: Frame,
): void => {
	const distance = Math.hypot(flake.vx, flake.vy) * frame.seconds;
	const substeps = Math.max(
		1,
		Math.ceil(distance / (flake.contactDistance * HALF)),
	);
	for (let substep = 0; substep < substeps; substep += 1) {
		const { y: startY } = flake;
		flake.move(frame.seconds / substeps, bounds);
		const landed =
			flake.isFalling &&
			piles.some(
				(pile) =>
					pile.catches(flake) &&
					flake.decide(pile.surface, frame.random) &&
					pile.collide(flake, startY),
			);
		if (landed) {
			return;
		}
	}
};

const byHeight = (a: Flake, b: Flake): number =>
	(a.rest?.height ?? 0) - (b.rest?.height ?? 0);

export class Snowfall {
	flakes: Flake[] = [];
	readonly #spawnsPerSecond: number;
	readonly #delaySeconds: number;
	readonly #flakeSize: FlakeSize;
	readonly #unsettled = new Set<string>();
	#clock = 0;
	#spawnDebt = 0;

	constructor({
		spawnsPerSecond = SPAWNS_PER_SECOND,
		delaySeconds = 0,
		flakeSize = DEFAULT_FLAKE_SIZE,
	}: SnowfallOptions = {}) {
		this.#flakeSize = flakeSize;
		this.#spawnsPerSecond = spawnsPerSecond;
		this.#delaySeconds = delaySeconds;
	}

	step(frame: Frame): void {
		this.#clock += frame.seconds;
		this.#followSurfaces(frame);
		this.#settle(frame.surfaces);
		this.#spawn(frame);
		const piles = this.#buildPiles(frame.surfaces);
		const bounds = {
			width: frame.width,
			floor: Math.max(...frame.surfaces.map((s) => s.bottom)),
		};
		for (const flake of this.flakes) {
			if (flake.rest === undefined) {
				flake.accelerate(frame.seconds, this.#clock);
				travel(flake, piles, bounds, frame);
			}
		}
	}

	brush(at: Point, radius: number, sweep: number): void {
		for (const flake of this.flakes) {
			if (flake.rest === undefined) {
				continue;
			}
			const { center } = flake;
			const dx = center.x - at.x;
			const distance = Math.hypot(dx, center.y - at.y);
			if (distance <= radius) {
				const nudge = (dx / radius) * NUDGE_SPEED_PX_PER_SECOND;
				const shove = clamp(
					nudge + sweep,
					-MAX_SHOVE_PX_PER_SECOND,
					MAX_SHOVE_PX_PER_SECOND,
				);
				this.#unsettled.add(flake.rest.surfaceId);
				flake.fall(shove, -DISLODGE_SPEED_PX_PER_SECOND);
			}
		}
	}

	#followSurfaces(frame: Frame): void {
		const surfaces = new Map(frame.surfaces.map((s) => [s.id, s]));
		for (const flake of this.flakes) {
			if (flake.rest === undefined) {
				continue;
			}
			const surface = surfaces.get(flake.rest.surfaceId);
			if (surface === undefined || !flake.follow(surface)) {
				this.#unsettled.add(flake.rest.surfaceId);
				flake.fall((frame.random() - HALF) * FALL_OFF_SPEED_PX_PER_SECOND, 0);
			}
		}
	}

	#settle(surfaces: Surface[]): void {
		const piles = this.#buildPiles(
			surfaces.filter((surface) => this.#unsettled.has(surface.id)),
		);
		for (const pile of piles) {
			const settled = new Pile(pile.surface);
			for (const flake of pile.flakes.toSorted(byHeight)) {
				if (settled.supports(flake)) {
					settled.add(flake);
				} else {
					flake.slip();
				}
			}
		}
		this.#unsettled.clear();
	}

	#spawn(frame: Frame): void {
		if (this.#clock < this.#delaySeconds) {
			return;
		}
		this.#spawnDebt += frame.seconds * this.#spawnsPerSecond;
		while (this.#spawnDebt >= 1) {
			this.#spawnDebt -= 1;
			if (this.flakes.length < MAX_FLAKES) {
				this.flakes.push(
					new Flake(
						frame.random() * Math.max(0, frame.width - this.#flakeSize.width),
						-this.#flakeSize.height,
						{
							phase: frame.random() * FULL_TURN_RADIANS,
							heft:
								LIGHTEST_HEFT +
								frame.random() * (HEAVIEST_HEFT - LIGHTEST_HEFT),
							size: this.#flakeSize,
						},
					),
				);
			}
		}
	}

	#buildPiles(surfaces: Surface[]): Pile[] {
		const piles = new Map(
			surfaces.map((surface) => [surface.id, new Pile(surface)]),
		);
		for (const flake of this.flakes) {
			if (flake.rest !== undefined) {
				piles.get(flake.rest.surfaceId)?.add(flake);
			}
		}
		return [...piles.values()];
	}
}
