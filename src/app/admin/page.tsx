"use client";

import {
  ArrowLeft,
  BadgeEuro,
  ClipboardList,
  ImagePlus,
  PackagePlus,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { categories, type Product } from "@/data/products";
import { formatPrice } from "@/lib/money";

type FormState = Omit<Product, "id" | "oldPrice" | "rating" | "badge"> & {
  id?: string;
  oldPrice: number | "";
  rating: number | "";
  badge: string;
};

type OrderStatus = "pending_payment" | "paid" | "cancelled";

type StoredOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentMethod: "bank";
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
    name: string;
    unit: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
};

type GuideVideo = {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
};

type GuideFormState = {
  title: string;
  videoUrl: string;
};

const emptyForm: FormState = {
  name: "",
  category: "Peptides",
  price: 0,
  oldPrice: "",
  unit: "",
  rating: "",
  stock: "in-stock",
  description: "",
  image: "/catalog-hero.png",
  badge: "",
};

const emptyGuideForm: GuideFormState = {
  title: "",
  videoUrl: "",
};

const editableCategories = categories.filter((category) => category !== "Tous");
const stockOptions = [
  { value: "in-stock", label: "En stock" },
  { value: "preorder", label: "Precommande" },
  { value: "notify", label: "Sur demande" },
] as const;

const orderStatuses: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending_payment", label: "Paiement en attente" },
  { value: "paid", label: "Payee" },
  { value: "cancelled", label: "Annulee" },
];

const statusLabels = Object.fromEntries(
  orderStatuses.map((status) => [status.value, status.label]),
) as Record<OrderStatus, string>;

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [guides, setGuides] = useState<GuideVideo[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [guideForm, setGuideForm] = useState<GuideFormState>(emptyGuideForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "guides" | "products">("orders");
  const [productSearch, setProductSearch] = useState("");
  const [status, setStatus] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const [isUploadingGuide, setIsUploadingGuide] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId),
    [products, selectedId],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.category,
        product.unit,
        product.description,
        product.badge || "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [productSearch, products]);

  useEffect(() => {
    checkSession();
    loadProducts();
  }, []);

  async function checkSession() {
    const response = await fetch("/api/admin/session");
    const result = await response.json();
    const authenticated = Boolean(result.authenticated);
    setIsAuthenticated(authenticated);
    setIsCheckingSession(false);
    if (authenticated) {
      await loadOrders();
      await loadGuides();
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.message || "Connexion impossible.");
      return;
    }

    setIsAuthenticated(true);
    setPassword("");
    setStatus("");
    await loadOrders();
    await loadGuides();
  }

  async function loadProducts() {
    const response = await fetch("/api/products");
    const result = await response.json();
    setProducts(Array.isArray(result.products) ? result.products : []);
  }

  async function loadOrders() {
    const response = await fetch("/api/admin/orders");

    if (response.status === 401) {
      setIsAuthenticated(false);
      return;
    }

    const result = await response.json();
    setOrders(Array.isArray(result.orders) ? result.orders : []);
  }

  async function loadGuides() {
    const response = await fetch("/api/guides");
    const result = await response.json();
    setGuides(Array.isArray(result.guides) ? result.guides : []);
  }

  async function changeOrderStatus(orderId: string, nextStatus: OrderStatus) {
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.status === 401) {
      setIsAuthenticated(false);
      return;
    }

    if (!response.ok) {
      setStatus("Modification de commande impossible.");
      return;
    }

    await loadOrders();
    setStatus("Statut de commande modifie.");
  }

  async function removeOrder(order: StoredOrder) {
    if (!window.confirm(`Supprimer la commande ${order.id} ?`)) return;

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      setIsAuthenticated(false);
      return;
    }

    if (!response.ok) {
      setStatus("Suppression de commande impossible.");
      return;
    }

    await loadOrders();
    setStatus("Commande supprimee.");
  }

  function editProduct(product: Product) {
    setSelectedId(product.id);
    setForm({
      ...product,
      oldPrice: product.oldPrice ?? "",
      rating: product.rating ?? "",
      badge: product.badge ?? "",
    });
    setStatus("");
  }

  function resetForm() {
    setSelectedId(null);
    setForm(emptyForm);
    setStatus("");
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editGuide(guide: GuideVideo) {
    setSelectedGuideId(guide.id);
    setGuideForm({
      title: guide.title,
      videoUrl: guide.videoUrl,
    });
    setStatus("");
  }

  function resetGuideForm() {
    setSelectedGuideId(null);
    setGuideForm(emptyGuideForm);
    setStatus("");
  }

  function updateGuideField<K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) {
    setGuideForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);
    setIsUploading(true);
    setStatus("");

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: payload,
    });
    const result = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus(result.message || "Upload impossible.");
      return;
    }

    updateField("image", result.url);
    setStatus("Photo ajoutee. Pense a enregistrer le produit.");
  }

  async function uploadGuideVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);
    setIsUploadingGuide(true);
    setStatus("");

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: payload,
    });
    const result = await response.json();
    setIsUploadingGuide(false);

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus(result.message || "Upload video impossible.");
      return;
    }

    updateGuideField("videoUrl", result.url);
    setStatus("Video ajoutee. Pense a enregistrer le guide.");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    const payload = {
      ...form,
      price: Number(form.price) || 0,
      oldPrice: form.oldPrice === "" ? undefined : Number(form.oldPrice),
      rating: form.rating === "" ? undefined : Number(form.rating),
      badge: form.badge || undefined,
    };
    const url = selectedId ? `/api/products/${selectedId}` : "/api/products";
    const response = await fetch(url, {
      method: selectedId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus(result.message || "Enregistrement impossible.");
      return;
    }

    await loadProducts();
    setStatus(selectedId ? "Produit modifie." : "Produit ajoute.");
    if (!selectedId) {
      resetForm();
    }
  }

  async function saveGuide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingGuide(true);
    setStatus("");

    const url = selectedGuideId ? `/api/guides/${selectedGuideId}` : "/api/guides";
    const response = await fetch(url, {
      method: selectedGuideId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guideForm),
    });
    const result = await response.json();
    setIsSavingGuide(false);

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus(result.message || "Enregistrement du guide impossible.");
      return;
    }

    await loadGuides();
    setStatus(selectedGuideId ? "Guide modifie." : "Guide ajoute.");
    if (!selectedGuideId) {
      resetGuideForm();
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Supprimer ${product.name} ?`)) return;

    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus("Suppression impossible.");
      return;
    }

    await loadProducts();
    if (selectedId === product.id) {
      resetForm();
    }
    setStatus("Produit supprime.");
  }

  async function removeGuide(guide: GuideVideo) {
    if (!window.confirm(`Supprimer ${guide.title} ?`)) return;

    const response = await fetch(`/api/guides/${guide.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 401) {
        setIsAuthenticated(false);
      }
      setStatus("Suppression du guide impossible.");
      return;
    }

    await loadGuides();
    if (selectedGuideId === guide.id) {
      resetGuideForm();
    }
    setStatus("Guide supprime.");
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--theme-mist)] px-4 text-[var(--theme-ink)]">
        <form onSubmit={login} className="w-full max-w-sm rounded-md border border-black/10 bg-white p-5">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black/55">
            <ArrowLeft size={16} />
            Retour boutique
          </a>
          <h1 className="mt-4 text-2xl font-black">Connexion admin</h1>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Entre le mot de passe admin pour modifier les produits, les prix et les photos.
          </p>
          <label className="mt-5 grid gap-2 text-sm font-bold">
            Mot de passe
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              disabled={isCheckingSession}
              className="h-11 rounded-md border border-black/15 px-3 font-normal outline-none focus:border-[var(--theme-accent-dark)]"
            />
          </label>
          <button
            type="submit"
            disabled={isCheckingSession}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <Save size={18} />
            {isCheckingSession ? "Verification..." : "Entrer"}
          </button>
          {status ? <p className="mt-3 text-sm font-bold text-red-700">{status}</p> : null}
          <p className="mt-4 text-xs leading-5 text-black/45">
            En local, le mot de passe par defaut est admin123 si ADMIN_PASSWORD n'est pas configure.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--theme-mist)] text-[var(--theme-ink)]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-black/55">
              <ArrowLeft size={16} />
              Retour boutique
            </a>
            <h1 className="mt-2 text-3xl font-black">Admin BIP PEPTIDE</h1>
          </div>
          {activeTab === "products" ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--theme-ink)] px-4 text-sm font-bold text-white"
            >
              <PackagePlus size={18} />
              Nouveau produit
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-2 px-4 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-black ${
            activeTab === "orders" ? "bg-black text-white" : "border border-black/15 bg-white"
          }`}
        >
          <ClipboardList size={18} />
          Commandes ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guides")}
          className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-black ${
            activeTab === "guides" ? "bg-black text-white" : "border border-black/15 bg-white"
          }`}
        >
          <PlayCircle size={18} />
          Guide ({guides.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-black ${
            activeTab === "products" ? "bg-black text-white" : "border border-black/15 bg-white"
          }`}
        >
          <PackagePlus size={18} />
          Produits ({products.length})
        </button>
      </div>

      {activeTab === "orders" ? (
        <OrdersPanel
          orders={orders}
          onStatusChange={changeOrderStatus}
          onDelete={removeOrder}
          onRefresh={loadOrders}
        />
      ) : activeTab === "guides" ? (
        <GuidesPanel
          guides={guides}
          form={guideForm}
          selectedGuideId={selectedGuideId}
          status={status}
          isSaving={isSavingGuide}
          isUploading={isUploadingGuide}
          onSubmit={saveGuide}
          onChange={updateGuideField}
          onEdit={editGuide}
          onDelete={removeGuide}
          onReset={resetGuideForm}
          onUpload={uploadGuideVideo}
        />
      ) : (
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-md border border-black/10 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-accent-dark)]">
                Produits
              </p>
              <h2 className="text-xl font-black">
                {filteredProducts.length} / {products.length} references
              </h2>
            </div>
            <BadgeEuro className="text-[var(--theme-accent-dark)]" size={26} />
          </div>

          <label className="relative mb-4 block">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/45"
            />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Rechercher par nom, categorie, unite..."
              className="h-11 w-full rounded-md border border-black/15 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-[var(--theme-accent-dark)]"
              aria-label="Rechercher un produit"
            />
          </label>

          <div className="grid gap-3">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <article
                key={product.id}
                className={`grid gap-3 rounded-md border p-3 sm:grid-cols-[82px_1fr_auto] ${
                  selectedId === product.id ? "border-[var(--theme-accent-dark)] bg-[var(--theme-accent-soft)]" : "border-black/10"
                }`}
              >
                <img
                  src={product.image || "/catalog-hero.png"}
                  alt={product.name}
                  className="aspect-square w-full rounded-md object-cover sm:w-[82px]"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--theme-accent-dark)]">
                    {product.category}
                  </p>
                  <h3 className="mt-1 font-black">{product.name}</h3>
                  <p className="mt-1 text-sm text-black/55">
                    {product.price ? formatPrice(product.price) : "Devis"} · {product.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editProduct(product)}
                    className="grid size-9 place-items-center rounded-md border border-black/15"
                    aria-label="Modifier"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(product)}
                    className="grid size-9 place-items-center rounded-md border border-black/15 text-red-700"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            )) : (
              <p className="rounded-md border border-dashed border-black/15 p-4 text-sm font-semibold text-black/55">
                Aucun produit trouve.
              </p>
            )}
          </div>
        </section>

        <form onSubmit={saveProduct} className="h-fit min-w-0 rounded-md border border-black/10 bg-white p-4">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--theme-accent-dark)]">
                Edition
              </p>
              <h2 className="text-xl font-black">
                {selectedProduct ? `Modifier ${selectedProduct.name}` : "Ajouter un produit"}
              </h2>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--theme-accent-dark)] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              {selectedId ? <Save size={18} /> : <Plus size={18} />}
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Input label="Nom" value={form.name} onChange={(value) => updateField("name", value)} required />
              <Input label="Unite" value={form.unit} onChange={(value) => updateField("unit", value)} required />
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Input
                label="Prix"
                type="number"
                value={form.price}
                onChange={(value) => updateField("price", Number(value) || 0)}
                required
              />
              <Input
                label="Ancien prix"
                type="number"
                value={form.oldPrice}
                onChange={(value) => updateField("oldPrice", value === "" ? "" : Number(value))}
              />
              <Input
                label="Note"
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(value) => updateField("rating", value === "" ? "" : Number(value))}
              />
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Select
                label="Categorie"
                value={form.category}
                options={editableCategories.map((category) => ({ value: category, label: category }))}
                onChange={(value) => updateField("category", value as Product["category"])}
              />
              <Select
                label="Stock"
                value={form.stock}
                options={stockOptions}
                onChange={(value) => updateField("stock", value as Product["stock"])}
              />
              <Input label="Badge" value={form.badge} onChange={(value) => updateField("badge", value)} />
            </div>

            <label className="grid min-w-0 gap-2 text-sm font-bold">
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
                rows={4}
                className="w-full min-w-0 resize-y rounded-md border border-black/15 px-3 py-3 font-normal outline-none focus:border-[var(--theme-accent-dark)]"
              />
            </label>

            <div className="grid min-w-0 gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
              <img
                src={form.image || "/catalog-hero.png"}
                alt="Apercu produit"
                className="aspect-square w-full rounded-md border border-black/10 object-cover"
              />
              <div className="grid min-w-0 content-start gap-3">
                <Input
                  label="URL photo"
                  value={form.image || ""}
                  onChange={(value) => updateField("image", value)}
                />
                <label className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-black/15 px-4 text-sm font-black">
                  <input type="file" accept="image/*" onChange={uploadImage} className="sr-only" />
                  {isUploading ? <Upload size={18} /> : <ImagePlus size={18} />}
                  {isUploading ? "Upload..." : "Changer la photo"}
                </label>
              </div>
            </div>

            {status ? <p className="text-sm font-bold text-[var(--theme-deep)]">{status}</p> : null}
          </div>
        </form>
      </div>
      )}
    </main>
  );
}

function GuidesPanel({
  guides,
  form,
  selectedGuideId,
  status,
  isSaving,
  isUploading,
  onSubmit,
  onChange,
  onEdit,
  onDelete,
  onReset,
  onUpload,
}: {
  guides: GuideVideo[];
  form: GuideFormState;
  selectedGuideId: string | null;
  status: string;
  isSaving: boolean;
  isUploading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => void;
  onEdit: (guide: GuideVideo) => void;
  onDelete: (guide: GuideVideo) => void;
  onReset: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const selectedGuide = guides.find((guide) => guide.id === selectedGuideId);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-md border border-black/10 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
              Guide
            </p>
            <h2 className="text-xl font-black">{guides.length} videos</h2>
          </div>
          <PlayCircle size={26} />
        </div>

        <div className="grid gap-3">
          {guides.length ? (
            guides.map((guide) => (
              <article
                key={guide.id}
                className={`grid gap-3 rounded-md border p-3 ${
                  selectedGuideId === guide.id
                    ? "border-black bg-[var(--theme-accent-soft)]"
                    : "border-black/10"
                }`}
              >
                <video
                  src={guide.videoUrl}
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-md bg-black object-cover"
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                      {formatDate(guide.createdAt)}
                    </p>
                    <h3 className="mt-1 font-black">{guide.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(guide)}
                      className="grid size-9 place-items-center rounded-md border border-black/15"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(guide)}
                      className="grid size-9 place-items-center rounded-md border border-black/15 text-red-700"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-black/10 bg-[var(--theme-mist)] p-5 text-sm font-semibold text-black/55">
              Aucune video guide pour le moment.
            </p>
          )}
        </div>
      </section>

      <form onSubmit={onSubmit} className="h-fit rounded-md border border-black/10 bg-white p-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
              Edition
            </p>
            <h2 className="text-xl font-black">
              {selectedGuide ? `Modifier ${selectedGuide.title}` : "Ajouter une video guide"}
            </h2>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-black px-4 text-sm font-black text-white disabled:opacity-60"
          >
            {selectedGuideId ? <Save size={18} /> : <Plus size={18} />}
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <div className="grid gap-4">
          <Input
            label="Titre"
            value={form.title}
            onChange={(value) => onChange("title", value)}
            required
          />
          <Input
            label="URL video"
            value={form.videoUrl}
            onChange={(value) => onChange("videoUrl", value)}
            required
          />
          {form.videoUrl ? (
            <video
              src={form.videoUrl}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-md border border-black/10 bg-black object-cover"
            />
          ) : (
            <div className="grid aspect-video place-items-center rounded-md border border-black/10 bg-[var(--theme-mist)] text-sm font-semibold text-black/45">
              Apercu video
            </div>
          )}
          <label className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-black/15 px-4 text-sm font-black">
            <input type="file" accept="video/*" onChange={onUpload} className="sr-only" />
            <Upload size={18} />
            {isUploading ? "Upload..." : "Uploader une video"}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center rounded-md border border-black/15 px-3 text-sm font-black"
            >
              Nouveau guide
            </button>
          </div>
          {status ? <p className="text-sm font-bold text-[var(--theme-deep)]">{status}</p> : null}
        </div>
      </form>
    </div>
  );
}

function OrdersPanel({
  orders,
  onStatusChange,
  onDelete,
  onRefresh,
}: {
  orders: StoredOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onDelete: (order: StoredOrder) => void;
  onRefresh: () => void;
}) {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) => order.status !== "cancelled").length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-black/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
            Commandes
          </p>
          <p className="mt-2 text-3xl font-black">{orders.length}</p>
        </div>
        <div className="rounded-md border border-black/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
            Actives
          </p>
          <p className="mt-2 text-3xl font-black">{activeOrders}</p>
        </div>
        <div className="rounded-md border border-black/10 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
            Total
          </p>
          <p className="mt-2 text-3xl font-black">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      <div className="rounded-md border border-black/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-black/45">
              Suivi
            </p>
            <h2 className="text-xl font-black">Gestion des commandes</h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-black/15 px-3 text-sm font-black"
          >
            <ClipboardList size={17} />
            Actualiser
          </button>
        </div>

        <div className="divide-y divide-black/10">
          {orders.length ? (
            orders.map((order) => (
              <article key={order.id} className="grid gap-5 p-4 lg:grid-cols-[1fr_240px]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-black/45">
                        {formatDate(order.createdAt)}
                      </p>
                      <h3 className="mt-1 text-lg font-black">{order.id}</h3>
                      <p className="mt-1 text-sm text-black/55">
                        {order.customer.name} - {order.customer.phone}
                      </p>
                    </div>
                    <span className="rounded-md bg-black px-2 py-1 text-xs font-black text-white">
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-md bg-[var(--theme-mist)] p-3 text-sm leading-6">
                      <p className="font-black">Client</p>
                      <p>{order.customer.email || "Email non renseigne"}</p>
                      <p>{order.customer.city || "Ville non renseignee"}</p>
                      <p>{order.customer.address || "Adresse non renseignee"}</p>
                      {order.customer.message ? <p>Message: {order.customer.message}</p> : null}
                    </div>
                    <div className="rounded-md bg-[var(--theme-mist)] p-3 text-sm leading-6">
                      <p className="font-black">Paiement</p>
                      <p>Virement / SEPA</p>
                      <p>Sous-total: {formatPrice(order.subtotal)}</p>
                      <p>Livraison: {order.shipping ? formatPrice(order.shipping) : "Offerte"}</p>
                      <p className="font-black">Total: {formatPrice(order.total)}</p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-md border border-black/10">
                    {order.items.map((item) => (
                      <div
                        key={`${order.id}-${item.productId}`}
                        className="flex items-center justify-between gap-3 border-b border-black/10 px-3 py-2 last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-black">{item.name}</p>
                          <p className="text-xs text-black/50">{item.unit}</p>
                        </div>
                        <p className="text-sm font-bold">
                          x{item.quantity} - {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid content-start gap-3">
                  <Select
                    label="Statut"
                    value={order.status}
                    options={orderStatuses}
                    onChange={(value) => onStatusChange(order.id, value as OrderStatus)}
                  />
                  <button
                    type="button"
                    onClick={() => onDelete(order)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-black/15 text-sm font-black text-red-700"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="p-6 text-sm font-semibold text-black/55">
              Aucune commande pour le moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  step,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold">
      <span className="truncate">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        step={step}
        required={required}
        className="h-11 w-full min-w-0 rounded-md border border-black/15 px-3 font-normal outline-none focus:border-[var(--theme-accent-dark)]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold">
      <span className="truncate">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 rounded-md border border-black/15 bg-white px-3 font-normal outline-none focus:border-[var(--theme-accent-dark)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
