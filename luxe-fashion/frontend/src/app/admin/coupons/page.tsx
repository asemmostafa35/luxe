'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Modal } from '@/components/admin/AdminUI';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
  minOrderAmount: '', maxDiscount: '', usageLimit: '', perUserLimit: '1',
  isActive: true, startsAt: '', expiresAt: '',
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: () => couponsApi.getAll() });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editing ? couponsApi.update(editing.id, payload) : couponsApi.create(payload),
    onSuccess: () => { toast.success('Coupon saved'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); closeModal(); },
    onError: () => toast.error('Failed to save coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.delete(id),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
  });

  const coupons = data?.data || [];

  const openNew = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description || '', discountType: c.discountType,
      discountValue: String(c.discountValue), minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : '',
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      perUserLimit: String(c.perUserLimit), isActive: c.isActive,
      startsAt: c.startsAt ? c.startsAt.split('T')[0] : '', expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); };

  const handleSubmit = () => {
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: Number(form.perUserLimit),
      startsAt: form.startsAt ? new Date(form.startsAt) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
    };
    saveMutation.mutate(payload);
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs tracking-widest uppercase text-brand-500 block mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white";

  const columns = [
    { key: 'code', label: 'Code', render: (c: any) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-medium text-brand-900 dark:text-white">{c.code}</span>
        <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Copied!'); }}
          className="text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
          <Copy size={12} />
        </button>
      </div>
    )},
    { key: 'discount', label: 'Discount', render: (c: any) => (
      <span className="font-medium text-brand-900 dark:text-white">
        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
      </span>
    )},
    { key: 'usage', label: 'Usage', render: (c: any) => (
      <span>{c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
    )},
    { key: 'minOrderAmount', label: 'Min Order', render: (c: any) => c.minOrderAmount ? `$${c.minOrderAmount}` : '—' },
    { key: 'expiresAt', label: 'Expires', render: (c: any) => c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never' },
    { key: 'isActive', label: 'Status', render: (c: any) => <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'actions', label: '', render: (c: any) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(c)} className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"><Edit size={14} /></button>
        <button onClick={() => { if (confirm('Delete this coupon?')) deleteMutation.mutate(c.id); }}
          className="p-1.5 text-brand-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Coupons" subtitle="Manage discount codes"
        action={<button onClick={openNew} className="btn-primary text-xs flex items-center gap-2"><Plus size={14} /> Create Coupon</button>} />

      <DataTable columns={columns} data={coupons} loading={isLoading} emptyText="No coupons yet" />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Coupon' : 'New Coupon'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code *"><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={inputCls} placeholder="SUMMER20" /></Field>
            <Field label="Discount Type">
              <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                className={`${inputCls} bg-white dark:bg-brand-950`}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </Field>
            <Field label="Discount Value *"><input value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} type="number" className={inputCls} /></Field>
            <Field label="Min Order Amount"><input value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} type="number" className={inputCls} /></Field>
            {form.discountType === 'PERCENTAGE' && (
              <Field label="Max Discount ($)"><input value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))} type="number" className={inputCls} /></Field>
            )}
            <Field label="Usage Limit"><input value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))} type="number" className={inputCls} placeholder="Unlimited" /></Field>
            <Field label="Per User Limit"><input value={form.perUserLimit} onChange={e => setForm(p => ({ ...p, perUserLimit: e.target.value }))} type="number" className={inputCls} /></Field>
            <Field label="Active">
              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-700 dark:text-brand-300">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-brand-900 dark:accent-white" />
                  Enabled
                </label>
              </div>
            </Field>
            <Field label="Start Date"><input value={form.startsAt} onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))} type="date" className={`${inputCls} bg-white dark:bg-brand-950`} /></Field>
            <Field label="Expiry Date"><input value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} type="date" className={`${inputCls} bg-white dark:bg-brand-950`} /></Field>
            <div className="col-span-2">
              <Field label="Description"><input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls} placeholder="Optional internal note" /></Field>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
            <button onClick={closeModal} className="btn-outline text-xs">Cancel</button>
            <button onClick={handleSubmit} disabled={saveMutation.isPending} className="btn-primary text-xs">
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
