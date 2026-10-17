import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  propertyId: z.string(),
  unitId: z.string(),
  attachment: z
    .object({
      filename: z.string().min(1).max(255),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      url: z.string().startsWith("data:image/").max(7_000_000),
    })
    .optional(),
});
export type RequestInput = z.infer<typeof requestSchema>;
