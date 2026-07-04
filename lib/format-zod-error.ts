import type { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  return {
    error: "Invalid intent payload",
    details: error.flatten(),
    issues: error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
      code: issue.code,
    })),
  };
}
