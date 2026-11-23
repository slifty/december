<script lang="ts">
	import { PHASES } from "../schemas/phase.ts";
	import type { Activity } from "../schemas/activity.ts";

	const { activity }: { activity: Activity } = $props();

	const describeOffset = (days: number): string => {
		if (days === 0) {
			return "day of";
		}
		const unit = Math.abs(days) === 1 ? "day" : "days";
		return `${String(Math.abs(days))} ${unit} ${days < 0 ? "before" : "after"}`;
	};
</script>

<details class="activity-card">
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
		{#if activity.sweetSpot !== undefined}
			<dt>Sweet spot</dt>
			<dd>
				From {describeOffset(activity.sweetSpot.fromDays)}
				to {describeOffset(activity.sweetSpot.toDays)}
				{activity.sweetSpot.relativeTo}
			</dd>
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
