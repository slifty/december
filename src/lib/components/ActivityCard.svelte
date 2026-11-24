<script lang="ts">
	import { onMount } from "svelte";
	import {
		capitalize,
		describeOffset,
		formatCountdown,
		formatDollars,
		formatDuration,
		formatLabel,
		formatMonthDay,
		formatName,
		formatShortMonthDay,
		hasCost,
	} from "../format.ts";
	import { MAX_TRADITION_LEVEL } from "../schemas/activity.ts";
	import { PHASES } from "../schemas/phase.ts";
	import type { ResolvedPathname } from "$app/types";
	import type { Activity } from "../schemas/activity.ts";
	import type { Location } from "../schemas/location.ts";
	import type { TimeOfDay } from "../schemas/time-of-day.ts";
	import type { Variant } from "../schemas/variant.ts";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	const { id, activity }: { id: string; activity: Activity } = $props();

	let open = $state(false);

	const isLinked = (): boolean => location.hash === `#${id}`;

	const openIfLinked = (): void => {
		if (isLinked()) {
			open = true;
		}
	};

	const replaceUrl = (url: ResolvedPathname): void => {
		void goto(url, { replace: true, shallow: true, state: page.state });
	};

	const handleToggle = (
		event: Event & { currentTarget: HTMLDetailsElement },
	): void => {
		if (event.currentTarget.open && !isLinked()) {
			replaceUrl(resolve(`/#${id}`));
		} else if (!event.currentTarget.open && isLinked()) {
			replaceUrl(resolve("/"));
		}
	};

	onMount(openIfLinked);

	const describeWhen = (): string | undefined => {
		if (activity.date !== undefined) {
			return formatShortMonthDay(activity.date);
		}
		if (activity.sweetSpot !== undefined) {
			const { relativeTo, fromDays, toDays } = activity.sweetSpot;
			return `${formatShortMonthDay(relativeTo, fromDays)} to ${formatShortMonthDay(relativeTo, toDays)}`;
		}
		return undefined;
	};

	const when = describeWhen();

	const advanceSteps = $derived(
		activity.advanceSteps.toSorted((a, b) => b.daysBefore - a.daysBefore),
	);
</script>

<svelte:window onhashchange={openIfLinked} />

{#snippet locationDetails(place: Location)}
	<dt>Location</dt>
	<dd>
		{#if place.url === undefined}
			{place.name}
		{:else}
			<a href={place.url} rel="external">{place.name}</a>
		{/if}
		{#if place.address !== undefined}
			<address>{place.address}</address>
		{/if}
	</dd>
{/snippet}

{#snippet costDetails(item: Activity | Variant)}
	{#if item.estimatedCostDollars !== undefined}
		<dt>Estimated cost</dt>
		<dd>{formatDollars(item.estimatedCostDollars)}</dd>
	{/if}
	{#if item.estimatedMemberCostDollars !== undefined}
		<dt>With membership</dt>
		<dd>{formatDollars(item.estimatedMemberCostDollars)}</dd>
	{/if}
{/snippet}

{#snippet timesOfDayDetails(timesOfDay: TimeOfDay[])}
	<dt>Time of day</dt>
	<dd>{timesOfDay.map(formatLabel).join(", ")}</dd>
{/snippet}

<details class="activity-card" {id} bind:open ontoggle={handleToggle}>
	<summary data-snow-ledge={open ? undefined : id}>
		{#if when !== undefined}
			<span class="when">{when}</span>
		{/if}
		<span class="title">{activity.title}</span>
	</summary>
	<div class="body">
		{#if activity.description !== undefined}
			<p>{activity.description}</p>
		{/if}
		<section class="group">
			<h3>About</h3>
			<dl>
				<dt>Category</dt>
				<dd>{formatLabel(activity.category)}</dd>
				<dt>Participants</dt>
				<dd>{activity.participants.map(formatName).join(", ")}</dd>
				<dt>Tradition level</dt>
				<dd>{activity.traditionLevel} / {MAX_TRADITION_LEVEL}</dd>
			</dl>
		</section>
		<section class="group">
			<h3>When</h3>
			<dl>
				{#if activity.date !== undefined}
					<dt>Date</dt>
					<dd>{formatMonthDay(activity.date)}</dd>
				{/if}
				{#if activity.sweetSpot !== undefined}
					<dt>Sweet spot</dt>
					<dd>
						{capitalize(describeOffset(activity.sweetSpot.fromDays))} to
						{describeOffset(activity.sweetSpot.toDays)}
						{formatMonthDay(activity.sweetSpot.relativeTo)}
					</dd>
				{/if}
				{#if activity.narrowlyScheduled}
					<dt>Scheduling</dt>
					<dd>Only on set dates</dd>
				{/if}
				<dt>Phases</dt>
				<dd>
					{activity.phases.map((phaseId) => PHASES[phaseId].name).join(", ")}
				</dd>
				{#if activity.timesOfDay !== undefined}
					{@render timesOfDayDetails(activity.timesOfDay)}
				{/if}
				{#if activity.durationMinutes !== undefined}
					<dt>Duration</dt>
					<dd>{formatDuration(activity.durationMinutes)}</dd>
				{/if}
			</dl>
		</section>
		{#if activity.location !== undefined}
			<section class="group">
				<h3>Where</h3>
				<dl>
					{@render locationDetails(activity.location)}
				</dl>
			</section>
		{/if}
		{#if hasCost(activity)}
			<section class="group">
				<h3>Cost</h3>
				<dl>
					{@render costDetails(activity)}
				</dl>
			</section>
		{/if}
		{#if activity.advanceSteps.length > 0}
			<section class="group">
				<h3>Advance steps</h3>
				<ul>
					{#each advanceSteps as step (step.title)}
						<li>
							<strong>{formatCountdown(step.daysBefore)}:</strong>
							{step.title}
							{#if step.description !== undefined}
								<p>{step.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if activity.variants.length > 0}
			<section class="group">
				<h3>Variants</h3>
				<div class="variants">
					{#each activity.variants as variant (variant.name)}
						<section class="variant">
							<h4>{variant.name}</h4>
							{#if variant.description !== undefined}
								<p>{variant.description}</p>
							{/if}
							{#if variant.location !== undefined || variant.timesOfDay !== undefined || hasCost(variant)}
								<dl>
									{#if variant.location !== undefined}
										{@render locationDetails(variant.location)}
									{/if}
									{#if variant.timesOfDay !== undefined}
										{@render timesOfDayDetails(variant.timesOfDay)}
									{/if}
									{@render costDetails(variant)}
								</dl>
							{/if}
						</section>
					{/each}
				</div>
			</section>
		{/if}
		{#if activity.checklist.length > 0}
			<section class="group">
				<h3>Checklist</h3>
				<ul class="checklist">
					{#each activity.checklist as item (item)}
						<li>
							<label><input type="checkbox" /> {item}</label>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
</details>

<style>
	.activity-card {
		border: 1px solid black;
		margin-block: 0.5rem;
	}

	summary {
		cursor: pointer;
		padding: 0.5rem 0.75rem;
	}

	.activity-card[open] summary {
		border-bottom: 1px solid black;
	}

	.title {
		font-weight: bold;
	}

	.when {
		float: right;
		margin-left: 1rem;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
	}

	.body > p {
		margin: 0;
	}

	.group {
		border: 1px solid black;
	}

	.group > h3 {
		font-size: 1em;
		margin: 0;
		padding: 0.25rem 0.75rem;
		background: black;
		color: white;
	}

	.group > dl,
	.group > ul {
		margin: 0;
		padding: 0.5rem 0.75rem;
	}

	.group > ul {
		padding-left: 2.25rem;
	}

	.group > .checklist {
		list-style: none;
		padding-left: 0.75rem;
	}

	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.25rem 1rem;
	}

	dt {
		font-weight: bold;
	}

	dd {
		margin: 0;
	}

	address {
		font-style: normal;
	}

	li + li {
		margin-top: 0.25rem;
	}

	li p {
		margin: 0;
	}

	.variants {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
	}

	.variant {
		border: 1px solid black;
	}

	.variant > h4 {
		font-size: 1em;
		margin: 0;
		padding: 0.25rem 0.75rem;
		background: lightgray;
	}

	.variant > :not(h4) {
		margin: 0.5rem 0.75rem;
	}
</style>
