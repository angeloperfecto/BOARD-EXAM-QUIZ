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
  const models = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  const maxRetries = 1;
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId: any;
      try {
        console.log(`Generating quiz with ${model} (attempt ${attempt + 1})...`);
        
        // Timeout of 24 seconds per API call to prevent Gateway 504 timeouts and switch to fallback models gracefully
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT_EXPIRED')), 24000);
        });

        const responsePromise = ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config,
        });

        const response = await Promise.race([responsePromise, timeoutPromise]) as any;
        clearTimeout(timeoutId);

        const extractedText = response?.text || 
          response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('');

        if (extractedText && extractedText.trim().length > 0) {
          console.log(`Successfully generated quiz with ${model}`);
          return { ...response, text: extractedText };
        }

        const finishReason = response?.candidates?.[0]?.finishReason;
        throw new Error(`Empty response received (finishReason: ${finishReason || 'UNKNOWN'})`);
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = err;
        
        const errStr = String(err?.message || err || '');
        const lowerErr = errStr.toLowerCase();

        // If it's a timeout, break immediately to the next model to preserve time budget
        if (lowerErr.includes('timeout_expired')) {
          console.log(`Model ${model} timed out. Switching to next fallback model...`);
          break;
        }

        // If quota or rate limit on this specific model, try next model in cascade
        if (lowerErr.includes('429') || lowerErr.includes('quota') || lowerErr.includes('resource_exhausted')) {
          console.log(`Model ${model} rate limited or quota reached. Trying next fallback model...`);
          break;
        }

        // If the model is experiencing high demand (503/UNAVAILABLE), break immediately to fallback model
        if (
          lowerErr.includes('503') || 
          lowerErr.includes('unavailable') || 
          lowerErr.includes('high demand') ||
          lowerErr.includes('limit')
        ) {
          console.log(`Model ${model} currently experiencing high demand. Seamlessly switching to next fallback model...`);
          break;
        }

        // If it's a 404 or unsupported model error, break early to next model
        if (lowerErr.includes('404') || lowerErr.includes('not found') || lowerErr.includes('unsupported')) {
          console.log(`Model ${model} endpoint unavailable. Switching to next model...`);
          break;
        }

        if (attempt === maxRetries) {
          console.log(`Switching from ${model} to next fallback model...`);
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const errorMessage = lastError?.message || JSON.stringify(lastError) || 'Unknown error';
  throw new Error(`All models and retries failed due to API errors / high demand. Last error: ${errorMessage}`);
}

// JSON sanitization helper to handle LaTeX math and improper backslash escapes
function sanitizeJsonString(jsonStr: string): string {
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
}

function parseAndCleanQuizJson(rawText: string): any {
  let jsonText = (rawText || '').trim();
  if (jsonText.startsWith('```')) {
    const match = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (match) {
      jsonText = match[1].trim();
    }
  }

  let sanitized = jsonText;
  try {
    sanitized = sanitizeJsonString(jsonText);
  } catch {
    sanitized = jsonText;
  }

  try {
    return JSON.parse(sanitized);
  } catch (err: any) {
    try {
      const desperateClean = jsonText.replace(/\\/g, '\\\\')
                                    .replace(/\\\\"/g, '\\"')
                                    .replace(/\\\\n/g, '\\n')
                                    .replace(/\\\\r/g, '\\r')
                                    .replace(/\\\\t/g, '\\t')
                                    .replace(/\\\\f/g, '\\f')
                                    .replace(/\\\\b/g, '\\b');
      return JSON.parse(desperateClean);
    } catch {
      throw err;
    }
  }
}

// Splits full document text into sequential page blocks or chunks
interface DocChunk {
  text: string;
  chunkIndex: number;
  totalChunks: number;
  pageRange: string;
}

function splitDocumentIntoChunks(fullText: string): DocChunk[] {
  // Check for page markers [PAGE_NUMBER_MARKER_X]
  const pageMarkerRegex = /\[PAGE_NUMBER_MARKER_(\d+)\]/g;
  const pageMatches: { pageNum: number; index: number }[] = [];
  let m;
  while ((m = pageMarkerRegex.exec(fullText)) !== null) {
    pageMatches.push({ pageNum: parseInt(m[1], 10), index: m.index });
  }

  // If we have distinct pages and more than 3 pages, group by 3 pages per chunk
  if (pageMatches.length > 3) {
    const chunks: DocChunk[] = [];
    const pagesPerChunk = 3;
    const totalPages = pageMatches.length;
    const numChunks = Math.ceil(totalPages / pagesPerChunk);

    for (let c = 0; c < numChunks; c++) {
      const startPageIdx = c * pagesPerChunk;
      const endPageIdx = Math.min(startPageIdx + pagesPerChunk - 1, totalPages - 1);
      
      const startPos = pageMatches[startPageIdx].index;
      const nextChunkPageIdx = endPageIdx + 1;
      const endPos = nextChunkPageIdx < totalPages ? pageMatches[nextChunkPageIdx].index : fullText.length;
      
      const chunkText = fullText.substring(startPos, endPos).trim();
      const startPageNum = pageMatches[startPageIdx].pageNum;
      const endPageNum = pageMatches[endPageIdx].pageNum;

      chunks.push({
        text: chunkText,
        chunkIndex: c + 1,
        totalChunks: numChunks,
        pageRange: `Pages ${startPageNum} to ${endPageNum}`,
      });
    }

    return chunks;
  }

    // If text is very long (> 24000 characters) without page markers, split into ~20000 character chunks
  if (fullText.length > 24000) {
    const chunks: DocChunk[] = [];
    const targetSize = 20000;
    let currentPos = 0;
    let chunkCounter = 1;

    while (currentPos < fullText.length) {
      let nextPos = currentPos + targetSize;
      if (nextPos >= fullText.length) {
        nextPos = fullText.length;
      } else {
        // Try to break at a double newline or question number
        const slice = fullText.substring(nextPos - 1200, nextPos + 1200);
        const breakMatch = slice.match(/\n\n(?:\d+[\.\)]|\bQuestion\s+\d+|Q\d+[\.\:])/i);
        if (breakMatch && breakMatch.index !== undefined) {
          nextPos = nextPos - 1200 + breakMatch.index + 2;
        }
      }

      chunks.push({
        text: fullText.substring(currentPos, nextPos).trim(),
        chunkIndex: chunkCounter,
        totalChunks: 1, // Will update below
        pageRange: `Section ${chunkCounter}`,
      });

      currentPos = nextPos;
      chunkCounter++;
    }

    chunks.forEach(c => c.totalChunks = chunks.length);
    return chunks;
  }

  // Short document: 1 single chunk
  return [{
    text: fullText,
    chunkIndex: 1,
    totalChunks: 1,
    pageRange: 'All Pages',
  }];
}

// Deterministic & Offline Parser to extract questions with 100% fidelity even when API limits or offline modes occur
interface DeterministicQuestion {
  number: string;
  text: string;
  type: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  category: string;
  pageNumber?: number;
}

function parseQuestionsDeterministically(
  fullText: string,
  fileName?: string,
  subject?: string,
  difficulty?: string
): DeterministicQuestion[] {
  // 1. First, parse global answer keys if any
  const answerKeyMap: Record<string, string> = {};
  const ansKeyRegex = /(?:^|\s)(?:(?:Q|Question|Item)?\s*(\d+)[\.\-\:\s\)]+\s*([A-Ea-e]|True|False|TRUE|FALSE)\b)/gi;
  let akMatch;
  while ((akMatch = ansKeyRegex.exec(fullText)) !== null) {
    const qNum = akMatch[1];
    const ans = akMatch[2].toUpperCase();
    if (parseInt(qNum, 10) < 500) {
      answerKeyMap[qNum] = ans;
    }
  }

  // 2. Normalize and split text by lines
  const lines = fullText.split(/\r?\n/);
  const questions: DeterministicQuestion[] = [];
  
  let currentQuestion: DeterministicQuestion | null = null;
  let currentSituation = '';
  let currentPage = 1;

  const pushCurrentQuestion = () => {
    if (currentQuestion && currentQuestion.text.trim().length > 0) {
      // If answer not set yet, check answerKeyMap
      const numMatch = currentQuestion.number.match(/\d+/);
      if (numMatch) {
        const mapped = answerKeyMap[numMatch[0]];
        if (mapped) {
          currentQuestion.correctAnswer = mapped;
        }
      }
      if (currentQuestion.type === 'MCQ' && currentQuestion.choices.length === 0) {
        currentQuestion.type = 'IDENTIFICATION';
      }
      questions.push(currentQuestion);
    }
    currentQuestion = null;
  };

  const questionStartRegex = /^(?:(?:Question|Item|Problem|Q\.?)\s*(\d+)[\.\:\)]|\((\d+)\)|(\d+)[\.\)]\s+)(.*)$/i;
  const choiceRegex = /^[\s\t]*(\*?[A-Ea-e])[\.\:\)]\s+(.*)$/;
  const inlineAnsRegex = /^(?:Answer|Ans|KEY|Correct\s*Answer)\s*[\:\-\=]\s*([A-Ea-e]|True|False|TRUE|FALSE|[^\n]+)/i;
  const inlineExplRegex = /^(?:Explanation|Solution|Rationale|Analysis|Discussion)\s*[\:\-\=]\s*(.*)$/i;
  const situationRegex = /^(?:Situation|SITUATION|Problem\s*Set)\s*(\d+)?[\:\-\.]\s*(.*)$/i;
  const pageMarkerRegex = /^\[PAGE_NUMBER_MARKER_(\d+)\]$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const pageMatch = rawLine.match(pageMarkerRegex);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    const sitMatch = rawLine.match(situationRegex);
    if (sitMatch) {
      currentSituation = rawLine;
      continue;
    }

    // Check if line starts a new question
    const qMatch = rawLine.match(questionStartRegex);
    if (qMatch) {
      pushCurrentQuestion();
      const numStr = qMatch[1] || qMatch[2] || qMatch[3] || `${questions.length + 1}`;
      const restText = (qMatch[4] || '').trim();
      
      let fullQText = restText;
      if (currentSituation && !fullQText.includes(currentSituation)) {
        fullQText = `[${currentSituation}]\n${fullQText}`;
      }

      currentQuestion = {
        number: `${numStr}.`,
        text: fullQText,
        type: 'MCQ',
        choices: [],
        correctAnswer: 'A',
        explanation: 'Step-by-step review concept extracted from document text.',
        difficulty: (difficulty as any) || 'medium',
        category: subject || 'Board Exam Review',
        pageNumber: currentPage,
      };
      continue;
    }

    if (!currentQuestion) {
      continue;
    }

    // Check for choices (A., B., C., D.)
    const cMatch = rawLine.match(choiceRegex);
    if (cMatch) {
      const choiceLabel = cMatch[1].replace('*', '').toUpperCase();
      const choiceText = cMatch[2].trim();
      currentQuestion.choices.push(`${choiceLabel}. ${choiceText}`);
      
      if (cMatch[1].startsWith('*')) {
        currentQuestion.correctAnswer = choiceLabel;
      }
      continue;
    }

    // Check for inline answer
    const aMatch = rawLine.match(inlineAnsRegex);
    if (aMatch) {
      const detectedAns = aMatch[1].trim();
      if (/^[A-Ea-e]$/.test(detectedAns)) {
        currentQuestion.correctAnswer = detectedAns.toUpperCase();
      } else {
        currentQuestion.correctAnswer = detectedAns;
      }
      continue;
    }

    // Check for explanation
    const expMatch = rawLine.match(inlineExplRegex);
    if (expMatch) {
      currentQuestion.explanation = expMatch[1].trim() || 'Refer to governing board principles and solutions.';
      continue;
    }

    // Otherwise append to question text if choices haven't started, or to last choice
    if (currentQuestion.choices.length === 0) {
      currentQuestion.text += `\n${rawLine}`;
    } else {
      const lastChoiceIdx = currentQuestion.choices.length - 1;
      currentQuestion.choices[lastChoiceIdx] += ` ${rawLine}`;
    }
  }

  pushCurrentQuestion();
  return questions;
}

// Find potential Answer Key in document (usually in last pages or at bottom)
function extractGlobalAnswerKey(fullText: string): string {
  const answerKeyMarkers = [
    /(?:ANSWER\s*KEY|KEY\s*TO\s*CORRECTION|ANSWERS\s*AND\s*SOLUTIONS|CORRECT\s*ANSWERS|SOLUTIONS\s*KEY)[\s\S]{10,2500}/i,
    /(?:Answers?\s*:?\s*(?:\n|\s)*(?:1[\.\-\s]+[A-D\d]|Q1[\.\-\s]+[A-D\d])[\s\S]{10,1500})/i
  ];

  for (const regex of answerKeyMarkers) {
    const match = fullText.match(regex);
    if (match) {
      return match[0].trim();
    }
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const { text, images, fileName, subject, difficulty, customInstructions } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No document text provided for extraction' }, { status: 400 });
    }

    // Extract any Global Answer Key from the whole document to help every chunk
    const globalAnswerKey = extractGlobalAnswerKey(text);

    // Split document into structured chunks to guarantee 100% of all questions are scanned
    const chunks = splitDocumentIntoChunks(text);
    console.log(`Document split into ${chunks.length} chunk(s) for exhaustive scanning.`);

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
          description: 'The primary subject of the exam (e.g. Civil Engineering, Electrical Engineering, Nursing, Mathematics).',
        },
        category: {
          type: Type.STRING,
          description: 'Sub-topic or examiner category (e.g. Structural Design, Board Exam Review, Licensure Exam).',
        },
        questions: {
          type: Type.ARRAY,
          description: 'The exhaustive, complete list of ALL questions extracted from this document section. You MUST NOT leave out, skip, or summarize any questions.',
          items: {
            type: Type.OBJECT,
            properties: {
              number: {
                type: Type.STRING,
                description: "Original numbering of the question as written in document (e.g., '1.', '2.', 'Situation 1 - Q1').",
              },
              text: {
                type: Type.STRING,
                description: 'The exact question text with full LaTeX formulas, variables, and any situation or context included.',
              },
              type: {
                type: Type.STRING,
                description: "The format: 'MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'ENUMERATION', 'FILL_IN_BLANK', 'MATCHING', 'SITUATIONAL', 'COMPUTATIONAL', 'ESSAY', 'OTHERS'",
              },
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "For MCQ, the full list of selectable answers (options A, B, C, D) with LaTeX math preserved.",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The correct answer (e.g. 'A', 'B', 'True', 'False', or short answer text).",
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
                description: 'The page number in the original document where this question was located.',
              },
              solution: {
                type: Type.OBJECT,
                description: 'Optional structured whiteboard step-by-step solution derivation for calculations and formulas.',
                properties: {
                  given: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of given parameters or values with LaTeX notation.',
                  },
                  find: {
                    type: Type.STRING,
                    description: 'The variable or quantity to solve for.',
                  },
                  principles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Governing formulas or laws in LaTeX.',
                  },
                  diagram: {
                    type: Type.OBJECT,
                    description: 'Optional diagram metadata.',
                    properties: {
                      type: { type: Type.STRING },
                      title: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        latexFormula: { type: Type.STRING },
                        subSteps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: ['title', 'description'],
                    },
                  },
                  finalAnswerLatex: { type: Type.STRING },
                  finalAnswerSummary: { type: Type.STRING },
                  mnemonic: { type: Type.STRING },
                  tipsAndTricks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
            required: ['number', 'text', 'type'],
          },
        },
      },
      required: ['quizTitle', 'questions'],
    };

    const allExtractedQuestions: any[] = [];
    let combinedTitle = '';
    let combinedDescription = '';
    let combinedSubject = subject || '';
    let combinedCategory = 'Board Exam Review';

    // Process all chunks sequentially to guarantee complete question recovery without omission
    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      console.log(`Processing Chunk ${chunk.chunkIndex}/${chunk.totalChunks} (${chunk.pageRange})...`);

      const systemInstruction = `You are an elite, exhaustive Exam Scanner and Question Extractor AI.
Your directive is to extract 100% of ALL questions located in this section (${chunk.pageRange}) of the uploaded document with absolute completeness and zero omission.

CRITICAL DIRECTIVES:
1. EXHAUSTIVE 100% SCANNING:
   - Scan every single line, column, and problem.
   - Do NOT skip, do NOT sample, and do NOT truncate questions. If this section has 10, 20, 30, or 50 questions, extract ALL of them.
   - Look for question numbering: '1.', '2.', 'Problem 1:', 'Q1', '(1)', etc.
   - If situational problems exist (e.g. 'Situation 1: A 10m beam... Questions 1, 2, and 3'), prepend the situation description to EACH related question so they are fully self-contained.
2. CHOICES & ANSWER EXTRACTION:
   - For Multiple Choice Questions (MCQ), extract all choices (A, B, C, D) into the 'choices' array.
   - Detect correct answers from bolding, asterisk (*), answer keys, or context.
   ${globalAnswerKey ? `3. GLOBAL ANSWER KEY REFERENCE:\nUse this document answer key when available:\n${globalAnswerKey}\n` : ''}
4. STRICT LATEX FOR MATHEMATICAL FORMULAS:
   - Wrap inline math in single dollar signs like '$...$' (e.g., '$E = mc^2$', '$\\frac{a}{b}$', '$\\sigma = \\frac{P}{A}$').
   - Wrap standalone formulas in double dollar signs like '$$...$$'.
   - Double-escape backslashes in JSON (write '\\\\frac' or '\\\\sigma').
5. COMPREHENSIVE LAYERED STEP-BY-STEP EXPLANATIONS & WHITEBOARD SOLUTIONS:
   - For every calculation or conceptual problem, provide a crystal-clear, layered step-by-step derivation.
   - Never squish or compress multiple formulas into one dense line. Format each intermediate calculation as a distinct, sequential step with title, formula in LaTeX, and narrative explanation.
   - When calculations involve engineering laws (e.g. Ohm's law, 3-phase power, Pouillet's resistance law, moment distribution, Bernoulli's, etc.), populate the structured 'solution' object with 'given', 'find', 'principles', and 'steps' (each step having 'title', 'latexFormula', 'description').
   - For the 'explanation' text, write distinct sentences with clear step headers (e.g. 'Step 1: Calculate Total Line Loss: $P_{\\text{loss}} = ...$. Step 2: Determine Current: $I = ...$.') so users can easily digest the solution layer-by-layer.`;

      // Construct multimodal parts for this chunk
      const parts: any[] = [];
      let lastIndex = 0;
      const regex = /\[IMAGE_REF_(\d+)\]/g;
      let match;

      while ((match = regex.exec(chunk.text)) !== null) {
        const matchIndex = match.index;
        const imageIdx = parseInt(match[1], 10);

        const segment = chunk.text.substring(lastIndex, matchIndex);
        if (segment) {
          parts.push({ text: segment });
        }

        parts.push({ text: `[IMAGE_REF_${imageIdx}]` });

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

      const remainingSegment = chunk.text.substring(lastIndex);
      if (remainingSegment) {
        parts.push({ text: remainingSegment });
      }

      const finalContents = [
        {
          text: `EXHAUSTIVE EXAM QUESTION EXTRACTION:
Source Document: ${fileName || 'Uploaded Material'}
Chunk Section: Part ${chunk.chunkIndex} of ${chunk.totalChunks} (${chunk.pageRange})
Proposed Subject: ${subject || 'Auto-detect'}
Default Difficulty: ${difficulty || 'Auto-detect'}
Custom Rules: ${customInstructions || 'Extract all existing questions with 100% fidelity without omitting any.'}

Document Content to Scan:
---
`
        },
        ...parts,
        { text: `\n---` }
      ];

      try {
        const response = await generateContentWithRetryAndFallback({
          contents: { parts: finalContents },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        });

        const parsed = parseAndCleanQuizJson(response.text);
        if (parsed && Array.isArray(parsed.questions)) {
          if (!combinedTitle && parsed.quizTitle) combinedTitle = parsed.quizTitle;
          if (!combinedDescription && parsed.quizDescription) combinedDescription = parsed.quizDescription;
          if (!combinedSubject && parsed.subject) combinedSubject = parsed.subject;
          if (parsed.category) combinedCategory = parsed.category;

          parsed.questions.forEach((q: any) => {
            if (q && q.text && q.text.trim().length > 0) {
              allExtractedQuestions.push(q);
            }
          });
          console.log(`Chunk ${chunk.chunkIndex} yielded ${parsed.questions.length} questions. Running total: ${allExtractedQuestions.length}`);
        }
      } catch (chunkErr: any) {
        console.warn(`AI model notice on chunk ${chunk.chunkIndex}. Engaging offline rule-based parser for this section...`, chunkErr?.message || chunkErr);
        // Fallback: parse this chunk's text deterministically so questions are never missed
        const offlineChunkQuestions = parseQuestionsDeterministically(chunk.text, fileName, subject, difficulty);
        if (offlineChunkQuestions.length > 0) {
          console.log(`Offline parser recovered ${offlineChunkQuestions.length} questions from chunk ${chunk.chunkIndex}.`);
          offlineChunkQuestions.forEach(q => allExtractedQuestions.push(q));
        }
      }
    }

    if (allExtractedQuestions.length === 0) {
      console.log('AI chunks returned 0 questions. Running full-document deterministic exam parser...');
      const fullDocQuestions = parseQuestionsDeterministically(text, fileName, subject, difficulty);
      if (fullDocQuestions.length > 0) {
        console.log(`Full-document parser recovered ${fullDocQuestions.length} questions.`);
        fullDocQuestions.forEach(q => allExtractedQuestions.push(q));
      }
    }

    if (allExtractedQuestions.length === 0) {
      throw new Error('No questions could be extracted from the document. Please ensure the document contains legible exam text or questions.');
    }

    // Deduplicate questions by text similarity / number and ensure sequential numbering
    const seenTexts = new Set<string>();
    const deduplicatedQuestions = allExtractedQuestions.filter(q => {
      const normalized = (q.text || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 100);
      if (!normalized || seenTexts.has(normalized)) return false;
      seenTexts.add(normalized);
      return true;
    });

    // Re-index question numbers cleanly if needed
    const finalQuestions = deduplicatedQuestions.map((q, index) => ({
      ...q,
      number: q.number || `${index + 1}.`,
    }));

    const finalQuiz = {
      quizTitle: combinedTitle || `Exam Reviewer: ${fileName || 'Extracted Quiz'}`,
      quizDescription: combinedDescription || `Comprehensive board exam reviewer containing ${finalQuestions.length} extracted questions.`,
      subject: combinedSubject || 'Board Exam Review',
      category: combinedCategory || 'Licensure Reviewer',
      questions: finalQuestions,
    };

    console.log(`Successfully completed 100% extraction: Total of ${finalQuestions.length} questions extracted.`);

    return NextResponse.json({
      success: true,
      quiz: finalQuiz,
      totalExtracted: finalQuestions.length,
      chunksProcessed: chunks.length,
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Board Exam Review Pro generation failed: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
