import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, waitlist, bugReports, InsertBugReport } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Waitlist ──

export async function addToWaitlist(email: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to waitlist: database not available");
    throw new Error("Database not available");
  }

  try {
    // Check if email already exists first
    const existing = await db.select().from(waitlist).where(eq(waitlist.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      return { success: true, message: "You're already on the list! We'll be in touch soon." };
    }
    await db.insert(waitlist).values({ email: email.toLowerCase().trim() });
    return { success: true, message: "You're on the list! We'll notify you when the app launches." };
  } catch (error: any) {
    // Catch duplicate entry errors as a fallback
    const errMsg = String(error?.message || "") + String(error?.code || "");
    if (errMsg.includes("Duplicate") || errMsg.includes("ER_DUP_ENTRY") || errMsg.includes("unique")) {
      return { success: true, message: "You're already on the list! We'll be in touch soon." };
    }
    console.error("[Database] Failed to add to waitlist:", error);
    throw error;
  }
}

export async function getWaitlistEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(waitlist).orderBy(waitlist.createdAt);
}

export async function getWaitlistCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(waitlist);
  return result.length;
}

// ── Bug Reports ──

export async function submitBugReport(data: {
  description: string;
  screen?: string;
  platform?: string;
  email?: string;
}): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot submit bug report: database not available");
    throw new Error("Database not available");
  }

  try {
    await db.insert(bugReports).values({
      description: data.description.trim(),
      screen: data.screen?.trim() || null,
      platform: data.platform?.trim() || null,
      email: data.email?.toLowerCase().trim() || null,
    });
    return { success: true, message: "Bug report submitted successfully. Thank you for your feedback!" };
  } catch (error: any) {
    console.error("[Database] Failed to submit bug report:", error);
    throw error;
  }
}

export async function getBugReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
}

export async function getBugReportCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(bugReports);
  return result.length;
}
