type Bucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_STORE_KEY = "__kumera_rate_limit_store__";

function getStore(): Map<string, Bucket> {
  const globalRef = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, Bucket>;
  };
  if (!globalRef[RATE_LIMIT_STORE_KEY]) {
    globalRef[RATE_LIMIT_STORE_KEY] = new Map<string, Bucket>();
  }
  return globalRef[RATE_LIMIT_STORE_KEY]!;
}

export function applyRateLimit(params: {
  key: string;
  windowMs: number;
  max: number;
}) {
  const now = Date.now();
  const store = getStore();
  const existing = store.get(params.key);

  if (!existing || existing.resetAt <= now) {
    store.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return {
      ok: true,
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
      remaining: params.max - 1,
    };
  }

  if (existing.count >= params.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  store.set(params.key, existing);
  return {
    ok: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    remaining: Math.max(0, params.max - existing.count),
  };
}
