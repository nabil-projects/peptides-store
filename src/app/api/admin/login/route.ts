import { NextResponse } from "next/server";
import { adminCookieName, getAdminPassword, getAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (password !== getAdminPassword()) {
    return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ message: "Connexion admin active." });
  response.cookies.set(adminCookieName, getAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}
