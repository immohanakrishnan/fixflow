import { z } from "zod";

export const technicianSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  skills: z.array(z.string()).default([]),
  propertyId: z.string().optional(),
});
