import type { Request, Response, NextFunction, RequestHandler } from "express";

interface ZodLikeError {
  name: string;
  issues?: { message?: string }[];
}

function isZodError(err: unknown): err is ZodLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "ZodError"
  );
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch((err: unknown) => {
      if (isZodError(err)) {
        res
          .status(400)
          .json({ error: err.issues?.[0]?.message ?? "Invalid request" });
        return;
      }
      next(err as Error);
    });
  };
}
