import Stripe from 'stripe';
import { getAuthenticatedUser } from './auth.js';

/**
 * BrandiLab Customer Portal — Order Management, Timeline FSM & Zero-Trust Queries
 */

export const ORDER_STATES = {
  RICEVUTO: 'RICEVUTO',
  IN_LAVORAZIONE: 'IN_LAVORAZIONE',
  SPEDITO: 'SPEDITO',
  IN_CONSEGNA: 'IN_CONSEGNA',
  CONSEGNATO: 'CONSEGNATO',
  PROBLEMA_CONSEGNA: 'PROBLEMA_CONSEGNA',
  ANNULLATO: 'ANNULLATO',
};

export const ALLOWED_TRANSITIONS = {
  RICEVUTO: ['IN_LAVORAZIONE', 'SPEDITO', 'ANNULLATO'],
  IN_LAVORAZIONE: ['SPEDITO', 'ANNULLATO'],
  SPEDITO: ['IN_CONSEGNA', 'CONSEGNATO', 'PROBLEMA_CONSEGNA'],
  IN_CONSEGNA: ['CONSEGNATO', 'PROBLEMA_CONSEGNA'],
  PROBLEMA_CONSEGNA: ['IN_CONSEGNA', 'CONSEGNATO', 'ANNULLATO'],
  CONSEGNATO: [],
  ANNULLATO: [],
};

const DEFAULT_STATE_META = {
  RICEVUTO: {
    title: 'Ordine ricevuto',
    description: 'Pagamento confermato. Il tuo ordine è stato registrato nel nostro sistema.',
  },
  IN_LAVORAZIONE: {
    title: 'In stampa 3D e controllo qualità',
    description: 'Stiamo stampando il tuo pezzo strato dopo strato nel nostro laboratorio.',
  },
  SPEDITO: {
    title: 'Spedito con corriere',
    description: 'Il pacco è stato affidato al corriere ed è in viaggio verso di te.',
  },
  IN_CONSEGNA: {
    title: 'In consegna oggi',
    description: 'Il corriere è uscito per la consegna al tuo indirizzo.',
  },
  CONSEGNATO: {
    title: 'Consegnato',
    description: 'Il pacco è stato consegnato all’indirizzo indicato.',
  },
  PROBLEMA_CONSEGNA: {
    title: 'Attenzione: aggiornamento sulla consegna',
    description: 'Il corriere ha segnalato un imprevisto durante la consegna.',
  },
  ANNULLATO: {
    title: 'Ordine annullato',
    description: 'Questo ordine è stato annullato.',
  },
};

export function resolveCarrierTrackingUrl(carrierName, trackingNumber, customUrl) {
  if (customUrl && String(customUrl).trim()) return String(customUrl).trim();
  if (!trackingNumber) return null;
  const code = encodeURIComponent(String(trackingNumber).trim());
  const c = String(carrierName || '').toLowerCase();

  if (c.includes('brt') || c.includes('bartolini') || c.includes('dpd')) {
    return `https://vas.brt.it/vas/sped_det_show.hsm?chisono=${code}`;
  }
  if (c.includes('poste') || c.includes('sda') || c.includes('crono')) {
    return `https://www.poste.it/cerca/index.html#/risultati-ricerca/${code}`;
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/it-it/home/tracciabilita.html?tracking-id=${code}`;
  }
  if (c.includes('gls')) {
    return `https://www.gls-italy.com/it/servizi-per-destinatari/dettaglio-spedizione?numero_spedizione=${code}&tipo_ricerca=nazionale`;
  }
  if (c.includes('inpost')) {
    return `https://inpost.it/trova-il-tuo-pacco?number=${code}`;
  }
  if (c.includes('ups')) {
    return `https://www.ups.com/track?loc=it_IT&tracknum=${code}`;
  }
  return null;
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) {
    suffix += chars[bytes[i] % chars.length];
  }
  return `ORD-${year}-${suffix}`;
}

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return `RIC-${year}-${String(num % 1000000).padStart(6, '0')}`;
}

function safeJsonParse(raw, fallback = {}) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function formatOrderRow(orderRow, items = [], history = []) {
  return {
    id: orderRow.id,
    orderNumber: orderRow.order_number,
    customerEmail: orderRow.customer_email || '',
    status: orderRow.status,
    currency: orderRow.currency || 'eur',
    subtotal: (orderRow.subtotal_cents || 0) / 100,
    shippingCost: (orderRow.shipping_cents || 0) / 100,
    discount: (orderRow.discount_cents || 0) / 100,
    tax: (orderRow.tax_cents || 0) / 100,
    total: (orderRow.total_cents || 0) / 100,
    shippingAddress: safeJsonParse(orderRow.shipping_address_json, {
      recipientName: '',
      line1: '',
      city: '',
      postalCode: '',
      country: 'IT',
    }),
    billingAddress: orderRow.billing_address_json ? safeJsonParse(orderRow.billing_address_json, null) : null,
    paymentMethodSummary: orderRow.payment_method_summary || 'Stripe Checkout',
    carrierName: orderRow.carrier_name || null,
    trackingNumber: orderRow.tracking_number || null,
    trackingUrl: orderRow.tracking_url || null,
    estimatedDelivery: orderRow.estimated_delivery || null,
    receiptNumber: orderRow.receipt_number || null,
    createdAt: orderRow.created_at,
    updatedAt: orderRow.updated_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id || null,
      sku: item.sku_snapshot,
      title: item.title_snapshot,
      imageUrl: item.image_url_snapshot || '',
      quantity: item.quantity,
      unitPrice: (item.unit_price_cents || 0) / 100,
      totalPrice: (item.total_price_cents || 0) / 100,
    })),
    statusHistory: history.map((h) => ({
      id: h.id,
      status: h.status,
      title: h.title,
      description: h.description || '',
      createdAt: h.created_at,
    })),
  };
}

async function hydrateOrders(db, orderRows) {
  if (!orderRows || orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const placeholders = orderIds.map((_, i) => `?${i + 1}`).join(',');

  const [itemsResult, historyResult] = await Promise.all([
    db
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
      .bind(...orderIds)
      .all(),
    db
      .prepare(`SELECT * FROM order_status_history WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`)
      .bind(...orderIds)
      .all(),
  ]);

  const itemsByOrder = new Map();
  for (const item of itemsResult.results || []) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
    itemsByOrder.get(item.order_id).push(item);
  }

  const historyByOrder = new Map();
  for (const h of historyResult.results || []) {
    if (!historyByOrder.has(h.order_id)) historyByOrder.set(h.order_id, []);
    historyByOrder.get(h.order_id).push(h);
  }

  return orderRows.map((row) =>
    formatOrderRow(row, itemsByOrder.get(row.id) || [], historyByOrder.get(row.id) || []),
  );
}

function isAdminAuthorized(request, env) {
  const adminSecret = env.ADMIN_SECRET || 'brandilab2026';
  const headerKey =
    request.headers.get('X-Admin-Key') ||
    (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  return Boolean(headerKey && headerKey === adminSecret);
}

export async function handleOrderRoutes(request, env, path, url) {
  if (!env.DB) {
    return { status: 503, body: { error: 'db_not_configured' } };
  }

  // ── 1. POST /api/orders/confirm-session (Stripe Checkout Confirmation -> D1 Snapshot) ──
  if (path === '/api/orders/confirm-session' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const sessionId = String(body.sessionId || '').trim();
    if (!sessionId) {
      return { status: 400, body: { error: 'missing_session_id' } };
    }

    const authUser = await getAuthenticatedUser(request, env);

    // Check if order was already persisted for this Stripe session (idempotent)
    const existingOrder = await env.DB.prepare('SELECT * FROM orders WHERE stripe_session_id = ?1')
      .bind(sessionId)
      .first();

    if (existingOrder) {
      if (authUser && !existingOrder.user_id && existingOrder.customer_email.toLowerCase() === authUser.email.toLowerCase()) {
        await env.DB.prepare('UPDATE orders SET user_id = ?1 WHERE id = ?2').bind(authUser.id, existingOrder.id).run();
        existingOrder.user_id = authUser.id;
      }
      const [hydrated] = await hydrateOrders(env.DB, [existingOrder]);
      return { status: 200, body: { order: hydrated } };
    }

    if (!env.STRIPE_SECRET_KEY) {
      return { status: 503, body: { error: 'stripe_not_configured' } };
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price.product', 'payment_intent.payment_method'],
      });
    } catch (e) {
      console.error('Failed to retrieve Stripe session:', e);
      return { status: 404, body: { error: 'session_not_found' } };
    }

    if (session.payment_status !== 'paid') {
      return { status: 400, body: { error: 'payment_not_completed' } };
    }

    const customerEmail = (
      session.customer_details?.email ||
      session.customer_email ||
      authUser?.email ||
      'cliente@brandilab.it'
    )
      .trim()
      .toLowerCase();

    let userId = session.metadata?.userId || authUser?.id || null;
    if (!userId && customerEmail) {
      const matchedUser = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?1')
        .bind(customerEmail)
        .first();
      if (matchedUser) userId = matchedUser.id;
    }

    const shippingDetails = session.shipping_details || session.customer_details;
    const addr = shippingDetails?.address || {};
    const shippingSnapshot = {
      recipientName: shippingDetails?.name || `${authUser?.firstName || ''} ${authUser?.lastName || ''}`.trim() || 'Cliente',
      line1: addr.line1 || 'Indirizzo confermato su Stripe',
      line2: addr.line2 || '',
      city: addr.city || '',
      postalCode: addr.postal_code || '',
      province: addr.state || '',
      country: addr.country || 'IT',
      phone: session.customer_details?.phone || authUser?.phone || '',
    };

    let paymentSummary = 'Pagamento sicuro con Stripe';
    const pm = session.payment_intent?.payment_method;
    if (pm && typeof pm === 'object' && pm.card) {
      const brand = (pm.card.brand || 'Carta').toUpperCase();
      paymentSummary = `${brand} •••• ${pm.card.last4}`;
    }

    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();
    const receiptNumber = generateReceiptNumber();
    const now = new Date().toISOString();
    const estimatedDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

    const totalCents = session.amount_total ?? 0;
    const subtotalCents = session.amount_subtotal ?? totalCents;
    const shippingCents = session.total_details?.amount_shipping ?? 0;
    const discountCents = session.total_details?.amount_discount ?? 0;
    const taxCents = Math.round(totalCents - totalCents / 1.22);

    const statements = [
      env.DB.prepare(
        `INSERT INTO orders (
          id, order_number, user_id, customer_email, status, currency,
          subtotal_cents, shipping_cents, discount_cents, tax_cents, total_cents,
          shipping_address_json, payment_method_summary, stripe_session_id,
          estimated_delivery, receipt_number, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?17)`,
      ).bind(
        orderId,
        orderNumber,
        userId,
        customerEmail,
        ORDER_STATES.RICEVUTO,
        (session.currency || 'eur').toLowerCase(),
        subtotalCents,
        shippingCents,
        discountCents,
        taxCents,
        totalCents,
        JSON.stringify(shippingSnapshot),
        paymentSummary,
        sessionId,
        estimatedDelivery,
        receiptNumber,
        now,
      ),
      env.DB.prepare(
        `INSERT INTO order_status_history (id, order_id, status, title, description, author, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'stripe', ?6)`,
      ).bind(
        crypto.randomUUID(),
        orderId,
        ORDER_STATES.RICEVUTO,
        DEFAULT_STATE_META.RICEVUTO.title,
        DEFAULT_STATE_META.RICEVUTO.description,
        now,
      ),
    ];

    const lineItems = session.line_items?.data || [];
    for (const li of lineItems) {
      const productObj = typeof li.price?.product === 'object' ? li.price.product : null;
      const productId = productObj?.metadata?.productId || null;
      const skuSnapshot = productObj?.metadata?.sku || (productId ? `BL-${productId.slice(0, 6).toUpperCase()}` : 'BL-3D');
      const titleSnapshot = li.description || productObj?.name || 'Prodotto BrandiLab 3D';
      const imageUrlSnapshot = productObj?.images?.[0] || '';
      const qty = li.quantity || 1;
      const unitCents = li.price?.unit_amount ?? Math.round((li.amount_total || 0) / qty);
      const lineTotalCents = li.amount_total ?? unitCents * qty;

      statements.push(
        env.DB.prepare(
          `INSERT INTO order_items (
            id, order_id, product_id, sku_snapshot, title_snapshot, image_url_snapshot,
            quantity, unit_price_cents, total_price_cents
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
        ).bind(
          crypto.randomUUID(),
          orderId,
          productId,
          skuSnapshot,
          titleSnapshot,
          imageUrlSnapshot,
          qty,
          unitCents,
          lineTotalCents,
        ),
      );
    }

    await env.DB.batch(statements);

    const createdRow = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
    const [hydrated] = await hydrateOrders(env.DB, [createdRow]);
    return { status: 201, body: { order: hydrated } };
  }

  // ── 2. ADMIN ROUTES (List all orders, Create order, Update status & tracking, Delete) ──
  if (path.startsWith('/api/admin/orders')) {
    if (!isAdminAuthorized(request, env)) {
      return { status: 401, body: { error: 'unauthorized_admin' } };
    }

    // GET /api/admin/orders — List all customer orders
    if (path === '/api/admin/orders' && request.method === 'GET') {
      const { results: rows } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
      const orders = await hydrateOrders(env.DB, rows || []);
      return { status: 200, body: { orders } };
    }

    // POST /api/admin/orders — Create an order for a customer (auto-links by email)
    if (path === '/api/admin/orders' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const customerEmail = String(body.customerEmail || '').trim().toLowerCase();
      const itemsInput = Array.isArray(body.items) ? body.items : [];

      if (!customerEmail || itemsInput.length === 0) {
        return { status: 400, body: { error: 'invalid_admin_order_fields' } };
      }

      const matchedUser = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?1')
        .bind(customerEmail)
        .first();
      const userId = matchedUser ? matchedUser.id : null;

      const orderId = crypto.randomUUID();
      const orderNumber = body.orderNumber ? String(body.orderNumber).trim().toUpperCase() : generateOrderNumber();
      const receiptNumber = generateReceiptNumber();
      const now = new Date().toISOString();
      const initialStatus = ORDER_STATES[body.status] || ORDER_STATES.RICEVUTO;

      let subtotalCents = 0;
      const itemStatements = [];
      for (const item of itemsInput) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const unitCents = Math.max(0, Math.round((Number(item.unitPrice) || 0) * 100));
        const totalLineCents = unitCents * qty;
        subtotalCents += totalLineCents;

        itemStatements.push(
          env.DB.prepare(
            `INSERT INTO order_items (
              id, order_id, product_id, sku_snapshot, title_snapshot, image_url_snapshot,
              quantity, unit_price_cents, total_price_cents
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
          ).bind(
            crypto.randomUUID(),
            orderId,
            item.productId || null,
            String(item.sku || 'BL-CUSTOM').trim(),
            String(item.title || 'Prodotto BrandiLab 3D').trim(),
            String(item.imageUrl || '').trim(),
            qty,
            unitCents,
            totalLineCents,
          ),
        );
      }

      const shippingCents = Math.max(0, Math.round((Number(body.shippingCost) || 0) * 100));
      const totalCents = subtotalCents + shippingCents;
      const taxCents = Math.round(totalCents - totalCents / 1.22);

      const shippingSnapshot = {
        recipientName: String(body.shippingAddress?.recipientName || 'Cliente').trim(),
        line1: String(body.shippingAddress?.line1 || '').trim(),
        line2: String(body.shippingAddress?.line2 || '').trim(),
        city: String(body.shippingAddress?.city || '').trim(),
        postalCode: String(body.shippingAddress?.postalCode || '').trim(),
        province: String(body.shippingAddress?.province || '').trim(),
        country: String(body.shippingAddress?.country || 'IT').trim(),
        phone: String(body.shippingAddress?.phone || '').trim(),
      };

      const carrierName = body.carrierName ? String(body.carrierName).trim() : null;
      const trackingNumber = body.trackingNumber ? String(body.trackingNumber).trim() : null;
      const trackingUrl = resolveCarrierTrackingUrl(carrierName, trackingNumber, body.trackingUrl);
      const estimatedDelivery =
        body.estimatedDelivery || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

      const meta = DEFAULT_STATE_META[initialStatus] || DEFAULT_STATE_META.RICEVUTO;

      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO orders (
            id, order_number, user_id, customer_email, status, currency,
            subtotal_cents, shipping_cents, discount_cents, tax_cents, total_cents,
            shipping_address_json, payment_method_summary, carrier_name, tracking_number,
            tracking_url, estimated_delivery, receipt_number, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, 'eur', ?6, ?7, 0, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?17)`,
        ).bind(
          orderId,
          orderNumber,
          userId,
          customerEmail,
          initialStatus,
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          JSON.stringify(shippingSnapshot),
          String(body.paymentMethodSummary || 'Stripe / Bonifico').trim(),
          carrierName,
          trackingNumber,
          trackingUrl,
          estimatedDelivery,
          receiptNumber,
          now,
        ),
        ...itemStatements,
        env.DB.prepare(
          `INSERT INTO order_status_history (id, order_id, status, title, description, author, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, 'admin', ?6)`,
        ).bind(crypto.randomUUID(), orderId, initialStatus, meta.title, meta.description, now),
      ]);

      const createdRow = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
      const [hydrated] = await hydrateOrders(env.DB, [createdRow]);
      return { status: 201, body: { order: hydrated } };
    }

    // PATCH /api/admin/orders/:id/status — Update status, carrier, tracking & customer timeline
    const adminStatusMatch = path.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
    if (adminStatusMatch && (request.method === 'PATCH' || request.method === 'POST')) {
      const orderIdentifier = decodeURIComponent(adminStatusMatch[1]);
      const body = await request.json().catch(() => ({}));
      const nextStatus = String(body.status || '').trim().toUpperCase();

      if (!ORDER_STATES[nextStatus]) {
        return { status: 400, body: { error: 'invalid_status', allowed: Object.keys(ORDER_STATES) } };
      }

      const orderRow = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1 OR order_number = ?1')
        .bind(orderIdentifier)
        .first();

      if (!orderRow) {
        return { status: 404, body: { error: 'order_not_found' } };
      }

      const now = new Date().toISOString();
      const carrierName =
        body.carrierName !== undefined ? String(body.carrierName || '').trim() || null : orderRow.carrier_name;
      const trackingNumber =
        body.trackingNumber !== undefined ? String(body.trackingNumber || '').trim() || null : orderRow.tracking_number;
      const trackingUrl = resolveCarrierTrackingUrl(
        carrierName,
        trackingNumber,
        body.trackingUrl !== undefined ? body.trackingUrl : orderRow.tracking_url,
      );
      const estimatedDelivery =
        body.estimatedDelivery !== undefined
          ? String(body.estimatedDelivery || '').trim() || null
          : orderRow.estimated_delivery;

      const meta = DEFAULT_STATE_META[nextStatus] || { title: nextStatus, description: '' };
      const eventTitle = String(
        body.title ||
          (nextStatus === ORDER_STATES.SPEDITO && carrierName
            ? `Spedito con corriere ${carrierName}`
            : meta.title),
      ).trim();

      const eventDescription = String(
        body.description ||
          (nextStatus === ORDER_STATES.SPEDITO && trackingNumber
            ? `Pacco affidato a ${carrierName || 'corriere espresso'}. Codice di tracciamento: ${trackingNumber}.`
            : meta.description),
      ).trim();

      await env.DB.batch([
        env.DB.prepare(
          `UPDATE orders
           SET status = ?1, carrier_name = ?2, tracking_number = ?3, tracking_url = ?4, estimated_delivery = ?5, updated_at = ?6
           WHERE id = ?7`,
        ).bind(nextStatus, carrierName, trackingNumber, trackingUrl, estimatedDelivery, now, orderRow.id),
        env.DB.prepare(
          `INSERT INTO order_status_history (id, order_id, status, title, description, author, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, 'admin', ?6)`,
        ).bind(crypto.randomUUID(), orderRow.id, nextStatus, eventTitle, eventDescription, now),
      ]);

      const updatedRow = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderRow.id).first();
      const [hydrated] = await hydrateOrders(env.DB, [updatedRow]);
      return { status: 200, body: { order: hydrated } };
    }

    // DELETE /api/admin/orders/:id
    const adminDeleteMatch = path.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (adminDeleteMatch && request.method === 'DELETE') {
      const orderIdentifier = decodeURIComponent(adminDeleteMatch[1]);
      await env.DB.prepare('DELETE FROM orders WHERE id = ?1 OR order_number = ?1').bind(orderIdentifier).run();
      return { status: 200, body: { ok: true } };
    }
  }

  // ── 3. CUSTOMER PORTAL ROUTES (Strict Zero-Trust BOLA / IDOR Protection) ──
  if (path.startsWith('/api/me/orders')) {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return { status: 401, body: { error: 'unauthorized' } };
    }

    // GET /api/me/orders — List all orders belonging ONLY to authenticated user
    if (path === '/api/me/orders' && request.method === 'GET') {
      const statusFilter = (url.searchParams.get('status') || 'all').toLowerCase();
      const periodFilter = (url.searchParams.get('period') || 'all').toLowerCase();
      const searchQ = (url.searchParams.get('q') || '').trim().toLowerCase();

      const { results: userOrderRows } = await env.DB.prepare(
        'SELECT * FROM orders WHERE user_id = ?1 ORDER BY created_at DESC',
      )
        .bind(user.id)
        .all();

      let orders = await hydrateOrders(env.DB, userOrderRows || []);

      if (statusFilter === 'active') {
        orders = orders.filter((o) =>
          ['RICEVUTO', 'IN_LAVORAZIONE', 'SPEDITO', 'IN_CONSEGNA', 'PROBLEMA_CONSEGNA'].includes(o.status),
        );
      } else if (statusFilter === 'delivered') {
        orders = orders.filter((o) => o.status === 'CONSEGNATO');
      } else if (statusFilter === 'cancelled') {
        orders = orders.filter((o) => o.status === 'ANNULLATO');
      }

      if (periodFilter === 'last3months') {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        orders = orders.filter((o) => o.createdAt >= cutoff);
      } else if (/^\d{4}$/.test(periodFilter)) {
        orders = orders.filter((o) => o.createdAt.startsWith(periodFilter));
      }

      if (searchQ) {
        orders = orders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchQ) ||
            (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQ)) ||
            o.items.some(
              (item) =>
                item.title.toLowerCase().includes(searchQ) || item.sku.toLowerCase().includes(searchQ),
            ),
        );
      }

      return { status: 200, body: { orders } };
    }

    // GET /api/me/orders/:id — Single order detail (strictly scoped by user_id)
    const detailMatch = path.match(/^\/api\/me\/orders\/([^/]+)$/);
    if (detailMatch && request.method === 'GET') {
      const orderKey = decodeURIComponent(detailMatch[1]);

      const orderRow = await env.DB.prepare(
        'SELECT * FROM orders WHERE (id = ?1 OR order_number = ?1) AND user_id = ?2',
      )
        .bind(orderKey, user.id)
        .first();

      if (!orderRow) {
        return { status: 404, body: { error: 'order_not_found' } };
      }

      const [order] = await hydrateOrders(env.DB, [orderRow]);
      return { status: 200, body: { order } };
    }

    // GET /api/me/orders/:id/receipt — Protected fiscal receipt endpoint
    const receiptMatch = path.match(/^\/api\/me\/orders\/([^/]+)\/receipt$/);
    if (receiptMatch && request.method === 'GET') {
      const orderKey = decodeURIComponent(receiptMatch[1]);

      const orderRow = await env.DB.prepare(
        'SELECT * FROM orders WHERE (id = ?1 OR order_number = ?1) AND user_id = ?2',
      )
        .bind(orderKey, user.id)
        .first();

      if (!orderRow) {
        return { status: 404, body: { error: 'order_not_found' } };
      }

      const [order] = await hydrateOrders(env.DB, [orderRow]);
      return {
        status: 200,
        body: {
          receipt: {
            receiptNumber: order.receiptNumber || `RIC-${order.orderNumber}`,
            orderNumber: order.orderNumber,
            issuedAt: order.createdAt,
            merchant: {
              name: 'BrandiLab — Studio di Stampa 3D',
              vat: 'IT04260600368',
              address: '41026 Pavullo nel Frignano (MO), Italia',
              email: 'brandilab3d@gmail.com',
            },
            customer: order.shippingAddress,
            paymentMethod: order.paymentMethodSummary,
            items: order.items,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            discount: order.discount,
            tax: order.tax,
            total: order.total,
            currency: order.currency,
          },
        },
      };
    }
  }

  return null;
}
