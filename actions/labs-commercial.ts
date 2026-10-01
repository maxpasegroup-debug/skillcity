"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { assertPermission } from "@/server/auth/authorization";
import { calculateLabsCommercialAmounts, labsCommercialDocumentSchema } from "@/features/labs/commercial";

export type LabsCommercialState = { ok: boolean; message: string; id?: string };

export async function createLabsCommercialDocumentAction(_: LabsCommercialState, formData: FormData): Promise<LabsCommercialState> {
  const actor = await assertPermission(PERMISSIONS.LABS_COMMERCIAL_MANAGE);
  const parsed = labsCommercialDocumentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check document details." };
  const data = parsed.data;
  const amounts = calculateLabsCommercialAmounts({ quantity: data.quantity, unitPrice: data.unitPrice, gstApplicable: data.gstApplicable === "on", gstRate: data.gstRate });
  try {
    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.labsCommercialDocument.create({ data: {
        number: data.number.toUpperCase(), type: data.type, service: data.service, customerName: data.customerName,
        customerPhone: data.customerPhone || null, customerEmail: data.customerEmail || null, customerAddress: data.customerAddress || null, customerGstin: data.customerGstin || null,
        issuerAddress: data.issuerAddress || null, issuerGstin: data.issuerGstin || null, description: data.description,
        quantity: data.quantity, unitPrice: data.unitPrice, subtotal: amounts.subtotal, gstApplicable: data.gstApplicable === "on", gstRate: data.gstRate, gstAmount: amounts.gstAmount, total: amounts.total,
        validUntil: data.validUntil ? new Date(data.validUntil) : null, notes: data.notes || null, createdById: actor.id
      } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: `LABS_${data.type}_CREATED`, entity: "LabsCommercialDocument", entityId: created.id, metadata: { number: created.number, service: created.service, total: amounts.total, gstApplicable: created.gstApplicable } } });
      return created;
    });
    revalidatePath("/labs/commercial");
    return { ok: true, message: `${data.type === "INVOICE" ? "Invoice" : "Quotation"} created.`, id: document.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "Document number is already in use." };
    throw error;
  }
}
