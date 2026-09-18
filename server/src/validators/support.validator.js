import { z } from "zod";
export const createSupportTicketSchema = z.object({ subject: z.string().trim().min(2).max(150), message: z.string().trim().min(2).max(2000), priority: z.enum(["low", "normal", "high"]).optional() }).strict();
export const replySupportTicketSchema = z.object({ content: z.string().trim().min(1).max(2000) }).strict();
export const updateSupportTicketSchema = z.object({ status: z.enum(["open", "in_progress", "resolved"]) }).strict();
