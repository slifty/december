<script lang="ts">
	import ActivityCard from "#lib/components/ActivityCard.svelte";
	import Snow from "#lib/components/Snow.svelte";
	import { ACTIVITIES } from "#lib/data/activities.ts";
	import { sortByTimeline } from "#lib/timeline.ts";

	const activities = sortByTimeline(ACTIVITIES);
</script>

<svelte:head>
	<title>December</title>
</svelte:head>

<h1>December</h1>
<p>This stuff doesn't all just happen by itself...</p>

{#each activities as activity (activity.id)}
	<ActivityCard id={activity.id} {activity} />
{/each}

<Snow />
