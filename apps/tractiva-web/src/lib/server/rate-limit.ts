type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export const consumeRateLimit = (key: string, max: number, windowMs: number) => {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, max - 1) }
  }

  existing.count += 1
  buckets.set(key, existing)

  if (existing.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { allowed: false, retryAfterSeconds, remaining: 0 }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, max - existing.count)
  }
}

export const resetRateLimit = (key: string) => {
  buckets.delete(key)
}
