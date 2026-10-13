import { EmailMessage } from 'cloudflare:email';

/**
 * BrandiLab Customer Portal — Authentication & Address Book Module
 * - Password hashing: PBKDF2-HMAC-SHA256 (100,000 iterations) with 16-byte random salt
 * - Token signing: HMAC-SHA256 JWT (7 days validity) via Web Crypto API
 * - Password reset: CSPRNG one-time token stored strictly as SHA-256 hash
 * - Zero-Trust identity extraction: user_id is NEVER read from client body/query
 */

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

const encoder = new TextEncoder();

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function base64UrlEncode(input) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecodeToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(salt),
  };
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

function getJwtSecret(env) {
  return env.JWT_SECRET || 'brandilab-dev-jwt-secret-change-in-production-2026';
}

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(payload, env) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(fullPayload))}`;
  const key = await getHmacKey(getJwtSecret(env));
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export async function verifyJwt(token, env) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  try {
    const key = await getHmacKey(getJwtSecret(env));
    const sigBytes = base64UrlDecodeToBytes(signatureB64);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(signingInput));
    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecodeToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now || !payload.sub) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractTokenFromRequest(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)bl_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildSessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `bl_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Extracts and verifies the authenticated user strictly from the request token/cookie.
 * Returns { id, email, firstName, lastName, phone } or null.
 */
export async function getAuthenticatedUser(request, env) {
  const token = extractTokenFromRequest(request);
  if (!token) return null;

  const payload = await verifyJwt(token, env);
  if (!payload || !payload.sub) return null;

  if (!env.DB) {
    return {
      id: payload.sub,
      email: payload.email || '',
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      phone: '',
    };
  }

  const user = await env.DB.prepare(
    'SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?1',
  )
    .bind(payload.sub)
    .first();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone || '',
    createdAt: user.created_at,
  };
}

/**
 * Links any previously placed guest orders with the same email to the newly registered/logged-in user.
 */
async function claimUnlinkedOrdersByEmail(db, userId, email) {
  try {
    await db
      .prepare('UPDATE orders SET user_id = ?1, updated_at = ?2 WHERE lower(customer_email) = lower(?3) AND user_id IS NULL')
      .bind(userId, new Date().toISOString(), email)
      .run();
  } catch (e) {
    console.warn('Could not auto-claim guest orders:', e);
  }
}

export async function handleAuthRoutes(request, env, path) {
  if (!env.DB) {
    return { status: 503, body: { error: 'db_not_configured' } };
  }

  // ── POST /api/auth/register ──
  if (path === '/api/auth/register' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const firstName = String(body.firstName || '').trim().slice(0, 80);
    const lastName = String(body.lastName || '').trim().slice(0, 80);
    const phone = String(body.phone || '').trim().slice(0, 40);

    if (!EMAIL_RE.test(email) || password.length < 8 || !firstName || !lastName) {
      return { status: 400, body: { error: 'invalid_registration_fields' } };
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?1').bind(email).first();
    if (existing) {
      return { status: 409, body: { error: 'email_already_registered' } };
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { hash, salt } = await hashPassword(password);

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, password_salt, first_name, last_name, phone, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)`,
    )
      .bind(userId, email, hash, salt, firstName, lastName, phone, now)
      .run();

    await claimUnlinkedOrdersByEmail(env.DB, userId, email);

    const token = await signJwt({ sub: userId, email, firstName, lastName }, env);
    return {
      status: 201,
      headers: { 'Set-Cookie': buildSessionCookie(token) },
      body: {
        token,
        user: { id: userId, email, firstName, lastName, phone, createdAt: now },
      },
    };
  }

  // ── POST /api/auth/login ──
  if (path === '/api/auth/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!EMAIL_RE.test(email) || !password) {
      return { status: 400, body: { error: 'invalid_credentials' } };
    }

    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, password_salt, first_name, last_name, phone, created_at FROM users WHERE lower(email) = ?1',
    )
      .bind(email)
      .first();

    if (!user) {
      // Perform dummy PBKDF2 computation to prevent timing-based user enumeration
      await hashPassword(password, '00112233445566778899aabbccddeeff');
      return { status: 401, body: { error: 'invalid_credentials' } };
    }

    const { hash } = await hashPassword(password, user.password_salt);
    if (!timingSafeEqualHex(hash, user.password_hash)) {
      return { status: 401, body: { error: 'invalid_credentials' } };
    }

    await claimUnlinkedOrdersByEmail(env.DB, user.id, user.email);

    const token = await signJwt(
      { sub: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
      env,
    );

    return {
      status: 200,
      headers: { 'Set-Cookie': buildSessionCookie(token) },
      body: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone || '',
          createdAt: user.created_at,
        },
      },
    };
  }

  // ── POST /api/auth/logout ──
  if (path === '/api/auth/logout' && request.method === 'POST') {
    return {
      status: 200,
      headers: { 'Set-Cookie': buildSessionCookie('', 0) },
      body: { ok: true },
    };
  }

  // ── POST /api/auth/forgot-password ──
  if (path === '/api/auth/forgot-password' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    // Always return the exact same response to prevent user enumeration
    if (!EMAIL_RE.test(email)) {
      return { status: 200, body: { ok: true } };
    }

    const user = await env.DB.prepare('SELECT id, email, first_name FROM users WHERE lower(email) = ?1')
      .bind(email)
      .first();

    if (user) {
      const rawTokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const rawToken = bytesToHex(rawTokenBytes);
      const tokenHash = await sha256Hex(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

      await env.DB.prepare(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
        .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt, new Date().toISOString())
        .run();

      const siteUrl = env.SITE_URL || 'https://www.brandilab.it';
      const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      if (env.CONTACT_EMAIL) {
        try {
          const from = env.CONTACT_FROM || 'sito@brandilab.it';
          const mime = buildResetEmailMime({
            from,
            to: user.email,
            firstName: user.first_name,
            resetUrl,
          });
          await env.CONTACT_EMAIL.send(new EmailMessage(from, user.email, mime));
        } catch (err) {
          console.error('Failed to send password reset email:', err);
        }
      }
    }

    return { status: 200, body: { ok: true } };
  }

  // ── POST /api/auth/reset-password ──
  if (path === '/api/auth/reset-password' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const rawToken = String(body.token || '').trim();
    const newPassword = String(body.password || '');

    if (!rawToken || newPassword.length < 8) {
      return { status: 400, body: { error: 'invalid_reset_request' } };
    }

    const tokenHash = await sha256Hex(rawToken);
    const now = new Date().toISOString();

    const tokenRecord = await env.DB.prepare(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ?1`,
    )
      .bind(tokenHash)
      .first();

    if (!tokenRecord || tokenRecord.used_at || tokenRecord.expires_at < now) {
      return { status: 400, body: { error: 'invalid_or_expired_token' } };
    }

    const { hash, salt } = await hashPassword(newPassword);

    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash = ?1, password_salt = ?2, updated_at = ?3 WHERE id = ?4').bind(
        hash,
        salt,
        now,
        tokenRecord.user_id,
      ),
      env.DB.prepare('UPDATE password_reset_tokens SET used_at = ?1 WHERE id = ?2').bind(now, tokenRecord.id),
    ]);

    return { status: 200, body: { ok: true } };
  }

  // ── Protected routes below require a valid authenticated user ──
  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return { status: 401, body: { error: 'unauthorized' } };
  }

  // ── GET /api/auth/me ──
  if (path === '/api/auth/me' && request.method === 'GET') {
    const { results: addresses } = await env.DB.prepare(
      'SELECT * FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, created_at DESC',
    )
      .bind(user.id)
      .all();

    return {
      status: 200,
      body: {
        user,
        addresses: (addresses || []).map(formatAddressRow),
      },
    };
  }

  // ── PUT /api/auth/me ──
  if (path === '/api/auth/me' && request.method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const firstName = String(body.firstName ?? user.firstName).trim().slice(0, 80);
    const lastName = String(body.lastName ?? user.lastName).trim().slice(0, 80);
    const phone = String(body.phone ?? user.phone).trim().slice(0, 40);
    const now = new Date().toISOString();

    if (!firstName || !lastName) {
      return { status: 400, body: { error: 'invalid_profile_fields' } };
    }

    if (body.newPassword) {
      const currentPassword = String(body.currentPassword || '');
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 8) {
        return { status: 400, body: { error: 'password_too_short' } };
      }

      const dbUser = await env.DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?1')
        .bind(user.id)
        .first();

      const { hash: currentVerifyHash } = await hashPassword(currentPassword, dbUser.password_salt);
      if (!timingSafeEqualHex(currentVerifyHash, dbUser.password_hash)) {
        return { status: 400, body: { error: 'wrong_current_password' } };
      }

      const { hash: newHash, salt: newSalt } = await hashPassword(newPassword);
      await env.DB.prepare(
        'UPDATE users SET first_name = ?1, last_name = ?2, phone = ?3, password_hash = ?4, password_salt = ?5, updated_at = ?6 WHERE id = ?7',
      )
        .bind(firstName, lastName, phone, newHash, newSalt, now, user.id)
        .run();
    } else {
      await env.DB.prepare('UPDATE users SET first_name = ?1, last_name = ?2, phone = ?3, updated_at = ?4 WHERE id = ?5')
        .bind(firstName, lastName, phone, now, user.id)
        .run();
    }

    return {
      status: 200,
      body: {
        user: { ...user, firstName, lastName, phone },
      },
    };
  }

  // ── GET /api/me/addresses ──
  if (path === '/api/me/addresses' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, created_at DESC',
    )
      .bind(user.id)
      .all();

    return { status: 200, body: { addresses: (results || []).map(formatAddressRow) } };
  }

  // ── POST /api/me/addresses ──
  if (path === '/api/me/addresses' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const label = String(body.label || 'Casa').trim().slice(0, 40);
    const recipientName = String(body.recipientName || '').trim().slice(0, 120);
    const line1 = String(body.line1 || '').trim().slice(0, 160);
    const line2 = String(body.line2 || '').trim().slice(0, 160);
    const city = String(body.city || '').trim().slice(0, 80);
    const postalCode = String(body.postalCode || '').trim().slice(0, 20);
    const province = String(body.province || '').trim().slice(0, 40);
    const country = String(body.country || 'IT').trim().slice(0, 2).toUpperCase();
    const phone = String(body.phone || '').trim().slice(0, 40);
    const isDefault = Boolean(body.isDefault);

    if (!recipientName || !line1 || !city || !postalCode) {
      return { status: 400, body: { error: 'invalid_address_fields' } };
    }

    const addressId = crypto.randomUUID();
    const now = new Date().toISOString();

    const statements = [];
    if (isDefault) {
      statements.push(env.DB.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?1').bind(user.id));
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO user_addresses (id, user_id, label, recipient_name, line1, line2, city, postal_code, province, country, phone, is_default, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
      ).bind(
        addressId,
        user.id,
        label,
        recipientName,
        line1,
        line2,
        city,
        postalCode,
        province,
        country,
        phone,
        isDefault ? 1 : 0,
        now,
      ),
    );

    await env.DB.batch(statements);

    const { results } = await env.DB.prepare(
      'SELECT * FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, created_at DESC',
    )
      .bind(user.id)
      .all();

    return { status: 201, body: { addresses: (results || []).map(formatAddressRow) } };
  }

  // ── PUT / DELETE /api/me/addresses/:id (Scoped strictly by user_id!) ──
  const addrMatch = path.match(/^\/api\/me\/addresses\/([^/]+)$/);
  if (addrMatch) {
    const addressId = decodeURIComponent(addrMatch[1]);

    if (request.method === 'DELETE') {
      const res = await env.DB.prepare('DELETE FROM user_addresses WHERE id = ?1 AND user_id = ?2')
        .bind(addressId, user.id)
        .run();

      if (!res.meta?.changes) {
        return { status: 404, body: { error: 'address_not_found' } };
      }
      return { status: 200, body: { ok: true } };
    }

    if (request.method === 'PUT') {
      const existing = await env.DB.prepare('SELECT id FROM user_addresses WHERE id = ?1 AND user_id = ?2')
        .bind(addressId, user.id)
        .first();
      if (!existing) {
        return { status: 404, body: { error: 'address_not_found' } };
      }

      const body = await request.json().catch(() => ({}));
      if (body.isDefault) {
        await env.DB.batch([
          env.DB.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?1').bind(user.id),
          env.DB.prepare('UPDATE user_addresses SET is_default = 1 WHERE id = ?1 AND user_id = ?2').bind(
            addressId,
            user.id,
          ),
        ]);
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM user_addresses WHERE user_id = ?1 ORDER BY is_default DESC, created_at DESC',
      )
        .bind(user.id)
        .all();

      return { status: 200, body: { addresses: (results || []).map(formatAddressRow) } };
    }
  }

  return null;
}

function formatAddressRow(row) {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    line1: row.line1,
    line2: row.line2 || '',
    city: row.city,
    postalCode: row.postal_code,
    province: row.province || '',
    country: row.country || 'IT',
    phone: row.phone || '',
    isDefault: Boolean(row.is_default),
  };
}

function buildResetEmailMime({ from, to, firstName, resetUrl }) {
  const domain = from.split('@')[1] || 'brandilab.it';
  const text = [
    `Ciao ${firstName},`,
    '',
    'Abbiamo ricevuto una richiesta per reimpostare la password del tuo account BrandiLab.',
    `Per scegliere una nuova password (link valido per 30 minuti):`,
    resetUrl,
    '',
    'Se non hai richiesto tu il ripristino, puoi ignorare questa email in tutta sicurezza.',
    '',
    '— BrandiLab',
  ].join('\r\n');

  return [
    `From: "BrandiLab" <${from}>`,
    `To: ${to}`,
    'Subject: Reimposta la tua password BrandiLab',
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
    '',
  ].join('\r\n');
}
