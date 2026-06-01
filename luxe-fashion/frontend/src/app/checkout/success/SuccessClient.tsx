'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Package } from 'lucide-react';

export default function SuccessClient() {
  const params = useSearchParams();
  const order = params.get('order');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-up">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <Check size={36} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="font-serif text-4xl font-light text-brand-900 dark:text-white mb-3">Order Placed!</h1>
        <p className="text-brand-600 dark:text-brand-400 mb-2">Thank you for shopping with Luxe Fashion.</p>
        {order && (
          <p className="text-sm text-brand-500 mb-2">
            Order number: <span className="font-medium text-brand-900 dark:text-white font-mono">{order}</span>
          </p>
        )}
        <p className="text-sm text-brand-500 mb-10">A confirmation email has been sent with your order details and tracking information.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {order && (
            <Link href={`/order-tracking?order=${order}`}
              className="btn-outline flex items-center justify-center gap-2 text-xs">
              <Package size={14} /> Track Order
            </Link>
          )}
          <Link href="/shop" className="btn-primary text-xs">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
