import { CodeCopyButton } from "./code-copy-button";

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-brand-card px-1.5 py-0.5 text-sm font-bold text-brand-dark">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  const blocks = content.split(/```/g);

  return (
    <div className="space-y-4 text-base leading-8">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const firstLineBreak = block.indexOf("\n");
          const language = firstLineBreak > 0 ? block.slice(0, firstLineBreak).trim() : "";
          const code = firstLineBreak > 0 ? block.slice(firstLineBreak + 1).trim() : block.trim();
          return (
            <div key={index} className="overflow-hidden rounded-lg border border-black/10 bg-white">
              <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
                <span className="text-sm font-bold text-brand-muted">{language || "code"}</span>
                <CodeCopyButton code={code} />
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-7 text-brand-dark">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return block
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line, lineIndex) => {
            if (line.startsWith("# ")) {
              return <h2 key={`${index}-${lineIndex}`} className="text-2xl font-black text-brand-dark">{line.replace("# ", "")}</h2>;
            }
            if (line.startsWith("## ")) {
              return <h3 key={`${index}-${lineIndex}`} className="text-xl font-black text-brand-dark">{line.replace("## ", "")}</h3>;
            }
            if (line.startsWith("- ")) {
              return <p key={`${index}-${lineIndex}`} className="pl-4 font-semibold text-brand-muted">• {renderInline(line.replace("- ", ""))}</p>;
            }
            return <p key={`${index}-${lineIndex}`} className="text-brand-muted">{renderInline(line)}</p>;
          });
      })}
    </div>
  );
}
