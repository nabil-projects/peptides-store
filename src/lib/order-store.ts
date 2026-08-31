import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "@/data/products";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase-rest";

const dataDir = path.join(process.cwd(), "data");
const ordersFile = path.join(dataDir, "orders.json");

export type OrderStatus = "pending_payment" | "paid" | "cancelled";

export type OrderInput = {
  paymentMethod?: "whatsapp";
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
  paymentMethod: "whatsapp";
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

type OrderRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  payment_method: "whatsapp";
  customer: StoredOrder["customer"];
  subtotal: number;
  shipping: number;
  total: number;
  order_items?: OrderItemRow[];
};

type OrderItemRow = {
  order_id: string;
  product_id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
};

const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "paid",
  "cancelled",
];

export async function getOrders() {
  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseRequest<OrderRow[]>("orders", {
        query: { select: "*,order_items(*)", order: "created_at.desc" },
      });
      return rows.map(fromOrderRow).filter(Boolean) as StoredOrder[];
    } catch (error) {
      console.warn(error);
      return getLocalOrders();
    }
  }

  return getLocalOrders();
}

export async function createOrderRecord(order: OrderInput, products: Product[]) {
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
    status: "pending_payment",
    paymentMethod: "whatsapp",
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

  if (isSupabaseConfigured()) {
    await supabaseRequest("orders", {
      method: "POST",
      prefer: "return=minimal",
      body: toOrderRow(storedOrder),
    });
    await supabaseRequest("order_items", {
      method: "POST",
      prefer: "return=minimal",
      body: storedOrder.items.map((item) => toOrderItemRow(storedOrder.id, item)),
    });
    return storedOrder;
  }

  const orders = await getLocalOrders();
  await saveLocalOrders([storedOrder, ...orders]);
  return storedOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!orderStatuses.includes(status)) {
    throw new Error("Statut invalide.");
  }

  if (isSupabaseConfigured()) {
    await supabaseRequest("orders", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      prefer: "return=minimal",
      body: {
        status,
        updated_at: new Date().toISOString(),
      },
    });
    const orders = await getOrders();
    return orders.find((order) => order.id === id) || null;
  }

  const orders = await getLocalOrders();
  const index = orders.findIndex((order) => order.id === id);

  if (index === -1) {
    return null;
  }

  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  await saveLocalOrders(orders);
  return orders[index];
}

export async function deleteOrder(id: string) {
  if (isSupabaseConfigured()) {
    await supabaseRequest("orders", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return true;
  }

  const orders = await getLocalOrders();
  const nextOrders = orders.filter((order) => order.id !== id);

  if (nextOrders.length === orders.length) {
    return false;
  }

  await saveLocalOrders(nextOrders);
  return true;
}

async function getLocalOrders() {
  try {
    const raw = await readFile(ordersFile, "utf8");
    const parsed = JSON.parse(raw) as StoredOrder[];
    return parsed.map(normalizeStoredOrder).filter(Boolean) as StoredOrder[];
  } catch {
    return [];
  }
}

async function saveLocalOrders(orders: StoredOrder[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(ordersFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

function toOrderRow(order: StoredOrder) {
  return {
    id: order.id,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    status: order.status,
    payment_method: order.paymentMethod,
    customer: order.customer,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
  };
}

function toOrderItemRow(orderId: string, item: StoredOrder["items"][number]) {
  return {
    order_id: orderId,
    product_id: item.productId,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    price: item.price,
  };
}

function fromOrderRow(row?: OrderRow) {
  if (!row) return null;
  return normalizeStoredOrder({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    paymentMethod: "whatsapp",
    customer: row.customer,
    items: (row.order_items || []).map((item) => ({
      productId: item.product_id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
  });
}

function normalizeStoredOrder(order: StoredOrder) {
  if (!order?.id || !order.createdAt || !order.customer?.name || !Array.isArray(order.items)) {
    return null;
  }

  const status = normalizeStatus(order.status);
  return {
    ...order,
    status,
    paymentMethod: "whatsapp",
  } satisfies StoredOrder;
}

function normalizeStatus(status: string): OrderStatus {
  if (status === "paid" || status === "cancelled") {
    return status;
  }

  return "pending_payment";
}
