import { z } from "zod";

export const assignStudentBatchSchema = z.object({
  enrollmentId: z.string().uuid(),
  batchId: z.string().uuid(),
  note: z.string().trim().max(600).optional()
});
