export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  IDENTIFICATION = 'IDENTIFICATION',
  ENUMERATION = 'ENUMERATION',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  MATCHING = 'MATCHING',
  SITUATIONAL = 'SITUATIONAL',
  COMPUTATIONAL = 'COMPUTATIONAL',
  ESSAY = 'ESSAY',
  OTHERS = 'OTHERS',
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface VisualDiagramData {
  type: 'circuit' | 'power_triangle' | 'phasor' | 'transformer' | 'pythagoras' | 'beam' | 'generic';
  title?: string;
  labels?: Record<string, string | number>;
  values?: Record<string, string | number>;
  notes?: string;
}

export interface WhiteboardSolution {
  given?: string[];
  find?: string;
  principles?: string[];
  diagram?: VisualDiagramData;
  steps: {
    title: string;
    description: string;
    latexFormula?: string;
    subSteps?: string[];
  }[];
  finalAnswerLatex?: string;
  finalAnswerSummary?: string;
  tipsAndTricks?: string[];
  mnemonic?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  number: string; // Keep as string to preserve original numbering like "1.", "1.1", "Q1"
  text: string;
  image?: string | null; // Base64 or ObjectURL
  choices?: string[] | null; // For MCQ
  correctAnswer?: string | string[] | null; // Single answer for MCQ/Identification, multiple for Enumeration
  matchingPairs?: MatchingPair[] | null; // For MATCHING type
  tableData?: string[][] | null; // For table-based questions
  explanation?: string | null;
  solution?: WhiteboardSolution | null; // Detailed step-by-step whiteboard solution
  category?: string | null;
  subject?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  pageNumber?: number | null;
  sourceFile?: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  createdAt: string;
  sourceFiles: string[];
  subject: string | null;
  category: string | null;
  isPublished: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: Record<string, any>; // questionId -> answer structure
  score: number;
  totalQuestions: number;
  completedAt?: string | null;
  status: 'in_progress' | 'completed';
  startedAt: string;
  activeQuestions?: Question[]; // Preserved randomized order and choices
  timeLimit?: number; // Time limit in seconds, 0 or undefined for no limit
  scheduledQuizId?: string | null; // References the calendar schedule id if started from a schedule
}

export interface ScheduledQuiz {
  id: string;
  quizId: string; // References original quiz id
  quizTitle: string; // Cached title
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // Duration in minutes. 0 means no limit.
  subject?: string | null;
  category?: string | null;
  notes?: string | null;
}

export interface ExtractionLog {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  totalPages?: number;
  processedPages?: number;
  questionsFound: number;
  error?: string | null;
}
