import { z } from "zod";

export const timeOfDaySchema = z.enum([
	"morning",
	"afternoon",
	"evening",
	"after-bedtime",
]);

export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
