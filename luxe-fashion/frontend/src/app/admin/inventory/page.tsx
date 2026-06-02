'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminPageHeader, DataTable } from '@/components/admin/AdminUI';
import { Save, AlertTriangle } from 'lucide-react';
import { AdminTableThumb } from '@/components/admin/AdminTableThumb';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => adminApi.getInventory(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adminApi.updateStock(id, stock),
    onSuccess: () => { toast.success('Stock updated'); qc.invalidateQueries({ queryKey: ['admin-inventory'] }); },
    onError: () => toast.error('Failed to update stock'),
  });

  const variants = data?.data || [];

  const handleSave = (variantId: string) => {
    const newStock = Number(stockEdits[variantId]);
    if (isNaN(newStock) || newStock < 0) { toast.error('Invalid stock value'); return; }
    updateMutation.mutate({ id: variantId, stock: newStock });
    setStockEdits(p => { const n = { ...p }; delete n[variantId]; return n; });
  };

  const columns = [
    {
      key: 'thumb',
      label: '',
      className: 'w-14 admin-table-cell',
      render: (v: any) => (
        <AdminTableThumb
          items={
            v.product?.images?.[0]?.url
              ? [{ image: v.product.images[0].url, name: v.product?.name }]
              : []
          }
          alt={v.product?.name}
        />
      ),
    },
    { key: 'product', label: 'Product', render: (v: any) => (
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-fg)' }}>{v.product?.name}</p>
        <p className="text-xs admin-muted font-mono">{v.product?.sku}</p>
      </div>
    )},
    { key: 'variant', label: 'Variant', render: (v: any) => (
      <div className="flex gap-2 text-xs">
        {v.size && <span className="admin-badge-bw">{v.size}</span>}
        {v.color && <span className="admin-badge-bw">{v.color}</span>}
      </div>
    )},
    { key: 'stock', label: 'Current Stock', render: (v: any) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--admin-fg)' }}>
          {v.stock}
        </span>
        {v.stock === 0 && <span className="admin-badge-bw">Out of Stock</span>}
        {v.stock > 0 && v.stock <= 5 && (
          <AlertTriangle size={12} strokeWidth={1.5} style={{ color: 'var(--admin-fg)' }} aria-hidden />
        )}
      </div>
    )},
    { key: 'update', label: 'Update Stock', render: (v: any) => (
      <div className="flex items-center gap-2">
        <input
          type="number" min="0"
          value={stockEdits[v.id] ?? v.stock}
          onChange={e => setStockEdits(p => ({ ...p, [v.id]: e.target.value }))}
          className="admin-input w-20 text-sm py-1.5"
        />
        {stockEdits[v.id] !== undefined && String(Number(stockEdits[v.id])) !== String(v.stock) && (
          <button
            type="button"
            title="Save stock"
            onClick={() => handleSave(v.id)}
            disabled={updateMutation.isPending}
            className="admin-icon-btn-filled"
          >
            <Save size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
    )},
  ];

  const outOfStock = variants.filter((v: any) => v.stock === 0).length;
  const lowStock = variants.filter((v: any) => v.stock > 0 && v.stock <= 5).length;

  return (
    <div>
      <AdminPageHeader title="Inventory" subtitle="Manage stock levels" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="admin-card p-4">
          <p className="text-xs tracking-widest uppercase admin-muted mb-1">Total Low-Stock SKUs</p>
          <p className="text-3xl font-light" style={{ color: 'var(--admin-fg)' }}>{variants.length}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs tracking-widest uppercase admin-muted mb-1">Out of Stock</p>
          <p className="text-3xl font-light" style={{ color: 'var(--admin-fg)' }}>{outOfStock}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-xs tracking-widest uppercase admin-muted mb-1">Low Stock (≤5)</p>
          <p className="text-3xl font-light" style={{ color: 'var(--admin-fg)' }}>{lowStock}</p>
        </div>
      </div>

      {variants.length === 0 && !isLoading ? (
        <div className="admin-card p-16 text-center">
          <p className="font-medium" style={{ color: 'var(--admin-fg)' }}>All inventory levels are healthy</p>
          <p className="text-sm admin-muted mt-1">No variants with 10 or fewer items</p>
        </div>
      ) : (
        <DataTable columns={columns} data={variants} loading={isLoading} emptyText="No low-stock items" />
      )}
    </div>
  );
}
