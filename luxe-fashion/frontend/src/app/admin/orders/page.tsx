'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Pagination, Modal, SearchInput } from '@/components/admin/AdminUI';
import { Eye, Truck } from 'lucide-react';
import { AdminTableThumb } from '@/components/admin/AdminTableThumb';
import toast from 'react-hot-toast';
import { formatEGP } from '@/lib/currency';
import { useAuth } from '@/components/providers/AuthProvider';

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'];

export default function AdminOrdersPage() {
  const { hasPermission } = useAuth();
  const canWriteOrders = hasPermission('orders:write');
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
    {
      key: 'thumb',
      label: '',
      className: 'w-14 admin-table-cell',
      render: (r: any) => (
        <AdminTableThumb items={r.items} alt={r.items?.[0]?.name} />
      ),
    },
    { key: 'orderNumber', label: 'Order #', render: (r: any) => (
      <span className="font-mono text-xs font-medium" style={{ color: 'var(--admin-fg)' }}>{r.orderNumber}</span>
    )},
    { key: 'customer', label: 'Customer', render: (r: any) => (
      <div>
        <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
          {r.user ? `${r.user.firstName} ${r.user.lastName}` : r.guestName || '—'}
        </p>
        <p className="text-xs admin-muted">{r.user?.email || r.guestEmail}</p>
      </div>
    )},
    { key: 'items', label: 'Items', render: (r: any) => (
      <span>{r.items?.length || 0} item{r.items?.length !== 1 ? 's' : ''}</span>
    )},
    { key: 'total', label: 'Total', render: (r: any) => (
      <span className="font-medium" style={{ color: 'var(--admin-fg)' }}>{formatEGP(Number(r.total))}</span>
    )},
    { key: 'paymentMethod', label: 'Payment', render: (r: any) => (
      <span className="text-xs">{r.paymentMethod?.replace(/_/g, ' ')}</span>
    )},
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r: any) => (
      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', className: 'w-24', render: (r: any) => (
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          title="View order"
          onClick={() => { setSelectedOrder(r); setUpdatingStatus(false); setStatusForm({ status: r.status, note: '', trackingNumber: r.trackingNumber || '', shippingCarrier: r.shippingCarrier || '' }); }}
          className="admin-icon-btn"
        >
          <Eye size={14} strokeWidth={1.5} />
        </button>
        {canWriteOrders && (
        <button
          type="button"
          title="Update status"
          onClick={() => { setSelectedOrder(r); setUpdatingStatus(true); setStatusForm({ status: r.status, note: '', trackingNumber: r.trackingNumber || '', shippingCarrier: r.shippingCarrier || '' }); }}
          className="admin-icon-btn"
        >
          <Truck size={14} strokeWidth={1.5} />
        </button>
        )}
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
          className="admin-input w-auto text-sm py-2">
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
              <div><p className="admin-muted text-xs mb-1 uppercase tracking-wider">Customer</p>
                <p className="font-medium" style={{ color: 'var(--admin-fg)' }}>
                  {selectedOrder.user ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` : selectedOrder.guestName}
                </p>
                <p className="admin-muted text-xs">{selectedOrder.user?.email || selectedOrder.guestEmail}</p>
              </div>
              <div><p className="admin-muted text-xs mb-1 uppercase tracking-wider">Total</p>
                <p className="font-medium text-lg" style={{ color: 'var(--admin-fg)' }}>{formatEGP(Number(selectedOrder.total))}</p>
              </div>
              <div><p className="admin-muted text-xs mb-1 uppercase tracking-wider">Payment</p>
                <p style={{ color: 'var(--admin-fg)' }}>{selectedOrder.paymentMethod?.replace(/_/g,' ')}</p>
                <StatusBadge status={selectedOrder.paymentStatus || 'PENDING'} />
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs tracking-widest uppercase admin-muted mb-3">Items</p>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--admin-border)' }}>
                    <AdminTableThumb items={[{ image: item.image, name: item.name }]} alt={item.name} />
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>{item.name}</p>
                      {(item.size || item.color) && <p className="text-xs admin-muted">{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
                    </div>
                    <p className="text-sm admin-muted">×{item.quantity}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--admin-fg)' }}>{formatEGP(Number(item.total))}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            {selectedOrder.address && (
              <div>
                <p className="text-xs tracking-widest uppercase admin-muted mb-2">Ship To</p>
                <p className="text-sm" style={{ color: 'var(--admin-fg)' }}>
                  {selectedOrder.address.firstName} {selectedOrder.address.lastName}<br />
                  {selectedOrder.address.street}<br />
                  {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}<br />
                  {selectedOrder.address.country}
                </p>
              </div>
            )}

            {canWriteOrders && (
            <div className="border-t pt-4" style={{ borderColor: 'var(--admin-border)' }}>
              <p className="text-xs tracking-widest uppercase admin-muted mb-3">Update Status</p>
              <div className="space-y-3">
                <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
                  className="admin-input text-sm">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {statusForm.status === 'SHIPPED' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input value={statusForm.trackingNumber} onChange={e => setStatusForm(p => ({ ...p, trackingNumber: e.target.value }))}
                      placeholder="Tracking Number" className="admin-input text-sm" />
                    <input value={statusForm.shippingCarrier} onChange={e => setStatusForm(p => ({ ...p, shippingCarrier: e.target.value }))}
                      placeholder="Carrier (e.g. FedEx)" className="admin-input text-sm" />
                  </div>
                )}
                <textarea value={statusForm.note} onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Note (optional)..." rows={2}
                  className="admin-input text-sm resize-none" />
                <button
                  onClick={() => updateMutation.mutate({ id: selectedOrder.id, data: statusForm })}
                  disabled={updateMutation.isPending}
                  className="admin-btn-primary text-xs w-full sm:w-auto">
                  {updateMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
