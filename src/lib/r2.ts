import * as fs from "node:fs";
import * as path from "node:path";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// --- Storage mode: R2 or local filesystem ---

const USE_LOCAL = !process.env.R2_ENDPOINT;
const LOCAL_DIR = path.resolve(process.cwd(), "data");

function localPath(key: string): string {
  return path.join(LOCAL_DIR, key);
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

// --- R2 client (only initialized when R2 is configured) ---

const s3 = USE_LOCAL
  ? (null as unknown as S3Client)
  : new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

const BUCKET = process.env.R2_BUCKET_NAME || "apphub-content";

// --- Unified storage API ---

export async function getObject(key: string): Promise<string | null> {
  if (USE_LOCAL) {
    try {
      return fs.readFileSync(localPath(key), "utf-8");
    } catch {
      return null;
    }
  }
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return (await res.Body?.transformToString("utf-8")) ?? null;
  } catch (e: unknown) {
    if ((e as { name?: string }).name === "NoSuchKey") return null;
    throw e;
  }
}

export async function putObject(
  key: string,
  body: string,
  contentType = "text/markdown"
): Promise<void> {
  if (USE_LOCAL) {
    const fp = localPath(key);
    ensureDir(fp);
    fs.writeFileSync(fp, body, "utf-8");
    return;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  if (USE_LOCAL) {
    try {
      fs.unlinkSync(localPath(key));
    } catch {}
    return;
  }
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function objectExists(key: string): Promise<boolean> {
  if (USE_LOCAL) {
    return fs.existsSync(localPath(key));
  }
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function listObjects(
  prefix: string
): Promise<{ key: string; lastModified?: Date }[]> {
  if (USE_LOCAL) {
    const dir = localPath(prefix);
    if (!fs.existsSync(dir)) return [];
    const results: { key: string; lastModified?: Date }[] = [];
    function walk(d: string) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const key = path.relative(LOCAL_DIR, full);
          const stat = fs.statSync(full);
          results.push({ key, lastModified: stat.mtime });
        }
      }
    }
    walk(dir);
    return results;
  }

  const results: { key: string; lastModified?: Date }[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        results.push({ key: obj.Key, lastModified: obj.LastModified });
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return results;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await getObject(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function putJson(key: string, data: unknown): Promise<void> {
  await putObject(key, JSON.stringify(data, null, 2), "application/json");
}
