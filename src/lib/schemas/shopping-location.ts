import { z } from "zod";

export const shoppingLocationSchema = z.strictObject({
	name: z.string().min(1),
	goFor: z.string().min(1),
	address: z.string().min(1).optional(),
	url: z.url().optional(),
});

export type ShoppingLocation = z.infer<typeof shoppingLocationSchema>;
