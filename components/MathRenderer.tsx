import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text?: string;
  content?: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, content, className = '', inline = false }) => {
  const targetText = text ?? content ?? '';
  if (!targetText) return null;

  // Regex pattern to split math equations from standard text
  // Supports $$...$$, $...$, \\[...\\] and \\(...\\) delimiters
  const pattern = /(\$\$(?:[^\$]|\\\$)*\$\$|\$(?:[^\$]|\\\$)*\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  const parts = targetText.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isBlock = (part.startsWith('$$') && part.endsWith('$$')) || 
                        (part.startsWith('\\[') && part.endsWith('\\]'));
        
        const isInline = (part.startsWith('$') && part.endsWith('$')) || 
                         (part.startsWith('\\(') && part.endsWith('\\)'));

        if (isBlock) {
          let math = '';
          if (part.startsWith('$$')) {
            math = part.slice(2, -2);
          } else {
            math = part.slice(2, -2);
          }
          math = math.trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto text-left py-1"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            return (
              <code key={index} className="block my-2 bg-white/5 p-2 rounded text-xs whitespace-pre-wrap">
                {part}
              </code>
            );
          }
        } else if (isInline) {
          let math = '';
          if (part.startsWith('$')) {
            math = part.slice(1, -1);
          } else {
            math = part.slice(2, -2);
          }
          math = math.trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="inline-block align-middle mx-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            return (
              <code key={index} className="bg-white/5 px-1 rounded text-xs">
                {part}
              </code>
            );
          }
        } else {
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
};
