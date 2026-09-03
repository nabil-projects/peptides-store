import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createCategory, getCategories } from "@/lib/category-store";

export async function GET() {
  return NextResponse.json({ categories: await getCategories() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  try {
    const category = await createCategory(await request.json());
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Catégorie invalide." },
      { status: 400 },
    );
  }
}
