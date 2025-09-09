// A simple in-memory token bucket rate limiter.
// For production systems, you may want to back this with Redis or Upstash.
// This implementation is framework-agnostic: you can call `consume` from any
// HTTP handler or tRPC middleware.

export interface RateLimiterOptions {
  /** Maximum number of actions allowed within the `windowMs` */
  limit: number;
  /** Sliding window duration in milliseconds */
  windowMs: number;
}

interface Bucket {
  remaining: number;
  reset: number; // unix ms when the bucket resets
}

/**
 * An in-memory, IP-keyed rate limiter.
 *
 * Example (Next.js / tRPC):
 * ```ts
 * import { createRateLimiter } from "~/lib/rate-limiter";
 * import { TRPCError } from "@trpc/server";
 *
 * const limiter = createRateLimiter({ limit: 100, windowMs: 60_000 });
 *
 * const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
 *   const key = ctx.headers.get("x-forwarded-for") ?? "global";
 *   if (!limiter.consume(key)) {
 *     throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
 *   }
 *   return next();
 * });
 * ```
 */
export function createRateLimiter(opts: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function cleanup(now: number) {
    // Remove expired buckets periodically to avoid unbounded memory growth.
    for (const [key, bucket] of buckets) {
      if (bucket.reset <= now) {
        buckets.delete(key);
      }
    }
  }

  return {
    /**
     * Attempt to consume one token for `key`.
     * Returns `true` if allowed, `false` if the caller is over limit.
     */
    consume(key: string): boolean {
      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || bucket.reset <= now) {
        bucket = { remaining: opts.limit, reset: now + opts.windowMs };
        buckets.set(key, bucket);
      }

      if (bucket.remaining > 0) {
        bucket.remaining -= 1;
        return true;
      }

      // Perform opportunistic cleanup once in a while (~1% of calls)
      if (Math.random() < 0.01) cleanup(now);
      return false;
    },
  } as const;
}
