import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { users, type User } from "@workspace/db";
import { and, eq, isNull, sql } from "drizzle-orm";

const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AuthedRequest extends Request {
  localUser?: User | null;
  clerkUserId?: string;
  clerkEmail?: string | null;
  clerkName?: string | null;
}

export interface ClerkIdentity {
  clerkUserId: string;
  email: string | null;
  name: string | null;
}

export async function fetchClerkIdentity(
  clerkUserId: string,
): Promise<ClerkIdentity> {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    null;
  return { clerkUserId, email, name };
}

export async function resolveLocalUser(
  identity: ClerkIdentity,
): Promise<User | null> {
  const [linked] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, identity.clerkUserId));
  if (linked) return linked;

  const emailLower = identity.email?.toLowerCase() ?? null;

  if (emailLower && SUPER_ADMIN_EMAILS.includes(emailLower)) {
    const [existing] = emailLower
      ? await db
          .select()
          .from(users)
          .where(sql`lower(${users.email}) = ${emailLower}`)
      : [];
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          clerkUserId: identity.clerkUserId,
          role: "super_admin",
          status: "active",
          name: identity.name ?? existing.name,
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(users)
      .values({
        clerkUserId: identity.clerkUserId,
        email: emailLower ?? "",
        name: identity.name,
        role: "super_admin",
        status: "active",
      })
      .returning();
    return created;
  }

  if (emailLower) {
    const [invited] = await db
      .select()
      .from(users)
      .where(
        and(
          sql`lower(${users.email}) = ${emailLower}`,
          isNull(users.clerkUserId),
        ),
      );
    if (invited) {
      const [updated] = await db
        .update(users)
        .set({
          clerkUserId: identity.clerkUserId,
          status: "active",
          name: identity.name ?? invited.name,
        })
        .where(eq(users.id, invited.id))
        .returning();
      return updated;
    }
  }

  return null;
}

export async function attachUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    req.clerkUserId = clerkUserId;

    const [linked] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId));
    if (linked) {
      req.localUser = linked;
      req.clerkEmail = linked.email;
      req.clerkName = linked.name ?? null;
      next();
      return;
    }

    const identity = await fetchClerkIdentity(clerkUserId);
    req.clerkEmail = identity.email;
    req.clerkName = identity.name;
    req.localUser = await resolveLocalUser(identity);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.localUser) {
    res.status(403).json({ error: "Onboarding required" });
    return;
  }
  next();
}

export function requireSchool(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.localUser?.schoolId) {
    res.status(403).json({ error: "School membership required" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.localUser || !roles.includes(req.localUser.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
