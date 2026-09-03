import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteProduct, updateProduct } from "@/lib/product-store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const product = await updateProduct(id, await request.json());

    if (!product) {
      return NextResponse.json({ message: "Produit introuvable." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Produit invalide." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteProduct(id);

  if (!deleted) {
    return NextResponse.json({ message: "Produit introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Produit supprimé." });
}
