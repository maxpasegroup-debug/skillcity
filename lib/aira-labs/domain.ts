export function isAiraLabsHostname(value: string | null) {
  const hostname = (value ?? "").split(":")[0].trim().toLowerCase();
  return hostname === "airalabs.com" || hostname === "www.airalabs.com";
}
