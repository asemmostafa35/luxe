import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now        = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);
    const last30Days       = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRevenue, monthRevenue, lastMonthRevenue,
      totalOrders, monthOrders,
      totalCustomers, newCustomers,
      pendingOrders, lowStockVariants,
      recentOrders, topProducts, ordersByStatus,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true }, _count: true,
      }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { status: { in: ['PENDING','CONFIRMED','PROCESSING'] } } }),
      prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user:  { select: { firstName: true, lastName: true, email: true } },
          items: { select: { name: true, quantity: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { totalSold: 'desc' },
        take: 5,
        select: {
          id: true, name: true, totalSold: true, price: true, avgRating: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    // Revenue by day (last 30 days) - using groupBy instead of raw SQL
    const revenueRaw = await prisma.order.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: last30Days } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date in JS
    const revenueByDay = revenueRaw.reduce((acc: Record<string, { revenue: number; orders: number }>, o) => {
      const date = o.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { revenue: 0, orders: 0 };
      acc[date].revenue += Number(o.total);
      acc[date].orders  += 1;
      return acc;
    }, {});
    const revenueByDayArr = Object.entries(revenueByDay).map(([date, v]) => ({ date, ...v }));

    const prevRev = Number(lastMonthRevenue._sum.total) || 0;
    const currRev = Number(monthRevenue._sum.total) || 0;
    const monthGrowth = prevRev > 0 ? ((currRev - prevRev) / prevRev * 100).toFixed(1) : '100';

    res.json({
      overview: {
        totalRevenue:      Number(totalRevenue._sum.total) || 0,
        monthRevenue:      currRev,
        monthGrowth,
        totalOrders,
        monthOrders,
        totalCustomers,
        newCustomers,
        pendingOrders,
        lowStockVariants,
      },
      recentOrders,
      topProducts,
      revenueByDay:    revenueByDayArr,
      ordersByStatus:  ordersByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
};

// Whitelist for groupBy to prevent injection
const VALID_GROUP_BY = new Set(['day','week','month','year']);

export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    // Validate groupBy against whitelist
    const safeGroupBy = VALID_GROUP_BY.has(groupBy as string) ? (groupBy as string) : 'day';

    const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate   = to   ? new Date(to   as string) : new Date();

    // Fetch raw and group in JS to avoid SQL injection
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        total:     true,
        subtotal:  true,
        discount:  true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const getPeriodKey = (date: Date): string => {
      if (safeGroupBy === 'day')   return date.toISOString().split('T')[0];
      if (safeGroupBy === 'week') {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split('T')[0];
      }
      if (safeGroupBy === 'month') return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`;
      return String(date.getFullYear());
    };

    const grouped = orders.reduce((acc: Record<string, any>, o) => {
      const key = getPeriodKey(o.createdAt);
      if (!acc[key]) acc[key] = { period: key, revenue: 0, subtotal: 0, discounts: 0, orders: 0 };
      acc[key].revenue   += Number(o.total);
      acc[key].subtotal  += Number(o.subtotal);
      acc[key].discounts += Number(o.discount);
      acc[key].orders    += 1;
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
