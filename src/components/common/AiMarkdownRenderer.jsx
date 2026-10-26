import React from 'react';

/**
 * Helper to parse inline markdown (bold, italic, code, <br>, bullets)
 */
export const renderInlineMarkdown = (text) => {
  if (!text) return null;

  // Handle <br> or <br/> tags first by splitting
  const brParts = text.split(/<br\s*\/?>/gi);
  if (brParts.length > 1) {
    return brParts.map((part, pIdx) => (
      <React.Fragment key={pIdx}>
        {renderInlineMarkdown(part)}
        {pIdx < brParts.length - 1 && <br />}
      </React.Fragment>
    ));
  }

  // Regex to match **bold**, *italic*, `code`, and • bullet
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-black text-emerald-950 dark:text-emerald-200">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-dei-ink dark:text-dei-dark-ink">
          {inner}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-emerald-100 dark:bg-neutral-800 text-emerald-800 dark:text-emerald-300 font-mono text-[11px]"
        >
          {inner}
        </code>
      );
    }

    return part;
  });
};

/**
 * Rich Markdown Component for AI responses
 * Formats: Headers, Tables, Lists, Blockquotes, Dividers, Bold, Italic, and Code
 */
export const AiMarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Table Detection: Line starts and ends with '|'
    if (line.startsWith('|') && line.endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse headers from row 0
        const headerCols = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        // Check if row 1 is separator (e.g. |---|---|)
        const hasSep = /^\|[\s-:]+\|/.test(tableLines[1]);
        const dataRows = (hasSep ? tableLines.slice(2) : tableLines.slice(1)).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div
            key={`tbl-${i}`}
            className="overflow-x-auto my-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm"
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 font-bold border-b border-emerald-200 dark:border-emerald-800">
                <tr>
                  {headerCols.map((h, cIdx) => (
                    <th key={cIdx} className="p-3 border-r border-emerald-200/60 dark:border-emerald-800/60 last:border-r-0">
                      {renderInlineMarkdown(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 dark:divide-neutral-800 bg-white dark:bg-dei-dark-surface">
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`transition-colors ${
                      rIdx % 2 === 0 ? 'bg-white dark:bg-dei-dark-surface' : 'bg-emerald-50/20 dark:bg-neutral-800/20'
                    } hover:bg-emerald-50/40 dark:hover:bg-neutral-800/40`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="p-3 align-top leading-relaxed text-dei-ink dark:text-dei-dark-ink border-r border-emerald-100/60 dark:border-neutral-800/60 last:border-r-0"
                      >
                        {renderInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Heading 1: # Title
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-4 mb-2 pb-1 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          {renderInlineMarkdown(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 3. Heading 2: ## Title
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300 mt-3.5 mb-1.5 pb-1 border-b border-emerald-200/70 dark:border-emerald-800/70 flex items-center gap-2">
          {renderInlineMarkdown(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // 4. Heading 3: ### Title
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="text-xs sm:text-sm font-bold text-dei-ink dark:text-dei-dark-ink mt-3 mb-1">
          {renderInlineMarkdown(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    // 5. Divider: --- or ***
    if (line === '---' || line === '***') {
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-emerald-200 dark:border-neutral-700" />
      );
      i++;
      continue;
    }

    // 6. Blockquote: > Quote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="p-3 my-2 border-l-4 border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-r-xl italic text-xs leading-relaxed text-dei-ink dark:text-dei-dark-ink shadow-sm"
        >
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // 7. Unordered List Items: - or * or •
    if (/^[-*•]\s+/.test(line)) {
      const bulletText = line.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-2 text-xs sm:text-sm leading-relaxed text-dei-ink dark:text-dei-dark-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 flex-shrink-0" />
          <div className="flex-1">{renderInlineMarkdown(bulletText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 8. Ordered List Items: 1. 2. 3.
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2 my-1 pl-2 text-xs sm:text-sm leading-relaxed text-dei-ink dark:text-dei-dark-ink">
          <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs flex-shrink-0 w-4">
            {numMatch[1]}.
          </span>
          <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
        </div>
      );
      i++;
      continue;
    }

    // 9. Empty line
    if (!line) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // 10. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs sm:text-sm leading-relaxed text-dei-ink dark:text-dei-dark-ink my-1">
        {renderInlineMarkdown(rawLine)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
};

export default AiMarkdownRenderer;
