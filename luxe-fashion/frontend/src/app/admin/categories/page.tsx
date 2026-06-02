"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, uploadApi } from "@/lib/api";
import { AdminPageHeader, DataTable, Modal } from "@/components/admin/AdminUI";
import { AdminStatusToggle } from "@/components/admin/AdminStatusToggle";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

const EMPTY = { name: "", description: "", image: "", parentId: "", isActive: true };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: () => categoriesApi.getAllAdmin(),
  });

  const saveMutation = useMutation({
    mutationFn: (p: any) =>
      editing ? categoriesApi.update(editing.id, p) : categoriesApi.create(p),
    onSuccess: () => {
      toast.success("Category saved");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: () => toast.error("Failed to save"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.setActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? "Category activated" : "Category deactivated");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["categories-admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const cats = data?.data || [];
  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || "",
      image: c.image || "",
      parentId: c.parentId || "",
      isActive: c.isActive,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.images([files[0]]);
      setForm((p) => ({ ...p, image: data.urls[0] }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: "image",
      label: "",
      render: (c: any) => (
        <div
          className="w-10 h-10 overflow-hidden border"
          style={{ borderColor: "var(--admin-border)" }}
        >
          {c.image ? (
            <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
          ) : null}
        </div>
      ),
      className: "w-14 admin-table-cell",
    },
    {
      key: "name",
      label: "Category",
      render: (c: any) => (
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--admin-fg)" }}>
            {c.name}
          </p>
          <p className="text-xs admin-muted font-mono">{c.slug}</p>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (c: any) => c._count?.products ?? "—",
    },
    {
      key: "children",
      label: "Sub-categories",
      render: (c: any) => c.children?.length || 0,
    },
    {
      key: "isActive",
      label: "Status",
      className: "w-36",
      render: (c: any) => (
        <AdminStatusToggle
          active={c.isActive}
          disabled={toggleMutation.isPending}
          onChange={(isActive) => toggleMutation.mutate({ id: c.id, isActive })}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-24",
      render: (c: any) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            title="Edit category"
            onClick={() => openEdit(c)}
            className="admin-icon-btn"
          >
            <Edit size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="Delete category"
            onClick={() => {
              if (confirm("Delete this category?")) deleteMutation.mutate(c.id);
            }}
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
        title="Categories"
        subtitle={`${cats.length} categories`}
        action={
          <button
            type="button"
            onClick={openNew}
            className="admin-btn-primary text-xs flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Category
          </button>
        }
      />
      <DataTable columns={columns} data={cats} loading={isLoading} emptyText="No categories yet" />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit Category" : "New Category"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs tracking-widest uppercase admin-muted block mb-1.5">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="admin-input text-sm"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase admin-muted block mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="admin-input text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase admin-muted block mb-1.5">
              Parent Category
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
              className="admin-input text-sm"
            >
              <option value="">None (top-level)</option>
              {cats
                .filter((c: any) => c.id !== editing?.id)
                .map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase admin-muted block mb-1.5">
              Image
            </label>
            <div className="flex items-center gap-3">
              {form.image && (
                <img
                  src={form.image}
                  alt="category"
                  className="w-12 h-12 object-cover border"
                  style={{ borderColor: "var(--admin-border)" }}
                />
              )}
              <label
                className={`flex items-center gap-2 border border-dashed px-4 py-2.5 text-sm cursor-pointer transition-opacity ${
                  uploading ? "opacity-50 pointer-events-none" : ""
                }`}
                style={{ borderColor: "var(--admin-border)", color: "var(--admin-fg)" }}
              >
                <Upload size={14} strokeWidth={1.5} />
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </label>
            </div>
          </div>
          <AdminStatusToggle
            active={form.isActive}
            onChange={(isActive) => setForm((p) => ({ ...p, isActive }))}
          />
          <div
            className="flex justify-end gap-3 pt-2 border-t"
            style={{ borderColor: "var(--admin-border)" }}
          >
            <button type="button" onClick={closeModal} className="admin-btn-outline text-xs">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error("Name is required");
                  return;
                }
                saveMutation.mutate(form);
              }}
              disabled={saveMutation.isPending}
              className="admin-btn-primary text-xs"
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create Category"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
