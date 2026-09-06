import { cookies } from "next/headers";

export type Role = "admin" | "monteur";

export type SessionPayload = {
  userId: number;
  role: Role;
  name: string;
  exp: number;
};

export const SESSION_COOKIE = "kara_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET fehlt (siehe .env.example).");
  return secret;
}

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const data = bufferToBase64Url(new TextEncoder().encode(JSON.stringify(full)));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${bufferToBase64Url(signature)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const key = await getHmacKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBuffer(signature) as BufferSource,
    new TextEncoder().encode(data)
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBuffer(data))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Nur in Server Components/Actions nutzbar (liest den Cookie-Store des aktuellen Requests). */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function homePathForRole(role: Role): string {
  return role === "admin" ? "/admin" : "/";
}

/** Für Server Actions: wirft, falls kein eingeloggter Admin (proxy.ts schützt Routen, nicht Actions). */
export async function requireAdmin(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Nicht autorisiert.");
  }
  return user;
}

/** Für Server Actions: wirft, falls niemand eingeloggt ist. */
export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nicht autorisiert.");
  return user;
}
