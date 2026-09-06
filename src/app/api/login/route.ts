import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { SESSION_COOKIE, createSessionToken, homePathForRole, type Role } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // .trim(): manche mobilen Tastaturen hängen beim Tippen unbemerkt ein
  // Leerzeichen an - das würde sonst zu "falsch" führen.
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim() : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Benutzername und Passwort erforderlich." }, { status: 400 });
  }

  const rows = await sql`
    SELECT id, name, password_hash, role, active
    FROM users
    WHERE username = ${username}
  `;
  const user = rows[0] as
    | { id: number; name: string; password_hash: string; role: Role; active: boolean }
    | undefined;

  if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Benutzername oder Passwort falsch." }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role, name: user.name });

  const res = NextResponse.json({ ok: true, redirectTo: homePathForRole(user.role) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
