export const ADMISSIONS_WHATSAPP = "918136906653";

export function buildAdmissionsWhatsAppUrl(message: string) {
  return `https://wa.me/${ADMISSIONS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
