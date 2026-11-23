import { z } from "zod";
import { locationSchema } from "./location.ts";

export const variantSchema = z.strictObject({
	name: z.string().min(1),
	description: z.string().min(1).optional(),
	location: locationSchema.optional(),
	estimatedCostDollars: z.int().nonnegative().optional(),
	estimatedMemberCostDollars: z.int().nonnegative().optional(),
});

export type Variant = z.infer<typeof variantSchema>;
