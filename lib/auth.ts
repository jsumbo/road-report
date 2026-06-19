import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "rr-admin-session";
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-secret-please-set-env");

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function createSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  const { data } = await supabase
    .from("road_report_admins")
    .select("id, email, name, role, password_hash, is_active")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!data || !data.is_active) return null;
  const match = await bcrypt.compare(password, data.password_hash);
  if (!match) return null;
  return { id: data.id, email: data.email, name: data.name, role: data.role };
}

export { SESSION_COOKIE };
