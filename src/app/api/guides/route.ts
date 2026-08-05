import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createGuide, getGuides } from "@/lib/guide-store";

export async function GET() {
  return NextResponse.json({ guides: await getGuides() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  try {
    const guide = await createGuide(await request.json());
    return NextResponse.json({ guide }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Guide invalide." },
      { status: 400 },
    );
  }
}
