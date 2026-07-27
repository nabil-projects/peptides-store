import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultProducts, type Product } from "@/data/products";

const dataDir = path.join(process.cwd(), "data");
const productsFile = path.join(dataDir, "products.json");
const categories = ["Peptides", "Accessoires", "Packs", "Nutrition"] as const;
const stockStates = ["in-stock", "preorder", "notify"] as const;

type ProductInput = Partial<Product> & {
  name?: string;
};

export async function getProducts() {
  try {
    const raw = await readFile(productsFile, "utf8");
    const parsed = JSON.parse(raw) as Product[];
    return parsed.map(normalizeProduct).filter(Boolean) as Product[];
  } catch {
    return defaultProducts;
  }
}

export async function saveProducts(products: Product[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(productsFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
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

  const nextProducts = [product, ...products];
  await saveProducts(nextProducts);
  return product;
}

export async function updateProduct(id: string, input: ProductInput) {
  const products = await getProducts();
  const index = products.findIndex((product) => product.id === id);

  if (index === -1) {
    return null;
  }

  const product = normalizeProduct({ ...products[index], ...input, id });
  if (!product) {
    throw new Error("Produit invalide.");
  }

  products[index] = product;
  await saveProducts(products);
  return product;
}

export async function deleteProduct(id: string) {
  const products = await getProducts();
  const nextProducts = products.filter((product) => product.id !== id);

  if (nextProducts.length === products.length) {
    return false;
  }

  await saveProducts(nextProducts);
  return true;
}

function normalizeProduct(input: ProductInput) {
  const name = String(input.name || "").trim();
  const unit = String(input.unit || "").trim();
  const description = String(input.description || "").trim();
  const category: Product["category"] = categories.includes(
    input.category as (typeof categories)[number],
  )
    ? (input.category as Product["category"])
    : "Peptides";
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
