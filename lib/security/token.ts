import crypto from "crypto";

export function createToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createOtp() {
  return crypto.randomInt(100000, 999999).toString();
}
