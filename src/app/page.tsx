"use client";

import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Minus,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { categories, defaultProducts, type Product } from "@/data/products";
import { formatPrice } from "@/lib/money";

type Cart = Record<string, number>;
type Category = (typeof categories)[number];
type SortMode = "featured" | "price-asc" | "price-desc";

type GuideVideo = {
  id: string;
  title: string;
  videoUrl: string;
};

const stockLabel = {
  "in-stock": "En stock",
  preorder: "Precommande",
  notify: "Sur demande",
};

const trustMessages = [
  { icon: Truck, label: "Livraison suivie" },
  { icon: ShieldCheck, label: "Paiement securise" },
  { icon: BadgeCheck, label: "Lots verifies" },
  { icon: Truck, label: "Expedition rapide" },
  { icon: ShieldCheck, label: "Checkout protege" },
  { icon: BadgeCheck, label: "Catalogue controle" },
];

export default function Home() {
  const [cart, setCart] = useState<Cart>({});
  const [category, setCategory] = useState<Category>("Tous");
  const [sort, setSort] = useState<SortMode>("featured");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [guides, setGuides] = useState<GuideVideo[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const result = await response.json();

        if (isMounted && Array.isArray(result.products)) {
          setProducts(result.products);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    async function loadGuides() {
      try {
        const response = await fetch("/api/guides");
        const result = await response.json();

        if (isMounted && Array.isArray(result.guides)) {
          setGuides(result.guides);
        }
      } catch {
        if (isMounted) {
          setGuides([]);
        }
      }
    }

    loadProducts();
    loadGuides();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const byCategory = category === "Tous" || product.category === category;
      const bySearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized);
      return byCategory && bySearch;
    });

    return filtered.toSorted((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });
  }, [category, search, sort]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = products.find((entry) => entry.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter((item): item is { product: Product; quantity: number } => Boolean(item)),
    [cart, products],
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shipping = subtotal >= 900 || subtotal === 0 ? 0 : 49;
  const total = subtotal + shipping;

  function updateCart(productId: string, quantity: number) {
    setCart((current) => ({ ...current, [productId]: Math.max(0, quantity) }));
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (!cartItems.length) {
      setStatus("Ajoute au moins un produit avant le paiement.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setIsSending(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: form.get("paymentMethod"),
        customer: {
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
          city: form.get("city"),
          address: form.get("address"),
        },
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });

    const result = await response.json();
    setIsSending(false);

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setStatus(result.message);
    if (response.ok) {
      setCart({});
      event.currentTarget.reset();
    }
  }

  return (
    <main className="min-h-screen bg-[var(--theme-mist)] text-[var(--theme-ink)]">
      <div className="overflow-hidden bg-[var(--theme-ink)] py-2 text-white">
        <div className="trust-marquee flex w-max items-center">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex shrink-0 items-center gap-8 px-4 text-xs font-black uppercase tracking-[0.16em] sm:gap-12"
              aria-hidden={group === 1}
            >
              {trustMessages.map(({ icon: Icon, label }) => (
                <span key={`${group}-${label}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Icon size={15} className="text-[var(--theme-accent-soft)]" />
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-3">
            <img
              src="/bip-peptide-logo.jpeg"
              alt="BIP PEPTIDE"
              className="size-11 rounded-full border border-black/10 object-cover"
            />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              BIP PEPTIDE
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-black/70 md:flex">
            <a href="#boutique" className="hover:text-black">
              Boutique
            </a>
            <a href="#guide" className="hover:text-black">
              Guide
            </a>
            <a href="#checkout" className="hover:text-black">
              Panier
            </a>
            <a href="#legal" className="hover:text-black">
              Conditions
            </a>
            <a href="/admin" className="hover:text-black">
              Admin
            </a>
          </nav>
          <a
            href="#checkout"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-4 text-sm font-bold text-white transition hover:bg-[var(--theme-deep)]"
          >
            <ShoppingBag size={18} />
            {cartItems.length} article{cartItems.length > 1 ? "s" : ""}
          </a>
        </div>
      </header>

      <section className="relative isolate min-h-[70vh] overflow-hidden bg-[var(--theme-ink)] text-white">
        <img
          src="/landing-hyaluronic.jpg"
          alt=""
          aria-hidden="true"
          className="hero-zoom-bg absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.66)_42%,rgba(0,0,0,0.24)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[var(--theme-mist)] via-transparent to-transparent" />

        <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-white/75">
              BIP PEPTIDE
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.03] sm:text-6xl lg:text-7xl">
              Peptides premium avec paiement en ligne.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              Une experience plus elegante pour presenter les produits BIP
              PEPTIDE, mettre les prix en avant et guider le client rapidement
              vers le panier.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#boutique"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-black transition hover:bg-neutral-200"
              >
                <ShoppingBag size={18} />
                Voir la boutique
              </a>
              <a
                href="#guide"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/40 px-5 text-sm font-black text-white transition hover:bg-white/12"
              >
                <PlayCircle size={18} />
                Voir le guide
              </a>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl gap-3 text-sm font-bold text-white/82 sm:grid-cols-3">
            <span className="border-t border-white/25 pt-3">Lots verifies</span>
            <span className="border-t border-white/25 pt-3">Prix modifiables</span>
            <span className="border-t border-white/25 pt-3">Photos dynamiques</span>
          </div>
        </div>
        <a
          href="https://www.magnific.com/free-photo/close-up-hyaluronic-acid-tratment_22894784.htm"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-4 text-[11px] font-semibold text-white/55 transition hover:text-white"
        >
          Image by magnific
        </a>
      </section>

      <section id="guide" className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-7 flex flex-col gap-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/55">
              Guide
            </p>
            <h2 className="text-3xl font-black">Videos guide</h2>
            <p className="max-w-2xl text-sm leading-6 text-black/55">
              Videos ajoutees par l'admin pour presenter des informations
              generales. Les contenus doivent rester conformes aux regles et ne
              pas remplacer un avis professionnel.
            </p>
          </div>

          {guides.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {guides.map((guide) => (
                <article
                  key={guide.id}
                  className="overflow-hidden rounded-md border border-black/10 bg-white"
                >
                  <div className="aspect-video bg-black">
                    <video
                      src={guide.videoUrl}
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-black">{guide.title}</h3>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-black/10 bg-[var(--theme-mist)] p-5 text-sm font-semibold text-black/55">
              Les videos du guide apparaitront ici apres ajout depuis l'admin.
            </div>
          )}
        </div>
      </section>

      <section id="boutique" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-accent-dark)]">
              Boutique
            </p>
            <h2 className="mt-1 text-3xl font-black">Tous les produits</h2>
            {isLoadingProducts ? (
              <p className="mt-2 text-sm font-semibold text-black/50">
                Chargement du catalogue...
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[520px]">
            <label className="relative block">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-black/45"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un produit"
                className="h-11 w-full rounded-md border border-black/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--theme-accent-dark)]"
              />
            </label>
            <label className="relative block">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-11 appearance-none rounded-md border border-black/15 bg-white px-3 pr-9 text-sm font-semibold outline-none focus:border-[var(--theme-accent-dark)]"
              >
                <option value="featured">Tri par defaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix decroissant</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-md border border-black/10 bg-white p-4">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em]">
              Categories
            </h3>
            <div className="grid gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`flex h-10 items-center justify-between rounded-md px-3 text-sm font-semibold ${
                    category === item
                      ? "bg-[var(--theme-ink)] text-white"
                      : "bg-[var(--theme-mist)] text-black/70 hover:text-black"
                  }`}
                >
                  {item}
                  <span>
                    {item === "Tous"
                      ? products.length
                      : products.filter((product) => product.category === item).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-5 border-t border-black/10 pt-4 text-sm leading-6 text-black/60">
              Les fiches doivent rester neutres : pas de promesse medicale, pas
              de conseil utilisation clinique.
            </div>
          </aside>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <article
                key={product.id}
                className="flex min-h-[320px] flex-col rounded-md border border-black/10 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-md bg-[var(--theme-mist)]">
                  <img
                    src={product.image || "/catalog-hero.png"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--theme-accent-dark)]">
                      {product.category}
                    </p>
                    <h3 className="mt-2 text-lg font-black">{product.name}</h3>
                  </div>
                  <span className="rounded-md bg-[var(--theme-accent-soft)] px-2 py-1 text-xs font-black text-[var(--theme-deep)]">
                    {product.badge || stockLabel[product.stock]}
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-1 text-sm">
                  {product.rating ? (
                    <>
                      <Star size={16} className="fill-[var(--theme-warm)] text-[var(--theme-warm)]" />
                      <span className="font-bold">{product.rating}</span>
                    </>
                  ) : (
                    <span className="text-black/45">Non note</span>
                  )}
                  <span className="ml-auto text-xs font-semibold text-black/45">
                    {product.unit}
                  </span>
                </div>

                <p className="text-sm leading-6 text-black/62">
                  {product.description}
                </p>

                <div className="mt-auto pt-5">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      {product.oldPrice ? (
                        <p className="text-sm font-semibold text-black/35 line-through">
                          {formatPrice(product.oldPrice)}
                        </p>
                      ) : null}
                      <p className="text-2xl font-black">
                        {product.price ? formatPrice(product.price) : "Devis"}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-deep)]">
                      {stockLabel[product.stock]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateCart(product.id, (cart[product.id] || 0) + 1)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--theme-ink)] px-4 text-sm font-bold text-white transition hover:bg-[var(--theme-deep)]"
                  >
                    <Plus size={18} />
                    Ajouter au panier
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="checkout" className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="h-fit rounded-md border border-black/10 p-4">
            <h2 className="text-2xl font-black">Panier</h2>
            <div className="mt-5 divide-y divide-black/10">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-bold">{item.product.name}</p>
                      <p className="text-sm text-black/55">
                        {item.product.price
                          ? formatPrice(item.product.price)
                          : "Prix sur demande"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Diminuer"
                        onClick={() => updateCart(item.product.id, item.quantity - 1)}
                        className="grid size-8 place-items-center rounded-md border border-black/15"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Augmenter"
                        onClick={() => updateCart(item.product.id, item.quantity + 1)}
                        className="grid size-8 place-items-center rounded-md border border-black/15"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Supprimer"
                        onClick={() => updateCart(item.product.id, 0)}
                        className="grid size-8 place-items-center rounded-md border border-black/15 text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-5 text-sm text-black/55">Le panier est vide.</p>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <strong>{shipping ? formatPrice(shipping) : "Offerte"}</strong>
              </div>
              <div className="flex justify-between text-xl font-black">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </aside>

          <form onSubmit={checkout} className="grid gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-accent-dark)]">
                Checkout
              </p>
              <h2 className="mt-1 text-2xl font-black">Informations client</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="name" label="Nom complet" required />
              <Input name="phone" label="Telephone" required />
              <Input name="email" label="Email" type="email" required />
              <Input name="city" label="Ville" required />
            </div>
            <Input name="address" label="Adresse de livraison" required />

            <div className="grid gap-3 rounded-md border border-black/10 bg-[var(--theme-mist)] p-4">
              <p className="font-black">Mode de paiement</p>
              <label className="flex items-start gap-3 rounded-md border border-black/10 bg-white p-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  defaultChecked
                  className="mt-1"
                />
                <span>
                  <span className="flex items-center gap-2 font-bold">
                    <CreditCard size={18} /> Carte bancaire via Stripe
                  </span>
                  <span className="mt-1 block text-sm text-black/55">
                    Redirection vers une page de paiement securisee apres
                    validation. Necessite un compte marchand approuve.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-md border border-black/10 bg-white p-3">
                <input type="radio" name="paymentMethod" value="bank" className="mt-1" />
                <span>
                  <span className="font-bold">Virement / SEPA</span>
                  <span className="mt-1 block text-sm text-black/55">
                    Commande enregistree, instructions de paiement envoyees par
                    email.
                  </span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-5 font-black text-white transition hover:bg-[var(--theme-deep)] disabled:opacity-60"
            >
              <CreditCard size={18} />
              {isSending ? "Preparation..." : "Continuer vers le paiement"}
            </button>
            {status ? <p className="text-sm font-semibold text-[var(--theme-deep)]">{status}</p> : null}
          </form>
        </div>
      </section>

      <footer id="legal" className="mx-auto max-w-7xl px-4 py-8 text-xs leading-5 text-black/52 sm:px-6">
        Les informations sont indicatives et doivent etre validees par le
        vendeur. Les produits sensibles doivent respecter la reglementation
        applicable, les conditions du prestataire de paiement et les obligations
        etiquetage.
      </footer>
    </main>
  );
}

function Input({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="h-12 rounded-md border border-black/15 px-3 font-normal outline-none focus:border-[var(--theme-accent-dark)]"
      />
    </label>
  );
}
