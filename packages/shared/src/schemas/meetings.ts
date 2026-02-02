import { z } from "zod";

export const createMeetingBodySchema = z.object({
  meetingTypeId: z.string().uuid(),
  clientName: z.string().min(1).max(255),
  clientEmail: z.string().email().max(255),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  title: z.string().max(255).optional().nullable(),
});

export const validateInviteBodySchema = z.object({
  token: z.string().min(1),
});

export const wrapKeyBodySchema = z.object({
  dekBase64: z.string().min(1),
});

export const noteSnapshotBodySchema = z.object({
  seq: z.number().int().min(1),
  ciphertext: z.string(),
  nonce: z.string(),
  aad: z.record(z.unknown()).optional(),
});

export type CreateMeetingBody = z.infer<typeof createMeetingBodySchema>;
export type ValidateInviteBody = z.infer<typeof validateInviteBodySchema>;
export type WrapKeyBody = z.infer<typeof wrapKeyBodySchema>;
export type NoteSnapshotBody = z.infer<typeof noteSnapshotBodySchema>;
