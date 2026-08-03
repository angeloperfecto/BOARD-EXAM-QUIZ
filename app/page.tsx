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
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionType, Question, Quiz, QuizAttempt, ExtractionLog } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';

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

// Default high-quality, professional sample reviewer questions
const SAMPLE_QUIZ: Quiz = {
  id: 'sample-civil-engineering',
  title: 'PRC Board Exam Reviewer (Civil Engineering & NSCP)',
  description: 'A sample professional test designed to demonstrate calculations, NSCP code questions, True/False, Fill in the Blank, and Matching type formats.',
  subject: 'Civil & Structural Engineering',
  category: 'Structural Design',
  isPublished: true,
  createdAt: new Date().toISOString(),
  sourceFiles: ['NSCP_Structural_Reviewer.pdf'],
  questions: [
    {
      id: 'q1',
      number: '1',
      type: QuestionType.MCQ,
      text: 'A simply supported reinforced concrete beam spans 6 meters and carries a uniformly distributed service dead load of 15 kN/m and a service live load of 20 kN/m. Applying LRFD design load combinations (1.2D + 1.6L), determine the maximum factored shear force (Vu) at the critical section.',
      choices: [
        'A. Vu = 110 kN',
        'B. Vu = 135 kN',
        'C. Vu = 150 kN',
        'D. Vu = 168 kN'
      ],
      correctAnswer: 'C',
      explanation: 'Factored load wu = 1.2(15) + 1.6(20) = 18 + 32 = 50 kN/m. The maximum shear force Vu at the support of a simply supported beam is wu * L / 2. Therefore, Vu = 50 * 6 / 2 = 150 kN.',
      difficulty: 'hard',
      category: 'Beams & Shear',
      pageNumber: 3
    },
    {
      id: 'q2',
      number: '2',
      type: QuestionType.TRUE_FALSE,
      text: 'According to the National Structural Code of the Philippines (NSCP 2015) Section 420.6.1, the minimum concrete cover for cast-in-place concrete pipes, slabs, or walls permanently exposed to earth or weather is 75 mm.',
      choices: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'NSCP Section 420.6.1.1 states that for concrete cast against and permanently exposed to earth, the minimum concrete cover must be 75 mm to prevent steel rebar corrosion.',
      difficulty: 'medium',
      category: 'NSCP Codes',
      pageNumber: 5
    },
    {
      id: 'q3',
      number: '3',
      type: QuestionType.IDENTIFICATION,
      text: 'Who is known as the prominent Filipino structural engineer and academician who served as the main consultant for the development of early editions of the National Structural Code of the Philippines?',
      correctAnswer: 'Angel Lazaro',
      explanation: 'Dr. Angel Lazaro Jr. was a pioneer in Philippine civil engineering, heavily contributing to structural standards and NSCP regulations.',
      difficulty: 'easy',
      category: 'Engineering History',
      pageNumber: 1
    },
    {
      id: 'q4',
      number: '4',
      type: QuestionType.FILL_IN_BLANK,
      text: 'The structural property of a cross-section that represents its resistance to bending and deflection is known as the Second _____ of Area (also referred to as the Moment of Inertia).',
      correctAnswer: 'Moment',
      explanation: 'The Second Moment of Area (usually denoted by I) is a geometrical property of an area which defines how its points are distributed with regard to an arbitrary axis.',
      difficulty: 'medium',
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
      difficulty: 'hard',
      category: 'Failure Mechanics',
      pageNumber: 14
    }
  ]
};

export default function AIQuizGenerator() {
  // Application states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [activeMode, setActiveMode] = useState<'list' | 'take' | 'edit' | 'extract' | 'history'>('list');
  const [logsExpanded, setLogsExpanded] = useState<boolean>(false);
  const [docsExpanded, setDocsExpanded] = useState<boolean>(false);
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
      return localStorage.getItem('quiz_show_instant_feedback') === 'true';
    }
    return false;
  });
  
  // Randomization Settings
  const [quizConfig, setQuizConfig] = useState({
    randomizeQuestions: false,
    randomizeChoices: false,
  });
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [showQuizSetupModal, setShowQuizSetupModal] = useState<Quiz | null>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

  // Save option to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_show_instant_feedback', String(showInstantFeedback));
    }
  }, [showInstantFeedback]);

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
      const stored = localStorage.getItem('ai_quiz_generator_quizzes');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setQuizzes(parsed);
          if (parsed.length > 0) {
            setSelectedQuiz(parsed[0]);
          }
        } catch (e) {
          console.error('Error loading quizzes:', e);
          setQuizzes([SAMPLE_QUIZ]);
          setSelectedQuiz(SAMPLE_QUIZ);
        }
      } else {
        // Seed with sample quiz
        setQuizzes([SAMPLE_QUIZ]);
        setSelectedQuiz(SAMPLE_QUIZ);
        localStorage.setItem('ai_quiz_generator_quizzes', JSON.stringify([SAMPLE_QUIZ]));
      }
    }
  }, []);

  // Save quizzes to local storage helper
  const saveQuizzesToStorage = (updatedQuizzes: Quiz[]) => {
    setQuizzes(updatedQuizzes);
    localStorage.setItem('ai_quiz_generator_quizzes', JSON.stringify(updatedQuizzes));
  };

  // Load score history attempts from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ai_quiz_generator_attempts');
      if (stored) {
        try {
          setAttempts(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading attempts:', e);
        }
      }
    }
  }, []);

  // Save attempts helper
  const saveAttemptsToStorage = (updatedAttempts: QuizAttempt[]) => {
    setAttempts(updatedAttempts);
    localStorage.setItem('ai_quiz_generator_attempts', JSON.stringify(updatedAttempts));
  };

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
        alert(`Unsupported file format: ${file.name}. Please upload .pdf or .docx files only.`);
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

  // Browser-side PDF extractor using dynamic PDF.js
  const parsePdfFile = async (file: File, logId: string) => {
    const pdfjsLib = await loadPDFJS();
    if (!pdfjsLib) throw new Error('PDF.js library could not be loaded dynamically.');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    
    setExtractionLogs(prev => prev.map(l => l.id === logId ? { ...l, totalPages: numPages, processedPages: 0 } : l));

    let extractedText = '';
    const extractedImages: string[] = [];

    for (let p = 1; p <= numPages; p++) {
      setParsingStatus(`Extracting page ${p} / ${numPages} from PDF...`);
      setUploadProgress(Math.floor((p / numPages) * 90));

      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      // Add simple page marker so Gemini can associate page numbers
      extractedText += `\n[PAGE_NUMBER_MARKER_${p}]\n${pageText}\n`;

      // Check if page has images or diagrams (empty text means scanned)
      if (pageText.trim().length < 30) {
        // Scanned page - render page to canvas so Gemini can perform high-fidelity visual OCR!
        setParsingStatus(`Performing OCR check on page ${p}...`);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context!, viewport }).promise;
        const pageImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        // Save page as image reference
        extractedImages.push(pageImageBase64);
        extractedText += `\n[IMAGE_REF_${extractedImages.length - 1}] (Scanned page ${p} diagram/formulas representation)\n`;
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

    const res = await fetch('/api/parse-docx', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Server parsing failed');
    }

    const data = await res.json();
    
    // Process Mammoth HTML to extract embedded base64 images
    let rawHtml = data.html;
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

  // AI Quiz Generator Caller
  const generateQuizFromFiles = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one PDF or Word document first.');
      return;
    }

    setIsGenerating(true);
    setParsingStatus('Instructing Gemini to scan document & extract 100% of questions...');

    try {
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

      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: combinedText,
          images: allImages,
          fileName: allFileNames.join(', '),
          subject: subjectInput,
          difficulty: difficultyInput === 'auto' ? null : difficultyInput,
          customInstructions: customInstructions,
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'AI generation failed');
      }

      const data = await res.json();
      if (!data.success || !data.quiz) {
        throw new Error('Invalid quiz response from AI');
      }

      // Map base64 image placeholders back to their full data using the flat global array
      const processedQuestions = data.quiz.questions.map((q: Question, idx: number) => {
        let questionImage = null;

        // Extract original image reference if any (e.g. [IMAGE_REF_0])
        const imgRefMatch = q.text.match(/\[IMAGE_REF_(\d+)\]/);
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

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: data.quiz.quizTitle || `Quiz from ${allFileNames[0]}`,
        description: data.quiz.quizDescription || 'Automatically generated quiz from uploaded study materials.',
        subject: data.quiz.subject || subjectInput || 'General Study',
        category: data.quiz.category || 'Extracted Exam',
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
      
      alert(`Success! Successfully extracted ${processedQuestions.length} questions. Let's review them now!`);
      setActiveMode('edit'); // Jump directly to Question Manager to review and edit
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      alert(`Generation failed: ${err.message || err}. Please try again or provide smaller text portions.`);
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
  const startQuiz = (quiz: Quiz, configOverride?: typeof quizConfig) => {
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
      activeQuestions: currentQuestions
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
      localStorage.setItem(`quiz_attempt_${quizAttempt.quizId}`, JSON.stringify(savedAttempt));
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
    localStorage.removeItem(`quiz_attempt_${selectedQuiz.id}`); // Clear temporary state

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
    const saved = localStorage.getItem(`quiz_attempt_${quiz.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'in_progress') {
          if (confirm('You have an unfinished attempt for this quiz. Would you like to resume?')) {
            setSelectedQuiz(quiz);
            setUserAnswers(parsed.answers);
            
            // Re-populate checked questions for the resumed quiz
            const initialChecked: Record<string, boolean> = {};
            if (parsed.answers) {
              Object.keys(parsed.answers).forEach(qid => {
                initialChecked[qid] = true;
              });
            }
            setCheckedQuestions(initialChecked);

            if (parsed.activeQuestions && parsed.activeQuestions.length > 0) {
              setActiveQuestions(parsed.activeQuestions);
            } else {
              setActiveQuestions(quiz.questions);
            }

            setQuizAttempt(parsed);
            setShowResults(false);
            setActiveMode('take');
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    setShowQuizSetupModal(quiz);
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
    if (!selectedQuiz) return;
    if (!confirm('Are you sure you want to delete this question?')) return;

    const updatedQuestions = selectedQuiz.questions.filter(q => q.id !== questionId);
    const updatedQuiz = { ...selectedQuiz, questions: updatedQuestions };

    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
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
      alert('Quiz unpublished successfully! It is now a draft review.');
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
      } else if (q.type !== QuestionType.ESSAY) {
        if (!q.correctAnswer || (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())) {
          errors.push(`Q${idx + 1} has no correct answer configured`);
        }
      }
    });

    if (errors.length > 0) {
      alert(`Cannot publish. Correct the following extraction or configuration gaps:\n- ${errors.slice(0, 5).join('\n- ')}${errors.length > 5 ? '\n...and more' : ''}`);
      return;
    }

    const updatedQuizzes = quizzes.map(q => q.id === quizId ? { ...q, isPublished: true } : q);
    saveQuizzesToStorage(updatedQuizzes);
    setSelectedQuiz(prev => prev && prev.id === quizId ? { ...prev, isPublished: true } : prev);
    alert('Quiz published successfully! It is now fully active for users.');
  };

  // Merge multiple quizzes into a single reviewer
  const mergeQuizzes = () => {
    if (quizzes.length < 2) {
      alert('You need at least two quizzes to merge.');
      return;
    }

    const title = prompt('Enter a title for the merged Exam Reviewer:');
    if (!title) return;

    const mergedQuestions: Question[] = [];
    const sourceFiles: string[] = [];
    const subjects: string[] = [];

    quizzes.forEach(q => {
      q.questions.forEach((question, idx) => {
        mergedQuestions.push({
          ...question,
          id: `merged-q-${Date.now()}-${idx}`,
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
      title,
      description: `Merged compilation exam from: ${quizzes.map(q => q.title).join(', ')}`,
      questions: mergedQuestions,
      createdAt: new Date().toISOString(),
      sourceFiles,
      subject: subjects.length > 0 ? subjects[0] : 'Merged General',
      category: 'Master Reviewer',
      isPublished: false
    };

    saveQuizzesToStorage([mergedQuiz, ...quizzes]);
    setSelectedQuiz(mergedQuiz);
    alert(`Successfully merged all quizzes! Created "${title}" with ${mergedQuestions.length} total questions.`);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0A0A0B] text-slate-300 flex flex-col font-sans selection:bg-indigo-900/40 antialiased">
      {/* Visual Identity Header */}
      <header id="app-header" className="bg-[#0D0D10]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>AI Quiz Generator</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 text-[10px] font-black tracking-widest uppercase rounded border border-indigo-500/20">PRO</span>
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

            <button
              onClick={() => setActiveMode('extract')}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
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
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold tracking-wide transition-all",
              activeMode === 'list' && !selectedQuiz
                ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Library ({quizzes.length})</span>
          </button>

          <button
            onClick={() => setActiveMode('extract')}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold tracking-wide transition-all",
              activeMode === 'extract'
                ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Src</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('history');
              setSelectedQuiz(null);
              setSelectedAttemptId(null);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-bold tracking-wide transition-all",
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
          
          {/* Navigation Sidebar & Upload Workspace (4 cols) - Pushed to bottom on mobile, side-sticky on desktop */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-last lg:order-first">
            
            {/* Quick Stats Panel / Action Cards (Visible only on desktop as mobile has top tabs) */}
            <div className="hidden lg:block bg-[#111115] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-extrabold mb-4">Operations Center</h3>
              
              <div className="flex flex-col gap-2">
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

                <button
                  onClick={mergeQuizzes}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 hover:text-white transition-all text-left cursor-pointer border border-transparent hover:border-indigo-500/20"
                >
                  <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Merge All Quizzes</span>
                </button>
              </div>
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

          {/* Core Interactive Board / Playground (8 cols) - Appears first on mobile */}
          <div className="lg:col-span-8 order-first lg:order-last">
            
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

                  <button
                    onClick={() => setActiveMode('extract')}
                    className="relative z-10 flex-shrink-0 flex items-center gap-2 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgb(99,102,241,0.25)] active:scale-[0.98] w-full md:w-auto justify-center cursor-pointer min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload & Generate Exam</span>
                  </button>
                </div>

                {/* Search / Filter / Sort Bar */}
                <div className="bg-[#111115] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center gap-4 justify-between">
                  {/* Search box with Icon prefix */}
                  <div className="relative flex-grow max-w-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search quizzes, subjects..."
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

                {/* Quizzes List */}
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

                            <div className="text-right flex-shrink-0">
                              <span className="text-lg font-black text-indigo-400 block">{quiz.questions.length}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Questions</span>
                            </div>
                          </div>

                          {/* Dynamic Quiz Attempts and Score Panel */}
                          {quizAttempts.length > 0 ? (
                            <div className="flex flex-col gap-3.5 bg-white/5 border border-white/5 rounded-xl p-4">
                              <div className="flex items-center gap-4 flex-wrap">
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
                                
                                <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

                                <div className="flex items-center gap-2">
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

                                <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                  <div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold leading-none">Attempts</span>
                                    <span className="text-xs font-black text-white mt-0.5 block">{quizAttempts.length} Completed</span>
                                  </div>
                                </div>
                              </div>

                              {highestScoreAttempt && (
                                <div className="space-y-1.5 border-t border-white/5 pt-3">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span>Review Mastery Progress</span>
                                    <span className="text-amber-400 font-extrabold">{highestScoreAttempt ? Math.round((highestScoreAttempt.score / highestScoreAttempt.totalQuestions) * 100) : 0}% Peak Accuracy</span>
                                  </div>
                                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" 
                                      style={{ width: `${highestScoreAttempt ? Math.round((highestScoreAttempt.score / highestScoreAttempt.totalQuestions) * 100) : 0}%` }}
                                    />
                                  </div>
                                </div>
                              )}
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

                              {/* Question Manager / Admin Panel Access */}
                              <button
                                onClick={() => {
                                  setSelectedQuiz(quiz);
                                  setActiveMode('edit');
                                }}
                                className="px-3 py-1.5 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                                <span>Manage Quiz ({quiz.questions.length})</span>
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

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">Progress:</span>
                    <span className="text-sm font-extrabold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      {Object.keys(userAnswers).length} / {activeQuestions.length} answered
                    </span>
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
                      <div className="max-w-xs mx-auto w-full p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <span className="text-sm text-indigo-300 font-bold block">YOUR SCORE</span>
                        <h4 className="text-3xl font-black text-white mt-1">
                          {quizAttempt.score} <span className="text-base text-indigo-400 font-medium">/ {quizAttempt.totalQuestions}</span>
                        </h4>
                        <span className="text-[10px] text-indigo-400 font-bold block mt-1 uppercase">
                          {Math.round((quizAttempt.score / quizAttempt.totalQuestions) * 100)}% Pass Accuracy
                        </span>
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

                              {q.explanation && (
                                <div className="mt-4 text-sm md:text-base text-slate-100 bg-indigo-950/35 border border-indigo-500/30 p-5 rounded-2xl font-normal leading-relaxed shadow-sm">
                                  <div className="flex items-center gap-2 text-indigo-300 font-extrabold mb-2 uppercase tracking-wider text-xs">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <span>Explanation & Context</span>
                                  </div>
                                  <div className="text-slate-200 font-medium whitespace-pre-line">
                                    <MathRenderer text={q.explanation} />
                                  </div>
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
 
                               {/* Explanation & Rationale for Instant Review */}
                               {(() => {
                                 const isChecked = showInstantFeedback && checkedQuestions[q.id];
                                 if (isChecked && q.explanation) {
                                   return (
                                     <motion.div
                                       initial={{ opacity: 0, y: 5 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="mt-6 p-6 md:p-8 rounded-2xl bg-indigo-950/35 border-2 border-indigo-500/25 text-sm md:text-base text-slate-100 leading-relaxed shadow-lg"
                                     >
                                       <div className="flex items-center gap-2.5 text-indigo-300 font-extrabold mb-3 uppercase tracking-wider text-xs md:text-sm">
                                         <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                         <span>Explanation & Context</span>
                                       </div>
                                       <div className="mt-2 text-xs md:text-sm lg:text-base leading-relaxed text-slate-200 font-medium whitespace-pre-line"><MathRenderer text={q.explanation} /></div>
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
                    <h2 className="text-base font-bold text-white mt-1">{selectedQuiz.title}</h2>
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
                          <div className="text-xs text-slate-400 border-t border-white/5 pt-3 flex flex-col gap-1 bg-[#0E0E11] p-2.5 rounded-xl mt-1">
                            <div className="flex items-center justify-between">
                              <p>Correct answer: <strong className="text-indigo-400">{String(q.correctAnswer || 'N/A')}</strong></p>
                              {q.difficulty && <p className="uppercase font-bold text-[10px] text-slate-500">Difficulty: {q.difficulty}</p>}
                            </div>
                            {q.choices && q.choices.length > 0 && (
                              <p className="line-clamp-1 mt-1">Choices: {q.choices.join(' | ')}</p>
                            )}
                            {q.explanation && (
                              <p className="mt-1 text-[11px] text-slate-500 italic truncate">Explanation: {q.explanation}</p>
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

                                  {/* Explanation banner */}
                                  {q.explanation && (
                                    <div className="mt-2 text-xs md:text-sm text-slate-200 bg-indigo-950/35 border border-indigo-500/25 p-4 rounded-xl font-medium leading-relaxed">
                                      <div className="flex items-center gap-2.5 text-indigo-300 font-extrabold mb-1.5 uppercase tracking-wider text-[10px]">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Explanation & Context</span>
                                      </div>
                                      <div className="text-slate-300 whitespace-pre-line">
                                        <MathRenderer text={q.explanation} />
                                      </div>
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
                            onClick={() => {
                              if (confirm("Are you sure you want to completely clear your local quiz history? This cannot be undone.")) {
                                saveAttemptsToStorage([]);
                                setSelectedAttemptId(null);
                              }
                            }}
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
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Quiz Generator • Real-Time Client Parsing & Verification Stack</p>
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
