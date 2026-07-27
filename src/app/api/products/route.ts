import { NextResponse } from "next/server";
import { createProduct, getProducts } from "@/lib/product-store";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  return NextResponse.json({ products: await getProducts() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  try {
    const product = await createProduct(await request.json());
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Produit invalide." },
      { status: 400 },
    );
  }
}
