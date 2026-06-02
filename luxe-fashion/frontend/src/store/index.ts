import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  maxStock: number;
}

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: () => number;
  subtotal: () => number;
  count: () => number;
}

interface WishlistStore {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
}

interface UIStore {
  quickViewProduct: any | null;
  openQuickView: (product: any) => void;
  closeQuickView: () => void;
  searchOpen: boolean;
  toggleSearch: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const { items } = get();
        const key = `${item.productId}-${item.variantId || ''}`;
        const existing = items.find(i => `${i.productId}-${i.variantId || ''}` === key);

        if (existing) {
          set({
            items: items.map(i =>
              `${i.productId}-${i.variantId || ''}` === key
                ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), i.maxStock) }
                : i
            ),
          });
        } else {
          const max = Math.max(1, item.maxStock || 1);
          const qty = Math.min(Math.max(1, item.quantity || 1), max);
          set({ items: [...items, { ...item, quantity: qty, maxStock: max }] });
        }
        set({ isOpen: true });
      },

      removeItem: (productId, variantId) => {
        set(s => ({
          items: s.items.filter(i => !(i.productId === productId && i.variantId === variantId)),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set(s => ({
          items: s.items.map(i =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: Math.min(quantity, i.maxStock) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'zane-cart' }
  )
);

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set(s => ({ items: [...s.items, item] })),
      remove: (productId) => set(s => ({ items: s.items.filter(i => i.productId !== productId) })),
      has: (productId) => get().items.some(i => i.productId === productId),
      toggle: (item) => {
        if (get().has(item.productId)) get().remove(item.productId);
        else get().add(item);
      },
    }),
    { name: 'zane-wishlist' }
  )
);

export const useUIStore = create<UIStore>((set) => ({
  quickViewProduct: null,
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
  searchOpen: false,
  toggleSearch: () => set(s => ({ searchOpen: !s.searchOpen })),
}));
