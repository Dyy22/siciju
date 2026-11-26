// Cloudflare Worker API + Static Assets Handler for SICIJU

const NICKNAME_REGEX = /^[A-Za-z0-9 _-]{2,16}$/;
const TOKEN_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours max per run session
const MIN_RUN_MS = 1000;
const TOP_LIMIT = 10;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS leaderboard (
    nickname_key TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    score INTEGER NOT NULL,
    distance INTEGER NOT NULL,
    orbs INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
    ON leaderboard (score DESC, distance DESC, updated_at ASC)`,
  `CREATE TABLE IF NOT EXISTS used_runs (
    run_id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_used_runs_expires
    ON used_runs (expires_at)`
];

let schemaReadyPromise = null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function normalizeNickname(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ');
}

function isSameOrigin(request, url) {
  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      return new URL(origin).origin === url.origin;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      return new URL(referer).origin === url.origin;
    } catch {
      return false;
    }
  }
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  return secFetchSite === 'same-origin';
}

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(str) {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]+$/.test(str)) {
    return null;
  }
  const padLen = (4 - (str.length % 4)) % 4;
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signRunPayload(payload, secret) {
  const key = await importHmacKey(secret);
  const encoder = new TextEncoder();
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(sigBuf));
}

async function verifyRunToken(token, secret) {
  if (typeof token !== 'string' || token.length > 256) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;

  const [runId, issuedStr, expiresStr, sigB64] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return null;
  if (!/^\d+$/.test(issuedStr) || !/^\d+$/.test(expiresStr)) return null;

  const sigBytes = fromBase64Url(sigB64);
  if (!sigBytes || sigBytes.length !== 32) return null;

  const payload = `${runId}.${issuedStr}.${expiresStr}`;
  const key = await importHmacKey(secret);
  const encoder = new TextEncoder();
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
  if (!valid) return null;

  const issuedAt = Number(issuedStr);
  const expiresAt = Number(expiresStr);
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) return null;

  return { runId, issuedAt, expiresAt };
}

async function ensureSchema(db) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      for (const sql of SCHEMA_STATEMENTS) {
        await db.prepare(sql).run();
      }
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

async function fetchTopEntries(db) {
  const result = await db
    .prepare(
      `SELECT nickname, score, distance, orbs, updated_at
       FROM leaderboard
       ORDER BY score DESC, distance DESC, updated_at ASC
       LIMIT ?1`
    )
    .bind(TOP_LIMIT)
    .all();

  return (result.results || []).map((row, index) => ({
    rank: index + 1,
    nickname: String(row.nickname),
    score: Number(row.score),
    distance: Number(row.distance),
    orbs: Number(row.orbs),
    updatedAt: String(row.updated_at)
  }));
}

function validatePhysics(score, distance, orbs, elapsedMs) {
  if (!Number.isInteger(score) || !Number.isInteger(distance) || !Number.isInteger(orbs)) {
    return 'Run metrics must be whole integers.';
  }
  if (score < 0 || score > 10_000_000 || distance < 0 || distance > 1_500_000 || orbs < 0 || orbs > 250_000) {
    return 'Run metrics are out of valid range.';
  }
  if (elapsedMs < MIN_RUN_MS) {
    return 'Run duration is too short to submit.';
  }

  const elapsedSec = elapsedMs / 1000;
  // Glider max speed is 54 units/sec; add small margin for clock drift and token fetch latency
  const maxPlausibleDist = Math.floor((elapsedSec + 3) * 56 + 60);
  if (distance > maxPlausibleDist) {
    return 'Run distance exceeds physical speed limit.';
  }

  // Every meter awards at least 1.4 points at x1 multiplier
  const minPlausibleScore = Math.floor(distance * 1.35) - 5;
  if (score < minPlausibleScore) {
    return 'Run score does not match distance covered.';
  }

  // At most 3 orbs can spawn per wave (>= 16.5m apart, using 14m floor for margin)
  const maxPlausibleOrbs = Math.floor(distance / 14) * 3 + 10;
  if (orbs > maxPlausibleOrbs) {
    return 'Orb count exceeds maximum possible spawns.';
  }

  // Max score: x5 multiplier distance (7/m) + x5 orbs (250 each) + near-miss bonuses
  const maxPlausibleScore = Math.floor(distance * 7.2 + orbs * 250 + (distance / 15) * 750 + 600);
  if (score > maxPlausibleScore) {
    return 'Run score exceeds physical maximum for distance and orbs.';
  }

  return null;
}

async function handleGetLeaderboard(env) {
  if (!env.DB) {
    return json({
      configured: false,
      entries: [],
      message: 'Cloudflare D1 binding not configured yet.'
    });
  }

  await ensureSchema(env.DB);
  const entries = await fetchTopEntries(env.DB);
  return json({
    configured: true,
    entries
  });
}

async function handleStartRun(request, env, url) {
  if (!isSameOrigin(request, url)) {
    return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  }

  if (!env.DB || !env.RUN_SECRET) {
    return json({
      configured: false,
      error: 'Leaderboard backend is not configured yet.'
    }, 503);
  }

  const runId = crypto.randomUUID();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + TOKEN_TTL_MS;
  const payload = `${runId}.${issuedAt}.${expiresAt}`;
  const sig = await signRunPayload(payload, env.RUN_SECRET);

  return json({
    configured: true,
    token: `${payload}.${sig}`,
    issuedAt,
    expiresAt
  });
}

async function handleSubmitScore(request, env, url) {
  if (!isSameOrigin(request, url)) {
    return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  }

  if (!env.DB || !env.RUN_SECRET) {
    return json({
      configured: false,
      error: 'Leaderboard backend is not configured yet.'
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const nickname = normalizeNickname(body.nickname);
  if (!NICKNAME_REGEX.test(nickname)) {
    return json({ error: 'Nickname must be 2–16 characters (letters, numbers, spaces, _ or -).' }, 400);
  }

  const verified = await verifyRunToken(body.token, env.RUN_SECRET);
  if (!verified) {
    return json({ error: 'Invalid run verification token.' }, 401);
  }

  const now = Date.now();
  if (now > verified.expiresAt || verified.issuedAt > now + 5000) {
    return json({ error: 'Run verification token has expired. Launch a new run.' }, 401);
  }

  const score = Number(body.score);
  const distance = Number(body.distance);
  const orbs = Number(body.orbs);
  const elapsedMs = now - verified.issuedAt;

  const physicsError = validatePhysics(score, distance, orbs, elapsedMs);
  if (physicsError) {
    return json({ error: physicsError }, 422);
  }

  await ensureSchema(env.DB);

  // Atomically claim the single-use run token only after all validation passes
  const claim = await env.DB
    .prepare(
      `INSERT INTO used_runs (run_id, expires_at)
       VALUES (?1, ?2)
       ON CONFLICT(run_id) DO NOTHING
       RETURNING run_id`
    )
    .bind(verified.runId, verified.expiresAt)
    .first();

  if (!claim) {
    return json({ error: 'This run score has already been submitted.' }, 409);
  }

  // Prune expired anti-replay tokens opportunistically
  await env.DB.prepare('DELETE FROM used_runs WHERE expires_at < ?1').bind(now).run();

  const nicknameKey = nickname.toLowerCase();
  const updatedAt = new Date(now).toISOString();

  await env.DB
    .prepare(
      `INSERT INTO leaderboard (nickname_key, nickname, score, distance, orbs, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(nickname_key) DO UPDATE SET
         nickname = excluded.nickname,
         score = excluded.score,
         distance = excluded.distance,
         orbs = excluded.orbs,
         updated_at = excluded.updated_at
       WHERE excluded.score > leaderboard.score
          OR (excluded.score = leaderboard.score AND excluded.distance > leaderboard.distance)`
    )
    .bind(nicknameKey, nickname, score, distance, orbs, updatedAt)
    .run();

  const stored = await env.DB
    .prepare(
      `SELECT nickname, score, distance, orbs, updated_at
       FROM leaderboard
       WHERE nickname_key = ?1`
    )
    .bind(nicknameKey)
    .first();

  const rankRow = stored
    ? await env.DB
        .prepare(
          `SELECT COUNT(*) + 1 AS rank
           FROM leaderboard
           WHERE score > ?1
              OR (score = ?1 AND distance > ?2)
              OR (score = ?1 AND distance = ?2 AND updated_at < ?3)`
        )
        .bind(stored.score, stored.distance, stored.updated_at)
        .first()
    : null;

  const entries = await fetchTopEntries(env.DB);
  const keptHigherExisting = Boolean(stored && Number(stored.score) > score);

  return json({
    configured: true,
    accepted: !keptHigherExisting,
    keptHigherExisting,
    record: stored
      ? {
          nickname: String(stored.nickname),
          score: Number(stored.score),
          distance: Number(stored.distance),
          orbs: Number(stored.orbs),
          rank: rankRow ? Number(rankRow.rank) : null
        }
      : null,
    entries
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/leaderboard') {
        if (request.method === 'GET') {
          return await handleGetLeaderboard(env);
        }
        if (request.method === 'POST') {
          return await handleSubmitScore(request, env, url);
        }
        return json({ error: 'Method not allowed.' }, 405);
      }

      if (url.pathname === '/api/run/start') {
        if (request.method === 'POST') {
          return await handleStartRun(request, env, url);
        }
        return json({ error: 'Method not allowed.' }, 405);
      }

      if (url.pathname.startsWith('/api/')) {
        return json({ error: 'Unknown API endpoint.' }, 404);
      }
    } catch (err) {
      console.error('API error:', err);
      return json({ error: 'Internal server error.' }, 500);
    }

    return env.ASSETS.fetch(request);
  }
};
