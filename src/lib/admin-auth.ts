import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const adminCookieName = "labfit_admin";

export function getAdminToken() {
  return createHash("sha256").update(getAdminPassword()).digest("hex");
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === getAdminToken();
}
