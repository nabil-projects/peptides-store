import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteOrder, updateOrderStatus, type OrderStatus } from "@/lib/order-store";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = (await request.json()) as { status?: OrderStatus };

  try {
    const order = await updateOrderStatus(id, status as OrderStatus);

    if (!order) {
      return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Statut invalide." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteOrder(id);

  if (!deleted) {
    return NextResponse.json({ message: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Commande supprimée." });
}
