import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Error Handling: Network Outages, Timeouts & Circuit Breakers (Area 12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const simulateNetworkRequest = async (shouldFail: boolean, delayMs = 10): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) reject(new Error('FetchError: Network request failed'));
        else resolve('{"success": true}');
      }, delayMs);
    });
  };

  class CircuitBreaker {
    private failureCount = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    private threshold: number;

    constructor(threshold = 3) {
      this.threshold = threshold;
    }

    getState() {
      return this.state;
    }

    async execute<T>(action: () => Promise<T>): Promise<T> {
      if (this.state === 'OPEN') {
        throw new Error('CircuitBreaker is OPEN: Service unavailable');
      }

      try {
        const result = await action();
        this.failureCount = 0;
        this.state = 'CLOSED';
        return result;
      } catch (err) {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
          this.state = 'OPEN';
        }
        throw err;
      }
    }

    reset() {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }
  }

  it('1. should resolve request successfully in normal network conditions', async () => {
    const res = await simulateNetworkRequest(false);
    expect(res).toBe('{"success": true}');
  });

  it('2. should reject with network error on connectivity loss', async () => {
    await expect(simulateNetworkRequest(true)).rejects.toThrow('Network request failed');
  });

  it('3. should execute action through circuit breaker when state is CLOSED', async () => {
    const breaker = new CircuitBreaker(3);
    const result = await breaker.execute(() => simulateNetworkRequest(false));
    expect(result).toBe('{"success": true}');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('4. should trip circuit breaker to OPEN after exceeding failure threshold', async () => {
    const breaker = new CircuitBreaker(3);

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => simulateNetworkRequest(true));
      } catch {}
    }

    expect(breaker.getState()).toBe('OPEN');
  });

  it('5. should fast-fail incoming calls when circuit breaker is OPEN', async () => {
    const breaker = new CircuitBreaker(1);
    try {
      await breaker.execute(() => simulateNetworkRequest(true));
    } catch {}

    expect(breaker.getState()).toBe('OPEN');
    await expect(breaker.execute(() => simulateNetworkRequest(false))).rejects.toThrow('CircuitBreaker is OPEN');
  });

  it('6. should reset circuit breaker to CLOSED on manual reset', () => {
    const breaker = new CircuitBreaker(1);
    breaker.reset();
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('7. should enforce timeout on slow API responses', async () => {
    const fetchWithTimeout = async (timeoutMs: number) => {
      return Promise.race([
        simulateNetworkRequest(false, 100),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs)),
      ]);
    };

    await expect(fetchWithTimeout(10)).rejects.toThrow('Request timeout');
  });

  it('8. should succeed when request completes before timeout', async () => {
    const fetchWithTimeout = async (timeoutMs: number) => {
      return Promise.race([
        simulateNetworkRequest(false, 10),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs)),
      ]);
    };

    const res = await fetchWithTimeout(100);
    expect(res).toBe('{"success": true}');
  });

  it('9. should implement exponential backoff calculation', () => {
    const getBackoffDelay = (attempt: number, baseDelay = 100) => {
      return baseDelay * Math.pow(2, attempt);
    };

    expect(getBackoffDelay(0)).toBe(100);
    expect(getBackoffDelay(1)).toBe(200);
    expect(getBackoffDelay(2)).toBe(400);
    expect(getBackoffDelay(3)).toBe(800);
  });

  it('10. should deduplicate rapid identical requests using in-flight promise caching', async () => {
    const cache = new Map<string, Promise<string>>();

    const deduplicatedFetch = (key: string) => {
      if (cache.has(key)) return cache.get(key)!;
      const promise = simulateNetworkRequest(false, 10).finally(() => cache.delete(key));
      cache.set(key, promise);
      return promise;
    };

    const req1 = deduplicatedFetch('doc-1');
    const req2 = deduplicatedFetch('doc-1');

    expect(req1).toBe(req2);
    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1).toBe(res2);
  });

  it('11. should handle HTTP 429 Too Many Requests status cleanly', () => {
    const parseHttpStatus = (status: number) => {
      if (status === 429) return { retryAfterSeconds: 60, rateLimited: true };
      if (status === 503) return { retryAfterSeconds: 30, serviceUnavailable: true };
      return { ok: status >= 200 && status < 300 };
    };

    expect(parseHttpStatus(429).rateLimited).toBe(true);
    expect(parseHttpStatus(503).serviceUnavailable).toBe(true);
  });

  it('12. should classify transient vs permanent errors', () => {
    const isTransientError = (statusCode: number) => {
      return [408, 429, 500, 502, 503, 504].includes(statusCode);
    };

    expect(isTransientError(503)).toBe(true);
    expect(isTransientError(429)).toBe(true);
    expect(isTransientError(404)).toBe(false);
    expect(isTransientError(401)).toBe(false);
  });

  it('13. should handle abort controller cancellation signal', async () => {
    const controller = new AbortController();
    const abortableAction = async (signal: AbortSignal) => {
      if (signal.aborted) throw new Error('Operation aborted');
      return 'Completed';
    };

    controller.abort();
    await expect(abortableAction(controller.signal)).rejects.toThrow('Operation aborted');
  });

  it('14. should format friendly user error message from network errors', () => {
    const getUserFriendlyMessage = (err: Error): string => {
      if (err.message.includes('Network request failed') || err.message.includes('FetchError')) {
        return 'Unable to reach server. Please check your internet connection.';
      }
      if (err.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      return 'An unexpected error occurred.';
    };

    expect(getUserFriendlyMessage(new Error('FetchError: Network request failed'))).toBe(
      'Unable to reach server. Please check your internet connection.'
    );
    expect(getUserFriendlyMessage(new Error('Request timeout'))).toBe(
      'Request timed out. Please try again.'
    );
  });
});
