'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Pagination, Modal, SearchInput } from '@/components/admin/AdminUI';
import { Eye, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'];

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', trackingNumber: '', shippingCarrier: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search, statusFilter],
    queryFn: () => ordersApi.getAll({ page, limit: 20, search, status: statusFilter }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersApi.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUpdatingStatus(false);
      setSelectedOrder(null);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination;

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (r: any) => (
      <span className="font-mono text-xs font-medium text-brand-900 dark:text-white">{r.orderNumber}</span>
    )},
    { key: 'customer', label: 'Customer', render: (r: any) => (
      <div>
        <p className="text-sm text-brand-900 dark:text-white">
          {r.user ? `${r.user.firstName} ${r.user.lastName}` : r.guestName || '—'}
        </p>
        <p className="text-xs text-brand-500">{r.user?.email || r.guestEmail}</p>
      </div>
    )},
    { key: 'items', label: 'Items', render: (r: any) => (
      <span>{r.items?.length || 0} item{r.items?.length !== 1 ? 's' : ''}</span>
    )},
    { key: 'total', label: 'Total', render: (r: any) => (
      <span className="font-medium text-brand-900 dark:text-white">${Number(r.total).toFixed(2)}</span>
    )},
    { key: 'paymentMethod', label: 'Payment', render: (r: any) => (
      <span className="text-xs">{r.paymentMethod?.replace(/_/g, ' ')}</span>
    )},
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r: any) => (
      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelectedOrder(r); setStatusForm({ status: r.status, note: '', trackingNumber: r.trackingNumber || '', shippingCarrier: r.shippingCarrier || '' }); }}
          className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
          <Eye size={14} />
        </button>
        <button onClick={() => { setSelectedOrder(r); setUpdatingStatus(true); setStatusForm({ status: r.status, note: '', trackingNumber: r.trackingNumber || '', shippingCarrier: r.shippingCarrier || '' }); }}
          className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors">
          <Truck size={14} />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle={`${pagination?.total || 0} total orders`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by order # or email..." />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-white dark:bg-brand-950 text-brand-700 dark:text-brand-300 focus:outline-none focus:border-brand-900 dark:focus:border-white">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={orders} loading={isLoading} emptyText="No orders found" />
      <Pagination page={page} pages={pagination?.pages || 1} onChange={setPage} />

      {/* Order detail / status update modal */}
      <Modal open={!!selectedOrder} onClose={() => { setSelectedOrder(null); setUpdatingStatus(false); }}
        title={updatingStatus ? `Update Order ${selectedOrder?.orderNumber}` : `Order ${selectedOrder?.orderNumber}`}
        size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            {/* Order info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-brand-500 text-xs mb-1">Customer</p>
                <p className="text-brand-900 dark:text-white font-medium">
                  {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : selectedOrder.guestName}
                </p>
                <p className="text-brand-500 text-xs">{selectedOrder.user?.email || selectedOrder.guestEmail}</p>
              </div>
              <div><p className="text-brand-500 text-xs mb-1">Total</p>
                <p className="text-brand-900 dark:text-white font-medium text-lg">${Number(selectedOrder.total).toFixed(2)}</p>
              </div>
              <div><p className="text-brand-500 text-xs mb-1">Payment</p>
                <p className="text-brand-900 dark:text-white">{selectedOrder.paymentMethod?.replace(/_/g,' ')}</p>
                <StatusBadge status={selectedOrder.paymentStatus || 'PENDING'} />
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs tracking-widest uppercase text-brand-500 mb-3">Items</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-brand-50 dark:border-brand-900">
                    <div className="w-10 h-12 bg-brand-100 dark:bg-brand-800 flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-brand-900 dark:text-white">{item.name}</p>
                      {(item.size || item.color) && <p className="text-xs text-brand-500">{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
                    </div>
                    <p className="text-sm text-brand-500">×{item.quantity}</p>
                    <p className="text-sm font-medium text-brand-900 dark:text-white">${Number(item.total).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            {selectedOrder.address && (
              <div>
                <p className="text-xs tracking-widest uppercase text-brand-500 mb-2">Ship To</p>
                <p className="text-sm text-brand-700 dark:text-brand-300">
                  {selectedOrder.address.firstName} {selectedOrder.address.lastName}<br />
                  {selectedOrder.address.street}<br />
                  {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}<br />
                  {selectedOrder.address.country}
                </p>
              </div>
            )}

            {/* Status update form */}
            <div className="border-t border-brand-100 dark:border-brand-800 pt-4">
              <p className="text-xs tracking-widest uppercase text-brand-500 mb-3">Update Status</p>
              <div className="space-y-3">
                <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-white dark:bg-brand-950 focus:outline-none focus:border-brand-900 dark:focus:border-white">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {statusForm.status === 'SHIPPED' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input value={statusForm.trackingNumber} onChange={e => setStatusForm(p => ({ ...p, trackingNumber: e.target.value }))}
                      placeholder="Tracking Number" className="border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
                    <input value={statusForm.shippingCarrier} onChange={e => setStatusForm(p => ({ ...p, shippingCarrier: e.target.value }))}
                      placeholder="Carrier (e.g. FedEx)" className="border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white" />
                  </div>
                )}
                <textarea value={statusForm.note} onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Note (optional)..." rows={2}
                  className="w-full border border-brand-200 dark:border-brand-700 px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white resize-none" />
                <button
                  onClick={() => updateMutation.mutate({ id: selectedOrder.id, data: statusForm })}
                  disabled={updateMutation.isPending}
                  className="btn-primary text-xs w-full sm:w-auto">
                  {updateMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
