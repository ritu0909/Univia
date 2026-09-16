import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  isUser?: boolean;
}

/**
 * Lightweight, robust Markdown formatter for AI Nova chat messages
 * Safely parses headers, lists, bold text, inline code, and quotes without heavy external dependencies.
 */
export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, isUser = false }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-normal leading-relaxed">{content}</div>;
  }

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${listKey++}`} className="space-y-1.5 my-2 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInlineText = (text: string): React.ReactNode[] => {
    // Regex for bold (**bold**) and inline code (`code`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-[#1E1535] dark:text-white">
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#F0EAF8] dark:bg-[#251A40] text-[#7033F5] dark:text-[#CBB3F2] font-mono text-[11px] border border-[#E4D5F8] dark:border-[#3D2C62]"
          >
            {inner}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty lines
    if (!trimmed) {
      flushList();
      renderedElements.push(<div key={`empty-${idx}`} className="h-2" />);
      return;
    }

    // Heading 3: ### ...
    if (trimmed.startsWith('### ')) {
      flushList();
      const headingText = trimmed.replace(/^###\s+/, '');
      renderedElements.push(
        <h3
          key={`h3-${idx}`}
          className="text-sm sm:text-base font-extrabold text-[#211B33] dark:text-white mt-3 mb-1.5 flex items-center gap-1.5"
        >
          {formatInlineText(headingText)}
        </h3>
      );
      return;
    }

    // Heading 4: #### ...
    if (trimmed.startsWith('#### ')) {
      flushList();
      const headingText = trimmed.replace(/^####\s+/, '');
      renderedElements.push(
        <h4
          key={`h4-${idx}`}
          className="text-xs sm:text-sm font-bold text-[#7033F5] dark:text-[#B794F6] mt-2.5 mb-1"
        >
          {formatInlineText(headingText)}
        </h4>
      );
      return;
    }

    // Unordered Bullet List: * ... or - ...
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      const itemText = trimmed.replace(/^[\*\-]\s+/, '');
      listItems.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7033F5] dark:bg-[#A78BFA] shrink-0 mt-1.5" />
          <span className="flex-1 text-[#332A4A] dark:text-[#E2E8F0]">
            {formatInlineText(itemText)}
          </span>
        </li>
      );
      return;
    }

    // Numbered List: 1. ... 2. ...
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      const num = numMatch[1];
      const itemText = numMatch[2];
      renderedElements.push(
        <div
          key={`num-${idx}`}
          className="flex items-start gap-2 my-1.5 text-xs sm:text-sm leading-relaxed"
        >
          <span className="w-4 h-4 rounded-full bg-[#7033F5]/10 dark:bg-[#7033F5]/30 text-[#7033F5] dark:text-[#CBB3F2] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1 text-[#332A4A] dark:text-[#E2E8F0]">
            {formatInlineText(itemText)}
          </span>
        </div>
      );
      return;
    }

    // Blockquote: > ...
    if (trimmed.startsWith('> ')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s+/, '');
      renderedElements.push(
        <div
          key={`quote-${idx}`}
          className="p-2.5 my-2 rounded-xl bg-[#F6F1FD] dark:bg-[#1E1730] border-l-3 border-[#7033F5] text-xs sm:text-sm italic text-[#4A3F63] dark:text-[#CBD5E1]"
        >
          {formatInlineText(quoteText)}
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm leading-relaxed text-[#332A4A] dark:text-[#E2E8F0] my-1">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
};
