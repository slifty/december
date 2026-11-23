import { z } from "zod";

export const locationSchema = z.strictObject({
	name: z.string().min(1),
	address: z.string().min(1).optional(),
	url: z.url().optional(),
});

export type Location = z.infer<typeof locationSchema>;
