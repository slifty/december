import { z } from "zod";
import { monthDaySchema } from "../dates.ts";
import { categorySchema } from "./category.ts";
import { locationSchema } from "./location.ts";
import { participantSchema } from "./participant.ts";
import { phaseIdSchema } from "./phase.ts";
import { variantSchema } from "./variant.ts";

const MIN_TRADITION_LEVEL = 0;
const MAX_TRADITION_LEVEL = 5;

export const activitySchema = z.strictObject({
	title: z.string().min(1),
	description: z.string().min(1).optional(),
	category: categorySchema,
	date: monthDaySchema.optional(),
	location: locationSchema.optional(),
	durationMinutes: z.int().positive().optional(),
	estimatedCostDollars: z.int().nonnegative().optional(),
	estimatedMemberCostDollars: z.int().nonnegative().optional(),
	participants: z.array(participantSchema),
	advanceSteps: z
		.array(
			z.strictObject({
				title: z.string().min(1),
				description: z.string().min(1).optional(),
				daysBefore: z.int().nonnegative(),
			}),
		)
		.default([]),
	checklist: z.array(z.string().min(1)).default([]),
	variants: z.array(variantSchema).default([]),
	traditionLevel: z.int().min(MIN_TRADITION_LEVEL).max(MAX_TRADITION_LEVEL),
	phases: z.array(phaseIdSchema),
	sweetSpot: z
		.strictObject({
			relativeTo: monthDaySchema,
			fromDays: z.int(),
			toDays: z.int(),
		})
		.refine((sweetSpot) => sweetSpot.fromDays <= sweetSpot.toDays, {
			message: "fromDays must not be after toDays",
		})
		.optional(),
});

export type Activity = z.infer<typeof activitySchema>;
