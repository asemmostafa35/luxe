'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { Package, Truck, Check, Clock, X, MapPin } from 'lucide-react';

const STATUS_STEPS = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING:    <Clock size={16} />,
  CONFIRMED:  <Check size={16} />,
  PROCESSING: <Package size={16} />,
  SHIPPED:    <Truck size={16} />,
  DELIVERED:  <Check size={16} />,
  CANCELLED:  <X size={16} />,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Order Placed',
  CONFIRMED:  'Confirmed',
  PROCESSING: 'Being Prepared',
  SHIPPED:    'Shipped',
  DELIVERED:  'Delivered',
  CANCELLED:  'Cancelled',
};

export default function OrderTrackingClient() {
  const params = useSearchParams();
  const [orderNum, setOrderNum] = useState(params.get('order') || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch if order param is present and user is logged in
  useEffect(() => {
    const storedEmail = localStorage.getItem('lastOrderEmail');
    if (params.get('order') && storedEmail) {
      setEmail(storedEmail);
      handleTrack(params.get('order')!, storedEmail);
    }
  }, []);

  const handleTrack = async (num?: string, em?: string) => {
    const n = num || orderNum;
    const e = em || email;
    if (!n || !e) { setError('Please enter both order number and email'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await ordersApi.track(n, e);
      setOrder(data);
      localStorage.setItem('lastOrderEmail', e);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Order not found. Please check your details.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
      <div className="text-center mb-10">
        <p className="label-small text-brand-500 mb-2">Order Management</p>
        <h1 className="font-serif text-4xl font-light text-brand-900 dark:text-white">Track Your Order</h1>
        <p className="text-brand-500 text-sm mt-3">Enter your order number and the email used at checkout</p>
      </div>

      {/* Search form */}
      <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6 mb-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label-small block mb-2">Order Number</label>
            <input value={orderNum} onChange={e => setOrderNum(e.target.value.toUpperCase())}
              placeholder="LXF-XXXXXX-XXXX"
              className="input-field font-mono" />
          </div>
          <div>
            <label className="label-small block mb-2">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              placeholder="your@email.com" className="input-field" />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button onClick={() => handleTrack()} disabled={loading} className="btn-primary text-xs w-full sm:w-auto">
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </div>

      {/* Results */}
      {order && (
        <div className="space-y-6 animate-fade-up">
          {/* Header */}
          <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="label-small text-brand-500 mb-1">Order Number</p>
                <p className="font-mono font-medium text-brand-900 dark:text-white text-lg">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="label-small text-brand-500 mb-1">Order Total</p>
                <p className="font-medium text-brand-900 dark:text-white text-lg">${Number(order.total).toFixed(2)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-500 text-xs mb-0.5">Order Date</p>
                <p className="text-brand-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-brand-500 text-xs mb-0.5">Payment</p>
                <p className="text-brand-900 dark:text-white">{order.paymentMethod?.replace(/_/g, ' ')}</p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-brand-500 text-xs mb-0.5">Tracking #</p>
                  <p className="text-brand-900 dark:text-white font-mono">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status timeline */}
          {!isCancelled && (
            <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6">
              <p className="label-small text-brand-500 mb-6">Order Progress</p>
              <div className="flex items-center justify-between relative">
                {/* Progress bar */}
                <div className="absolute left-0 right-0 h-0.5 bg-brand-100 dark:bg-brand-800 top-5 z-0">
                  <div
                    className="h-full bg-brand-900 dark:bg-white transition-all duration-700"
                    style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
                  />
                </div>
                {STATUS_STEPS.map((status, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={status} className="flex flex-col items-center z-10 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${done ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900' : 'bg-brand-100 dark:bg-brand-800 text-brand-400 dark:text-brand-600'}
                        ${active ? 'ring-4 ring-brand-200 dark:ring-brand-700' : ''}`}>
                        {STATUS_ICONS[status]}
                      </div>
                      <p className={`text-[10px] tracking-widest uppercase mt-2 text-center hidden sm:block transition-colors
                        ${done ? 'text-brand-900 dark:text-white font-medium' : 'text-brand-400 dark:text-brand-600'}`}>
                        {STATUS_LABELS[status]}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm font-medium text-brand-900 dark:text-white">{STATUS_LABELS[order.status]}</p>
                {order.estimatedDelivery && order.status !== 'DELIVERED' && (
                  <p className="text-xs text-brand-500 mt-1">
                    Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-5 flex items-center gap-3">
              <X size={20} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">Order Cancelled</p>
                {order.cancelReason && <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{order.cancelReason}</p>}
              </div>
            </div>
          )}

          {/* Status history */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6">
              <p className="label-small text-brand-500 mb-4">Status History</p>
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-300 dark:bg-brand-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-brand-900 dark:text-white">{STATUS_LABELS[h.status] || h.status}</p>
                      {h.note && <p className="text-xs text-brand-500 mt-0.5">{h.note}</p>}
                      <p className="text-xs text-brand-400 mt-0.5">{new Date(h.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6">
            <p className="label-small text-brand-500 mb-4">Items Ordered ({order.items?.length})</p>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-brand-50 dark:border-brand-900 last:border-0">
                  <p className="flex-1 text-sm text-brand-900 dark:text-white">
                    {item.name}
                    {(item.size || item.color) && (
                      <span className="text-brand-500 ml-1">/ {[item.size, item.color].filter(Boolean).join(' · ')}</span>
                    )}
                  </p>
                  <p className="text-sm text-brand-500">×{item.quantity}</p>
                  <p className="text-sm font-medium text-brand-900 dark:text-white">${Number(item.total).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          {order.address && (
            <div className="bg-white dark:bg-brand-950 border border-brand-100 dark:border-brand-800 p-6">
              <p className="label-small text-brand-500 mb-3 flex items-center gap-2"><MapPin size={12} />Shipping Address</p>
              <address className="not-italic text-sm text-brand-700 dark:text-brand-300 leading-relaxed">
                {order.address.firstName} {order.address.lastName}<br />
                {order.address.street}<br />
                {order.address.city}, {order.address.state} {order.address.postalCode}<br />
                {order.address.country}
              </address>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
