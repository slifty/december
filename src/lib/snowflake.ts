export interface FlakeSize {
	width: number;
	height: number;
}

export interface Surface {
	id: string;
	left: number;
	right: number;
	top: number;
	bottom: number;
	landChance: number;
}

export interface Rest {
	surfaceId: string;
	offsetX: number;
	height: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface Bounds {
	width: number;
	floor: number;
}

export interface FlakeOptions {
	phase?: number;
	heft?: number;
	size?: FlakeSize;
}

const DEFAULT_FLAKE_SIZE_PX = 10;

export const DEFAULT_FLAKE_SIZE: FlakeSize = {
	width: DEFAULT_FLAKE_SIZE_PX,
	height: DEFAULT_FLAKE_SIZE_PX,
};

const HALF = 0.5;
const FLAKE_OVERLAP = 0.5;
const ROLL_SPEED_PX_PER_SECOND = 30;
const FALL_SPEED_PX_PER_SECOND = 40;
const AIR_RESISTANCE_PER_SECOND = 2;
const GRAVITY_PX_PER_SECOND_SQUARED = 1500;
const CLUMP_FALL_SPEED_PX_PER_SECOND = 400;
const CLUMP_DRAG_PER_SECOND = 6;
const WALL_SLUMP = 0.15;
const SWAY_SPEED_PX_PER_SECOND = 12;
const SWAY_RADIANS_PER_SECOND = 1.5;

export const clamp = (value: number, low: number, high: number): number =>
	Math.min(Math.max(value, low), high);

const approach = (value: number, target: number, amount: number): number =>
	value + (target - value) * Math.min(1, amount);

export class Flake {
	x: number;
	y: number;
	vx = 0;
	vy = FALL_SPEED_PX_PER_SECOND;
	rest: Rest | undefined;
	atWall = false;
	readonly phase: number;
	readonly heft: number;
	readonly size: FlakeSize;
	readonly decisions = new Map<string, boolean>();
	#clumped = false;

	constructor(
		x: number,
		y: number,
		{ phase = 0, heft = 1, size = DEFAULT_FLAKE_SIZE }: FlakeOptions = {},
	) {
		this.x = x;
		this.y = y;
		this.phase = phase;
		this.heft = heft;
		this.size = size;
	}

	get center(): Point {
		return {
			x: this.x + this.size.width * HALF,
			y: this.y + this.size.height * HALF,
		};
	}

	get contactDistance(): number {
		return Math.max(this.size.width, this.size.height) * (1 - FLAKE_OVERLAP);
	}

	get isFalling(): boolean {
		return this.vy >= 0;
	}

	fall(vx: number, vy: number): void {
		if (this.rest !== undefined) {
			this.decisions.set(this.rest.surfaceId, false);
			this.rest = undefined;
		}
		this.vx = vx / this.heft;
		this.vy = vy / this.heft;
		this.#clumped = true;
	}

	slip(): void {
		if (this.rest !== undefined) {
			this.decisions.set(this.rest.surfaceId, true);
			this.rest = undefined;
		}
		this.vx = 0;
		this.vy = 0;
		this.#clumped = true;
	}

	roll(direction: number): void {
		this.vx = direction * ROLL_SPEED_PX_PER_SECOND;
	}

	follow(surface: Surface): boolean {
		if (this.rest === undefined || !this.#fitsOn(surface, this.rest.offsetX)) {
			return false;
		}
		this.x = surface.left + this.rest.offsetX;
		this.y = this.#restingY(surface, this.rest.height);
		return true;
	}

	accelerate(seconds: number, clock: number): void {
		if (this.#clumped) {
			this.#tumble(seconds);
		} else {
			this.#float(seconds, clock);
		}
	}

	move(seconds: number, bounds: Bounds): void {
		this.x += this.vx * seconds;
		this.y = Math.min(
			this.y + this.vy * seconds,
			bounds.floor - this.size.height,
		);
		this.#thwumpAgainstWalls(bounds.width);
	}

	moveBy(dx: number, dy: number): void {
		this.x += dx;
		this.y += dy;
	}

	decide(surface: Surface, random: () => number): boolean {
		if (surface.landChance >= 1) {
			return true;
		}
		const decision = this.decisions.get(surface.id);
		if (decision !== undefined) {
			return decision;
		}
		const lands = random() < surface.landChance;
		this.decisions.set(surface.id, lands);
		return lands;
	}

	settle(surface: Surface): void {
		const offsetX = clamp(
			this.x - surface.left,
			0,
			Math.max(0, surface.right - surface.left - this.size.width),
		);
		const height = Math.max(0, surface.bottom - this.y - this.size.height);
		this.rest = { surfaceId: surface.id, offsetX, height };
		this.x = surface.left + offsetX;
		this.y = this.#restingY(surface, height);
		this.vx = 0;
		this.vy = 0;
	}

	#restingY(surface: Surface, height: number): number {
		return surface.bottom - height - this.size.height;
	}

	#fitsOn(surface: Surface, offsetX: number): boolean {
		return (
			offsetX >= 0 && offsetX + this.size.width <= surface.right - surface.left
		);
	}

	#float(seconds: number, clock: number): void {
		const sway =
			SWAY_SPEED_PX_PER_SECOND *
			Math.sin(clock * SWAY_RADIANS_PER_SECOND + this.phase);
		this.vx = approach(this.vx, sway, AIR_RESISTANCE_PER_SECOND * seconds);
		this.vy = approach(
			this.vy,
			FALL_SPEED_PX_PER_SECOND,
			AIR_RESISTANCE_PER_SECOND * seconds,
		);
	}

	#tumble(seconds: number): void {
		this.vx = approach(this.vx, 0, CLUMP_DRAG_PER_SECOND * seconds);
		this.vy = Math.min(
			this.vy + GRAVITY_PX_PER_SECOND_SQUARED * this.heft * seconds,
			CLUMP_FALL_SPEED_PX_PER_SECOND * this.heft,
		);
	}

	#thwumpAgainstWalls(width: number): void {
		const rightWall = Math.max(0, width - this.size.width);
		if (this.x < 0 || this.x > rightWall) {
			this.x = clamp(this.x, 0, rightWall);
			this.vx = (-this.vx * WALL_SLUMP) / this.heft;
		}
		this.atWall = this.x <= 0 || this.x >= rightWall;
	}
}
