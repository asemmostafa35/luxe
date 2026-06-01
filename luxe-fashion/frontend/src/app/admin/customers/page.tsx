'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Pagination, Modal, SearchInput } from '@/components/admin/AdminUI';
import { Eye, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => { toast.success('Customer updated'); qc.invalidateQueries({ queryKey: ['admin-customers'] }); setSelected(null); },
    onError: () => toast.error('Failed to update'),
  });

  const customers = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  const columns = [
    { key: 'name', label: 'Customer', render: (u: any) => (
      <div>
        <p className="text-sm font-medium text-brand-900 dark:text-white">{u.firstName} {u.lastName}</p>
        <p className="text-xs text-brand-500">{u.email}</p>
      </div>
    )},
    { key: 'role', label: 'Role', render: (u: any) => (
      <span className="text-xs font-medium text-brand-700 dark:text-brand-300">{u.role}</span>
    )},
    { key: 'isEmailVerified', label: 'Verified', render: (u: any) => (
      <StatusBadge status={u.isEmailVerified ? 'ACTIVE' : 'INACTIVE'} />
    )},
    { key: 'isActive', label: 'Status', render: (u: any) => (
      <StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
    )},
    { key: 'orders', label: 'Orders', render: (u: any) => (
      <span>{u._count?.orders || 0}</span>
    )},
    { key: 'createdAt', label: 'Joined', render: (u: any) => (
      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', render: (u: any) => (
      <div className="flex gap-2">
        <button onClick={() => setSelected(u)} className="p-1.5 text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"><Eye size={14} /></button>
        <button
          onClick={() => updateMutation.mutate({ id: u.id, data: { isActive: !u.isActive } })}
          className={`p-1.5 transition-colors ${u.isActive ? 'text-brand-400 hover:text-red-500' : 'text-brand-400 hover:text-green-500'}`}
          title={u.isActive ? 'Deactivate' : 'Activate'}>
          {u.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Customers" subtitle={`${pagination?.total || 0} registered customers`} />
      <div className="mb-5">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or email..." />
      </div>
      <DataTable columns={columns} data={customers} loading={isLoading} emptyText="No customers found" />
      <Pagination page={page} pages={pagination?.pages || 1} onChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-200 dark:bg-brand-700 flex items-center justify-center font-serif text-2xl text-brand-700 dark:text-brand-200">
                {selected.firstName.charAt(0)}{selected.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-brand-900 dark:text-white">{selected.firstName} {selected.lastName}</p>
                <p className="text-sm text-brand-500">{selected.email}</p>
                <StatusBadge status={selected.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-brand-100 dark:border-brand-800 pt-4">
              <div><p className="text-brand-500 text-xs mb-1">Role</p><p className="text-brand-900 dark:text-white">{selected.role}</p></div>
              <div><p className="text-brand-500 text-xs mb-1">Orders</p><p className="text-brand-900 dark:text-white">{selected._count?.orders || 0}</p></div>
              <div><p className="text-brand-500 text-xs mb-1">Email Verified</p><p className="text-brand-900 dark:text-white">{selected.isEmailVerified ? 'Yes' : 'No'}</p></div>
              <div><p className="text-brand-500 text-xs mb-1">Joined</p><p className="text-brand-900 dark:text-white">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-brand-100 dark:border-brand-800">
              <button
                onClick={() => updateMutation.mutate({ id: selected.id, data: { role: selected.role === 'ADMIN' ? 'USER' : 'ADMIN' } })}
                disabled={updateMutation.isPending}
                className="btn-outline text-xs flex items-center gap-2">
                {selected.role === 'ADMIN' ? <><ShieldOff size={12} />Remove Admin</> : <><ShieldCheck size={12} />Make Admin</>}
              </button>
              <button
                onClick={() => updateMutation.mutate({ id: selected.id, data: { isActive: !selected.isActive } })}
                disabled={updateMutation.isPending}
                className={`text-xs px-4 py-2 border transition-colors ${selected.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                {selected.isActive ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
