import { getJson, putJson } from "./r2";

const windowMs = 60 * 60 * 1000; // 1 hour
const maxRequests = 20;
const maxStrikes = 3;

// In-memory sliding window
const ipWindows = new Map<string, number[]>();

// In-memory blocklist cache (refreshed from R2)
let blockedIps: Set<string> | null = null;
let blockedIpsLoadedAt = 0;

async function getBlockedIps(): Promise<Set<string>> {
  if (blockedIps && Date.now() - blockedIpsLoadedAt < 5 * 60 * 1000) {
    return blockedIps;
  }
  const list = await getJson<string[]>("meta/blocked-ips.json");
  blockedIps = new Set(list ?? []);
  blockedIpsLoadedAt = Date.now();
  return blockedIps;
}

export async function isBlocked(ip: string): Promise<boolean> {
  const blocked = await getBlockedIps();
  return blocked.has(ip);
}

export function isRateLimited(ip: string): boolean {
  // No rate limit for local requests
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip === "unknown") {
    return false;
  }

  const now = Date.now();
  const window = ipWindows.get(ip) ?? [];
  const recent = window.filter((ts) => now - ts < windowMs);
  ipWindows.set(ip, recent);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  return false;
}

// Strike tracking
const ipStrikes = new Map<string, number>();

export async function addStrike(ip: string): Promise<void> {
  const strikes = (ipStrikes.get(ip) ?? 0) + 1;
  ipStrikes.set(ip, strikes);

  if (strikes >= maxStrikes) {
    const blocked = await getBlockedIps();
    blocked.add(ip);
    await putJson("meta/blocked-ips.json", Array.from(blocked));
  }
}
