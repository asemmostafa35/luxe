"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { ordersApi, wishlistApi, userApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Heart,
  User,
  MapPin,
  LogOut,
  ChevronRight,
  Check,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatEGP } from "@/lib/currency";
import { getDefaultAdminLanding } from "@/lib/rbac/permissions";

const tabs = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  PROCESSING:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  SHIPPED:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
  DELIVERED:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

export default function ProfilePage() {
  const { user, logout, loading, isStaff } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("orders");

  if (loading)
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-900 dark:border-t-white rounded-full animate-spin mx-auto" />
      </div>
    );
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="flex items-center gap-4 mb-8 p-5 bg-brand-50 dark:bg-brand-900">
            <div className="w-12 h-12 rounded-full bg-brand-200 dark:bg-brand-700 flex items-center justify-center font-serif text-xl text-brand-700 dark:text-brand-200">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-brand-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-brand-500">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${tab === id ? "bg-brand-900 dark:bg-white text-white dark:text-brand-900" : "text-brand-600 dark:text-brand-400 hover:text-brand-900 dark:hover:text-white hover:bg-brand-50 dark:hover:bg-brand-900"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}

            {isStaff && (
              <Link
                href={user ? getDefaultAdminLanding(user.role) : "/admin"}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-900 font-bold hover:bg-brand-100 dark:text-white dark:hover:bg-brand-800 transition-colors"
              >
                <ShieldCheck size={16} /> Admin Dashboard
              </Link>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mt-4"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {tab === "orders" && <OrdersTab />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "profile" && <ProfileTab user={user} />}
          {tab === "addresses" && <AddressesTab />}
        </div>
      </div>
    </div>
  );
}
function OrdersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.getMyOrders(),
  });
  const orders = data?.data?.orders || [];

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 skeleton" />
        ))}
      </div>
    );
  if (orders.length === 0)
    return (
      <div className="text-center py-16">
        <Package
          size={48}
          className="mx-auto text-brand-200 dark:text-brand-700 mb-4"
        />
        <p className="font-serif text-2xl text-brand-900 dark:text-white mb-2">
          No orders yet
        </p>
        <Link href="/shop" className="btn-primary inline-block text-xs mt-4">
          Start Shopping
        </Link>
      </div>
    );

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-6">
        Order History
      </h2>
      <div className="space-y-4">
        {orders.map((order: any) => (
          <div
            key={order.id}
            className="border border-brand-100 dark:border-brand-800 p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-medium text-brand-900 dark:text-white text-sm">
                  {order.orderNumber}
                </p>
                <p className="text-xs text-brand-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 ${STATUS_COLORS[order.status] || "bg-brand-100 text-brand-700"}`}
                >
                  {order.status}
                </span>
                <p className="text-sm font-medium text-brand-900 dark:text-white mt-2">
                  {formatEGP(Number(order.total))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              {order.items?.slice(0, 4).map((item: any) => (
                <div
                  key={item.id}
                  className="w-12 h-14 relative overflow-hidden bg-brand-50 dark:bg-brand-800 flex-shrink-0"
                >
                  {item.product?.images?.[0] && (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
              {order.items?.length > 4 && (
                <p className="text-xs text-brand-500">
                  +{order.items.length - 4} more
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/order-tracking?order=${order.orderNumber}`}
                className="text-xs border border-brand-200 dark:border-brand-700 px-4 py-2 hover:border-brand-900 dark:hover:border-white transition-colors flex items-center gap-1"
              >
                Track Order <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
  });
  const items = data?.data || [];

  const removeItem = async (productId: string) => {
    await wishlistApi.remove(productId);
    refetch();
    toast.success("Removed from wishlist");
  };

  if (isLoading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] skeleton" />
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <div className="text-center py-16">
        <Heart
          size={48}
          className="mx-auto text-brand-200 dark:text-brand-700 mb-4"
        />
        <p className="font-serif text-2xl text-brand-900 dark:text-white mb-2">
          Your wishlist is empty
        </p>
        <Link href="/shop" className="btn-primary inline-block text-xs mt-4">
          Discover Products
        </Link>
      </div>
    );

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-6">
        Wishlist ({items.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="group relative">
            <Link href={`/product/${item.product.slug}`}>
              <div className="relative aspect-[3/4] overflow-hidden bg-brand-50 dark:bg-brand-800 mb-3">
                {item.product.images?.[0] && (
                  <Image
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-brand-900 dark:text-white line-clamp-1">
                {item.product.name}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {formatEGP(Number(item.product.price))}
              </p>
            </Link>
            <button
              onClick={() => removeItem(item.product.id)}
              className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-brand-900 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            >
              <Heart size={14} className="fill-red-500 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || "",
  });

  const save = async () => {
    setSaving(true);
    try {
      await userApi.updateProfile(form);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="font-serif text-2xl font-light text-brand-900 dark:text-white mb-6">
        Profile Settings
      </h2>
      <div className="space-y-5 max-w-md">
        {[
          { key: "firstName", label: "First Name" },
          { key: "lastName", label: "Last Name" },
          { key: "phone", label: "Phone Number" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="label-small block mb-2">{label}</label>
            <input
              value={(form as any)[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="input-field"
            />
          </div>
        ))}
        <div>
          <label className="label-small block mb-2">Email</label>
          <input
            value={user.email}
            disabled
            className="input-field opacity-50 cursor-not-allowed"
          />
          {!user.isEmailVerified && (
            <p className="text-xs text-yellow-600 mt-1">
              Email not verified. Check your inbox.
            </p>
          )}
          {user.isEmailVerified && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check size={10} />
              Email verified
            </p>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary text-xs"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function AddressesTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => userApi.getAddresses(),
  });
  const addresses = data?.data || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [saving, setSaving] = useState(false);

  const saveAddress = async () => {
    setSaving(true);
    try {
      await userApi.addAddress(form);
      toast.success("Address added");
      refetch();
      setAdding(false);
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 skeleton" />
        ))}
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-light text-brand-900 dark:text-white">
          Addresses
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="btn-outline text-xs"
        >
          {adding ? "Cancel" : "+ Add Address"}
        </button>
      </div>

      {adding && (
        <div className="border border-brand-200 dark:border-brand-700 p-5 mb-6 grid grid-cols-2 gap-4">
          {Object.keys(form).map((key) => (
            <div key={key} className={key === "street" ? "col-span-2" : ""}>
              <label className="label-small block mb-2">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
              </label>
              <input
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="input-field text-sm"
              />
            </div>
          ))}
          <div className="col-span-2">
            <button
              onClick={saveAddress}
              disabled={saving}
              className="btn-primary text-xs"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <div className="text-center py-12">
          <MapPin
            size={36}
            className="mx-auto text-brand-200 dark:text-brand-700 mb-3"
          />
          <p className="text-brand-500 text-sm">No saved addresses</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((addr: any) => (
            <div
              key={addr.id}
              className="border border-brand-200 dark:border-brand-700 p-4"
            >
              <p className="font-medium text-sm text-brand-900 dark:text-white mb-1">
                {addr.label}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {addr.firstName} {addr.lastName}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {addr.street}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {addr.city}, {addr.state} {addr.postalCode}
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {addr.country}
              </p>
              <button
                onClick={async () => {
                  await userApi.deleteAddress(addr.id);
                  refetch();
                }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors mt-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
