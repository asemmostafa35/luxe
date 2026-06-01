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
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  comparePrice: "",
  cost: "",
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
  variants: [] as any[],
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [variantRow, setVariantRow] = useState({
    size: "",
    color: "",
    colorHex: "",
    stock: "",
    price: "",
  });

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
      editing
        ? productsApi.update(editing.id, payload)
        : productsApi.create(payload),
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
      // أضف هذا السطر فقط إذا لم يختفِ المنتج بعد الـ Refresh العادي
      window.location.reload();
    },
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      cost: p.cost ? String(p.cost) : "",
      sku: p.sku || "",
      categoryId: p.categoryId,
      brand: p.brand || "",
      material: p.material || "",
      // ✅ tags comes back as string[] from the DB; join for the text input
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      // ✅ Keep existing image objects so the user can see them in the form.
      //    The backend update handler intentionally ignores these (no-op for
      //    existing images) so they're safe to carry in state for display only.
      images: p.images || [],
      variants: p.variants || [],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.images(Array.from(files));
      // ✅ data.urls now contains absolute URLs (http://localhost:5000/uploads/...)
      //    after the cloudinaryService fix, so they resolve correctly in both
      //    the admin <img> preview and the storefront next/image component.
      const newImgs = data.urls.map((url: string, i: number) => ({
        url,
        alt: null,
        isPrimary: form.images.length === 0 && i === 0,
        sortOrder: form.images.length + i,
      }));
      setForm((p) => ({ ...p, images: [...p.images, ...newImgs] }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    if (!variantRow.stock) return;
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        {
          ...variantRow,
          stock: Number(variantRow.stock),
          price: variantRow.price ? Number(variantRow.price) : null,
        },
      ],
    }));
    setVariantRow({ size: "", color: "", colorHex: "", stock: "", price: "" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price) {
      toast.error("Price is required");
      return;
    }
    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    // ✅ FIX: Convert tags string → proper string[] before sending.
    //    Prisma schema: tags String[] — a scalar string causes a type error → 500.
    const tagsArray = form.tags
      ? form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (editing) {
      // ── UPDATE ──────────────────────────────────────────────────────────────
      // ✅ FIX: Do NOT send images or variants on update.
      //    Passing raw image/variant objects to Prisma update throws:
      //    "Unknown arg in data.images" because Prisma expects a nested
      //    write operation ({ create/upsert/... }), not a plain array.
      //    Images already in the DB stay as-is; new uploads are handled
      //    separately via the upload endpoint.
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        cost: form.cost ? Number(form.cost) : null,
        sku: form.sku,
        categoryId: form.categoryId,
        brand: form.brand || null,
        material: form.material || null,
        tags: tagsArray,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        isBestSeller: form.isBestSeller,
        // images and variants intentionally omitted for update
      };
      saveMutation.mutate(payload);
    } else {
      // ── CREATE ──────────────────────────────────────────────────────────────
      // ✅ FIX: Only include images/variants that have been explicitly added in
      //    this session (form.images may contain objects from an edit that was
      //    cancelled; filter to ones with a real URL).
      //    The backend sanitiseImageForCreate() will strip any extra fields.
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        cost: form.cost ? Number(form.cost) : null,
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
        variants: form.variants,
      };
      saveMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: "image",
      label: "",
      render: (p: any) => (
        <div className="w-10 h-12 overflow-hidden bg-brand-100 dark:bg-brand-800 flex-shrink-0">
          {/* ✅ Using plain <img> here (not next/image) because the admin table
               is an internal dashboard — no CLS budget concerns, and it avoids
               the remotePatterns restriction for any URL format. */}
          {p.images?.[0]?.url && (
            <img
              src={p.images[0].url}
              alt={p.images[0].alt || p.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ),
      className: "w-14",
    },
    {
      key: "name",
      label: "Product",
      render: (p: any) => (
        <div>
          <p className="text-sm font-medium text-brand-900 dark:text-white">
            {p.name}
          </p>
          <p className="text-xs text-brand-500">{p.sku}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (p: any) => p.category?.name || "—",
    },
    {
      key: "price",
      label: "Price",
      render: (p: any) => (
        <div>
          <p className="font-medium text-brand-900 dark:text-white">
            ${Number(p.price).toFixed(2)}
          </p>
          {p.comparePrice && (
            <p className="text-xs text-brand-400 line-through">
              ${Number(p.comparePrice).toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "flags",
      label: "Flags",
      render: (p: any) => (
        <div className="flex gap-1 flex-wrap">
          {p.isNewArrival && (
            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5">
              New
            </span>
          )}
          {p.isBestSeller && (
            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 px-1.5 py-0.5">
              Best
            </span>
          )}
          {p.isFeatured && (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-1.5 py-0.5">
              Featured
            </span>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (p: any) => (
        <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (p: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(p)}
            className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this product?")) deleteMutation.mutate(p.id);
            }}
            className="p-1.5 text-brand-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
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
          <button
            onClick={openNew}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Plus size={14} /> Add Product
          </button>
        }
      />

      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search products..."
        />
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        emptyText="No products found"
      />
      <Pagination
        page={page}
        pages={pagination?.pages || 1}
        onChange={setPage}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Product" : "New Product"}
        size="xl"
      >
        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">
                Product Name *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white resize-none"
              />
            </div>
            {[
              { key: "price", label: "Price *" },
              { key: "comparePrice", label: "Compare Price" },
              { key: "cost", label: "Cost" },
              { key: "sku", label: "SKU *" },
              { key: "brand", label: "Brand" },
              { key: "material", label: "Material" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">
                  {label}
                </label>
                <input
                  value={(form as any)[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  type={
                    ["price", "comparePrice", "cost"].includes(key)
                      ? "number"
                      : "text"
                  }
                  className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white"
                />
              </div>
            ))}
            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">
                Category *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, categoryId: e.target.value }))
                }
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-white dark:bg-brand-950"
              >
                <option value="">Select category</option>
                {categories.length > 0 ? (
                  categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No categories found — run seed script
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">
                Tags (comma separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tags: e.target.value }))
                }
                placeholder="summer, casual, cotton"
                className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: "isActive", label: "Active" },
              { key: "isFeatured", label: "Featured" },
              { key: "isNewArrival", label: "New Arrival" },
              { key: "isBestSeller", label: "Best Seller" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer text-sm text-brand-700 dark:text-brand-300"
              >
                <input
                  type="checkbox"
                  checked={(form as any)[key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-brand-900 dark:accent-white"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-2">
              Images
              {editing && (
                <span className="ml-2 normal-case font-normal text-brand-400">
                  (existing images shown for reference — upload new ones to add
                  more)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.images.map((img: any, i: number) => (
                <div key={i} className="relative w-16 h-20 group">
                  {/* ✅ Plain <img> in the admin form preview — avoids next/image
                       domain restrictions for any image source. */}
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Gracefully hide broken images instead of showing a broken icon
                      (e.target as HTMLImageElement).style.opacity = "0.2";
                    }}
                  />
                  {!editing && (
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          images: p.images.filter(
                            (_: any, idx: number) => idx !== i,
                          ),
                        }))
                      }
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        images: p.images.map((im: any, idx: number) => ({
                          ...im,
                          isPrimary: idx === i,
                        })),
                      }))
                    }
                    className={`absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 transition-colors ${
                      img.isPrimary
                        ? "bg-brand-900 text-white"
                        : "bg-white/80 text-brand-700 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {img.isPrimary ? "Primary" : "Set Primary"}
                  </button>
                </div>
              ))}
              <label
                className={`w-16 h-20 border-2 border-dashed border-brand-300 dark:border-brand-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-900 dark:hover:border-white transition-colors ${
                  uploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Upload size={16} className="text-brand-400 mb-1" />
                <span className="text-[10px] text-brand-400">
                  {uploading ? "Uploading…" : "Upload"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </label>
            </div>
          </div>

          {/* Variants */}
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-2">
              Variants (Size / Color / Stock)
            </label>
            <div className="space-y-2 mb-3">
              {form.variants.map((v: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs bg-brand-50 dark:bg-brand-900 px-3 py-2"
                >
                  {v.size && (
                    <span className="font-medium">Size: {v.size}</span>
                  )}
                  {v.color && (
                    <span className="font-medium">Color: {v.color}</span>
                  )}
                  <span>Stock: {v.stock}</span>
                  {v.price && <span>Price: ${v.price}</span>}
                  <button
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        variants: p.variants.filter(
                          (_: any, idx: number) => idx !== i,
                        ),
                      }))
                    }
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "size", placeholder: "Size (S/M/L)" },
                { key: "color", placeholder: "Color name" },
                { key: "colorHex", placeholder: "#hex" },
                { key: "stock", placeholder: "Stock *", type: "number" },
                { key: "price", placeholder: "Price (opt)", type: "number" },
              ].map(({ key, placeholder, type = "text" }) => (
                <input
                  key={key}
                  value={(variantRow as any)[key]}
                  type={type}
                  onChange={(e) =>
                    setVariantRow((p) => ({ ...p, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="border border-brand-200 dark:border-brand-700 px-2 py-1.5 text-xs bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="mt-2 text-xs border border-brand-200 dark:border-brand-700 px-3 py-1.5 hover:border-brand-900 dark:hover:border-white transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Add Variant
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
            <button onClick={closeModal} className="btn-outline text-xs">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="btn-primary text-xs"
            >
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
