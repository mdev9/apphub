import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

const TRANSCRIPT_SCRIPT = process.env.HOME + "/.claude/skills/yt/scripts/transcript.py";

export function isYouTubeUrl(url: string): boolean {
  return YT_REGEX.test(url);
}

export async function extractYouTubeTranscript(
  url: string
): Promise<string | null> {
  try {
    const { stdout, stderr } = await execFileAsync(
      "python3",
      [TRANSCRIPT_SCRIPT, url],
      { timeout: 30000 }
    );
    if (stderr) console.error("[yt-extract]", stderr);
    return stdout.trim() || null;
  } catch (e) {
    console.error("[yt-extract] Failed:", (e as Error).message);
    return null;
  }
}

export async function extractWebContent(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AppHub/1.0 (Knowledge Base Bot)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Strip HTML to get text content
    let text = html
      // Remove scripts and styles
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Cap at ~10k chars to keep prompt reasonable
    if (text.length > 10000) {
      text = text.slice(0, 10000) + "... [truncated]";
    }

    return text || null;
  } catch {
    return null;
  }
}

export async function extractUrlContent(
  url: string
): Promise<{ content: string; source: "youtube" | "web" } | null> {
  if (isYouTubeUrl(url)) {
    const transcript = await extractYouTubeTranscript(url);
    if (transcript) return { content: transcript, source: "youtube" };
    return null;
  }

  const text = await extractWebContent(url);
  if (text) return { content: text, source: "web" };
  return null;
}
