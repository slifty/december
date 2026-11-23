import { z } from "zod";
import { locationSchema } from "./location.ts";
import { timeOfDaySchema } from "./time-of-day.ts";

export const variantSchema = z.strictObject({
	name: z.string().min(1),
	description: z.string().min(1).optional(),
	location: locationSchema.optional(),
	estimatedCostDollars: z.int().nonnegative().optional(),
	estimatedMemberCostDollars: z.int().nonnegative().optional(),
	timesOfDay: z.array(timeOfDaySchema).min(1).optional(),
});

export type Variant = z.infer<typeof variantSchema>;
