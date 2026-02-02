import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingTypes = pgTable("meeting_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingTypeSections = pgTable("meeting_type_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingTypeId: uuid("meeting_type_id")
    .notNull()
    .references(() => meetingTypes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingTypeFields = pgTable("meeting_type_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => meetingTypeSections.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  helperText: text("helper_text"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingTypeFreeformBlocks = pgTable("meeting_type_freeform_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => meetingTypeSections.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "ended",
]);

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  meetingTypeId: uuid("meeting_type_id")
    .notNull()
    .references(() => meetingTypes.id, { onDelete: "cascade" }),
  title: text("title"),
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  inviteTokenHash: text("invite_token_hash").notNull(),
  inviteExpiresAt: timestamp("invite_expires_at", { withTimezone: true }).notNull(),
  status: meetingStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingKeys = pgTable("meeting_keys", {
  meetingId: uuid("meeting_id")
    .primaryKey()
    .references(() => meetings.id, { onDelete: "cascade" }),
  encryptedDek: text("encrypted_dek").notNull(),
  dekKmsKeyId: text("dek_kms_key_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingNoteSnapshots = pgTable("meeting_note_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
  ciphertext: text("ciphertext").notNull(),
  nonce: text("nonce").notNull(),
  aad: jsonb("aad"),
  clientHash: text("client_hash"),
  prevSnapshotHash: text("prev_snapshot_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const senderRoleEnum = pgEnum("sender_role", ["professional", "guest"]);

export const meetingChatMessages = pgTable("meeting_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  senderRole: senderRoleEnum("sender_role").notNull(),
  ciphertext: text("ciphertext").notNull(),
  nonce: text("nonce").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const meetingFiles = pgTable("meeting_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  uploaderRole: senderRoleEnum("uploader_role").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storageKey: text("storage_key").notNull(),
  ciphertextMeta: text("ciphertext_meta"),
  nonceMeta: text("nonce_meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  meetingTypes: many(meetingTypes),
  meetings: many(meetings),
}));

export const meetingTypesRelations = relations(meetingTypes, ({ one, many }) => ({
  user: one(users),
  sections: many(meetingTypeSections),
  meetings: many(meetings),
}));

export const meetingTypeSectionsRelations = relations(
  meetingTypeSections,
  ({ one, many }) => ({
    meetingType: one(meetingTypes),
    fields: many(meetingTypeFields),
    freeformBlocks: many(meetingTypeFreeformBlocks),
  })
);

export const meetingTypeFieldsRelations = relations(meetingTypeFields, ({ one }) => ({
  section: one(meetingTypeSections),
}));

export const meetingTypeFreeformBlocksRelations = relations(
  meetingTypeFreeformBlocks,
  ({ one }) => ({
    section: one(meetingTypeSections),
  })
);

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  user: one(users),
  meetingType: one(meetingTypes),
  keys: many(meetingKeys),
  noteSnapshots: many(meetingNoteSnapshots),
  chatMessages: many(meetingChatMessages),
  files: many(meetingFiles),
}));

export const meetingKeysRelations = relations(meetingKeys, ({ one }) => ({
  meeting: one(meetings),
}));

export const meetingNoteSnapshotsRelations = relations(meetingNoteSnapshots, ({ one }) => ({
  meeting: one(meetings),
}));

export const meetingChatMessagesRelations = relations(meetingChatMessages, ({ one }) => ({
  meeting: one(meetings),
}));

export const meetingFilesRelations = relations(meetingFiles, ({ one }) => ({
  meeting: one(meetings),
}));
