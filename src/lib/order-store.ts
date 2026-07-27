import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "@/data/products";

const dataDir = path.join(process.cwd(), "data");
const ordersFile = path.join(dataDir, "orders.json");

export type OrderStatus = "new" | "pending_payment" | "paid" | "processing" | "shipped" | "cancelled";

export type OrderInput = {
  paymentMethod?: "card" | "bank";
  customer: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    address?: string;
    message?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentMethod: "card" | "bank";
  customer: OrderInput["customer"];
  items: Array<{
    productId: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
};

const orderStatuses: OrderStatus[] = [
  "new",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "cancelled",
];

export async function getOrders() {
  try {
    const raw = await readFile(ordersFile, "utf8");
    const parsed = JSON.parse(raw) as StoredOrder[];
    return parsed.filter(isStoredOrder);
  } catch {
    return [];
  }
}

export async function createOrderRecord(order: OrderInput, products: Product[]) {
  const orders = await getOrders();
  const now = new Date().toISOString();
  const items = order.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const quantity = Math.max(1, Number(item.quantity) || 1);

    return {
      productId: item.productId,
      name: product?.name || "Produit inconnu",
      unit: product?.unit || "",
      quantity,
      price: product?.price || 0,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 900 || subtotal === 0 ? 0 : 49;
  const storedOrder: StoredOrder = {
    id: `ORD-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: order.paymentMethod === "card" ? "pending_payment" : "new",
    paymentMethod: order.paymentMethod === "bank" ? "bank" : "card",
    customer: {
      name: String(order.customer.name || "").trim(),
      phone: String(order.customer.phone || "").trim(),
      email: String(order.customer.email || "").trim(),
      city: String(order.customer.city || "").trim(),
      address: String(order.customer.address || "").trim(),
      message: String(order.customer.message || "").trim(),
    },
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  };

  await saveOrders([storedOrder, ...orders]);
  return storedOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!orderStatuses.includes(status)) {
    throw new Error("Statut invalide.");
  }

  const orders = await getOrders();
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await saveOrders(orders);
  return orders[index];
}

export async function deleteOrder(id: string) {
  const orders = await getOrders();
  const nextOrders = orders.filter((order) => order.id !== id);

  if (nextOrders.length === orders.length) {
    return false;
  }

  await saveOrders(nextOrders);
  return true;
}

async function saveOrders(orders: StoredOrder[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(ordersFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

function isStoredOrder(order: StoredOrder) {
  return Boolean(
    order?.id &&
      order.createdAt &&
      order.customer?.name &&
      Array.isArray(order.items) &&
      orderStatuses.includes(order.status),
  );
}
