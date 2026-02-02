import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
import { signupBodySchema, loginBodySchema } from "@sideform/shared/schemas";

type SessionData = {
  userId?: string;
  email?: string;
};

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

async function getSession(): Promise<SessionData> {
  const { getCookie } = await import("@tanstack/react-start/server");
  try {
    const val = getCookie("session");
    if (!val) return {};
    return JSON.parse(val) as SessionData;
  } catch {
    return {};
  }
}

async function setSession(data: SessionData): Promise<void> {
  const { setCookie } = await import("@tanstack/react-start/server");
  setCookie("session", JSON.stringify(data), SESSION_COOKIE_OPTIONS);
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session.userId) {
    throw redirect({ to: "/login" });
  }
  return session.userId;
}

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getSession();
    const userId = session.userId;
    if (!userId) return null;
    const { getDb, users } = await import("@/db");
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user ?? null;
  }
);

function parsePayload<T>(v: unknown, schema: { parse: (u: unknown) => T }): T {
  const raw =
    typeof v === "object" && v !== null && "data" in v
      ? (v as { data: unknown }).data
      : v;
  return schema.parse(raw);
}

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => parsePayload(v, signupBodySchema))
  .handler(async ({ data }) => {
    const parsed = signupBodySchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid email or password" };
    }
    const { email, password } = parsed.data;
    const { getDb, users } = await import("@/db");
    const db = getDb();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return { error: "User already exists" };
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const [inserted] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    if (!inserted) {
      return { error: "Failed to create user" };
    }
    await setSession({ userId: inserted.id, email: inserted.email });
    return { user: inserted };
  });

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => parsePayload(v, loginBodySchema))
  .handler(async ({ data }) => {
    const parsed = loginBodySchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid email or password" };
    }
    const { email, password } = parsed.data;
    const { getDb, users } = await import("@/db");
    const db = getDb();
    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!userRow) {
      return { error: "Invalid credentials" };
    }
    const valid = await argon2.verify(userRow.passwordHash, password);
    if (!valid) {
      return { error: "Invalid credentials" };
    }
    await setSession({ userId: userRow.id, email: userRow.email });
    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        createdAt: userRow.createdAt,
        updatedAt: userRow.updatedAt,
      },
    };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie("session", { path: "/" });
  return { ok: true };
});
