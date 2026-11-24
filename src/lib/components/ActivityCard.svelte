<script lang="ts">
	import { onMount } from "svelte";
	import { PHASES } from "../schemas/phase.ts";
	import type { ResolvedPathname } from "$app/types";
	import type { Activity } from "../schemas/activity.ts";
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

	const describeOffset = (days: number): string => {
		if (days === 0) {
			return "day of";
		}
		const unit = Math.abs(days) === 1 ? "day" : "days";
		return `${String(Math.abs(days))} ${unit} ${days < 0 ? "before" : "after"}`;
	};
</script>

<svelte:window onhashchange={openIfLinked} />

<details class="activity-card" {id} bind:open ontoggle={handleToggle}>
	<summary>{activity.title}</summary>
	{#if activity.description !== undefined}
		<p>{activity.description}</p>
	{/if}
	<dl>
		<dt>Category</dt>
		<dd>{activity.category}</dd>
		{#if activity.date !== undefined}
			<dt>Date</dt>
			<dd>{activity.date}</dd>
		{/if}
		{#if activity.location !== undefined}
			<dt>Location</dt>
			<dd>
				{activity.location.name}
				{#if activity.location.address !== undefined}
					<address>{activity.location.address}</address>
				{/if}
			</dd>
		{/if}
		{#if activity.sweetSpot !== undefined}
			<dt>Sweet spot</dt>
			<dd>
				From {describeOffset(activity.sweetSpot.fromDays)}
				to {describeOffset(activity.sweetSpot.toDays)}
				{activity.sweetSpot.relativeTo}
			</dd>
		{/if}
		{#if activity.narrowlyScheduled}
			<dt>Scheduling</dt>
			<dd>Only on set dates</dd>
		{/if}
		{#if activity.timesOfDay !== undefined}
			<dt>Time of day</dt>
			<dd>{activity.timesOfDay.join(", ")}</dd>
		{/if}
		<dt>Phases</dt>
		<dd>
			{activity.phases.map((phaseId) => PHASES[phaseId].name).join(", ")}
		</dd>
		{#if activity.durationMinutes !== undefined}
			<dt>Duration</dt>
			<dd>{activity.durationMinutes} minutes</dd>
		{/if}
		{#if activity.estimatedCostDollars !== undefined}
			<dt>Estimated cost</dt>
			<dd>${activity.estimatedCostDollars}</dd>
		{/if}
		{#if activity.estimatedMemberCostDollars !== undefined}
			<dt>Cost (with membership)</dt>
			<dd>${activity.estimatedMemberCostDollars}</dd>
		{/if}
		<dt>Participants</dt>
		<dd>{activity.participants.join(", ")}</dd>
		<dt>Tradition level</dt>
		<dd>{activity.traditionLevel}</dd>
	</dl>
	{#if activity.advanceSteps.length > 0}
		<h3>Advance steps</h3>
		<ul>
			{#each activity.advanceSteps as step (step.title)}
				<li>
					{step.title} ({describeOffset(-step.daysBefore)})
					{#if step.description !== undefined}
						<p>{step.description}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if activity.variants.length > 0}
		<h3>Variants</h3>
		<ul>
			{#each activity.variants as variant (variant.name)}
				<li>
					{variant.name}
					{#if variant.description !== undefined}
						<p>{variant.description}</p>
					{/if}
					<dl>
						{#if variant.location !== undefined}
							<dt>Location</dt>
							<dd>
								{variant.location.name}
								{#if variant.location.address !== undefined}
									<address>{variant.location.address}</address>
								{/if}
							</dd>
						{/if}
						{#if variant.estimatedCostDollars !== undefined}
							<dt>Estimated cost</dt>
							<dd>${variant.estimatedCostDollars}</dd>
						{/if}
						{#if variant.estimatedMemberCostDollars !== undefined}
							<dt>Cost (with membership)</dt>
							<dd>${variant.estimatedMemberCostDollars}</dd>
						{/if}
						{#if variant.timesOfDay !== undefined}
							<dt>Time of day</dt>
							<dd>{variant.timesOfDay.join(", ")}</dd>
						{/if}
					</dl>
				</li>
			{/each}
		</ul>
	{/if}
	{#if activity.checklist.length > 0}
		<h3>Checklist</h3>
		<ul>
			{#each activity.checklist as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
</details>

<style>
	.activity-card {
		border: 1px solid black;
		margin: 3px;
		padding: 2px;
	}

	summary {
		cursor: pointer;
	}
</style>
