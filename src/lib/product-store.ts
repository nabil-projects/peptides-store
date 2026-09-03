import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultCategories, defaultProducts, type Product } from "@/data/products";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase-rest";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const fallbackCategory = defaultCategories[0];
const stockStates = ["in-stock", "preorder", "notify"] as const;

type ProductInput = Partial<Product> & {
  name?: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  unit: string;
  rating: number | null;
  stock: Product["stock"];
  stock_quantity: number | null;
  description: string;
  image: string | null;
  badge: string | null;
};

let hasSeededProducts = false;

export async function getProducts() {
  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseRequest<ProductRow[]>("products", {
        query: { select: "*", order: "created_at.desc" },
      });

      if (!rows.length && !hasSeededProducts) {
        hasSeededProducts = true;
        await seedDefaultProducts();
        return defaultProducts;
      }

      return rows.map(fromProductRow).filter(Boolean) as Product[];
    } catch (error) {
      console.warn(error);
      return getLocalProducts();
    }
  }

  return getLocalProducts();
}

export async function saveProducts(products: Product[]) {
  if (isSupabaseConfigured()) {
    await supabaseRequest("products", {
      method: "POST",
      query: { on_conflict: "id" },
      prefer: "resolution=merge-duplicates",
      body: products.map(toProductRow),
    });
    return;
  }

  await saveLocalProducts(products);
}

export async function createProduct(input: ProductInput) {
  const products = await getProducts();
  const product = normalizeProduct({
    ...input,
    id: makeUniqueId(input.id || input.name || "product", products),
  });

  if (!product) {
    throw new Error("Produit invalide.");
  }

  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest<ProductRow[]>("products", {
      method: "POST",
      prefer: "return=representation",
      body: toProductRow(product),
    });
    return fromProductRow(rows[0]) as Product;
  }

  const nextProducts = [product, ...products];
  await saveLocalProducts(nextProducts);
  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const products = await getProducts();
  const existingProduct = products.find((product) => product.id === id);

  if (!existingProduct) {
    return null;
  }

  const product = normalizeProduct({ ...existingProduct, ...input, id });
  if (!product) {
    throw new Error("Produit invalide.");
  }

  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest<ProductRow[]>("products", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      prefer: "return=representation",
      body: toProductRow(product),
    });
    return rows[0] ? (fromProductRow(rows[0]) as Product) : null;
  }

  const index = products.findIndex((entry) => entry.id === id);
  products[index] = product;
  await saveLocalProducts(products);
  return product;
}

export async function deleteProduct(id: string) {
  const products = await getProducts();

  if (!products.some((product) => product.id === id)) {
    return false;
  }

  if (isSupabaseConfigured()) {
    await supabaseRequest("products", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return true;
  }

  await saveLocalProducts(products.filter((product) => product.id !== id));
  return true;
}

export async function decrementProductStocks(items: Array<{ productId: string; quantity: number }>) {
  if (!items.length) return;

  const products = await getProducts();
  const nextProducts = products.map((product) => {
    const orderedQuantity = items
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);

    if (!orderedQuantity) {
      return product;
    }

    const currentQuantity = Math.max(0, Number(product.stockQuantity) || 0);
    const stockQuantity = Math.max(0, currentQuantity - orderedQuantity);

    return {
      ...product,
      stockQuantity,
      stock: stockQuantity > 0 ? product.stock : "notify",
    } satisfies Product;
  });

  if (isSupabaseConfigured()) {
    await Promise.all(
      nextProducts
        .filter((product, index) => product !== products[index])
        .map((product) =>
          supabaseRequest("products", {
            method: "PATCH",
            query: { id: `eq.${product.id}` },
            prefer: "return=minimal",
            body: {
              stock: product.stock,
              stock_quantity: product.stockQuantity ?? 0,
              updated_at: new Date().toISOString(),
            },
          }),
        ),
    );
    return;
  }

  await saveLocalProducts(nextProducts);
}

async function seedDefaultProducts() {
  await supabaseRequest("products", {
    method: "POST",
    query: { on_conflict: "id" },
    prefer: "resolution=ignore-duplicates",
    body: defaultProducts.map(toProductRow),
  });
}

async function getLocalProducts() {
  try {
    const raw = await readFile(productsFile, "utf8");
    const parsed = JSON.parse(raw) as Product[];
    return parsed.map(normalizeProduct).filter(Boolean) as Product[];
  } catch {
    return defaultProducts;
  }
}

async function saveLocalProducts(products: Product[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(productsFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

function toProductRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    old_price: product.oldPrice ?? null,
    unit: product.unit,
    rating: product.rating ?? null,
    stock: product.stock,
    stock_quantity: product.stockQuantity ?? 0,
    description: product.description,
    image: product.image || "/catalog-hero.png",
    badge: product.badge ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromProductRow(row?: ProductRow) {
  if (!row) return null;
  return normalizeProduct({
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    unit: row.unit,
    rating: row.rating ?? undefined,
    stock: row.stock,
    stockQuantity: row.stock_quantity ?? 0,
    description: row.description,
    image: row.image || "/catalog-hero.png",
    badge: row.badge ?? undefined,
  });
}

function normalizeProduct(input: ProductInput) {
  const name = String(input.name || "").trim();
  const unit = String(input.unit || "").trim();
  const description = String(input.description || "").trim();
  const category = String(input.category || fallbackCategory).trim() || fallbackCategory;
  const stock: Product["stock"] = stockStates.includes(
    input.stock as (typeof stockStates)[number],
  )
    ? (input.stock as Product["stock"])
    : "in-stock";

  if (!name || !unit || !description) {
    return null;
  }

  const product: Product = {
    id: slugify(input.id || name),
    name,
    category,
    price: toNumber(input.price, 0),
    oldPrice: input.oldPrice === undefined ? undefined : toOptionalNumber(input.oldPrice),
    unit,
    rating: input.rating === undefined ? undefined : toOptionalNumber(input.rating),
    stock,
    stockQuantity: Math.round(toNumber(input.stockQuantity, 0)),
    description,
    image: String(input.image || "/catalog-hero.png").trim(),
    badge: String(input.badge || "").trim() || undefined,
  };

  return product;
}

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function toOptionalNumber(value: unknown) {
  if (value === "" || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function makeUniqueId(value: string, products: Product[]) {
  const base = slugify(value);
  let candidate = base;
  let count = 2;

  while (products.some((product) => product.id === candidate)) {
    candidate = `${base}-${count}`;
    count += 1;
  }

  return candidate;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
}
