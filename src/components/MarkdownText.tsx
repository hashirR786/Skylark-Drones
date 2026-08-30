import React from "react";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

/**
 * Renders simple markdown-style bold (**text**), italic (*text*),
 * headers (### text), and inline code (`code`) as styled React elements.
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = "" }) => {
  if (!text) return null;

  const parseInline = (str: string, keyPrefix: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(str)) !== null) {
      if (match.index > lastIndex) {
        result.push(str.slice(lastIndex, match.index));
      }
      if (match[1] !== undefined) {
        result.push(
          <strong key={`${keyPrefix}-b-${match.index}`} className="text-[#1C1C1E] font-extrabold">
            {match[1]}
          </strong>
        );
      } else if (match[2] !== undefined) {
        result.push(
          <em key={`${keyPrefix}-i-${match.index}`} className="text-[#6E6E73] italic">
            {match[2]}
          </em>
        );
      } else if (match[3] !== undefined) {
        result.push(
          <code key={`${keyPrefix}-c-${match.index}`} className="font-mono text-[#E83D6F] bg-[#FFF5F7] border border-[#FCE7EA] px-1.5 py-0.5 rounded text-[11px] font-bold">
            {match[3]}
          </code>
        );
      }
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < str.length) {
      result.push(str.slice(lastIndex));
    }

    return result;
  };

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let idx = 0;

  for (const line of lines) {
    const key = `line-${idx++}`;
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key} className="text-base font-bold text-[#1C1C1E] mt-3 mb-1">
          {parseInline(line.slice(4), key)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key} className="text-lg font-extrabold text-[#1C1C1E] mt-4 mb-1">
          {parseInline(line.slice(3), key)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key} className="text-xl font-extrabold text-[#1C1C1E] mt-4 mb-2">
          {parseInline(line.slice(2), key)}
        </h1>
      );
    } else if (line === "") {
      elements.push(<br key={key} />);
    } else {
      elements.push(
        <p key={key} className="mb-1 leading-relaxed">
          {parseInline(line, key)}
        </p>
      );
    }
  }

  return <div className={`text-sm text-[#48484A] ${className}`}>{elements}</div>;
};

