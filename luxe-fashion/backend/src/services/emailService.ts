import nodemailer from 'nodemailer';

function getTransporter() {
  if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
    // Return a no-op transporter in test/dev without SMTP
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const from = process.env.SMTP_FROM || '"Luxe Fashion" <noreply@luxefashion.com>';

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f7f5;color:#333}
    .wrap{max-width:600px;margin:40px auto;background:#fff;border:1px solid #e8e2db}
    .hdr{background:#1a1a1a;padding:32px;text-align:center}
    .hdr h1{color:#fff;font-size:22px;letter-spacing:6px;font-weight:300;text-transform:uppercase}
    .body{padding:40px 48px}
    .ftr{background:#f5f5f5;padding:20px;text-align:center;font-size:11px;color:#999}
    .btn{display:inline-block;background:#1a1a1a;color:#fff!important;padding:14px 32px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:24px 0}
    h2{font-size:20px;font-weight:400;color:#1a1a1a;margin-bottom:16px}
    p{color:#555;line-height:1.8;margin-bottom:12px;font-size:14px}
    table{width:100%;border-collapse:collapse;margin:20px 0;font-size:13px}
    th{background:#f5f5f5;padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:500}
    td{padding:11px 14px;border-bottom:1px solid #eee;color:#555}
    .total td{font-weight:600;font-size:15px;border-bottom:none;color:#1a1a1a}
    .divider{border:none;border-top:1px solid #eee;margin:24px 0}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr"><h1>Luxe Fashion</h1></div>
    <div class="body">${content}</div>
    <div class="ftr">
      © ${new Date().getFullYear()} Luxe Fashion. All rights reserved.<br>
      You're receiving this because you have an account or placed an order.
    </div>
  </div>
</body>
</html>`;

export const emailService = {
  async sendVerificationEmail(to: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    try {
      await getTransporter().sendMail({
        from, to,
        subject: 'Verify your email — Luxe Fashion',
        html: base(`
          <h2>Welcome, ${name}.</h2>
          <p>Thank you for creating an account with Luxe Fashion. Please verify your email address to complete your registration and start shopping.</p>
          <a href="${url}" class="btn">Verify Email Address</a>
          <hr class="divider">
          <p style="font-size:12px;color:#aaa">This link expires in 24 hours. If you didn't register, please ignore this email.</p>
        `),
      });
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }
  },

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    try {
      await getTransporter().sendMail({
        from, to,
        subject: 'Reset your password — Luxe Fashion',
        html: base(`
          <h2>Password Reset</h2>
          <p>Hi ${name}, we received a request to reset your Luxe Fashion account password.</p>
          <a href="${url}" class="btn">Reset Password</a>
          <hr class="divider">
          <p style="font-size:12px;color:#aaa">This link expires in 1 hour. If you didn't request this, no action is needed.</p>
        `),
      });
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  },

  async sendOrderConfirmation(to: string, name: string, order: any) {
    const rows = (order.items || []).map((item: any) => `
      <tr>
        <td>${item.name}${item.size ? ` / ${item.size}` : ''}${item.color ? ` / ${item.color}` : ''}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">$${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">$${Number(item.total).toFixed(2)}</td>
      </tr>`).join('');

    const trackUrl = `${process.env.FRONTEND_URL}/order-tracking?order=${order.orderNumber}`;
    try {
      await getTransporter().sendMail({
        from, to,
        subject: `Order Confirmed — ${order.orderNumber}`,
        html: base(`
          <h2>Order Confirmed</h2>
          <p>Hi ${name}, thank you for your order! We'll get it ready and notify you when it ships.</p>
          <p><strong>Order:</strong> ${order.orderNumber} &nbsp;|&nbsp; <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <table>
            <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>
              ${rows}
              <tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Subtotal</td><td style="text-align:right">$${Number(order.subtotal).toFixed(2)}</td></tr>
              ${Number(order.discount) > 0 ? `<tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Discount</td><td style="text-align:right;color:green">-$${Number(order.discount).toFixed(2)}</td></tr>` : ''}
              <tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Shipping</td><td style="text-align:right">${Number(order.shipping) === 0 ? 'Free' : `$${Number(order.shipping).toFixed(2)}`}</td></tr>
              <tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Tax</td><td style="text-align:right">$${Number(order.tax).toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">$${Number(order.total).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <a href="${trackUrl}" class="btn">Track Your Order</a>
        `),
      });
    } catch (err) {
      console.error('Failed to send order confirmation:', err);
    }
  },

  async sendOrderStatusUpdate(to: string, name: string, order: any) {
    const messages: Record<string, string> = {
      CONFIRMED:  'Your order has been confirmed and is being prepared.',
      PROCESSING: 'Your order is being carefully packed and prepared for dispatch.',
      SHIPPED:    `Your order is on its way!${order.trackingNumber ? ` Tracking number: <strong>${order.trackingNumber}</strong>${order.shippingCarrier ? ` via ${order.shippingCarrier}` : ''}` : ''}`,
      DELIVERED:  'Your order has been delivered. We hope you love your new pieces!',
      CANCELLED:  'Your order has been cancelled. If you have questions, please contact our support team.',
      REFUNDED:   'Your refund has been processed. It may take 3–5 business days to appear in your account.',
    };

    const msg = messages[order.status] || `Your order status has been updated to: ${order.status}`;
    const trackUrl = `${process.env.FRONTEND_URL}/order-tracking?order=${order.orderNumber}`;

    try {
      await getTransporter().sendMail({
        from, to,
        subject: `Order Update: ${order.orderNumber} — ${order.status}`,
        html: base(`
          <h2>Order Update</h2>
          <p>Hi ${name},</p>
          <p>${msg}</p>
          <p style="margin-top:16px"><strong>Order:</strong> ${order.orderNumber}</p>
          <a href="${trackUrl}" class="btn">View Order Status</a>
          <hr class="divider">
          <p style="font-size:12px;color:#aaa">Reply to this email if you need any help with your order.</p>
        `),
      });
    } catch (err) {
      console.error('Failed to send order status update:', err);
    }
  },

  async sendLowStockAlert(productName: string, variantInfo: string, stock: number) {
    if (!process.env.SMTP_USER) return;
    try {
      await getTransporter().sendMail({
        from, to: process.env.SMTP_USER,
        subject: `Low Stock Alert — ${productName}`,
        html: base(`
          <h2>Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <p><strong>${productName}</strong> (${variantInfo})</p>
          <p>Current stock: <strong style="color:red">${stock} units</strong></p>
          <a href="${process.env.FRONTEND_URL}/admin/inventory" class="btn">Manage Inventory</a>
        `),
      });
    } catch (err) {
      console.error('Failed to send low stock alert:', err);
    }
  },
};
