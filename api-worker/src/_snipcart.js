const BASE = 'https://payment.snipcart.com/api';

export async function validateToken(publicToken) {
  const r = await fetch(
    `${BASE}/public/custom-payment-gateway/validate?publicToken=${encodeURIComponent(publicToken)}`
  );
  return r.ok;
}

export async function getSession(publicToken) {
  const r = await fetch(
    `${BASE}/public/custom-payment-gateway/payment-session?publicToken=${encodeURIComponent(publicToken)}`
  );
  if (!r.ok) throw new Error('snipcart_session_error');
  return r.json(); 
}

export function notifyPayment(body, apiKey) {
  return fetch(`${BASE}/private/custom-payment-gateway/payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export const toCents = (amount) => Math.round(amount * 100);
