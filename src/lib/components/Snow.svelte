<script lang="ts">
	import { groundSurface, Snowfall } from "../snow.ts";
	import { DEFAULT_FLAKE_SIZE, Flake } from "../snowflake.ts";
	import type { FlakeSize, Point, Surface } from "../snowflake.ts";

	interface Ink {
		x: number;
		y: number;
		width: number;
		height: number;
	}

	interface Drawing {
		element: HTMLSpanElement;
		x: number;
		y: number;
		landed: boolean;
	}

	const FLAKE_TEXT = "*";
	const LEDGE_SELECTOR = "[data-snow-ledge]";
	const LEDGE_LAND_CHANCE = 0.5;
	const SHOVEL_RADIUS_PX = 48;
	const MILLISECONDS_PER_SECOND = 1000;
	const MAX_FRAME_SECONDS = 0.1;
	const MIN_MOVE_SECONDS = 0.008;
	const MAX_MOVE_GAP_SECONDS = 0.1;
	const SWEEP_SCALE = 0.5;
	const BRUSH_SAMPLES_PER_RADIUS = 2;
	const SNOW_DELAY_SECONDS = 5;

	let layer: HTMLDivElement | undefined = $state();
	let floor = $state(0);
	let firstFlake: Point | undefined = $state();

	let snowfall: Snowfall | undefined;
	const drawings = new WeakMap<Flake, Drawing>();
	let lastPoint: Point | undefined;
	let lastMoveTime = 0;

	const measureLedge = (element: HTMLElement): Surface | undefined => {
		const id = element.dataset.snowLedge;
		if (id === undefined) {
			return undefined;
		}
		const rect = element.getBoundingClientRect();
		return {
			id,
			left: rect.left + window.scrollX,
			right: rect.right + window.scrollX,
			top: rect.top + window.scrollY,
			bottom: rect.bottom + window.scrollY,
			landChance: LEDGE_LAND_CHANCE,
		};
	};

	const measureFloor = (): number =>
		Math.max(
			document.body.getBoundingClientRect().bottom + window.scrollY,
			window.innerHeight,
		);

	const measureSurfaces = (width: number): Surface[] => [
		...[...document.querySelectorAll<HTMLElement>(LEDGE_SELECTOR)]
			.map(measureLedge)
			.filter((surface) => surface !== undefined),
		groundSurface(width, floor),
	];

	const createElement = (container: HTMLDivElement): HTMLSpanElement => {
		const element = document.createElement("span");
		element.className = "flake";
		const glyph = document.createElement("span");
		glyph.className = "glyph";
		glyph.textContent = FLAKE_TEXT;
		element.append(glyph);
		container.append(element);
		return element;
	};

	const measureText = (element: Element): TextMetrics | undefined => {
		const context = document.createElement("canvas").getContext("2d");
		if (context === null) {
			return undefined;
		}
		const style = getComputedStyle(element);
		context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
		return context.measureText(FLAKE_TEXT);
	};

	const findFlakeText = (element: Element): Text | undefined =>
		[...element.childNodes].find(
			(node): node is Text =>
				node instanceof Text && node.data.includes(FLAKE_TEXT),
		);

	const locateOrigin = (text: Text): number => {
		const range = document.createRange();
		const index = text.data.indexOf(FLAKE_TEXT);
		range.setStart(text, index);
		range.setEnd(text, index + FLAKE_TEXT.length);
		return range.getBoundingClientRect().left;
	};

	const locateBaseline = (element: Element): number => {
		const marker = document.createElement("span");
		marker.style.display = "inline-block";
		marker.style.width = "0";
		marker.style.height = "0";
		element.append(marker);
		const baseline = marker.getBoundingClientRect().top;
		marker.remove();
		return baseline;
	};

	const locateInk = (element: Element): Ink | undefined => {
		const text = findFlakeText(element);
		const metrics = measureText(element);
		if (text === undefined || metrics === undefined) {
			return undefined;
		}
		return {
			x: locateOrigin(text) - metrics.actualBoundingBoxLeft,
			y: locateBaseline(element) - metrics.actualBoundingBoxAscent,
			width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
			height:
				metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
		};
	};

	const fitFlakesToInk = (container: HTMLDivElement): FlakeSize => {
		const probe = createElement(container);
		const glyph = probe.firstElementChild;
		const ink = glyph === null ? undefined : locateInk(glyph);
		const box = probe.getBoundingClientRect();
		probe.remove();
		if (ink === undefined) {
			return DEFAULT_FLAKE_SIZE;
		}
		container.style.setProperty("--flake-width", `${ink.width}px`);
		container.style.setProperty("--flake-height", `${ink.height}px`);
		container.style.setProperty("--glyph-left", `${box.left - ink.x}px`);
		container.style.setProperty("--glyph-top", `${box.top - ink.y}px`);
		return { width: ink.width, height: ink.height };
	};

	const render = (container: HTMLDivElement, current: Snowfall): void => {
		for (const flake of current.flakes) {
			const drawn = drawings.get(flake) ?? {
				element: createElement(container),
				x: Number.NaN,
				y: Number.NaN,
				landed: false,
			};
			drawings.set(flake, drawn);
			if (drawn.x !== flake.x || drawn.y !== flake.y) {
				drawn.element.style.transform = `translate(${flake.x}px, ${flake.y}px)`;
				drawn.x = flake.x;
				drawn.y = flake.y;
			}
			const landed = flake.rest !== undefined;
			if (drawn.landed !== landed) {
				drawn.element.classList.toggle("landed", landed);
				drawn.landed = landed;
			}
		}
	};

	const brushAlong = (from: Point, to: Point, sweep: number): void => {
		const distance = Math.hypot(to.x - from.x, to.y - from.y);
		const samples = Math.max(
			1,
			Math.ceil((distance / SHOVEL_RADIUS_PX) * BRUSH_SAMPLES_PER_RADIUS),
		);
		for (let sample = 1; sample <= samples; sample += 1) {
			const progress = sample / samples;
			snowfall?.brush(
				{
					x: from.x + (to.x - from.x) * progress,
					y: from.y + (to.y - from.y) * progress,
				},
				SHOVEL_RADIUS_PX,
				sweep,
			);
		}
	};

	const pointOf = (event: PointerEvent): Point => ({
		x: event.pageX,
		y: event.pageY,
	});

	const handlePointerMove = (event: PointerEvent): void => {
		const point = pointOf(event);
		const seconds = (event.timeStamp - lastMoveTime) / MILLISECONDS_PER_SECOND;
		const from =
			lastPoint === undefined || seconds > MAX_MOVE_GAP_SECONDS
				? point
				: lastPoint;
		const elapsed = Math.max(seconds, MIN_MOVE_SECONDS);
		brushAlong(from, point, ((point.x - from.x) / elapsed) * SWEEP_SCALE);
		lastPoint = point;
		lastMoveTime = event.timeStamp;
	};

	const letItSnow = (
		event: MouseEvent & { currentTarget: HTMLButtonElement },
	): void => {
		const ink =
			locateInk(event.currentTarget) ??
			event.currentTarget.getBoundingClientRect();
		firstFlake = {
			x: ink.x + window.scrollX,
			y: ink.y + window.scrollY,
		};
	};

	$effect(() => {
		if (!layer || firstFlake === undefined) {
			return undefined;
		}
		const container = layer;
		const flakeSize = fitFlakesToInk(container);
		const current = new Snowfall({
			delaySeconds: SNOW_DELAY_SECONDS,
			flakeSize,
		});
		current.flakes.push(
			new Flake(firstFlake.x, firstFlake.y, { size: flakeSize }),
		);
		snowfall = current;
		let frameRequest = 0;
		let previousTime: number | undefined;
		const tick = (time: number): void => {
			const seconds =
				previousTime === undefined
					? 0
					: Math.min(
							(time - previousTime) / MILLISECONDS_PER_SECOND,
							MAX_FRAME_SECONDS,
						);
			previousTime = time;
			const width = document.documentElement.clientWidth;
			floor = measureFloor();
			current.step({
				surfaces: measureSurfaces(width),
				width,
				seconds,
				random: Math.random,
			});
			render(container, current);
			frameRequest = requestAnimationFrame(tick);
		};
		frameRequest = requestAnimationFrame(tick);
		return (): void => {
			cancelAnimationFrame(frameRequest);
			snowfall = undefined;
		};
	});
</script>

<svelte:window onpointermove={handlePointerMove} />

{#if firstFlake !== undefined}
	<div
		bind:this={layer}
		class="snow"
		style:height="{floor}px"
		aria-hidden="true"
	></div>
{/if}

{#if firstFlake === undefined}
	<button
		type="button"
		class="first-flake"
		aria-label="Let it snow"
		onclick={letItSnow}
	>
		{FLAKE_TEXT}
	</button>
{/if}

<style>
	.snow {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		overflow: clip;
		pointer-events: none;
		user-select: none;
	}

	.snow :global(.flake) {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--flake-width);
		height: var(--flake-height);
	}

	.snow :global(.glyph) {
		position: absolute;
		top: var(--glyph-top, 0);
		left: var(--glyph-left, 0);
		white-space: nowrap;
		pointer-events: none;
	}

	.snow :global(.flake.landed) {
		pointer-events: auto;
	}

	.first-flake {
		all: unset;
		position: fixed;
		top: 1rem;
		right: 1rem;
		cursor: pointer;
	}

	.first-flake:focus-visible {
		outline: auto;
	}
</style>
