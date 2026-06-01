'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bannersApi, uploadApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Modal } from '@/components/admin/AdminUI';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { title: '', subtitle: '', image: '', link: '', buttonText: '', position: 'hero', isActive: true, sortOrder: 0 };

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['banners-admin'], queryFn: () => bannersApi.getAll() });

  const saveMutation = useMutation({
    mutationFn: (p: any) => editing ? bannersApi.update(editing.id, p) : bannersApi.create(p),
    onSuccess: () => { toast.success('Banner saved'); qc.invalidateQueries({ queryKey: ['banners-admin'] }); closeModal(); },
    onError: () => toast.error('Failed to save'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersApi.delete(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['banners-admin'] }); },
  });

  const banners = data?.data || [];
  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || '', image: b.image, link: b.link || '', buttonText: b.buttonText || '', position: b.position, isActive: b.isActive, sortOrder: b.sortOrder });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); };

  const handleUpload = async (files: FileList | null) => {
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
    { key: 'image', label: 'Preview', render: (b: any) => (
      <div className="w-20 h-10 overflow-hidden bg-brand-100 dark:bg-brand-800">
        {b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}
      </div>
    )},
    { key: 'title', label: 'Title', render: (b: any) => (
      <div>
        <p className="font-medium text-sm text-brand-900 dark:text-white">{b.title}</p>
        {b.subtitle && <p className="text-xs text-brand-500">{b.subtitle}</p>}
      </div>
    )},
    { key: 'position', label: 'Position', render: (b: any) => <span className="text-xs capitalize">{b.position}</span> },
    { key: 'sortOrder', label: 'Order' },
    { key: 'isActive', label: 'Status', render: (b: any) => <StatusBadge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (b: any) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(b)} className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"><Edit size={14} /></button>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(b.id); }} className="p-1.5 text-brand-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Banners" subtitle="Manage homepage and promotional banners"
        action={<button onClick={openNew} className="btn-primary text-xs flex items-center gap-2"><Plus size={14} />Add Banner</button>} />
      <DataTable columns={columns} data={banners} loading={isLoading} emptyText="No banners yet" />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Banner' : 'New Banner'} size="md">
        <div className="space-y-4">
          {[
            { key: 'title', label: 'Title *' },
            { key: 'subtitle', label: 'Subtitle' },
            { key: 'link', label: 'Link URL' },
            { key: 'buttonText', label: 'Button Text' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Position</label>
              <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                className={`${inputCls} bg-white dark:bg-brand-950`}>
                {['hero','promotional','sidebar','footer'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">Image *</label>
            <div className="flex items-center gap-3">
              {form.image && <img src={form.image} alt="banner" className="w-20 h-10 object-cover border border-brand-200 dark:border-brand-700" />}
              <label className={`flex items-center gap-2 border border-dashed border-brand-300 dark:border-brand-600 px-4 py-2 text-sm cursor-pointer hover:border-brand-900 dark:hover:border-white transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={14} />{uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="bannerActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-900 dark:accent-white" />
            <label htmlFor="bannerActive" className="text-sm text-brand-700 dark:text-brand-300 cursor-pointer">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
            <button onClick={closeModal} className="btn-outline text-xs">Cancel</button>
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary text-xs">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Banner'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
