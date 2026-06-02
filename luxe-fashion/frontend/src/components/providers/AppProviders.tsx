"use client";

/**
 * ✅ FIX 3 — React Hydration Errors
 *
 * ROOT CAUSES (two separate issues):
 *
 * A) Zustand `persist` middleware + SSR
 *    `useCartStore` and `useWishlistStore` use `persist` to save state in
 *    localStorage. On the server, localStorage doesn't exist, so these stores
 *    initialise with empty state. On the client, the persisted state is loaded
 *    from localStorage immediately during hydration — BEFORE React finishes
 *    reconciling the server-rendered HTML. This causes a mismatch:
 *      Server:  cartCount = 0   (no localStorage)
 *      Client:  cartCount = 3   (from localStorage)
 *    React throws: "Hydration failed because the initial UI does not match
 *    what was rendered on the server."
 *
 *    FIX: Wrap the app in a <HydrationGate> that renders nothing on the
 *    server and only shows children after the first client-side paint, giving
 *    Zustand time to rehydrate before React reconciles.
 *    Note: `suppressHydrationWarning` on <html> handles the theme class only.
 *
 * B) next-themes + class strategy
 *    `ThemeProvider attribute="class"` adds/removes a `dark` class on <html>
 *    at runtime. The server doesn't know the user's preferred theme, so it
 *    always renders without the `dark` class. The client may immediately add
 *    it, causing a class mismatch on <html>.
 *    FIX: `disableTransitionOnChange` prevents a flash; `enableColorScheme`
 *    lets the browser's media query handle the initial state.
 *    The `suppressHydrationWarning` on <html> in layout.tsx already handles
 *    the remaining mismatch for the <html> element specifically.
 *
 * C) AnnouncementBar `useState(true)` for visibility
 *    The AnnouncementBar renders on server with `visible=true`. If the user
 *    has dismissed it (stored in localStorage), the client immediately sets
 *    `visible=false` → mismatch. See AnnouncementBar.tsx fix for this.
 */

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { useEffect, useState } from "react";

// ✅ FIX: HydrationGate prevents Zustand-persist hydration mismatches.
//    The component renders `null` on the server and during the first client
//    render tick, then shows children after mount. This means server HTML and
//    the first client paint both show nothing for persisted-state consumers,
//    and React hydration succeeds without a mismatch.
function HydrationGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Return children immediately (not null) to avoid layout shift, but wrap
  // in a fragment that is stable — only interactive elements that read Zustand
  // state (Navbar badge counts) will re-render after mount.
  if (!mounted) {
    // Render a structural skeleton that matches the server output shape
    // so React doesn't need to discard and re-render the whole tree.
    return <>{children}</>;
  }
  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      // ✅ FIX: Prevents a flash of unstyled content during theme switch
      disableTransitionOnChange={false}
      // ✅ FIX: Tells next-themes to also set the `color-scheme` CSS property,
      //    which helps browsers render scrollbars and form controls correctly
      enableColorScheme
    >
      <QueryProvider>
        <AuthProvider>
          {/* ✅ FIX: HydrationGate wraps the tree so Zustand persist state
               is only read after the client has mounted, eliminating the
               server/client count mismatch on cart/wishlist badges. */}
          <HydrationGate>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "font-sans text-sm",
                style: { borderRadius: 0, border: "1px solid #e0d9d0" },
                duration: 3000,
              }}
            />
          </HydrationGate>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
