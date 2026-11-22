import { z } from "zod";

export const categorySchema = z.enum(["outdoor", "indoor", "movie"]);

export type Category = z.infer<typeof categorySchema>;
