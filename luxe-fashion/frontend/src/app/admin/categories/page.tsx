'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, uploadApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Modal } from '@/components/admin/AdminUI';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', image: '', parentId: '', isActive: true };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() });

  const saveMutation = useMutation({
    mutationFn: (p: any) => editing ? categoriesApi.update(editing.id, p) : categoriesApi.create(p),
    onSuccess: () => { toast.success('Category saved'); qc.invalidateQueries({ queryKey: ['categories'] }); closeModal(); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['categories'] }); },
  });

  const cats = data?.data || [];
  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, description: c.description || '', image: c.image || '', parentId: c.parentId || '', isActive: c.isActive }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.images([files[0]]);
      setForm(p => ({ ...p, image: data.urls[0] }));
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const inputCls = "w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white";

  const columns = [
    { key: 'image', label: '', render: (c: any) => (
      <div className="w-10 h-10 overflow-hidden bg-brand-100 dark:bg-brand-800">
        {c.image ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
      </div>
    ), className: 'w-14' },
    { key: 'name', label: 'Category', render: (c: any) => (
      <div>
        <p className="font-medium text-sm text-brand-900 dark:text-white">{c.name}</p>
        <p className="text-xs text-brand-500 font-mono">{c.slug}</p>
      </div>
    )},
    { key: 'products', label: 'Products', render: (c: any) => c._count?.products ?? '—' },
    { key: 'children', label: 'Sub-categories', render: (c: any) => c.children?.length || 0 },
    { key: 'isActive', label: 'Status', render: (c: any) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (c: any) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(c)} className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"><Edit size={14} /></button>
        <button onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(c.id); }}
          className="p-1.5 text-brand-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Categories" subtitle={`${cats.length} categories`}
        action={<button onClick={openNew} className="btn-primary text-xs flex items-center gap-2"><Plus size={14} />Add Category</button>} />
      <DataTable columns={columns} data={cats} loading={isLoading} emptyText="No categories yet" />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Category' : 'New Category'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Parent Category</label>
            <select value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}
              className={`${inputCls} bg-white dark:bg-brand-950`}>
              <option value="">None (top-level)</option>
              {cats.filter((c: any) => c.id !== editing?.id).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Image</label>
            <div className="flex items-center gap-3">
              {form.image && <img src={form.image} alt="category" className="w-12 h-12 object-cover border border-brand-200 dark:border-brand-700" />}
              <label className={`flex items-center gap-2 border border-dashed border-brand-300 dark:border-brand-600 px-4 py-2.5 text-sm cursor-pointer hover:border-brand-900 dark:hover:border-white transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={14} className="text-brand-400" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files)} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="catActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-900 dark:accent-white" />
            <label htmlFor="catActive" className="text-sm text-brand-700 dark:text-brand-300 cursor-pointer">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
            <button onClick={closeModal} className="btn-outline text-xs">Cancel</button>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary text-xs">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Category'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
