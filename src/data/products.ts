export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  unit: string;
  rating?: number;
  stock: "in-stock" | "preorder" | "notify";
  stockQuantity?: number;
  description: string;
  image?: string;
  badge?: string;
};

export const defaultProducts: Product[] = [
  {
    id: "reta-research",
    name: "RETA - Recherche",
    category: "Peptides",
    price: 899,
    oldPrice: 1189,
    unit: "10 mg",
    rating: 4.7,
    stock: "in-stock",
    description: "Produit destiné à la recherche in vitro, contrôlé par lot.",
    image: "/catalog-hero.png",
    badge: "HPLC",
  },
  {
    id: "ghk-cu",
    name: "GHK-Cu",
    category: "Peptides",
    price: 349,
    oldPrice: 459,
    unit: "50 mg",
    rating: 4.9,
    stock: "in-stock",
    description: "Référence laboratoire, disponibilité confirmée au checkout.",
    image: "/catalog-hero.png",
  },
  {
    id: "bpc-157",
    name: "BPC-157",
    category: "Peptides",
    price: 329,
    oldPrice: 559,
    unit: "5 mg",
    rating: 4.8,
    stock: "in-stock",
    description: "Usage strictement recherche. Aucune promesse médicale.",
    image: "/catalog-hero.png",
  },
  {
    id: "tb-500",
    name: "TB-500",
    category: "Peptides",
    price: 349,
    oldPrice: 439,
    unit: "5 mg",
    rating: 4.7,
    stock: "in-stock",
    description: "Conditionnement scelle, informations de lot disponibles.",
    image: "/catalog-hero.png",
  },
  {
    id: "pack-synergie",
    name: "Pack Synergie",
    category: "Packs",
    price: 1199,
    oldPrice: 1499,
    unit: "pack",
    rating: 4.8,
    stock: "in-stock",
    description: "Pack de références sélectionnées pour commande groupée.",
    image: "/catalog-hero.png",
    badge: "Pack",
  },
  {
    id: "pack-complet",
    name: "Pack Complet",
    category: "Packs",
    price: 1099,
    oldPrice: 1349,
    unit: "pack",
    rating: 4.8,
    stock: "preorder",
    description: "Pack disponible en precommande selon arrivage.",
    image: "/catalog-hero.png",
  },
  {
    id: "bacteriostatic-water",
    name: "Eau bacteriostatique",
    category: "Accessoires",
    price: 129,
    oldPrice: 159,
    unit: "10 ml",
    rating: 4.7,
    stock: "in-stock",
    description: "Accessoire laboratoire, vendu selon disponibilité.",
    image: "/catalog-hero.png",
  },
  {
    id: "alcohol-swabs",
    name: "Tampons alcoolises",
    category: "Accessoires",
    price: 49,
    oldPrice: 69,
    unit: "x10",
    rating: 5,
    stock: "preorder",
    description: "Lot de tampons a usage laboratoire.",
    image: "/catalog-hero.png",
  },
  {
    id: "whey-isolate",
    name: "Whey Isolate",
    category: "Nutrition",
    price: 549,
    oldPrice: 649,
    unit: "2 kg",
    rating: 4.6,
    stock: "in-stock",
    description: "Proteine sportive, fiche produit a personnaliser.",
    image: "/catalog-hero.png",
  },
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    category: "Nutrition",
    price: 229,
    oldPrice: 289,
    unit: "300 g",
    rating: 4.8,
    stock: "in-stock",
    description: "Supplement nutrition sportive avec description neutre.",
    image: "/catalog-hero.png",
  },
  {
    id: "shaker-pro",
    name: "Shaker Pro",
    category: "Accessoires",
    price: 89,
    oldPrice: 119,
    unit: "700 ml",
    rating: 4.6,
    stock: "notify",
    description: "Shaker robuste, retour stock a confirmer.",
    image: "/catalog-hero.png",
  },
  {
    id: "custom-request",
    name: "Produit specifique",
    category: "Peptides",
    price: 0,
    unit: "devis",
    stock: "notify",
    description: "Demande speciale traitee uniquement apres validation.",
    image: "/catalog-hero.png",
    badge: "Sur demande",
  },
];

export const products = defaultProducts;

export const defaultCategories = ["Peptides", "Accessoires", "Packs", "Nutrition"] as const;
export const categories = ["Tous", ...defaultCategories] as const;
