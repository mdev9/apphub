import matter from "gray-matter";

export interface MarkdownPage {
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  author?: string;
  aiRating?: number;
  createdAt?: string;
  updatedAt?: string;
  sourceHash?: string;
  lang?: string;
  frontmatter: Record<string, unknown>;
}

export function parseMarkdown(raw: string): MarkdownPage {
  const { data, content } = matter(raw);
  return {
    title: data.title || "Untitled",
    description: data.description,
    content,
    tags: data.tags,
    author: data.author,
    aiRating: data.aiRating,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    sourceHash: data.sourceHash,
    lang: data.lang,
    frontmatter: data,
  };
}

export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function addFrontmatter(
  content: string,
  data: Record<string, unknown>
): string {
  const yamlLines = Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`;
    }
    if (typeof value === "string") return `${key}: "${value}"`;
    return `${key}: ${value}`;
  });
  return `---\n${yamlLines.join("\n")}\n---\n\n${content}`;
}
