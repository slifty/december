import { z } from "zod";
import { locationSchema } from "./location.ts";

export const shoppingLocationSchema = locationSchema.extend({
	goFor: z.string().min(1),
});

export type ShoppingLocation = z.infer<typeof shoppingLocationSchema>;
