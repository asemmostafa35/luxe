'use client';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store';
import { useEffect } from 'react';
import { formatEGP } from '@/lib/currency';

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const sub = subtotal();
  const shipping = 100;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={closeCart} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-brand-950 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-100 dark:border-brand-800">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} />
            <span className="font-serif text-xl">Your Bag</span>
            {items.length > 0 && (
              <span className="w-5 h-5 bg-brand-900 dark:bg-white text-white dark:text-brand-900 rounded-full text-xs flex items-center justify-center font-medium">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} className="text-brand-200 dark:text-brand-700" />
              <div>
                <p className="font-serif text-xl text-brand-900 dark:text-white mb-1">Your bag is empty</p>
                <p className="text-sm text-brand-500">Discover our latest collection</p>
              </div>
              <button onClick={closeCart} className="btn-primary text-xs mt-2">
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map(item => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                  <Link href={`/product/${item.productId}`} onClick={closeCart}
                    className="w-20 h-24 flex-shrink-0 relative overflow-hidden bg-brand-50 dark:bg-brand-800">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <Link href={`/product/${item.productId}`} onClick={closeCart}
                        className="text-sm font-medium text-brand-900 dark:text-white leading-snug line-clamp-2 hover:opacity-70 transition-opacity">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="flex-shrink-0 text-brand-400 hover:text-red-500 transition-colors mt-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {(item.size || item.color) && (
                      <p className="text-xs text-brand-500 mt-1">
                        {[item.size, item.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-brand-200 dark:border-brand-700">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="w-7 h-7 flex items-center justify-center text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors disabled:opacity-30"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-brand-900 dark:text-white">
                        {formatEGP(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-100 dark:border-brand-800 px-6 py-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-brand-600 dark:text-brand-400">
                <span>Subtotal</span><span>{formatEGP(sub)}</span>
              </div>
              <div className="flex justify-between text-brand-600 dark:text-brand-400">
                <span>Shipping</span>
                <span>{formatEGP(shipping)}</span>
              </div>
              <div className="flex justify-between font-medium text-brand-900 dark:text-white text-base pt-2 border-t border-brand-100 dark:border-brand-800">
                <span>Total</span><span>{formatEGP(sub + shipping)}</span>
              </div>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn-primary w-full text-center block text-xs">
              Proceed to Checkout
            </Link>
            <button onClick={closeCart} className="w-full text-center text-xs text-brand-500 hover:text-brand-900 dark:hover:text-white transition-colors py-1">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
