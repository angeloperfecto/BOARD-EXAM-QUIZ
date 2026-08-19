'use client';

import React, { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Layout, 
  Cpu, 
  Compass, 
  Zap, 
  ChevronRight,
  Lightbulb,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ExplanationVisualizerProps {
  solution?: WhiteboardSolution;
  standardExplanation?: string;
  questionText?: string;
  correctAnswerText?: string;
  className?: string;
}

export const ExplanationVisualizer: React.FC<ExplanationVisualizerProps> = ({
  solution,
  standardExplanation,
  questionText,
  correctAnswerText,
  className = ''
}) => {
  const [boardStyle, setBoardStyle] = useState<'whiteboard' | 'chalkboard' | 'technical'>('whiteboard');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'diagram' | 'steps' | 'mnemonics'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textParts: string[] = [];
    if (questionText) textParts.push(`Question: ${questionText}`);
    if (correctAnswerText) textParts.push(`Correct Answer: ${correctAnswerText}`);
    
    if (solution) {
      if (solution.given && solution.given.length > 0) {
        textParts.push(`Given values: ${solution.given.join(', ')}.`);
      }
      if (solution.find) {
        textParts.push(`Required to find: ${solution.find}.`);
      }
      solution.steps.forEach((step, idx) => {
        textParts.push(`Step ${idx + 1}: ${step.title}. ${step.description}`);
      });
      if (solution.finalAnswerSummary) {
        textParts.push(`Conclusion: ${solution.finalAnswerSummary}`);
      }
    } else if (standardExplanation) {
      textParts.push(`Explanation: ${standardExplanation}`);
    }

    const utterance = new SpeechSynthesisUtterance(textParts.join(' '));
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const parsedSolution: WhiteboardSolution = solution || {
    steps: [
      {
        title: 'Detailed Reasoning',
        description: standardExplanation || 'No detailed explanation provided for this question.',
      }
    ]
  };

  // Styles per board mode
  const boardBg = 
    boardStyle === 'chalkboard' 
      ? 'bg-slate-900 text-slate-100 border-slate-700' 
      : boardStyle === 'technical'
      ? 'bg-sky-950/20 text-sky-950 dark:text-sky-100 border-sky-200 dark:border-sky-800'
      : 'bg-amber-50/40 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border-amber-200 dark:border-slate-800';

  return (
    <div 
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm',
        boardBg,
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto shadow-2xl p-6 bg-white dark:bg-slate-900' : 'p-4 sm:p-5',
        className
      )}
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Interactive Whiteboard Solution</span>
          </div>
          {solution?.diagram && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
              <Cpu className="w-3 h-3" />
              Diagram Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Board style selector */}
          <div className="inline-flex rounded-lg p-0.5 bg-black/5 dark:bg-white/5 text-xs">
            <button
              onClick={() => setBoardStyle('whiteboard')}
              className={cn(
                'px-2 py-1 rounded-md transition-colors text-xs font-medium',
                boardStyle === 'whiteboard' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Whiteboard
            </button>
            <button
              onClick={() => setBoardStyle('chalkboard')}
              className={cn(
                'px-2 py-1 rounded-md transition-colors text-xs font-medium',
                boardStyle === 'chalkboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Darkboard
            </button>
            <button
              onClick={() => setBoardStyle('technical')}
              className={cn(
                'px-2 py-1 rounded-md transition-colors text-xs font-medium',
                boardStyle === 'technical' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Blueprint
            </button>
          </div>

          {/* Read Aloud */}
          <button
            onClick={toggleSpeech}
            title={isSpeaking ? 'Stop Audio' : 'Audio Explanation'}
            className={cn(
              'p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors',
              isSpeaking 
                ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300' 
                : 'bg-white/80 dark:bg-slate-800/80 border-black/10 dark:border-white/10 hover:bg-black/5'
            )}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Voice'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border bg-white/80 dark:bg-slate-800/80 border-black/10 dark:border-white/10 text-xs hover:bg-black/5"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Whiteboard'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Given & Required / Formulas header strip */}
      {(parsedSolution.given?.length || parsedSolution.find || parsedSolution.principles?.length) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-black/5 dark:border-white/5 backdrop-blur-xs">
          {/* Given */}
          {parsedSolution.given && parsedSolution.given.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-500" /> Given Parameters
              </span>
              <ul className="text-xs space-y-0.5">
                {parsedSolution.given.map((g, idx) => (
                  <li key={idx} className="font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-indigo-900 dark:text-indigo-200">
                    <MathRenderer content={g} inline />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required */}
          {parsedSolution.find && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-500" /> Required Output
              </span>
              <div className="text-xs font-mono font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                <MathRenderer content={parsedSolution.find} inline />
              </div>
            </div>
          )}

          {/* Governing Principles */}
          {parsedSolution.principles && parsedSolution.principles.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Governing Laws & Principles
              </span>
              <div className="text-xs space-y-1">
                {parsedSolution.principles.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-1 text-slate-700 dark:text-slate-300">
                    <span className="text-amber-500">•</span>
                    <span><MathRenderer content={p} inline /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Main Grid: Diagram + Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Diagram Column (if available) */}
        {parsedSolution.diagram && (
          <div className={cn(
            'lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border bg-white/70 dark:bg-slate-800/70 border-black/10 dark:border-white/10',
            boardStyle === 'chalkboard' ? 'border-slate-700 bg-slate-800/50' : ''
          )}>
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-blue-500" />
                {parsedSolution.diagram.title || 'Schematic Diagram'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 uppercase font-mono">
                {parsedSolution.diagram.type}
              </span>
            </div>

            {/* SVG Renderers according to diagram type */}
            <div className="w-full aspect-4/3 max-h-64 flex items-center justify-center">
              {renderSvgDiagram(parsedSolution.diagram, boardStyle)}
            </div>

            {parsedSolution.diagram.notes && (
              <p className="mt-3 text-xs text-center text-slate-500 dark:text-slate-400 italic">
                {parsedSolution.diagram.notes}
              </p>
            )}
          </div>
        )}

        {/* Steps Column */}
        <div className={cn(
          parsedSolution.diagram ? 'lg:col-span-7' : 'lg:col-span-12',
          'space-y-3.5'
        )}>
          {parsedSolution.steps.map((step, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 border-black/5 dark:border-white/5 transition-all hover:border-indigo-400/40"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {step.title}
                </h4>
              </div>

              {step.latexFormula && (
                <div className="my-2 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-950 dark:text-indigo-200 overflow-x-auto text-center font-mono">
                  <MathRenderer content={`$$${step.latexFormula}$$`} />
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <MathRenderer content={step.description} />
              </p>

              {step.subSteps && step.subSteps.length > 0 && (
                <ul className="mt-2 space-y-1 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                  {step.subSteps.map((sub, sIdx) => (
                    <li key={sIdx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                      <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span><MathRenderer content={sub} inline /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Final Answer Banner */}
          {(parsedSolution.finalAnswerLatex || parsedSolution.finalAnswerSummary) && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                  Final Evaluated Result
                </span>
                {parsedSolution.finalAnswerLatex && (
                  <div className="text-base sm:text-lg font-bold font-mono my-1">
                    <MathRenderer content={`$$${parsedSolution.finalAnswerLatex}$$`} />
                  </div>
                )}
                {parsedSolution.finalAnswerSummary && (
                  <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                    <MathRenderer content={parsedSolution.finalAnswerSummary} />
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tips / Mnemonics */}
          {(parsedSolution.tipsAndTricks?.length || parsedSolution.mnemonic) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>PRC Board Memory Aid & Exam Tips</span>
              </div>
              {parsedSolution.mnemonic && (
                <p className="text-xs font-mono font-medium bg-amber-200/40 dark:bg-amber-900/40 px-2 py-1 rounded">
                  <span className="font-bold">Mnemonic:</span> {parsedSolution.mnemonic}
                </p>
              )}
              {parsedSolution.tipsAndTricks && (
                <ul className="text-xs space-y-0.5 list-disc pl-4 text-amber-800 dark:text-amber-300">
                  {parsedSolution.tipsAndTricks.map((tip, tIdx) => (
                    <li key={tIdx}><MathRenderer content={tip} inline /></li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper SVG diagram generator
function renderSvgDiagram(diagram: VisualDiagramData, style: 'whiteboard' | 'chalkboard' | 'technical') {
  const isDark = style === 'chalkboard';
  const strokeColor = isDark ? '#38bdf8' : '#2563eb';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const accentColor = '#f59e0b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  switch (diagram.type) {
    case 'power_triangle':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full max-w-[240px]">
          {/* Grid lines */}
          <line x1="30" y1="140" x2="210" y2="140" stroke={gridColor} strokeDasharray="3,3" />
          <line x1="210" y1="140" x2="210" y2="30" stroke={gridColor} strokeDasharray="3,3" />

          {/* Right Triangle */}
          <polygon 
            points="30,140 210,140 210,30" 
            fill={isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)'} 
            stroke={strokeColor} 
            strokeWidth="2.5" 
          />

          {/* Angle arc */}
          <path d="M 65 140 A 35 35 0 0 0 58 122" fill="none" stroke={accentColor} strokeWidth="2" />
          <text x="70" y="132" fill={accentColor} fontSize="12" fontWeight="bold">θ</text>

          {/* Labels */}
          {/* Real Power (P) */}
          <text x="120" y="158" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="middle">
            P (Real Power, kW)
          </text>
          {diagram.labels?.P && (
            <text x="120" y="172" fill={strokeColor} fontSize="10" textAnchor="middle">
              {diagram.labels.P}
            </text>
          )}

          {/* Reactive Power (Q) */}
          <text x="218" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="start">
            Q (kVAR)
          </text>
          {diagram.labels?.Q && (
            <text x="218" y="98" fill={strokeColor} fontSize="10" textAnchor="start">
              {diagram.labels.Q}
            </text>
          )}

          {/* Apparent Power (S) */}
          <text x="105" y="75" fill={accentColor} fontSize="12" fontWeight="bold" textAnchor="middle">
            S (kVA)
          </text>
          {diagram.labels?.S && (
            <text x="105" y="88" fill={textColor} fontSize="10" textAnchor="middle">
              {diagram.labels.S}
            </text>
          )}
        </svg>
      );

    case 'circuit':
      return (
        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[240px]">
          {/* Circuit Loop */}
          <rect x="40" y="30" width="160" height="100" fill="none" stroke={strokeColor} strokeWidth="2.5" rx="4" />
          
          {/* Voltage Source (Left) */}
          <circle cx="40" cy="80" r="14" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="2" />
          <text x="40" y="76" fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
          <text x="40" y="90" fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle">-</text>
          <text x="18" y="83" fill={accentColor} fontSize="11" fontWeight="bold" textAnchor="end">
            {diagram.labels?.V || 'V (Source)'}
          </text>

          {/* Resistor (Top) */}
          <rect x="100" y="24" width="40" height="12" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="2" />
          <text x="120" y="18" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="middle">
            {diagram.labels?.R || 'R (Load)'}
          </text>

          {/* Current Flow Arrow */}
          <path d="M 60 20 L 80 20" fill="none" stroke={accentColor} strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="70" y="14" fill={accentColor} fontSize="10" fontWeight="bold" textAnchor="middle">I →</text>
        </svg>
      );

    case 'transformer':
      return (
        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[240px]">
          {/* Core */}
          <rect x="105" y="30" width="30" height="100" fill="none" stroke={gridColor} strokeWidth="4" />
          
          {/* Primary Coil */}
          <path d="M 70 40 Q 95 50 70 60 Q 95 70 70 80 Q 95 90 70 100 Q 95 110 70 120" fill="none" stroke={strokeColor} strokeWidth="3" />
          <text x="50" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="end">
            {diagram.labels?.Np || 'N₁ (Primary)'}
          </text>

          {/* Secondary Coil */}
          <path d="M 170 40 Q 145 50 170 60 Q 145 70 170 80 Q 145 90 170 100 Q 145 110 170 120" fill="none" stroke={accentColor} strokeWidth="3" />
          <text x="190" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="start">
            {diagram.labels?.Ns || 'N₂ (Secondary)'}
          </text>
        </svg>
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <Layers className="w-10 h-10 mb-2 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Technical Breakdown Diagram</span>
          <span className="text-[11px] text-slate-400">Step-by-step mathematical visual model</span>
        </div>
      );
  }
}
