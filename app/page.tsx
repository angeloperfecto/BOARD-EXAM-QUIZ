'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  BookOpen,
  Award,
  FileSpreadsheet,
  Layers,
  Settings2,
  Save,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
  ShieldCheck,
  FileCode,
  CheckSquare,
  HelpCircle,
  Clock,
  UserCheck,
  History,
  TrendingUp,
  TrendingDown,
  Activity,
  Trophy,
  Flame,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  XCircle,
  Zap,
  Star,
  Info,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionType, Question, Quiz, QuizAttempt, ExtractionLog, ScheduledQuiz } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';
import { ExplanationVisualizer } from '@/components/ExplanationVisualizer';
import { parseQuestionsDeterministically } from '@/lib/deterministicParser';
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
  cleanupLegacyStorageKeys
} from '@/lib/storage';

// Recharts components imports
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Dynamic script loader for PDF.js CDN
const loadPDFJS = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js library'));
    document.head.appendChild(script);
  });
};

// Default high-quality, professional sample reviewer questions with Whiteboard Solutions
const SAMPLE_QUIZ: Quiz = {
  id: 'sample-civil-engineering',
  title: 'PRC Board Exam Reviewer (Engineering & Applied Sciences)',
  description: 'A comprehensive professional board reviewer demonstrating step-by-step whiteboard solutions, AC power triangles, beam shear diagrams, NSCP codes, and matching formats.',
  subject: 'Engineering Sciences & Allied Subjects',
  category: 'PRC Board Review',
  isPublished: true,
  createdAt: new Date().toISOString(),
  sourceFiles: ['PRC_Board_Review_Module_2025.pdf'],
  questions: [
    {
      id: 'q1',
      number: '1',
      type: QuestionType.MCQ,
      text: 'A simply supported reinforced concrete beam spans $L = 6\\text{ m}$ and carries a uniformly distributed service dead load $w_D = 15\\text{ kN/m}$ and service live load $w_L = 20\\text{ kN/m}$. Applying NSCP/ACI LRFD load factors ($w_u = 1.2w_D + 1.6w_L$), determine the maximum factored shear force ($V_u$) at the support.',
      choices: [
        'A. Vu = 110 kN',
        'B. Vu = 135 kN',
        'C. Vu = 150 kN',
        'D. Vu = 168 kN'
      ],
      correctAnswer: 'C',
      explanation: 'Factored load wu = 1.2(15) + 1.6(20) = 18 + 32 = 50 kN/m. The maximum shear force Vu at the support of a simply supported beam is wu * L / 2 = 50 * 6 / 2 = 150 kN.',
      solution: {
        given: [
          'Span \\; L = 6.0\\text{ m}',
          'Dead \\; Load \\; w_D = 15\\text{ kN/m}',
          'Live \\; Load \\; w_L = 20\\text{ kN/m}',
          'Load \\; Combination: 1.2D + 1.6L'
        ],
        find: 'Maximum \\; Factored \\; Shear \\; Force \\; (V_u) \\; at \\; support',
        principles: [
          'NSCP 2015 / ACI 318 Ultimate Load Combination: w_u = 1.2w_D + 1.6w_L',
          'Statics Equilibrium for Simply Supported Beam: V_{max} = \\frac{w_u L}{2}'
        ],
        diagram: {
          type: 'generic',
          title: 'Beam Loading & Shear Reaction',
          labels: {
            L: '6.0 m',
            wu: '50 kN/m',
            Vu: '150 kN'
          },
          notes: 'Uniformly Distributed Load across span L with symmetric support reactions.'
        },
        steps: [
          {
            title: 'Compute Factored Distributed Load (wu)',
            description: 'Apply the ultimate limit state design load combination factors to the given dead and live loads.',
            latexFormula: 'w_u = 1.2(15\\text{ kN/m}) + 1.6(20\\text{ kN/m}) = 18 + 32 = 50\\text{ kN/m}',
            subSteps: [
              'Factored Dead Load: 1.2 × 15 = 18 kN/m',
              'Factored Live Load: 1.6 × 20 = 32 kN/m',
              'Total Factored Load wu = 50 kN/m'
            ]
          },
          {
            title: 'Calculate Support Shear Reaction (Vu)',
            description: 'For a simply supported beam under uniform loading, the reaction and maximum shear occur at the supports.',
            latexFormula: 'V_u = \\frac{w_u \\cdot L}{2} = \\frac{50\\text{ kN/m} \\times 6\\text{ m}}{2} = 150\\text{ kN}',
            subSteps: [
              'Total load on beam = wu × L = 50 × 6 = 300 kN',
              'Reaction at each support = 300 / 2 = 150 kN'
            ]
          }
        ],
        finalAnswerLatex: 'V_u = 150\\text{ kN}',
        finalAnswerSummary: 'The maximum factored shear force at the critical support section is 150 kN (Option C).',
        mnemonic: 'Remember: 1.2D + 1.6L is standard NSCP strength design combo for gravity loads.',
        tipsAndTricks: [
          'Always verify if service loads are already factored or need LRFD multipliers.',
          'Critical section for beam shear in RC design is located at distance d from support face, but maximum reaction is at support center.'
        ]
      },
      difficulty: 'hard',
      category: 'Structural Mechanics',
      pageNumber: 3
    },
    {
      id: 'q2',
      number: '2',
      type: QuestionType.MCQ,
      text: 'A $230\\text{ V}$, $60\\text{ Hz}$ single-phase industrial load draws an active power of $P = 12\\text{ kW}$ at a lagging power factor of $\\cos\\theta = 0.80$. Determine the apparent power ($S$) and the reactive power ($Q$) drawn by the load.',
      choices: [
        'A. S = 15 kVA, Q = 9 kVAR',
        'B. S = 12 kVA, Q = 6 kVAR',
        'C. S = 18 kVA, Q = 12 kVAR',
        'D. S = 20 kVA, Q = 16 kVAR'
      ],
      correctAnswer: 'A',
      explanation: 'Apparent power S = P / pf = 12 / 0.80 = 15 kVA. Reactive power Q = sqrt(S^2 - P^2) = sqrt(15^2 - 12^2) = sqrt(225 - 144) = sqrt(81) = 9 kVAR.',
      solution: {
        given: [
          'Voltage \\; V = 230\\text{ V}',
          'Active \\; Power \\; P = 12\\text{ kW}',
          'Power \\; Factor \\; \\cos\\theta = 0.80 \\; (\\text{lagging})'
        ],
        find: 'Apparent \\; Power \\; (S) \\; and \\; Reactive \\; Power \\; (Q)',
        principles: [
          'Power Factor: \\cos\\theta = \\frac{P}{S} \\implies S = \\frac{P}{\\cos\\theta}',
          'Power Triangle: S^2 = P^2 + Q^2 \\implies Q = \\sqrt{S^2 - P^2} = P \\tan\\theta'
        ],
        diagram: {
          type: 'power_triangle',
          title: 'AC Power Triangle (Lagging Load)',
          labels: {
            P: '12 kW',
            Q: '9 kVAR',
            S: '15 kVA'
          },
          notes: 'P (Real) on horizontal axis, Q (Reactive inductive) on vertical axis, S (Apparent) hypotenuse.'
        },
        steps: [
          {
            title: 'Calculate Total Apparent Power (S)',
            description: 'Using the fundamental power factor relationship:',
            latexFormula: 'S = \\frac{P}{\\text{pf}} = \\frac{12\\text{ kW}}{0.80} = 15.0\\text{ kVA}',
            subSteps: [
              'Divide real power in kW by the power factor 0.80',
              'S = 15 kVA'
            ]
          },
          {
            title: 'Calculate Inductive Reactive Power (Q)',
            description: 'Apply the Pythagorean power theorem to the orthogonal power triangle:',
            latexFormula: 'Q = \\sqrt{S^2 - P^2} = \\sqrt{15^2 - 12^2} = \\sqrt{225 - 144} = \\sqrt{81} = 9.0\\text{ kVAR}',
            subSteps: [
              'Angle θ = arccos(0.80) = 36.87°',
              'Q = S × sin(36.87°) = 15 × 0.60 = 9 kVAR'
            ]
          }
        ],
        finalAnswerLatex: 'S = 15\\text{ kVA}, \\quad Q = 9\\text{ kVAR}',
        finalAnswerSummary: 'The apparent power is 15 kVA and reactive power is 9 kVAR lagging (Option A).',
        mnemonic: 'Remember the 3-4-5 Triangle shortcut: (3×3=9 kVAR, 4×3=12 kW, 5×3=15 kVA) for pf=0.8!',
        tipsAndTricks: [
          'Whenever pf = 0.8, sin θ = 0.6. This allows mental math without a scientific calculator!',
          'Lagging pf indicates inductive load (motors, coils); leading pf indicates capacitive load.'
        ]
      },
      difficulty: 'medium',
      category: 'Electrical Circuits & Power',
      pageNumber: 7
    },
    {
      id: 'q3',
      number: '3',
      type: QuestionType.TRUE_FALSE,
      text: 'According to the National Structural Code of the Philippines (NSCP 2015) Section 420.6.1, the minimum concrete cover for cast-in-place concrete pipes, slabs, or walls permanently exposed to earth or weather is 75 mm.',
      choices: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'NSCP Section 420.6.1.1 states that for concrete cast against and permanently exposed to earth, the minimum concrete cover must be 75 mm to prevent steel rebar corrosion.',
      solution: {
        given: [
          'Structure type: Cast-in-place concrete',
          'Exposure: Permanently in contact with earth',
          'Code: NSCP 2015 Section 420.6.1.1'
        ],
        find: 'Minimum specified clear concrete cover requirement',
        principles: [
          'Concrete cover protects reinforcement steel against corrosion and provides fire endurance.'
        ],
        steps: [
          {
            title: 'Verify NSCP Standard Table 420.6.1.1',
            description: 'For concrete cast against and permanently in contact with ground / earth, minimum clear cover specified is 75 mm.',
            subSteps: [
              'Cast against earth: 75 mm (3 inches)',
              'Exposed to earth/weather: 50 mm (for bars > 16mm) / 40 mm (for ≤ 16mm)',
              'Not exposed to weather (slabs): 20 mm; beams/columns: 40 mm'
            ]
          }
        ],
        finalAnswerSummary: 'True: 75 mm is the mandatory minimum cover for concrete permanently cast against earth.',
        mnemonic: 'Earth Contact = 75 mm (thickest standard cover).'
      },
      difficulty: 'medium',
      category: 'NSCP Codes',
      pageNumber: 5
    },
    {
      id: 'q4',
      number: '4',
      type: QuestionType.FILL_IN_BLANK,
      text: 'The structural property of a cross-section that represents its resistance to bending and deflection is known as the Second _____ of Area (also referred to as the Moment of Inertia).',
      correctAnswer: 'Moment',
      explanation: 'The Second Moment of Area (usually denoted by I) is a geometrical property of an area which defines how its points are distributed with regard to an arbitrary axis.',
      solution: {
        find: 'Term completing "Second _____ of Area"',
        principles: [
          'I = \\int y^2 dA \\; (\\text{Second Moment of Area / Moment of Inertia})',
          'Q = \\int y dA \\; (\\text{First Moment of Area - used for shear flow})'
        ],
        steps: [
          {
            title: 'Identify Area Moments in Mechanics',
            description: 'The first moment is the static moment (Q = ∫ y dA). The second moment is the moment of inertia (I = ∫ y² dA), describing resistance to flexural bending.',
            latexFormula: 'I_x = \\int y^2 \\, dA'
          }
        ],
        finalAnswerSummary: 'Missing word is "Moment".'
      },
      difficulty: 'easy',
      category: 'Strength of Materials',
      pageNumber: 8
    },
    {
      id: 'q5',
      number: '5',
      type: QuestionType.MATCHING,
      text: 'Match the structural member under extreme loading on the left with its typical failure mode on the right.',
      matchingPairs: [
        { left: 'Slender steel column', right: 'Flexural buckling' },
        { left: 'Over-reinforced concrete beam', right: 'Sudden brittle compression failure' },
        { left: 'Thin web plate in steel girder', right: 'Shear buckling' },
        { left: 'Short concrete column pedestal', right: 'Crushing and spalling' }
      ],
      explanation: 'Different structural elements fail in distinct modes based on geometry, material ratio, and load directions.',
      solution: {
        principles: [
          'Slender columns fail elastically by Euler buckling before reaching yield strength.',
          'Over-reinforced beams fail in concrete crushing without yielding of tensile steel (brittle).',
          'Thin web plates suffer diagonal shear wrinkling/buckling.',
          'Stocky short columns fail in direct compressive crushing.'
        ],
        steps: [
          {
            title: 'Correlate Mechanics Principles',
            description: 'Evaluate slenderness ratio, reinforcement index, and width-to-thickness ratios to map failure modes.'
          }
        ],
        finalAnswerSummary: 'Slender Column → Flexural Buckling; Over-reinforced Beam → Sudden Brittle Compression; Thin Web → Shear Buckling; Short Column → Crushing & Spalling.'
      },
      difficulty: 'hard',
      category: 'Failure Mechanics',
      pageNumber: 14
    }
  ]
};

export default function BoardExamReviewPro() {
  // Application states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [activeMode, setActiveMode] = useState<'list' | 'take' | 'edit' | 'extract' | 'history' | 'calendar'>('list');
  const [libraryTab, setLibraryTab] = useState<'dashboard' | 'quizzes'>('dashboard');
  
  // User Role Configuration (Admin vs Member)
  const [userRole, setUserRole] = useState<'admin' | 'member'>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeLocalStorageGet('review_user_role');
      if (saved === 'admin' || saved === 'member') return saved;
    }
    return 'admin'; // default to admin so they see all controls immediately
  });

  // Calendar & Scheduling States
  const [scheduledQuizzes, setScheduledQuizzes] = useState<ScheduledQuiz[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Schedule Modal and Form States
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledQuiz | null>(null);
  const [scheduleQuizId, setScheduleQuizId] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [scheduleDuration, setScheduleDuration] = useState<number>(30); // minutes
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [scheduleSubject, setScheduleSubject] = useState<string>('');
  const [scheduleCategory, setScheduleCategory] = useState<string>('');

  // Searching / Filtering quizzes inside the Schedule Modal
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState<string>('');
  const [scheduleFilterSubject, setScheduleFilterSubject] = useState<string>('All');
  const [scheduleFilterCategory, setScheduleFilterCategory] = useState<string>('All');
  const [scheduleFilterDifficulty, setScheduleFilterDifficulty] = useState<string>('All');

  // Delete Schedule Confirm Modal State
  const [deleteScheduleConfirm, setDeleteScheduleConfirm] = useState<ScheduledQuiz | null>(null);

  // Selected schedule details view state
  const [viewingScheduleDetails, setViewingScheduleDetails] = useState<ScheduledQuiz | null>(null);
  const [logsExpanded, setLogsExpanded] = useState<boolean>(false);
  const [docsExpanded, setDocsExpanded] = useState<boolean>(false);
  const [opsCenterExpanded, setOpsCenterExpanded] = useState<boolean>(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Score History, Progress Dashboard, and Gamification States
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  
  // Filtering and Sorting for History Dashboard
  const [historyFilterSubject, setHistoryFilterSubject] = useState<string>('All');
  const [historyFilterQuiz, setHistoryFilterQuiz] = useState<string>('All');
  const [historySortBy, setHistorySortBy] = useState<'date_newest' | 'date_oldest' | 'score_highest' | 'score_lowest' | 'time_spent'>('date_newest');
  
  // Motivational Achievements states
  const [celebrationBanner, setCelebrationBanner] = useState<{
    show: boolean;
    title: string;
    message: string;
    badgeIcon: 'gold' | 'silver' | 'bronze' | 'streak' | 'perfection' | 'speed' | 'milestone';
  } | null>(null);

  // Instant Feedback Mode states
  const [showInstantFeedback, setShowInstantFeedback] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return safeLocalStorageGet('quiz_show_instant_feedback') === 'true';
    }
    return false;
  });
  
  // Randomization Settings
  const [quizConfig, setQuizConfig] = useState({
    randomizeQuestions: false,
    randomizeChoices: false,
    timeLimit: 0, // In seconds. 0 means no limit.
  });
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [showQuizSetupModal, setShowQuizSetupModal] = useState<Quiz | null>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Custom dialogs/notifications to replace iframe-blocked alert, confirm, and prompt
  const [customToast, setCustomToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const [publishErrors, setPublishErrors] = useState<{
    quizTitle: string;
    errors: string[];
  } | null>(null);

  const [resumeQuizConfirm, setResumeQuizConfirm] = useState<{
    quiz: Quiz;
    attempt: QuizAttempt;
  } | null>(null);

  const [questionToDelete, setQuestionToDelete] = useState<{
    questionId: string;
  } | null>(null);

  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState<boolean>(false);

  const [mergeQuizPrompt, setMergeQuizPrompt] = useState<{
    show: boolean;
    defaultValue: string;
  } | null>(null);
  
  const [mergeQuizInputTitle, setMergeQuizInputTitle] = useState<string>('');

  const [showEditQuizModal, setShowEditQuizModal] = useState<Quiz | null>(null);
  const [editQuizTitle, setEditQuizTitle] = useState<string>('');
  const [editQuizDescription, setEditQuizDescription] = useState<string>('');
  const [editQuizSubject, setEditQuizSubject] = useState<string>('');
  const [editQuizCategory, setEditQuizCategory] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setCustomToast({ message, type });
    // Keep it readable but auto-dismiss
    setTimeout(() => {
      setCustomToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  // Timer logic for active quiz
  useEffect(() => {
    if (activeMode !== 'take' || !quizAttempt || quizAttempt.status !== 'in_progress' || !quizAttempt.timeLimit) {
      setTimeRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const started = new Date(quizAttempt.startedAt).getTime();
      const elapsed = (Date.now() - started) / 1000;
      const remaining = Math.max(0, quizAttempt.timeLimit! - elapsed);
      return Math.ceil(remaining);
    };

    setTimeRemaining(calculateRemaining());

    const intervalId = setInterval(() => {
      setTimeRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeMode, quizAttempt?.status, quizAttempt?.startedAt, quizAttempt?.timeLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when time is up
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining <= 0 && activeMode === 'take' && quizAttempt?.status === 'in_progress') {
      // Small timeout to ensure state is settled
      const timer = setTimeout(() => {
        submitQuizAnswers();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, activeMode, quizAttempt?.status]); // eslint-disable-line react-hooks/exhaustive-deps


  // Save option to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorageSet('quiz_show_instant_feedback', String(showInstantFeedback));
    }
  }, [showInstantFeedback]);

  // Timer formatting helper
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper functions for instant feedback correctness checking
  const checkSingleAnswerCorrectness = (q: Question, userAns: any): boolean => {
    const correctAns = q.correctAnswer;
    if (!correctAns) return false;

    if (q.type === QuestionType.MCQ) {
      return isChoiceCorrect(q, String(userAns || ''));
    } else if (q.type === QuestionType.TRUE_FALSE) {
      return String(userAns).toLowerCase() === String(correctAns).toLowerCase();
    } else if (q.type === QuestionType.IDENTIFICATION || q.type === QuestionType.FILL_IN_BLANK) {
      return String(userAns || '').trim().toLowerCase() === String(correctAns).trim().toLowerCase();
    } else if (q.type === QuestionType.MATCHING) {
      const pairs = q.matchingPairs || [];
      const userPairs = userAns as Record<string, string> || {};
      if (pairs.length === 0) return false;
      let allCorrect = true;
      pairs.forEach(p => {
        if (userPairs[p.left] !== p.right) {
          allCorrect = false;
        }
      });
      return allCorrect;
    }
    return false;
  };

  const getChoiceLetter = (str: string): string | null => {
    const clean = str.trim().toUpperCase();
    const match = clean.match(/^\[?\(?([A-Z])[\).\]\s]/) || clean.match(/^([A-Z])$/);
    return match ? match[1] : null;
  };

  const stripChoicePrefix = (str: string): string => {
    return str.replace(/^\[?\(?[A-Z][\).\]\s]\s*/i, '').trim();
  };

  const isChoiceCorrect = (q: Question, choice: string): boolean => {
    const correctAns = q.correctAnswer;
    if (!correctAns) return false;

    const cleanChoice = choice.trim().toLowerCase();
    const cleanCorrect = String(correctAns).trim().toLowerCase();

    // 1. Direct match
    if (cleanChoice === cleanCorrect) {
      return true;
    }

    // 2. Extract choice letter and correct answer letter and compare
    const choiceLetter = getChoiceLetter(choice);
    const correctLetter = getChoiceLetter(String(correctAns));

    if (choiceLetter && correctLetter && choiceLetter === correctLetter) {
      return true;
    }

    // 3. Compare stripped versions (without option letter prefixes)
    const strippedChoice = stripChoicePrefix(choice).toLowerCase();
    const strippedCorrect = stripChoicePrefix(String(correctAns)).toLowerCase();
    if (strippedChoice && strippedCorrect && strippedChoice === strippedCorrect) {
      return true;
    }

    // 4. Fallback for single letter correct answers matching choice letter
    if (choiceLetter && cleanCorrect === choiceLetter.toLowerCase()) {
      return true;
    }

    return false;
  };

  // Upload and parsing states
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [parsingStatus, setParsingStatus] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<{
    id: string;
    name: string;
    size: number;
    text: string;
    images: string[];
    status: 'success' | 'failed' | 'processing';
    pageCount?: number;
  }[]>([]);
  const [extractionLogs, setExtractionLogs] = useState<ExtractionLog[]>([]);

  // Generator Options
  const [subjectInput, setSubjectInput] = useState<string>('');
  const [difficultyInput, setDifficultyInput] = useState<'easy' | 'medium' | 'hard' | 'auto'>('auto');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'questions_desc' | 'questions_asc' | 'title_asc'>('newest');

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [previewingSolutionId, setPreviewingSolutionId] = useState<string | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const handleConfirmDeleteQuiz = () => {
    if (quizToDelete) {
      const updatedQuizzes = quizzes.filter(q => q.id !== quizToDelete.id);
      saveQuizzesToStorage(updatedQuizzes);
      if (selectedQuiz?.id === quizToDelete.id) {
        setSelectedQuiz(updatedQuizzes.length > 0 ? updatedQuizzes[0] : null);
        setActiveMode('list');
      }
      setQuizToDelete(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and load quizzes from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupLegacyStorageKeys();
      let stored = safeLocalStorageGet('board_exam_review_pro_quizzes');
      if (!stored) {
        stored = safeLocalStorageGet('electrical_review_pro_quizzes') || safeLocalStorageGet('ai_quiz_generator_quizzes'); // migration
        if (stored) {
          safeLocalStorageSet('board_exam_review_pro_quizzes', stored);
          safeLocalStorageRemove('electrical_review_pro_quizzes');
          safeLocalStorageRemove('ai_quiz_generator_quizzes');
        }
      }
      
      if (stored) {
        try {
          let parsed: Quiz[] = JSON.parse(stored);
          // Check if sample quiz needs updating with rich whiteboard solutions
          const sampleIdx = parsed.findIndex(qz => qz.id === SAMPLE_QUIZ.id);
          if (sampleIdx !== -1) {
            parsed[sampleIdx] = SAMPLE_QUIZ;
          } else if (parsed.length === 0) {
            parsed = [SAMPLE_QUIZ];
          }
          setQuizzes(parsed);
          if (parsed.length > 0) {
            setSelectedQuiz(parsed[0]);
          }
          safeLocalStorageSet('board_exam_review_pro_quizzes', JSON.stringify(parsed));
        } catch (e) {
          console.error('Error loading quizzes:', e);
          setQuizzes([SAMPLE_QUIZ]);
          setSelectedQuiz(SAMPLE_QUIZ);
          safeLocalStorageSet('board_exam_review_pro_quizzes', JSON.stringify([SAMPLE_QUIZ]));
        }
      } else {
        // Seed with sample quiz
        setQuizzes([SAMPLE_QUIZ]);
        setSelectedQuiz(SAMPLE_QUIZ);
        safeLocalStorageSet('board_exam_review_pro_quizzes', JSON.stringify([SAMPLE_QUIZ]));
      }
    }
  }, []);

  // Save quizzes to local storage helper
  const saveQuizzesToStorage = (updatedQuizzes: Quiz[]) => {
    setQuizzes(updatedQuizzes);
    safeLocalStorageSet('board_exam_review_pro_quizzes', JSON.stringify(updatedQuizzes));
  };

  // Load score history attempts from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = safeLocalStorageGet('board_exam_review_pro_attempts');
      if (!stored) {
        stored = safeLocalStorageGet('electrical_review_pro_attempts') || safeLocalStorageGet('ai_quiz_generator_attempts'); // migration
        if (stored) {
          safeLocalStorageSet('board_exam_review_pro_attempts', stored);
          safeLocalStorageRemove('electrical_review_pro_attempts');
          safeLocalStorageRemove('ai_quiz_generator_attempts');
        }
      }
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setAttempts(parsed);
          }
        } catch (e) {
          console.error('Error loading attempts:', e);
        }
      }
    }
  }, []);

  // Save attempts helper
  const saveAttemptsToStorage = (updatedAttempts: QuizAttempt[]) => {
    // Keep at most 50 recent attempts
    const trimmed = updatedAttempts.slice(0, 50);
    setAttempts(trimmed);
    safeLocalStorageSet('board_exam_review_pro_attempts', JSON.stringify(trimmed));
  };

  // Load scheduled quizzes from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = safeLocalStorageGet('board_exam_review_pro_schedules');
      if (!stored) {
        stored = safeLocalStorageGet('electrical_review_pro_schedules'); // migration
        if (stored) {
          safeLocalStorageSet('board_exam_review_pro_schedules', stored);
          safeLocalStorageRemove('electrical_review_pro_schedules');
        }
      }
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setScheduledQuizzes(parsed);
          }
        } catch (e) {
          console.error('Error loading scheduled quizzes:', e);
        }
      }
    }
  }, []);

  // Save scheduled quizzes helper
  const saveSchedulesToStorage = (updatedSchedules: ScheduledQuiz[]) => {
    setScheduledQuizzes(updatedSchedules);
    safeLocalStorageSet('board_exam_review_pro_schedules', JSON.stringify(updatedSchedules));
  };

  // Calendar navigation and helper functions
  const handlePrevCalendar = () => {
    const d = new Date(calendarDate);
    if (calendarView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (calendarView === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (calendarView === 'day') {
      d.setDate(d.getDate() - 1);
    }
    setCalendarDate(d);
  };

  const handleNextCalendar = () => {
    const d = new Date(calendarDate);
    if (calendarView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (calendarView === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (calendarView === 'day') {
      d.setDate(d.getDate() + 1);
    }
    setCalendarDate(d);
  };

  const handleTodayCalendar = () => {
    setCalendarDate(new Date());
  };

  const getSchedulesForDate = (dateStr: string) => {
    return scheduledQuizzes.filter(s => s.date === dateStr);
  };

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Status mapping logic (Requirement 4)
  const getScheduledQuizStatus = (schedule: ScheduledQuiz) => {
    // If user has a completed attempt with this schedule id
    const hasCompletedAttempt = attempts.some(
      att => att.scheduledQuizId === schedule.id && att.status !== 'in_progress'
    );
    if (hasCompletedAttempt) {
      return 'Completed';
    }

    // Check if an attempt is currently in_progress for this schedule id
    const hasInProgressAttempt = attempts.some(
      att => att.scheduledQuizId === schedule.id && att.status === 'in_progress'
    );
    if (hasInProgressAttempt) {
      return 'In Progress';
    }

    // Compute window boundaries
    const todayStr = new Date().toISOString().split('T')[0];
    const schedDate = schedule.date;

    if (schedDate > todayStr) {
      return 'Upcoming';
    }

    if (schedDate < todayStr) {
      return 'Missed/Expired';
    }

    // If schedule is today, let's look at start time vs now
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const duration = schedule.duration || 60;
    const endMinutes = startMinutes + duration;

    if (currentMinutes < startMinutes) {
      return 'Upcoming';
    } else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'Available';
    } else {
      return 'Missed/Expired';
    }
  };

  // Form handlers
  const handleOpenCreateSchedule = (dateStr: string) => {
    if (quizzes.length === 0) {
      showToast('Please upload or generate a quiz reviewer first!', 'error');
      return;
    }
    setScheduleQuizId(quizzes[0].id);
    setScheduleDate(dateStr);
    setScheduleTime('09:00');
    setScheduleDuration(30);
    setScheduleNotes('');
    setScheduleSubject(quizzes[0].subject || '');
    setScheduleCategory(quizzes[0].category || '');
    setEditingSchedule(null);
    setShowScheduleModal(true);
  };

  const handleOpenEditSchedule = (schedule: ScheduledQuiz) => {
    setScheduleQuizId(schedule.quizId);
    setScheduleDate(schedule.date);
    setScheduleTime(schedule.startTime);
    setScheduleDuration(schedule.duration);
    setScheduleNotes(schedule.notes || '');
    setScheduleSubject(schedule.subject || '');
    setScheduleCategory(schedule.category || '');
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = () => {
    if (!scheduleQuizId) {
      showToast('Please select a quiz to schedule.', 'error');
      return;
    }
    const origQuiz = quizzes.find(q => q.id === scheduleQuizId);
    if (!origQuiz) {
      showToast('Selected quiz not found.', 'error');
      return;
    }

    if (editingSchedule) {
      const updated = scheduledQuizzes.map(s => {
        if (s.id === editingSchedule.id) {
          return {
            ...s,
            quizId: scheduleQuizId,
            quizTitle: origQuiz.title,
            date: scheduleDate,
            startTime: scheduleTime,
            duration: scheduleDuration,
            notes: scheduleNotes,
            subject: scheduleSubject || origQuiz.subject || '',
            category: scheduleCategory || origQuiz.category || ''
          };
        }
        return s;
      });
      saveSchedulesToStorage(updated);
      showToast('Quiz schedule updated successfully!', 'success');
    } else {
      const newSchedule: ScheduledQuiz = {
        id: `schedule-${Date.now()}`,
        quizId: scheduleQuizId,
        quizTitle: origQuiz.title,
        date: scheduleDate,
        startTime: scheduleTime,
        duration: scheduleDuration,
        notes: scheduleNotes,
        subject: scheduleSubject || origQuiz.subject || '',
        category: scheduleCategory || origQuiz.category || ''
      };
      saveSchedulesToStorage([newSchedule, ...scheduledQuizzes]);
      showToast('Quiz scheduled successfully!', 'success');
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = (schedule: ScheduledQuiz) => {
    const filtered = scheduledQuizzes.filter(s => s.id !== schedule.id);
    saveSchedulesToStorage(filtered);
    showToast('Quiz schedule removed.', 'info');
    if (viewingScheduleDetails?.id === schedule.id) {
      setViewingScheduleDetails(null);
    }
  };

  // Searching / filtering lists in the scheduler dropdown
  const filteredQuizzesForScheduling = useMemo(() => {
    return quizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
        (quiz.subject && quiz.subject.toLowerCase().includes(scheduleSearchQuery.toLowerCase()));
      const matchesSubject = scheduleFilterSubject === 'All' || quiz.subject === scheduleFilterSubject;
      const matchesCategory = scheduleFilterCategory === 'All' || quiz.category === scheduleFilterCategory;
      const matchesDifficulty = scheduleFilterDifficulty === 'All' || 
        quiz.questions.some(q => q.difficulty === scheduleFilterDifficulty);

      return matchesSearch && matchesSubject && matchesCategory && matchesDifficulty;
    });
  }, [quizzes, scheduleSearchQuery, scheduleFilterSubject, scheduleFilterCategory, scheduleFilterDifficulty]);

  const uniqueSchedulingSubjects = useMemo(() => {
    const setOfSubs = new Set<string>();
    quizzes.forEach(q => {
      if (q.subject) setOfSubs.add(q.subject);
    });
    return Array.from(setOfSubs);
  }, [quizzes]);

  const uniqueSchedulingCategories = useMemo(() => {
    const setOfCats = new Set<string>();
    quizzes.forEach(q => {
      if (q.category) setOfCats.add(q.category);
    });
    return Array.from(setOfCats);
  }, [quizzes]);

  // Get details for any attempt
  const getAttemptQuizDetails = React.useCallback((attempt: QuizAttempt) => {
    const qz = quizzes.find(q => q.id === attempt.quizId);
    return {
      title: qz ? qz.title : (attempt.quizId.startsWith('sample') ? 'PRC Board Exam Reviewer (Civil Engineering & NSCP)' : 'Archived Quiz'),
      subject: qz?.subject || (attempt.quizId.startsWith('sample') ? 'Civil & Structural Engineering' : 'General Study'),
      category: qz?.category || 'Extracted Exam'
    };
  }, [quizzes]);

  // Helper to format duration
  const formatDuration = (startedAt: string, completedAt?: string | null) => {
    if (!completedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const diffSeconds = Math.round((end - start) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    }
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Format Date and Time
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Dynamic consecutive streak logic
  const studyStreak = useMemo(() => {
    if (attempts.length === 0) return 0;
    
    // Extract unique dates of attempts in YYYY-MM-DD format
    const dates = Array.from(new Set(
      attempts
        .filter(a => a.completedAt)
        .map(a => new Date(a.completedAt!).toLocaleDateString('en-CA')) // returns YYYY-MM-DD
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // sort newest first
    
    if (dates.length === 0) return 0;
    
    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    
    // If the latest attempt is older than yesterday, the streak is broken (0)
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
      return 0;
    }
    
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i+1]);
      const diffTime = current.getTime() - next.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break; // streak broken
      }
    }
    
    return streak;
  }, [attempts]);

  // Analytics helper stats
  const analyticsSummary = useMemo(() => {
    if (attempts.length === 0) {
      return {
        highestPercent: 0,
        averagePercent: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        improvingTrend: 'Stable'
      };
    }

    const percentages = attempts.map(a => Math.round((a.score / a.totalQuestions) * 100));
    const highestPercent = Math.max(...percentages);
    const averagePercent = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const totalCorrect = attempts.reduce((acc, a) => acc + a.score, 0);
    const totalQuestions = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);

    return {
      highestPercent,
      averagePercent,
      totalCorrect,
      totalQuestions
    };
  }, [attempts]);

  // Comprehensive Academic Dashboard and Progress Analytics
  const dashboardStats = useMemo(() => {
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const totalQuizzes = quizzes.length;
    const totalQuestions = quizzes.reduce((acc, q) => acc + q.questions.length, 0);
    const averageScore = analyticsSummary.averagePercent;
    
    // Sort recent completions
    const recentResults = [...completedAttempts]
      .sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime())
      .slice(0, 5);

    // Compute progress by subject
    const subjectsMap: Record<string, { totalScore: number; count: number }> = {};
    completedAttempts.forEach(att => {
      const q = quizzes.find(quiz => quiz.id === att.quizId);
      const subject = q?.subject || 'General Review';
      const scorePercent = Math.round((att.score / att.totalQuestions) * 100);
      
      if (!subjectsMap[subject]) {
        subjectsMap[subject] = { totalScore: 0, count: 0 };
      }
      subjectsMap[subject].totalScore += scorePercent;
      subjectsMap[subject].count += 1;
    });

    const subjectProgress = Object.entries(subjectsMap).map(([name, data]) => ({
      name,
      avgScore: Math.round(data.totalScore / data.count),
      attemptsCount: data.count
    }));

    // Generate Recommended quizzes (uncompleted first, then lower-scored ones)
    const recommendedQuizzes = quizzes
      .map(q => {
        const qAttempts = completedAttempts.filter(a => a.quizId === q.id);
        const bestScore = qAttempts.length > 0 ? Math.max(...qAttempts.map(a => Math.round((a.score / a.totalQuestions) * 100))) : null;
        return {
          quiz: q,
          bestScore,
          priority: bestScore === null ? 3 : bestScore < 75 ? 2 : 1
        };
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map(item => item.quiz);

    return {
      totalQuestions,
      totalQuizzes,
      completedQuizzesCount: completedAttempts.length,
      averageScore,
      recentResults,
      subjectProgress,
      recommendedQuizzes
    };
  }, [quizzes, attempts, analyticsSummary]);

  // Gamification badges check
  const unlockedBadges = useMemo(() => {
    const badges = [
      {
        id: 'first_victory',
        name: 'First Victory',
        description: 'Scored 80% or higher on a quiz',
        unlocked: attempts.some(a => (a.score / a.totalQuestions) >= 0.8),
        icon: Trophy,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      },
      {
        id: 'perfect_finish',
        name: 'Perfect Finish',
        description: 'Scored a flawless 100% on any quiz',
        unlocked: attempts.some(a => a.score === a.totalQuestions && a.totalQuestions > 0),
        icon: Star,
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      },
      {
        id: 'dedicated_learner',
        name: 'Dedicated Learner',
        description: 'Completed 5 or more quiz attempts',
        unlocked: attempts.length >= 5,
        icon: Award,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      },
      {
        id: 'speedy_solver',
        name: 'Speed Runner',
        description: 'Completed a quiz under 40 seconds with 80% accuracy',
        unlocked: attempts.some(a => {
          if (!a.completedAt) return false;
          const diff = (new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 1000;
          return diff < 40 && (a.score / a.totalQuestions) >= 0.8;
        }),
        icon: Zap,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
      },
      {
        id: 'multi_subject',
        name: 'Polymath',
        description: 'Completed quizzes in at least 2 different subjects',
        unlocked: new Set(attempts.map(a => getAttemptQuizDetails(a).subject)).size >= 2,
        icon: BookOpen,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      },
      {
        id: 'streak_flame',
        name: 'Streak Pioneer',
        description: 'Maintained a 2-day active study streak',
        unlocked: studyStreak >= 2,
        icon: Flame,
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
      }
    ];
    return badges;
  }, [attempts, studyStreak, getAttemptQuizDetails]);

  // Comparative score trend comparison
  const getAttemptTrendComparison = (attempt: QuizAttempt, index: number, allAttempts: QuizAttempt[]) => {
    const sameQuizAttempts = allAttempts
      .filter(a => a.quizId === attempt.quizId && a.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()); // oldest first
      
    const thisIndex = sameQuizAttempts.findIndex(a => a.id === attempt.id);
    if (thisIndex <= 0) {
      return { text: 'First Attempt', isBetter: null, diff: 0 };
    }
    
    const prevAttempt = sameQuizAttempts[thisIndex - 1];
    const prevPct = Math.round((prevAttempt.score / prevAttempt.totalQuestions) * 100);
    const thisPct = Math.round((attempt.score / attempt.totalQuestions) * 100);
    const diff = thisPct - prevPct;
    
    if (diff > 0) {
      return { text: `+${diff}% better than previous`, isBetter: true, diff };
    } else if (diff < 0) {
      return { text: `${diff}% worse than previous`, isBetter: false, diff };
    } else {
      return { text: 'Stable performance', isBetter: null, diff: 0 };
    }
  };

  // Filtered and sorted list for display
  const filteredAndSortedAttempts = useMemo(() => {
    let result = [...attempts];

    if (historyFilterSubject !== 'All') {
      result = result.filter(a => getAttemptQuizDetails(a).subject === historyFilterSubject);
    }

    if (historyFilterQuiz !== 'All') {
      result = result.filter(a => a.quizId === historyFilterQuiz);
    }

    result.sort((a, b) => {
      if (historySortBy === 'date_newest') {
        return new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime();
      }
      if (historySortBy === 'date_oldest') {
        return new Date(a.completedAt || a.startedAt).getTime() - new Date(b.completedAt || b.startedAt).getTime();
      }
      if (historySortBy === 'score_highest') {
        const scoreA = a.totalQuestions > 0 ? (a.score / a.totalQuestions) : 0;
        const scoreB = b.totalQuestions > 0 ? (b.score / b.totalQuestions) : 0;
        return scoreB - scoreA;
      }
      if (historySortBy === 'score_lowest') {
        const scoreA = a.totalQuestions > 0 ? (a.score / a.totalQuestions) : 0;
        const scoreB = b.totalQuestions > 0 ? (b.score / b.totalQuestions) : 0;
        return scoreA - scoreB;
      }
      if (historySortBy === 'time_spent') {
        const timeA = new Date(a.completedAt || '').getTime() - new Date(a.startedAt).getTime();
        const timeB = new Date(b.completedAt || '').getTime() - new Date(b.startedAt).getTime();
        return timeA - timeB;
      }
      return 0;
    });

    return result;
  }, [attempts, historyFilterSubject, historyFilterQuiz, historySortBy, getAttemptQuizDetails]);

  // Unique subjects and quizzes for dropdown selects
  const uniqueSubjectsInHistory = useMemo(() => {
    const subjectsSet = new Set<string>();
    attempts.forEach(a => {
      const details = getAttemptQuizDetails(a);
      if (details.subject) subjectsSet.add(details.subject);
    });
    return Array.from(subjectsSet);
  }, [attempts, getAttemptQuizDetails]);

  const uniqueQuizzesInHistory = useMemo(() => {
    const quizMap = new Map<string, string>();
    attempts.forEach(a => {
      const details = getAttemptQuizDetails(a);
      quizMap.set(a.quizId, details.title);
    });
    return Array.from(quizMap.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts, getAttemptQuizDetails]);

  // Chart plotting dataset
  const chartData = useMemo(() => {
    return [...attempts]
      .filter(a => a.completedAt)
      .reverse() // chronological
      .map((a, index) => {
        const details = getAttemptQuizDetails(a);
        return {
          name: `Attempt ${index + 1}`,
          shortDate: new Date(a.completedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          quizTitle: details.title,
          percentage: Math.round((a.score / a.totalQuestions) * 100),
          correct: a.score,
          incorrect: a.totalQuestions - a.score,
        };
      });
  }, [attempts, getAttemptQuizDetails]);

  // Check PDF.js capability on mount
  useEffect(() => {
    loadPDFJS().then(() => {
      console.log('PDF.js ready client-side');
    }).catch(err => {
      console.error('Failed to load PDF.js:', err);
    });
  }, []);

  // Filtered Quiz list with sorting
  const filteredQuizzes = useMemo(() => {
    const list = quizzes.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSubject = filterSubject === 'All' || q.subject === filterSubject;
      return matchesSearch && matchesSubject;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      if (sortBy === 'oldest') {
        return a.id.localeCompare(b.id);
      }
      if (sortBy === 'questions_desc') {
        return b.questions.length - a.questions.length;
      }
      if (sortBy === 'questions_asc') {
        return a.questions.length - b.questions.length;
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [quizzes, searchQuery, filterSubject, sortBy]);

  // Extract unique subjects for filtering
  const allSubjects = Array.from(new Set(quizzes.map(q => q.subject).filter(Boolean))) as string[];

  // File parsing handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Parse files sequentially
  const processFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(10);
    setParsingStatus('Validating and reading files...');

    const newLogs: ExtractionLog[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const logId = `log-${Date.now()}-${i}`;
      
      newLogs.push({
        id: logId,
        fileName: file.name,
        status: 'pending',
        questionsFound: 0
      });
      
      setExtractionLogs(prev => [...newLogs, ...prev]);

      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== 'pdf' && extension !== 'docx') {
        showToast(`Unsupported file format: ${file.name}. Please upload .pdf or .docx files only.`, 'error');
        continue;
      }

      try {
        setParsingStatus(`Reading: ${file.name}...`);
        
        // Update log to processing
        setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'processing' } : l));

        if (extension === 'pdf') {
          await parsePdfFile(file, logId);
        } else if (extension === 'docx') {
          await parseDocxFile(file, logId);
        }
      } catch (err: any) {
        console.error('Error parsing file:', err);
        setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'failed', error: err.message || 'Parsing failed' } : l));
      }
    }

    setIsUploading(false);
    setParsingStatus('');
    setUploadProgress(100);
  };

  // Browser-side PDF extractor using dynamic PDF.js with spatial line sorting and OCR
  const parsePdfFile = async (file: File, logId: string) => {
    const pdfjsLib = await loadPDFJS();
    if (!pdfjsLib) throw new Error('PDF.js library could not be loaded dynamically.');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, totalPages: numPages, processedPages: 0 } : l));

    let extractedText = '';
    const extractedImages: string[] = [];

    // Helper to sort and format text items by lines (and handle 2-column layouts)
    const extractStructuredPageText = (items: any[], pageWidth: number): string => {
      if (!items || items.length === 0) return '';

      // Normalize items with coordinates
      const textItems = items.map(item => ({
        str: item.str || '',
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        width: item.width || 0,
        height: item.height || 0
      })).filter(it => it.str.trim().length > 0);

      if (textItems.length === 0) return '';

      // Check if page appears to have a 2-column layout
      const midX = pageWidth / 2;
      const leftItems = textItems.filter(it => it.x + it.width < midX + 20);
      const rightItems = textItems.filter(it => it.x >= midX - 20);
      const isTwoColumn = leftItems.length > 8 && rightItems.length > 8 && (leftItems.length + rightItems.length) / textItems.length > 0.75;

      const formatColumnLines = (colItems: typeof textItems): string => {
        // Sort top-to-bottom (PDF y is 0 at bottom, so larger y is higher up)
        colItems.sort((a, b) => b.y - a.y || a.x - b.x);

        const lines: { y: number; items: typeof textItems }[] = [];
        const yTolerance = 4; // px tolerance for same line

        colItems.forEach(item => {
          const existingLine = lines.find(l => Math.abs(l.y - item.y) <= yTolerance);
          if (existingLine) {
            existingLine.items.push(item);
          } else {
            lines.push({ y: item.y, items: [item] });
          }
        });

        // Format each line sorted left-to-right
        return lines.map(line => {
          line.items.sort((a, b) => a.x - b.x);
          return line.items.map(it => it.str).join(' ');
        }).join('\n');
      };

      if (isTwoColumn) {
        const leftColText = formatColumnLines(leftItems);
        const rightColText = formatColumnLines(rightItems);
        return `${leftColText}\n\n${rightColText}`;
      } else {
        return formatColumnLines(textItems);
      }
    };

    for (let p = 1; p <= numPages; p++) {
      setParsingStatus(`Scanning page ${p} / ${numPages} from PDF...`);
      setUploadProgress(Math.floor((p / numPages) * 90));

      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      
      const structuredPageText = extractStructuredPageText(textContent.items, viewport.width);
      const rawText = textContent.items.map((item: any) => item.str).join(' ');
      const effectiveText = structuredPageText.trim().length > 0 ? structuredPageText : rawText;

      // Add page marker so Gemini can associate page numbers and chunk accurately
      extractedText += `\n[PAGE_NUMBER_MARKER_${p}]\n${effectiveText}\n`;

      // Check if page has low text or visual questions (needs high-res visual OCR)
      if (effectiveText.trim().length < 100) {
        setParsingStatus(`Capturing visual OCR snapshot on page ${p}...`);
        const ocrViewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = ocrViewport.height;
        canvas.width = ocrViewport.width;
        await page.render({ canvasContext: context!, viewport: ocrViewport }).promise;
        const pageImageBase64 = canvas.toDataURL('image/jpeg', 0.85);
        
        extractedImages.push(pageImageBase64);
        extractedText += `\n[IMAGE_REF_${extractedImages.length - 1}] (Visual scan of page ${p} for OCR extraction of questions and diagrams)\n`;
      }

      setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, processedPages: p } : l));
    }

    // Save parsing result
    const newFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      text: extractedText,
      images: extractedImages,
      status: 'success' as const,
      pageCount: numPages
    };

    setUploadedFiles(prev => [newFile, ...prev]);
    setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success' } : l));
  };

  // Word Document mammoth-powered parser via server route
  const parseDocxFile = async (file: File, logId: string) => {
    setParsingStatus(`Sending ${file.name} to server parsing engine...`);
    
    const formData = new FormData();
    formData.append('file', file);

    let data: any = null;
    try {
      const res = await fetch('/api/parse-docx', {
        method: 'POST',
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { html: rawText, success: true };
        }
      }

      if (!res.ok && !data?.html) {
        throw new Error(data?.error || `Server parsing failed (status ${res.status})`);
      }
    } catch (docxErr: any) {
      console.warn('Docx parsing issue:', docxErr);
      // Fallback: create placeholder entry if needed
      data = { html: `<p>Document: ${file.name}</p>`, success: true };
    }
    
    // Process Mammoth HTML to extract embedded base64 images
    let rawHtml = data?.html || '';
    const base64Images: string[] = [];
    
    // Simple regex to parse inline img sources
    const imgRegex = /<img[^>]+src="data:([^";]+);base64,([^"]+)"[^>]*>/gi;
    let match;
    let imageCounter = 0;
    
    while ((match = imgRegex.exec(rawHtml)) !== null) {
      const mimeType = match[1];
      const base64Data = match[2];
      const fullBase64 = `data:${mimeType};base64,${base64Data}`;
      
      base64Images.push(fullBase64);
      
      // Replace in HTML with a small reference tag so we do not flood the Gemini prompt tokens
      rawHtml = rawHtml.replace(match[0], `[IMAGE_REF_${imageCounter}]`);
      imageCounter++;
    }

    // Clean up HTML to simple reading text format for LLM
    const cleanText = rawHtml
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<li>/gi, '\n - ')
      .replace(/<[^>]+>/g, '') // Strip remaining tags
      .replace(/\n\s*\n/g, '\n\n'); // Collapse blank lines

    const newFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      text: cleanText,
      images: base64Images,
      status: 'success' as const,
      pageCount: 1 // Word document standard single stream
    };

    setUploadedFiles(prev => [newFile, ...prev]);
    setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success' } : l));
  };

  // Board Exam Review Pro Caller
  const generateQuizFromFiles = async () => {
    if (uploadedFiles.length === 0) {
      showToast('Please upload at least one PDF or Word document first.', 'error');
      return;
    }

    setIsGenerating(true);
    setParsingStatus('Instructing Gemini to scan document & extract 100% of questions...');

    // Combine text from all uploaded files and make image indices globally unique
    let globalImageCounter = 0;
    const allImages: string[] = [];
    const allFileNames = uploadedFiles.map(f => f.name);

    const combinedText = uploadedFiles.map(file => {
      let fileText = file.text;
      const localToGlobalMap: Record<number, number> = {};

      // Map local indices to a single flat global array of images
      (file.images || []).forEach((img, idx) => {
        localToGlobalMap[idx] = globalImageCounter;
        allImages.push(img);
        globalImageCounter++;
      });

      // Replace local [IMAGE_REF_X] with global [IMAGE_REF_Y]
      fileText = fileText.replace(/\[IMAGE_REF_(\d+)\]/g, (match, p1) => {
        const localIdx = parseInt(p1, 10);
        const globalIdx = localToGlobalMap[localIdx];
        return globalIdx !== undefined ? `[IMAGE_REF_${globalIdx}]` : match;
      });

      return `=== FILE: ${file.name} ===\n${fileText}`;
    }).join('\n\n');

    let processedQuestions: Question[] = [];
    let generatedTitle = `Quiz from ${allFileNames[0]}`;
    let generatedDesc = 'Automatically generated quiz from uploaded study materials.';
    let generatedSubject = subjectInput || 'General Study';
    let generatedCategory = 'Extracted Exam';

    try {
      let apiSucceeded = false;

      try {
        const res = await fetch('/api/gemini/generate-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: combinedText,
            images: allImages.slice(0, 30), // Protect against mega payloads
            fileName: allFileNames.join(', '),
            subject: subjectInput,
            difficulty: difficultyInput === 'auto' ? null : difficultyInput,
            customInstructions: customInstructions,
          })
        });

        let data: any = null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }
        }

        if (res.ok && data?.success && data?.quiz?.questions && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
          apiSucceeded = true;
          generatedTitle = data.quiz.quizTitle || generatedTitle;
          generatedDesc = data.quiz.quizDescription || generatedDesc;
          generatedSubject = data.quiz.subject || generatedSubject;
          generatedCategory = data.quiz.category || generatedCategory;

          processedQuestions = data.quiz.questions.map((q: Question, idx: number) => {
            let questionImage = null;
            const imgRefMatch = (q.text || '').match(/\[IMAGE_REF_(\d+)\]/);
            if (imgRefMatch && imgRefMatch[1]) {
              const imgIndex = parseInt(imgRefMatch[1], 10);
              if (allImages[imgIndex]) {
                questionImage = allImages[imgIndex];
              }
            }

            return {
              ...q,
              id: `extracted-q-${Date.now()}-${idx}`,
              image: questionImage || q.image || null,
              sourceFile: allFileNames[0],
              choices: q.choices && q.choices.length > 0 ? q.choices : null
            };
          });
        }
      } catch (networkOrApiErr) {
        console.warn('API generation route call failed or returned unexpected response. Falling back to local offline extractor...', networkOrApiErr);
      }

      // If AI server failed, timed out, or returned unparseable output, invoke high-speed deterministic parser fallback
      if (!apiSucceeded || processedQuestions.length === 0) {
        console.log('Engaging client-side deterministic question parser on document text...');
        const deterministicQuestions = parseQuestionsDeterministically(
          combinedText,
          allFileNames.join(', '),
          subjectInput,
          difficultyInput === 'auto' ? undefined : difficultyInput
        );

        if (deterministicQuestions.length > 0) {
          processedQuestions = deterministicQuestions;
          generatedTitle = `Reviewer: ${allFileNames[0]}`;
          generatedDesc = `Board Exam Reviewer with ${deterministicQuestions.length} extracted questions.`;
          showToast(`Extracted ${deterministicQuestions.length} questions instantly!`, 'info');
        }
      }

      if (processedQuestions.length === 0) {
        throw new Error('No questions could be extracted from the document. Please ensure the document contains text or question items.');
      }

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: generatedTitle,
        description: generatedDesc,
        subject: generatedSubject,
        category: generatedCategory,
        questions: processedQuestions,
        createdAt: new Date().toISOString(),
        sourceFiles: allFileNames,
        isPublished: false // Admin can review and publish
      };

      const updatedQuizzes = [newQuiz, ...quizzes];
      saveQuizzesToStorage(updatedQuizzes);
      setSelectedQuiz(newQuiz);
      
      // Update logs count
      setExtractionLogs(prev => prev.map(l => ({ ...l, questionsFound: processedQuestions.length })));
      
      showToast(`Success! Extracted ${processedQuestions.length} questions. Let's review them now!`, 'success');
      setActiveMode('edit'); // Jump directly to Question Manager to review and edit
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('QUOTA_EXCEEDED') || errorMsg.includes('Quota exceeded')) {
        showToast('Quota Exceeded: You have reached the daily free-tier limit for AI generations. Please try again tomorrow or provide an API key.', 'error');
      } else {
        showToast(`Generation notice: ${errorMsg}`, 'error');
      }
    } finally {
      setIsGenerating(false);
      setParsingStatus('');
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start Quiz runner
  const startQuiz = (quiz: Quiz, configOverride?: typeof quizConfig, scheduledQuizId?: string | null) => {
    const config = configOverride || quizConfig;
    setSelectedQuiz(quiz);
    setUserAnswers({});
    setCheckedQuestions({});
    setActiveQuestionIndex(0);

    let currentQuestions = [...quiz.questions];
    
    if (config.randomizeQuestions) {
      currentQuestions = shuffleArray(currentQuestions);
    }
    
    if (config.randomizeChoices) {
      currentQuestions = currentQuestions.map(q => {
        if (q.type === QuestionType.MCQ && q.choices) {
          // Identify which original choice string matches the correct answer
          let originalCorrectChoice = q.choices.find(c => isChoiceCorrect(q, c));
          
          // Shuffle options, keeping content
          let shuffledChoices = shuffleArray([...q.choices]);
          
          let newCorrectAnswer = q.correctAnswer;

          // Generate new letter prefixes for display logic stability
          shuffledChoices = shuffledChoices.map((choice, i) => {
            const letter = String.fromCharCode(65 + i);
            const stripped = stripChoicePrefix(choice);
            const newChoice = `${letter}. ${stripped}`;
            
            if (originalCorrectChoice === choice) {
              newCorrectAnswer = newChoice;
            }
            return newChoice;
          });

          return {
            ...q,
            choices: shuffledChoices,
            correctAnswer: newCorrectAnswer
          };
        }
        return q;
      });
    }

    setActiveQuestions(currentQuestions);

    setQuizAttempt({
      id: `attempt-${Date.now()}`,
      quizId: quiz.id,
      answers: {},
      score: 0,
      totalQuestions: currentQuestions.length,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      activeQuestions: currentQuestions,
      timeLimit: config.timeLimit,
      scheduledQuizId: scheduledQuizId || null,
    });
    setShowResults(false);
    setActiveMode('take');
  };

  // Question navigation and answering
  const handleAnswerSelect = (questionId: string, answer: any) => {
    if (showInstantFeedback) {
      // If already checked, lock inputs so they can't change their answer
      if (checkedQuestions[questionId]) return;

      const q = activeQuestions.find(quest => quest.id === questionId);
      if (q && (q.type === QuestionType.MCQ || q.type === QuestionType.TRUE_FALSE)) {
        setUserAnswers(prev => ({
          ...prev,
          [questionId]: answer
        }));
        setCheckedQuestions(prev => ({
          ...prev,
          [questionId]: true
        }));
        return;
      }
    }

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Automatic state persistence of in-progress attempt
  useEffect(() => {
    if (quizAttempt && quizAttempt.status === 'in_progress') {
      const savedAttempt = {
        ...quizAttempt,
        answers: userAnswers
      };
      safeLocalStorageSet(`quiz_attempt_${quizAttempt.quizId}`, JSON.stringify(savedAttempt));
    }
  }, [userAnswers, quizAttempt]);

  // Submit and grade quiz
  const submitQuizAnswers = () => {
    if (!selectedQuiz || !quizAttempt) return;

    let score = 0;
    activeQuestions.forEach(q => {
      const userAns = userAnswers[q.id];
      if (checkSingleAnswerCorrectness(q, userAns)) {
        score++;
      }
    });

    const nowStr = new Date().toISOString();
    const finishedAttempt: QuizAttempt = {
      ...quizAttempt,
      answers: userAnswers,
      score,
      status: 'completed',
      completedAt: nowStr
    };

    setQuizAttempt(finishedAttempt);
    setShowResults(true);
    safeLocalStorageRemove(`quiz_attempt_${selectedQuiz.id}`); // Clear temporary state

    // 1. Calculate achievements & milestones
    const previousAttemptsForQuiz = attempts.filter(att => att.quizId === selectedQuiz.id);
    const hasPreviousAttempts = previousAttemptsForQuiz.length > 0;
    const highestPreviousScore = hasPreviousAttempts
      ? Math.max(...previousAttemptsForQuiz.map(att => att.score))
      : -1;

    // 2. Save completed attempt to score history list
    const updatedAttempts = [finishedAttempt, ...attempts];
    saveAttemptsToStorage(updatedAttempts);

    // 3. Motivational triggers based on performance
    const totalQs = activeQuestions.length;
    const percentage = totalQs > 0 ? Math.round((score / totalQs) * 100) : 0;
    const durationMs = new Date(nowStr).getTime() - new Date(quizAttempt.startedAt).getTime();
    const durationSeconds = Math.round(durationMs / 1000);

    let title = "";
    let message = "";
    let badgeIcon: 'gold' | 'silver' | 'bronze' | 'streak' | 'perfection' | 'speed' | 'milestone' = 'bronze';
    let shouldCelebrate = false;

    if (percentage === 100) {
      title = "Perfect Score! 🏆";
      message = `Incredible! You got a flawless 100% (${score}/${totalQs}) on "${selectedQuiz.title}"! You have master-level command of this material!`;
      badgeIcon = "perfection";
      shouldCelebrate = true;
    } else if (hasPreviousAttempts && score > highestPreviousScore) {
      title = "New Personal Best! 🎉";
      const diff = score - highestPreviousScore;
      message = `Outstanding progress! You beat your previous high score by +${diff} correct answer${diff > 1 ? 's' : ''} and set a new record of ${score}/${totalQs} (${percentage}%)!`;
      badgeIcon = "gold";
      shouldCelebrate = true;
    } else if (!hasPreviousAttempts && percentage >= 80) {
      title = "First Flight Success! 🚀";
      message = `Awesome start! You scored a solid ${percentage}% (${score}/${totalQs}) on your first attempt of "${selectedQuiz.title}"!`;
      badgeIcon = "silver";
      shouldCelebrate = true;
    } else if (durationSeconds > 5 && durationSeconds < 40 && percentage >= 80 && totalQs >= 3) {
      title = "Speed Runner! ⚡";
      message = `Blazing fast! You completed this quiz in just ${durationSeconds} seconds with an outstanding ${percentage}% score!`;
      badgeIcon = "speed";
      shouldCelebrate = true;
    }

    if (shouldCelebrate) {
      setCelebrationBanner({
        show: true,
        title,
        message,
        badgeIcon
      });
      // Auto-dismiss celebration after 8 seconds
      setTimeout(() => {
        setCelebrationBanner(prev => prev ? { ...prev, show: false } : null);
      }, 8000);
    }
  };

  // Resume unfinished quiz from storage if any
  const checkAndResumeQuiz = (quiz: Quiz) => {
    const saved = safeLocalStorageGet(`quiz_attempt_${quiz.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'in_progress') {
          setResumeQuizConfirm({ quiz, attempt: parsed });
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setShowQuizSetupModal(quiz);
  };

  const handleResumeQuizAttempt = (quiz: Quiz, attempt: QuizAttempt) => {
    setSelectedQuiz(quiz);
    setUserAnswers(attempt.answers || {});
    
    // Re-populate checked questions for the resumed quiz
    const initialChecked: Record<string, boolean> = {};
    if (attempt.answers) {
      Object.keys(attempt.answers).forEach(qid => {
        initialChecked[qid] = true;
      });
    }
    setCheckedQuestions(initialChecked);

    if (attempt.activeQuestions && attempt.activeQuestions.length > 0) {
      setActiveQuestions(attempt.activeQuestions);
    } else {
      setActiveQuestions(quiz.questions);
    }

    setQuizAttempt(attempt);
    setShowResults(false);
    setActiveMode('take');
    setResumeQuizConfirm(null);
  };

  // Question Editor updates
  const handleSaveQuestion = (updatedQ: Question) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.map(q => q.id === updatedQ.id ? updatedQ : q);
    const updatedQuiz = { ...selectedQuiz, questions: updatedQuestions };

    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete({ questionId });
  };

  const handleConfirmDeleteQuestion = () => {
    if (!selectedQuiz || !questionToDelete) return;
    const { questionId } = questionToDelete;
    const updatedQuestions = selectedQuiz.questions.filter(q => q.id !== questionId);
    const updatedQuiz = { ...selectedQuiz, questions: updatedQuestions };

    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
    setQuestionToDelete(null);
    showToast('Question deleted successfully.', 'success');
  };

  const handleConfirmClearHistory = () => {
    saveAttemptsToStorage([]);
    setSelectedAttemptId(null);
    setShowClearHistoryConfirm(false);
    showToast('Your quiz history has been reset.', 'success');
  };

  const handleOpenEditQuizModal = (quiz: Quiz) => {
    setShowEditQuizModal(quiz);
    setEditQuizTitle(quiz.title || '');
    setEditQuizDescription(quiz.description || '');
    setEditQuizSubject(quiz.subject || '');
    setEditQuizCategory(quiz.category || '');
  };

  const handleSaveQuizDetails = () => {
    if (!showEditQuizModal) return;
    if (!editQuizTitle.trim()) {
      showToast('Quiz title cannot be empty.', 'error');
      return;
    }

    const updatedQuiz = {
      ...showEditQuizModal,
      title: editQuizTitle.trim(),
      description: editQuizDescription.trim() || null,
      subject: editQuizSubject.trim() || null,
      category: editQuizCategory.trim() || null,
    };

    const updatedQuizzes = quizzes.map(q => q.id === showEditQuizModal.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    
    if (selectedQuiz?.id === showEditQuizModal.id) {
      setSelectedQuiz(updatedQuiz);
    }
    
    setShowEditQuizModal(null);
    showToast('Quiz details updated successfully.', 'success');
  };

  const handleCreateQuestion = (newQ: Omit<Question, 'id'>) => {
    if (!selectedQuiz) return;

    const fullNewQ: Question = {
      ...newQ,
      id: `manual-q-${Date.now()}`,
    };

    const updatedQuiz = { ...selectedQuiz, questions: [...selectedQuiz.questions, fullNewQ] };
    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
    setShowAddQuestionModal(false);
  };

  const handleReorderQuestion = (index: number, direction: 'up' | 'down') => {
    if (!selectedQuiz) return;
    const questions = [...selectedQuiz.questions];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const updatedQuiz = { ...selectedQuiz, questions };
    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
  };

  const handlePublishQuiz = (quizId: string) => {
    // Validate quiz completeness first
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    if (quiz.isPublished) {
      const updatedQuizzes = quizzes.map(q => q.id === quizId ? { ...q, isPublished: false } : q);
      saveQuizzesToStorage(updatedQuizzes);
      setSelectedQuiz(prev => prev && prev.id === quizId ? { ...prev, isPublished: false } : prev);
      showToast('Quiz unpublished successfully! It is now a draft review.', 'info');
      return;
    }

    const errors: string[] = [];
    quiz.questions.forEach((q, idx) => {
      if (!q.text || !q.text.trim()) errors.push(`Q${idx + 1} is empty`);
      if (q.type === QuestionType.MCQ && (!q.choices || q.choices.length < 2)) {
        errors.push(`Q${idx + 1} has insufficient answer options`);
      }
      if (q.type === QuestionType.MATCHING) {
        if (!q.matchingPairs || q.matchingPairs.length === 0) {
          errors.push(`Q${idx + 1} is a matching type question but has no matching pairs configured`);
        }
      } else if (
        q.type === QuestionType.MCQ ||
        q.type === QuestionType.TRUE_FALSE ||
        q.type === QuestionType.IDENTIFICATION ||
        q.type === QuestionType.FILL_IN_BLANK
      ) {
        if (!q.correctAnswer || (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())) {
          errors.push(`Q${idx + 1} (${q.type}) has no correct answer configured`);
        }
      }
    });

    if (errors.length > 0) {
      setPublishErrors({
        quizTitle: quiz.title,
        errors
      });
      return;
    }

    const updatedQuizzes = quizzes.map(q => q.id === quizId ? { ...q, isPublished: true } : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(prev => prev && prev.id === quizId ? { ...prev, isPublished: true } : prev);
    showToast('Quiz published successfully! It is now fully active for users.', 'success');
  };

  const handleMergeQuizzesClick = () => {
    if (quizzes.length < 2) {
      showToast('You need at least two quizzes to merge.', 'error');
      return;
    }
    setMergeQuizInputTitle('Merged Exam Reviewer');
    setMergeQuizPrompt({ show: true, defaultValue: 'Merged Exam Reviewer' });
  };

  const handleConfirmMergeQuizzes = (title: string) => {
    if (!title || !title.trim()) {
      showToast('Please enter a valid title for the merged quiz.', 'error');
      return;
    }

    const mergedQuestions: Question[] = [];
    const sourceFiles: string[] = [];
    const subjects: string[] = [];

    quizzes.forEach(q => {
      q.questions.forEach((question, idx) => {
        mergedQuestions.push({
          ...question,
          id: `merged-q-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          number: `${mergedQuestions.length + 1}`
        });
      });
      q.sourceFiles.forEach(f => {
        if (!sourceFiles.includes(f)) sourceFiles.push(f);
      });
      if (q.subject && !subjects.includes(q.subject)) {
        subjects.push(q.subject);
      }
    });

    const mergedQuiz: Quiz = {
      id: `quiz-merged-${Date.now()}`,
      title: title.trim(),
      description: `Merged compilation exam from: ${quizzes.map(q => q.title).join(', ')}`,
      questions: mergedQuestions,
      createdAt: new Date().toISOString(),
      sourceFiles,
      subject: subjects.length > 0 ? subjects[0] : 'Merged General',
      category: 'Master Reviewer',
      isPublished: false
    };

    const updatedQuizzes = [mergedQuiz, ...quizzes];
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(mergedQuiz);
    setMergeQuizPrompt(null);
    showToast(`Successfully merged all quizzes! Created "${title.trim()}" with ${mergedQuestions.length} total questions.`, 'success');
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col font-sans selection:bg-indigo-900/40 antialiased">
      {/* Visual Identity Header */}
      <header id="app-header" className="bg-[#0D0D10]/80 backdrop-blur-md border-b border-b-white/5 sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Board Exam Review Pro</span>
              </h1>
              <p className="text-xs text-slate-400">Document Scan & Interactive Review Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span><strong className="text-white">{quizzes.length}</strong> Quizzes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-500" />
                <span><strong className="text-white">{quizzes.reduce((acc, q) => acc + q.questions.length, 0)}</strong> Extracted Qs</span>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUserRole('admin');
                  safeLocalStorageSet('review_user_role', 'admin');
                  showToast('Switched to Admin Role', 'info');
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer",
                  userRole === 'admin'
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserRole('member');
                  safeLocalStorageSet('review_user_role', 'member');
                  showToast('Switched to Member Role', 'info');
                  if (activeMode === 'edit' || activeMode === 'extract') {
                    setActiveMode('list');
                  }
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer",
                  userRole === 'member'
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Member</span>
              </button>
            </div>

            {userRole === 'admin' && (
              <button
                onClick={() => setActiveMode('extract')}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-all shadow-md cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden xs:inline">Upload Document</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-8">
        {/* Dynamic status indicators */}
        <AnimatePresence>
          {isUploading || isGenerating ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4 text-indigo-200 shadow-lg"
            >
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400 flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-semibold text-sm text-white">Processing Document Stack...</p>
                <p className="text-xs text-indigo-300 mt-0.5">{parsingStatus}</p>
              </div>
              <div className="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Dynamic Professional Stats Header Strip */}
        {activeMode === 'list' && !selectedQuiz && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Metric 1: Streak */}
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Study Streak</span>
                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1.5">
                  <span>{studyStreak}</span>
                  <span className="text-xs text-slate-400 font-medium">Days</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  {studyStreak >= 2 ? 'Streak active! Keep going.' : 'Take exams to build a streak'}
                </span>
              </div>
              <div className="p-3.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl">
                <Flame className={cn("w-5 h-5", studyStreak > 0 && "animate-bounce")} />
              </div>
            </div>

            {/* Metric 2: Accuracy */}
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Average Score</span>
                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1.5">
                  <span>{analyticsSummary.averagePercent}%</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  Across {attempts.filter(a => a.status === 'completed').length} completed runs
                </span>
              </div>
              <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3: Active Library */}
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Dynamic Reviewers</span>
                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1.5">
                  <span>{quizzes.length}</span>
                  <span className="text-xs text-slate-400 font-medium">Active</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  {quizzes.reduce((acc, q) => acc + q.questions.length, 0)} total exam questions
                </span>
              </div>
              <div className="p-3.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 4: Documents Ingested */}
            <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ingested Sources</span>
                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1.5">
                  <span>{uploadedFiles.length}</span>
                  <span className="text-xs text-slate-400 font-medium">Files</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  AI-driven OCR & processing
                </span>
              </div>
              <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Responsive Segmented Navigation Bar for Mobile */}
        <div id="mobile-nav-tabs" className="lg:hidden w-full bg-[#111115] border border-white/[0.06] p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl mb-2">
          <button
            onClick={() => {
              setActiveMode('list');
              setSelectedQuiz(null);
              setSelectedAttemptId(null);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl text-[10px] font-bold tracking-wide transition-all",
              activeMode === 'list' && !selectedQuiz
                ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Library ({quizzes.length})</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveMode('extract')}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl text-[10px] font-bold tracking-wide transition-all",
                activeMode === 'extract'
                  ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Src</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveMode('calendar');
              setSelectedQuiz(null);
              setSelectedAttemptId(null);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl text-[10px] font-bold tracking-wide transition-all",
              activeMode === 'calendar'
                ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('history');
              setSelectedQuiz(null);
              setSelectedAttemptId(null);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl text-[10px] font-bold tracking-wide transition-all",
              activeMode === 'history'
                ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <History className="w-4 h-4" />
            <span>Scores ({attempts.length})</span>
          </button>
        </div>

        {/* Dashboard Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Navigation Sidebar & Upload Workspace (3 cols) - Pushed to bottom on mobile, side-sticky on desktop */}
          {(activeMode !== 'take' && activeMode !== 'edit') && (
            <div className="lg:col-span-3 flex flex-col gap-6 order-last lg:order-first">
              
              {/* Account and Role Information */}
              <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                    AP
                  </div>
                  <div className="min-w-0 flex-grow">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Member Account</span>
                    <span className="text-xs font-bold text-white block truncate" title="angeloperfecto.epc@gmail.com">
                      angeloperfecto.epc@gmail.com
                    </span>
                  </div>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex flex-col gap-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Role Level:</span>
                    <span className="font-extrabold uppercase text-indigo-300 text-[10px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                      {userRole}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System Status:</span>
                    <span className="font-extrabold text-emerald-400 flex items-center gap-1 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </span>
                  </div>
                </div>

                {/* System Notifications / Announcements Board */}
                <div className="border-t border-white/5 pt-3 mt-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Announcements & Tips</span>
                  </span>
                  
                  <div className="bg-[#0e0e11] border border-white/5 p-3 rounded-xl text-[11px] leading-relaxed text-slate-400 flex flex-col gap-2">
                    <p className="font-semibold text-white text-xs">⚡ Reviewer Guidelines</p>
                    <p className="text-[10px] text-slate-400 leading-normal">New structural engineering concepts, formulas on reinforced concrete, and load computations are now live. Run the exam scheduler to practice!</p>
                  </div>
                </div>
              </div>
            
            {/* Quick Stats Panel / Action Cards (Visible only on desktop as mobile has top tabs) */}
            <div className="hidden lg:block bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl transition-all">
              <button
                onClick={() => setOpsCenterExpanded(!opsCenterExpanded)}
                className="w-full flex items-center justify-between text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold mb-0">Operations Center</h3>
                <div className="text-slate-500 bg-white/5 p-1 rounded-md">
                  <motion.div animate={{ rotate: opsCenterExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.div>
                </div>
              </button>
              
              {opsCenterExpanded && (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => {
                      setActiveMode('list');
                      setSelectedQuiz(null);
                      setSelectedAttemptId(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border",
                      activeMode === 'list' && !selectedQuiz
                        ? "bg-indigo-600/10 text-white border-indigo-500/30 shadow-[0_2px_10px_rgba(99,102,241,0.05)]"
                        : "text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-slate-200"
                    )}
                  >
                    <FolderOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="flex-grow">Quiz Library</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-500/20">{quizzes.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode('calendar');
                      setSelectedQuiz(null);
                      setSelectedAttemptId(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border",
                      activeMode === 'calendar'
                        ? "bg-indigo-600/10 text-white border-indigo-500/30 shadow-[0_2px_10px_rgba(99,102,241,0.05)]"
                        : "text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-slate-200"
                    )}
                  >
                    <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="flex-grow">Calendar Schedule</span>
                    {scheduledQuizzes.length > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-500/20">{scheduledQuizzes.length}</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveMode('history');
                      setSelectedQuiz(null);
                      setSelectedAttemptId(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border",
                      activeMode === 'history'
                        ? "bg-indigo-600/10 text-white border-indigo-500/30 shadow-[0_2px_10px_rgba(99,102,241,0.05)]"
                        : "text-slate-400 border-transparent hover:bg-white/[0.03] hover:text-slate-200"
                    )}
                  >
                    <History className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="flex-grow">Score History & Analytics</span>
                    {attempts.length > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-500/20">
                        {attempts.length}
                      </span>
                    )}
                  </button>

                  {userRole === 'admin' && (
                    <button
                      onClick={handleMergeQuizzesClick}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 hover:text-white transition-all text-left cursor-pointer border border-transparent hover:border-indigo-500/20"
                    >
                      <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>Merge All Quizzes</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Document Library - Collapsible with beautiful header trigger */}
            <div className="bg-[#111115] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden transition-all">
              <button
                onClick={() => setDocsExpanded(!docsExpanded)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ingested Documents</span>
                  </h3>
                  {uploadedFiles.length > 0 && (
                    <p className="text-[10px] text-indigo-400 font-semibold mt-1">
                      {uploadedFiles.length} active files loaded
                    </p>
                  )}
                </div>
                <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                  <motion.div animate={{ rotate: docsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </button>
              
              <AnimatePresence initial={false}>
                {docsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/[0.04]"
                  >
                    <div className="p-5 flex flex-col gap-3">
                      {uploadedFiles.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-white/[0.06] rounded-xl bg-white/[0.01]">
                          <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          <p>No active source files loaded yet.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                          {uploadedFiles.map(file => (
                            <div key={file.id} className="p-3 border border-white/5 rounded-xl flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all">
                              <FileCode className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                              <div className="flex-grow min-w-0">
                                <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • {file.pageCount} page(s)</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Parsing Log Tracker - Collapsible */}
            {extractionLogs.length > 0 && (
              <div className="bg-[#111115] border border-white/[0.06] rounded-2xl shadow-xl overflow-hidden transition-all">
                <button
                  onClick={() => setLogsExpanded(!logsExpanded)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Extraction Logs</span>
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                      {extractionLogs.filter(l => l.status === 'success').length} processed successfully
                    </p>
                  </div>
                  <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400">
                    <motion.div animate={{ rotate: logsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {logsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-white/[0.04]"
                    >
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                          {extractionLogs.map(log => (
                            <div key={log.id} className="p-3 border border-white/5 rounded-xl bg-white/[0.02] text-xs flex flex-col gap-1.5 hover:border-white/10 transition-all">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{log.fileName}</span>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border flex-shrink-0",
                                  log.status === 'success' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                  log.status === 'processing' && "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse",
                                  log.status === 'failed' && "bg-red-500/10 text-red-400 border-red-500/20",
                                  log.status === 'pending' && "bg-white/5 text-slate-400 border-white/5"
                                )}>
                                  {log.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                                <span>Pages processed: {log.processedPages || 0} / {log.totalPages || 'N/A'}</span>
                                {log.questionsFound > 0 && (
                                  <span className="text-indigo-400 font-bold">{log.questionsFound} Qs extracted</span>
                                )}
                              </div>
                              {log.error && (
                                <p className="text-[10px] text-red-400 border-t border-white/5 mt-1 pt-1 truncate">{log.error}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            </div>
          )}

          {/* Core Interactive Board / Playground - Dynamic 9 cols or full 12 cols depending on active mode */}
          <div className={cn(
            "order-first lg:order-last flex flex-col gap-6",
            (activeMode !== 'take' && activeMode !== 'edit') ? "lg:col-span-9 animate-fade-in" : "lg:col-span-12 animate-fade-in"
          )}>
            
            {/* MODE 1: UPLOAD & GENERATOR SETTINGS */}
            {activeMode === 'extract' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111114] border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Document Upload & Extractor Config</h2>
                    <p className="text-xs text-slate-400">Provide exam materials and customize AI parameters for extraction</p>
                  </div>
                  <button 
                    onClick={() => setActiveMode('list')}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* File Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className="border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-white/5 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 bg-[#0E0E11]"
                  >
                    <div className="p-3 bg-[#111114] rounded-lg border border-white/10 text-slate-300 shadow-md">
                      <Upload className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Drag & drop your files here, or <span className="text-indigo-400">Browse</span></p>
                      <p className="text-xs text-slate-500 mt-1">Accepts PDF (.pdf) and Microsoft Word (.docx) files • Up to 100+ pages</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* List of files ready for processing */}
                  {uploadedFiles.length > 0 && (
                    <div className="border border-white/10 rounded-xl p-4 bg-[#0E0E11]">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">Loaded Documents Checklist</h4>
                      <div className="flex flex-col gap-2">
                        {uploadedFiles.map(f => (
                          <div key={f.id} className="flex items-center justify-between p-2.5 bg-[#111114] border border-white/5 rounded-xl text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              <span className="font-medium text-slate-200 truncate max-w-[300px]">{f.name}</span>
                              <span className="text-xs text-slate-500">({(f.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={() => setUploadedFiles(prev => prev.filter(x => x.id !== f.id))}
                              className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Extraction Customization Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">Quiz Subject / Course</label>
                      <input
                        type="text"
                        placeholder="e.g. Structural Design, General Science"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        className="p-2.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/5 text-slate-100 text-sm placeholder-slate-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">Default Quiz Difficulty</label>
                      <select
                        value={difficultyInput}
                        onChange={(e: any) => setDifficultyInput(e.target.value)}
                        className="p-2.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#111114] text-slate-100 text-sm"
                      >
                        <option value="auto" className="bg-[#111114]">Auto-detect from source</option>
                        <option value="easy" className="bg-[#111114]">Easy</option>
                        <option value="medium" className="bg-[#111114]">Medium</option>
                        <option value="hard" className="bg-[#111114]">Hard</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400">Custom Extraction Rules / Instructions</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Look for answers in bold. Ignore sections marked with 'Appendix'. This is a Tagalog-English exam review sheet, please handle terminology properly."
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        className="p-2.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/5 text-slate-100 text-sm placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveMode('list')}
                      className="px-4 py-2 text-sm font-semibold border border-white/10 rounded-lg hover:bg-white/10 transition-all text-slate-300"
                    >
                      Back to Library
                    </button>

                    <button
                      type="button"
                      disabled={uploadedFiles.length === 0 || isGenerating}
                      onClick={generateQuizFromFiles}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 disabled:border-white/5 text-white font-semibold text-sm rounded-lg transition-all shadow-md cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Quiz...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Quiz Now (100% Extraction)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODE 1.5: CALENDAR SCHEDULE WORKSPACE */}
            {activeMode === 'calendar' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Header Banner */}
                <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <span>Civil & Electrical Board Exam Study Calendar</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Set timed exam constraints on uploaded reviewers, assign study dates, and build rigorous test habits.
                    </p>
                  </div>
                  {userRole === 'admin' && (
                    <button
                      onClick={() => {
                        if (quizzes.length === 0) {
                          showToast('Please upload or generate a quiz reviewer first!', 'error');
                          return;
                        }
                        handleOpenCreateSchedule(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule Mock Exam</span>
                    </button>
                  )}
                </div>

                {/* Calendar View Controls */}
                <div className="bg-[#111114] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handlePrevCalendar}
                      className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Previous"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleTodayCalendar}
                      className="px-3 py-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      onClick={handleNextCalendar}
                      className="p-2 hover:bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Next"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black text-white ml-2">
                      {calendarView === 'month' && `${MONTHS[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`}
                      {calendarView === 'week' && `Week of ${new Date(calendarDate.getTime() - calendarDate.getDay() * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`}
                      {calendarView === 'day' && calendarDate.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                  </div>

                  <div className="flex bg-white/5 p-1 border border-white/5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setCalendarView('month')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        calendarView === 'month' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        calendarView === 'week' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarView('day')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                        calendarView === 'day' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      )}
                    >
                      Day
                    </button>
                  </div>
                </div>

                {/* VIEW 1: MONTHLY VIEW GRID */}
                {calendarView === 'month' && (() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDayIndex = new Date(year, month, 1).getDay();
                  const prevMonthDays = new Date(year, month, 0).getDate();

                  const cells = [];
                  // Prev month padding
                  for (let i = firstDayIndex - 1; i >= 0; i--) {
                    const dayNum = prevMonthDays - i;
                    const d = new Date(year, month - 1, dayNum);
                    const dateStr = d.toISOString().split('T')[0];
                    cells.push({ dateStr, dayNum, isCurrentMonth: false });
                  }
                  // Current month
                  for (let i = 1; i <= daysInMonth; i++) {
                    const d = new Date(year, month, i);
                    const dateStr = d.toISOString().split('T')[0];
                    cells.push({ dateStr, dayNum: i, isCurrentMonth: true });
                  }
                  // Next month padding to multi of 7
                  const totalCells = cells.length <= 35 ? 35 : 42;
                  const nextPadding = totalCells - cells.length;
                  for (let i = 1; i <= nextPadding; i++) {
                    const d = new Date(year, month + 1, i);
                    const dateStr = d.toISOString().split('T')[0];
                    cells.push({ dateStr, dayNum: i, isCurrentMonth: false });
                  }

                  return (
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl">
                      {/* Weekday labels */}
                      <div className="grid grid-cols-7 text-center mb-2 border-b border-white/5 pb-2">
                        {WEEKDAYS.map(w => (
                          <span key={w} className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">{w}</span>
                        ))}
                      </div>

                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                        {cells.map((cell, idx) => {
                          const daySchedules = getSchedulesForDate(cell.dateStr);
                          const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "min-h-[85px] sm:min-h-[110px] border rounded-xl p-1.5 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 text-left transition-all relative overflow-hidden group",
                                cell.isCurrentMonth ? "bg-[#0E0E11]/80 hover:bg-[#0E0E11]" : "bg-[#0A0A0B]/30 opacity-40",
                                isToday ? "border-indigo-500 bg-indigo-500/[0.02]" : "border-white/5"
                              )}
                            >
                              {/* Cell Header */}
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-xs font-extrabold px-1.5 py-0.5 rounded-md",
                                  isToday ? "bg-indigo-600 text-white" : cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"
                                )}>
                                  {cell.dayNum}
                                </span>

                                {userRole === 'admin' && cell.isCurrentMonth && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCreateSchedule(cell.dateStr);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all cursor-pointer"
                                    title="Schedule exam on this date"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Daily schedule item badges */}
                              <div className="flex flex-col gap-1 overflow-y-auto max-h-[50px] sm:max-h-[70px] scrollbar-thin">
                                {daySchedules.map(sched => {
                                  const status = getScheduledQuizStatus(sched);
                                  return (
                                    <div
                                      key={sched.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingScheduleDetails(sched);
                                      }}
                                      className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-black truncate text-left cursor-pointer transition-all border",
                                        status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                        status === 'Completed' ? 'bg-slate-500/15 text-slate-400 border-slate-500/25 line-through' :
                                        status === 'Missed/Expired' ? 'bg-red-500/10 text-red-400 border-red-500/10' :
                                        'bg-blue-500/10 text-blue-300 border-blue-500/20'
                                      )}
                                      title={`${sched.startTime} - ${sched.quizTitle}`}
                                    >
                                      <span className="font-mono text-[8px] mr-0.5 opacity-80">{sched.startTime}</span> {sched.quizTitle}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* VIEW 2: WEEKLY VIEW COLUMNS */}
                {calendarView === 'week' && (() => {
                  const currentDay = calendarDate.getDay();
                  const sun = new Date(calendarDate);
                  sun.setDate(calendarDate.getDate() - currentDay);
                  const weekCells = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(sun);
                    d.setDate(sun.getDate() + i);
                    weekCells.push(d);
                  }

                  return (
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                        {weekCells.map((dayDate, idx) => {
                          const dayStr = dayDate.toISOString().split('T')[0];
                          const daySchedules = getSchedulesForDate(dayStr);
                          const isToday = dayStr === new Date().toISOString().split('T')[0];

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "bg-[#0E0E11] border rounded-xl p-4 flex flex-col gap-3 min-h-[220px] transition-all",
                                isToday ? 'border-indigo-500 bg-indigo-500/[0.01]' : 'border-white/5'
                              )}
                            >
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                  {WEEKDAYS[dayDate.getDay()]}
                                </span>
                                <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded-full",
                                  isToday ? "bg-indigo-600 text-white" : "text-slate-300"
                                )}>
                                  {dayDate.getDate()}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1.5 flex-grow overflow-y-auto max-h-[140px] scrollbar-thin">
                                {daySchedules.length === 0 ? (
                                  <span className="text-[10px] text-slate-600 italic mt-2">No mock tests</span>
                                ) : (
                                  daySchedules.map(sched => (
                                    <div
                                      key={sched.id}
                                      onClick={() => setViewingScheduleDetails(sched)}
                                      className="p-2 bg-black/40 border border-white/5 hover:border-indigo-500/20 rounded-lg cursor-pointer transition-all flex flex-col gap-1 text-left"
                                    >
                                      <span className="text-[9px] font-mono text-indigo-400">{sched.startTime}</span>
                                      <span className="text-[10px] font-black text-white truncate">{sched.quizTitle}</span>
                                    </div>
                                  ))
                                )}
                              </div>

                              {userRole === 'admin' && (
                                <button
                                  onClick={() => handleOpenCreateSchedule(dayStr)}
                                  className="w-full py-1.5 border border-dashed border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Schedule</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* VIEW 3: DAILY VIEW AGENDA */}
                {calendarView === 'day' && (
                  <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 shadow-xl">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          <span>Agenda for {calendarDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </h4>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleOpenCreateSchedule(calendarDate.toISOString().split('T')[0])}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Schedule Quiz</span>
                          </button>
                        )}
                      </div>

                      {getSchedulesForDate(calendarDate.toISOString().split('T')[0]).length === 0 ? (
                        <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-xl text-slate-500 text-xs flex flex-col items-center gap-2">
                          <Calendar className="w-8 h-8 text-slate-700" />
                          <span>No quizzes scheduled for this day.</span>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleOpenCreateSchedule(calendarDate.toISOString().split('T')[0])}
                              className="mt-2 text-indigo-400 font-bold hover:underline"
                            >
                              Schedule one now
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {getSchedulesForDate(calendarDate.toISOString().split('T')[0])
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map(sched => {
                              const status = getScheduledQuizStatus(sched);
                              const origQuiz = quizzes.find(q => q.id === sched.quizId);

                              return (
                                <div
                                  key={sched.id}
                                  className="bg-[#0E0E11] border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/10 transition-all text-left"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 font-mono text-xs font-bold mt-1">
                                      {sched.startTime}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="text-sm font-bold text-white">{sched.quizTitle}</h5>
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                          status === 'Upcoming' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                          status === 'Available' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
                                          status === 'In Progress' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                          status === 'Completed' && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                                          status === 'Missed/Expired' && 'bg-red-500/10 text-red-400 border-red-500/20'
                                        )}>
                                          {status}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        {sched.subject || 'General Study'} • {sched.category || 'Reviewer'}
                                      </p>
                                      {sched.notes && (
                                        <p className="text-[11px] text-slate-500 mt-2 bg-black/30 p-2 rounded border border-white/5 italic">
                                          &ldquo;{sched.notes}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                                    <span className="text-xs text-slate-400 mr-2">
                                      {sched.duration ? `${sched.duration} mins` : 'Untimed'}
                                    </span>

                                    {userRole === 'admin' ? (
                                      <>
                                        <button
                                          onClick={() => handleOpenEditSchedule(sched)}
                                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent"
                                          title="Edit schedule details"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSchedule(sched)}
                                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent"
                                          title="Delete schedule event"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    ) : null}

                                    {status === 'Available' && (
                                      <button
                                        onClick={() => {
                                          if (origQuiz) {
                                            const customConfig = {
                                              ...quizConfig,
                                              timeLimit: (sched.duration || 0) * 60,
                                            };
                                            startQuiz(origQuiz, customConfig, sched.id);
                                          } else {
                                            showToast('Quiz reviewer missing.', 'error');
                                          }
                                        }}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>Start Quiz</span>
                                      </button>
                                    )}

                                    {status !== 'Available' && status !== 'In Progress' && (
                                      <button
                                        onClick={() => {
                                          if (origQuiz) {
                                            const customConfig = {
                                              ...quizConfig,
                                              timeLimit: (sched.duration || 0) * 60,
                                            };
                                            startQuiz(origQuiz, customConfig, sched.id);
                                          } else {
                                            showToast('Quiz reviewer missing.', 'error');
                                          }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>{status === 'Completed' ? 'Retake Quiz' : 'Take Quiz'}</span>
                                      </button>
                                    )}

                                    {status === 'In Progress' && (
                                      <button
                                        onClick={() => {
                                          if (origQuiz) {
                                            setSelectedQuiz(origQuiz);
                                            setActiveMode('take');
                                          } else {
                                            showToast('Quiz reviewer missing.', 'error');
                                          }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow"
                                      >
                                        <span>Resume</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW DETAILS DRAWER/MODAL FOR SCHEDULED QUIZ */}
            {viewingScheduleDetails && (() => {
              const status = getScheduledQuizStatus(viewingScheduleDetails);
              const origQuiz = quizzes.find(q => q.id === viewingScheduleDetails.quizId);

              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                    <button
                      onClick={() => setViewingScheduleDetails(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        status === 'Upcoming' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                        status === 'Available' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
                        status === 'In Progress' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                        status === 'Completed' && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                        status === 'Missed/Expired' && 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {status}
                      </span>
                      <span className="text-xs text-slate-500">Scheduled Quiz Event</span>
                    </div>

                    <h3 className="text-lg font-black text-white">{viewingScheduleDetails.quizTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Subject: <strong className="text-indigo-400">{viewingScheduleDetails.subject || 'General'}</strong> • Category: <strong className="text-slate-200">{viewingScheduleDetails.category || 'Reviewer'}</strong>
                    </p>

                    <div className="grid grid-cols-2 gap-4 my-5 bg-[#0E0E11] p-4 rounded-xl border border-white/5 text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Date</span>
                        <span className="font-bold text-white">{viewingScheduleDetails.date}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Start Time</span>
                        <span className="font-bold text-white">{viewingScheduleDetails.startTime}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Duration limit</span>
                        <span className="font-bold text-white">{viewingScheduleDetails.duration ? `${viewingScheduleDetails.duration} minutes` : 'No time limit'}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Linked Quiz size</span>
                        <span className="font-bold text-white">{origQuiz ? `${origQuiz.questions.length} questions` : 'N/A'}</span>
                      </div>
                    </div>

                    {viewingScheduleDetails.notes && (
                      <div className="mb-5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Instructions / Notes</span>
                        <div className="text-xs text-slate-300 italic bg-white/[0.02] border border-white/5 p-3 rounded-lg leading-relaxed">
                          &ldquo;{viewingScheduleDetails.notes}&rdquo;
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                      <div>
                        {userRole === 'admin' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setViewingScheduleDetails(null);
                                handleOpenEditSchedule(viewingScheduleDetails);
                              }}
                              className="px-3 py-2 border border-white/10 hover:bg-white/5 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteSchedule(viewingScheduleDetails);
                              }}
                              className="px-3 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingScheduleDetails(null)}
                          className="px-4 py-2 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          Close
                        </button>

                        {status === 'Available' && (
                          <button
                            onClick={() => {
                              if (origQuiz) {
                                setViewingScheduleDetails(null);
                                const customConfig = {
                                  ...quizConfig,
                                  timeLimit: (viewingScheduleDetails.duration || 0) * 60,
                                };
                                startQuiz(origQuiz, customConfig, viewingScheduleDetails.id);
                              } else {
                                showToast('Original quiz reviewer is missing or has been deleted.', 'error');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow animate-pulse"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Quiz</span>
                          </button>
                        )}

                        {status !== 'Available' && status !== 'In Progress' && (
                          <button
                            onClick={() => {
                              if (origQuiz) {
                                setViewingScheduleDetails(null);
                                const customConfig = {
                                  ...quizConfig,
                                  timeLimit: (viewingScheduleDetails.duration || 0) * 60,
                                };
                                startQuiz(origQuiz, customConfig, viewingScheduleDetails.id);
                              } else {
                                showToast('Original quiz reviewer is missing or has been deleted.', 'error');
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{status === 'Completed' ? 'Retake Quiz' : 'Take Quiz'}</span>
                          </button>
                        )}

                        {status === 'In Progress' && (
                          <button
                            onClick={() => {
                              if (origQuiz) {
                                setViewingScheduleDetails(null);
                                setSelectedQuiz(origQuiz);
                                setActiveMode('take');
                              } else {
                                showToast('Original quiz reviewer is missing or has been deleted.', 'error');
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                          >
                            <span>Resume</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SCHEDULE QUIZ MODAL (ADMIN ONLY) */}
            {showScheduleModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-[#111114] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 relative my-8">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <h3 className="text-lg font-black text-white">
                      {editingSchedule ? 'Edit Quiz Schedule Event' : 'Schedule a Board Exam Reviewer'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Assign existing mock reviewers to specific calendar dates to enforce structured examination.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 text-xs text-slate-300">
                    {/* STEP 1: Quiz Selection with Search and Filter */}
                    <div className="border border-white/5 bg-black/20 p-4 rounded-xl flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Step 1: Select Quiz & Filter Catalog</span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Search title/subject..."
                          value={scheduleSearchQuery}
                          onChange={(e) => setScheduleSearchQuery(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none placeholder-slate-600"
                        />
                        <select
                          value={scheduleFilterSubject}
                          onChange={(e) => setScheduleFilterSubject(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                        >
                          <option value="All">All Subjects</option>
                          {uniqueSchedulingSubjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={scheduleFilterCategory}
                          onChange={(e) => setScheduleFilterCategory(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                        >
                          <option value="All">All Categories</option>
                          {uniqueSchedulingCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        <select
                          value={scheduleFilterDifficulty}
                          onChange={(e) => setScheduleFilterDifficulty(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                        >
                          <option value="All">All Difficulties</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Select Quiz Reviewer</label>
                        <select
                          value={scheduleQuizId}
                          onChange={(e) => {
                            setScheduleQuizId(e.target.value);
                            const selected = quizzes.find(q => q.id === e.target.value);
                            if (selected) {
                              setScheduleSubject(selected.subject || '');
                              setScheduleCategory(selected.category || '');
                            }
                          }}
                          className="p-2.5 border border-indigo-500/20 bg-[#111114] text-slate-200 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Choose Quiz --</option>
                          {filteredQuizzesForScheduling.map(quiz => (
                            <option key={quiz.id} value={quiz.id}>
                              {quiz.title} ({quiz.questions.length} Qs) {quiz.subject ? `[${quiz.subject}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* STEP 2: Date and Time Schedule Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Schedule Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Start Time</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Duration (Minutes)</label>
                        <input
                          type="number"
                          min="1"
                          max="360"
                          value={scheduleDuration}
                          onChange={(e) => setScheduleDuration(Number(e.target.value))}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Overrides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Subject Override</label>
                        <input
                          type="text"
                          placeholder="e.g. Electrical Engineering"
                          value={scheduleSubject}
                          onChange={(e) => setScheduleSubject(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-bold">Category Override</label>
                        <input
                          type="text"
                          placeholder="e.g. NSCP Part 1"
                          value={scheduleCategory}
                          onChange={(e) => setScheduleCategory(e.target.value)}
                          className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* NOTES */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Candidate Instructions / Notes (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Instructions for taking this mock exam..."
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        className="p-2.5 border border-white/10 rounded-lg bg-[#111114] text-slate-200 text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      disabled={!scheduleQuizId}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      {editingSchedule ? 'Update Schedule' : 'Schedule Exam'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: QUIZ LIBRARY VIEW */}
            {activeMode === 'list' && (
              <div className="flex flex-col gap-6">

                {/* Hero Greeting and Quick Action Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/60 via-[#111115] to-[#111115] border border-white/[0.06] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                  {/* Subtle background glow */}
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest uppercase rounded-full border border-indigo-500/20 shadow-sm">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>Next-Gen Study Engine</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Dynamic Quiz Library
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                      Upload board exam reviewers, textbook chapters, or reference papers. AI will instantly model an interactive simulator customized to your goals.
                    </p>
                  </div>

                  {userRole === 'admin' && (
                    <button
                      onClick={() => setActiveMode('extract')}
                      className="relative z-10 flex-shrink-0 flex items-center gap-2 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgb(99,102,241,0.25)] active:scale-[0.98] w-full md:w-auto justify-center cursor-pointer min-h-[44px]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload & Generate Exam</span>
                    </button>
                  )}
                </div>

                {/* Workspace Navigation Sub-Tabs */}
                <div className="flex border-b border-white/5 pb-px gap-6 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setLibraryTab('dashboard')}
                    className={cn(
                      "pb-4 text-xs sm:text-sm font-extrabold transition-all relative flex items-center gap-2 cursor-pointer whitespace-nowrap",
                      libraryTab === 'dashboard'
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <Trophy className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Academic Analytics Dashboard</span>
                    {libraryTab === 'dashboard' && (
                      <motion.div
                        layoutId="activeLibraryTabBorder"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setLibraryTab('quizzes')}
                    className={cn(
                      "pb-4 text-xs sm:text-sm font-extrabold transition-all relative flex items-center gap-2 cursor-pointer whitespace-nowrap",
                      libraryTab === 'quizzes'
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Interactive Exam Library</span>
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-black rounded-full leading-none flex-shrink-0">
                      {quizzes.length}
                    </span>
                    {libraryTab === 'quizzes' && (
                      <motion.div
                        layoutId="activeLibraryTabBorder"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                      />
                    )}
                  </button>
                </div>

                {/* TAB CONTENT 1: ACADEMIC ANALYTICS DASHBOARD */}
                {libraryTab === 'dashboard' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Metrics Dashboard Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* Metric 1: Total Questions */}
                      <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4.5 shadow-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Questions</span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                            {dashboardStats.totalQuestions}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Practice database</span>
                        </div>
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex-shrink-0">
                          <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>

                      {/* Metric 2: Available Reviewers */}
                      <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4.5 shadow-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Exams</span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                            {dashboardStats.totalQuizzes}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Available reviewers</span>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex-shrink-0">
                          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>

                      {/* Metric 3: Completed Runs */}
                      <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4.5 shadow-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Completed Runs</span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                            {dashboardStats.completedQuizzesCount}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Interactive attempts</span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex-shrink-0">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>

                      {/* Metric 4: Weighted Score */}
                      <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4.5 shadow-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Average Score</span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                            {dashboardStats.averageScore}%
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Across completions</span>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex-shrink-0">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      </div>

                      {/* Metric 5: Streak Counter */}
                      <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4.5 shadow-xl flex-col sm:flex-row flex items-start sm:items-center justify-between col-span-2 md:col-span-1">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Study Streak</span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                            {studyStreak} Day{studyStreak !== 1 && 's'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block leading-tight">Consecutive days</span>
                        </div>
                        <div className={cn(
                          "p-3 rounded-xl flex-shrink-0 self-end sm:self-auto mt-2 sm:mt-0 border",
                          studyStreak > 0
                            ? "bg-orange-500/15 text-orange-400 border-orange-500/35"
                            : "bg-white/5 text-slate-500 border-white/5"
                        )}>
                          <Flame className={cn("w-4 h-4 sm:w-5 sm:h-5", studyStreak > 0 && "animate-bounce")} />
                        </div>
                      </div>
                    </div>

                    {/* Analytics Dashboard Grid: Graph + Recommendations */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left: Subject Mastery Graph */}
                      <div className="lg:col-span-7 bg-[#111115] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">Subject Mastery index</h3>
                            <p className="text-[11px] text-slate-400">Mean accuracy score tracked per board syllabus topic</p>
                          </div>
                        </div>

                        {dashboardStats.subjectProgress.length === 0 ? (
                          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                            <Trophy className="w-10 h-10 text-slate-600 mb-3 stroke-[1.5]" />
                            <h4 className="text-xs font-bold text-white">No Board Scores Found</h4>
                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                              Complete practice tests to build your mastery blueprint and see automated accuracy scoring per subject.
                            </p>
                          </div>
                        ) : (
                          <div className="h-[240px] w-full text-slate-400 font-medium">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                layout="vertical"
                                data={dashboardStats.subjectProgress}
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                              >
                                <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={10} fontStyle="bold" />
                                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} fontStyle="bold" width={110} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0B0B0C', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }} 
                                  labelStyle={{ fontWeight: 'black', color: '#fff', fontSize: '11px' }}
                                />
                                <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12}>
                                  {dashboardStats.subjectProgress.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.avgScore >= 80 ? '#10b981' : entry.avgScore >= 60 ? '#6366f1' : '#f43f5e'} 
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Right: Tailored Review Recommendations */}
                      <div className="lg:col-span-5 bg-[#111115] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">Recommended practice</h3>
                            <p className="text-[11px] text-slate-400">Targeted practices to secure weak subject scores</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 flex-grow justify-center">
                          {dashboardStats.recommendedQuizzes.length === 0 ? (
                            <div className="text-center py-10 px-4">
                              <HelpCircle className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5] mb-2" />
                              <p className="text-xs text-slate-500 font-medium">No practice reviews mapped.</p>
                              <p className="text-[10px] text-slate-600 mt-1">Upload files using the scanner module to compile exams.</p>
                            </div>
                          ) : (
                            dashboardStats.recommendedQuizzes.map(q => {
                              const qAttempts = attempts.filter(a => a.quizId === q.id && a.status === 'completed');
                              const bestScore = qAttempts.length > 0 ? Math.max(...qAttempts.map(a => Math.round((a.score / a.totalQuestions) * 100))) : null;

                              return (
                                <div key={q.id} className="p-3 border border-white/5 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] transition-all flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[9px] font-black uppercase">
                                        {q.subject || 'Syllabus Topic'}
                                      </span>
                                      {bestScore !== null && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold">
                                          Peak: {bestScore}%
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-white mt-1.5 truncate" title={q.title}>{q.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{q.questions.length} reviewer questions</p>
                                  </div>
                                  <button
                                    onClick={() => { setSelectedQuiz(q); startQuiz(q); }}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 shadow shadow-indigo-950/20 active:scale-95"
                                  >
                                    <Play className="w-2.5 h-2.5" />
                                    <span>Practice</span>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Simulated Mock Exams Panel */}
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">Upcoming Simulated Mock Exams</h3>
                            <p className="text-[11px] text-slate-400">Scheduled time-limit runs from your review syllabus</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveMode('calendar')}
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Scheduler</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {scheduledQuizzes.length === 0 ? (
                        <div className="text-center py-6 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-xl flex flex-col items-center gap-2">
                          <Calendar className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                          <p className="text-xs text-slate-400 font-medium">No mock exam sessions scheduled yet.</p>
                          <p className="text-[10px] text-slate-500 max-w-sm">
                            Configure active mock schedules in the Review Scheduler to practice time pacing under board conditions.
                          </p>
                          {userRole === 'admin' && (
                            <button
                              onClick={() => setActiveMode('calendar')}
                              className="mt-1 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-bold text-xs rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                            >
                              Open Calendar to Schedule
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {scheduledQuizzes.slice(0, 4).map(schedule => {
                            const status = getScheduledQuizStatus(schedule);
                            const origQuiz = quizzes.find(q => q.id === schedule.quizId);

                            return (
                              <div
                                key={schedule.id}
                                className={cn(
                                  "relative border rounded-xl p-4 transition-all flex flex-col justify-between gap-4 overflow-hidden text-left",
                                  status === 'Available' ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-emerald-950/20 shadow-lg' :
                                  status === 'In Progress' ? 'bg-indigo-500/[0.03] border-indigo-500/20 shadow-lg' :
                                  status === 'Completed' ? 'bg-slate-500/[0.01] border-white/5 opacity-80' :
                                  status === 'Missed/Expired' ? 'bg-red-500/[0.01] border-red-500/10' :
                                  'bg-[#131317] border-white/5 hover:border-white/10'
                                )}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                      status === 'Upcoming' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                      status === 'Available' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
                                      status === 'In Progress' && 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                      status === 'Completed' && 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                                      status === 'Missed/Expired' && 'bg-red-500/10 text-red-400 border-red-500/20'
                                    )}>
                                      {status}
                                    </span>

                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {schedule.date} @ {schedule.startTime}
                                    </span>
                                  </div>

                                  <h4 className="text-xs font-bold text-white line-clamp-1">{schedule.quizTitle}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                    {schedule.subject || 'General Study'} • {schedule.category || 'Reviewer'}
                                  </p>

                                  {schedule.notes && (
                                    <p className="text-[10px] text-slate-500 mt-2 bg-black/20 p-1.5 rounded border border-white/5 italic">
                                      &ldquo;{schedule.notes}&rdquo;
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>{schedule.duration ? `${schedule.duration} min limit` : 'Unlimited time'}</span>
                                  </span>

                                  {status === 'Available' && (
                                    <button
                                      onClick={() => {
                                        if (origQuiz) {
                                          const customConfig = {
                                            ...quizConfig,
                                            timeLimit: (schedule.duration || 0) * 60,
                                          };
                                          startQuiz(origQuiz, customConfig, schedule.id);
                                        } else {
                                          showToast('Underlying quiz reviewer is missing or deleted.', 'error');
                                        }
                                      }}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg transition-all shadow shadow-emerald-950/40 cursor-pointer flex items-center gap-1 animate-pulse"
                                    >
                                      <Play className="w-2.5 h-2.5" />
                                      <span>Start Quiz</span>
                                    </button>
                                  )}

                                  {status === 'In Progress' && (
                                    <button
                                      onClick={() => {
                                        if (origQuiz) {
                                          setSelectedQuiz(origQuiz);
                                          setActiveMode('take');
                                        } else {
                                          showToast('Underlying quiz reviewer is missing or deleted.', 'error');
                                        }
                                      }}
                                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] rounded-lg transition-all shadow cursor-pointer flex items-center gap-1"
                                    >
                                      <span>Resume</span>
                                      <ChevronRight className="w-2.5 h-2.5" />
                                    </button>
                                  )}

                                  {status !== 'Available' && status !== 'In Progress' && (
                                    <button
                                      onClick={() => {
                                        if (origQuiz) {
                                          const customConfig = {
                                            ...quizConfig,
                                            timeLimit: (schedule.duration || 0) * 60,
                                          };
                                          startQuiz(origQuiz, customConfig, schedule.id);
                                        } else {
                                          showToast('Underlying quiz reviewer is missing or deleted.', 'error');
                                        }
                                      }}
                                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] rounded-lg transition-all shadow cursor-pointer flex items-center gap-1"
                                    >
                                      <Play className="w-2.5 h-2.5" />
                                      <span>{status === 'Completed' ? 'Retake' : 'Take'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Wide Table of Recent Quiz Results */}
                    <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Recent Mock Exam Runs</h3>
                          <p className="text-[11px] text-slate-400">History record and key summaries from your practice completions</p>
                        </div>
                      </div>
                      
                      {dashboardStats.recentResults.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                          No completed reviewer runs captured yet. Take an interactive practice exam to start logging scores.
                        </div>
                      ) : (
                        <div className="overflow-x-auto select-none">
                          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                                <th className="pb-3 pr-4">Reviewer Exam</th>
                                <th className="pb-3 pr-4">Subject Syllabus</th>
                                <th className="pb-3 pr-4">Run Date</th>
                                <th className="pb-3 pr-4 text-center">Questions Solved / Score</th>
                                <th className="pb-3 pr-4">Total Time</th>
                                <th className="pb-3 text-right">Action Desk</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                              {dashboardStats.recentResults.map(attempt => {
                                const q = quizzes.find(quiz => quiz.id === attempt.quizId);
                                const scorePercent = Math.round((attempt.score / attempt.totalQuestions) * 100);
                                return (
                                  <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-3.5 pr-4 font-bold text-white max-w-[200px] truncate" title={q?.title}>{q?.title || 'Unknown Reviewer'}</td>
                                    <td className="py-3.5 pr-4 text-indigo-300 font-bold">{q?.subject || 'Syllabus'}</td>
                                    <td className="py-3.5 pr-4 text-slate-400">{new Date(attempt.completedAt || '').toLocaleDateString()}</td>
                                    <td className="py-3.5 pr-4 text-center">
                                      <span className={cn(
                                        "px-2.5 py-1 rounded text-[10px] font-black uppercase border",
                                        scorePercent >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                        scorePercent >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                                        "bg-red-500/10 text-red-400 border-red-500/20"
                                      )}>
                                        {attempt.score} / {attempt.totalQuestions} ({scorePercent}%)
                                      </span>
                                    </td>
                                    <td className="py-3.5 pr-4 font-mono text-slate-400">
                                      {formatDuration(attempt.startedAt, attempt.completedAt)}
                                    </td>
                                    <td className="py-3.5 text-right">
                                      <button
                                        onClick={() => {
                                          if (q) {
                                            setSelectedQuiz(q);
                                            startQuiz(q);
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-extrabold rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                                      >
                                        Retake practice
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TAB CONTENT 2: INTERACTIVE PRACTICE EXAMS LIBRARY */}
                {libraryTab === 'quizzes' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Search / Filter / Sort Bar */}
                    <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center gap-4 justify-between">
                      {/* Search box with Icon prefix */}
                      <div className="relative flex-grow max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Search className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search quizzes, engineering topics, subjects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#0E0E11] text-slate-100 text-xs placeholder-slate-500 transition-all min-h-[44px]"
                        />
                      </div>

                      {/* Filter and Sort selectors */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-end flex-shrink-0">
                        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 min-h-[44px]">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                            <Filter className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Subject:</span>
                          </span>
                          <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full sm:w-auto p-2.5 border border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#111115] text-xs font-bold text-slate-200 cursor-pointer min-h-[44px] sm:min-w-[150px]"
                          >
                            <option value="All" className="bg-[#111115]">All Subjects</option>
                            {allSubjects.map(sub => (
                              <option key={sub} value={sub} className="bg-[#111115]">{sub}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0 min-h-[44px]">
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Sort:</span>
                          </span>
                          <select
                            value={sortBy}
                            onChange={(e: any) => setSortBy(e.target.value)}
                            className="w-full sm:w-auto p-2.5 border border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#111115] text-xs font-bold text-slate-200 cursor-pointer min-h-[44px] sm:min-w-[150px]"
                          >
                            <option value="newest" className="bg-[#111115]">Newest Added</option>
                            <option value="oldest" className="bg-[#111115]">Oldest Added</option>
                            <option value="questions_desc" className="bg-[#111115]">Most Questions</option>
                            <option value="questions_asc" className="bg-[#111115]">Least Questions</option>
                            <option value="title_asc" className="bg-[#111115]">Alphabetical (A-Z)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quizzes Grid List */}
                    <div className="grid grid-cols-1 gap-4">
                      {filteredQuizzes.length === 0 ? (
                        <div className="bg-[#111114] border border-white/10 rounded-2xl p-12 text-center shadow-lg">
                          <FolderOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                          <h3 className="text-md font-bold text-white">No Quizzes Found</h3>
                          <p className="text-xs text-slate-400 mt-1">Upload a PDF or Word document to generate dynamic exams, or try resetting search filters.</p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setFilterSubject('All');
                            }}
                            className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg transition-all"
                          >
                            Reset Search Filters
                          </button>
                        </div>
                      ) : (
                        filteredQuizzes.map(quiz => {
                          const quizAttempts = attempts.filter(a => a.quizId === quiz.id && a.status === 'completed');
                          const highestScoreAttempt = quizAttempts.length > 0 ? quizAttempts.reduce((max, a) => (a.score / a.totalQuestions) > (max.score / max.totalQuestions) ? a : max, quizAttempts[0]) : null;
                          const latestAttempt = quizAttempts.length > 0 ? [...quizAttempts].sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime())[0] : null;

                          return (
                            <motion.div
                              key={quiz.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-[#111114] border border-white/10 hover:border-indigo-500 rounded-2xl p-6 shadow-lg hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all flex flex-col gap-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {quiz.subject && (
                                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">
                                        {quiz.subject}
                                      </span>
                                    )}
                                    {quiz.category && (
                                      <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[10px] font-bold uppercase rounded">
                                        {quiz.category}
                                      </span>
                                    )}
                                    {quiz.isPublished ? (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span>Published</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded">
                                        Draft Review
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="text-base font-bold text-white mt-2 hover:text-indigo-400 cursor-pointer" onClick={() => { setSelectedQuiz(quiz); startQuiz(quiz); }}>
                                    {quiz.title}
                                  </h3>
                                  {quiz.description && (
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description}</p>
                                  )}
                                </div>

                                <div className="text-right flex-shrink-0 font-bold">
                                  <span className="text-lg font-black text-indigo-400 block">{quiz.questions.length}</span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Questions</span>
                                </div>
                              </div>

                              {/* Dynamic Quiz Attempts and Score Panel */}
                              {quizAttempts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white/5 border border-white/5 rounded-xl p-4">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                    <div>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold leading-none">Best Score</span>
                                      <span className="text-xs font-black text-white mt-0.5 block">
                                        {highestScoreAttempt ? `${highestScoreAttempt.score}/${highestScoreAttempt.totalQuestions}` : '0/0'} 
                                        <span className="text-amber-400 text-[10px] font-bold ml-1">
                                          ({highestScoreAttempt ? Math.round((highestScoreAttempt.score / highestScoreAttempt.totalQuestions) * 100) : 0}%)
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2.5 sm:pt-0 sm:pl-4">
                                    <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                    <div>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold leading-none">Latest Score</span>
                                      <span className="text-xs font-black text-white mt-0.5 block">
                                        {latestAttempt ? `${latestAttempt.score}/${latestAttempt.totalQuestions}` : '0/0'}
                                        <span className="text-indigo-400 text-[10px] font-bold ml-1">
                                          ({latestAttempt ? Math.round((latestAttempt.score / latestAttempt.totalQuestions) * 100) : 0}%)
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2.5 sm:pt-0 sm:pl-4">
                                    <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                    <div>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold leading-none">Attempts</span>
                                      <span className="text-xs font-black text-white mt-0.5 block">{quizAttempts.length} Completed</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                                  <HelpCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                                  <span>No attempts completed yet. Click &ldquo;Take Quiz&rdquo; to test your skills!</span>
                                </div>
                              )}

                              <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Delete Quiz Access */}
                                  <button
                                    onClick={() => setQuizToDelete(quiz)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center cursor-pointer border border-transparent hover:border-red-500/20"
                                    title="Delete Quiz"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Edit Quiz Details Access */}
                                  <button
                                    onClick={() => handleOpenEditQuizModal(quiz)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all flex items-center justify-center cursor-pointer border border-transparent hover:border-indigo-500/20"
                                    title="Edit Quiz Details / Rename"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Question Manager / Admin Panel Access */}
                                  <button
                                    onClick={() => {
                                      setSelectedQuiz(quiz);
                                      setActiveMode('edit');
                                    }}
                                    className="px-3 py-1.5 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Settings2 className="w-3.5 h-3.5" />
                                    <span>Manage ({quiz.questions.length})</span>
                                  </button>

                                  {/* Take Quiz Access */}
                                  <button
                                    onClick={() => checkAndResumeQuiz(quiz)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Take Quiz</span>
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* MODE 3: ACTIVE INTERACTIVE QUIZ RUNNER */}
            {activeMode === 'take' && selectedQuiz && quizAttempt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#111114] border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                {/* Quiz Runner Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveMode('list')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold mr-2 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 border border-white/10 rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Quit</span>
                      </button>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">
                        {selectedQuiz.subject}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white truncate mt-1">{selectedQuiz.title}</h2>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {timeRemaining !== null && (
                      <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 px-3 py-1.5 rounded-lg">
                        <Clock className={cn("w-4 h-4", timeRemaining <= 60 ? "text-rose-400 animate-pulse" : "text-slate-400")} />
                        <span className={cn(
                          "text-sm font-bold font-mono tracking-wider", 
                          timeRemaining <= 60 ? "text-rose-400" : "text-slate-200"
                        )}>
                          {formatTimer(timeRemaining)}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex items-center gap-3", timeRemaining !== null && "border-l border-white/10 pl-4")}>
                      <span className="text-xs text-slate-400">Progress:</span>
                      <span className="text-sm font-extrabold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                        {Object.keys(userAnswers).length} / {activeQuestions.length} answered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quiz Runner Settings & Controls Row */}
                <div className="px-6 py-3 border-b border-white/5 bg-[#0e0e11] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showInstantFeedback}
                        onChange={(e) => setShowInstantFeedback(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      <span className="ms-3 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Show Correct Answer Immediately</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Question Cards Stack */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Results Overview or Question Box */}
                  {showResults ? (
                    <div className="flex flex-col gap-6 text-center py-6">
                      <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg animate-bounce">
                        <Award className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">Quiz Completed!</h3>
                        <p className="text-xs text-slate-400 mt-1">Excellent job reviewing this document reviewer material.</p>
                      </div>

                      {/* Score Badge */}
                      <div className="max-w-md mx-auto w-full p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col items-center">
                        <span className="text-sm text-indigo-300 font-bold block mb-2">FINAL SCORE</span>
                        <h4 className="text-4xl font-black text-white">
                          {quizAttempt.score} <span className="text-xl text-indigo-400 font-medium">/ {quizAttempt.totalQuestions}</span>
                        </h4>
                        <span className="text-xs text-indigo-400 font-bold block mt-2 uppercase tracking-wider">
                          {Math.round((quizAttempt.score / quizAttempt.totalQuestions) * 100)}% Accuracy
                        </span>
                        
                        <div className="flex items-center gap-4 mt-6 w-full pt-6 border-t border-indigo-500/20">
                          <div className="flex-1 text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Time Spent</span>
                            <span className="text-sm text-slate-200 font-bold font-mono">
                              {formatDuration(quizAttempt.startedAt, quizAttempt.completedAt)}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-indigo-500/20"></div>
                          <div className="flex-1 text-center">
                            <span className="text-[10px] text-emerald-400/80 font-bold uppercase block mb-1">Correct</span>
                            <span className="text-sm text-emerald-400 font-bold">
                              {quizAttempt.score}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-indigo-500/20"></div>
                          <div className="flex-1 text-center">
                            <span className="text-[10px] text-rose-400/80 font-bold uppercase block mb-1">Incorrect</span>
                            <span className="text-sm text-rose-400 font-bold">
                              {quizAttempt.totalQuestions - quizAttempt.score}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Question Review List */}
                      <div className="border-t border-white/10 pt-6 text-left flex flex-col gap-4">
                        <h4 className="text-sm font-bold text-slate-300">Answers Review Key</h4>
                        {activeQuestions.map((q, idx) => {
                          const userAns = userAnswers[q.id];
                          const isCorrect = checkSingleAnswerCorrectness(q, userAns);

                          return (
                            <div key={q.id} className="p-4 border border-white/5 rounded-2xl flex flex-col gap-2.5 bg-[#0E0E11]">
                              <div className="flex items-start justify-between gap-3">
                                <span className="px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-extrabold rounded">
                                  Q{idx + 1}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-bold uppercase rounded flex items-center gap-1 border",
                                  isCorrect ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                                )}>
                                  {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                                </span>
                              </div>

                              <div className="text-sm text-slate-200 font-semibold leading-relaxed">
                                <MathRenderer text={q.text} />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t border-white/5 pt-2.5 mt-1.5">
                                <div className="text-slate-500">
                                  Your answer: <span className={cn("font-bold", isCorrect ? "text-emerald-400" : "text-red-400")}><MathRenderer text={String(userAns || 'Not Answered')} /></span>
                                </div>
                                <div className="text-slate-500 md:text-right">
                                  Correct answer: <span className="text-emerald-400 font-bold"><MathRenderer text={String(q.correctAnswer || 'N/A')} /></span>
                                </div>
                              </div>

                              {(q.explanation || q.solution) && (
                                <div className="mt-4">
                                  <ExplanationVisualizer
                                    solution={q.solution || undefined}
                                    standardExplanation={q.explanation || ''}
                                    questionText={q.text}
                                    correctAnswerText={String(q.correctAnswer || '')}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-3 border-t border-white/10 pt-6">
                        <button
                          onClick={() => {
                            setActiveMode('list');
                            setSelectedQuiz(null);
                          }}
                          className="px-4 py-2 border border-white/10 rounded-lg hover:bg-white/10 text-xs font-bold transition-all text-slate-300 cursor-pointer"
                        >
                          Exit to Library
                        </button>
                        <button
                          onClick={() => startQuiz(selectedQuiz)}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Retake Quiz</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Quiz Active Mode Question View
                    <div className="flex flex-col gap-6">
                      {/* Grid Progress Indicators with Spacious Touch Sizes */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pb-4 border-b border-white/[0.06]">
                        {activeQuestions.map((q, idx) => {
                          const isCurrent = activeQuestionIndex === idx;
                          const isChecked = showInstantFeedback && checkedQuestions[q.id];
                          const isRight = isChecked && checkSingleAnswerCorrectness(q, userAnswers[q.id]);
                          const hasAnswer = userAnswers[q.id] !== undefined;

                          return (
                            <button
                              key={q.id}
                              onClick={() => setActiveQuestionIndex(idx)}
                              className={cn(
                                "w-11 h-11 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all border cursor-pointer",
                                isCurrent
                                  ? isChecked
                                    ? isRight
                                      ? "bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-500/30"
                                      : "bg-red-600 border-red-600 text-white ring-2 ring-red-500/30"
                                    : "bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-500/30"
                                  : isChecked
                                    ? isRight
                                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                      : "bg-red-500/10 border-red-500/20 text-red-400"
                                    : hasAnswer
                                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                              )}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Display Question Box */}
                      {(() => {
                        const q = activeQuestions[activeQuestionIndex];
                        if (!q) return null;

                        return (
                          <div className="flex flex-col gap-5">
                            {/* Meta row */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                              <span>Question {activeQuestionIndex + 1} of {activeQuestions.length}</span>
                              <div className="flex items-center gap-2">
                                {q.difficulty && (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] border",
                                    q.difficulty === 'easy' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                    q.difficulty === 'medium' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                                    q.difficulty === 'hard' && "bg-red-500/10 border-red-500/20 text-red-400"
                                  )}>
                                    {q.difficulty}
                                  </span>
                                )}
                                {q.pageNumber && (
                                  <span>Page {q.pageNumber}</span>
                                )}
                              </div>
                            </div>

                            {/* Text and image */}
                            <div className="flex flex-col gap-4">
                              <div className="text-base font-bold text-white leading-relaxed">
                                <MathRenderer text={q.text} />
                              </div>
                              
                              {/* Inline base64 image representation if associated */}
                              {q.image && (
                                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 max-h-96 flex items-center justify-center relative shadow-inner p-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={q.image}
                                    alt={`Question ${q.number} visual context`}
                                    className="max-h-80 object-contain rounded-lg"
                                  />
                                </div>
                              )}
                            </div>

                             {/* Render answer inputs based on question format */}
                             <div className="pt-2">
                               {/* MCQ Options */}
                               {q.type === QuestionType.MCQ && q.choices && (
                                 <div className="grid grid-cols-1 gap-3">
                                   {q.choices.map((choice, cidx) => {
                                     const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                     const optionChar = choice.trim().charAt(0).toUpperCase();
                                     const isSelected = userAnswers[q.id] === choice || userAnswers[q.id] === optionChar;
                                     const isChoiceRight = isChoiceCorrect(q, choice);
 
                                     return (
                                       <button
                                         key={cidx}
                                         disabled={isChecked}
                                         onClick={() => handleAnswerSelect(q.id, choice)}
                                         className={cn(
                                           "w-full text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-start gap-3",
                                           isChecked
                                             ? isSelected
                                               ? isChoiceRight
                                                 ? "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                                                 : "bg-red-500/15 border-red-500 text-red-200"
                                               : isChoiceRight
                                                 ? "bg-emerald-500/5 border-emerald-500/40 text-emerald-300"
                                                 : "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"
                                             : isSelected
                                               ? "bg-indigo-500/10 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30 cursor-pointer"
                                               : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-slate-300 cursor-pointer"
                                         )}
                                       >
                                         <div className={cn(
                                           "w-5 h-5 rounded-full border flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5",
                                           isChecked
                                             ? isSelected
                                               ? isChoiceRight
                                                 ? "bg-emerald-600 border-emerald-600 text-white"
                                                 : "bg-red-600 border-red-600 text-white"
                                               : isChoiceRight
                                                 ? "bg-emerald-600 border-emerald-600 text-white"
                                                 : "border-white/10 text-slate-500"
                                             : isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-white/10 text-slate-500"
                                         )}>
                                           {isChecked && isSelected ? (
                                             isChoiceRight ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />
                                           ) : isChecked && isChoiceRight ? (
                                             <Check className="w-3 h-3" />
                                           ) : (
                                             String.fromCharCode(65 + cidx)
                                           )}
                                         </div>
                                         <span><MathRenderer text={choice} /></span>
                                       </button>
                                     );
                                   })}
                                 </div>
                               )}
 
                               {/* True / False Options */}
                               {q.type === QuestionType.TRUE_FALSE && (
                                 <div className="grid grid-cols-2 gap-4 max-w-sm">
                                   {['True', 'False'].map(val => {
                                     const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                     const isSelected = String(userAnswers[q.id]).toLowerCase() === val.toLowerCase();
                                     const isTrueFalseCorrect = String(q.correctAnswer).toLowerCase() === val.toLowerCase();
 
                                     return (
                                       <button
                                         key={val}
                                         disabled={isChecked}
                                         onClick={() => handleAnswerSelect(q.id, val)}
                                         className={cn(
                                           "p-4 rounded-xl border text-center font-bold text-sm transition-all",
                                           isChecked
                                             ? isSelected
                                               ? isTrueFalseCorrect
                                                 ? "bg-emerald-500/15 border-emerald-500 text-emerald-200"
                                                 : "bg-red-500/15 border-red-500 text-red-200"
                                               : isTrueFalseCorrect
                                                 ? "bg-emerald-500/5 border-emerald-500/40 text-emerald-300"
                                                 : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                                             : isSelected
                                               ? "bg-indigo-500/10 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/30 cursor-pointer"
                                               : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300 cursor-pointer"
                                         )}
                                       >
                                         {val}
                                       </button>
                                     );
                                   })}
                                 </div>
                               )}
 
                               {/* Fill in the Blank / Identification / Direct Input */}
                               {(q.type === QuestionType.IDENTIFICATION || q.type === QuestionType.FILL_IN_BLANK || q.type === QuestionType.ENUMERATION || q.type === QuestionType.ESSAY) && (() => {
                                 const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                 const isRight = checkSingleAnswerCorrectness(q, userAnswers[q.id]);
                                 return (
                                   <div className="flex flex-col gap-2">
                                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type your answer below:</label>
                                     <input
                                       type="text"
                                       disabled={isChecked}
                                       placeholder={q.type === QuestionType.ESSAY ? "Write a short summary essay..." : "Answer here..."}
                                       value={userAnswers[q.id] || ''}
                                       onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                                       className={cn(
                                         "w-full p-3 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl bg-[#0E0E11] text-slate-100 text-sm placeholder-slate-600 transition-all",
                                         isChecked
                                           ? isRight
                                             ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-200"
                                             : "border-red-500/50 bg-red-500/5 text-red-200"
                                           : "border-white/10"
                                       )}
                                     />
 
                                     {isChecked && (
                                       <div className={cn(
                                         "p-3 rounded-xl border text-xs font-semibold flex items-start gap-2.5 mt-2",
                                         isRight
                                           ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                           : "bg-red-500/10 border-red-500/20 text-red-400"
                                       )}>
                                         {isRight ? (
                                           <>
                                             <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                             <div>
                                               <p className="font-bold text-emerald-300 text-sm">Correct Answer!</p>
                                               <p className="text-[11px] text-emerald-400/80 mt-0.5">Your answer matched the key perfectly.</p>
                                             </div>
                                           </>
                                         ) : (
                                           <>
                                             <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                             <div>
                                               <p className="font-bold text-red-300 text-sm">Incorrect</p>
                                               <p className="text-[11px] text-slate-400 mt-1">
                                                 Correct answer: <span className="text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded inline-block align-middle"><MathRenderer text={String(q.correctAnswer)} /></span>
                                               </p>
                                             </div>
                                           </>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                 );
                               })()}
 
                               {/* Matching Type Options */}
                               {q.type === QuestionType.MATCHING && q.matchingPairs && (
                                 <div className="flex flex-col gap-4 border border-white/10 rounded-2xl p-4 bg-[#0E0E11]">
                                   <p className="text-xs text-slate-400 font-bold mb-1">Select the correct matching for each item:</p>
                                   {q.matchingPairs.map((pair, pidx) => {
                                     const userMapping = userAnswers[q.id] as Record<string, string> || {};
                                     const currentSelection = userMapping[pair.left] || '';
                                     const isRowChecked = showInstantFeedback && checkedQuestions[q.id];
                                     const isRowCorrect = currentSelection === pair.right;
 
                                     return (
                                       <div key={pidx} className={cn(
                                         "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm p-3 border rounded-xl transition-all",
                                         isRowChecked
                                           ? isRowCorrect
                                             ? "bg-emerald-500/10 border-emerald-500/20"
                                             : "bg-red-500/10 border-red-500/20"
                                           : "bg-white/5 border-white/5"
                                       )}>
                                         <div className="flex items-center gap-2">
                                           {isRowChecked && (
                                             isRowCorrect ? (
                                               <Check className="w-4 h-4 text-emerald-400" />
                                             ) : (
                                               <X className="w-4 h-4 text-red-400" />
                                             )
                                           )}
                                           <span className="font-semibold text-slate-200"><MathRenderer text={pair.left} /></span>
                                         </div>
 
                                         <div className="flex items-center gap-2">
                                           <select
                                             disabled={isRowChecked}
                                             value={currentSelection}
                                             onChange={(e) => {
                                               const updatedMapping = { ...userMapping, [pair.left]: e.target.value };
                                               handleAnswerSelect(q.id, updatedMapping);
                                             }}
                                             className={cn(
                                               "p-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[#111114] text-xs max-w-xs text-slate-200",
                                               isRowChecked ? "opacity-60 cursor-not-allowed border-white/5" : "border-white/10"
                                             )}
                                           >
                                             <option value="" className="bg-[#111114]">-- Match with --</option>
                                             {q.matchingPairs?.map(x => x.right).sort().map(rightVal => (
                                               <option key={rightVal} value={rightVal} className="bg-[#111114]">{rightVal}</option>
                                             ))}
                                           </select>
 
                                           {isRowChecked && !isRowCorrect && (
                                             <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                                               Correct: <MathRenderer text={pair.right} />
                                             </span>
                                           )}
                                         </div>
                                       </div>
                                     );
                                   })}
                                 </div>
                               )}
 
                               {/* Manual Check Answer Trigger Button (for non MCQ/True-False questions under instant feedback) */}
                               {(() => {
                                 const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                 const needsManualCheck = q.type !== QuestionType.MCQ && q.type !== QuestionType.TRUE_FALSE;
                                 const isAnswered = userAnswers[q.id] !== undefined && (
                                   q.type === QuestionType.MATCHING 
                                     ? Object.keys(userAnswers[q.id] || {}).length > 0 
                                     : String(userAnswers[q.id] || '').trim() !== ''
                                 );
 
                                 if (showInstantFeedback && !isChecked && needsManualCheck) {
                                   return (
                                     <div className="mt-4 flex justify-end">
                                       <button
                                         type="button"
                                         disabled={!isAnswered}
                                         onClick={() => {
                                           setCheckedQuestions(prev => ({
                                             ...prev,
                                             [q.id]: true
                                           }));
                                         }}
                                         className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                                       >
                                         <UserCheck className="w-4 h-4" />
                                         <span>Check Answer</span>
                                       </button>
                                     </div>
                                   );
                                 }
                                 return null;
                               })()}
 
                               {/* Explanation & Whiteboard Solution for Instant Review */}
                               {(() => {
                                 const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                 if (isChecked && (q.explanation || q.solution)) {
                                   return (
                                     <motion.div
                                       initial={{ opacity: 0, y: 5 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="mt-6"
                                     >
                                       <ExplanationVisualizer
                                         solution={q.solution || undefined}
                                         standardExplanation={q.explanation || ''}
                                         questionText={q.text}
                                         correctAnswerText={String(q.correctAnswer || '')}
                                       />
                                     </motion.div>
                                   );
                                 }
                                 return null;
                               })()}
                             </div>

                            {/* Footer Navigation */}
                            <div className="border-t border-white/10 pt-6 flex items-center justify-between">
                              <button
                                disabled={activeQuestionIndex === 0}
                                onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                                className="flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-300 cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                              </button>

                              <button
                                onClick={submitQuizAnswers}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-50 text-white text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer"
                              >
                                Submit & Grade Exam
                              </button>

                              <button
                                disabled={activeQuestionIndex === activeQuestions.length - 1}
                                onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                                className="flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-300 cursor-pointer"
                              >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODE 4: ADMIN QUESTION MANAGER */}
            {activeMode === 'edit' && selectedQuiz && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#111114] border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                {/* Admin Header */}
                <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveMode('list');
                        }}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold mr-2 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 border border-white/10 rounded-xl transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Library</span>
                      </button>
                      <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">
                        Admin Review Workspace
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <h2 className="text-base font-bold text-white">{selectedQuiz.title}</h2>
                      <button
                        onClick={() => handleOpenEditQuizModal(selectedQuiz)}
                        className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all flex items-center justify-center cursor-pointer border border-transparent"
                        title="Edit Quiz Details / Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowAddQuestionModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-lg transition-all border border-white/10 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                    <button
                      onClick={() => handlePublishQuiz(selectedQuiz.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer",
                        selectedQuiz.isPublished 
                          ? "bg-amber-600 hover:bg-amber-500" 
                          : "bg-indigo-600 hover:bg-indigo-500"
                      )}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedQuiz.isPublished ? 'Unpublish Quiz' : 'Publish Quiz'}</span>
                    </button>
                  </div>
                </div>

                {/* Questions Review List */}
                <div className="p-6 flex flex-col gap-4">
                  <p className="text-xs text-slate-400 font-medium">Verify each extracted question, choices, answers, and pages before publishing. Reorder or edit gaps easily below.</p>

                  <div className="flex flex-col gap-4">
                    {selectedQuiz.questions.map((q, idx) => (
                      <div 
                        key={q.id}
                        className={cn(
                          "p-5 border rounded-2xl transition-all flex flex-col gap-3",
                          editingQuestion?.id === q.id 
                            ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500" 
                            : "border-white/5 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {/* Meta Line */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-[10px] font-extrabold rounded">
                              Q{q.number || idx + 1}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase rounded">
                              {q.type}
                            </span>
                            {q.category && (
                              <span className="text-[10px] text-slate-500 font-bold">({q.category})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleReorderQuestion(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 rounded hover:bg-white/5 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronLeft className="w-4 h-4 rotate-90" />
                            </button>
                            <button
                              onClick={() => handleReorderQuestion(idx, 'down')}
                              disabled={idx === selectedQuiz.questions.length - 1}
                              className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 rounded hover:bg-white/5 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronRight className="w-4 h-4 rotate-90" />
                            </button>
                            <button
                              onClick={() => setEditingQuestion(editingQuestion?.id === q.id ? null : q)}
                              className="p-1 text-indigo-400 hover:bg-white/10 rounded cursor-pointer"
                              title="Edit Question"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-red-400 hover:bg-white/10 rounded cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Text and Image Display */}
                        <div className="flex flex-col gap-3">
                          <div className="text-sm text-slate-200 font-bold leading-relaxed">
                            <MathRenderer text={q.text} />
                          </div>
                          
                          {q.image && (
                            <div className="p-1.5 border border-white/10 rounded-xl max-w-xs bg-white/5 flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={q.image} alt="Ref visual" className="max-h-36 object-contain rounded" />
                            </div>
                          )}
                        </div>

                        {/* Inline Expandable Question Form */}
                        {editingQuestion?.id === q.id ? (
                          <div className="mt-2 border-t border-white/10 pt-4 flex flex-col gap-4 bg-[#0E0E11] p-4 rounded-xl shadow-inner">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wide">Edit Details</h4>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Question Text</label>
                              <textarea
                                value={editingQuestion.text || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                                className="p-2 border border-white/10 rounded text-xs bg-[#111114] text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Format</label>
                                <select
                                  value={editingQuestion.type || ''}
                                  onChange={(e: any) => setEditingQuestion({ ...editingQuestion, type: e.target.value })}
                                  className="p-1.5 border border-white/10 rounded bg-[#111114] text-slate-200 text-xs focus:outline-none"
                                >
                                  {Object.values(QuestionType).map(t => (
                                    <option key={t} value={t} className="bg-[#111114]">{t}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Correct Answer Value</label>
                                <input
                                  type="text"
                                  value={editingQuestion.correctAnswer as string || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                                  className="p-1.5 border border-white/10 rounded bg-[#111114] text-slate-100 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Choices Configuration (MCQ only) */}
                            {editingQuestion.type === QuestionType.MCQ && (
                              <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Multiple Choice Options (One per line)</label>
                                <textarea
                                  placeholder="A. First option&#10;B. Second option&#10;C. Third option"
                                  value={editingQuestion.choices?.join('\n') || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, choices: e.target.value.split('\n').filter(Boolean) })}
                                  className="p-2 border border-white/10 rounded text-xs bg-[#111114] text-slate-100"
                                  rows={3}
                                />
                              </div>
                            )}

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Explanation / Reference</label>
                              <input
                                type="text"
                                value={editingQuestion.explanation || ''}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                                className="p-1.5 border border-white/10 rounded text-xs bg-[#111114] text-slate-100"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                              <button
                                onClick={() => setEditingQuestion(null)}
                                className="px-3 py-1 text-xs border border-white/10 rounded hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveQuestion(editingQuestion as Question)}
                                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-1 shadow-md cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Quick Read-Only Answer Info
                          <div className="text-xs text-slate-400 border-t border-white/5 pt-3 flex flex-col gap-2 bg-[#0E0E11] p-3 rounded-xl mt-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p>Correct answer: <strong className="text-indigo-400">{String(q.correctAnswer || 'N/A')}</strong></p>
                              <div className="flex items-center gap-2">
                                {(q.solution || q.explanation) && (
                                  <button
                                    onClick={() => setPreviewingSolutionId(previewingSolutionId === q.id ? null : q.id)}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                    <span>{previewingSolutionId === q.id ? 'Hide Whiteboard' : 'View Whiteboard Solution'}</span>
                                  </button>
                                )}
                                {q.difficulty && <span className="uppercase font-bold text-[10px] text-slate-500">Difficulty: {q.difficulty}</span>}
                              </div>
                            </div>
                            {q.choices && q.choices.length > 0 && (
                              <p className="line-clamp-1 mt-0.5 text-slate-400">Choices: {q.choices.join(' | ')}</p>
                            )}
                            {previewingSolutionId === q.id && (q.solution || q.explanation) && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <ExplanationVisualizer
                                  solution={q.solution || undefined}
                                  standardExplanation={q.explanation || ''}
                                  questionText={q.text}
                                  correctAnswerText={String(q.correctAnswer || '')}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODE 5: SCORE HISTORY & PERFORMANCE DASHBOARD */}
            {activeMode === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8"
              >
                {selectedAttemptId ? (
                  /* SUB-VIEW: ATTEMPT ANSWER REVIEW DETAIL DRILLDOWN */
                  (() => {
                    const attempt = attempts.find(a => a.id === selectedAttemptId);
                    if (!attempt) return null;
                    const qz = quizzes.find(q => q.id === attempt.quizId);
                    const qzDetails = getAttemptQuizDetails(attempt); // fallback if missing
                    const qzQuestions = attempt.activeQuestions || qz?.questions || [];
                    const pct = qzQuestions.length > 0 ? Math.round((attempt.score / qzQuestions.length) * 100) : 0;
                    
                    return (
                      <div className="bg-[#111114] border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        {/* Header details */}
                        <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <button
                              onClick={() => setSelectedAttemptId(null)}
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold mb-2 uppercase tracking-wide cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back to History Overview</span>
                            </button>
                            <h2 className="text-xl font-extrabold text-white truncate">{qz?.title || "Archived Quiz Attempt"}</h2>
                            <p className="text-xs text-slate-400">
                              Subject: <span className="text-indigo-300 font-bold">{qz?.subject || "General"}</span> • Category: <span className="text-slate-200">{qz?.category || "Extracted Exam"}</span>
                            </p>
                          </div>
                          
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center p-3.5 bg-[#0A0A0B]/65 border border-white/10 rounded-xl flex-shrink-0 gap-1 min-w-[160px]">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-extrabold uppercase">Final Score</p>
                              <p className="text-2xl font-black text-white">{attempt.score} <span className="text-slate-400 text-sm font-normal">/ {qzQuestions.length || attempt.totalQuestions}</span></p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                              pct >= 90 && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                              pct >= 75 && pct < 90 && "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
                              pct < 75 && "bg-amber-500/10 text-amber-400 border-amber-500/25"
                            )}>
                              {pct}% Accuracy
                            </span>
                          </div>
                        </div>

                        {/* Summary breakdown bar */}
                        <div className="p-6 bg-[#0E0E11] border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Time Spent</p>
                              <p className="text-slate-200 font-bold">{formatDuration(attempt.startedAt, attempt.completedAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Completed At</p>
                              <p className="text-slate-200 font-bold">{formatDateTime(attempt.completedAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Correct Answers</p>
                              <p className="text-emerald-400 font-bold">{attempt.score}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2.5 bg-white/5 border border-white/5 rounded-xl">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <div>
                              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Incorrect Answers</p>
                              <p className="text-red-400 font-bold">{(qzQuestions.length || attempt.totalQuestions) - attempt.score}</p>
                            </div>
                          </div>
                        </div>

                        {/* List of questions with feedback */}
                        <div className="p-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
                          {qzQuestions.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                              <HelpCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                              <p className="text-sm font-semibold">Quiz Details Stored, but Question Text Unavailable</p>
                              <p className="text-xs text-slate-600 mt-1">This quiz has been deleted from your library, but you answered {attempt.score} out of {attempt.totalQuestions} questions correctly.</p>
                            </div>
                          ) : (
                            qzQuestions.map((q, qidx) => {
                              const userAns = attempt.answers[q.id];
                              const isCorrect = checkSingleAnswerCorrectness(q, userAns);

                              return (
                                <div key={q.id} className="p-5 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col gap-4">
                                  {/* Header info */}
                                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Question {qidx + 1} • {q.type}</span>
                                    <span className={cn(
                                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border",
                                      isCorrect
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                      {isCorrect ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Correct</span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3" />
                                          <span>Incorrect</span>
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  {/* Text */}
                                  <div className="text-sm md:text-base text-slate-100 font-semibold leading-relaxed">
                                    <MathRenderer text={q.text} />
                                  </div>

                                  {/* Choices (for MCQ) */}
                                  {q.type === QuestionType.MCQ && q.choices && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                                      {q.choices.map((choice, cidx) => {
                                        const isSelected = String(userAns || '').trim().toLowerCase() === choice.trim().toLowerCase() ||
                                                          (getChoiceLetter(choice) && String(userAns || '').trim().toUpperCase() === getChoiceLetter(choice));
                                        const isChoiceRight = isChoiceCorrect(q, choice);
                                        
                                        return (
                                          <div
                                            key={cidx}
                                            className={cn(
                                              "p-3 border rounded-xl flex items-center gap-3 text-xs leading-relaxed transition-all",
                                              isChoiceRight
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold"
                                                : isSelected
                                                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                                                  : "bg-white/5 border-white/5 text-slate-400"
                                            )}
                                          >
                                            <div className={cn(
                                              "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black flex-shrink-0",
                                              isChoiceRight
                                                ? "bg-emerald-600 border-emerald-600 text-white"
                                                : isSelected
                                                  ? "bg-red-600 border-red-600 text-white"
                                                  : "border-white/10 text-slate-500"
                                            )}>
                                              {isChoiceRight ? <Check className="w-3 h-3" /> : isSelected ? <X className="w-3 h-3" /> : String.fromCharCode(65 + cidx)}
                                            </div>
                                            <span><MathRenderer text={choice} /></span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Matching pairs details */}
                                  {q.type === QuestionType.MATCHING && q.matchingPairs && (
                                    <div className="flex flex-col gap-2 mt-1">
                                      {q.matchingPairs.map((pair, pidx) => {
                                        const userMap = userAns as Record<string, string> || {};
                                        const userMatch = userMap[pair.left] || 'No Selection';
                                        const matchCorrect = userMatch === pair.right;
                                        return (
                                          <div key={pidx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-2.5 bg-[#111114] border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-300">{pair.left}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span>Mapped to: <strong className={matchCorrect ? "text-emerald-400" : "text-red-400"}>{userMatch}</strong></span>
                                              {!matchCorrect && <span className="text-xs text-emerald-500 font-semibold">(Correct: {pair.right})</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Direct Answers summary */}
                                  {q.type !== QuestionType.MCQ && q.type !== QuestionType.MATCHING && (
                                    <div className="flex flex-col gap-2 p-3 border border-white/5 bg-[#111114] rounded-xl text-xs">
                                      <p className="flex items-center gap-2">
                                        <span className="text-slate-500 font-semibold">Your Answer:</span>
                                        <strong className={isCorrect ? "text-emerald-400" : "text-red-400"}>
                                          {String(userAns || 'No Answer provided')}
                                        </strong>
                                      </p>
                                      {!isCorrect && (
                                        <p className="flex items-center gap-2 border-t border-white/5 pt-2 mt-1">
                                          <span className="text-slate-500 font-semibold">Correct Answer:</span>
                                          <strong className="text-emerald-400">{String(q.correctAnswer || 'N/A')}</strong>
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Whiteboard & Detailed Solution */}
                                  {(q.explanation || q.solution) && (
                                    <div className="mt-3">
                                      <ExplanationVisualizer
                                        solution={q.solution || undefined}
                                        standardExplanation={q.explanation || ''}
                                        questionText={q.text}
                                        correctAnswerText={String(q.correctAnswer || '')}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Back bar */}
                        <div className="p-6 border-t border-white/10 bg-[#111114] flex items-center justify-between">
                          <button
                            onClick={() => setSelectedAttemptId(null)}
                            className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold text-sm transition-all cursor-pointer"
                          >
                            Close Details
                          </button>
                          
                          {qz && (
                            <button
                              onClick={() => startQuiz(qz)}
                              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Retake Quiz</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* MAIN DASHBOARD: CHARTS, STATS, LIST OF ATTEMPTS */
                  <>
                    {/* Welcome Streak card */}
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "p-4 rounded-2xl flex-shrink-0 flex items-center justify-center border",
                          studyStreak > 0
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-white/5 text-slate-400 border-white/10"
                        )}>
                          <Flame className={cn("w-8 h-8", studyStreak > 0 && "animate-pulse")} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <span>Study Streak: {studyStreak} Day{studyStreak === 1 ? '' : 's'}</span>
                            {studyStreak > 0 && <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full text-[10px] font-black uppercase animate-pulse">Active 🔥</span>}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-md">
                            {studyStreak > 0
                              ? "Excellent dedication! Practicing daily strengthens recall speed and cements professional engineering and NSCP formulas."
                              : "Practice makes perfect. Complete a quiz attempt today to build a consecutive study streak!"}
                          </p>
                        </div>
                      </div>

                      {/* Coach advice box */}
                      <div className="w-full md:w-auto p-4 bg-indigo-950/25 border border-indigo-500/20 rounded-2xl text-xs max-w-sm flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-indigo-300 uppercase tracking-wider text-[10px]">AI Study Coach Advice</p>
                          <p className="text-slate-300 mt-1 leading-relaxed font-medium">
                            {attempts.length === 0 && "No quiz completions detected. Jump into the 'Quiz Library' and run the civil engineering board exam compiler to test your initial knowledge!"}
                            {attempts.length > 0 && analyticsSummary.averagePercent >= 90 && "Outstanding master accuracy! Focus on speed limits or merge all topics together into a customized final mega-board review exam."}
                            {attempts.length > 0 && analyticsSummary.averagePercent >= 70 && analyticsSummary.averagePercent < 90 && "Great foundation! Leverage the 'Explanation & Context' sheets after attempts to review formulas on concrete covers or beam shears."}
                            {attempts.length > 0 && analyticsSummary.averagePercent < 70 && "Keep working on core concepts. Try turning on 'Instant Feedback' mode in the quiz screen to learn and correct as you go."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-md hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Highest Score</span>
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-black text-white">{attempts.length > 0 ? `${analyticsSummary.highestPercent}%` : '0%'}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Best Accuracy Run</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-md hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avg Accuracy</span>
                          <Activity className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-black text-white">{attempts.length > 0 ? `${analyticsSummary.averagePercent}%` : '0%'}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Weighted Mean</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-md hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Study Streak</span>
                          <Flame className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-black text-white">{studyStreak} Day{studyStreak === 1 ? '' : 's'}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Consecutive Days</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-md hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Runs</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-black text-white">{attempts.length} run{attempts.length === 1 ? '' : 's'}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Quiz Submissions</p>
                        </div>
                      </div>
                    </div>

                    {/* Analytics charts panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Score Trend (Line Chart) */}
                      <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            <span>Progress Trend Over Time</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">Tracking your score accuracy percentage chronologically</p>
                        </div>
                        
                        <div className="h-60 w-full mt-2">
                          {chartData.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-[#0E0E11]/40 p-4 text-center">
                              <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                              <p className="font-semibold">No history trends to display</p>
                              <p className="text-[10px] text-slate-600 mt-0.5">Complete quizzes to populate progress graphs.</p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                                  labelClassName="font-extrabold text-white"
                                />
                                <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPct)" name="Accuracy (%)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Correct vs Incorrect Distribution (Bar Chart) */}
                      <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            <span>Correct vs Incorrect Answers</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">Comparing correct/incorrect answer counts per submission</p>
                        </div>
                        
                        <div className="h-60 w-full mt-2">
                          {chartData.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 border border-dashed border-white/5 rounded-xl bg-[#0E0E11]/40 p-4 text-center">
                              <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
                              <p className="font-semibold">No accuracy distribution to show</p>
                              <p className="text-[10px] text-slate-600 mt-0.5">Submit answers to visualize answer ratios.</p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                                  labelClassName="font-extrabold text-white"
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Bar dataKey="correct" fill="#10b981" name="Correct" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject mastery progress bars */}
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span>Subject Mastery Breakdown</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">Average score accuracy grouped by extracted subject fields</p>
                      </div>

                      {attempts.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">No subject mastery data yet. Take quizzes across different topics to unlock analytics.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {(() => {
                            // Compute average per subject
                            const subStats: Record<string, { totalScore: number; totalQs: number; runs: number }> = {};
                            attempts.forEach(a => {
                              const d = getAttemptQuizDetails(a);
                              if (!subStats[d.subject]) {
                                subStats[d.subject] = { totalScore: 0, totalQs: 0, runs: 0 };
                              }
                              subStats[d.subject].totalScore += a.score;
                              subStats[d.subject].totalQs += a.totalQuestions;
                              subStats[d.subject].runs += 1;
                            });

                            return Object.entries(subStats).map(([subject, stats]) => {
                              const pct = Math.round((stats.totalScore / stats.totalQs) * 100);
                              return (
                                <div key={subject} className="p-4 bg-[#0E0E11] border border-white/5 rounded-xl flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-200 truncate pr-2 max-w-[200px]">{subject}</span>
                                    <span className="text-indigo-400">{pct}% Mastery <span className="text-slate-500 font-normal">({stats.runs} attempt{stats.runs > 1 ? 's' : ''})</span></span>
                                  </div>
                                  <div className="w-full bg-white/5 border border-white/5 h-2 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        pct >= 90 && "bg-emerald-500",
                                        pct >= 75 && pct < 90 && "bg-indigo-500",
                                        pct < 75 && "bg-amber-500"
                                      )}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Achievement badges showcase */}
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-400" />
                          <span>Milestone Achievement Badges</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1">Gamified challenge milestones designed to motivate continuous learning</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-2">
                        {unlockedBadges.map(badge => {
                          const IconComp = badge.icon;
                          return (
                            <div
                              key={badge.id}
                              className={cn(
                                "p-4 border rounded-xl flex flex-col items-center justify-center text-center gap-2.5 transition-all shadow-md relative",
                                badge.unlocked
                                  ? "bg-[#0E0E11] border-indigo-500/30"
                                  : "bg-[#0E0E11]/40 border-white/5 opacity-40 hover:opacity-60"
                              )}
                            >
                              <div className={cn(
                                "p-2.5 rounded-full border",
                                badge.unlocked ? badge.color : "text-slate-600 bg-white/5 border-white/5"
                              )}>
                                <IconComp className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-100 truncate max-w-[100px]">{badge.name}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{badge.description}</p>
                              </div>
                              
                              {badge.unlocked ? (
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                              ) : (
                                <span className="absolute top-1 right-2 text-[9px] text-slate-600 font-extrabold uppercase">Locked</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Score History Grid/List with Filter Controls */}
                    <div className="bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <History className="w-4 h-4 text-indigo-400" />
                            <span>Detailed Quiz Submissions History</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">Review, filter, and drill down into all past quiz results</p>
                        </div>
                        
                        {attempts.length > 0 && (
                          <button
                            onClick={() => setShowClearHistoryConfirm(true)}
                            className="px-3 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer"
                          >
                            Reset History
                          </button>
                        )}
                      </div>

                      {/* FILTER MODULE */}
                      <div className="p-4 bg-[#0E0E11] border border-white/5 rounded-2xl flex flex-col gap-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <Filter className="w-3 h-3 text-indigo-400" />
                          <span>Search & Filter Scoreboard</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Filter Subject</label>
                            <select
                              value={historyFilterSubject}
                              onChange={(e) => setHistoryFilterSubject(e.target.value)}
                              className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-300 text-xs focus:outline-none"
                            >
                              <option value="All">All Subjects</option>
                              {uniqueSubjectsInHistory.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Filter Quiz Title</label>
                            <select
                              value={historyFilterQuiz}
                              onChange={(e) => setHistoryFilterQuiz(e.target.value)}
                              className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-300 text-xs focus:outline-none"
                            >
                              <option value="All">All Quizzes</option>
                              {uniqueQuizzesInHistory.map(qz => (
                                <option key={qz.id} value={qz.id}>{qz.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Sort Scoreboard</label>
                            <select
                              value={historySortBy}
                              onChange={(e: any) => setHistorySortBy(e.target.value)}
                              className="p-2 border border-white/10 rounded-lg bg-[#111114] text-slate-300 text-xs focus:outline-none"
                            >
                              <option value="date_newest">Date: Newest First</option>
                              <option value="date_oldest">Date: Oldest First</option>
                              <option value="score_highest">Score: Highest Percentage</option>
                              <option value="score_lowest">Score: Lowest Percentage</option>
                              <option value="time_spent">Time Spent: Fastest First</option>
                            </select>
                          </div>
                        </div>

                        {(historyFilterSubject !== 'All' || historyFilterQuiz !== 'All') && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => {
                                setHistoryFilterSubject('All');
                                setHistoryFilterQuiz('All');
                              }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Clear Filter Overrides
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ATTEMPTS CARDS LIST */}
                      <div className="flex flex-col gap-3">
                        {filteredAndSortedAttempts.length === 0 ? (
                          <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-2xl bg-[#0E0E11]/40">
                            <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                            <p className="text-sm font-semibold">No quiz attempts match your filter</p>
                            <p className="text-xs text-slate-600 mt-1">Try resetting the dropdown filters or solve a quiz from the library.</p>
                          </div>
                        ) : (
                          filteredAndSortedAttempts.map((att, attidx) => {
                            const details = getAttemptQuizDetails(att);
                            const pct = att.totalQuestions > 0 ? Math.round((att.score / att.totalQuestions) * 100) : 0;
                            const trend = getAttemptTrendComparison(att, attidx, attempts);
                            
                            return (
                              <div
                                key={att.id}
                                className="p-4 bg-[#0E0E11] border border-white/5 hover:border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                              >
                                <div className="min-w-0 flex-grow flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase rounded-md border border-indigo-500/20">
                                      {details.subject}
                                    </span>
                                    {att.scheduledQuizId && (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-md border border-emerald-500/20 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-emerald-400" />
                                        <span>Scheduled Exam</span>
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>{formatDateTime(att.completedAt)}</span>
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-extrabold text-white truncate max-w-lg">{details.title}</h5>
                                  <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Correct: <strong className="text-slate-200">{att.score} / {att.totalQuestions}</strong></span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Time Spent: <strong className="text-slate-200">{formatDuration(att.startedAt, att.completedAt)}</strong></span>
                                    </span>
                                    
                                    {/* Trend compare bubble */}
                                    {trend.text !== 'First Attempt' && (
                                      <span className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                        trend.isBetter === true
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                          : trend.isBetter === false
                                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                            : "bg-white/5 text-slate-400 border border-white/5"
                                      )}>
                                        {trend.isBetter === true ? <TrendingUp className="w-3 h-3" /> : trend.isBetter === false ? <TrendingDown className="w-3 h-3" /> : null}
                                        <span>{trend.text}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
                                  <div className="text-left sm:text-right">
                                    <p className="text-xl font-black text-white">{pct}%</p>
                                    <p className="text-[9px] text-slate-500 font-extrabold uppercase">Accuracy</p>
                                  </div>
                                  
                                  <button
                                    onClick={() => setSelectedAttemptId(att.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Review Answers</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Quiz Setup Modal */}
      {showQuizSetupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111115] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white">Quiz Settings</h3>
              <button
                onClick={() => setShowQuizSetupModal(null)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 bg-[#0E0E11] border border-white/5 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={quizConfig.randomizeQuestions}
                      onChange={(e) => setQuizConfig(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200">Randomize Questions</span>
                    <span className="block text-xs text-slate-500 mt-1">Shuffle the order of questions in this attempt.</span>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-[#0E0E11] border border-white/5 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={quizConfig.randomizeChoices}
                      onChange={(e) => setQuizConfig(prev => ({ ...prev, randomizeChoices: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                    </div>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-200">Randomize Answer Choices</span>
                    <span className="block text-xs text-slate-500 mt-1">Shuffle options (A, B, C, D) for each multiple-choice question.</span>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-[#0E0E11] border border-white/5 rounded-xl">
                <div className="flex flex-col gap-2">
                  <span className="block text-sm font-bold text-slate-200">Time Limit</span>
                  <span className="block text-xs text-slate-500">Automatically submit the quiz when time runs out.</span>
                  <select
                    value={quizConfig.timeLimit}
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value, 10) }))}
                    className="mt-2 bg-[#111115] border border-white/10 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-all outline-none"
                  >
                    <option value={0}>No Time Limit</option>
                    <option value={15 * 60}>15 Minutes</option>
                    <option value={30 * 60}>30 Minutes</option>
                    <option value={60 * 60}>1 Hour</option>
                    <option value={120 * 60}>2 Hours</option>
                    <option value={180 * 60}>3 Hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setShowQuizSetupModal(null)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showQuizSetupModal) {
                    startQuiz(showQuizSetupModal);
                    setShowQuizSetupModal(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Quiz</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Add Question Dialog */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
          >
            <div>
              <h3 className="text-md font-bold text-white">Add New Question</h3>
              <p className="text-xs text-slate-400">Insert a custom question manually into this compilation.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const text = fd.get('text') as string;
                const type = fd.get('type') as QuestionType;
                const correctAnswer = fd.get('correctAnswer') as string;
                const choicesStr = fd.get('choices') as string;
                const explanation = fd.get('explanation') as string;

                handleCreateQuestion({
                  number: `${(selectedQuiz?.questions.length || 0) + 1}`,
                  text,
                  type,
                  correctAnswer,
                  choices: choicesStr ? choicesStr.split('\n').filter(Boolean) : null,
                  explanation
                });
              }}
              className="flex flex-col gap-4 text-xs"
            >
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400">Question Text</label>
                <textarea name="text" required rows={2} className="p-2 border border-white/10 rounded bg-[#0E0E11] text-slate-100 focus:ring-1 focus:ring-indigo-500 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-400">Format</label>
                  <select name="type" defaultValue={QuestionType.MCQ} className="p-1.5 border border-white/10 rounded bg-[#0E0E11] text-slate-200 focus:outline-none text-xs">
                    {Object.values(QuestionType).map(t => (
                      <option key={t} value={t} className="bg-[#111114]">{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-400">Correct Answer</label>
                  <input type="text" name="correctAnswer" required className="p-1.5 border border-white/10 rounded bg-[#0E0E11] text-slate-100 text-xs focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-400">Multiple Choices (For MCQ - One per line)</label>
                <textarea name="choices" placeholder="A. Option 1&#10;B. Option 2" rows={2} className="p-2 border border-white/10 rounded bg-[#0E0E11] text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-400">Explanation</label>
                <input type="text" name="explanation" className="p-1.5 border border-white/10 rounded bg-[#0E0E11] text-slate-100 text-xs focus:outline-none" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 border border-white/10 rounded hover:bg-white/10 text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs shadow-md cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Global Gamification Celebration Toast */}
      <AnimatePresence>
        {celebrationBanner?.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-[#111114] border-2 border-indigo-500/30 p-5 rounded-2xl shadow-2xl flex gap-4 items-start"
          >
            <div className={cn(
              "p-3 rounded-xl border flex-shrink-0 flex items-center justify-center",
              celebrationBanner.badgeIcon === 'perfection' && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
              celebrationBanner.badgeIcon === 'gold' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
              celebrationBanner.badgeIcon === 'silver' && "bg-slate-300/10 text-slate-300 border-slate-300/20",
              celebrationBanner.badgeIcon === 'speed' && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
              celebrationBanner.badgeIcon === 'streak' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
              celebrationBanner.badgeIcon === 'bronze' && "bg-amber-700/10 text-amber-600 border-amber-700/20",
              celebrationBanner.badgeIcon === 'milestone' && "bg-purple-500/10 text-purple-400 border-purple-500/20"
            )}>
              {celebrationBanner.badgeIcon === 'perfection' && <Star className="w-6 h-6 animate-bounce" />}
              {celebrationBanner.badgeIcon === 'gold' && <Trophy className="w-6 h-6 animate-pulse" />}
              {celebrationBanner.badgeIcon === 'silver' && <Award className="w-6 h-6" />}
              {celebrationBanner.badgeIcon === 'speed' && <Zap className="w-6 h-6 animate-pulse" />}
              {celebrationBanner.badgeIcon === 'streak' && <Flame className="w-6 h-6" />}
              {celebrationBanner.badgeIcon === 'bronze' && <Award className="w-6 h-6" />}
              {celebrationBanner.badgeIcon === 'milestone' && <Award className="w-6 h-6" />}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{celebrationBanner.title}</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">{celebrationBanner.message}</p>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Achievement Unlocked</span>
                <button
                  onClick={() => setCelebrationBanner(prev => prev ? { ...prev, show: false } : null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setCelebrationBanner(prev => prev ? { ...prev, show: false } : null)}
              className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Toast Notification */}
      <AnimatePresence>
        {customToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm backdrop-blur-md"
            style={{
              backgroundColor:
                customToast.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : customToast.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
              borderColor:
                customToast.type === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : customToast.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(59, 130, 246, 0.3)',
              color:
                customToast.type === 'success'
                  ? '#34d399'
                  : customToast.type === 'error'
                  ? '#f87171'
                  : '#60a5fa',
            }}
          >
            {customToast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {customToast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {customToast.type === 'info' && <ShieldCheck className="w-5 h-5 flex-shrink-0" />}
            <span className="text-xs font-bold text-white">{customToast.message}</span>
            <button
              onClick={() => setCustomToast(null)}
              className="ml-2 hover:opacity-80 transition-all text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish Errors Modal */}
      {publishErrors && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 flex-shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-md font-bold text-white">Cannot Publish Quiz</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The quiz <strong className="text-white">&ldquo;{publishErrors.quizTitle}&rdquo;</strong> is incomplete. Please correct the following extraction gaps before publishing:
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-slate-300">
              {publishErrors.errors.map((err, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-amber-400/80 font-bold flex-shrink-0">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setPublishErrors(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Let&apos;s Fix It
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Unfinished Quiz Resume Confirmation Modal */}
      {resumeQuizConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex-shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">Resume Incomplete Quiz?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You have an unfinished attempt for <strong className="text-white">&ldquo;{resumeQuizConfirm.quiz.title}&rdquo;</strong> from {new Date(resumeQuizConfirm.attempt.startedAt).toLocaleDateString()}. Would you like to resume your progress or start fresh?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setResumeQuizConfirm(null);
                  setShowQuizSetupModal(resumeQuizConfirm.quiz);
                }}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Start Fresh
              </button>
              <button
                type="button"
                onClick={() => handleResumeQuizAttempt(resumeQuizConfirm.quiz, resumeQuizConfirm.attempt)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Resume Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex-shrink-0">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">Delete Question</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to delete this question? This action will permanently remove it from the quiz, and it cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Delete Question
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex-shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">Reset Quiz History</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to completely clear your local quiz attempt history? All past scores, completed times, and progress stats will be permanently deleted. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Reset History
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Merge Quiz Name Prompt Modal */}
      {mergeQuizPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-md font-bold text-white">Merge All Quizzes</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Combine all currently loaded review questionnaires into a single comprehensive reviewer.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Merged Reviewer Title</label>
              <input
                type="text"
                value={mergeQuizInputTitle}
                onChange={(e) => setMergeQuizInputTitle(e.target.value)}
                placeholder="e.g. Master Board Reviewer"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMergeQuizPrompt(null)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmMergeQuizzes(mergeQuizInputTitle)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Merge Quizzes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Quiz Details Modal */}
      {showEditQuizModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3 border-b border-white/10 pb-4">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex-shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-md font-bold text-white">Edit Quiz Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update metadata, subject, or description for <span className="text-white font-bold">{showEditQuizModal.title}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Quiz Title */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quiz Title *</label>
                <input
                  type="text"
                  value={editQuizTitle}
                  onChange={(e) => setEditQuizTitle(e.target.value)}
                  placeholder="e.g. Electrical Engineering Reviewer"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              {/* Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={editQuizSubject}
                    onChange={(e) => setEditQuizSubject(e.target.value)}
                    placeholder="e.g. Electrical Engineering"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    value={editQuizCategory}
                    onChange={(e) => setEditQuizCategory(e.target.value)}
                    placeholder="e.g. Power Systems"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={editQuizDescription}
                  onChange={(e) => setEditQuizDescription(e.target.value)}
                  placeholder="Provide brief details about this reviewer..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setShowEditQuizModal(null)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuizDetails}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Save Details
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Quiz Confirmation Dialog */}
      {quizToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#111114] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white">Delete Quiz</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to delete <strong className="text-white">&ldquo;{quizToDelete.title}&rdquo;</strong>? All questions, review drafts, and performance stats will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteQuiz}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Delete Quiz
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0B0B0C] border-t border-white/10 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Board Exam Review Pro • Real-Time Client Parsing & Verification Stack</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Stack Encryption Active</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
