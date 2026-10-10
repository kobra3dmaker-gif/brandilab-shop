import Stripe from 'stripe';
import { validateToken, getSession, notifyPayment, toCents } from './_snipcart.js';
import { handleContact } from './contact.js';
import { handleAuthRoutes, getAuthenticatedUser } from './auth.js';
import { handleOrderRoutes } from './orders.js';

const getAllowedOrigin = (request) => {
  const origin = request.headers.get('Origin');
  if (origin && (origin.endsWith('brandilab.it') || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    return origin;
  }
  return 'https://www.brandilab.it';
};

const getCorsHeaders = (request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  'Access-Control-Allow-Credentials': 'true',
});

function json(data, status = 200, request, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...(request ? getCorsHeaders(request) : getCorsHeaders(new Request('https://www.brandilab.it'))),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function optionsHandler(request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return optionsHandler(request);

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // ── Customer Portal Auth & Address Book Routes ──
      if (path.startsWith('/api/auth/') || path.startsWith('/api/me/addresses')) {
        const authResult = await handleAuthRoutes(request, env, path);
        if (authResult) {
          return json(authResult.body, authResult.status, request, authResult.headers || {});
        }
      }

      // ── Customer Portal Orders, Stripe Session Confirmation & Admin Status FSM Routes ──
      if (
        path.startsWith('/api/me/orders') ||
        path.startsWith('/api/orders/') ||
        path.startsWith('/api/admin/orders')
      ) {
        const orderResult = await handleOrderRoutes(request, env, path, url);
        if (orderResult) {
          return json(orderResult.body, orderResult.status, request, orderResult.headers || {});
        }
      }

      if (path === '/api/payment-methods' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { publicToken } = body;
        if (!publicToken || !(await validateToken(publicToken))) {
          return json({ error: 'invalid_token' }, 401, request);
        }
        
        const SITE = env.SITE_URL || 'https://www.brandilab.it';
        return json([
          {
            id: 'wallet',
            name: 'Apple Pay / Google Pay',
            checkoutUrl: `${SITE}/pay?publicToken=${encodeURIComponent(publicToken)}`,
          },
        ], 200, request);
      }

      if (path === '/api/payment-session' && request.method === 'GET') {
        const publicToken = url.searchParams.get('publicToken');
        if (!publicToken || !(await validateToken(publicToken))) {
          return json({ error: 'invalid_token' }, 401, request);
        }
        try {
          const s = await getSession(publicToken);
          return json({ amount: s.invoice.amount, currency: s.invoice.currency }, 200, request);
        } catch {
          return json({ error: 'session_unavailable' }, 502, request);
        }
      }

      if (path === '/api/create-intent' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { publicToken } = body;
        if (!publicToken || !(await validateToken(publicToken))) {
          return json({ error: 'invalid_token' }, 401, request);
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY);
        try {
          const s = await getSession(publicToken);
          const intent = await stripe.paymentIntents.create(
            {
              amount: toCents(s.invoice.amount),
              currency: s.invoice.currency.toLowerCase(),
              automatic_payment_methods: { enabled: true },
              description: `Ordine Snipcart ${s.invoice.targetId}`,
              metadata: {
                snipcartPaymentSessionId: s.id,
                snipcartCartId: s.invoice.targetId,
              },
            },
            { idempotencyKey: `snipcart-${s.id}` }
          );
          return json({ clientSecret: intent.client_secret }, 200, request);
        } catch (e) {
          console.error('Stripe intent error:', e);
          return json({ error: 'intent_failed' }, 500, request);
        }
      }

      if (path === '/api/finalize' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { publicToken, paymentIntentId } = body;
        if (!publicToken || !paymentIntentId || !(await validateToken(publicToken))) {
          return json({ error: 'invalid_request' }, 401, request);
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY);
        try {
          const s = await getSession(publicToken);
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

          const verified =
            pi.status === 'succeeded' &&
            pi.metadata.snipcartPaymentSessionId === s.id &&
            pi.amount === toCents(s.invoice.amount);

          if (!verified) return json({ error: 'payment_not_verified' }, 400, request);

          const r = await notifyPayment({
            paymentSessionId: s.id,
            state: 'processed',
            transactionId: pi.id,
          }, env.SNIPCART_SECRET_API_KEY);
          
          if (!r.ok) {
            console.error('Snipcart payment update failed', r.status, await r.text());
            return json({ error: 'snipcart_update_failed' }, 502, request);
          }

          return json({ redirectUrl: s.paymentAuthorizationRedirectUrl }, 200, request);
        } catch (e) {
          console.error('Finalize error:', e);
          return json({ error: 'finalize_failed' }, 500, request);
        }
      }

      if (path === '/api/contact' && request.method === 'POST') {
        const { status, body } = await handleContact(request, env);
        return json(body, status, request);
      }

      // ── Stripe Checkout Session (replaces Snipcart & links to Customer Portal) ──
      if (path === '/api/create-checkout-session' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const { items: cartItems } = body;

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
          return json({ error: 'empty_cart' }, 400, request);
        }

        // Validate structure: each item must have id (string) and quantity (positive integer)
        for (const item of cartItems) {
          if (!item.id || typeof item.id !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1) {
            return json({ error: 'invalid_item' }, 400, request);
          }
        }

        try {
          // Check if customer is logged into the Customer Portal
          const authUser = await getAuthenticatedUser(request, env).catch(() => null);

          // Fetch product prices from Sanity (server-side — NEVER trust client prices)
          const ids = cartItems.map((i) => `"${i.id}"`).join(',');
          const query = `*[_type == "product" && _id in [${ids}]]{ _id, title, price, "imageUrl": image.asset->url }`;
          const sanityUrl = `https://aslz605n.api.sanity.io/v2023-05-03/data/query/production?query=${encodeURIComponent(query)}`;

          const sanityRes = await fetch(sanityUrl);
          if (!sanityRes.ok) {
            console.error('Sanity fetch failed:', sanityRes.status);
            return json({ error: 'product_lookup_failed' }, 502, request);
          }

          const { result: products } = await sanityRes.json();

          // Build a map for quick lookup
          const productMap = new Map();
          for (const p of products) {
            productMap.set(p._id, p);
          }

          // Verify all requested products exist and have prices
          const lineItems = [];
          for (const cartItem of cartItems) {
            const product = productMap.get(cartItem.id);
            if (!product || typeof product.price !== 'number') {
              return json({ error: 'product_not_found', id: cartItem.id }, 400, request);
            }

            lineItems.push({
              price_data: {
                currency: 'eur',
                product_data: {
                  name: product.title,
                  ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
                  metadata: {
                    productId: product._id,
                    sku: `BL-${product._id.slice(0, 6).toUpperCase()}`,
                  },
                },
                unit_amount: Math.round(product.price * 100),
              },
              quantity: cartItem.quantity,
            });
          }

          const SITE = env.SITE_URL || 'https://www.brandilab.it';

          const stripe = new Stripe(env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            ...(authUser?.email ? { customer_email: authUser.email } : {}),
            metadata: {
              ...(authUser?.id ? { userId: authUser.id } : {}),
            },
            // Enable all available payment methods (cards, Apple Pay, Google Pay, PayPal, etc.)
            // via Stripe Dashboard settings — no need to hardcode payment_method_types
            success_url: `${SITE}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE}/`,
            shipping_address_collection: {
              allowed_countries: ['IT', 'DE', 'FR', 'ES', 'AT', 'BE', 'NL', 'PT', 'CH', 'GB', 'US'],
            },
            phone_number_collection: {
              enabled: true
            }
          });

          return json({ url: session.url }, 200, request);
        } catch (e) {
          console.error('Checkout session error:', e);
          return json({ error: 'checkout_failed' }, 500, request);
        }
      }

      return new Response('Not found', { status: 404, headers: getCorsHeaders(request) });
    } catch (e) {
      console.error('Unhandled error:', e);
      return json({ error: 'internal_error' }, 500, request);
    }
  },
};
