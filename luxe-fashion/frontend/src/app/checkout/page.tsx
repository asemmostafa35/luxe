'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/store';
import { ordersApi, couponsApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Check, Tag, X } from 'lucide-react';
import { formatEGP } from '@/lib/currency';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Required'),
  street: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required'),
  postalCode: z.string().min(1, 'Required'),
  paymentMethod: z.literal('CASH_ON_DELIVERY'),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      paymentMethod: 'CASH_ON_DELIVERY',
    },
  });

  const sub = subtotal();
  const discountAmt = coupon
    ? coupon.discountType === 'PERCENTAGE'
      ? Math.min(sub * Number(coupon.discountValue) / 100, coupon.maxDiscount ? Number(coupon.maxDiscount) : Infinity)
      : Number(coupon.discountValue)
    : 0;
  const shipping = 100;
  const tax = 0;
  const total = sub - discountAmt + shipping + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponsApi.validate(couponCode);
      setCoupon(data);
      toast.success('Coupon applied!');
    } catch { toast.error('Invalid or expired coupon'); }
    finally { setCouponLoading(false); }
  };

  const onSubmit = async (form: CheckoutForm) => {
    setSubmitting(true);
    try {
      const { data: order } = await ordersApi.create({
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        guestEmail: !user ? form.email : undefined,
        guestName: !user ? `${form.firstName} ${form.lastName}` : undefined,
        guestPhone: !user ? form.phone : undefined,

        paymentMethod: 'CASH_ON_DELIVERY',
        couponCode: coupon?.code,
        notes: form.notes,
      });
      clearCart();
      router.push(`/checkout/success?order=${order.orderNumber}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-24 text-center">
        <p className="font-serif text-3xl text-brand-900 dark:text-white mb-4">Your bag is empty</p>
        <Link href="/shop" className="btn-primary inline-block">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
      <h1 className="font-serif text-3xl font-light text-brand-900 dark:text-white mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-10">
        {['Shipping', 'Payment', 'Review'].map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${step > i + 1 ? 'text-green-600 dark:text-green-400' : step === i + 1 ? 'text-brand-900 dark:text-white' : 'text-brand-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${step > i + 1 ? 'bg-green-600 text-white' : step === i + 1 ? 'bg-brand-900 dark:bg-white text-white dark:text-brand-900' : 'border border-brand-300 dark:border-brand-600'}`}>
                {step > i + 1 ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < 2 && <div className={`h-px w-8 sm:w-16 ${step > i + 1 ? 'bg-green-600' : 'bg-brand-200 dark:bg-brand-700'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl font-light text-brand-900 dark:text-white">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-small block mb-2">First Name</label>
                    <input {...register('firstName')} className="input-field" />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">Last Name</label>
                    <input {...register('lastName')} className="input-field" />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">Email</label>
                    <input {...register('email')} type="email" className="input-field" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">Phone</label>
                    <input {...register('phone')} className="input-field" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="label-small block mb-2">Street Address</label>
                    <input {...register('street')} className="input-field" />
                    {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">City</label>
                    <input {...register('city')} className="input-field" />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">State / Province</label>
                    <input {...register('state')} className="input-field" />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">Country</label>
                    <input {...register('country')} className="input-field" />
                    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
                  </div>
                  <div>
                    <label className="label-small block mb-2">Postal Code</label>
                    <input {...register('postalCode')} className="input-field" />
                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="label-small block mb-2">Order Notes (Optional)</label>
                    <textarea {...register('notes')} rows={2} className="input-field resize-none" placeholder="Any special instructions..." />
                  </div>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full sm:w-auto">
                  Continue to Payment
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl font-light text-brand-900 dark:text-white">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay in cash when your order arrives' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-4 p-4 border border-brand-200 dark:border-brand-700 cursor-pointer hover:border-brand-900 dark:hover:border-white transition-colors">
                      <input {...register('paymentMethod')} type="radio" value={opt.value} className="w-4 h-4 accent-brand-900 dark:accent-white" />
                      <div>
                        <p className="text-sm font-medium text-brand-900 dark:text-white">{opt.label}</p>
                        <p className="text-xs text-brand-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline text-xs">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary">Review Order</button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-serif text-xl font-light text-brand-900 dark:text-white">Review Your Order</h2>
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 py-4 border-b border-brand-100 dark:border-brand-800">
                      <div className="w-16 h-20 relative flex-shrink-0 overflow-hidden bg-brand-50 dark:bg-brand-800">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-900 dark:text-white">{item.name}</p>
                        {(item.size || item.color) && <p className="text-xs text-brand-500">{[item.size, item.color].filter(Boolean).join(' · ')}</p>}
                        <p className="text-xs text-brand-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-brand-900 dark:text-white">{formatEGP(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-outline text-xs">Back</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 sm:flex-none">
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="border border-brand-100 dark:border-brand-800 p-6">
              <h3 className="font-serif text-xl font-light text-brand-900 dark:text-white mb-5">Order Summary</h3>
              <div className="space-y-3 text-sm mb-5">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-brand-600 dark:text-brand-400">
                    <span className="truncate mr-2">{item.name} <span className="text-brand-400">×{item.quantity}</span></span>
                    <span className="flex-shrink-0">{formatEGP(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-brand-100 dark:border-brand-800 pt-4 mb-4">
                {!coupon ? (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                      <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="w-full border border-brand-200 dark:border-brand-700 pl-8 pr-3 py-2 text-xs bg-transparent focus:outline-none focus:border-brand-900 dark:focus:border-white transition-colors" />
                    </div>
                    <button type="button" onClick={applyCoupon} disabled={couponLoading}
                      className="text-xs border border-brand-200 dark:border-brand-700 px-3 hover:border-brand-900 dark:hover:border-white transition-colors disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Check size={14} />
                      <span className="text-xs font-medium">{coupon.code}</span>
                    </div>
                    <button type="button" onClick={() => { setCoupon(null); setCouponCode(''); }} className="text-green-600 hover:text-green-800 dark:hover:text-green-300">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-brand-100 dark:border-brand-800 pt-4">
                <div className="flex justify-between text-brand-600 dark:text-brand-400">
                  <span>Subtotal</span><span>{formatEGP(sub)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span><span>-{formatEGP(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-600 dark:text-brand-400">
                  <span>Shipping</span><span>{formatEGP(shipping)}</span>
                </div>
                <div className="flex justify-between text-brand-600 dark:text-brand-400">
                  <span>Tax</span><span>{formatEGP(tax)}</span>
                </div>
                <div className="flex justify-between font-medium text-brand-900 dark:text-white text-base border-t border-brand-100 dark:border-brand-800 pt-2 mt-2">
                  <span>Total</span><span>{formatEGP(total)}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-brand-500 space-y-1">
              <p>🔒 Secure checkout</p>
              <p>🚚 Free returns within 30 days</p>
              <p>📦 Order confirmation sent by email</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
