import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteGuide, updateGuide } from "@/lib/guide-store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const guide = await updateGuide(id, await request.json());

    if (!guide) {
      return NextResponse.json({ message: "Guide introuvable." }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Guide invalide." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteGuide(id);

  if (!deleted) {
    return NextResponse.json({ message: "Guide introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Guide supprime." });
}
