import { z } from "zod";
import { monthDaySchema } from "../dates.ts";

export const phaseIdSchema = z.enum([
	"preparation",
	"growing-anticipation",
	"the-season",
	"new-year",
	"tear-down",
]);

export type PhaseId = z.infer<typeof phaseIdSchema>;

export const phaseSchema = z.strictObject({
	name: z.string().min(1),
	start: monthDaySchema.optional(),
	end: monthDaySchema.optional(),
});

export type Phase = z.infer<typeof phaseSchema>;

export const PHASES: Readonly<Record<PhaseId, Phase>> = z
	.record(phaseIdSchema, phaseSchema)
	.parse({
		preparation: { name: "Preparation", start: "11-22", end: "12-01" },
		"growing-anticipation": {
			name: "Growing Anticipation",
			start: "12-01",
			end: "12-19",
		},
		"the-season": { name: "The Season", start: "12-20", end: "12-30" },
		"new-year": { name: "New Year", start: "12-31", end: "01-03" },
		"tear-down": { name: "Tear Down" },
	});
