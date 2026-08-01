'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionType, Question, Quiz, QuizAttempt, ExtractionLog } from '@/lib/types';
import { MathRenderer } from '@/components/MathRenderer';

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
  const [activeMode, setActiveMode] = useState<'list' | 'take' | 'edit' | 'extract'>('list');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Instant Feedback Mode states
  const [showInstantFeedback, setShowInstantFeedback] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quiz_show_instant_feedback') === 'true';
    }
    return false;
  });
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
      const cleanUser = String(userAns || '').trim().toUpperCase();
      const cleanCorrect = String(correctAns).trim().toUpperCase();
      return cleanUser === cleanCorrect || cleanUser.startsWith(cleanCorrect) || cleanCorrect.startsWith(cleanUser);
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

  const isChoiceCorrect = (q: Question, choice: string): boolean => {
    const correctAns = q.correctAnswer;
    if (!correctAns) return false;
    const optionChar = choice.trim().charAt(0).toUpperCase();
    const cleanCorrect = String(correctAns).trim().toUpperCase();
    return optionChar === cleanCorrect || choice === correctAns || cleanCorrect.startsWith(optionChar);
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

  // Check PDF.js capability on mount
  useEffect(() => {
    loadPDFJS().then(() => {
      console.log('PDF.js ready client-side');
    }).catch(err => {
      console.error('Failed to load PDF.js:', err);
    });
  }, []);

  // Filtered Quiz list
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (q.subject && q.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = filterSubject === 'All' || q.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

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

  // Start Quiz runner
  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setUserAnswers({});
    setCheckedQuestions({});
    setActiveQuestionIndex(0);
    setQuizAttempt({
      id: `attempt-${Date.now()}`,
      quizId: quiz.id,
      answers: {},
      score: 0,
      totalQuestions: quiz.questions.length,
      status: 'in_progress',
      startedAt: new Date().toISOString()
    });
    setShowResults(false);
    setActiveMode('take');
  };

  // Question navigation and answering
  const handleAnswerSelect = (questionId: string, answer: any) => {
    if (showInstantFeedback) {
      // If already checked, lock inputs so they can't change their answer
      if (checkedQuestions[questionId]) return;

      const q = selectedQuiz?.questions.find(quest => quest.id === questionId);
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
    selectedQuiz.questions.forEach(q => {
      const userAns = userAnswers[q.id];
      const correctAns = q.correctAnswer;

      if (!correctAns) return;

      if (q.type === QuestionType.MCQ) {
        // Strip out 'A. ', 'B. ' letters if correct answer is a single character
        const cleanUser = String(userAns || '').trim().toUpperCase();
        const cleanCorrect = String(correctAns).trim().toUpperCase();
        
        // Exact match or option letter matching (e.g. User selected "A. Option" and Correct answer is "A")
        if (cleanUser === cleanCorrect || cleanUser.startsWith(cleanCorrect) || cleanCorrect.startsWith(cleanUser)) {
          score++;
        }
      } else if (q.type === QuestionType.TRUE_FALSE) {
        if (String(userAns).toLowerCase() === String(correctAns).toLowerCase()) {
          score++;
        }
      } else if (q.type === QuestionType.IDENTIFICATION || q.type === QuestionType.FILL_IN_BLANK) {
        if (String(userAns || '').trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
          score++;
        }
      } else if (q.type === QuestionType.MATCHING) {
        // All matching pairs must match exactly
        const pairs = q.matchingPairs || [];
        const userPairs = userAns as Record<string, string> || {};
        let allCorrect = true;
        pairs.forEach(p => {
          if (userPairs[p.left] !== p.right) {
            allCorrect = false;
          }
        });
        if (allCorrect && pairs.length > 0) score++;
      }
    });

    const finishedAttempt: QuizAttempt = {
      ...quizAttempt,
      answers: userAnswers,
      score,
      status: 'completed',
      completedAt: new Date().toISOString()
    };

    setQuizAttempt(finishedAttempt);
    setShowResults(true);
    localStorage.removeItem(`quiz_attempt_${selectedQuiz.id}`); // Clear temporary state
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
    startQuiz(quiz);
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
      <header id="app-header" className="bg-[#111114] border-b border-white/10 sticky top-0 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">AI Quiz Generator <span className="text-indigo-400 italic font-medium text-sm ml-1">AI</span></h1>
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

        {/* Dashboard Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar & Upload Workspace (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Quick Stats Panel / Action Cards */}
            <div className="bg-[#0E0E11] border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Operations Center</h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setActiveMode('list');
                    setSelectedQuiz(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left",
                    activeMode === 'list' && !selectedQuiz
                      ? "bg-white/5 text-white border-l-4 border-indigo-500"
                      : "text-slate-400 hover:bg-white/5"
                  )}
                >
                  <FolderOpen className="w-4 h-4 text-slate-500" />
                  <span className="flex-grow">Quiz Library</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/20">{quizzes.length}</span>
                </button>

                <button
                  onClick={mergeQuizzes}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-400 hover:bg-white/5 transition-all text-left"
                >
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Merge All Quizzes</span>
                </button>
              </div>
            </div>

            {/* Document Library (If extracted previously) */}
            <div className="bg-[#0E0E11] border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Ingested Documents</h3>
              
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-white/10 rounded-xl bg-white/5">
                  <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>No active source files loaded yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="p-3 border border-white/5 rounded-xl flex items-center gap-3 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all">
                      <FileCode className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • {file.pageCount} page(s)</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Parsing Log Tracker */}
            {extractionLogs.length > 0 && (
              <div className="bg-[#0E0E11] border border-white/10 rounded-2xl p-5 shadow-lg">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Extraction Logs</h3>
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                  {extractionLogs.map(log => (
                    <div key={log.id} className="p-3 border border-white/5 rounded-xl bg-white/5 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate max-w-[150px]">{log.fileName}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
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
            )}
          </div>

          {/* Core Interactive Board / Playground (8 cols) */}
          <div className="lg:col-span-8">
            
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
                
                {/* Search / Filter Section */}
                <div className="bg-[#111114] border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="w-full sm:w-auto flex-grow max-w-md">
                    <input
                      type="text"
                      placeholder="Search quizzes, subjects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#0E0E11] text-slate-100 text-sm placeholder-slate-500"
                    />
                  </div>

                  <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
                    <span className="text-xs font-bold text-slate-500 uppercase">Subject:</span>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="p-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#111114] text-xs font-semibold text-slate-200"
                    >
                      <option value="All" className="bg-[#111114]">All Subjects</option>
                      {allSubjects.map(sub => (
                        <option key={sub} value={sub} className="bg-[#111114]">{sub}</option>
                      ))}
                    </select>
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
                    filteredQuizzes.map(quiz => (
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
                    ))
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
                      {Object.keys(userAnswers).length} / {selectedQuiz.questions.length} answered
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
                        {selectedQuiz.questions.map((q, idx) => {
                          const userAns = userAnswers[q.id];
                          const isCorrect = q.type === QuestionType.MCQ
                            ? String(userAns || '').trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase() ||
                              String(userAns || '').startsWith(String(q.correctAnswer))
                            : String(userAns || '').toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim();

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
                                <div className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl font-medium leading-relaxed">
                                  <strong className="text-indigo-200">Explanation:</strong> <MathRenderer text={q.explanation} />
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
                      {/* Grid Progress Indicators */}
                      <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-white/10">
                        {selectedQuiz.questions.map((q, idx) => {
                          const isCurrent = activeQuestionIndex === idx;
                          const isChecked = showInstantFeedback && checkedQuestions[q.id];
                          const isRight = isChecked && checkSingleAnswerCorrectness(q, userAnswers[q.id]);
                          const hasAnswer = userAnswers[q.id] !== undefined;

                          return (
                            <button
                              key={q.id}
                              onClick={() => setActiveQuestionIndex(idx)}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border cursor-pointer",
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
                        const q = selectedQuiz.questions[activeQuestionIndex];
                        if (!q) return null;

                        return (
                          <div className="flex flex-col gap-5">
                            {/* Meta row */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                              <span>Question {activeQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
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
                                       className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-200 leading-relaxed"
                                     >
                                       <div className="flex items-center gap-2 text-indigo-300 font-bold mb-1 uppercase tracking-wide">
                                         <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                         <span>Explanation & Context</span>
                                       </div>
                                       <div className="mt-1 text-[11px] leading-relaxed text-slate-300"><MathRenderer text={q.explanation} /></div>
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
                                disabled={activeQuestionIndex === selectedQuiz.questions.length - 1}
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
          </div>
        </div>
      </main>

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
