import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { schools } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetSchoolResponse, UpdateSchoolBody, UpdateSchoolResponse } from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";
import { validateLogoUrl } from "../lib/url-safety";

const router: IRouter = Router();

function serialize(s: typeof schools.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    phone: s.phone,
    logoUrl: s.logoUrl,
    createdAt: s.createdAt?.toISOString() ?? null,
  };
}

router.get(
  "/school",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const [s] = await db.select().from(schools).where(eq(schools.id, schoolId));
    res.json(GetSchoolResponse.parse(serialize(s)));
  }),
);

router.patch(
  "/school",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.localUser!.role !== "school_admin") {
      res.status(403).json({ error: "Only school admins can update the school" });
      return;
    }
    const schoolId = req.localUser!.schoolId!;
    const body = UpdateSchoolBody.parse(req.body);
    if (body.logoUrl !== undefined) {
      const logoError = await validateLogoUrl(body.logoUrl);
      if (logoError) {
        res.status(400).json({ error: logoError });
        return;
      }
    }
    const [updated] = await db
      .update(schools)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      })
      .where(eq(schools.id, schoolId))
      .returning();
    res.json(UpdateSchoolResponse.parse(serialize(updated)));
  }),
);

export default router;
