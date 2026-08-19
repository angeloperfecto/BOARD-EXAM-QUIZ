'use client';

import Link from 'next/link';
import { RotateCcw, Home, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-6 border border-indigo-500/30">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8">
          The exam or page you are looking for does not exist or has been relocated.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Quiz Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
