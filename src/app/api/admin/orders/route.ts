import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOrders } from "@/lib/order-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Connexion admin requise." }, { status: 401 });
  }

  return NextResponse.json({ orders: await getOrders() });
}
