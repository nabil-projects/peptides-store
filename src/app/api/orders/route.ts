import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Stripe from "stripe";
import type { Product } from "@/data/products";
import { createOrderRecord } from "@/lib/order-store";
import { getProducts } from "@/lib/product-store";
import { currencyCode, formatPrice } from "@/lib/money";

type OrderItem = {
  productId: string;
  quantity: number;
};

type OrderRequest = {
  paymentMethod?: "card" | "bank";
  customer: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    address?: string;
    message?: string;
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
    return `- ${item.product?.name ?? "Produit inconnu"} x${item.quantity} (${price})`;
  });

  const total = orderItems.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  return [
    "Nouvelle commande",
    "",
    `Paiement: ${order.paymentMethod === "bank" ? "Virement / SEPA" : "Carte bancaire"}`,
    `Total produits: ${formatPrice(total)}`,
    "",
    `Nom: ${order.customer.name}`,
    `Telephone: ${order.customer.phone}`,
    `Email: ${order.customer.email || "non renseigne"}`,
    `Ville: ${order.customer.city || "non renseignee"}`,
    `Adresse: ${order.customer.address || "non renseignee"}`,
    "",
    "Produits:",
    ...lines,
    "",
    `Message: ${order.customer.message || "aucun"}`,
  ].join("\n");
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

async function createStripeCheckout(order: OrderRequest, products: Product[]) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_SITE_URL) {
    return null;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const lineItems = getOrderItems(order, products)
    .filter((item) => item.product && item.product.price > 0)
    .map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: currencyCode,
        unit_amount: item.product!.price * 100,
        product_data: {
          name: item.product!.name,
          description: item.product!.unit,
        },
      },
    }));

  if (!lineItems.length) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer.email || undefined,
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?payment=cancel`,
    metadata: {
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerCity: order.customer.city || "",
    },
  });

  return session.url;
}

export async function POST(request: Request) {
  const order = (await request.json()) as OrderRequest;
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
  await sendOrderEmail(order, products);

  if (order.paymentMethod !== "bank") {
    const checkoutUrl = await createStripeCheckout(order, products);
    if (checkoutUrl) {
      return NextResponse.json({ checkoutUrl, orderId: storedOrder.id });
    }

    return NextResponse.json({
      message:
        "Commande enregistree. Configure STRIPE_SECRET_KEY et NEXT_PUBLIC_SITE_URL pour activer le paiement carte.",
      orderId: storedOrder.id,
    });
  }

  return NextResponse.json({
    message:
      "Commande enregistree. Les instructions de virement/SEPA seront envoyees par email.",
    orderId: storedOrder.id,
  });
}
