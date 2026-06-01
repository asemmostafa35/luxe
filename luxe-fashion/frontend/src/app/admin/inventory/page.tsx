'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminPageHeader, DataTable } from '@/components/admin/AdminUI';
import { Save, AlertTriangle } from 'lucide-react';
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
    { key: 'product', label: 'Product', render: (v: any) => (
      <div>
        <p className="text-sm font-medium text-brand-900 dark:text-white">{v.product?.name}</p>
        <p className="text-xs text-brand-500 font-mono">{v.product?.sku}</p>
      </div>
    )},
    { key: 'variant', label: 'Variant', render: (v: any) => (
      <div className="flex gap-2 text-xs text-brand-600 dark:text-brand-400">
        {v.size && <span className="border border-brand-200 dark:border-brand-700 px-1.5 py-0.5">{v.size}</span>}
        {v.color && <span className="border border-brand-200 dark:border-brand-700 px-1.5 py-0.5">{v.color}</span>}
      </div>
    )},
    { key: 'stock', label: 'Current Stock', render: (v: any) => (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${v.stock === 0 ? 'text-red-600 dark:text-red-400' : v.stock <= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
          {v.stock}
        </span>
        {v.stock === 0 && <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5">Out of Stock</span>}
        {v.stock > 0 && v.stock <= 5 && <AlertTriangle size={12} className="text-yellow-500" />}
      </div>
    )},
    { key: 'update', label: 'Update Stock', render: (v: any) => (
      <div className="flex items-center gap-2">
        <input
          type="number" min="0"
          value={stockEdits[v.id] ?? v.stock}
          onChange={e => setStockEdits(p => ({ ...p, [v.id]: e.target.value }))}
          className="w-20 border border-brand-200 dark:border-brand-700 px-2 py-1 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white"
        />
        {stockEdits[v.id] !== undefined && String(Number(stockEdits[v.id])) !== String(v.stock) && (
          <button onClick={() => handleSave(v.id)} disabled={updateMutation.isPending}
            className="p-1.5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 hover:opacity-80 transition-opacity">
            <Save size={12} />
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-4">
          <p className="text-xs tracking-widest uppercase text-brand-500 mb-1">Total Low-Stock SKUs</p>
          <p className="font-serif text-3xl font-light text-brand-900 dark:text-white">{variants.length}</p>
        </div>
        <div className="bg-white dark:bg-brand-950 border border-red-200 dark:border-red-900/30 p-4">
          <p className="text-xs tracking-widest uppercase text-red-500 mb-1">Out of Stock</p>
          <p className="font-serif text-3xl font-light text-red-600 dark:text-red-400">{outOfStock}</p>
        </div>
        <div className="bg-white dark:bg-brand-950 border border-yellow-200 dark:border-yellow-900/30 p-4">
          <p className="text-xs tracking-widest uppercase text-yellow-600 mb-1">Low Stock (≤5)</p>
          <p className="font-serif text-3xl font-light text-yellow-600 dark:text-yellow-400">{lowStock}</p>
        </div>
      </div>

      {variants.length === 0 && !isLoading ? (
        <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-16 text-center">
          <p className="text-green-600 dark:text-green-400 font-medium">✓ All inventory levels are healthy</p>
          <p className="text-sm text-brand-500 mt-1">No variants with 10 or fewer items</p>
        </div>
      ) : (
        <DataTable columns={columns} data={variants} loading={isLoading} emptyText="No low-stock items" />
      )}
    </div>
  );
}
