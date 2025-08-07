const rateMap = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export function checkRateLimit(ip: string, limit = MAX_REQUESTS): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = rateMap.get(ip) || [];

  const recent = timestamps.filter(ts => ts > windowStart);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  rateMap.set(ip, recent);

  return true;
}