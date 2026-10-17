import { z } from "zod";

export const ticketStatusSchema = z.object({
  status: z.enum(["OPEN", "TRIAGE", "READY_FOR_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  note: z.string().optional(),
});
export const assignmentSchema = z.object({ technicianId: z.string(), startsAt: z.string().optional(), endsAt: z.string().optional() });
