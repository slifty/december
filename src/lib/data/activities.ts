import { z } from "zod";
import { activitySchema } from "../schemas/activity.ts";
import type { Activity } from "../schemas/activity.ts";

const activityFiles = import.meta.glob<unknown>("./activities/*.json", {
	eager: true,
	import: "default",
});

export const ACTIVITIES: readonly Activity[] = z
	.array(activitySchema)
	.parse(Object.values(activityFiles));
