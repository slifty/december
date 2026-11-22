import { z } from "zod";

export const participantSchema = z.enum([
	"duey-schultzes",
	"webb-dueys",
	"webbs",
	"schultzes",
	"darraghs",
]);

export type Participant = z.infer<typeof participantSchema>;
