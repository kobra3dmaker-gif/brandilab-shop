import Stripe from 'stripe';
import { validateToken, getSession, notifyPayment, toCents } from './_snipcart.js';

const getAllowedOrigin = (request) => {
  const origin = request.headers.get('Origin');
  if (origin && (origin.endsWith('brandilab.it') || origin.startsWith('http://localhost:'))) {
    return origin;
  }
  return 'https://www.brandilab.it';
};

const getCorsHeaders = (request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

function json(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(request ? getCorsHeaders(request) : getCorsHeaders(new Request('https://www.brandilab.it'))), 'Content-Type': 'application/json' },
  });
}

function optionsHandler(request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return optionsHandler();

    const url = new URL(request.url);
    const path = url.pathname;

    try {
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

      return new Response('Not found', { status: 404, headers: getCorsHeaders(request) });
    } catch (e) {
      console.error('Unhandled error:', e);
      return json({ error: 'internal_error' }, 500, request);
    }
  },
};
