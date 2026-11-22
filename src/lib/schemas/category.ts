import { z } from "zod";

export const categorySchema = z.enum(["home", "indoor", "outdoor", "movie"]);

export type Category = z.infer<typeof categorySchema>;
