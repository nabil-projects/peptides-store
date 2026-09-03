import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { Product } from "@/data/products";
import { createOrderRecord } from "@/lib/order-store";
import { decrementProductStocks, getProducts } from "@/lib/product-store";
import { formatPrice } from "@/lib/money";

type OrderItem = {
  productId: string;
  quantity: number;
};

type OrderRequest = {
  paymentMethod?: "whatsapp";
  customer: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    address?: string;
    message?: string;
    referralSource?: string;
  };
  items: OrderItem[];
};

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ORDER_RECEIVER_EMAIL,
  );
}

function getOrderItems(order: OrderRequest, products: Product[]) {
  return order.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return {
      product,
      quantity: Math.max(1, Number(item.quantity) || 1),
    };
  });
}

function buildOrderText(order: OrderRequest, products: Product[]) {
  const orderItems = getOrderItems(order, products);
  const lines = orderItems.map((item) => {
    const price = item.product?.price ? formatPrice(item.product.price) : "devis";
    return [
      `- ${item.product?.name ?? "Produit inconnu"}`,
      `  Quantité: ${item.quantity}`,
      `  Prix unitaire: ${price}`,
    ].join("\n");
  });

  const total = orderItems.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  return [
    "Nouvelle commande BIP HORIZON",
    "",
    "COMMANDE",
    `Contact: WhatsApp`,
    `Total produits: ${formatPrice(total)}`,
    "",
    "CLIENT",
    "",
    `Nom: ${order.customer.name}`,
    `Téléphone: ${order.customer.phone}`,
    `Email: ${order.customer.email || "non renseigné"}`,
    `Ville: ${order.customer.city || "non renseignée"}`,
    `Adresse: ${order.customer.address || "non renseignée"}`,
    "",
    "PROVENANCE",
    `Publicité / Collaborateur: ${order.customer.referralSource || "Non"}`,
    "",
    "PRODUITS",
    ...lines,
    "",
    `Message: ${order.customer.message || "aucun"}`,
  ].join("\n\n");
}

async function sendOrderEmail(order: OrderRequest, products: Product[]) {
  const text = buildOrderText(order, products);

  if (!isEmailConfigured()) {
    console.log(text);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.ORDER_FROM_EMAIL || process.env.SMTP_USER,
    to: process.env.ORDER_RECEIVER_EMAIL,
    subject: `Nouvelle commande - ${order.customer.name}`,
    text,
  });
}

export async function POST(request: Request) {
  const order = {
    ...((await request.json()) as OrderRequest),
    paymentMethod: "whatsapp" as const,
  };
  const products = await getProducts();

  if (
    !order.customer?.name ||
    !order.customer?.phone ||
    !order.customer?.email ||
    !order.customer?.city ||
    !order.customer?.address ||
    !order.items?.length
  ) {
    return NextResponse.json(
      { message: "Informations client et panier obligatoires." },
      { status: 400 },
    );
  }

  const storedOrder = await createOrderRecord(order, products);
  await decrementProductStocks(order.items);
  await sendOrderEmail(order, products);

  return NextResponse.json({
    message:
      "Commande enregistrée. WhatsApp va s'ouvrir pour finaliser avec le vendeur.",
    orderId: storedOrder.id,
  });
}
