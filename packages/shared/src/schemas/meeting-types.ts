import { z } from "zod";

export const meetingTypeFieldSchema = z.object({
  label: z.string().min(1).max(255),
  placeholder: z.string().max(500).optional().nullable(),
  helperText: z.string().max(500).optional().nullable(),
  orderIndex: z.number().int().min(0),
});

export const meetingTypeFreeformBlockSchema = z.object({
  label: z.string().min(1).max(255),
  placeholder: z.string().max(500).optional().nullable(),
  orderIndex: z.number().int().min(0),
});

export const meetingTypeSectionSchema = z.object({
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().min(0),
  fields: z.array(meetingTypeFieldSchema).optional().default([]),
  freeformBlocks: z.array(meetingTypeFreeformBlockSchema).optional().default([]),
});

export const createMeetingTypeBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  sections: z.array(meetingTypeSectionSchema).min(1),
});

export const updateMeetingTypeBodySchema = createMeetingTypeBodySchema.partial();

export type MeetingTypeFieldInput = z.infer<typeof meetingTypeFieldSchema>;
export type MeetingTypeFreeformBlockInput = z.infer<typeof meetingTypeFreeformBlockSchema>;
export type MeetingTypeSectionInput = z.infer<typeof meetingTypeSectionSchema>;
export type CreateMeetingTypeBody = z.infer<typeof createMeetingTypeBodySchema>;
export type UpdateMeetingTypeBody = z.infer<typeof updateMeetingTypeBodySchema>;
