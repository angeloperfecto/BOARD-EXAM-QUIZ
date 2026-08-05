import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini SDK with telemetry header as per guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper function to call generateContent with retry and model fallback logic to handle high demand / transient 503/429 errors
async function generateContentWithRetryAndFallback(params: {
  contents: any;
  config: any;
}) {
  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  const maxRetries = 2;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting quiz generation with model ${model} (attempt ${attempt + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          console.log(`Successfully generated quiz using model ${model}`);
          return response;
        }
        throw new Error('Gemini returned an empty response.');
      } catch (err: any) {
        lastError = err;
        console.error(`Error with model ${model} on attempt ${attempt + 1}:`, err);

        if (attempt === maxRetries) {
          console.warn(`Model ${model} failed after ${maxRetries + 1} attempts. Falling back to next model if available...`);
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.log(`Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const errorMessage = lastError?.message || JSON.stringify(lastError) || 'Unknown error';
  throw new Error(`All models and retries failed due to API errors / high demand. Last error: ${errorMessage}`);
}

export async function POST(req: NextRequest) {
  try {
    const { text, images, fileName, subject, difficulty, customInstructions } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No document text provided for extraction' }, { status: 400 });
    }

    // Define the system instructions and constraints to support BOTH question extraction and high-quality question generation
    const systemInstruction = `You are an elite, high-accuracy Exam Extraction and Intelligent Quiz Generation AI.
Your primary directive is to process the provided document text (and any embedded images) and produce a comprehensive, complete quiz.

CRITICAL INSTRUCTIONS:
1. HYBRID EXTRACTION & GENERATION:
   - If the document already contains pre-written questions (e.g., test sheets, worksheets, question banks, reviewers), you MUST extract 100% of them with perfect fidelity. Do NOT skip, summarize, or truncate. If there are 30, 50, 80, 100 or more questions, you MUST extract ALL of them sequentially. There is NO upper limit or artificial cap on the number of questions.
   - If the document contains study guides, textbooks, chapters, summaries, slides, or notes (which do not have explicit questions, or have very few), analyze the content deeply and GENERATE a high-quality quiz of at least 15 to 25 questions that comprehensively tests the core concepts, terms, formulas, and facts in the text.
   - If the document contains a mix of both, extract all existing questions AND generate additional highly relevant questions from the informational content to form a complete, robust quiz.
2. ANSWER SELECTION & COMPREHENSIVE EXPLANATIONS:
   - For extracted questions: Detect bold letters, answer keys, solutions, or asterisks. Cross-reference any answer key (usually at the end) and pair it with the corresponding question.
   - For generated questions: Always select a mathematically or factually correct answer.
   - For ALL questions, provide a comprehensive, step-by-step solution in the 'explanation' field.
     - For computational questions: Include the complete mathematical formula(s), clearly define each variable, substitute the given values, perform the calculations in the correct order, and present the final answer with appropriate units. Use proper LaTeX formatting.
     - For conceptual/theory questions: Provide a concise but complete explanation that justifies why the correct answer is correct and why other choices are incorrect. The goal is to make it a complete learning resource.
3. IMAGES & DIAGRAMS:
   - If you encounter image references (like [IMAGE_REF_0], [IMAGE_REF_1]) in the text, look at the corresponding images provided in the multimodal context. Preserve the reference tags (e.g., "[IMAGE_REF_0]") inside the question text or map them correctly to the question metadata.
4. TYPES OF QUESTIONS:
   - MCQ: Multiple choice questions. Generate or extract 4 clear options (A, B, C, D) and parse them into the 'choices' array.
   - TRUE_FALSE: True or False questions.
   - IDENTIFICATION: Direct short answer questions.
   - ENUMERATION: List-type answers.
   - FILL_IN_BLANK: Text with blank spaces (e.g. "_____").
   - MATCHING: Matching left items to right items. Pass pairs in the 'matchingPairs' field.
   - SITUATIONAL / COMPUTATIONAL / ESSAY: Scenario-based or numerical calculation questions.
5. FORMATTING & MATHEMATICAL EXPRESSIONS (STRICT LATEX):
   - You MUST extract 100% of all mathematical questions containing formulas, symbols, fractions, exponents, subscripts, superscripts, matrices, integrals, summations, Greek letters, square roots, vectors, and other notation WITHOUT any loss of formatting or detail.
   - Represent EVERY mathematical expression, formula, symbol, equation, and notation strictly using standard LaTeX formatting.
   - Use standard inline LaTeX wrapped in single dollar signs like '$...$' for inline notation, variables, and small expressions (e.g., '$E = mc^2$', '$\\frac{a}{b}$', '$\\alpha$', '$\\sqrt{x^2+y^2}$', '$x_i$', or '$y^2$').
   - Use block/standalone LaTeX wrapped in double dollar signs like '$$...$$' for larger equations, standalone expressions, matrices, integrals, or complex summations (e.g., '$$\\int_a^b f(x)\\,dx$$', or '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$').
   - Double-escape all backslashes in JSON (e.g., write '\\\\frac{a}{b}' or '\\\\alpha') to ensure it is valid JSON. NEVER output a raw unescaped backslash like '\\frac'.
   - Ensure absolutely no mathematical symbols are converted into plain text, omitted, corrupted, or reformatted incorrectly during extraction. The rendered output must be visually and structurally identical to the source document.
6. MULTILINGUAL SUPPORT:
   - Fully support English, Filipino, and Taglish/mixed-language documents with perfect OCR and translation fidelity.`;

    // Construct multimodal content by parsing [IMAGE_REF_X] from the document text
    const parts: any[] = [];
    let lastIndex = 0;
    const regex = /\[IMAGE_REF_(\d+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const imageIdx = parseInt(match[1], 10);

      // Add text leading up to the image placeholder
      const segment = text.substring(lastIndex, matchIndex);
      if (segment) {
        parts.push({ text: segment });
      }

      // Add the placeholder text tag itself so the AI has a textual anchor
      parts.push({ text: `[IMAGE_REF_${imageIdx}]` });

      // If we have the image base64, add it as inlineData
      if (images && images[imageIdx]) {
        const imageStr = images[imageIdx];
        const commaIdx = imageStr.indexOf(',');
        if (commaIdx !== -1) {
          const mimeTypeMatch = imageStr.match(/^data:([^;]+);base64,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
          const base64Data = imageStr.substring(commaIdx + 1);
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add any remaining text
    const remainingSegment = text.substring(lastIndex);
    if (remainingSegment) {
      parts.push({ text: remainingSegment });
    }

    const finalContents = [
      {
        text: `Analyze the uploaded document and either extract its questions or generate highly educational quiz questions based on its content:
File Name: ${fileName || 'Uploaded Document'}
Proposed Subject: ${subject || 'Auto-detect'}
Default Difficulty: ${difficulty || 'Auto-detect'}
Custom rules/guidelines: ${customInstructions || 'Extract all existing questions or generate a comprehensive set of test questions covering all key concepts.'}

Document Content:
---
`
      },
      ...parts,
      { text: `\n---` }
    ];

    // Response schema configuration using standard GoogleGenAI schema types
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        quizTitle: {
          type: Type.STRING,
          description: 'A professional and descriptive title for this quiz generated from the document context.',
        },
        quizDescription: {
          type: Type.STRING,
          description: 'A rich, concise summary of the quiz scope, topics covered, and total questions.',
        },
        subject: {
          type: Type.STRING,
          description: 'The primary subject of the exam (e.g. Civil Engineering, Organic Chemistry, Philippine History).',
        },
        category: {
          type: Type.STRING,
          description: 'Sub-topic or examiner category (e.g. Structural Design, Board Exam Review, Midterms).',
        },
        questions: {
          type: Type.ARRAY,
          description: 'The complete and comprehensive list of ALL extracted questions from the document in sequential order. You MUST NOT leave out, skip, or summarize any questions. If the document has 50 questions, extract all 50. If there are 100, extract all 100. If generating, create 15 to 25 highly comprehensive questions.',
          items: {
            type: Type.OBJECT,
            properties: {
              number: {
                type: Type.STRING,
                description: "Original or sequential numbering of the question (e.g., '1.', 'Part I, Q2', '14').",
              },
              text: {
                type: Type.STRING,
                description: 'The exact original text of the question or the generated question text. Include inline image references like [IMAGE_REF_0], tables, mathematical symbols, or blanks exactly as written.',
              },
              type: {
                type: Type.STRING,
                description: "The format: 'MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'ENUMERATION', 'FILL_IN_BLANK', 'MATCHING', 'SITUATIONAL', 'COMPUTATIONAL', 'ESSAY', 'OTHERS'",
              },
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "For MCQ, the full list of selectable answers (at least 4 options). Retain or assign lettering (e.g. 'A. Option 1', 'B. Option 2').",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct answer. For MCQ, extract or assign the letter (e.g. 'A') or the exact matching text. If True/False, write 'True' or 'False'. If identification or fill in the blank, write the short word/phrase.",
              },
              matchingPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    left: { type: Type.STRING, description: 'Left-hand item' },
                    right: { type: Type.STRING, description: 'Correct matching right-hand item' },
                  },
                  required: ['left', 'right'],
                },
                description: 'For Matching questions, the mapping of correct matchings.',
              },
              tableData: {
                type: Type.ARRAY,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                description: 'For questions containing structural tables, the rows and columns extracted as text.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Comprehensive, step-by-step solution, mathematical calculations with LaTeX, or in-depth conceptual explanation.',
              },
              difficulty: {
                type: Type.STRING,
                description: "Difficulty assessment: 'easy', 'medium', or 'hard'.",
              },
              category: {
                type: Type.STRING,
                description: 'Specific sub-category or chapter for this question.',
              },
              pageNumber: {
                type: Type.INTEGER,
                description: 'The page number in the original document where this question was located (if available/inferred).',
              },
            },
            required: ['number', 'text', 'type'],
          },
        },
      },
      required: ['quizTitle', 'questions'],
    };

    const response = await generateContentWithRetryAndFallback({
      contents: { parts: finalContents },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1, // Lower temperature for extremely high fidelity factual extraction and layout adherence
      },
    });

    let jsonText = response.text;
    if (!jsonText) {
      throw new Error('Gemini returned an empty response.');
    }

    // Trim whitespace and strip any markdown wrappers if present
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```')) {
      const match = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      if (match) {
        jsonText = match[1].trim();
      }
    }

    // Custom high-fidelity JSON string sanitizer to handle LaTeX math and improper backslash escapes
    const sanitizeJsonString = (jsonStr: string): string => {
      let result = '';
      let inString = false;
      let i = 0;
      const len = jsonStr.length;

      while (i < len) {
        const char = jsonStr[i];
        if (!inString) {
          if (char === '"') {
            inString = true;
          }
          result += char;
          i++;
        } else {
          if (char === '\\') {
            if (i + 1 < len) {
              const nextChar = jsonStr[i + 1];
              let isValidEscape = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't'].includes(nextChar);

              // If it's b, f, r, or t, check if it's followed by an alphabetic character
              // representing a LaTeX command (e.g., \frac, \right, \begin, \times) rather than a control escape
              if (isValidEscape && ['b', 'f', 'r', 't'].includes(nextChar) && i + 2 < len) {
                const afterNextChar = jsonStr[i + 2];
                if (/^[a-zA-Z]$/.test(afterNextChar)) {
                  isValidEscape = false; // Treat as LaTeX/word, double-escape it
                }
              }

              if (isValidEscape) {
                result += '\\' + nextChar;
                i += 2;
              } else if (nextChar === 'u') {
                if (i + 5 < len) {
                  const hexPart = jsonStr.substring(i + 2, i + 6);
                  if (/^[0-9a-fA-F]{4}$/.test(hexPart)) {
                    result += '\\u' + hexPart;
                    i += 6;
                  } else {
                    result += '\\\\';
                    i++;
                  }
                } else {
                  result += '\\\\';
                  i++;
                }
              } else {
                result += '\\\\';
                i++;
              }
            } else {
              result += '\\\\';
              i++;
            }
          } else if (char === '"') {
            inString = false;
            result += char;
            i++;
          } else if (char === '\n') {
            result += '\\n';
            i++;
          } else if (char === '\r') {
            result += '\\r';
            i++;
          } else if (char === '\t') {
            result += '\\t';
            i++;
          } else {
            const code = char.charCodeAt(0);
            if (code < 32) {
              result += '\\u' + code.toString(16).padStart(4, '0');
            } else {
              result += char;
            }
            i++;
          }
        }
      }
      return result;
    };

    let sanitizedJsonText = jsonText;
    try {
      sanitizedJsonText = sanitizeJsonString(jsonText);
    } catch (e) {
      console.warn('Error during custom JSON string sanitization:', e);
    }

    let quizData;
    try {
      quizData = JSON.parse(sanitizedJsonText);
    } catch (parseError: any) {
      console.error('JSON parsing failed. Attempting desperate fallback cleanup:', parseError);
      try {
        const desperateClean = jsonText.replace(/\\/g, '\\\\')
                                        .replace(/\\\\"/g, '\\"')
                                        .replace(/\\\\n/g, '\\n')
                                        .replace(/\\\\r/g, '\\r')
                                        .replace(/\\\\t/g, '\\t')
                                        .replace(/\\\\f/g, '\\f')
                                        .replace(/\\\\b/g, '\\b');
        quizData = JSON.parse(desperateClean);
      } catch (fallbackError: any) {
        console.error('All JSON recovery attempts failed:', fallbackError);
        throw parseError;
      }
    }

    return NextResponse.json({
      success: true,
      quiz: quizData,
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Electrical Review Pro generation failed: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
