import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function writeDirectorLog(input: {
  actorId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.directorActivityLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata
    }
  });
}
