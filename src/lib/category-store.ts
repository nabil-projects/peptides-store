import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultCategories } from "@/data/products";
import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase-rest";

const dataDir = path.join(process.cwd(), "data");
const categoriesFile = path.join(dataDir, "categories.json");

export type ProductCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type CategoryInput = {
  name?: string;
};

let hasSeededCategories = false;

export async function getCategories() {
  if (isSupabaseConfigured()) {
    try {
      const rows = await supabaseRequest<CategoryRow[]>("product_categories", {
        query: { select: "*", order: "name.asc" },
      });

      if (!rows.length && !hasSeededCategories) {
        hasSeededCategories = true;
        await seedDefaultCategories();
        return defaultProductCategories();
      }

      return rows.map(fromCategoryRow).filter(Boolean) as ProductCategory[];
    } catch (error) {
      console.warn(error);
      return getLocalCategories();
    }
  }

  return getLocalCategories();
}

export async function createCategory(input: CategoryInput) {
  const categories = await getCategories();
  const category = normalizeCategory({
    ...input,
    id: makeUniqueId(input.name || "categorie", categories),
  });

  if (!category) {
    throw new Error("Catégorie invalide.");
  }

  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest<CategoryRow[]>("product_categories", {
      method: "POST",
      prefer: "return=representation",
      body: toCategoryRow(category),
    });
    return fromCategoryRow(rows[0]) as ProductCategory;
  }

  await saveLocalCategories([...categories, category]);
  return category;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const categories = await getCategories();
  const existingCategory = categories.find((category) => category.id === id);

  if (!existingCategory) {
    return null;
  }

  const category = normalizeCategory({ ...existingCategory, ...input, id });
  if (!category) {
    throw new Error("Catégorie invalide.");
  }

  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest<CategoryRow[]>("product_categories", {
      method: "PATCH",
      query: { id: `eq.${id}` },
      prefer: "return=representation",
      body: {
        name: category.name,
        updated_at: new Date().toISOString(),
      },
    });
    return rows[0] ? (fromCategoryRow(rows[0]) as ProductCategory) : null;
  }

  const index = categories.findIndex((entry) => entry.id === id);
  categories[index] = category;
  await saveLocalCategories(categories);
  return category;
}

export async function deleteCategory(id: string) {
  const categories = await getCategories();
  const nextCategories = categories.filter((category) => category.id !== id);

  if (nextCategories.length === categories.length) {
    return false;
  }

  if (isSupabaseConfigured()) {
    await supabaseRequest("product_categories", {
      method: "DELETE",
      query: { id: `eq.${id}` },
    });
    return true;
  }

  await saveLocalCategories(nextCategories);
  return true;
}

async function seedDefaultCategories() {
  await supabaseRequest("product_categories", {
    method: "POST",
    query: { on_conflict: "id" },
    prefer: "resolution=ignore-duplicates",
    body: defaultProductCategories().map(toCategoryRow),
  });
}

async function getLocalCategories() {
  try {
    const raw = await readFile(categoriesFile, "utf8");
    const parsed = JSON.parse(raw) as ProductCategory[];
    return parsed.map(normalizeCategory).filter(Boolean) as ProductCategory[];
  } catch {
    return defaultProductCategories();
  }
}

async function saveLocalCategories(categories: ProductCategory[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(categoriesFile, `${JSON.stringify(categories, null, 2)}\n`, "utf8");
}

function defaultProductCategories() {
  const now = new Date().toISOString();
  return defaultCategories.map((name) => ({
    id: slugify(name),
    name,
    createdAt: now,
    updatedAt: now,
  }));
}

function toCategoryRow(category: ProductCategory) {
  return {
    id: category.id,
    name: category.name,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

function fromCategoryRow(row?: CategoryRow) {
  if (!row) return null;
  return normalizeCategory({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function normalizeCategory(input: Partial<ProductCategory>) {
  const name = String(input.name || "").trim();
  if (!name) return null;

  const now = new Date().toISOString();
  return {
    id: slugify(input.id || name),
    name,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  } satisfies ProductCategory;
}

function makeUniqueId(value: string, categories: ProductCategory[]) {
  const base = slugify(value);
  let candidate = base;
  let count = 2;

  while (categories.some((category) => category.id === candidate)) {
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

  return slug || "categorie";
}
