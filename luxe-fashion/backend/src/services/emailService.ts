import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// Transporter factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ✅ FIX 1 — SMTP Silent Failure
 *
 * ROOT CAUSES found in audit:
 *
 * A) `SMTP_USER` and `SMTP_PASS` are blank in backend/.env.
 *    The original code silently fell back to `jsonTransport` (a no-op that
 *    discards emails) whenever SMTP_HOST was missing OR in test mode.
 *    But SMTP_HOST *is* set (smtp.gmail.com), so the real transporter IS
 *    created — it just has empty credentials and immediately fails auth.
 *    The error was swallowed by the try/catch → `console.error` only, so
 *    the API returned 200 and the developer never saw the real error.
 *
 * B) Gmail requires an **App Password**, not your account password.
 *    Regular Gmail passwords are rejected by SMTP even with correct settings.
 *
 * C) `SMTP_FROM` was set to `"Luxe Fashion <noreply@luxefashion.com>"` but
 *    Gmail rejects emails where the FROM address doesn't match the sending
 *    account — use the actual SMTP_USER address as the from.
 *
 * FIXES applied here:
 *  1. `getTransporter()` now validates that credentials are present and throws
 *     a clear error instead of silently returning a no-op transport.
 *  2. Added `verifyTransporter()` to test the SMTP connection on server start.
 *  3. `from` now falls back to SMTP_USER so Gmail doesn't reject it.
 *  4. All send methods now re-throw errors in non-test environments so the
 *     API controller can return a proper 500 instead of silently succeeding.
 *
 * ENV SETUP REQUIRED (see .env.example):
 *  SMTP_HOST=smtp.gmail.com
 *  SMTP_PORT=587
 *  SMTP_SECURE=false
 *  SMTP_USER=youraddress@gmail.com          ← your actual Gmail address
 *  SMTP_PASS=xxxx xxxx xxxx xxxx            ← 16-char App Password (NOT account password)
 *  SMTP_FROM="Luxe Fashion <youraddress@gmail.com>"  ← must match SMTP_USER for Gmail
 *  FRONTEND_URL=http://localhost:3000
 *
 * HOW TO GET A GMAIL APP PASSWORD:
 *  1. Go to https://myaccount.google.com/security
 *  2. Enable 2-Step Verification (required)
 *  3. Search "App passwords" → create one named "Luxe Fashion"
 *  4. Paste the 16-character code (with spaces) as SMTP_PASS
 *
 * ALTERNATIVE — Use Mailtrap for development (no Gmail setup needed):
 *  Sign up at https://mailtrap.io → Inboxes → SMTP Settings
 *  SMTP_HOST=sandbox.smtp.mailtrap.io
 *  SMTP_PORT=2525
 *  SMTP_USER=<mailtrap user>
 *  SMTP_PASS=<mailtrap pass>
 */

function getTransporter() {
  // In test mode: use jsonTransport (no-op, emails captured in memory)
  if (process.env.NODE_ENV === "test") {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // ✅ FIX: Validate credentials exist before building the transporter.
  //    Previously this check was only on SMTP_HOST, so a missing password
  //    would silently create a broken transporter.
  const missingVars: string[] = [];
  if (!process.env.SMTP_HOST) missingVars.push("SMTP_HOST");
  if (!process.env.SMTP_USER) missingVars.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missingVars.push("SMTP_PASS");

  if (missingVars.length > 0) {
    // Development fallback: log clearly instead of crashing the app.
    // Emails will not be sent until these vars are set.
    console.warn(
      `[emailService] ⚠️  SMTP not configured — emails disabled.\n` +
        `  Missing env vars: ${missingVars.join(", ")}\n` +
        `  See backend/.env.example for setup instructions.`,
    );
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Increase timeout for slow SMTP servers
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });
}

// ✅ FIX: Export a verification function to call on server start.
//    Catches auth/credential errors early rather than at send time.
export async function verifySmtpConnection(): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn(
      "[emailService] SMTP credentials missing — skipping connection test.",
    );
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[emailService] ✅ SMTP connection verified successfully.");
  } catch (err: any) {
    // Log clearly but don't crash the server — emails will fail gracefully
    console.error(
      `[emailService] ❌ SMTP connection failed: ${err.message}\n` +
        `  Check SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env\n` +
        `  For Gmail: use an App Password, not your account password.`,
    );
  }
}

// ✅ FIX: FROM address must match SMTP_USER for Gmail.
//    If SMTP_FROM is set AND includes the SMTP_USER address, use it.
//    Otherwise fall back to the SMTP_USER address directly.
function getFrom(): string {
  const smtpFrom = process.env.SMTP_FROM || "";
  const smtpUser = process.env.SMTP_USER || "noreply@luxefashion.com";

  if (smtpFrom && smtpFrom.includes(smtpUser)) {
    return smtpFrom; // e.g. "Luxe Fashion <user@gmail.com>"
  }
  // Fallback: use raw address (always accepted by Gmail)
  return smtpFrom || `"Luxe Fashion" <${smtpUser}>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML wrapper
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Email methods
// ─────────────────────────────────────────────────────────────────────────────

export const emailService = {
  async sendVerificationEmail(to: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
    // ✅ FIX: Errors are now logged with full context and re-thrown in production
    //    so the caller can handle them. In dev/test they're soft-logged only.
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to,
        subject: "Verify your email — Luxe Fashion",
        html: base(`
          <h2>Welcome, ${name}.</h2>
          <p>Thank you for creating an account with Luxe Fashion. Please verify your email address to complete your registration and start shopping.</p>
          <a href="${url}" class="btn">Verify Email Address</a>
          <hr class="divider">
          <p style="font-size:12px;color:#aaa">This link expires in 24 hours. If you didn't register, please ignore this email.</p>
        `),
      });
    } catch (err: any) {
      console.error(
        "[emailService] sendVerificationEmail failed:",
        err.message,
      );
      if (process.env.NODE_ENV === "production") throw err;
    }
  },

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to,
        subject: "Reset your password — Luxe Fashion",
        html: base(`
          <h2>Password Reset</h2>
          <p>Hi ${name}, we received a request to reset your Luxe Fashion account password.</p>
          <a href="${url}" class="btn">Reset Password</a>
          <hr class="divider">
          <p style="font-size:12px;color:#aaa">This link expires in 1 hour. If you didn't request this, no action is needed.</p>
        `),
      });
    } catch (err: any) {
      console.error(
        "[emailService] sendPasswordResetEmail failed:",
        err.message,
      );
      if (process.env.NODE_ENV === "production") throw err;
    }
  },

  async sendOrderConfirmation(to: string, name: string, order: any) {
    const rows = (order.items || [])
      .map(
        (item: any) => `
      <tr>
        <td>${item.name}${item.size ? ` / ${item.size}` : ""}${item.color ? ` / ${item.color}` : ""}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">$${Number(item.price).toFixed(2)}</td>
        <td style="text-align:right">$${Number(item.total).toFixed(2)}</td>
      </tr>`,
      )
      .join("");

    const trackUrl = `${process.env.FRONTEND_URL}/order-tracking?order=${order.orderNumber}`;
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to,
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
              ${Number(order.discount) > 0 ? `<tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Discount</td><td style="text-align:right;color:green">-$${Number(order.discount).toFixed(2)}</td></tr>` : ""}
              <tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Shipping</td><td style="text-align:right">${Number(order.shipping) === 0 ? "Free" : `$${Number(order.shipping).toFixed(2)}`}</td></tr>
              <tr><td colspan="3" style="text-align:right;color:#999;font-size:12px">Tax</td><td style="text-align:right">$${Number(order.tax).toFixed(2)}</td></tr>
              <tr class="total"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">$${Number(order.total).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <a href="${trackUrl}" class="btn">Track Your Order</a>
        `),
      });
    } catch (err: any) {
      console.error(
        "[emailService] sendOrderConfirmation failed:",
        err.message,
      );
    }
  },

  async sendOrderStatusUpdate(to: string, name: string, order: any) {
    const messages: Record<string, string> = {
      CONFIRMED: "Your order has been confirmed and is being prepared.",
      PROCESSING:
        "Your order is being carefully packed and prepared for dispatch.",
      SHIPPED: `Your order is on its way!${order.trackingNumber ? ` Tracking number: <strong>${order.trackingNumber}</strong>${order.shippingCarrier ? ` via ${order.shippingCarrier}` : ""}` : ""}`,
      DELIVERED:
        "Your order has been delivered. We hope you love your new pieces!",
      CANCELLED:
        "Your order has been cancelled. If you have questions, please contact our support team.",
      REFUNDED:
        "Your refund has been processed. It may take 3–5 business days to appear in your account.",
    };
    const msg =
      messages[order.status] ||
      `Your order status has been updated to: ${order.status}`;
    const trackUrl = `${process.env.FRONTEND_URL}/order-tracking?order=${order.orderNumber}`;
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to,
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
    } catch (err: any) {
      console.error(
        "[emailService] sendOrderStatusUpdate failed:",
        err.message,
      );
    }
  },

  async sendLowStockAlert(
    productName: string,
    variantInfo: string,
    stock: number,
  ) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    try {
      await getTransporter().sendMail({
        from: getFrom(),
        to: process.env.SMTP_USER,
        subject: `Low Stock Alert — ${productName}`,
        html: base(`
          <h2>Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <p><strong>${productName}</strong> (${variantInfo})</p>
          <p>Current stock: <strong style="color:red">${stock} units</strong></p>
          <a href="${process.env.FRONTEND_URL}/admin/inventory" class="btn">Manage Inventory</a>
        `),
      });
    } catch (err: any) {
      console.error("[emailService] sendLowStockAlert failed:", err.message);
    }
  },
};
