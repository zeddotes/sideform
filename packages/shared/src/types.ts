/** User (professional) – no client accounts in MVP */
export type User = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Meeting type template */
export type MeetingType = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingTypeSection = {
  id: string;
  meetingTypeId: string;
  title: string;
  orderIndex: number;
  createdAt: Date;
};

export type MeetingTypeField = {
  id: string;
  sectionId: string;
  label: string;
  placeholder: string | null;
  helperText: string | null;
  orderIndex: number;
  createdAt: Date;
};

export type MeetingTypeFreeformBlock = {
  id: string;
  sectionId: string;
  label: string;
  placeholder: string | null;
  orderIndex: number;
  createdAt: Date;
};

export type MeetingStatus = "scheduled" | "in_progress" | "ended";

export type Meeting = {
  id: string;
  userId: string;
  meetingTypeId: string;
  title: string | null;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  clientName: string;
  clientEmail: string;
  inviteTokenHash: string;
  inviteExpiresAt: Date;
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SenderRole = "professional" | "guest";

export type MeetingChatMessage = {
  id: string;
  meetingId: string;
  senderRole: SenderRole;
  ciphertext: string;
  nonce: string;
  createdAt: Date;
};

export type MeetingFile = {
  id: string;
  meetingId: string;
  uploaderRole: SenderRole;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: Date;
};
