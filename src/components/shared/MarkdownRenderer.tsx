"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";

interface Props {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          // Add anchor links to headings
          h2: ({ children, id, ...props }) => (
            <h2 id={id} className="group relative" {...props}>
              {children}
              {id && (
                <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-accent transition-opacity">
                  #
                </a>
              )}
            </h2>
          ),
          h3: ({ children, id, ...props }) => (
            <h3 id={id} className="group relative" {...props}>
              {children}
              {id && (
                <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-accent transition-opacity">
                  #
                </a>
              )}
            </h3>
          ),
          // Internal links (/wiki/...) navigate in place; external open in new tab
          a: ({ href, children, ...props }) =>
            href?.startsWith("/") ? (
              <a href={href} {...props}>
                {children}
              </a>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          // Style tables nicely
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table {...props}>{children}</table>
            </div>
          ),
          // Callout blocks via blockquotes starting with [!NOTE], [!WARNING], etc.
          blockquote: ({ children, ...props }) => {
            const text = extractText(children);
            if (text.startsWith("[!NOTE]")) {
              return (
                <div className="rounded-lg border-l-4 border-accent bg-accent-light px-4 py-3 my-4">
                  <div className="font-semibold text-accent text-sm mb-1">Note</div>
                  <div className="text-sm">{text.replace("[!NOTE]", "").trim()}</div>
                </div>
              );
            }
            if (text.startsWith("[!WARNING]")) {
              return (
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 my-4">
                  <div className="font-semibold text-amber-600 dark:text-amber-400 text-sm mb-1">Warning</div>
                  <div className="text-sm">{text.replace("[!WARNING]", "").trim()}</div>
                </div>
              );
            }
            return <blockquote {...props}>{children}</blockquote>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}
