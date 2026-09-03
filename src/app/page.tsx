"use client";

import {
  BadgeCheck,
  ChevronDown,
  Languages,
  LogIn,
  Mail,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { categories as defaultCategoryOptions, defaultProducts, type Product } from "@/data/products";
import { formatPrice } from "@/lib/money";

type Cart = Record<string, number>;
type Category = string;
type SortMode = "featured" | "price-asc" | "price-desc";
type Language = "fr" | "en";
const productsPerPage = 6;
const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "";

const copy = {
  fr: {
    accessTitle: "Accès Professionnel",
    accessText:
      "BIP HORIZON fournit des composés exclusivement pour la recherche en laboratoire. L'accès est réservé aux professionnels qualifiés.",
    accessConfirm:
      "Je confirme être un professionnel qualifié et que cette commande est uniquement destinée à la recherche en laboratoire.",
    accessButton: "Accéder au site",
    accessLegal:
      "En entrant, vous confirmez être en conformité avec toutes les lois applicables dans votre juridiction.",
    alert:
      "Attention: ce site est réservé uniquement aux laboratoires et à la recherche.",
    navShop: "Boutique",
    navCart: "Panier",
    navTerms: "Conditions",
    adminLogin: "Connexion admin",
    cartArticle: "article",
    cartArticles: "articles",
    trust: [
      "Livraison suivie",
      "Contact WhatsApp",
      "Pureté contrôlée",
      "Expédition rapide",
      "Commande accompagnée",
      "Catalogue contrôlé",
    ],
    heroTitle: "Excellence, performance et sélection professionnelle.",
    heroText:
      "Une boutique soignée avec un catalogue fluide, des prix visibles et une expérience simple pour passer de la sélection au panier.",
    viewShop: "Voir la boutique",
    whatsapp: "Contact WhatsApp",
    technical: ["Pureté contrôlée", "Dosage de précision", "Traçabilité laboratoire"],
    shop: "Boutique",
    allProducts: "Tous les produits",
    loading: "Chargement du catalogue...",
    searchPlaceholder: "Rechercher un produit",
    defaultSort: "Tri par défaut",
    priceAsc: "Prix croissant",
    priceDesc: "Prix décroissant",
    categories: "Catégories",
    neutralNote:
      "Les fiches doivent rester neutres : pas de promesse médicale, pas de conseil utilisation clinique.",
    quote: "Devis",
    notRated: "Non noté",
    addToCart: "Ajouter au panier",
    productCount: "produits",
    previous: "Précédent",
    next: "Suivant",
    cart: "Panier",
    priceOnRequest: "Prix sur demande",
    emptyCart: "Le panier est vide.",
    subtotal: "Sous-total",
    shipping: "Livraison",
    free: "Offerte",
    customerInfo: "Informations client",
    name: "Nom complet",
    phone: "Téléphone",
    email: "Email",
    city: "Ville",
    address: "Adresse de livraison",
    contactOrder: "Commande par contact WhatsApp",
    contactText:
      "Après validation, la commande est enregistrée et WhatsApp s'ouvre avec le résumé prêt à envoyer au vendeur. Le paiement se confirme ensuite directement avec lui.",
    sending: "Préparation...",
    contactWhatsapp: "Contacter sur WhatsApp",
    mainMenu: "Main Menu",
    footerMenu: "Footer Menu",
    signup: "Sign Up And Save",
    signupText:
      "Recevez les nouveautés, les alertes catalogue et les offres disponibles directement par email.",
    emailPlaceholder: "Enter your email",
    footerLine:
      "Copyright 2026 BIP HORIZON. Boutique spécialisée avec catalogue sélectionné, contact direct et accompagnement client.",
    stock: {
      "in-stock": "En stock",
      preorder: "Précommande",
      notify: "Sur demande",
    },
  },
  en: {
    accessTitle: "Professional Access",
    accessText:
      "BIP HORIZON supplies compounds exclusively for laboratory research. Access is reserved for qualified professionals.",
    accessConfirm:
      "I confirm that I am a qualified professional and that this order is intended only for laboratory research.",
    accessButton: "Enter Site",
    accessLegal:
      "By entering, you confirm that you comply with all applicable laws in your jurisdiction.",
    alert:
      "Notice: this site is reserved only for laboratories and research purposes.",
    navShop: "Shop",
    navCart: "Cart",
    navTerms: "Terms",
    adminLogin: "Admin login",
    cartArticle: "item",
    cartArticles: "items",
    trust: [
      "Tracked delivery",
      "WhatsApp contact",
      "Controlled purity",
      "Fast dispatch",
      "Assisted order",
      "Controlled catalogue",
    ],
    heroTitle: "Excellence, performance and professional selection.",
    heroText:
      "A refined store with a fluid catalogue, visible pricing and a simple path from selection to cart.",
    viewShop: "View shop",
    whatsapp: "WhatsApp contact",
    technical: ["Controlled purity", "Precision dosing", "Laboratory traceability"],
    shop: "Shop",
    allProducts: "All products",
    loading: "Loading catalogue...",
    searchPlaceholder: "Search products",
    defaultSort: "Default sort",
    priceAsc: "Price low to high",
    priceDesc: "Price high to low",
    categories: "Categories",
    neutralNote:
      "Product sheets must remain neutral: no medical promises and no clinical usage advice.",
    quote: "Quote",
    notRated: "Not rated",
    addToCart: "Add to cart",
    productCount: "products",
    previous: "Previous",
    next: "Next",
    cart: "Cart",
    priceOnRequest: "Price on request",
    emptyCart: "Your cart is empty.",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    customerInfo: "Customer information",
    name: "Full name",
    phone: "Phone",
    email: "Email",
    city: "City",
    address: "Delivery address",
    contactOrder: "Order by WhatsApp contact",
    contactText:
      "After confirmation, the order is saved and WhatsApp opens with a summary ready to send to the seller. Payment is then confirmed directly with them.",
    sending: "Preparing...",
    contactWhatsapp: "Contact on WhatsApp",
    mainMenu: "Main Menu",
    footerMenu: "Footer Menu",
    signup: "Sign Up And Save",
    signupText:
      "Receive new arrivals, catalogue alerts and available offers directly by email.",
    emailPlaceholder: "Enter your email",
    footerLine:
      "Copyright 2026 BIP HORIZON. Specialist store with curated catalogue, direct contact and customer support.",
    stock: {
      "in-stock": "In stock",
      preorder: "Preorder",
      notify: "On request",
    },
  },
} as const;

const trustIcons = [Truck, ShieldCheck, BadgeCheck, Truck, ShieldCheck, BadgeCheck];

export default function Home() {
  const [language, setLanguage] = useState<Language>("fr");
  const [cart, setCart] = useState<Cart>({});
  const [category, setCategory] = useState<Category>("Tous");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([...defaultCategoryOptions]);
  const [sort, setSort] = useState<SortMode>("featured");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [productPage, setProductPage] = useState(1);
  const [orderNotice, setOrderNotice] = useState<{
    orderId?: string;
    message: string;
  } | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAccessConfirmed, setIsAccessConfirmed] = useState(false);
  const [isAccessChecked, setIsAccessChecked] = useState(false);
  const text = copy[language];
  const stockLabel = text.stock;
  const trustMessages = text.trust.map((label, index) => ({
    icon: trustIcons[index] || BadgeCheck,
    label,
  }));

  useEffect(() => {
    setIsAccessConfirmed(localStorage.getItem("bip-horizon-access") === "accepted");
    setLanguage(localStorage.getItem("bip-horizon-language") === "en" ? "en" : "fr");
  }, []);

  useEffect(() => {
    if (isAccessConfirmed) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAccessConfirmed]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);
        const result = await productsResponse.json();
        const categoriesResult = await categoriesResponse.json();

        if (isMounted && Array.isArray(result.products)) {
          setProducts(result.products);
        }
        if (isMounted && Array.isArray(categoriesResult.categories)) {
          const names = categoriesResult.categories
            .map((entry: { name?: string }) => String(entry.name || "").trim())
            .filter(Boolean);
          setCategoryOptions(["Tous", ...names]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setProductPage(1);
  }, [category, products, search, sort]);

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
  }, [category, products, search, sort]);

  const totalProductPages = Math.max(1, Math.ceil(visibleProducts.length / productsPerPage));
  const safeProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = visibleProducts.slice(
    (safeProductPage - 1) * productsPerPage,
    safeProductPage * productsPerPage,
  );
  const productRangeStart = visibleProducts.length
    ? (safeProductPage - 1) * productsPerPage + 1
    : 0;
  const productRangeEnd = Math.min(safeProductPage * productsPerPage, visibleProducts.length);

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
  const directWhatsappUrl = buildWhatsappUrl(
    "Bonjour, je souhaite vous contacter pour une commande.",
  );

  function updateCart(productId: string, quantity: number) {
    setCart((current) => ({ ...current, [productId]: Math.max(0, quantity) }));
  }

  function confirmAccess() {
    if (!isAccessChecked) {
      return;
    }

    localStorage.setItem("bip-horizon-access", "accepted");
    setIsAccessConfirmed(true);
  }

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === "fr" ? "en" : "fr";
      localStorage.setItem("bip-horizon-language", next);
      return next;
    });
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checkoutForm = event.currentTarget;
    setStatus("");

    if (!cartItems.length) {
      setStatus("Ajoute au moins un produit avant le paiement.");
      return;
    }

    const form = new FormData(checkoutForm);
    setIsSending(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: "whatsapp",
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

    setStatus(result.message);
    if (response.ok) {
      const whatsappMessage = buildWhatsappMessage(result.orderId, {
        name: String(form.get("name") || ""),
        phone: String(form.get("phone") || ""),
        email: String(form.get("email") || ""),
        city: String(form.get("city") || ""),
        address: String(form.get("address") || ""),
      }, cartItems, total);

      const whatsappUrl = buildWhatsappUrl(whatsappMessage);

      if (!whatsappUrl) {
        setOrderNotice({
          orderId: result.orderId,
          message:
            "Commande enregistrée, mais le numéro WhatsApp vendeur n'est pas configuré.",
        });
        setStatus("Ajoute NEXT_PUBLIC_WHATSAPP_PHONE dans .env.local puis relance le projet.");
        return;
      }

      setOrderNotice({
        orderId: result.orderId,
        message:
          result.message ||
          "Commande confirmée. Redirection vers WhatsApp pour finaliser avec le vendeur.",
      });
      setCart({});
      checkoutForm.reset();
      window.location.assign(whatsappUrl);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--theme-mist)] text-[var(--theme-ink)]">
      {!isAccessConfirmed ? (
        <div className="fixed inset-0 z-[100] grid min-h-screen place-items-center bg-black/45 px-4 py-6 text-black backdrop-blur-md">
          <div className="w-full max-w-xl rounded-md border border-black/10 bg-white/95 px-5 py-8 text-center shadow-2xl ring-1 ring-white/50 sm:px-9 sm:py-10">
            <div className="mx-auto mb-6 grid size-12 place-items-center rounded-full border border-black/10 bg-white">
              <img
                src="/bip-peptide-logo.png"
                alt="BIP HORIZON"
                className="size-9 rounded-full bg-white object-cover"
              />
            </div>
            <h1 className="text-2xl font-black sm:text-4xl">
              {text.accessTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/58 sm:text-base">
              {text.accessText}
            </p>

            <label className="mx-auto mt-6 flex max-w-lg cursor-pointer items-start gap-3 rounded-md border border-black/12 bg-[var(--theme-mist)] p-4 text-left text-sm leading-6 text-black/70 sm:text-base">
              <input
                type="checkbox"
                checked={isAccessChecked}
                onChange={(event) => setIsAccessChecked(event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-black"
              />
              <span>
                {text.accessConfirm}
              </span>
            </label>

            <button
              type="button"
              onClick={confirmAccess}
              disabled={!isAccessChecked}
              className="mx-auto mt-5 flex h-12 w-full max-w-lg items-center justify-center rounded-md bg-black text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:bg-white disabled:text-black/25 disabled:ring-1 disabled:ring-black/12"
            >
              {text.accessButton}
            </button>

            <p className="mx-auto mt-5 max-w-lg text-xs leading-5 text-black/35 sm:text-sm">
              {text.accessLegal}
            </p>
          </div>
        </div>
      ) : null}

      {orderNotice ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-xl rounded-md border border-black/10 bg-white p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 shrink-0 text-black" size={22} />
            <div className="min-w-0 flex-1">
              <p className="font-black">Commande bien passée</p>
              <p className="mt-1 text-sm leading-6 text-black/65">{orderNotice.message}</p>
              {orderNotice.orderId ? (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-black/45">
                  Reference {orderNotice.orderId}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOrderNotice(null)}
              className="grid size-8 shrink-0 place-items-center rounded-md border border-black/15 text-sm font-black"
              aria-label="Fermer"
            >
              x
            </button>
          </div>
        </div>
      ) : null}

      <div className="border-b border-yellow-500 bg-yellow-300 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-black sm:text-sm">
        {text.alert}
      </div>

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
              src="/bip-peptide-logo.png"
              alt="BIP HORIZON"
              className="size-11 rounded-full border border-black/10 bg-white object-cover"
            />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              BIP HORIZON
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-black/70 md:flex">
            <a href="#boutique" className="hover:text-black">
              {text.navShop}
            </a>
            <a href="#checkout" className="hover:text-black">
              {text.navCart}
            </a>
            <a href="/conditions-generales-vente" className="hover:text-black">
              {text.navTerms}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#checkout"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-4 text-sm font-bold text-white transition hover:bg-[var(--theme-deep)]"
            >
              <ShoppingBag size={18} />
              {cartItems.length}{" "}
              {cartItems.length > 1 ? text.cartArticles : text.cartArticle}
            </a>
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-black/15 bg-white px-3 text-xs font-black text-black transition hover:border-black hover:bg-black hover:text-white"
              aria-label="Changer la langue"
              title="Changer la langue"
            >
              <Languages size={17} />
              {language === "fr" ? "EN" : "FR"}
            </button>
            <a
              href="/admin"
              className="grid size-11 place-items-center rounded-md border border-black/15 bg-white text-black transition hover:border-black hover:bg-black hover:text-white"
              aria-label={text.adminLogin}
              title={text.adminLogin}
            >
              <LogIn size={19} />
            </a>
          </div>
        </div>
      </header>

      <section className="relative isolate min-h-[70vh] overflow-hidden bg-[var(--theme-deep)] text-white">
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
              BIP HORIZON
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.03] sm:text-6xl lg:text-7xl">
              {text.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              {text.heroText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#boutique"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-black transition hover:bg-neutral-200"
              >
                <ShoppingBag size={18} />
                {text.viewShop}
              </a>
              <a
                href={directWhatsappUrl || "#checkout"}
                target={directWhatsappUrl ? "_blank" : undefined}
                rel={directWhatsappUrl ? "noreferrer" : undefined}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/45 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/18"
              >
                <ShieldCheck size={18} />
                {text.whatsapp}
              </a>
            </div>
          </div>

          <div className="mt-12 grid max-w-3xl gap-3 text-sm font-bold text-white/82 sm:grid-cols-3">
            {text.technical.map((item) => (
              <span key={item} className="border-t border-white/25 pt-3">{item}</span>
            ))}
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

      <section id="boutique" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-accent-dark)]">
              {text.shop}
            </p>
            <h2 className="mt-1 text-3xl font-black">{text.allProducts}</h2>
            {isLoadingProducts ? (
              <p className="mt-2 text-sm font-semibold text-black/50">
                {text.loading}
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
                placeholder={text.searchPlaceholder}
                className="h-11 w-full rounded-md border border-black/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--theme-accent-dark)]"
              />
            </label>
            <label className="relative block">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-11 appearance-none rounded-md border border-black/15 bg-white px-3 pr-9 text-sm font-semibold outline-none focus:border-[var(--theme-accent-dark)]"
              >
                <option value="featured">{text.defaultSort}</option>
                <option value="price-asc">{text.priceAsc}</option>
                <option value="price-desc">{text.priceDesc}</option>
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
              {text.categories}
            </h3>
            <div className="grid gap-2">
              {categoryOptions.map((item) => (
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
              {text.neutralNote}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product) => (
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
                    <span className="text-black/45">{text.notRated}</span>
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
                        {product.price ? formatPrice(product.price) : text.quote}
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
                    {text.addToCart}
                  </button>
                </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-md border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-black/55">
                {productRangeStart}-{productRangeEnd} / {visibleProducts.length} {text.productCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                  disabled={safeProductPage === 1}
                  className="h-10 rounded-md border border-black/15 px-3 text-sm font-black disabled:opacity-40"
                >
                  {text.previous}
                </button>
                <span className="grid h-10 min-w-10 place-items-center rounded-md bg-black px-3 text-sm font-black text-white">
                  {safeProductPage}/{totalProductPages}
                </span>
                <button
                  type="button"
                  onClick={() => setProductPage((page) => Math.min(totalProductPages, page + 1))}
                  disabled={safeProductPage === totalProductPages}
                  className="h-10 rounded-md border border-black/15 px-3 text-sm font-black disabled:opacity-40"
                >
                  {text.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="checkout" className="border-t border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="h-fit rounded-md border border-black/10 p-4">
            <h2 className="text-2xl font-black">{text.cart}</h2>
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
                          : text.priceOnRequest}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={language === "fr" ? "Diminuer" : "Decrease"}
                        onClick={() => updateCart(item.product.id, item.quantity - 1)}
                        className="grid size-8 place-items-center rounded-md border border-black/15"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={language === "fr" ? "Augmenter" : "Increase"}
                        onClick={() => updateCart(item.product.id, item.quantity + 1)}
                        className="grid size-8 place-items-center rounded-md border border-black/15"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={language === "fr" ? "Supprimer" : "Remove"}
                        onClick={() => updateCart(item.product.id, 0)}
                        className="grid size-8 place-items-center rounded-md border border-black/15 text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-5 text-sm text-black/55">{text.emptyCart}</p>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between">
                <span>{text.subtotal}</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>{text.shipping}</span>
                <strong>{shipping ? formatPrice(shipping) : text.free}</strong>
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
              <h2 className="mt-1 text-2xl font-black">{text.customerInfo}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="name" label={text.name} required />
              <Input name="phone" label={text.phone} required />
              <Input name="email" label={text.email} type="email" required />
              <Input name="city" label={text.city} required />
            </div>
            <Input name="address" label={text.address} required />

            <div className="rounded-md border border-black/10 bg-[var(--theme-mist)] p-4">
              <p className="font-black">{text.contactOrder}</p>
              <p className="mt-2 text-sm leading-6 text-black/60">
                {text.contactText}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-5 font-black text-white transition hover:bg-[var(--theme-deep)] disabled:opacity-60"
            >
              <ShieldCheck size={18} />
              {isSending ? text.sending : text.contactWhatsapp}
            </button>
            {status ? <p className="text-sm font-semibold text-[var(--theme-deep)]">{status}</p> : null}
          </form>
        </div>
      </section>

      <footer id="legal" className="bg-[#050505] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr_1.35fr]">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em]">
                {text.mainMenu}
              </h2>
              <nav className="mt-6 grid gap-4 text-sm text-white/68">
                <a href="#" className="w-fit hover:text-white">Home</a>
                <a href="#boutique" className="w-fit hover:text-white">{text.navShop}</a>
                <a href="#checkout" className="w-fit hover:text-white">Contact</a>
                <a href="/mentions-legales" className="w-fit hover:text-white">Mentions légales</a>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em]">
                {text.footerMenu}
              </h2>
              <nav className="mt-6 grid gap-4 text-sm text-white/68">
                <a href="#boutique" className="w-fit hover:text-white">Search</a>
                <a href="#" className="w-fit hover:text-white">About Us</a>
                <a href="/conditions-generales-vente" className="w-fit hover:text-white">Conditions générales de vente</a>
                <a href="/politique-confidentialite" className="w-fit hover:text-white">Politique de confidentialité</a>
                <a href="/mentions-legales" className="w-fit hover:text-white">Mentions légales</a>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em]">
                {text.signup}
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-6 text-white/68">
                {text.signupText}
              </p>
              <label className="mt-5 flex h-12 max-w-sm items-center rounded-md border border-white/85 px-4">
                <input
                  type="email"
                  placeholder={text.emailPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/58"
                />
                <Mail size={21} className="text-white/70" />
              </label>
            </div>
          </div>

          <div className="mt-10 text-center text-xs leading-6 text-white/58">
            <p>
              {text.footerLine}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function buildWhatsappMessage(
  orderId: string | undefined,
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
  },
  cartItems: Array<{ product: Product; quantity: number }>,
  total: number,
) {
  const products = cartItems
    .map((item) => `- ${item.product.name} x${item.quantity} (${formatPrice(item.product.price)})`)
    .join("\n");

  return [
    "Bonjour, je veux finaliser cette commande BIP HORIZON.",
    orderId ? `Reference: ${orderId}` : "",
    "",
    `Nom: ${customer.name}`,
    `Téléphone: ${customer.phone}`,
    `Email: ${customer.email}`,
    `Ville: ${customer.city}`,
    `Adresse: ${customer.address}`,
    "",
    "Produits:",
    products,
    "",
    `Total: ${formatPrice(total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWhatsappUrl(message: string) {
  const normalizedPhone = whatsappPhone.replace(/\D/g, "");

  if (!normalizedPhone) {
    return "";
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
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
