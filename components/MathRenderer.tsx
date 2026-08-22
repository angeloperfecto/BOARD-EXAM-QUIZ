import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text?: string;
  content?: string;
  className?: string;
  inline?: boolean;
}

// Clean and normalize LaTeX strings before feeding to KaTeX to prevent syntax errors
export function sanitizeLatex(latex: string): string {
  if (!latex) return '';
  let cleaned = latex;

  // Fix common unescaped or problematic LaTeX issues
  // 1. Fix broken phi subscripts like \1\phi or 1\phi or ,1\phi -> ,\text{1}\phi or ,1\phi
  cleaned = cleaned.replace(/\\1\\phi/g, '1\\phi');
  cleaned = cleaned.replace(/_\{([^}]*?)1\\phi\}/g, '_{\\text{$1, 1}\\phi}');
  cleaned = cleaned.replace(/_([a-zA-Z0-9]+,1\\phi)/g, '_{\\text{$1}}');
  
  // 2. Fix unbracketed subscripts like P_loss -> P_{\text{loss}}
  cleaned = cleaned.replace(/\bP_([a-zA-Z]{2,})\b/g, 'P_{\\text{$1}}');
  cleaned = cleaned.replace(/\bV_([a-zA-Z]{2,})\b/g, 'V_{\\text{$1}}');
  cleaned = cleaned.replace(/\bI_([a-zA-Z]{2,})\b/g, 'I_{\\text{$1}}');
  cleaned = cleaned.replace(/\bR_([a-zA-Z]{2,})\b/g, 'R_{\\text{$1}}');
  cleaned = cleaned.replace(/\bX_([a-zA-Z]{2,})\b/g, 'X_{\\text{$1}}');
  cleaned = cleaned.replace(/\bZ_([a-zA-Z]{2,})\b/g, 'Z_{\\text{$1}}');

  // 3. Fix common symbols and units
  cleaned = cleaned.replace(/\\ohm\b/g, '\\Omega');
  cleaned = cleaned.replace(/\\degree\b/g, '^{\\circ}');
  cleaned = cleaned.replace(/\\deg\b/g, '^{\\circ}');
  cleaned = cleaned.replace(/°/g, '^{\\circ}');

  // 4. Fix missing multiplication spacing
  cleaned = cleaned.replace(/(\d+)\s*x\s*10\^/gi, '$1 \\times 10^');
  cleaned = cleaned.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\times $2');

  // 5. Fix arrow notation
  cleaned = cleaned.replace(/-->|==>/g, '\\implies ');
  cleaned = cleaned.replace(/->/g, '\\rightarrow ');

  return cleaned;
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
          let math = part.slice(2, -2).trim();
          math = sanitizeLatex(math);
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto text-center py-1.5 px-3 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-sm sm:text-base tracking-wide"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            return (
              <code key={index} className="block my-2 bg-white/5 p-2 rounded text-xs whitespace-pre-wrap font-mono">
                {part}
              </code>
            );
          }
        } else if (isInline) {
          let math = part.startsWith('$') ? part.slice(1, -1).trim() : part.slice(2, -2).trim();
          math = sanitizeLatex(math);
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
              <code key={index} className="bg-white/5 px-1 rounded text-xs font-mono">
                {part}
              </code>
            );
          }
        } else {
          // If the text part itself contains obvious inline math expressions like "P_loss = ...",
          // let's check if we can format mathematical sub-clauses nicely
          return <span key={index}>{renderTextWithMathHeuristic(part)}</span>;
        }
      })}
    </span>
  );
};

// Heuristic renderer to detect and format LaTeX fragments embedded without $ delimiters
function renderTextWithMathHeuristic(rawText: string): React.ReactNode {
  // If string contains explicit LaTeX commands like \frac, \sqrt, \times, \Omega, \rho, \implies, etc.
  if (/\\(frac|sqrt|times|Omega|rho|implies|pi|sum|int|alpha|beta|gamma|theta|sigma|mu|pm|approx|le|ge)\b/.test(rawText)) {
    try {
      const sanitized = sanitizeLatex(rawText);
      const html = katex.renderToString(sanitized, {
        displayMode: false,
        throwOnError: false,
      });
      return <span className="inline-block align-middle mx-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return rawText;
    }
  }
  return rawText;
}

