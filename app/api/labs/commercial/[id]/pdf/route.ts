import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextRequest } from "next/server";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentUser();
  if (!actor || !hasPermission(actor, PERMISSIONS.LABS_COMMERCIAL_MANAGE)) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const document = await prisma.labsCommercialDocument.findUnique({ where: { id } });
  if (!document) return new Response("Not found", { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const red = rgb(0.88, 0.08, 0.12);
  page.drawRectangle({ x: 0, y: 775, width: 595.28, height: 66, color: rgb(0.06, 0.09, 0.07) });
  page.drawText("AIRA LABS", { x: 42, y: 805, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText(document.type, { x: 430, y: 805, size: 16, font: bold, color: rgb(1, 1, 1) });
  let y = 742;
  draw("Issued by", 42, y, 9, bold, red); draw(document.issuerName, 42, y - 18, 13, bold); draw(`No: ${document.number}`, 370, y - 3, 10, bold); draw(`Date: ${formatDate(document.createdAt)}`, 370, y - 20, 10, regular);
  if (document.issuerAddress) drawWrapped(document.issuerAddress, 42, y - 35, 270, 9);
  y -= 76; draw("Bill to", 42, y, 9, bold, red); draw(document.customerName, 42, y - 19, 13, bold); if (document.customerAddress) drawWrapped(document.customerAddress, 42, y - 36, 230, 10);
  if (document.customerGstin) draw(`GSTIN: ${document.customerGstin}`, 330, y - 19, 10, regular); if (document.customerPhone) draw(`Mobile: ${document.customerPhone}`, 330, y - 36, 10, regular); if (document.customerEmail) draw(`Email: ${document.customerEmail}`, 330, y - 53, 9, regular); if (document.validUntil) draw(`Valid until: ${formatDate(document.validUntil)}`, 330, y - 70, 9, regular);
  y -= 105; page.drawRectangle({ x: 42, y: y - 30, width: 511, height: 32, color: rgb(0.94, 0.96, 0.95) }); draw("SERVICE / DESCRIPTION", 52, y - 18, 9, bold); draw("AMOUNT", 470, y - 18, 9, bold);
  y -= 55; draw(document.service.replaceAll("_", " "), 52, y, 11, bold); drawWrapped(document.description, 52, y - 18, 350, 10); draw(money(Number(document.subtotal)), 455, y, 11, bold);
  y -= 125; draw("Subtotal", 380, y, 10, regular); draw(money(Number(document.subtotal)), 470, y, 10, bold);
  y -= 20; draw(`GST${document.gstApplicable ? ` (${Number(document.gstRate)}%)` : ""}`, 380, y, 10, regular); draw(money(Number(document.gstAmount)), 470, y, 10, bold);
  y -= 32; page.drawLine({ start: { x: 375, y: y + 17 }, end: { x: 553, y: y + 17 }, thickness: 1, color: red }); draw("TOTAL", 380, y, 13, bold, red); draw(money(Number(document.total)), 455, y, 13, bold, red);
  y -= 70; if (document.notes) { draw("Notes / Terms", 42, y, 10, bold, red); drawWrapped(document.notes, 42, y - 20, 500, 10); }
  page.drawText("AIRASKILLCITY PRIVATE LIMITED", { x: 42, y: 45, size: 9, font: bold, color: rgb(0.25, 0.3, 0.27) });
  if (document.issuerGstin) page.drawText(`GSTIN: ${document.issuerGstin}`, { x: 42, y: 30, size: 8, font: regular, color: rgb(0.35, 0.4, 0.37) });
  const bytes = await pdf.save();
  const filename = `${document.type.toLowerCase()}-${document.number.replace(/[^A-Za-z0-9_-]/g, "-")}.pdf`;
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });

  function draw(text: string, x: number, py: number, size: number, font = regular, color = rgb(0.08, 0.11, 0.09)) { page.drawText(text, { x, y: py, size, font, color }); }
  function drawWrapped(text: string, x: number, py: number, width: number, size: number) { const words = text.split(/\s+/); let line = ""; let lineY = py; for (const word of words) { const next = line ? `${line} ${word}` : word; if (regular.widthOfTextAtSize(next, size) > width && line) { draw(line, x, lineY, size); line = word; lineY -= size + 4; } else line = next; } if (line) draw(line, x, lineY, size); }
}

function money(value: number) { return `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatDate(value: Date) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(value); }
