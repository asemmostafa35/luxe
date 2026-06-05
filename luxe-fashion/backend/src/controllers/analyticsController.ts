import { Request, Response, NextFunction } from "express";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";

export const REVENUE_ELIGIBLE_WHERE: Prisma.OrderWhereInput = {
  status: { notIn: ["CANCELLED", "REFUNDED"] },
  OR: [{ paymentStatus: "PAID" }, { status: "DELIVERED" }],
};

function calcRevenue(orders: { total: Prisma.Decimal; shipping: Prisma.Decimal }[]): number {
  return orders.reduce((sum, o) => sum + Number(o.total) - Number(o.shipping), 0);
}

function buildMonthlyRevenueTrends(
  orders: { createdAt: Date; total: Prisma.Decimal; shipping: Prisma.Decimal }[],
  now: Date,
) {
  const buckets: Record<string, number> = {};
  const labels: { key: string; label: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets[key] = 0;
    labels.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
  }

  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (key in buckets) {
      buckets[key] += Number(o.total) - Number(o.shipping);
    }
  }

  return labels.map(({ key, label }) => ({ month: label, revenue: buckets[key] ?? 0 }));
}

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      allRevenueOrders,
      monthRevenueOrders,
      lastMonthRevenueOrders,
      totalOrders,
      monthOrders,
      totalCustomers,
      newCustomers,
      pendingOrders,
      lowStockVariants,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.findMany({
        where: REVENUE_ELIGIBLE_WHERE,
        select: { total: true, shipping: true },
      }),
      prisma.order.findMany({
        where: { ...REVENUE_ELIGIBLE_WHERE, createdAt: { gte: startOfMonth } },
        select: { total: true, shipping: true },
      }),
      prisma.order.findMany({
        where: {
          ...REVENUE_ELIGIBLE_WHERE,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { total: true, shipping: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
      prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { select: { name: true, quantity: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { totalSold: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          totalSold: true,
          price: true,
          costPrice: true,
          avgRating: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    ]);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [revenueRaw, monthlyRevenueOrders] = await Promise.all([
      prisma.order.findMany({
        where: { ...REVENUE_ELIGIBLE_WHERE, createdAt: { gte: last30Days } },
        select: { createdAt: true, total: true, shipping: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        where: { ...REVENUE_ELIGIBLE_WHERE, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, total: true, shipping: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const monthlyRevenueTrends = buildMonthlyRevenueTrends(monthlyRevenueOrders, now);

    const totalRevenueValue = calcRevenue(allRevenueOrders);
    const currRev = calcRevenue(monthRevenueOrders);
    const prevRev = calcRevenue(lastMonthRevenueOrders);

    const revenueByDay = revenueRaw.reduce(
      (acc: Record<string, { revenue: number; orders: number }>, o) => {
        const date = o.createdAt.toISOString().split("T")[0];
        if (!acc[date]) acc[date] = { revenue: 0, orders: 0 };
        acc[date].revenue += Number(o.total) - Number(o.shipping);
        acc[date].orders += 1;
        return acc;
      },
      {},
    );
    const revenueByDayArr = Object.entries(revenueByDay).map(([date, v]) => ({ date, ...v }));

    const monthGrowth =
      prevRev > 0 ? (((currRev - prevRev) / prevRev) * 100).toFixed(1) : "100";

    const topProductsWithMargin = topProducts.map((p) => ({
      ...p,
      profitMargin: p.costPrice
        ? (((Number(p.price) - Number(p.costPrice)) / Number(p.price)) * 100).toFixed(1)
        : null,
    }));

    res.json({
      overview: {
        totalRevenue: totalRevenueValue,
        monthRevenue: currRev,
        monthGrowth,
        totalOrders,
        monthOrders: monthRevenueOrders.length,
        totalCustomers,
        newCustomers,
        pendingOrders,
        lowStockVariants,
      },
      recentOrders,
      topProducts: topProductsWithMargin,
      revenueByDay: revenueByDayArr,
      monthlyRevenueTrends,
      ordersByStatus: ordersByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
};

const VALID_GROUP_BY = new Set(["day", "week", "month", "year"]);

export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, groupBy = "day" } = req.query;
    const safeGroupBy = VALID_GROUP_BY.has(groupBy as string) ? (groupBy as string) : "day";
    const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to as string) : new Date();

    const orders = await prisma.order.findMany({
      where: { ...REVENUE_ELIGIBLE_WHERE, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, total: true, subtotal: true, discount: true, shipping: true },
      orderBy: { createdAt: "asc" },
    });

    const getPeriodKey = (date: Date): string => {
      if (safeGroupBy === "day") return date.toISOString().split("T")[0];
      if (safeGroupBy === "week") {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split("T")[0];
      }
      if (safeGroupBy === "month")
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      return String(date.getFullYear());
    };

    const grouped = orders.reduce((acc: Record<string, any>, o) => {
      const key = getPeriodKey(o.createdAt);
      if (!acc[key]) acc[key] = { period: key, revenue: 0, subtotal: 0, discounts: 0, shipping: 0, orders: 0 };
      acc[key].revenue += Number(o.total) - Number(o.shipping);
      acc[key].subtotal += Number(o.subtotal);
      acc[key].discounts += Number(o.discount);
      acc[key].shipping += Number(o.shipping);
      acc[key].orders += 1;
      return acc;
    }, {});

    const report = Object.values(grouped).map((g: any) => ({
      ...g,
      avg_order_value: g.orders > 0 ? g.revenue / g.orders : 0,
    }));

    res.json(report);
  } catch (err) {
    next(err);
  }
};
