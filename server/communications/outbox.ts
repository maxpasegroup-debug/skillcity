import type { Prisma } from "@prisma/client";
import type { DomainEventType } from "@/lib/communications/policies";

export type OrganizationPath = {
  institutionId?: string | null;
  divisionId?: string | null;
  districtId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
};

type RecordDomainEventInput = OrganizationPath & {
  type: DomainEventType;
  idempotencyKey: string;
  aggregateType: string;
  aggregateId: string;
  actorId?: string | null;
  payload: Prisma.InputJsonObject;
};

export function recordDomainEvent(tx: Prisma.TransactionClient, input: RecordDomainEventInput) {
  const { type, idempotencyKey, aggregateType, aggregateId, actorId, payload, ...scope } = input;
  return tx.domainEvent.upsert({
    where: { idempotencyKey },
    update: {},
    create: { type, idempotencyKey, aggregateType, aggregateId, actorId, payload, ...scope }
  });
}
