import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCategory, updateCategory } from "@/lib/category-store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const category = await updateCategory(id, await request.json());

    if (!category) {
      return NextResponse.json({ message: "Catégorie introuvable." }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Catégorie invalide." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteCategory(id);

  if (!deleted) {
    return NextResponse.json({ message: "Catégorie introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Catégorie supprimée." });
}
