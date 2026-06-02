"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  canAccessAdminRoute,
  getDefaultAdminLanding,
  isStaffRole,
} from "@/lib/rbac/permissions";
import { AdminLoader } from "@/components/admin/AdminLoader";

export function AdminRouteGuard({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isStaffRole(role)) return;

    if (role === "VIEWER" && (pathname === "/admin" || pathname === "/admin/")) {
      router.replace("/admin/analytics");
      return;
    }

    if (!canAccessAdminRoute(role, pathname)) {
      const fallback = getDefaultAdminLanding(role);
      toast.error("You do not have access to this page");
      router.replace(fallback);
    }
  }, [role, pathname, router]);

  if (!canAccessAdminRoute(role, pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <AdminLoader />
      </div>
    );
  }

  return <>{children}</>;
}
