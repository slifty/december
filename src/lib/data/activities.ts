import { activitySchema } from "../schemas/activity.ts";
import type { Activity } from "../schemas/activity.ts";

export type ListedActivity = Activity & { readonly id: string };

const JSON_EXTENSION = ".json";

const activityFiles = import.meta.glob<unknown>("./activities/*.json", {
	eager: true,
	import: "default",
});

export const activityIdFromPath = (path: string): string =>
	path.slice(path.lastIndexOf("/") + 1, -JSON_EXTENSION.length);

export const ACTIVITIES: readonly ListedActivity[] = Object.entries(
	activityFiles,
).map(([path, data]) => ({
	...activitySchema.parse(data),
	id: activityIdFromPath(path),
}));
