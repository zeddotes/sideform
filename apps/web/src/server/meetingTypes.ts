import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  createMeetingTypeBodySchema,
  updateMeetingTypeBodySchema,
  type UpdateMeetingTypeBody,
} from "@sideform/shared/schemas";

export const listMeetingTypesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { requireUserId } = await import("./auth");
    const { getDb, meetingTypes } = await import("@/db");
    const userId = await requireUserId();
    const db = getDb();
    const rows = await db
      .select({
        id: meetingTypes.id,
        name: meetingTypes.name,
        description: meetingTypes.description,
        createdAt: meetingTypes.createdAt,
      })
      .from(meetingTypes)
      .where(eq(meetingTypes.userId, userId))
      .orderBy(desc(meetingTypes.updatedAt));
    return rows;
  }
);

export type MeetingTypeWithDetails = {
  id: string;
  name: string;
  description: string | null;
  sections: {
    id: string;
    title: string;
    orderIndex: number;
    fields: {
      id: string;
      label: string;
      placeholder: string | null;
      helperText: string | null;
      orderIndex: number;
    }[];
    freeformBlocks: {
      id: string;
      label: string;
      placeholder: string | null;
      orderIndex: number;
    }[];
  }[];
};

export const getMeetingTypeFn = createServerFn({ method: "GET" }).handler(
  async (ctx) => {
    const meetingTypeId =
      (ctx.data as { meetingTypeId?: string })?.meetingTypeId ??
      (ctx.data as { data?: { meetingTypeId?: string } })?.data?.meetingTypeId;
    if (!meetingTypeId) return null;
    const { requireUserId } = await import("./auth");
    const {
      getDb,
      meetingTypes,
      meetingTypeSections,
      meetingTypeFields,
      meetingTypeFreeformBlocks,
    } = await import("@/db");
    const userId = await requireUserId();
    const db = getDb();
    const [row] = await db
      .select()
      .from(meetingTypes)
      .where(
        and(
          eq(meetingTypes.id, meetingTypeId),
          eq(meetingTypes.userId, userId)
        )
      )
      .limit(1);
    if (!row) return null;
    const sectionRows = await db
      .select()
      .from(meetingTypeSections)
      .where(eq(meetingTypeSections.meetingTypeId, meetingTypeId))
      .orderBy(asc(meetingTypeSections.orderIndex));
    const sections: MeetingTypeWithDetails["sections"] = [];
    for (const sec of sectionRows) {
      const [fieldRows, freeformRows] = await Promise.all([
        db
          .select()
          .from(meetingTypeFields)
          .where(eq(meetingTypeFields.sectionId, sec.id))
          .orderBy(asc(meetingTypeFields.orderIndex)),
        db
          .select()
          .from(meetingTypeFreeformBlocks)
          .where(eq(meetingTypeFreeformBlocks.sectionId, sec.id))
          .orderBy(asc(meetingTypeFreeformBlocks.orderIndex)),
      ]);
      sections.push({
        id: sec.id,
        title: sec.title,
        orderIndex: sec.orderIndex,
        fields: fieldRows.map((f) => ({
          id: f.id,
          label: f.label,
          placeholder: f.placeholder,
          helperText: f.helperText,
          orderIndex: f.orderIndex,
        })),
        freeformBlocks: freeformRows.map((b) => ({
          id: b.id,
          label: b.label,
          placeholder: b.placeholder,
          orderIndex: b.orderIndex,
        })),
      });
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sections,
    };
  }
);

export const createMeetingTypeFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: unknown }) => {
    const parsed = createMeetingTypeBodySchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid meeting type data" };
    }
    const { requireUserId } = await import("./auth");
    const {
      getDb,
      meetingTypes,
      meetingTypeSections,
      meetingTypeFields,
      meetingTypeFreeformBlocks,
    } = await import("@/db");
    const userId = await requireUserId();
    const db = getDb();
    const [meetingType] = await db
      .insert(meetingTypes)
      .values({
        userId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning({ id: meetingTypes.id });
    if (!meetingType) return { error: "Failed to create meeting type" };
    for (let i = 0; i < parsed.data.sections.length; i++) {
      const sec = parsed.data.sections[i];
      const [sectionRow] = await db
        .insert(meetingTypeSections)
        .values({
          meetingTypeId: meetingType.id,
          title: sec.title,
          orderIndex: sec.orderIndex,
        })
        .returning({ id: meetingTypeSections.id });
      if (!sectionRow) continue;
      for (let j = 0; j < (sec.fields ?? []).length; j++) {
        const f = sec.fields![j];
        await db.insert(meetingTypeFields).values({
          sectionId: sectionRow.id,
          label: f.label,
          placeholder: f.placeholder ?? null,
          helperText: f.helperText ?? null,
          orderIndex: f.orderIndex,
        });
      }
      for (let j = 0; j < (sec.freeformBlocks ?? []).length; j++) {
        const b = sec.freeformBlocks![j];
        await db.insert(meetingTypeFreeformBlocks).values({
          sectionId: sectionRow.id,
          label: b.label,
          placeholder: b.placeholder ?? null,
          orderIndex: b.orderIndex,
        });
      }
    }
    return { id: meetingType.id };
  }
);

export const updateMeetingTypeFn = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const payload = ctx.data as {
      meetingTypeId?: string;
      data?: UpdateMeetingTypeBody;
    };
    const meetingTypeId = payload.meetingTypeId;
    const data = payload.data;
    if (!meetingTypeId || !data) {
      return { error: "Invalid meeting type data" };
    }
    const parsed = updateMeetingTypeBodySchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid meeting type data" };
    }
    const { requireUserId } = await import("./auth");
    const {
      getDb,
      meetingTypes,
      meetingTypeSections,
      meetingTypeFields,
      meetingTypeFreeformBlocks,
    } = await import("@/db");
    const userId = await requireUserId();
    const db = getDb();
    const [existing] = await db
      .select()
      .from(meetingTypes)
      .where(
        and(
          eq(meetingTypes.id, meetingTypeId),
          eq(meetingTypes.userId, userId)
        )
      )
      .limit(1);
    if (!existing) {
      return { error: "Meeting type not found" };
    }
    await db.transaction(async (tx) => {
      if (parsed.data.name !== undefined || parsed.data.description !== undefined) {
        await tx
          .update(meetingTypes)
          .set({
            ...(parsed.data.name !== undefined && { name: parsed.data.name }),
            ...(parsed.data.description !== undefined && {
              description: parsed.data.description ?? null,
            }),
            updatedAt: new Date(),
          })
          .where(eq(meetingTypes.id, meetingTypeId));
      }
      if (parsed.data.sections !== undefined) {
        await tx
          .delete(meetingTypeSections)
          .where(eq(meetingTypeSections.meetingTypeId, meetingTypeId));
        for (const sec of parsed.data.sections) {
          const [sectionRow] = await tx
            .insert(meetingTypeSections)
            .values({
              meetingTypeId,
              title: sec.title,
              orderIndex: sec.orderIndex,
            })
            .returning({ id: meetingTypeSections.id });
          if (!sectionRow) continue;
          for (const f of sec.fields ?? []) {
            await tx.insert(meetingTypeFields).values({
              sectionId: sectionRow.id,
              label: f.label,
              placeholder: f.placeholder ?? null,
              helperText: f.helperText ?? null,
              orderIndex: f.orderIndex,
            });
          }
          for (const b of sec.freeformBlocks ?? []) {
            await tx.insert(meetingTypeFreeformBlocks).values({
              sectionId: sectionRow.id,
              label: b.label,
              placeholder: b.placeholder ?? null,
              orderIndex: b.orderIndex,
            });
          }
        }
      }
    });
    return { ok: true };
  }
);

export const deleteMeetingTypeFn = createServerFn({ method: "POST" }).handler(
  async (ctx) => {
    const meetingTypeId =
      (ctx.data as { meetingTypeId?: string })?.meetingTypeId ??
      (ctx.data as { data?: { meetingTypeId?: string } })?.data?.meetingTypeId;
    if (!meetingTypeId) return { error: "Meeting type not found" };
    const { requireUserId } = await import("./auth");
    const { getDb, meetingTypes } = await import("@/db");
    const userId = await requireUserId();
    const db = getDb();
    const [existing] = await db
      .select()
      .from(meetingTypes)
      .where(
        and(
          eq(meetingTypes.id, meetingTypeId),
          eq(meetingTypes.userId, userId)
        )
      )
      .limit(1);
    if (!existing) {
      return { error: "Meeting type not found" };
    }
    await db
      .delete(meetingTypes)
      .where(
        and(
          eq(meetingTypes.id, meetingTypeId),
          eq(meetingTypes.userId, userId)
        )
      );
    return { ok: true };
  }
);
