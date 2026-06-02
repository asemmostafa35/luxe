import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';
import { emailService } from '../services/emailService';
import { hasPermission } from '../lib/rbac/permissions';

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LXF-${ts}-${rnd}`;
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const {
      items,
      addressId,
      guestEmail,
      guestName,
      guestPhone,
      couponCode,
      notes,
    } = req.body;

    if (!items?.length) return res.status(400).json({ error: 'No items provided' });

    let subtotal = new Prisma.Decimal(0);
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: { where: { isPrimary: true }, take: 1 } },
      });
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product ${item.productId} not available` });
      }
      let variant = null;
      if (item.variantId) {
        variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) return res.status(400).json({ error: `Variant not found` });
        if (variant.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }
      }
      const price = variant?.price || product.price;
      const total = new Prisma.Decimal(price).mul(item.quantity);
      subtotal = subtotal.add(total);
      orderItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        name: product.name,
        image: product.images[0]?.url || null,
        size: variant?.size || null,
        color: variant?.color || null,
        quantity: item.quantity,
        price,
        total,
      });
    }

    // Apply coupon
    let discount = new Prisma.Decimal(0);
    let couponId: string | null = null;
    if (couponCode) {
      const now = new Date();
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          ],
        },
      });
      if (coupon) {
        if (!coupon.minOrderAmount || subtotal.gte(coupon.minOrderAmount)) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = subtotal.mul(coupon.discountValue).div(100);
            if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) discount = new Prisma.Decimal(coupon.maxDiscount);
          } else {
            discount = new Prisma.Decimal(coupon.discountValue);
          }
          couponId = coupon.id;
          await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
        }
      }
    }

    const afterDiscount = subtotal.sub(discount);
    const shipping = new Prisma.Decimal(100);
    const tax = new Prisma.Decimal(0);
    const total = afterDiscount.add(shipping).add(tax);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId || null,
        addressId: addressId || null,
        guestEmail: guestEmail || null,
        guestName: guestName || null,
        guestPhone: guestPhone || null,
        paymentMethod: "CASH_ON_DELIVERY",
        subtotal,
        discount,
        shipping,
        tax,
        total,
        couponId,
        notes: notes || null,
        items: { create: orderItems },
        statusHistory: {
          create: [{ status: "PENDING", note: "COD order placed" }],
        },
      },
      include: { items: true, address: true, user: true, statusHistory: true },
    });

    // Update stock
    for (const item of items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await prisma.product.update({
        where: { id: item.productId },
        data: { totalSold: { increment: item.quantity } },
      });
    }

    // Clear server-side cart
    if (userId) {
      await prisma.cartItem.deleteMany({ where: { userId } });
    }

    // Send emails (non-blocking)
    const emailTo = order.user?.email || order.guestEmail;
    const emailName = order.user?.firstName || order.guestName || 'Customer';
    if (emailTo) {
      emailService.sendOrderConfirmation(emailTo, emailName, order).catch(console.error);
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.OrderWhereInput = {
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search as string, mode: 'insensitive' } },
          { user: { email: { contains: search as string, mode: 'insensitive' } } },
          { guestEmail: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              image: true,
              quantity: true,
            },
          },
          user: { select: { firstName: true, lastName: true, email: true } },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const role = (req as any).user?.role;
    const isAdmin = role && hasPermission(role, 'orders:read');

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        address: true, coupon: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!isAdmin && order.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    res.json(order);
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, shippingCarrier } = req.body;
    const adminId = (req as any).user.userId;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(shippingCarrier && { shippingCarrier }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
        statusHistory: { create: { status, note: note || null, createdBy: adminId } },
      },
      include: { user: true, items: true },
    });

    const emailTo = order.user?.email || order.guestEmail;
    if (emailTo) {
      emailService.sendOrderStatusUpdate(emailTo, order.user?.firstName || 'Customer', order).catch(console.error);
    }

    res.json(order);
  } catch (err) { next(err); }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId }, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
          address: true,
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    res.json({ orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
};

export const trackOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber, email } = req.query;
    if (!orderNumber || !email) return res.status(400).json({ error: 'orderNumber and email required' });

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber as string,
        OR: [
          { user: { email: email as string } },
          { guestEmail: email as string },
        ],
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        address: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found. Check your order number and email.' });
    res.json(order);
  } catch (err) { next(err); }
};
