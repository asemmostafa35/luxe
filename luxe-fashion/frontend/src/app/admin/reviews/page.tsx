'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, api } from '@/lib/api';
import { AdminPageHeader, DataTable, StatusBadge, Pagination } from '@/components/admin/AdminUI';
import { Check, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

function getAllReviews(page: number, approved: string) {
  return api.get('/admin/reviews', { params: { page, limit: 20, approved } });
}

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, filter],
    queryFn:  () => getAllReviews(page, filter),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.approve(id),
    onSuccess:  () => { toast.success('Review approved'); qc.invalidateQueries({ queryKey: ['admin-reviews'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess:  () => { toast.success('Review deleted'); qc.invalidateQueries({ queryKey: ['admin-reviews'] }); },
  });

  const reviews    = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;

  const columns = [
    { key: 'product', label: 'Product', render: (r: any) => (
      <p className="text-sm font-medium text-brand-900 dark:text-white line-clamp-1">{r.product?.name || '—'}</p>
    )},
    { key: 'author', label: 'Author', render: (r: any) => (
      <div>
        <p className="text-sm text-brand-900 dark:text-white">{r.user?.firstName} {r.user?.lastName}</p>
        <p className="text-xs text-brand-500">{r.user?.email}</p>
      </div>
    )},
    { key: 'rating', label: 'Rating', render: (r: any) => (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < r.rating ? 'fill-gold-500 text-gold-500' : 'text-brand-200 dark:text-brand-700'} />
        ))}
      </div>
    )},
    { key: 'body', label: 'Review', render: (r: any) => (
      <div>
        {r.title && <p className="text-xs font-medium text-brand-900 dark:text-white mb-0.5">{r.title}</p>}
        <p className="text-xs text-brand-600 dark:text-brand-400 line-clamp-2">{r.body}</p>
      </div>
    )},
    { key: 'isApproved', label: 'Status', render: (r: any) => (
      <StatusBadge status={r.isApproved ? 'ACTIVE' : 'PENDING'} />
    )},
    { key: 'createdAt', label: 'Date', render: (r: any) => (
      <span className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', render: (r: any) => (
      <div className="flex gap-2">
        {!r.isApproved && (
          <button onClick={() => approveMutation.mutate(r.id)}
            className="p-1.5 text-brand-400 hover:text-green-600 transition-colors" title="Approve">
            <Check size={14} />
          </button>
        )}
        <button onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(r.id); }}
          className="p-1.5 text-brand-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader title="Reviews" subtitle="Moderate customer reviews" />

      <div className="flex gap-2 mb-5">
        {[
          ['pending',  'Pending Approval'],
          ['approved', 'Approved'],
          ['all',      'All Reviews'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1); }}
            className={`px-4 py-2 text-xs border transition-colors ${
              filter === val
                ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900 border-brand-900 dark:border-white'
                : 'border-brand-200 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:border-brand-900 dark:hover:border-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={reviews} loading={isLoading} emptyText="No reviews found" />
      <Pagination page={page} pages={pagination?.pages || 1} onChange={setPage} />
    </div>
  );
}
