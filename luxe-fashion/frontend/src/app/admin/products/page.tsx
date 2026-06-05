"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, categoriesApi, uploadApi } from "@/lib/api";
import {
  AdminPageHeader,
  DataTable,
  StatusBadge,
  Pagination,
  Modal,
  SearchInput,
} from "@/components/admin/AdminUI";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { AdminTableThumb } from "@/components/admin/AdminTableThumb";
import {
  ProductVariantBuilder,
  type ProductVariantInput,
} from "@/components/admin/ProductVariantBuilder";
import toast from "react-hot-toast";
import { formatEGP } from "@/lib/currency";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  comparePrice: "",
  cost: "",
  costPrice: "",
  sku: "",
  categoryId: "",
  brand: "",
  material: "",
  tags: "",
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  images: [] as any[],
  variants: [] as ProductVariantInput[],
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadColorHex, setUploadColorHex] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", page, search],
    queryFn: () => productsApi.getAll({ page, limit: 15, search }),
  });

  const { data: catsData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });
  const categories: any[] = Array.isArray(catsData?.data) ? catsData.data : [];

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editing ? productsApi.update(editing.id, payload) : productsApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to save product";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      window.location.reload();
    },
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination;

  const variantColors = form.variants
    .filter((v) => v.colorHex)
    .reduce((acc: { color: string; colorHex: string }[], v) => {
      if (!acc.find((c) => c.colorHex === v.colorHex)) {
        acc.push({ color: v.color || v.colorHex || "", colorHex: v.colorHex! });
      }
      return acc;
    }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploadColorHex("");
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setUploadColorHex("");
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      cost: p.cost ? String(p.cost) : "",
      costPrice: p.costPrice ? String(p.costPrice) : "",
      sku: p.sku || "",
      categoryId: p.categoryId,
      brand: p.brand || "",
      material: p.material || "",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      images: p.images || [],
      variants: (p.variants || []).map((v: any) => ({
        size: v.size ?? null,
        color: v.color ?? null,
        colorHex: v.colorHex ?? null,
        stock: Number(v.stock) || 0,
        price: v.price != null ? Number(v.price) : null,
      })),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setUploadColorHex("");
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.images(Array.from(files));
      const newImgs = data.urls.map((url: string, i: number) => ({
        url,
        alt: null,
        isPrimary: form.images.length === 0 && i === 0,
        sortOrder: form.images.length + i,
        colorHex: uploadColorHex || null,
      }));
      setForm((p) => ({ ...p, images: [...p.images, ...newImgs] }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const profitMargin =
    form.price && form.costPrice
      ? (((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100).toFixed(1)
      : null;

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price) { toast.error("Price is required"); return; }
    if (!form.categoryId) { toast.error("Please select a category"); return; }

    const tagsArray = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      cost: form.cost ? Number(form.cost) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      sku: form.sku,
      categoryId: form.categoryId,
      brand: form.brand || null,
      material: form.material || null,
      tags: tagsArray,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isNewArrival: form.isNewArrival,
      isBestSeller: form.isBestSeller,
      images: form.images.filter((img: any) => img.url),
      variants: form.variants.map((v) => ({
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        stock: v.stock,
        price: v.price,
      })),
    };
    saveMutation.mutate(payload);
  };

  const columns = [
    {
      key: "image", label: "", className: "w-14 admin-table-cell",
      render: (p: any) => (
        <AdminTableThumb
          items={p.images?.[0]?.url ? [{ image: p.images[0].url, name: p.name }] : []}
          alt={p.name}
        />
      ),
    },
    {
      key: "name", label: "Product",
      render: (p: any) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--admin-fg)" }}>{p.name}</p>
          <p className="text-xs admin-muted">{p.sku}</p>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (p: any) => p.category?.name || "—" },
    {
      key: "price", label: "Price",
      render: (p: any) => (
        <div>
          <p className="font-medium" style={{ color: "var(--admin-fg)" }}>{formatEGP(Number(p.price))}</p>
          {p.comparePrice && (
            <p className="text-xs admin-muted line-through">{formatEGP(Number(p.comparePrice))}</p>
          )}
          {p.costPrice && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Margin: {(((Number(p.price) - Number(p.costPrice)) / Number(p.price)) * 100).toFixed(0)}%
            </p>
          )}
        </div>
      ),
    },
    {
      key: "flags", label: "Flags",
      render: (p: any) => (
        <div className="flex gap-1 flex-wrap">
          {p.isNewArrival && <span className="admin-badge-bw">New</span>}
          {p.isBestSeller && <span className="admin-badge-bw">Best</span>}
          {p.isFeatured && <span className="admin-badge-bw">Featured</span>}
        </div>
      ),
    },
    {
      key: "isActive", label: "Status",
      render: (p: any) => <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions", label: "", className: "w-24",
      render: (p: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button type="button" onClick={() => openEdit(p)} className="admin-icon-btn">
            <Edit size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }}
            className="admin-icon-btn"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle={`${pagination?.total || 0} products`}
        action={
          <button onClick={openNew} className="btn-primary text-xs flex items-center gap-2">
            <Plus size={14} /> Add Product
          </button>
        }
      />
      <div className="mb-5">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
      </div>
      <DataTable columns={columns} data={products} loading={isLoading} emptyText="No products found" />
      <Pagination page={page} pages={pagination?.pages || 1} onChange={setPage} />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Product" : "New Product"} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3} className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white resize-none" />
            </div>

            {[
              { key: "price", label: "Selling Price *" },
              { key: "comparePrice", label: "Compare Price (before discount)" },
              { key: "costPrice", label: "Cost Price (your purchase price)" },
              { key: "cost", label: "Cost (legacy)" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">{label}</label>
                <input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  type="number"
                  className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
              </div>
            ))}

            {profitMargin && (
              <div className="col-span-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <p className="text-sm text-green-700 dark:text-green-400">
                  💰 Profit Margin: <strong>{profitMargin}%</strong>
                  {" "}({formatEGP(Number(form.price) - Number(form.costPrice))} profit per item)
                </p>
              </div>
            )}

            {[
              { key: "sku", label: "SKU *" },
              { key: "brand", label: "Brand" },
              { key: "material", label: "Material" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">{label}</label>
                <input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  type="text"
                  className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
              </div>
            ))}

            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Category *</label>
              <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-white dark:bg-brand-950">
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="summer, casual, cotton"
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { key: "isActive", label: "Active" },
              { key: "isFeatured", label: "Featured" },
              { key: "isNewArrival", label: "New Arrival" },
              { key: "isBestSeller", label: "Best Seller" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-brand-700 dark:text-brand-300">
                <input type="checkbox" checked={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-brand-900 dark:accent-white" />
                {label}
              </label>
            ))}
          </div>

          <ProductVariantBuilder
            key={editing?.id ?? "new-product"}
            variants={form.variants}
            onChange={(variants) => setForm((p) => ({ ...p, variants }))}
          />

          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-2">Images</label>

            {variantColors.length > 0 && (
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-brand-500">Link uploaded images to color:</span>
                <button type="button" onClick={() => setUploadColorHex("")}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${
                    !uploadColorHex ? "border-brand-900 bg-brand-900 text-white" : "border-brand-300 text-brand-600 hover:border-brand-900"
                  }`}>
                  No color
                </button>
                {variantColors.map((c) => (
                  <button key={c.colorHex} type="button" onClick={() => setUploadColorHex(c.colorHex)}
                    className={`flex items-center gap-1.5 px-2 py-1 text-xs border rounded transition-colors ${
                      uploadColorHex === c.colorHex ? "border-brand-900 dark:border-white" : "border-brand-300 hover:border-brand-900"
                    }`}>
                    <span className="w-3 h-3 rounded-full inline-block border border-brand-200" style={{ backgroundColor: c.colorHex }} />
                    {c.color}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {form.images.map((img: any, i: number) => (
                <div key={i} className="relative w-16 h-20 group">
                  <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                  {img.colorHex && (
                    <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full border border-white"
                      style={{ backgroundColor: img.colorHex }} title={`Color: ${img.colorHex}`} />
                  )}
                  <button onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_: any, idx: number) => idx !== i) }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                  <button
                    onClick={() => setForm((p) => ({ ...p, images: p.images.map((im: any, idx: number) => ({ ...im, isPrimary: idx === i })) }))}
                    className={`absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 transition-colors ${
                      img.isPrimary ? "bg-brand-900 text-white" : "bg-white/80 text-brand-700 opacity-0 group-hover:opacity-100"
                    }`}>
                    {img.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                </div>
              ))}
              <label className={`w-16 h-20 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                uploadColorHex ? "border-brand-900 dark:border-white" : "border-brand-300 dark:border-brand-600 hover:border-brand-900"
              } ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadColorHex && <span className="w-4 h-4 rounded-full mb-1 border border-brand-300" style={{ backgroundColor: uploadColorHex }} />}
                <Upload size={16} className="text-brand-400 mb-1" />
                <span className="text-[10px] text-brand-400 text-center px-1">
                  {uploading ? "Uploading…" : uploadColorHex ? "Upload for color" : "Upload"}
                </span>
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--admin-border)" }}>
            <button type="button" onClick={closeModal} className="admin-btn-outline text-xs">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={saveMutation.isPending} className="admin-btn-primary text-xs">
              {saveMutation.isPending ? "Saving…" : editing ? "Update Product" : "Create Product"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
